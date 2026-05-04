import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res) => {
  try {
    const { month, year } = req.query;
    let dateFilter = {};

    if (month && year) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const start = new Date(yearNum, monthNum - 1, 1);
      const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      dateFilter = {
        gte: start,
        lte: end
      };
    }

    // 1. Sales stats
    const salesStatsRaw = await prisma.salesOrder.groupBy({
      by: ['status'],
      where: dateFilter.gte ? { date: dateFilter } : {},
      _count: { id: true },
      _sum: { totalAmount: true }
    });
    
    // 2. Manufacturing stats
    const manufacturingStatsRaw = await prisma.manufacturingOrder.groupBy({
      by: ['status'],
      where: dateFilter.gte ? { createdAt: dateFilter } : {},
      _count: { id: true }
    });

    // 3. Financial stats
    const financialStatsRaw = await prisma.financialTransaction.groupBy({
      by: ['type', 'status'],
      where: dateFilter.gte ? { dueDate: dateFilter } : {},
      _sum: { amount: true }
    });
    
    // 4. Totals (Customers/Products) - Always Global
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();
    
    // Format response
    const stats = {
      sales: {
        OPEN: { count: 0, total: 0 },
        CLOSED: { count: 0, total: 0 },
        EXPEDICAO: { count: 0, total: 0 },
        FINALIZADO: { count: 0, total: 0 },
        CANCELLED: { count: 0, total: 0 }
      },
      manufacturing: {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0
      },
      finance: {
        income_paid: 0,
        income_pending: 0,
        expense_paid: 0,
        expense_pending: 0
      },
      totals: {
        customers: customerCount,
        products: productCount
      }
    };
    
    salesStatsRaw.forEach(item => {
      if (stats.sales[item.status]) {
        stats.sales[item.status].count = item._count.id;
        stats.sales[item.status].total = Number(item._sum.totalAmount || 0);
      }
    });
    
    manufacturingStatsRaw.forEach(item => {
      if (stats.manufacturing[item.status] !== undefined) {
        stats.manufacturing[item.status] = item._count.id;
      }
    });

    financialStatsRaw.forEach(item => {
      const amount = Number(item._sum.amount || 0);
      if (item.type === 'INCOME') {
        if (item.status === 'PAID') stats.finance.income_paid = amount;
        else stats.finance.income_pending = amount;
      } else if (item.type === 'EXPENSE') {
        if (item.status === 'PAID') stats.finance.expense_paid = amount;
        else stats.finance.expense_pending = amount;
      }
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
