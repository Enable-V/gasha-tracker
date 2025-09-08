import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { logger } from '../middleware/logger'

const prisma = new PrismaClient()

export interface GenshinGachaResponse {
  retcode: number
  message: string
  data: {
    page: string
    size: string
    total: string
    list: GenshinGachaItem[]
    region: string
    region_time_zone: number
  }
}

export interface GenshinGachaItem {
  uid: string
  gacha_type: string
  item_id?: string
  count: string
  time: string
  name: string
  lang: string
  item_type: string
  rank_type: string
  id: string
}

// Соответствие типов баннеров Genshin Impact
const GENSHIN_BANNER_TYPES = {
  '100': { type: 'beginner', name: "Novice Wishes" },
  '200': { type: 'standard', name: "Wanderlust Invocation" },
  '301': { type: 'character', name: "Character Event Wish" },
  '302': { type: 'weapon', name: "Weapon Event Wish" },
  '400': { type: 'chronicled', name: "Chronicled Wish" }
} as const

export class GenshinImportService {
  private readonly RATE_LIMIT_DELAY = 1000 // 1 секунда между запросами
  private readonly MAX_RETRIES = 3

  // Парсинг URL для получения параметров запроса
  private parseGenshinUrl(url: string) {
    try {
      const urlObj = new URL(url)
      const params = urlObj.searchParams
      
      return {
        authkey: params.get('authkey'),
        authkey_ver: params.get('authkey_ver') || '1',
        sign_type: params.get('sign_type') || 'rsa',
        game_biz: params.get('game_biz') || 'hk4e_global',
        lang: params.get('lang') || 'en',
        region: params.get('region'),
        host: urlObj.host
      }
    } catch (error) {
      throw new Error('Invalid Genshin Impact URL format')
    }
  }

  // Получение данных о баннере
  private async getOrCreateBanner(gachaType: string) {
    const bannerInfo = GENSHIN_BANNER_TYPES[gachaType as keyof typeof GENSHIN_BANNER_TYPES]
    if (!bannerInfo) {
      throw new Error(`Unknown Genshin banner type: ${gachaType}`)
    }

    const bannerId = `genshin_${gachaType}`
    
    let banner = await prisma.banner.findFirst({
      where: {
        bannerId,
        game: 'GENSHIN'
      }
    })

    if (!banner) {
      banner = await prisma.banner.create({
        data: {
          bannerId,
          bannerName: bannerInfo.name,
          bannerType: bannerInfo.type as any,
          game: 'GENSHIN'
        }
      })
      console.log(`Created Genshin banner: ${bannerInfo.name}`)
    }

    return banner
  }

  // Получение данных круток с API
  private async fetchGachaData(
    baseUrl: string, 
    params: any, 
    gachaType: string, 
    page: number = 1, 
    size: number = 20
  ): Promise<GenshinGachaItem[]> {
    try {
      const url = `https://${params.host}/gacha_info/api/getGachaLog`
      
      const response = await axios.get<GenshinGachaResponse>(url, {
        params: {
          ...params,
          gacha_type: gachaType,
          page: page.toString(),
          size: size.toString()
        },
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (response.data.retcode !== 0) {
        throw new Error(`API Error: ${response.data.message}`)
      }

      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY))
      return response.data.data.list || []
      
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      throw error
    }
  }

  // Импорт всех типов баннеров
  async importGenshinData(url: string, uid: string): Promise<{
    success: boolean
    message: string
    stats: any
  }> {
    try {
      console.log('🎭 Starting Genshin Impact data import for UID:', uid)
      
      const params = this.parseGenshinUrl(url)
      console.log('📊 Parsed URL params:', { ...params, authkey: 'hidden' })

      // Находим пользователя
      const user = await prisma.user.findUnique({
        where: { uid }
      })

      if (!user) {
        throw new Error('User not found')
      }

      let totalImported = 0
      let totalSkipped = 0
      const bannerStats: Record<string, number> = {}

      // Импортируем данные для каждого типа баннера
      for (const [gachaType, bannerInfo] of Object.entries(GENSHIN_BANNER_TYPES)) {
        console.log(`🎯 Processing ${bannerInfo.name} (${gachaType})...`)
        
        try {
          const banner = await this.getOrCreateBanner(gachaType)
          let page = 1
          let hasMore = true
          let bannerImported = 0

          while (hasMore) {
            console.log(`📄 Fetching page ${page} for ${bannerInfo.name}...`)
            
            const items = await this.fetchGachaData(url, params, gachaType, page, 20)
            
            if (items.length === 0) {
              hasMore = false
              break
            }

            for (const item of items) {
              try {
                // Проверяем, существует ли уже эта крутка
                const existing = await prisma.gachaPull.findUnique({
                  where: { gachaId: `genshin_${item.id}` }
                })

                if (existing) {
                  totalSkipped++
                  continue
                }

                // Создаем запись о крутке
                await prisma.gachaPull.create({
                  data: {
                    userId: user.id,
                    bannerId: banner.bannerId,
                    gachaId: `genshin_${item.id}`,
                    itemName: item.name,
                    itemType: item.item_type,
                    rankType: parseInt(item.rank_type),
                    time: new Date(item.time),
                    pityCount: 0, // Будет рассчитан позже
                    isFeatured: false, // Будет определен позже
                    game: 'GENSHIN'
                  }
                })

                bannerImported++
                totalImported++

              } catch (error: any) {
                console.error(`Error importing item ${item.id}:`, error.message)
                continue
              }
            }

            page++
            
            // Защита от бесконечного цикла
            if (page > 100) {
              console.warn(`Reached page limit for ${bannerInfo.name}`)
              break
            }
          }

          bannerStats[bannerInfo.name] = bannerImported
          console.log(`✅ ${bannerInfo.name}: imported ${bannerImported} items`)

        } catch (error: any) {
          console.error(`Error processing ${bannerInfo.name}:`, error.message)
          bannerStats[bannerInfo.name] = 0
        }
      }

      console.log(`📊 Import completed: ${totalImported} imported, ${totalSkipped} skipped`)

      return {
        success: true,
        message: `Successfully imported ${totalImported} Genshin pulls`,
        stats: {
          totalImported,
          totalSkipped,
          bannerStats
        }
      }

    } catch (error: any) {
      console.error('❌ Genshin import error:', error.message)
      return {
        success: false,
        message: error.message,
        stats: {}
      }
    }
  }

  // Получение статистики пользователя по Genshin Impact
  async getGenshinStats(uid: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { uid }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const stats = await prisma.gachaPull.groupBy({
        by: ['bannerId', 'rankType'],
        _count: true,
        where: {
          userId: user.id,
          game: 'GENSHIN'
        }
      })

      const banners = await prisma.banner.findMany({
        where: { game: 'GENSHIN' },
        include: {
          gachaPulls: {
            where: { userId: user.id },
            orderBy: { time: 'desc' },
            take: 1
          }
        }
      })

      return {
        user: {
          uid: user.uid,
          username: user.username
        },
        stats,
        banners
      }

    } catch (error: any) {
      throw new Error(`Failed to get Genshin stats: ${error.message}`)
    }
  }
}

export const genshinImportService = new GenshinImportService()
