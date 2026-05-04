import express from 'express';
import { PrismaClient } from '@prisma/client';
import { prepareNFeItems } from '../services/nfeService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get NFe Draft details (items exploded if necessary)
router.get('/preview/:orderId', async (req, res) => {
  try {
    const items = await prepareNFeItems(req.params.orderId);
    
    // Fetch company settings to get issuer info
    const company = await prisma.companySettings.findFirst();
    
    // Fetch order to get customer info
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true }
    });

    res.json({
      orderStatus: order.status,
      issuer: company,
      customer: order.customer,
      items: items,
      total: items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0)
    });
  } catch (error) {
    console.error('NFe Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Invoice status manually (for testing)
router.put('/:id/status', async (req, res) => {
    const { status, accessKey, number, series } = req.body;
    try {
        const invoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data: { status, accessKey, number, series }
        });
        res.json(invoice);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update invoice' });
    }
});

export default router;
