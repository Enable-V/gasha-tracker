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

// Get current user profile (требует аутентификации)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const userId = req.user.id;

    const user = await req.prisma.user.findUnique({
      where: { id: userId },
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
    req.logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update current user profile (требует аутентификации)
router.put('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const userId = req.user.id;
    const { username, email } = req.body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await req.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    req.logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Delete current user account (требует аутентификации)
router.delete('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const userId = req.user.id;

    await req.prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    req.logger.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

export default router;
