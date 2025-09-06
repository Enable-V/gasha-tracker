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

// Upload gacha data from JSON file (теперь требует аутентификации)
router.post('/json/:uid', authenticateToken, requireOwnership, upload.single('gachaFile'), async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Пользователь уже аутентифицирован через middleware
    const user = req.user!;
    
    let gachaData;
    try {
      gachaData = JSON.parse(req.file.buffer.toString());
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Process gacha data
    const result = await processGachaData(prisma, user.id, gachaData);
    
    res.json(result);
  } catch (error) {
    console.error('Error uploading gacha data:', error);
    res.status(500).json({ error: 'Failed to upload gacha data' });
  }
});

// Upload gacha data from HSR URL (теперь требует аутентификации)
router.post('/url/:uid', authenticateToken, requireOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const { url } = req.body;
    
    console.log(`Starting gacha import for UID: ${uid}`);
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Пользователь уже аутентифицирован через middleware
    const user = req.user!;
    
    // Extract authkey from URL
    const authkey = extractAuthkey(url);
    if (!authkey) {
      console.error(`Invalid URL format for UID: ${uid}`);
      return res.status(400).json({ error: 'Invalid HSR URL format. Please make sure you copied the complete URL.' });
    }
    
    console.log(`Extracted authkey for UID: ${uid}`);
    
    // Fetch gacha data from HSR API
    const gachaData = await fetchGachaDataFromAPI(authkey, url);
    console.log(`Fetched ${gachaData.length} gacha records for UID: ${uid}`);
    
    if (gachaData.length === 0) {
      return res.status(400).json({ error: 'No gacha data found. Please make sure you have gacha history in the game.' });
    }
    
    // Process gacha data
    const result = await processGachaData(prisma, user.id, gachaData);
    
    console.log(`Import completed for UID: ${uid}. Imported: ${result.imported}, Skipped: ${result.skipped}`);
    
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
      // Проверяем, существует ли уже эта крутка
      const existingPull = await prisma.gachaPull.findUnique({
        where: { gachaId: pull.id }
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
