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

  constructor() {
    this.imagesDir = path.join(process.cwd(), 'public', 'images', 'banners')
    this.ensureDirectoryExists()
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true })
    }
  }

  // Источники для получения данных о баннерах HSR
  private async getOfficialBannerData(): Promise<BannerImage[]> {
    const banners: BannerImage[] = []

    try {
      // 1. HoYoLAB API (неофициальный, но стабильный)
      const hoyolabResponse = await axios.get('https://bbs-api-os.hoyolab.com/game_record/hkrpg/api/avatar/basic', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      // 2. Enka.Network API для HSR данных
      const enkaResponse = await axios.get('https://api.hakush.in/hsr/data/en/banners.json', {
        timeout: 10000
      })

      if (enkaResponse.data) {
        Object.values(enkaResponse.data).forEach((banner: any) => {
          if (banner.name && banner.image) {
            banners.push({
              bannerName: banner.name,
              imageUrl: banner.image,
              bannerType: banner.type || 'unknown',
              version: banner.version || '1.0'
            })
          }
        })
      }

      // 3. GitHub репозиторий с HSR ресурсами
      const githubResponse = await axios.get('https://api.github.com/repos/Mar-7th/StarRailRes/contents/icon/banner', {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      })

      if (Array.isArray(githubResponse.data)) {
        githubResponse.data.forEach((file: any) => {
          if (file.name.endsWith('.png') || file.name.endsWith('.jpg')) {
            const bannerName = file.name.replace(/\.(png|jpg)$/i, '').replace(/_/g, ' ')
            banners.push({
              bannerName,
              imageUrl: file.download_url,
              bannerType: 'github',
              version: 'latest'
            })
          }
        })
      }

    } catch (error) {
      console.error('Error fetching banner data:', error)
    }

    return banners
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

  // Скачивание изображения
  private async downloadImage(url: string, filename: string): Promise<boolean> {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const filePath = path.join(this.imagesDir, filename)
      const writer = fs.createWriteStream(filePath)

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(true))
        writer.on('error', reject)
      })
    } catch (error) {
      console.error(`Error downloading image ${filename}:`, error)
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

  // Обновление изображений баннеров
  async updateBannerImages(): Promise<void> {
    console.log('🖼️ Starting banner images update...')

    try {
      const [officialBanners, existingBanners] = await Promise.all([
        this.getOfficialBannerData(),
        this.getExistingBanners()
      ])

      console.log(`Found ${officialBanners.length} official banners and ${existingBanners.length} existing banners`)

      let downloadedCount = 0
      let skippedCount = 0

      for (const banner of officialBanners) {
        const sanitizedName = this.sanitizeFileName(banner.bannerName)
        const filename = `${sanitizedName}.webp`
        const filePath = path.join(this.imagesDir, filename)

        // Проверяем, существует ли уже файл
        if (fs.existsSync(filePath)) {
          skippedCount++
          continue
        }

        // Проверяем, есть ли такой баннер в нашей базе
        const isRelevant = existingBanners.some(existing => 
          existing.toLowerCase().includes(banner.bannerName.toLowerCase()) ||
          banner.bannerName.toLowerCase().includes(existing.toLowerCase())
        )

        if (!isRelevant && existingBanners.length > 0) {
          continue // Пропускаем баннеры, которых нет в нашей базе
        }

        console.log(`Downloading: ${banner.bannerName} -> ${filename}`)
        const success = await this.downloadImage(banner.imageUrl, filename)

        if (success) {
          downloadedCount++
          // Создаем запись в базе данных о загруженном изображении
          await this.saveBannerImageInfo(banner, filename)
        }

        // Небольшая задержка между загрузками
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log(`✅ Banner images update completed. Downloaded: ${downloadedCount}, Skipped: ${skippedCount}`)

    } catch (error) {
      console.error('❌ Error updating banner images:', error)
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

  // Получение URL изображения баннера
  getBannerImageUrl(bannerName: string): string {
    const sanitizedName = this.sanitizeFileName(bannerName)
    const filename = `${sanitizedName}.webp`
    const filePath = path.join(this.imagesDir, filename)

    if (fs.existsSync(filePath)) {
      return `/images/banners/${filename}`
    }

    // Возвращаем placeholder или дефолтное изображение
    return '/images/placeholder-banner.png'
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
