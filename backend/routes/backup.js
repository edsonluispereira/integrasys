import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/backup — gera e baixa o backup completo
router.get('/', async (req, res) => {
  try {
    const [
      customers, products, materials, suppliers,
      salesOrders, orderItems, manufacturingOrders,
      financialTransactions, invoices, paymentMethods,
      companySettings, users, groups
    ] = await Promise.all([
      prisma.customer.findMany(),
      prisma.product.findMany({
        include: { components: true, material: true, customers: { select: { id: true } } }
      }),
      prisma.material.findMany(),
      prisma.supplier.findMany(),
      prisma.salesOrder.findMany(),
      prisma.orderItem.findMany(),
      prisma.manufacturingOrder.findMany(),
      prisma.financialTransaction.findMany(),
      prisma.invoice.findMany(),
      prisma.paymentMethod.findMany(),
      prisma.companySettings.findFirst(),
      prisma.user.findMany({ include: { groups: true } }),
      prisma.group.findMany({ include: { permissions: true } }),
    ]);

    const backup = {
      version: '1.0',
      generated_at: new Date().toISOString(),
      data: {
        customers,
        products,
        materials,
        suppliers,
        salesOrders,
        orderItems,
        manufacturingOrders,
        financialTransactions,
        invoices,
        paymentMethods,
        companySettings,
        users: users.map(({ password, ...u }) => u),
        groups,
      }
    };

    const filename = `integrasys_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Erro ao gerar backup.' });
  }
});

// POST /api/backup/restore — restaura a partir de um backup
router.post('/restore', async (req, res) => {
  const backup = req.body;

  if (!backup?.data) {
    return res.status(400).json({ error: 'Arquivo de backup inválido.' });
  }

  const { data } = backup;

  try {
    await prisma.$transaction(async (tx) => {
      // --- Limpa em ordem reversa de FK ---
      await tx.financialTransaction.deleteMany();
      await tx.invoice.deleteMany();
      await tx.manufacturingOrder.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.salesOrder.deleteMany();
      await tx.productComponent.deleteMany();

      // Desconecta M2M produto-cliente antes de deletar
      const existingProducts = await tx.product.findMany({ select: { id: true } });
      for (const p of existingProducts) {
        await tx.product.update({ where: { id: p.id }, data: { customers: { set: [] } } });
      }
      await tx.product.deleteMany();
      await tx.customer.deleteMany();
      await tx.supplier.deleteMany();
      await tx.material.deleteMany();
      await tx.paymentMethod.deleteMany();
      await tx.companySettings.deleteMany();

      // --- Re-insere em ordem de FK ---

      if (data.companySettings) {
        const { createdAt, updatedAt, ...cs } = data.companySettings;
        await tx.companySettings.create({ data: cs });
      }

      if (data.paymentMethods?.length) {
        await tx.paymentMethod.createMany({
          data: data.paymentMethods.map(({ createdAt, updatedAt, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.materials?.length) {
        await tx.material.createMany({
          data: data.materials.map(({ createdAt, updatedAt, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.customers?.length) {
        await tx.customer.createMany({
          data: data.customers.map(({ createdAt, updatedAt, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.suppliers?.length) {
        await tx.supplier.createMany({
          data: data.suppliers.map(({ createdAt, updatedAt, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.products?.length) {
        // Insere produtos sem relações
        await tx.product.createMany({
          data: data.products.map(({ createdAt, updatedAt, components, material, customers, ...d }) => d),
          skipDuplicates: true,
        });

        // Insere componentes (BOM)
        const allComponents = data.products.flatMap(p =>
          (p.components || []).map(({ createdAt, updatedAt, ...c }) => c)
        );
        if (allComponents.length) {
          await tx.productComponent.createMany({ data: allComponents, skipDuplicates: true });
        }

        // Reconecta M2M produto-cliente
        for (const p of data.products) {
          if (p.customers?.length) {
            await tx.product.update({
              where: { id: p.id },
              data: { customers: { connect: p.customers.map(c => ({ id: c.id })) } },
            });
          }
        }
      }

      if (data.salesOrders?.length) {
        await tx.salesOrder.createMany({
          data: data.salesOrders.map(({ createdAt, updatedAt, items, invoice, customer, paymentMethod, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.orderItems?.length) {
        await tx.orderItem.createMany({
          data: data.orderItems.map(({ createdAt, updatedAt, product, salesOrder, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.manufacturingOrders?.length) {
        await tx.manufacturingOrder.createMany({
          data: data.manufacturingOrders.map(({ createdAt, updatedAt, salesOrder, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.invoices?.length) {
        await tx.invoice.createMany({
          data: data.invoices.map(({ createdAt, updatedAt, salesOrder, ...d }) => d),
          skipDuplicates: true,
        });
      }

      if (data.financialTransactions?.length) {
        await tx.financialTransaction.createMany({
          data: data.financialTransactions.map(({ createdAt, updatedAt, salesOrder, invoice, ...d }) => d),
          skipDuplicates: true,
        });
      }
    }, { timeout: 60000 });

    res.json({ success: true, message: 'Backup restaurado com sucesso!' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Erro ao restaurar: ' + error.message });
  }
});

export default router;
