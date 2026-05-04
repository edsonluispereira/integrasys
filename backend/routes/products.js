import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Include helper — sempre inclui material, customers e estrutura
const productInclude = {
  customers: true,
  material: true,
  components: {
    include: {
      component: {
        include: { material: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  }
};

// Helper: generate next cod_item (5-digit numeric, e.g. 00001)
async function generateNextCodItem() {
  const products = await prisma.product.findMany({
    select: { cod_item: true }
  });

  let maxNum = 0;
  for (const p of products) {
    const num = parseInt(p.cod_item, 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  const next = maxNum + 1;
  return String(next).padStart(5, '0');
}

// Get next auto-generated cod_item (preview)
router.get('/next-code', async (req, res) => {
  try {
    const code = await generateNextCodItem();
    res.json({ cod_item: code });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate next code' });
  }
});

// Get all products (with customers, material and components)
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { customerIds = [], materialId, unit_price, cod_item, hasStructure, components = [], ...rest } = req.body;

    const data = {
      ...rest,
      hasStructure: !!hasStructure,
      cod_item: (!cod_item || cod_item.trim() === '') ? await generateNextCodItem() : cod_item,
      unit_price: (unit_price !== undefined && unit_price !== '') ? parseFloat(unit_price) : null,
      material: materialId ? { connect: { id: materialId } } : undefined,
      customers: customerIds.length > 0
        ? { connect: customerIds.map(id => ({ id })) }
        : undefined,
    };

    const product = await prisma.product.create({
      data,
      include: productInclude
    });

    // Create component links if provided and product has structure
    if (hasStructure && components.length > 0) {
      for (const comp of components) {
        if (!comp.componentId || !comp.quantity) continue;
        try {
          await prisma.productComponent.create({
            data: {
              parentId: product.id,
              componentId: comp.componentId,
              quantity: parseFloat(comp.quantity)
            }
          });
        } catch (e) {
          // skip duplicates
        }
      }
    }

    // Re-fetch with components populated
    const updated = await prisma.product.findUnique({
      where: { id: product.id },
      include: productInclude
    });

    res.status(201).json(updated);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { customerIds = [], materialId, unit_price, hasStructure, components = [], ...rest } = req.body;

    // First disconnect all customers, then reconnect the new list
    await prisma.product.update({
      where: { id: req.params.id },
      data: { customers: { set: [] } }
    });

    const data = {
      ...rest,
      hasStructure: !!hasStructure,
      unit_price: (unit_price !== undefined && unit_price !== '') ? parseFloat(unit_price) : null,
      material: materialId ? { connect: { id: materialId } } : { disconnect: true },
      customers: customerIds.length > 0
        ? { connect: customerIds.map(id => ({ id })) }
        : undefined,
    };

    await prisma.product.update({
      where: { id: req.params.id },
      data,
    });

    // Replace all components: delete existing, recreate
    await prisma.productComponent.deleteMany({
      where: { parentId: req.params.id }
    });

    if (hasStructure && components.length > 0) {
      for (const comp of components) {
        if (!comp.componentId || !comp.quantity) continue;
        try {
          await prisma.productComponent.create({
            data: {
              parentId: req.params.id,
              componentId: comp.componentId,
              quantity: parseFloat(comp.quantity)
            }
          });
        } catch (e) {
          // skip duplicates
        }
      }
    }

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    // Delete component links first
    await prisma.productComponent.deleteMany({ where: { parentId: req.params.id } });
    await prisma.productComponent.deleteMany({ where: { componentId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

// --- Component management endpoints ---

// Add a component to a product's structure
router.post('/:id/components', async (req, res) => {
  try {
    const { componentId, quantity } = req.body;
    if (!componentId || !quantity) return res.status(400).json({ error: 'componentId and quantity required' });

    const comp = await prisma.productComponent.create({
      data: {
        parentId: req.params.id,
        componentId,
        quantity: parseFloat(quantity)
      },
      include: { component: { include: { material: true } } }
    });
    res.status(201).json(comp);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to add component (possibly duplicate)' });
  }
});

// Remove a component from a product's structure
router.delete('/:id/components/:componentId', async (req, res) => {
  try {
    await prisma.productComponent.deleteMany({
      where: {
        parentId: req.params.id,
        componentId: req.params.componentId
      }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to remove component' });
  }
});

export default router;
