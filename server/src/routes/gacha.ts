import { Router } from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client'
import { authenticateOptional, requireOwnership, AuthRequest } from '../middleware/auth'
import { logger } from '../middleware/logger'

const router = Router();
const prisma = new PrismaClient()

// Get gacha pulls for a user (требует аутентификации и владения)
router.get('/user/:uid', authenticateOptional, requireOwnership, async (req: AuthRequest, res: Response) => {
  try {
  const { uid } = req.params;
  const { banner, limit = '50', offset = '0', game } = req.query;
  const limitNum = Number(limit);
  const offsetNum = Number(offset);

  console.log(`Fetching gacha pulls for UID: ${uid}, Game: ${game || 'HSR'}`);
    
    const user = await prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      console.error(`User not found: ${uid}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`Found user: ${user.id} (${user.username})`);
    
    const whereClause: any = { 
      userId: user.id,
      // Добавляем фильтр по игре, по умолчанию HSR для обратной совместимости
      game: game ? (game as string).toUpperCase() : 'HSR'
    };
    
    if (banner) {
      whereClause.bannerId = banner;
    }
    
    console.log(`Searching with where clause:`, whereClause);
    
    const findOptions: any = {
      where: whereClause,
      include: { banner: true },
      orderBy: { time: 'desc' },
      skip: offsetNum
    };

    // If limitNum > 0, apply take; if limitNum === 0 treat as "no limit" and don't pass `take` to Prisma
    if (limitNum > 0) {
      findOptions.take = limitNum;
    }

    const pulls = await prisma.gachaPull.findMany(findOptions);
    
    console.log(`Found ${pulls.length} pulls`);
    
    const total = await prisma.gachaPull.count({
      where: whereClause
    });
    
    console.log(`Total pulls count: ${total}`);
    
    // Преобразуем BigInt в строку для JSON сериализации
    const serializedPulls = pulls.map((pull: any) => ({
      ...pull,
      id: pull.id.toString(), // Преобразуем BigInt в строку
      time: pull.time.toISOString() // Убеждаемся что дата правильно сериализуется
    }));
    
    const responseLimit = limitNum === 0 ? total : limitNum;

    res.json({
      pulls: serializedPulls,
      pagination: {
        total,
        limit: responseLimit,
        offset: offsetNum,
        hasMore: limitNum === 0 ? false : total > offsetNum + limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching gacha pulls:', error);
    res.status(500).json({ error: 'Failed to fetch gacha pulls' });
  }
});

// Get gacha statistics for a user (требует аутентификации и владения)
router.get('/stats/:uid', authenticateOptional, requireOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const { game } = req.query;
    
    const user = await prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const gameFilter = game ? (game as string).toUpperCase() : 'HSR';
    
    const stats = await prisma.userStats.findMany({
      where: { 
        userId: user.id,
        game: gameFilter as any
      }
    });
    
    // Get recent 5-star pulls
    const recentFiveStars = await prisma.gachaPull.findMany({
      where: {
        userId: user.id,
        rankType: 5,
        game: gameFilter as any
      },
      include: {
        banner: true
      },
      orderBy: {
        time: 'desc'
      },
      take: 10
    });
    
    // Преобразуем BigInt в строку для JSON сериализации
    const serializedFiveStars = recentFiveStars.map((pull: any) => ({
      ...pull,
      id: pull.id.toString(),
      time: pull.time.toISOString()
    }));
    
    res.json({
      stats,
      recentFiveStars: serializedFiveStars
    });
  } catch (error) {
    console.error('Error fetching gacha stats:', error);
    res.status(500).json({ error: 'Failed to fetch gacha stats' });
  }
});

// Import gacha data
router.post('/import/:uid', async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const { gachaData } = req.body;
    
    if (!gachaData || !Array.isArray(gachaData)) {
      return res.status(400).json({ error: 'Invalid gacha data format' });
    }
    
    // Find or create user
    const user = await prisma.user.findUnique({
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
        const previousPulls = await prisma.gachaPull.findMany({
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
        
        await prisma.gachaPull.create({
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
    await updateUserStats(prisma, user.id);
    
    res.json({
      message: 'Gacha data imported successfully',
      imported: importedCount,
      skipped: skippedCount
    });
  } catch (error) {
    logger.error('Error importing gacha data:', error);
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

// Clear all HSR pulls for a user (требует аутентификации и владения)
router.delete('/clear-pulls/:uid', authenticateOptional, requireOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Удаляем все HSR крутки пользователя
    const deletedPulls = await prisma.gachaPull.deleteMany({
      where: {
        userId: user.id,
        game: 'HSR'
      }
    });
    
    // Удаляем соответствующие статистики HSR
    await prisma.userStats.deleteMany({
      where: {
        userId: user.id,
        game: 'HSR'
      }
    });
    
    console.log(`Cleared ${deletedPulls.count} HSR pulls for user ${user.username} (${uid})`);
    
    res.json({
      message: 'HSR pulls cleared successfully',
      deletedCount: deletedPulls.count
    });
  } catch (error) {
    console.error('Error clearing HSR pulls:', error);
    res.status(500).json({ error: 'Failed to clear HSR pulls' });
  }
});

export default router;
