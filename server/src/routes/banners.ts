import { Router } from 'express'
import { bannerImageService } from '../services/bannerImageService'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Получение URL изображения баннера
router.get('/image/:bannerName', (req, res) => {
  try {
    const { bannerName } = req.params
    const imageUrl = bannerImageService.getBannerImageUrl(bannerName)
    
    res.json({
      bannerName,
      imageUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${imageUrl}`
    })
  } catch (error) {
    console.error('Error getting banner image:', error)
    res.status(500).json({ error: 'Failed to get banner image' })
  }
})

// Ручное обновление изображений (требует аутентификации)
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const result = await bannerImageService.manualUpdate()
    
    if (result.success) {
      res.json({
        message: result.message,
        stats: result.stats
      })
    } else {
      res.status(500).json({
        error: result.message
      })
    }
  } catch (error) {
    console.error('Error updating banner images:', error)
    res.status(500).json({ error: 'Failed to update banner images' })
  }
})

// Получение списка доступных изображений баннеров
router.get('/list', async (req, res) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'banners')
    
    if (!fs.existsSync(imagesDir)) {
      return res.json({ banners: [] })
    }

    const files = fs.readdirSync(imagesDir)
    const banners = files
      .filter((file: string) => /\.(webp|png|jpg|jpeg)$/i.test(file))
      .map((file: string) => ({
        filename: file,
        bannerName: file.replace(/\.(webp|png|jpg|jpeg)$/i, '').replace(/-/g, ' '),
        url: `/images/banners/${file}`,
        fullUrl: `${req.protocol}://${req.get('host')}/images/banners/${file}`
      }))

    res.json({ banners })
  } catch (error) {
    console.error('Error listing banner images:', error)
    res.status(500).json({ error: 'Failed to list banner images' })
  }
})

// Статус сервиса изображений баннеров
router.get('/status', (req, res) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'banners')
    let imageCount = 0
    let totalSize = 0

    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir)
      imageCount = files.filter((file: string) => /\.(webp|png|jpg|jpeg)$/i.test(file)).length
      
      files.forEach((file: string) => {
        const filePath = path.join(imagesDir, file)
        const stats = fs.statSync(filePath)
        totalSize += stats.size
      })
    }

    res.json({
      status: 'active',
      imageCount,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      imagesDirectory: imagesDir,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting banner service status:', error)
    res.status(500).json({ error: 'Failed to get service status' })
  }
})

export { router as bannerRouter }
