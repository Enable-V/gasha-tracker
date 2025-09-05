import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Create user endpoint
router.post('/create-user', async (req: Request, res: Response) => {
  try {
    const { uid, username } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }
    
    const user = await req.prisma.user.upsert({
      where: { uid },
      update: { username: username || `Player_${uid}` },
      create: { 
        uid, 
        username: username || `Player_${uid}` 
      }
    });
    
    res.json({ 
      success: true, 
      user,
      message: 'User created/updated successfully'
    });
  } catch (error: any) {
    req.logger.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message
    });
  }
});

export default router;
