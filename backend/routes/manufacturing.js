import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all manufacturing orders
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.manufacturingOrder.findMany({
      include: {
        salesOrder: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    material: true,
                    components: {
                      include: {
                        component: {
                          include: { material: true }
                        }
                      },
                      orderBy: { createdAt: 'asc' }
                    }
                  }
                }
              }
            },
            customer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch manufacturing orders' });
  }
});

// Create from sales order
router.post('/from-sales/:salesId', async (req, res) => {
  try {
    const { salesId } = req.params;
    
    // Check if already exists
    const existing = await prisma.manufacturingOrder.findUnique({
      where: { salesOrderId: salesId }
    });
    if (existing) return res.status(400).json({ error: 'Ordem de Fabricação já existe para este pedido.' });

    const mo = await prisma.manufacturingOrder.create({
      data: {
        salesOrderId: salesId,
        status: 'PENDING',
        description: `OF Automática ref. Pedido ${salesId.slice(0, 8).toUpperCase()}`
      }
    });
    res.status(201).json(mo);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create MO' });
  }
});

// Update MO status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Perform updates in a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      const mo = await tx.manufacturingOrder.update({
        where: { id: req.params.id },
        data: { 
          status,
          endDate: status === 'COMPLETED' ? new Date() : undefined
        }
      });

      let salesStatusUpdated = false;
      
      if (status === 'COMPLETED') {
        await tx.salesOrder.update({
          where: { id: mo.salesOrderId },
          data: { status: 'EXPEDICAO' }
        });
        salesStatusUpdated = true;
      } else if (status === 'CANCELLED') {
        // Cancel the related Sales Order
        await tx.salesOrder.update({
          where: { id: mo.salesOrderId },
          data: { status: 'CANCELLED' }
        });
        
        // Also cancel any pending financial transactions linked to this sales order
        await tx.financialTransaction.updateMany({
          where: { 
            salesOrderId: mo.salesOrderId,
            status: 'PENDING'
          },
          data: { status: 'CANCELLED' }
        });
        
        salesStatusUpdated = true;
      }

      return { mo, salesStatusUpdated };
    });

    res.json(result.mo);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ error: 'Erro ao atualizar status da OF e do Pedido.' });
  }
});

export default router;
