import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// In a real app, use bcrypt to hash passwords. Keeping it simple as requested for now.

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ 
      where: { username },
      include: {
        groups: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Consolidated permissions list
    const permissions = [...new Set(
      user.groups.flatMap(g => g.permissions.map(p => p.code))
    )];

    // Omit password from response
    const { password: _, groups, ...userData } = user;
    res.json({ ...userData, groups: groups.map(g => g.name), permissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Register removed - Use Settings > Users instead.
export default router;
