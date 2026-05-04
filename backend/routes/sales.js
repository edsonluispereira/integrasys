import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all sales orders
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        paymentMethod: true,
        manufacturing: true,
        items: { include: { product: { include: { material: true, customers: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

// Create sales order
router.post('/', async (req, res) => {
  const { customerId, items, paymentMethodId } = req.body;

  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer and items are required' });
  }

  try {
    // Fetch customer to copy delivery_type
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const order = await prisma.salesOrder.create({
      data: {
        customerId,
        paymentMethodId: paymentMethodId || null,
        status: 'OPEN',
        totalAmount,
        delivery_type: customer?.delivery_type || null,
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            custom_description: item.custom_description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        customer: true,
        paymentMethod: true,
        items: { include: { product: { include: { material: true } } } }
      }
    });

    // Auto-create financial transaction (Income Receivable)
    await prisma.financialTransaction.create({
      data: {
        type: 'INCOME',
        description: `Ref. Pedido ${order.id.slice(0, 8).toUpperCase()} — ${customer?.name}`,
        amount: totalAmount,
        dueDate: new Date(),
        status: 'PENDING',
        salesOrderId: order.id
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create sales order' });
  }
});

// Update sales order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update order status' });
  }
});

// Update full sales order (customer + items + payment)
router.put('/:id', async (req, res) => {
  const { customerId, items, paymentMethodId } = req.body;
  
  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer and items are required' });
  }
  
  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Delete old items then recreate
    await prisma.orderItem.deleteMany({ where: { salesOrderId: req.params.id } });

    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        customerId,
        paymentMethodId: paymentMethodId || null,
        totalAmount,
        delivery_type: customer?.delivery_type || null,
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            custom_description: item.custom_description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        customer: true,
        paymentMethod: true,
        items: { include: { product: { include: { material: true } } } }
      }
    });

    // Sync financial transaction amount if it's still pending
    await prisma.financialTransaction.updateMany({
      where: { salesOrderId: req.params.id, status: 'PENDING' },
      data: { amount: totalAmount }
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update sales order' });
  }
});

// Invoicing (Billing) with installments
router.post('/:id/invoice', async (req, res) => {
  const { id } = req.params;
  const { paymentMethodId, firstDueDate, installments = 1, markAsPaid = false, explodeKit = false } = req.body;

  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: { include: { components: true } } } } }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const totalAmount = Number(order.totalAmount);
    const installmentAmount = Number((totalAmount / installments).toFixed(2));
    const lastInstallmentGap = Number((totalAmount - (installmentAmount * installments)).toFixed(2));

    // Cleanup old pending transactions for this order
    await prisma.financialTransaction.deleteMany({
      where: { salesOrderId: id, status: 'PENDING' }
    });

    // Create installments
    const transactionPromises = [];
    let currentDueDate = new Date(firstDueDate || new Date());

    for (let i = 1; i <= installments; i++) {
      const isLast = i === installments;
      const amount = isLast ? (installmentAmount + lastInstallmentGap) : installmentAmount;

      transactionPromises.push(
        prisma.financialTransaction.create({
          data: {
            type: 'INCOME',
            description: `Parcela ${i}/${installments} - Pedido ${order.id.slice(0, 8).toUpperCase()} (${order.customer?.name})`,
            amount,
            dueDate: new Date(currentDueDate),
            status: markAsPaid ? 'PAID' : 'PENDING',
            paymentDate: markAsPaid ? new Date() : null,
            salesOrderId: id
          }
        })
      );

      currentDueDate.setMonth(currentDueDate.getMonth() + 1);
    }

    await Promise.all(transactionPromises);

    // Create Invoice Record (NF-e entry)
    await prisma.invoice.create({
      data: {
        salesOrderId: id,
        status: 'DRAFT',
        billingMode: explodeKit ? 'COMPONENTES' : 'ITEM_PAI',
      }
    });

    const updatedOrder = await prisma.salesOrder.update({
      where: { id },
      data: { 
        status: 'CLOSED', // Faturado
        paymentMethodId: paymentMethodId || order.paymentMethodId
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Invoicing error:', error);
    res.status(400).json({ error: 'Failed to generate invoice' });
  }
});

// Update specific OrderItem quantity (useful when adjusting from Production)
router.put('/items/:id/quantity', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be positive' });
  }

  try {
    const currentItem = await prisma.orderItem.findUnique({ where: { id: req.params.id } });
    if (!currentItem) return res.status(404).json({ error: 'Item not found' });

    const updatedItem = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: { quantity: parseInt(quantity, 10) }
    });

    const orderItems = await prisma.orderItem.findMany({ where: { salesOrderId: currentItem.salesOrderId } });
    const totalAmount = orderItems.reduce((acc, it) => acc + (it.quantity * Number(it.unitPrice)), 0);

    await prisma.salesOrder.update({
      where: { id: currentItem.salesOrderId },
      data: { totalAmount }
    });

    await prisma.financialTransaction.updateMany({
      where: { salesOrderId: currentItem.salesOrderId, status: 'PENDING' },
      data: { amount: totalAmount }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item quantity' });
  }
});

export default router;
