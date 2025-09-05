import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Get gacha pulls for a user
router.get('/user/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { banner, limit = 50, offset = 0 } = req.query;
    
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const whereClause: any = { userId: user.id };
    if (banner) {
      whereClause.bannerId = banner;
    }
    
    const pulls = await req.prisma.gachaPull.findMany({
      where: whereClause,
      include: {
        banner: true
      },
      orderBy: {
        time: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });
    
    const total = await req.prisma.gachaPull.count({
      where: whereClause
    });
    
    res.json({
      pulls,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      }
    });
  } catch (error) {
    req.logger.error('Error fetching gacha pulls:', error);
    res.status(500).json({ error: 'Failed to fetch gacha pulls' });
  }
});

// Get gacha statistics for a user
router.get('/stats/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stats = await req.prisma.userStats.findMany({
      where: { userId: user.id }
    });
    
    // Get recent 5-star pulls
    const recentFiveStars = await req.prisma.gachaPull.findMany({
      where: {
        userId: user.id,
        rankType: 5
      },
      include: {
        banner: true
      },
      orderBy: {
        time: 'desc'
      },
      take: 10
    });
    
    res.json({
      stats,
      recentFiveStars
    });
  } catch (error) {
    req.logger.error('Error fetching gacha stats:', error);
    res.status(500).json({ error: 'Failed to fetch gacha stats' });
  }
});

// Import gacha data
router.post('/import/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { gachaData } = req.body;
    
    if (!gachaData || !Array.isArray(gachaData)) {
      return res.status(400).json({ error: 'Invalid gacha data format' });
    }
    
    // Find or create user
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please create user first.' });
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const pull of gachaData) {
      try {
        // Calculate pity count
        const previousPulls = await req.prisma.gachaPull.findMany({
          where: {
            userId: user.id,
            bannerId: pull.gacha_type,
            time: { lt: new Date(pull.time) }
          },
          orderBy: { time: 'desc' }
        });
        
        let pityCount = 1;
        for (const prevPull of previousPulls) {
          if (prevPull.rankType === 5) break;
          pityCount++;
        }
        
        await req.prisma.gachaPull.create({
          data: {
            userId: user.id,
            bannerId: pull.gacha_type,
            gachaId: pull.id,
            itemName: pull.name,
            itemType: pull.item_type,
            rankType: Number(pull.rank_type),
            time: new Date(pull.time),
            pityCount
          }
        });
        
        importedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }
    
    // Update user statistics
    await updateUserStats(req.prisma, user.id);
    
    res.json({
      message: 'Gacha data imported successfully',
      imported: importedCount,
      skipped: skippedCount
    });
  } catch (error) {
    req.logger.error('Error importing gacha data:', error);
    res.status(500).json({ error: 'Failed to import gacha data' });
  }
});

// Helper function to update user statistics
async function updateUserStats(prisma: any, userId: number) {
  const bannerTypes = ['character', 'weapon', 'standard', 'beginner'];
  
  for (const bannerType of bannerTypes) {
    const pulls = await prisma.gachaPull.findMany({
      where: {
        userId,
        banner: {
          bannerType
        }
      },
      orderBy: { time: 'desc' }
    });
    
    const totalPulls = pulls.length;
    const fiveStarCount = pulls.filter((p: any) => p.rankType === 5).length;
    const fourStarCount = pulls.filter((p: any) => p.rankType === 4).length;
    const threeStarCount = pulls.filter((p: any) => p.rankType === 3).length;
    
    let currentPity = 0;
    let lastFiveStarTime = null;
    
    for (const pull of pulls) {
      if (pull.rankType === 5) {
        lastFiveStarTime = pull.time;
        break;
      }
      currentPity++;
    }
    
    await prisma.userStats.upsert({
      where: {
        unique_user_banner: {
          userId,
          bannerType
        }
      },
      update: {
        totalPulls,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        currentPity,
        lastFiveStarTime
      },
      create: {
        userId,
        bannerType,
        totalPulls,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        currentPity,
        lastFiveStarTime
      }
    });
  }
}

export default router;
