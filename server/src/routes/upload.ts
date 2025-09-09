import { Router } from 'express';
import multer from 'multer';
import type { Response } from 'express';
import { authenticateToken, requireOwnership, AuthRequest } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Upload gacha data from JSON file for current user (требует аутентификации)
router.post('/json', authenticateToken, upload.single('gachaFile'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Пользователь уже аутентифицирован через middleware
    const user = req.user!;
    const userId = req.user.id;

    let gachaData;
    try {
      gachaData = JSON.parse(req.file.buffer.toString());
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    console.log(`📁 Processing pom-moe HSR JSON file for user ID: ${userId}`)
    console.log(`📊 JSON keys found: ${Object.keys(gachaData).join(', ')}`)

    // Check if data is wrapped in "default" and extract it for logging
    let dataForLogging = gachaData;
    if (gachaData && typeof gachaData === 'object' && gachaData.default) {
      console.log(`📦 Data wrapped in 'default' key, inner keys: ${Object.keys(gachaData.default).join(', ')}`);
      dataForLogging = gachaData.default;
    }

    console.log(`🔍 Checking pom-moe format...`)

    // Определяем формат файла и обрабатываем соответствующим образом
    let result;
    if (isPomMoeFormat(gachaData)) {
      console.log(`✅ Pom-moe format detected successfully!`);
      console.log(`🚀 Processing pom-moe HSR data for user ID: ${userId}`);
      result = await processPomMoeData(prisma, user.id, gachaData);
    } else {
      console.log(`❌ Pom-moe format NOT detected!`);
      console.log(`🔍 Available keys: ${Object.keys(gachaData).join(', ')}`);
      return res.status(400).json({ error: 'Unsupported format. Please upload a valid pom-moe JSON file for HSR.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error uploading gacha data:', error);
    res.status(500).json({ error: 'Failed to upload gacha data' });
  }
});

// Upload gacha data from HSR URL (теперь требует аутентификации)


// Upload gacha data from HSR URL for current user (требует аутентификации)
router.post('/url', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Требуется аутентификация'
      });
    }

    const { url } = req.body;
    const userId = req.user.id;

    console.log(`🌐 Starting HSR URL import for user ID: ${userId}`)
    console.log(`🔗 URL: ${url.substring(0, 50)}...`)

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Пользователь уже аутентифицирован через middleware
    const user = req.user!;

    // Extract authkey from URL
    const authkey = extractAuthkey(url);
    console.log(`🔑 Authkey extracted, starting data fetch...`)
    if (!authkey) {
      console.error(`Invalid URL format for user ID: ${userId}`);
      return res.status(400).json({ error: 'Invalid HSR URL format. Please make sure you copied the complete URL.' });
    }

    console.log(`Extracted authkey for user ID: ${userId}`);

    // Fetch gacha data from HSR API
    const gachaData = await fetchGachaDataFromAPI(authkey, url);
    console.log(`Fetched ${gachaData.length} gacha records for user ID: ${userId}`);

    if (gachaData.length === 0) {
      return res.status(400).json({ error: 'No gacha data found. Please make sure you have gacha history in the game.' });
    }

    // Process gacha data
    const result = await processGachaData(prisma, user.id, gachaData);

    console.log(`Import completed for user ID: ${userId}. Imported: ${result.imported}, Skipped: ${result.skipped}`);

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching gacha data from URL:', error);
    res.status(500).json({
      error: 'Failed to fetch gacha data from URL',
      details: error.message
    });
  }
});

// Helper function to extract authkey from URL
function extractAuthkey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('authkey');
  } catch {
    return null;
  }
}

// Helper function to get base URL from the provided URL
function getBaseURL(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return 'https://api-os-takumi.mihoyo.com/common/gacha_record/api/getGachaLog';
  }
}

// Helper function to fetch gacha data from HSR API
async function fetchGachaDataFromAPI(authkey: string, originalUrl: string): Promise<any[]> {
  const axios = await import('axios');
  const allPulls: any[] = [];
  
  // HSR gacha types - правильные значения от pom-moe
  const gachaTypes = [
    { id: '1', name: 'Stellar Warp (Standard)', type: 'standard' },
    { id: '2', name: 'Departure Warp (Beginner)', type: 'beginner' }, 
    { id: '11', name: 'Character Event Warp', type: 'character' },
    { id: '12', name: 'Light Cone Event Warp', type: 'lightcone' }
  ];
  
  const baseURL = getBaseURL(originalUrl);
  
  for (const gachaType of gachaTypes) {
    let page = 1;
    let endId = '0';
    let hasMore = true;
    
    while (hasMore) {
      try {
        // Создаем новый URL на основе оригинального, меняя только нужные параметры
        const requestUrl = new URL(originalUrl);
        requestUrl.searchParams.set('gacha_type', gachaType.id);
        requestUrl.searchParams.set('page', page.toString());
        requestUrl.searchParams.set('size', '20');
        requestUrl.searchParams.set('end_id', endId);
        requestUrl.searchParams.set('lang', 'en');

        console.log(`Making request to banner ${gachaType.id} (${gachaType.name}), page ${page}, end_id: ${endId}`);
        
        const response = await axios.default.get(requestUrl.toString(), {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://webstatic-sea.mihoyo.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
          }
        });
        
        console.log(`Response received for banner ${gachaType.id}, status: ${response.status}`);
        
        const data = response.data;
        
        console.log(`API response: retcode=${data.retcode}, message="${data.message || 'OK'}"`);
        
        if (data.retcode !== 0) {
          if (data.retcode === -101) {
            throw new Error('Invalid authkey or authkey expired');
          }
          throw new Error(`API Error ${data.retcode}: ${data.message}`);
        }
        
        const pulls = data.data?.list || [];
        console.log(`Received ${pulls.length} pulls for banner ${gachaType.id}`);
        
        if (pulls.length === 0) {
          console.log(`No more pulls for banner ${gachaType.id}, moving to next banner`);
          hasMore = false;
        } else {
          allPulls.push(...pulls.map((pull: any) => ({
            ...pull,
            gacha_type: gachaType.id,
            banner_name: gachaType.name,
            banner_type: gachaType.type
          })));
          
          console.log(`Added ${pulls.length} pulls, total so far: ${allPulls.length}`);
          
          // Устанавливаем end_id для следующего запроса (последний элемент списка)
          if (pulls.length > 0) {
            endId = pulls[pulls.length - 1].id;
            console.log(`Next end_id: ${endId}`);
          }
          
          // Если получили меньше чем запрашивали, значит это последняя страница
          if (pulls.length < 20) {
            console.log(`Received less than 20 pulls (${pulls.length}), this is the last page for banner ${gachaType.id}`);
            hasMore = false;
          } else {
            page++;
          }
          
          // Увеличиваем задержку для избежания rate limiting
          console.log(`Waiting 2 seconds before next request...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`Error fetching gacha type ${gachaType.id}:`, error.message);
        if (error.message.includes('Invalid authkey')) {
          throw error;
        }
        // Продолжаем с другими типами баннеров при сетевых ошибках
        hasMore = false;
      }
    }
  }
  
  return allPulls;
}

// Helper function to process gacha data
async function processGachaData(prisma: any, userId: number, gachaData: any[]): Promise<any> {
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Сортируем данные по времени
  const sortedData = gachaData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  for (const pull of sortedData) {
    try {
      // Проверяем, существует ли уже эта крутка для этого пользователя
      const existingPull = await prisma.gachaPull.findFirst({
        where: {
          gachaId: pull.id,
          userId: userId
        }
      });
      
      if (existingPull) {
        skippedCount++;
        continue;
      }
      
      // Убеждаемся, что банер существует
      const bannerId = pull.gacha_type || pull.uigf_gacha_type;
      let banner = await prisma.banner.findUnique({
        where: { bannerId }
      });
      
      if (!banner) {
        // Создаем банер если не существует
        const bannerNames: Record<string, { name: string; type: string }> = {
          '1': { name: 'Stellar Warp', type: 'standard' },
          '2': { name: 'Character Event Warp', type: 'character' },
          '11': { name: 'Light Cone Event Warp', type: 'weapon' },
          '12': { name: 'Departure Warp', type: 'beginner' }
        };
        
        const bannerInfo = bannerNames[bannerId] || { name: 'Unknown Banner', type: 'standard' };
        
        banner = await prisma.banner.create({
          data: {
            bannerId,
            bannerName: bannerInfo.name,
            bannerType: bannerInfo.type
          }
        });
      }
      
      // Вычисляем pity count для этого банера
      const previousPulls = await prisma.gachaPull.findMany({
        where: {
          userId,
          bannerId,
          time: { lt: new Date(pull.time) }
        },
        orderBy: { time: 'desc' }
      });
      
      let pityCount = 1;
      for (const prevPull of previousPulls) {
        if (prevPull.rankType === 5) break;
        pityCount++;
      }
      
      // Создаем запись крутки
      await prisma.gachaPull.create({
        data: {
          userId,
          bannerId,
          gachaId: pull.id,
          itemName: pull.name,
          itemType: pull.item_type || 'Unknown',
          rankType: Number(pull.rank_type),
          time: new Date(pull.time),
          pityCount,
          isFeatured: false // Можно улучшить логику определения featured
        }
      });
      
      importedCount++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Duplicate key error
        skippedCount++;
      } else {
        errorCount++;
        console.error(`Error processing pull ${pull.id}:`, error);
      }
    }
  }
  
  // Update user statistics
  await updateUserStats(prisma, userId);
  
  return {
    message: 'Gacha data processed successfully',
    imported: importedCount,
    skipped: skippedCount,
    errors: errorCount,
    total: gachaData.length
  };
}

// Helper function to update user statistics
async function updateUserStats(prisma: any, userId: number) {
  const bannerTypes = ['character', 'weapon', 'standard', 'beginner'];
  
  for (const bannerType of bannerTypes) {
    const pulls = await prisma.gachaPull.findMany({
      where: {
        userId,
        bannerId: {
          in: getBannerIdsByType(bannerType)
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
        unique_user_banner_game: {
          userId,
          bannerType,
          game: 'HSR'
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
        game: 'HSR',
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

// Helper function to get banner IDs by type
function getBannerIdsByType(bannerType: string): string[] {
  switch (bannerType) {
    case 'character': return ['1', '2'];
    case 'weapon': return ['12'];
    case 'standard': return ['11'];
    case 'beginner': return ['1'];
    default: return [];
  }
}

export default router;

// Helper function to detect pom-moe format
function isPomMoeFormat(data: any): boolean {
  console.log(`🔍 Checking pom-moe format detection...`);
  console.log(`📊 Data type: ${typeof data}`);
  console.log(`🔑 Available keys: ${Object.keys(data || {}).join(', ')}`);

  // Check if data is wrapped in a "default" key
  let actualData = data;
  if (data && typeof data === 'object' && data.default && typeof data.default === 'object') {
    console.log(`📦 Found 'default' wrapper, checking inner data...`);
    console.log(`🔑 Inner keys: ${Object.keys(data.default).join(', ')}`);
    actualData = data.default;
  }

  // pom-moe format has specific structure with different banner types
  // Support both old and new pom-moe formats
  const hasOldFormat = actualData && typeof actualData === 'object' && (
    actualData['wish-counter-character-event'] ||
    actualData['wish-counter-standard'] ||
    actualData['wish-counter-beginner'] ||
    actualData['wish-counter-chronicled'] ||
    actualData['wish-counter-weapon-event']
  );

  const hasNewFormat = actualData && typeof actualData === 'object' && (
    actualData['character'] ||
    actualData['lightcone'] ||
    actualData['standard'] ||
    actualData['beginner']
  );

  const hasPomMoeFields = actualData && typeof actualData === 'object' && (
    actualData['items'] ||
    actualData['bannerSummary']
  );

  console.log(`📋 Old format detected: ${hasOldFormat}`);
  console.log(`📋 New format detected: ${hasNewFormat}`);
  console.log(`📋 Pom-moe fields detected: ${hasPomMoeFields}`);

  const result = hasOldFormat || hasNewFormat || hasPomMoeFields;
  console.log(`✅ Final result: ${result}`);

  return result;
}

// Helper function to process pom-moe HSR data
async function processPomMoeData(prisma: any, userId: number, jsonData: any): Promise<any> {
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Extract all pulls from different banner types
  const allPulls: any[] = [];

  // Check if data is wrapped in a "default" key
  let actualData = jsonData;
  if (jsonData && typeof jsonData === 'object' && jsonData.default && typeof jsonData.default === 'object') {
    console.log(`📦 Processing data from 'default' wrapper`);
    actualData = jsonData.default;
  }

  // Mapping of pom-moe banner types to standard format
  const bannerTypeMapping: { [key: string]: { bannerId: string, bannerName: string, bannerType: string } } = {
    // Old format keys
    'wish-counter-character-event': { bannerId: '11', bannerName: 'Character Event Warp', bannerType: 'character' },
    'wish-counter-standard': { bannerId: '1', bannerName: 'Stellar Warp', bannerType: 'standard' },
    'wish-counter-beginner': { bannerId: '2', bannerName: 'Departure Warp', bannerType: 'beginner' },
    'wish-counter-chronicled': { bannerId: '500', bannerName: 'Chronicled Wish', bannerType: 'chronicled' },
    'wish-counter-weapon-event': { bannerId: '12', bannerName: 'Light Cone Event Warp', bannerType: 'weapon' },
    // New format keys
    'character': { bannerId: '11', bannerName: 'Character Event Warp', bannerType: 'character' },
    'lightcone': { bannerId: '12', bannerName: 'Light Cone Event Warp', bannerType: 'weapon' },
    'standard': { bannerId: '1', bannerName: 'Stellar Warp', bannerType: 'standard' },
    'beginner': { bannerId: '2', bannerName: 'Departure Warp', bannerType: 'beginner' }
  };

  // Process each banner type
  for (const [bannerKey, bannerInfo] of Object.entries(bannerTypeMapping)) {
    if (actualData[bannerKey]) {
      const pulls = Array.isArray(actualData[bannerKey]) ? actualData[bannerKey] : actualData[bannerKey].pulls || [];

      for (const pull of pulls) {
        // Convert pom-moe data to standard format
        const itemName = pull.name || 'Unknown Item';
        const standardPull = {
          id: pull.id || `${pull.time}_${itemName}_${Math.random()}`,
          gacha_type: bannerInfo.bannerId,
          name: itemName,
          item_type: bannerKey === 'character' ? 'Character' : 'Light Cone',
          rank_type: pull.rarity || pull.rank_type || 3,
          time: pull.time,
          banner_name: bannerInfo.bannerName,
          banner_type: bannerInfo.bannerType,
          game: 'HSR'
        };

        allPulls.push(standardPull);
      }
    }
  }

  // Sort by time
  allPulls.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Process each pull
  const totalPulls = allPulls.length;
  console.log(`📊 Starting HSR import: ${totalPulls} pulls to process`);

  for (let i = 0; i < allPulls.length; i++) {
    const pull = allPulls[i];

    // Log progress every 10% or every 100 pulls
    if (i % Math.max(1, Math.floor(totalPulls / 10)) === 0 || i % 100 === 0) {
      const progress = ((i / totalPulls) * 100).toFixed(1);
      console.log(`🔄 HSR Import Progress: ${i}/${totalPulls} pulls (${progress}%) - Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    }

    try {
      // Validate required fields
      if (!pull.name || pull.name.trim() === '') {
        console.warn(`Skipping pull with empty name: ${JSON.stringify(pull)}`);
        skippedCount++;
        continue;
      }

      if (!pull.time) {
        console.warn(`Skipping pull with invalid time: ${JSON.stringify(pull)}`);
        skippedCount++;
        continue;
      }

      // Check if this pull already exists
      const existingPull = await prisma.gachaPull.findFirst({
        where: {
          gachaId: pull.id,
          userId: userId,
          game: 'HSR'
        }
      });

      if (existingPull) {
        skippedCount++;
        continue;
      }

      // Ensure banner exists
      let banner = await prisma.banner.findUnique({
        where: { 
          bannerId_game: {
            bannerId: pull.gacha_type,
            game: 'HSR'
          }
        }
      });

      if (!banner) {
        banner = await prisma.banner.create({
          data: {
            bannerId: pull.gacha_type,
            bannerName: pull.banner_name,
            bannerType: pull.banner_type as any,
            game: 'HSR'
          }
        });
      }

      // Calculate pity count
      const previousPulls = await prisma.gachaPull.findMany({
        where: {
          userId,
          bannerId: pull.gacha_type,
          game: 'HSR',
          time: { lt: new Date(pull.time) }
        },
        orderBy: { time: 'desc' }
      });

      let pityCount = 1;
      for (const prevPull of previousPulls) {
        if (prevPull.rankType === 5) break;
        pityCount++;
      }

      // Create gacha pull record
      await prisma.gachaPull.create({
        data: {
          userId,
          bannerId: pull.gacha_type,
          gachaId: pull.id,
          itemName: pull.name || 'Unknown Item',
          itemType: pull.item_type,
          rankType: pull.rank_type,
          time: new Date(pull.time),
          pityCount,
          game: 'HSR',
          isFeatured: pull.rank_type === 5
        }
      });

      importedCount++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        skippedCount++;
      } else {
        errorCount++;
        console.error(`Error processing HSR pull ${pull.id}:`, error);
      }
    }
  }

  // Final progress log
  console.log(`✅ HSR Import Complete: ${totalPulls} pulls processed - Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

  // Update user statistics
  await updateUserStats(prisma, userId);

  return {
    message: 'HSR data from pom-moe processed successfully',
    imported: importedCount,
    skipped: skippedCount,
    errors: errorCount,
    total: allPulls.length
  };
}
