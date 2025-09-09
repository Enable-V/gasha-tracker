import { Router, Request, Response } from 'express'
import multer from 'multer'
import { genshinImportService } from '../services/genshinImportService'
import { authenticateToken, requireOwnership } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'
import { logImport } from '../utils/importLogger'
import { normalizeItemName, isDuplicatePullInDB } from '../utils/normalizeUtils'

const router = Router()
const prisma = new PrismaClient()

// Глобальный объект для отслеживания прогресса загрузки Genshin
const genshinUploadProgress: { [key: string]: {
  progress: number,
  message: string,
  completed: boolean,
  imported: number,
  skipped: number,
  errors: number,
  total: number,
  currentItem?: string
} } = {}

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true)
    } else {
      cb(new Error('Only JSON files are allowed'))
    }
  }
})

// Импорт данных Genshin Impact для текущего пользователя
router.post('/import', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { gachaUrl } = req.body

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const userId = req.user.id;
    console.log(`🌐 Starting Genshin URL import for user ID: ${userId}`)
    console.log(`🔗 URL: ${gachaUrl.substring(0, 50)}...`)

    if (!gachaUrl) {
      return res.status(400).json({ error: 'Genshin Impact gacha URL is required' })
    }

    // Генерируем уникальный ID для отслеживания прогресса
    const uploadId = `genshin_url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Инициализируем прогресс
    genshinUploadProgress[uploadId] = {
      progress: 0,
      message: 'Начинаем импорт данных...',
      completed: false,
      imported: 0,
      skipped: 0,
      errors: 0,
      total: 0
    }

    // Автоматическая очистка прогресса через 30 секунд
    setTimeout(() => {
      delete genshinUploadProgress[uploadId]
    }, 30000)

    console.log(`🚀 Starting Genshin data import process...`)
    
    // Запускаем процесс в фоновом режиме
    genshinImportService.importGenshinData(gachaUrl, userId.toString(), (progress: number, message: string, imported?: number, skipped?: number, errors?: number, total?: number, currentItem?: string) => {
      genshinUploadProgress[uploadId] = {
        progress,
        message,
        completed: false,
        imported: imported || 0,
        skipped: skipped || 0,
        errors: errors || 0,
        total: total || 0,
        currentItem
      }
    }).then((result) => {
      // Завершаем прогресс
      genshinUploadProgress[uploadId] = {
        progress: 100,
        message: 'Импорт завершен!',
        completed: true,
        imported: result.stats?.totalImported || 0,
        skipped: result.stats?.totalSkipped || 0,
        errors: 0,
        total: (result.stats?.totalImported || 0) + (result.stats?.totalSkipped || 0)
      }
    }).catch((error) => {
      console.error('Error importing Genshin data:', error);
      genshinUploadProgress[uploadId] = {
        progress: 0,
        message: 'Ошибка при импорте данных',
        completed: true,
        imported: 0,
        skipped: 0,
        errors: 1,
        total: 0
      };
    });

    res.json({
      message: 'Import started successfully',
      uploadId
    })

  } catch (error: any) {
    console.error('Error importing Genshin data:', error)
    res.status(500).json({ error: 'Failed to import Genshin data' })
  }
})

// Получение прогресса загрузки Genshin
router.get('/progress/:uploadId', authenticateToken, (req: Request, res: Response) => {
  const { uploadId } = req.params
  const progress = genshinUploadProgress[uploadId]

  if (!progress) {
    return res.status(404).json({ error: 'Upload not found' })
  }

  res.json(progress)
})

// Получение статистики текущего пользователя по Genshin Impact
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const userId = req.user.id;
        const stats = await genshinImportService.getGenshinStats(userId.toString())
    res.json(stats)

  } catch (error: any) {
    console.error('Error getting Genshin stats:', error)
    res.status(500).json({ error: 'Failed to get Genshin stats' })
  }
})

// Получение URL для Genshin Impact (выполнение PowerShell скрипта)
router.post('/get-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { region } = req.body // 'global' или 'china'
    
    // Здесь будет логика выполнения PowerShell скрипта
    // Пока возвращаем инструкции для пользователя
    res.json({
      message: 'Please run the PowerShell script to get your Genshin Impact wish history URL',
      instructions: [
        '1. Close Genshin Impact if it\'s running',
        '2. Open Genshin Impact and go to Wish History',
        '3. Run the PowerShell script: scripts/get-genshin-url.ps1',
        '4. Copy the URL that appears',
        '5. Paste it back into the import form'
      ],
      scriptPath: 'scripts/get-genshin-url.ps1'
    })

  } catch (error: any) {
    console.error('Error getting Genshin URL:', error)
    res.status(500).json({ error: 'Failed to get Genshin URL' })
  }
})

// Очистка всех круток Genshin Impact для текущего пользователя
router.delete('/clear-pulls', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const user = req.user!
    const userId = req.user.id;

    // Удаляем все крутки Genshin для пользователя
    const deleteResult = await prisma.gachaPull.deleteMany({
      where: {
        userId: user.id,
        game: 'GENSHIN'
      }
    })

    // Также удаляем связанные UserStats для Genshin
    await prisma.userStats.deleteMany({
      where: {
        userId: user.id,
        game: 'GENSHIN'
      }
    })

    console.log(`Cleared ${deleteResult.count} Genshin pulls for user ${userId}`)
    res.json({
      message: `Successfully cleared ${deleteResult.count} Genshin Impact pulls`,
      deletedCount: deleteResult.count
    })

  } catch (error: any) {
    console.error('Error clearing Genshin pulls:', error)
    res.status(500).json({ error: 'Failed to clear Genshin pulls' })
  }
})

// Импорт данных Genshin Impact из JSON файла (paimon-moe формат) для текущего пользователя
router.post('/import/json', authenticateToken, upload.single('gachaFile'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const user = req.user!
    const userId = req.user.id;

    let jsonData
    try {
      jsonData = JSON.parse(req.file.buffer.toString())
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' })
    }

    console.log(`📁 Processing paimon-moe Genshin JSON file for user ID: ${userId}`)
    console.log(`🔍 Detected paimon-moe format, starting data conversion...`)

    // Проверяем формат файла
    if (!isPaimonMoeFormat(jsonData)) {
      return res.status(400).json({ error: 'Invalid paimon-moe format. Please upload a valid paimon-moe JSON file.' })
    }

    // Генерируем уникальный ID для отслеживания прогресса
    const uploadId = `genshin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Инициализируем прогресс
    genshinUploadProgress[uploadId] = {
      progress: 0,
      message: 'Начинаем обработку файла...',
      completed: false,
      imported: 0,
      skipped: 0,
      errors: 0,
      total: 0
    }

    // Автоматическая очистка прогресса через 30 секунд
    setTimeout(() => {
      delete genshinUploadProgress[uploadId]
    }, 30000)

    console.log(`🚀 Processing paimon-moe JSON data for user ID: ${userId}`)

    // Запускаем асинхронную обработку
    processPaimonMoeData(prisma, user.id, userId.toString(), jsonData, uploadId).then((result) => {
      // Завершаем прогресс
      genshinUploadProgress[uploadId] = {
        progress: 100,
        message: 'Обработка завершена!',
        completed: true,
        imported: result.imported || 0,
        skipped: result.skipped || 0,
        errors: result.errors || 0,
        total: result.total || 0
      };
    }).catch((error) => {
      console.error('Error processing Genshin JSON data:', error);
      genshinUploadProgress[uploadId] = {
        progress: 100,
        message: 'Ошибка при обработке данных',
        completed: true,
        imported: 0,
        skipped: 0,
        errors: 1,
        total: 0
      };
    });

    res.json({
      message: 'Processing started',
      uploadId
    });

    return;

  } catch (error: any) {
    console.error('Error importing Genshin JSON data:', error)
    res.status(500).json({ error: 'Failed to import Genshin JSON data' })
  }
})

// Функция для определения формата paimon-moe
function isPaimonMoeFormat(data: any): boolean {
  console.log(`🔍 Checking paimon-moe format detection...`);
  console.log(`📊 Data type: ${typeof data}`);
  console.log(`🔑 Available keys: ${Object.keys(data || {}).join(', ')}`);

  // paimon-moe format has specific structure with different banner types
  // Support both old and new paimon-moe formats
  const hasOldFormat = data && typeof data === 'object' && (
    data['wish-counter-character-event'] ||
    data['wish-counter-chronicled'] ||
    data['wish-counter-standard'] ||
    data['wish-counter-weapon-event']
  );

  // Check for new format with 'default' wrapper
  const hasNewFormatWrapper = data && typeof data === 'object' && data['default'] && typeof data['default'] === 'object';
  const innerData = hasNewFormatWrapper ? data['default'] : data;

  const hasNewFormat = innerData && typeof innerData === 'object' && (
    innerData['character'] ||
    innerData['lightcone'] ||
    innerData['standard'] ||
    innerData['beginner']
  );

  console.log(`📋 Old format detected: ${hasOldFormat}`);
  console.log(`📋 New format wrapper detected: ${hasNewFormatWrapper}`);
  console.log(`📋 New format detected: ${hasNewFormat}`);

  if (hasNewFormatWrapper) {
    console.log(`📦 Data wrapped in 'default' key, inner keys: ${Object.keys(innerData).join(', ')}`);
  }

  const result = hasOldFormat || hasNewFormat;
  console.log(`✅ Final result: ${result}`);

  return result;
}

// Функция для обработки данных в формате paimon-moe
async function processPaimonMoeData(prisma: PrismaClient, userId: number, userUid: string, jsonData: any, uploadId: string) {
  let importedCount = 0
  let skippedCount = 0
  let errorCount = 0

  // Track import start time to distinguish within-batch vs cross-import duplicates
  const importStartTime = new Date()
  console.log(`⏰ Import session started at: ${importStartTime.toISOString()}`)

  // Check if data is wrapped in 'default' key
  const actualData = jsonData['default'] || jsonData;
  console.log(`📦 Processing data ${jsonData['default'] ? 'from' : 'without'} 'default' wrapper`);

  // Извлекаем все крутки из разных типов баннеров
  const allPulls: any[] = []

  // Маппинг типов баннеров paimon-moe к стандартным
  const bannerTypeMapping: { [key: string]: { bannerId: string, bannerName: string, bannerType: string } } = {
    // Old format keys
    'wish-counter-character-event': { bannerId: 'genshin_301', bannerName: 'Character Event Wish', bannerType: 'character' },
    'wish-counter-chronicled': { bannerId: 'genshin_400', bannerName: 'Chronicled Wish', bannerType: 'chronicled' },
    'wish-counter-standard': { bannerId: 'genshin_200', bannerName: 'Wanderlust Invocation', bannerType: 'standard' },
    'wish-counter-weapon-event': { bannerId: 'genshin_302', bannerName: 'Weapon Event Wish', bannerType: 'weapon' },
    // New format keys
    'character': { bannerId: 'genshin_301', bannerName: 'Character Event Wish', bannerType: 'character' },
    'lightcone': { bannerId: 'genshin_302', bannerName: 'Weapon Event Wish', bannerType: 'weapon' },
    'standard': { bannerId: 'genshin_200', bannerName: 'Wanderlust Invocation', bannerType: 'standard' },
    'beginner': { bannerId: 'genshin_100', bannerName: 'Beginners\' Wish', bannerType: 'beginner' }
  }

  // Обрабатываем каждый тип баннера
  for (const [bannerKey, bannerInfo] of Object.entries(bannerTypeMapping)) {
    let pulls = [];

    // Check both old format (direct) and new format (in actualData)
    if (actualData[bannerKey]?.pulls) {
      pulls = actualData[bannerKey].pulls;
    } else if (Array.isArray(actualData[bannerKey])) {
      pulls = actualData[bannerKey];
    }

    if (pulls.length > 0) {
      console.log(`📋 Processing ${pulls.length} pulls from banner: ${bannerKey}`);
      
      // Log first pull structure for debugging
      if (pulls.length > 0) {
        console.log(`🔍 First pull structure:`, JSON.stringify(pulls[0], null, 2));
      }

      for (const pull of pulls) {
    // Преобразуем данные paimon-moe в стандартный формат
    // Сохраняем оригинальное имя (если есть) и нормализуем тип к английскому
    const itemName = pull.name || pull.item_id || pull.id || 'Unknown Item'
    const itemType = (pull.type === 'character' || pull.type === 'Character' || pull.type === '角色') ? 'Character' : 'Weapon'
        
        // Определяем rankType: если есть rate=1 или pity высокий, то 5*, иначе 4* или 3*
        let rankType = 3; // default to 3*
        if (pull.rate === 1 || pull.pity >= 70) {
          rankType = 5;
        } else if (pull.pity >= 8) {
          rankType = 4;
        }
        
        const standardPull = {
          id: `genshin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gacha_type: bannerInfo.bannerId, // Всегда используем новый маппинг
          name: itemName,
          item_type: itemType,
          rank_type: rankType,
          time: pull.time,
          banner_name: bannerInfo.bannerName,
          banner_type: bannerInfo.bannerType,
          game: 'GENSHIN'
        }

        allPulls.push(standardPull)
      }
    }
  }

  // Сортируем по времени
  allPulls.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  console.log(`📊 Total pulls collected: ${allPulls.length}`);

  // Обрабатываем каждую крутку
  const totalPulls = allPulls.length;
  console.log(`📊 Starting Genshin import: ${totalPulls} pulls to process`);

  // Начальный прогресс
  genshinUploadProgress[uploadId] = {
    ...genshinUploadProgress[uploadId],
    progress: 0,
    message: 'Начинаем обработку круток...'
  };

  for (let i = 0; i < allPulls.length; i++) {
    const pull = allPulls[i];

    // Обновляем прогресс для каждой крутки (но не чаще чем раз в 50мс)
    const progress = Math.round(((i + 1) / totalPulls) * 100);
    genshinUploadProgress[uploadId] = {
      ...genshinUploadProgress[uploadId],
      progress,
      message: `Обработка крутки ${i + 1}/${totalPulls}...`,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: totalPulls,
      currentItem: pull.name
    };

    // Log progress every 10% or every 100 pulls
    if (i % Math.max(1, Math.floor(totalPulls / 10)) === 0 || i % 100 === 0) {
      const progressPercent = ((i / totalPulls) * 100).toFixed(1);
      console.log(`🔄 Genshin Import Progress: ${i}/${totalPulls} pulls (${progressPercent}%) - Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    }

    // Небольшая задержка для стабильного обновления прогресса
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    try {
      // Validate required fields
      if (!pull.name || pull.name.trim() === '') {
        console.warn(`⚠️ Skipping pull with empty name: ${JSON.stringify(pull)}`);
        skippedCount++;
        continue;
      }

      if (!pull.time) {
        console.warn(`⚠️ Skipping pull with invalid time: ${JSON.stringify(pull)}`);
        skippedCount++;
        continue;
      }

      console.log(`🔍 Processing pull: ${pull.name} at ${pull.time}`);
      console.log(`📊 Using banner: ${pull.gacha_type} (${pull.banner_name})`);

      // Проверяем дубликаты: точное совпадение нормализованного имени И времени
      // Только из ПРЕДЫДУЩИХ импортов, не из текущего (для обработки 10-pull батчей)
      const normalizedName = normalizeItemName(pull.name);
      const pullTime = new Date(pull.time);
      
      const isDuplicate = await isDuplicatePullInDB(
        prisma, 
        userId, 
        normalizedName, 
        pull.gacha_type, 
        pullTime, 
        importStartTime // Передаем время начала импорта
      );
      
      if (isDuplicate) {
        console.log(`⏭️ Skipping duplicate pull: ${pull.name} at ${pull.time} (normalized: ${normalizedName})`);
        skippedCount++;
        await logImport({ source: 'JSON_IMPORT', action: 'SKIP_DUPLICATE', uid: userUid, gachaId: `genshin_${pull.id}`, itemName: pull.name, bannerId: pull.gacha_type });
        continue;
      }

      console.log(`✅ Pull ${pull.name} at ${pull.time} passed validation, proceeding with import`);

      // Убеждаемся, что баннер существует
      let banner = await prisma.banner.findUnique({
        where: { 
          bannerId_game: {
            bannerId: pull.gacha_type,
            game: 'GENSHIN'
          }
        }
      })

      if (!banner) {
        console.log(`📝 Creating banner: ${pull.gacha_type} (${pull.banner_name})`);
        banner = await prisma.banner.create({
          data: {
            bannerId: pull.gacha_type,
            bannerName: pull.banner_name,
            bannerType: pull.banner_type,
            game: 'GENSHIN'
          }
        })
        console.log(`✅ Banner created successfully`);
      } else {
        console.log(`📋 Using existing banner: ${pull.gacha_type}`);
      }

      // Вычисляем pity count
      const previousPulls = await prisma.gachaPull.findMany({
        where: {
          userId,
          bannerId: pull.gacha_type,
          game: 'GENSHIN',
          time: { lt: new Date(pull.time) }
        },
        orderBy: { time: 'desc' }
      })

      let pityCount = 1
      for (const prevPull of previousPulls) {
        if (prevPull.rankType === 5) break
        pityCount++
      }

      // Создаем запись крутки (сохраняем нормализованное имя для консистентности)
      await prisma.gachaPull.create({
        data: {
          userId,
          bannerId: pull.gacha_type,
          gachaId: `genshin_${pull.id}`, // Унифицированный ID
          itemName: normalizeItemName(pull.name), // Нормализуем имя при сохранении
          itemType: pull.item_type,
          rankType: pull.rank_type,
          time: new Date(pull.time),
          pityCount,
          game: 'GENSHIN',
          isFeatured: pull.rate === 1 // 5* предметы считаем featured
        }
      })

  await logImport({ source: 'JSON_IMPORT', action: 'IMPORTED', uid: userUid, gachaId: `genshin_${pull.id}`, itemName: pull.name, bannerId: pull.gacha_type })

      console.log(`✅ Successfully imported pull: ${pull.name} at ${pull.time}`);
      importedCount++
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️ Skipping duplicate pull: ${pull.name} at ${pull.time} - ${error.message}`);
        skippedCount++;
      } else {
        console.error(`❌ Error processing Genshin pull ${pull.name} at ${pull.time}:`, error.message);
        console.error(`   Pull data:`, JSON.stringify(pull));
        errorCount++;
      }
    }
  }

  // Final progress log
  console.log(`✅ Genshin Import Complete: ${totalPulls} pulls processed - Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

  // Финальный прогресс
  genshinUploadProgress[uploadId] = {
    ...genshinUploadProgress[uploadId],
    progress: 100,
    message: 'Обработка завершена!',
    imported: importedCount,
    skipped: skippedCount,
    errors: errorCount,
    total: totalPulls
  };

  // Обновляем статистику пользователя
  await updateGenshinUserStats(prisma, userId)

  return {
    message: 'Genshin Impact data from paimon-moe processed successfully',
    imported: importedCount,
    skipped: skippedCount,
    errors: errorCount,
    total: allPulls.length
  }
}

// Функция для обновления статистики Genshin Impact
async function updateGenshinUserStats(prisma: PrismaClient, userId: number) {
  const bannerTypes: (keyof typeof import('@prisma/client').BannerType)[] = ['character', 'weapon', 'standard', 'chronicled']

  for (const bannerType of bannerTypes) {
    const pulls = await prisma.gachaPull.findMany({
      where: {
        userId,
        game: 'GENSHIN',
        banner: {
          bannerType
        }
      },
      orderBy: { time: 'desc' }
    })

    const totalPulls = pulls.length
    const fiveStarCount = pulls.filter((p: any) => p.rankType === 5).length
    const fourStarCount = pulls.filter((p: any) => p.rankType === 4).length
    const threeStarCount = pulls.filter((p: any) => p.rankType === 3).length

    let currentPity = 0
    let lastFiveStarTime = null

    for (const pull of pulls) {
      if (pull.rankType === 5) {
        lastFiveStarTime = pull.time
        break
      }
      currentPity++
    }

    await prisma.userStats.upsert({
      where: {
        unique_user_banner_game: {
          userId,
          bannerType: bannerType as string,
          game: 'GENSHIN'
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
        bannerType: bannerType as string,
        game: 'GENSHIN',
        totalPulls,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        currentPity,
        lastFiveStarTime
      }
    })
  }
}

export default router
