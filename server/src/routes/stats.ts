import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

// Расширяем тип Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        uid: string
        username: string
        email?: string
      }
    }
  }
}

const prisma = new PrismaClient()
const router = Router()

// Получение статистики пользователя
router.get('/:uid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params

    // Проверяем, что пользователь запрашивает свою статистику
    if (req.user?.uid !== uid) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const user = await prisma.user.findUnique({
      where: { uid }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Получаем статистику по баннерам
    const bannerStats = await prisma.gachaPull.groupBy({
      by: ['bannerId'],
      _count: {
        bannerId: true
      },
      where: {
        userId: user.id
      }
    })

    // Получаем общую статистику
    const totalPulls = await prisma.gachaPull.count({
      where: {
        userId: user.id
      }
    })

    const fiveStarPulls = await prisma.gachaPull.count({
      where: {
        userId: user.id,
        rankType: 5
      }
    })

    const fourStarPulls = await prisma.gachaPull.count({
      where: {
        userId: user.id,
        rankType: 4
      }
    })

    // Получаем баннеры с их именами
    const bannersWithNames = await Promise.all(
      bannerStats.map(async (stat) => {
        const banner = await prisma.banner.findUnique({
          where: { bannerId: stat.bannerId }
        })
        return {
          bannerId: stat.bannerId,
          bannerName: banner?.bannerName || 'Unknown Banner',
          count: stat._count.bannerId
        }
      })
    )

    res.json({
      user: {
        uid: user.uid,
        username: user.username
      },
      stats: {
        totalPulls,
        fiveStarPulls,
        fourStarPulls,
        fiveStarRate: totalPulls > 0 ? (fiveStarPulls / totalPulls * 100).toFixed(2) : '0.00',
        fourStarRate: totalPulls > 0 ? (fourStarPulls / totalPulls * 100).toFixed(2) : '0.00'
      },
      bannerStats: bannersWithNames
    })
  } catch (error) {
    console.error('Error getting user stats:', error)
    res.status(500).json({ error: 'Failed to get user stats' })
  }
})

// Получение детальной статистики по баннеру
router.get('/:uid/banner/:bannerId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uid, bannerId } = req.params

    // Проверяем, что пользователь запрашивает свою статистику
    if (req.user?.uid !== uid) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const user = await prisma.user.findUnique({
      where: { uid }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const banner = await prisma.banner.findUnique({
      where: { bannerId: bannerId }
    })

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' })
    }

    const pulls = await prisma.gachaPull.findMany({
      where: {
        userId: user.id,
        bannerId: bannerId
      },
      orderBy: {
        time: 'desc'
      },
      take: 100 // Ограничиваем количество записей
    })

    const fiveStarItems = pulls.filter(p => p.rankType === 5)
    const fourStarItems = pulls.filter(p => p.rankType === 4)

    res.json({
      banner: {
        id: banner.id,
        name: banner.bannerName,
        type: banner.bannerType
      },
      stats: {
        totalPulls: pulls.length,
        fiveStarCount: fiveStarItems.length,
        fourStarCount: fourStarItems.length,
        lastFiveStar: fiveStarItems[0]?.time || null,
        lastFourStar: fourStarItems[0]?.time || null
      },
      recentPulls: pulls.slice(0, 20) // Последние 20 крутов
    })
  } catch (error) {
    console.error('Error getting banner stats:', error)
    res.status(500).json({ error: 'Failed to get banner stats' })
  }
})

export default router
