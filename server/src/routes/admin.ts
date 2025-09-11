import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { category, game } = req.body
    let uploadPath = path.join(process.cwd(), '../client/public/images/static')
    
    // Определяем подпапку в зависимости от категории
    if (category === 'banner') {
      uploadPath = path.join(uploadPath, 'banners')
    } else if (category === 'character') {
      uploadPath = path.join(uploadPath, 'characters')
    } else if (category === 'weapon') {
      uploadPath = path.join(uploadPath, 'weapons')
    }
    
    // Создаем папку если не существует
    try {
      await fs.mkdir(uploadPath, { recursive: true })
    } catch (error) {
      console.error('Error creating directory:', error)
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const { itemName, game } = req.body
    
    if (itemName && game) {
      // Для старого API загрузки с itemName и game
      const ext = path.extname(file.originalname)
      const safeName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const filename = `${game.toLowerCase()}_${safeName}${ext}`
      cb(null, filename)
    } else {
      // Для случаев без itemName - используем оригинальное имя
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, safeName)
    }
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'))
    }
  }
})

// Получить все изображения из static папки
router.get('/images', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    const images = await scanDirectory(staticPath, staticPath)
    
    res.json({
      success: true,
      images: images
    })
  } catch (error: any) {
    console.error('Error scanning images:', error)
    res.status(500).json({ error: 'Failed to scan images' })
  }
})

// Функция для рекурсивного сканирования директории
async function scanDirectory(dirPath: string, basePath: string): Promise<any[]> {
  const items = []
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.relative(basePath, fullPath).replace(/\\\\/g, '/')
      
      if (entry.isDirectory()) {
        const subItems = await scanDirectory(fullPath, basePath)
        items.push({
          type: 'folder',
          name: entry.name,
          path: relativePath,
          children: subItems
        })
      } else if (entry.isFile() && /\\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        const stats = await fs.stat(fullPath)
        items.push({
          type: 'file',
          name: entry.name,
          path: relativePath,
          size: stats.size,
          modified: stats.mtime
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }
  
  return items
}

// Загрузить новое изображение
router.post('/images/upload', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { category, game, itemName, description } = req.body

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        category,
        game,
        itemName,
        description
      }
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// Удалить изображение
router.delete('/images/:imagePath', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { imagePath } = req.params
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    const fullPath = path.join(staticPath, imagePath)
    
    // Проверяем, что файл находится в папке static (безопасность)
    if (!fullPath.startsWith(staticPath)) {
      return res.status(400).json({ error: 'Invalid file path' })
    }
    
    await fs.unlink(fullPath)
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting image:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// Переименовать изображение
router.put('/images/:imagePath/rename', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { imagePath } = req.params
    const { newName } = req.body
    
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    const oldPath = path.join(staticPath, imagePath)
    const newPath = path.join(path.dirname(oldPath), newName)
    
    // Проверяем, что файлы находятся в папке static
    if (!oldPath.startsWith(staticPath) || !newPath.startsWith(staticPath)) {
      return res.status(400).json({ error: 'Invalid file path' })
    }
    
    await fs.rename(oldPath, newPath)
    
    res.json({
      success: true,
      message: 'Image renamed successfully',
      newPath: path.relative(staticPath, newPath).replace(/\\\\/g, '/')
    })
  } catch (error: any) {
    console.error('Error renaming image:', error)
    res.status(500).json({ error: 'Failed to rename image' })
  }
})

// Создать новую папку
router.post('/images/folder', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { folderPath, folderName } = req.body
    
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    const newFolderPath = path.join(staticPath, folderPath, folderName)
    
    // Проверяем, что папка создается в static
    if (!newFolderPath.startsWith(staticPath)) {
      return res.status(400).json({ error: 'Invalid folder path' })
    }
    
    await fs.mkdir(newFolderPath, { recursive: true })
    
    res.json({
      success: true,
      message: 'Folder created successfully'
    })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    res.status(500).json({ error: 'Failed to create folder' })
  }
})

// Получить список изображений в табличном формате
router.get('/images/table', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    
    const getImagesList = async (dir: string, basePath: string = ''): Promise<any[]> => {
      const items: any[] = []
      
      try {
        const files = await fs.readdir(dir)
        
        for (const file of files) {
          const fullPath = path.join(dir, file)
          const stat = await fs.stat(fullPath)
          const relativePath = path.join(basePath, file).replace(/\\/g, '/')
          
          if (stat.isDirectory()) {
            // Рекурсивно получаем содержимое папки
            const subItems = await getImagesList(fullPath, relativePath)
            items.push(...subItems)
          } else if (file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            items.push({
              id: relativePath,
              name: file,
              path: relativePath,
              folder: basePath || '/',
              size: stat.size,
              modified: stat.mtime,
              type: 'image'
            })
          }
        }
      } catch (error) {
        console.error('Error reading directory:', error)
      }
      
      return items
    }
    
    const images = await getImagesList(staticPath)
    
    res.json({
      success: true,
      images
    })
  } catch (error: any) {
    console.error('Error getting images table:', error)
    res.status(500).json({ error: 'Failed to get images table' })
  }
})

// Обновить путь изображения для предмета
router.put('/mappings/:id/image', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    const { imagePath } = req.body
    
    await prisma.itemNameMapping.update({
      where: { id: parseInt(id) },
      data: { imagePath }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Image path updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating image path:', error)
    res.status(500).json({ error: 'Failed to update image path' })
  }
})

// Обновить путь изображения для баннера
router.put('/banners/:id/image', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    const { imagePath } = req.body
    
    await prisma.banner.update({
      where: { id: parseInt(id) },
      data: { imagePath }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Banner image updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating banner image:', error)
    res.status(500).json({ error: 'Failed to update banner image' })
  }
})

// Отвязать изображение от предмета
router.delete('/mappings/:id/image', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    
    await prisma.itemNameMapping.update({
      where: { id: parseInt(id) },
      data: { 
        imagePath: null as any
      }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Image unlinked from mapping successfully'
    })
  } catch (error: any) {
    console.error('Error removing mapping image:', error)
    res.status(500).json({ error: 'Failed to remove mapping image' })
  }
})

// Отвязать изображение от баннера
router.delete('/banners/:id/image', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    
    await prisma.banner.update({
      where: { id: parseInt(id) },
      data: { 
        imagePath: null as any
      }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Image unlinked from banner successfully'
    })
  } catch (error: any) {
    console.error('Error removing banner image:', error)
    res.status(500).json({ error: 'Failed to remove banner image' })
  }
})

// Получить список баннеров для управления
router.get('/banners', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { page = '1', limit = '20', game, search } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum
    
    let whereClause: any = {}
    
    if (game && game !== 'all') {
      whereClause.game = (game as string).toUpperCase()
    }
    
    if (search) {
      whereClause.OR = [
        { bannerName: { contains: search as string } },
        { bannerId: { contains: search as string } }
      ]
    }
    
    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where: whereClause,
        orderBy: [
          { game: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limitNum,
        include: {
          _count: {
            select: {
              gachaPulls: true
            }
          }
        }
      }),
      prisma.banner.count({ where: whereClause })
    ])
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      banners,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error: any) {
    console.error('Error getting banners:', error)
    res.status(500).json({ error: 'Failed to get banners' })
  }
})

// Получить системную статистику
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const stats = {
      users: await prisma.user.count(),
      admins: 0, // TODO: Будет работать после обновления Prisma
      banners: await prisma.banner.count(),
      pulls: await prisma.gachaPull.count(),
      mappings: await prisma.itemNameMapping.count(),
      games: {
        HSR: await prisma.gachaPull.count({ where: { game: 'HSR' } }),
        GENSHIN: await prisma.gachaPull.count({ where: { game: 'GENSHIN' } })
      }
    }
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Управление переводами
// Получить все переводы
router.get('/mappings', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { page = '1', limit = '50', game, search } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum
    
    let whereClause: any = {}
    
    if (game && game !== 'all') {
      whereClause.game = (game as string).toUpperCase()
    }
    
    if (search) {
      whereClause.OR = [
        { englishName: { contains: search as string } },
        { russianName: { contains: search as string } }
      ]
    }
    
    const [mappings, total] = await Promise.all([
      prisma.itemNameMapping.findMany({
        where: whereClause,
        orderBy: [
          { game: 'asc' },
          { itemType: 'asc' },
          { englishName: 'asc' }
        ],
        skip: offset,
        take: limitNum
      }),
      prisma.itemNameMapping.count({ where: whereClause })
    ])
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      mappings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error: any) {
    console.error('Error getting mappings:', error)
    res.status(500).json({ error: 'Failed to get mappings' })
  }
})

// Добавить новый перевод
router.post('/mappings', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { englishName, russianName, game, itemType, rarity } = req.body
    
    if (!englishName || !russianName || !game || !itemType || !rarity) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    
    const mapping = await prisma.itemNameMapping.create({
      data: {
        englishName: englishName.toLowerCase(),
        russianName,
        game: game.toUpperCase(),
        itemType,
        rarity: parseInt(rarity)
      }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      mapping,
      message: 'Mapping created successfully'
    })
  } catch (error: any) {
    console.error('Error creating mapping:', error)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Mapping already exists' })
    } else {
      res.status(500).json({ error: 'Failed to create mapping' })
    }
  }
})

// Обновить перевод
router.put('/mappings/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    const { englishName, russianName, game, itemType, rarity } = req.body
    
    const mapping = await prisma.itemNameMapping.update({
      where: { id: parseInt(id) },
      data: {
        englishName: englishName?.toLowerCase(),
        russianName,
        game: game?.toUpperCase(),
        itemType,
        rarity: rarity ? parseInt(rarity) : undefined
      }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      mapping,
      message: 'Mapping updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating mapping:', error)
    res.status(500).json({ error: 'Failed to update mapping' })
  }
})

// Удалить перевод
router.delete('/mappings/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    
    await prisma.itemNameMapping.delete({
      where: { id: parseInt(id) }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Mapping deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting mapping:', error)
    res.status(500).json({ error: 'Failed to delete mapping' })
  }
})

// Получить список пользователей
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            gachaPulls: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as any[] // Временно используем any
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      users
    })
  } catch (error: any) {
    console.error('Error getting users:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Изменить пароль пользователя
router.put('/users/:id/password', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const bcrypt = await import('bcrypt')
    
    const { id } = req.params
    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating password:', error)
    res.status(500).json({ error: 'Failed to update password' })
  }
})

// Изменить роль пользователя
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    const { role } = req.body
    
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    
    // Не позволяем изменить роль самому себе
    if (parseInt(id) === req.user?.id) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }
    
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'Role updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating role:', error)
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// Заблокировать/разблокировать пользователя
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    const { isActive } = req.body
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Invalid status' })
    }
    
    // Не позволяем заблокировать самого себя
    if (parseInt(id) === req.user?.id) {
      return res.status(400).json({ error: 'Cannot change your own status' })
    }
    
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive }
    })
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error: any) {
    console.error('Error updating status:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// Удалить пользователя
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    
    // Не позволяем удалить самого себя
    if (parseInt(id) === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }
    
    // Удаляем пользователя и все его данные
    await prisma.$transaction([
      prisma.gachaPull.deleteMany({
        where: { userId: parseInt(id) }
      }),
      prisma.user.delete({
        where: { id: parseInt(id) }
      })
    ])
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Получить статистику пользователя
router.get('/users/:id/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const { id } = req.params
    
    const [user, pullStats, bannerStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          uid: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.gachaPull.groupBy({
        by: ['rankType', 'game'],
        where: { userId: parseInt(id) },
        _count: true
      }),
      prisma.gachaPull.groupBy({
        by: ['itemType', 'game'],
        where: { userId: parseInt(id) },
        _count: true
      })
    ])
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    await prisma.$disconnect()
    
    res.json({
      success: true,
      user,
      stats: {
        pullStats,
        bannerStats
      }
    })
  } catch (error: any) {
    console.error('Error getting user stats:', error)
    res.status(500).json({ error: 'Failed to get user stats' })
  }
})

// Создаем специальный multer для админской загрузки
const adminStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { folder } = req.body
    let uploadPath = path.join(process.cwd(), '../client/public/images/static')
    
    if (folder && folder !== '/') {
      uploadPath = path.join(uploadPath, folder)
    }
    
    try {
      await fs.mkdir(uploadPath, { recursive: true })
    } catch (error) {
      console.error('Error creating directory:', error)
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Сохраняем оригинальное имя файла, но делаем его безопасным
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, safeName)
  }
})

const adminUpload = multer({ 
  storage: adminStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// Загрузка изображений через админку
router.post('/images/upload', authenticateToken, requireAdmin, adminUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { folder } = req.body
    const relativePath = folder && folder !== '/' 
      ? path.join(folder, req.file.filename).replace(/\\\\/g, '/')
      : req.file.filename

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: req.file.filename,
        path: relativePath,
        size: req.file.size
      }
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// Получить структуру папок
router.get('/images/folders', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    
    const getFolderStructure = async (dir: string): Promise<string[]> => {
      const folders: string[] = []
      
      try {
        const files = await fs.readdir(dir)
        
        for (const file of files) {
          const fullPath = path.join(dir, file)
          const stat = await fs.stat(fullPath)
          
          if (stat.isDirectory()) {
            folders.push(file)
          }
        }
      } catch (error) {
        console.error('Error reading directory:', error)
      }
      
      return folders.sort()
    }

    const folders = await getFolderStructure(staticPath)
    
    res.json({
      success: true,
      folders: {
        '/': folders
      }
    })
  } catch (error: any) {
    console.error('Error getting folder structure:', error)
    res.status(500).json({ error: 'Failed to get folder structure' })
  }
})

// Удаление изображения
router.delete('/images/:imagePath(*)', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const imagePath = req.params.imagePath
    const fullPath = path.join(process.cwd(), '../client/public/images/static', imagePath)
    
    // Проверяем, что файл существует и находится в разрешенной директории
    const staticPath = path.join(process.cwd(), '../client/public/images/static')
    const resolvedPath = path.resolve(fullPath)
    const resolvedStaticPath = path.resolve(staticPath)
    
    if (!resolvedPath.startsWith(resolvedStaticPath)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    try {
      await fs.access(fullPath)
      await fs.unlink(fullPath)
      
      res.json({
        success: true,
        message: 'Image deleted successfully'
      })
    } catch (error) {
      res.status(404).json({ error: 'File not found' })
    }
  } catch (error: any) {
    console.error('Error deleting image:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

export default router
