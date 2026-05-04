import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all materials
router.get('/', async (req, res) => {
  try {
    const materials = await prisma.material.findMany({ orderBy: { name: 'asc' } });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Create material
router.post('/', async (req, res) => {
  try {
    const material = await prisma.material.create({ data: { name: req.body.name } });
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create material' });
  }
});

// Update material
router.put('/:id', async (req, res) => {
  try {
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: { name: req.body.name }
    });
    res.json(material);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update material' });
  }
});

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete material' });
  }
});

export default router;
