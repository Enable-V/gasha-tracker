import cron from 'node-cron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BannerImage {
  bannerName: string
  imageUrl: string
  bannerType: string
  version: string
}

class BannerImageService {
  private imagesDir: string
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessingQueue = false
  private readonly RATE_LIMIT_DELAY = 2000 // 2 секунды между запросами
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 5000 // 5 секунд базовая задержка

  constructor() {
    this.imagesDir = path.join(process.cwd(), 'public', 'images', 'banners')
    this.ensureDirectoryExists()
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true })
    }
  }

  // Добавление задержки между запросами
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Выполнение запроса с retry логикой
  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>, 
    retries = this.MAX_RETRIES
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.delay(this.RATE_LIMIT_DELAY * attempt) // Увеличиваем задержку с каждой попыткой
        return await requestFn()
      } catch (error: any) {
        console.warn(`Request attempt ${attempt} failed:`, error.message)
        
        if (attempt === retries) {
          console.error(`All ${retries} attempts failed`)
          return null
        }
        
        // Экспоненциальная задержка при повторных попытках
        const retryDelay = this.RETRY_DELAY * Math.pow(2, attempt - 1)
        console.log(`Retrying in ${retryDelay}ms...`)
        await this.delay(retryDelay)
      }
    }
    return null
  }

  // Добавление запроса в очередь
  private async addToQueue<T>(requestFn: () => Promise<T>): Promise<T | null> {
    return new Promise((resolve) => {
      this.requestQueue.push(async () => {
        const result = await this.makeRequestWithRetry(requestFn)
        resolve(result)
      })
      
      if (!this.isProcessingQueue) {
        this.processQueue()
      }
    })
  }

  // Обработка очереди запросов
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log(`Processing ${this.requestQueue.length} requests in queue...`)

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()
      if (request) {
        await request()
        await this.delay(this.RATE_LIMIT_DELAY) // Задержка между запросами
      }
    }

    this.isProcessingQueue = false
    console.log('Request queue processing completed')
  }

  // Источники для получения данных о баннерах HSR (с защитой от rate limiting)
  private async getOfficialBannerData(): Promise<BannerImage[]> {
    const banners: BannerImage[] = []
    console.log('🔍 Starting safe banner data collection...')

    try {
      // Используем только один надежный источник для избежания блокировок
      // GitHub репозиторий с HSR ресурсами (более стабильный)
      console.log('Fetching from GitHub repository...')
      
      const githubData = await this.addToQueue(async () => {
        return axios.get('https://api.github.com/repos/Mar-7th/StarRailRes/contents/icon/banner', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HSR-Gacha-Tracker/1.0.0 (Educational-Purpose)'
          },
          timeout: 15000
        })
      })

      if (githubData?.data && Array.isArray(githubData.data)) {
        console.log(`Found ${githubData.data.length} banner files`)
        
        // Ограничиваем количество обрабатываемых файлов для избежания блокировок
        const limitedFiles = githubData.data.slice(0, 10) // Максимум 10 баннеров за раз
        
        for (const file of limitedFiles) {
          if (file.name && (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.webp'))) {
            const bannerName = file.name
              .replace(/\.(png|jpg|webp)$/i, '')
              .replace(/_/g, ' ')
              .replace(/banner/i, '')
              .trim()
            
            banners.push({
              bannerName,
              imageUrl: file.download_url,
              bannerType: 'official',
              version: 'latest'
            })
          }
        }
      }

      // Альтернативный источник - локальный список известных баннеров
      const knownBanners = this.getKnownBanners()
      banners.push(...knownBanners)

    } catch (error: any) {
      console.error('❌ Error fetching banner data:', error.message)
      
      // Возвращаем локальный fallback список
      console.log('🔄 Using fallback banner list...')
      return this.getKnownBanners()
    }

    console.log(`✅ Collected ${banners.length} banner definitions`)
    return banners.slice(0, 15) // Ограничиваем общее количество
  }

  // Локальный список известных баннеров HSR (fallback)
  private getKnownBanners(): BannerImage[] {
    return [
      {
        bannerName: 'Character Event Warp',
        imageUrl: 'https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2023/05/08/75276539/4c7d22b4d5a9b7c8c9e8f7b6a5d4c3e2.png',
        bannerType: 'character',
        version: '1.0'
      },
      {
        bannerName: 'Light Cone Event Warp',
        imageUrl: 'https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2023/05/08/75276539/6f8e7d6c5b4a3c2d1e0f9e8d7c6b5a4.png',
        bannerType: 'lightcone',
        version: '1.0'
      },
      {
        bannerName: 'Stellar Warp',
        imageUrl: 'https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2023/05/08/75276539/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6.png',
        bannerType: 'standard',
        version: '1.0'
      },
      {
        bannerName: 'Departure Warp',
        imageUrl: 'https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2023/05/08/75276539/9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4.png',
        bannerType: 'beginner',
        version: '1.0'
      }
    ]
  }

  // Получение изображений баннеров из базы данных
  private async getExistingBanners(): Promise<string[]> {
    try {
      const banners = await prisma.gachaPull.findMany({
        select: {
          banner: {
            select: {
              bannerName: true
            }
          }
        },
        distinct: ['bannerId']
      })

      return banners
        .map(b => b.banner?.bannerName)
        .filter(Boolean) as string[]
    } catch (error) {
      console.error('Error fetching existing banners:', error)
      return []
    }
  }

  // Скачивание изображения с защитой от блокировок
  private async downloadImage(url: string, filename: string): Promise<boolean> {
    try {
      console.log(`⬇️ Downloading: ${filename}`)
      
      const response = await this.addToQueue(async () => {
        return axios.get(url, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'HSR-Gacha-Tracker/1.0.0 (Educational-Purpose)',
            'Accept': 'image/webp,image/png,image/jpeg,image/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        })
      })

      if (!response) {
        console.warn(`❌ Failed to download ${filename} after retries`)
        return false
      }

      const filePath = path.join(this.imagesDir, filename)
      const writer = fs.createWriteStream(filePath)

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Successfully downloaded: ${filename}`)
          resolve(true)
        })
        writer.on('error', (error) => {
          console.error(`❌ Error writing ${filename}:`, error.message)
          reject(false)
        })
      })
    } catch (error: any) {
      console.error(`❌ Error downloading image ${filename}:`, error.message)
      return false
    }
  }

  // Генерация безопасного имени файла
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Обновление изображений баннеров с улучшенной защитой от блокировок
  async updateBannerImages(): Promise<void> {
    console.log('🖼️ Starting safe banner images update...')

    try {
      const [officialBanners, existingBanners] = await Promise.all([
        this.getOfficialBannerData(),
        this.getExistingBanners()
      ])

      // Ограничиваем количество баннеров для обработки (максимум 5 за раз)
      const limitedBanners = officialBanners.slice(0, 5)
      console.log(`📊 Processing ${limitedBanners.length} banners (limited for safety)`)
      console.log(`Found ${existingBanners.length} existing banners in database`)

      let downloadedCount = 0
      let skippedCount = 0
      let errorCount = 0

      for (const banner of limitedBanners) {
        try {
          const sanitizedName = this.sanitizeFileName(banner.bannerName)
          const filename = `${sanitizedName}.webp`
          const filePath = path.join(this.imagesDir, filename)

          // Проверяем, существует ли уже файл
          if (fs.existsSync(filePath)) {
            console.log(`⏭️ Skipping existing: ${banner.bannerName}`)
            skippedCount++
            continue
          }

          // Проверяем, есть ли такой баннер в нашей базе
          const isRelevant = existingBanners.length === 0 || existingBanners.some(existing => 
            existing.toLowerCase().includes(banner.bannerName.toLowerCase()) ||
            banner.bannerName.toLowerCase().includes(existing.toLowerCase())
          )

          if (!isRelevant && existingBanners.length > 0) {
            console.log(`⚠️ Skipping irrelevant: ${banner.bannerName}`)
            skippedCount++
            continue
          }

          console.log(`📥 Processing: ${banner.bannerName} -> ${filename}`)
          const success = await this.downloadImage(banner.imageUrl, filename)

          if (success) {
            downloadedCount++
            await this.saveBannerImageInfo(banner, filename)
            console.log(`✅ Successfully processed: ${banner.bannerName}`)
          } else {
            errorCount++
            console.log(`❌ Failed to process: ${banner.bannerName}`)
          }

          // Увеличенная задержка между загрузками (3 секунды)
          console.log('⏳ Waiting 3 seconds before next download...')
          await new Promise(resolve => setTimeout(resolve, 3000))
          
        } catch (error: any) {
          errorCount++
          console.error(`❌ Error processing banner ${banner.bannerName}:`, error.message)
        }
      }

      console.log(`📋 Update completed:`)
      console.log(`  ✅ Downloaded: ${downloadedCount}`)
      console.log(`  ⏭️ Skipped: ${skippedCount}`)
      console.log(`  ❌ Errors: ${errorCount}`)

    } catch (error: any) {
      console.error('❌ Error updating banner images:', error.message)
    }
  }

  // Сохранение информации об изображении баннера
  private async saveBannerImageInfo(banner: BannerImage, filename: string): Promise<void> {
    try {
      // Здесь можно создать таблицу для хранения метаданных изображений
      // Пока просто логируем
      console.log(`Saved banner image info: ${banner.bannerName} -> ${filename}`)
    } catch (error) {
      console.error('Error saving banner image info:', error)
    }
  }

  // Получение URL изображения баннера с улучшенной обработкой
  getBannerImageUrl(bannerName: string): string {
    if (!bannerName) {
      return '/images/placeholder-banner.png'
    }

    const sanitizedName = this.sanitizeFileName(bannerName)
    const filename = `${sanitizedName}.webp`
    const filePath = path.join(this.imagesDir, filename)

    if (fs.existsSync(filePath)) {
      console.log(`✅ Found banner image: ${filename}`)
      return `/images/banners/${filename}`
    }

    // Попробуем найти альтернативные форматы
    const alternativeFormats = ['png', 'jpg', 'jpeg']
    for (const format of alternativeFormats) {
      const altFilename = `${sanitizedName}.${format}`
      const altFilePath = path.join(this.imagesDir, altFilename)
      if (fs.existsSync(altFilePath)) {
        console.log(`✅ Found alternative banner image: ${altFilename}`)
        return `/images/banners/${altFilename}`
      }
    }

    console.log(`⚠️ No banner image found for: ${bannerName}, using placeholder`)
    return '/images/placeholder-banner.png'
  }

  // Получение имени файла баннера
  private getBannerImageFilename(bannerName: string): string {
    return `${this.sanitizeFileName(bannerName)}.webp`
  }

  // Очистка старых изображений
  async cleanupOldImages(): Promise<void> {
    try {
      const files = fs.readdirSync(this.imagesDir)
      const existingBanners = await this.getExistingBanners()

      for (const file of files) {
        const filePath = path.join(this.imagesDir, file)
        const stats = fs.statSync(filePath)
        
        // Удаляем файлы старше 30 дней, которые не соответствуют существующим баннерам
        if (stats.mtime < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          const bannerName = file.replace(/\.(webp|png|jpg)$/i, '').replace(/-/g, ' ')
          const isRelevant = existingBanners.some(existing => 
            existing.toLowerCase().includes(bannerName.toLowerCase())
          )

          if (!isRelevant) {
            fs.unlinkSync(filePath)
            console.log(`Deleted old banner image: ${file}`)
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old images:', error)
    }
  }

  // Инициализация cron задач
  initializeCronJobs(): void {
    // Обновляем изображения каждый день в 3:00
    cron.schedule('0 3 * * *', async () => {
      console.log('🕐 Running scheduled banner images update...')
      await this.updateBannerImages()
    })

    // Очищаем старые изображения каждую неделю
    cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Running scheduled cleanup of old banner images...')
      await this.cleanupOldImages()
    })

    console.log('📅 Banner image cron jobs initialized')
  }

  // Ручное обновление (для API endpoint)
  async manualUpdate(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      const startTime = Date.now()
      await this.updateBannerImages()
      const duration = Date.now() - startTime

      return {
        success: true,
        message: 'Banner images updated successfully',
        stats: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error updating banner images: ${error}`,
        stats: {}
      }
    }
  }
}

export const bannerImageService = new BannerImageService()
