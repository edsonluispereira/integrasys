import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await prisma.financialTransaction.findMany({
      include: {
        salesOrder: { include: { customer: true } },
        supplier: true
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial transactions' });
  }
});

// Create transaction (manual)
router.post('/', async (req, res) => {
  try {
    const transaction = await prisma.financialTransaction.create({
      data: {
        type: req.body.type,
        description: req.body.description,
        amount: Number(req.body.amount),
        dueDate: new Date(req.body.dueDate),
        status: req.body.status || 'PENDING',
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : null,
        salesOrderId: req.body.salesOrderId || null,
        supplierId: req.body.supplierId || null
      }
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create financial transaction' });
  }
});

// Update status and payment date
router.put('/:id/status', async (req, res) => {
  try {
    const { status, paymentDate } = req.body; 
    const transaction = await prisma.financialTransaction.update({
      where: { id: req.params.id },
      data: { 
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : (status === 'PAID' ? new Date() : null)
      }
    });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update transaction status' });
  }
});

export default router;
