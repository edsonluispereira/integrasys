import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to seed default payment methods
async function seedDefaultMethods() {
  const defaults = [
    'PIX',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Boleto Bancário',
    'Dinheiro',
    'Transferência Bancária'
  ];

  for (const name of defaults) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
}

// Get all payment methods (seeds if empty)
router.get('/', async (req, res) => {
  try {
    let methods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    if (methods.length === 0) {
      await seedDefaultMethods();
      methods = await prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
    }
    
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Create payment method
router.post('/', async (req, res) => {
  try {
    const method = await prisma.paymentMethod.create({
      data: req.body
    });
    res.status(201).json(method);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create payment method' });
  }
});

// Update payment method
router.put('/:id', async (req, res) => {
  try {
    const method = await prisma.paymentMethod.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(method);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update payment method' });
  }
});

// Delete (deactivate) payment method
router.delete('/:id', async (req, res) => {
  try {
    // Soft delete by deactivating
    await prisma.paymentMethod.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete payment method' });
  }
});

export default router;
