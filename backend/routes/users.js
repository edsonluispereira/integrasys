import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users with groups
// ...
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        groups: { select: { id: true, name: true } }
      },
      orderBy: { username: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (restricted to Master)
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Usuário já existe' });

    const user = await prisma.user.create({
      data: { username, password }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar usuário' });
  }
});

// Update user password (restricted to Master)
router.put('/:id/password', async (req, res) => {
  const { password } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao alterar senha' });
  }
});

// Update user groups
// ...
router.put('/:id/groups', async (req, res) => {
// ...
  const { groupNames } = req.body; // Array of group names
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        groups: {
          set: groupNames.map(name => ({ name }))
        }
      },
      include: { groups: true }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user groups' });
  }
});

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: { permissions: true }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

export default router;
