import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await req.prisma.user.findMany({
      select: {
        id: true,
        uid: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            gachaPulls: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(users);
  } catch (error) {
    req.logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by UID
router.get('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const user = await req.prisma.user.findUnique({
      where: { uid },
      include: {
        userStats: true,
        _count: {
          select: {
            gachaPulls: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    req.logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { uid, username } = req.body;
    
    if (!uid || !username) {
      return res.status(400).json({ error: 'UID and username are required' });
    }
    
    const user = await req.prisma.user.upsert({
      where: { uid },
      update: { username },
      create: { uid, username }
    });
    
    res.json(user);
  } catch (error) {
    req.logger.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Delete user
router.delete('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    await req.prisma.user.delete({
      where: { uid }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    req.logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
