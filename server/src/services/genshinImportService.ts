import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { logger } from '../middleware/logger'
import { logImport } from '../utils/importLogger'
import { normalizeItemName, isDuplicatePullInDB } from '../utils/normalizeUtils'

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
    size: number = 20,
    endId: string = '0'
  ): Promise<GenshinGachaItem[]> {
    try {
      const url = `https://${params.host}/gacha_info/api/getGachaLog`
      
      const requestParams = {
        ...params,
        gacha_type: gachaType,
        page: page.toString(),
        size: size.toString()
      }

  // Ensure API returns English names
  requestParams.lang = 'en'

      // Добавляем end_id если он не равен '0'
      if (endId !== '0') {
        requestParams.end_id = endId
      }

      const response = await axios.get<GenshinGachaResponse>(url, {
        params: requestParams,
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
  async importGenshinData(url: string, userId: string): Promise<{
    success: boolean
    message: string
    stats: any
  }> {
    try {
      console.log('🎭 Starting Genshin Impact data import for user ID:', userId)

      // Track import start time to distinguish within-batch vs cross-import duplicates
      const importStartTime = new Date()
      console.log(`⏰ URL Import session started at: ${importStartTime.toISOString()}`)

      const params = this.parseGenshinUrl(url)
      console.log('📊 Parsed URL params:', { ...params, authkey: 'hidden' })

      // Находим пользователя по ID
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
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
          let endId = '0'

          while (hasMore) {
            console.log(`📄 Fetching page ${page} for ${bannerInfo.name}...`)
            
            const items = await this.fetchGachaData(url, params, gachaType, page, 20, endId)
            
            if (items.length === 0) {
              console.log(`[0] Reached page limit for ${bannerInfo.name}`)
              hasMore = false
              break
            }

            // Если получили меньше 20 элементов, это последняя страница
            if (items.length < 20) {
              hasMore = false
            }

            for (const item of items) {
              try {
                // Проверяем дубликаты: точное совпадение нормализованного имени И времени
                // Только из ПРЕДЫДУЩИХ импортов, не из текущего (для обработки 10-pull батчей)
                const normalizedName = normalizeItemName(item.name);
                const itemTime = new Date(item.time);
                const bannerId = `genshin_${gachaType}`;
                
                const isDuplicate = await isDuplicatePullInDB(
                  prisma, 
                  user.id, 
                  normalizedName, 
                  bannerId, 
                  itemTime, 
                  importStartTime // Передаем время начала импорта
                );
                
                if (isDuplicate) {
                  totalSkipped++;
                  console.log(`⏭️ Skipping duplicate: ${item.name} at ${item.time} (normalized: ${normalizedName})`);
                  await logImport({ source: 'URL_IMPORT', action: 'SKIP_DUPLICATE', uid: userId, gachaId: `genshin_${item.id}`, itemName: item.name, bannerId: bannerId });
                  continue;
                }

                // Создаем запись о крутке (сохраняем нормализованное имя для консистентности)
                await prisma.gachaPull.create({
                  data: {
                    userId: user.id,
                    bannerId: bannerId,
                    gachaId: `genshin_${item.id}`,
                    itemName: normalizeItemName(item.name), // Нормализуем имя при сохранении
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
                // Log successful import
                await logImport({ source: 'URL_IMPORT', action: 'IMPORTED', uid: userId, gachaId: `genshin_${item.id}`, itemName: item.name, bannerId: bannerId })

              } catch (error: any) {
                console.error(`Error importing item ${item.id}:`, error.message)
                await logImport({ source: 'URL_IMPORT', action: 'ERROR', uid: userId, itemId: item.id, error: error.message })
                continue
              }
            }

            // Обновляем endId для следующего запроса (используем ID последней записи)
            if (items.length > 0) {
              endId = items[items.length - 1].id
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
  async getGenshinStats(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      })

      if (!user) {
        throw new Error('User not found')
      }

      console.log('Fetching gacha pulls for user ID:', userId)
      console.log('Found user:', user.id, `(${user.uid})`)
      console.log('Searching with where clause:', { userId: user.id })

      // Получаем все крутки пользователя для Genshin Impact
      const pulls = await prisma.gachaPull.findMany({
        where: {
          userId: user.id,
          game: 'GENSHIN'
        },
        include: {
          banner: true
        },
        orderBy: { time: 'desc' }
      })

      console.log('Found', pulls.length, 'pulls')
      console.log('Total pulls count:', pulls.length)

      // Группируем статистику
      const stats = pulls.reduce((acc: any, pull) => {
        const key = `${pull.bannerId}_${pull.rankType}`
        if (!acc[key]) {
          acc[key] = {
            bannerId: pull.bannerId,
            rankType: pull.rankType,
            _count: 0
          }
        }
        acc[key]._count++
        return acc
      }, {})

      // Получаем последние 5-звездочные крутки
      const recentFiveStars = await prisma.gachaPull.findMany({
        where: {
          userId: user.id,
          rankType: 5,
          game: 'GENSHIN'
        },
        include: {
          banner: true
        },
        orderBy: {
          time: 'desc'
        },
        take: 10
      })

      // Преобразуем BigInt в строку для JSON сериализации
      const serializedFiveStars = recentFiveStars.map((pull: any) => ({
        ...pull,
        id: pull.id.toString(),
        time: pull.time.toISOString()
      }))

      // Получаем информацию о баннерах
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

      // Конвертируем результат в JSON-безопасный формат
      const jsonSafeBanners = banners.map(banner => ({
        id: Number(banner.id),
        bannerId: banner.bannerId,
        bannerName: banner.bannerName,
        bannerType: banner.bannerType,
        game: banner.game,
        createdAt: banner.createdAt,
        gachaPulls: banner.gachaPulls.map(pull => ({
          id: Number(pull.id),
          userId: Number(pull.userId),
          bannerId: pull.bannerId,
          gachaId: pull.gachaId,
          itemName: pull.itemName,
          itemType: pull.itemType,
          rankType: pull.rankType,
          time: pull.time,
          game: pull.game,
          createdAt: pull.createdAt
        }))
      }))

      return {
        user: {
          uid: user.uid,
          username: user.username
        },
        stats: Object.values(stats),
        banners: jsonSafeBanners,
        totalPulls: pulls.length,
        recentFiveStars: serializedFiveStars
      }

    } catch (error: any) {
      throw new Error(`Failed to get Genshin stats: ${error.message}`)
    }
  }
}

export const genshinImportService = new GenshinImportService()
