import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Get overall statistics
router.get('/overall', async (req: Request, res: Response) => {
  try {
    const totalUsers = await req.prisma.user.count();
    const totalPulls = await req.prisma.gachaPull.count();
    
    const rarityStats = await req.prisma.gachaPull.groupBy({
      by: ['rankType'],
      _count: {
        rankType: true
      }
    });
    
    const bannerStats = await req.prisma.gachaPull.groupBy({
      by: ['bannerId'],
      _count: {
        bannerId: true
      },
      include: {
        banner: true
      }
    });
    
    res.json({
      totalUsers,
      totalPulls,
      rarityStats,
      bannerStats
    });
  } catch (error) {
    req.logger.error('Error fetching overall stats:', error);
    res.status(500).json({ error: 'Failed to fetch overall statistics' });
  }
});

// Get user statistics
router.get('/user/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userStats = await req.prisma.userStats.findMany({
      where: { userId: user.id }
    });
    
    // Get pull history by month
    const pullHistory = await req.prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(time, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(CASE WHEN rank_type = 5 THEN 1 ELSE 0 END) as five_star_count,
        SUM(CASE WHEN rank_type = 4 THEN 1 ELSE 0 END) as four_star_count
      FROM gacha_pulls 
      WHERE user_id = ${user.id}
      GROUP BY DATE_FORMAT(time, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;
    
    // Get luck statistics
    const fiveStarPulls = await req.prisma.gachaPull.findMany({
      where: {
        userId: user.id,
        rankType: 5
      },
      select: {
        pityCount: true,
        time: true,
        itemName: true,
        banner: {
          select: {
            bannerType: true
          }
        }
      },
      orderBy: {
        time: 'desc'
      }
    });
    
    // Calculate average pity
    const avgPity = fiveStarPulls.length > 0 
      ? fiveStarPulls.reduce((sum, pull) => sum + pull.pityCount, 0) / fiveStarPulls.length
      : 0;
    
    res.json({
      userStats,
      pullHistory,
      fiveStarPulls,
      avgPity: Math.round(avgPity * 100) / 100
    });
  } catch (error) {
    req.logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get banner statistics
router.get('/banner/:bannerId', async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    
    const banner = await req.prisma.banner.findUnique({
      where: { bannerId }
    });
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    const bannerStats = await req.prisma.gachaPull.groupBy({
      by: ['rankType'],
      where: { bannerId },
      _count: {
        rankType: true
      }
    });
    
    const topItems = await req.prisma.gachaPull.groupBy({
      by: ['itemName', 'rankType'],
      where: { bannerId },
      _count: {
        itemName: true
      },
      orderBy: {
        _count: {
          itemName: 'desc'
        }
      },
      take: 10
    });
    
    res.json({
      banner,
      bannerStats,
      topItems
    });
  } catch (error) {
    req.logger.error('Error fetching banner stats:', error);
    res.status(500).json({ error: 'Failed to fetch banner statistics' });
  }
});

// Get pity distribution
router.get('/pity/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { bannerType } = req.query;
    
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const whereClause: any = {
      userId: user.id,
      rankType: 5
    };
    
    if (bannerType) {
      whereClause.banner = {
        bannerType
      };
    }
    
    const pityDistribution = await req.prisma.gachaPull.groupBy({
      by: ['pityCount'],
      where: whereClause,
      _count: {
        pityCount: true
      },
      orderBy: {
        pityCount: 'asc'
      }
    });
    
    res.json(pityDistribution);
  } catch (error) {
    req.logger.error('Error fetching pity distribution:', error);
    res.status(500).json({ error: 'Failed to fetch pity distribution' });
  }
});

export default router;
