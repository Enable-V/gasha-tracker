import { Router } from 'express';
import multer from 'multer';
import type { Request, Response } from 'express';

const router = Router();

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

// Upload gacha data from JSON file
router.post('/json/:uid', upload.single('gachaFile'), async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let gachaData;
    try {
      gachaData = JSON.parse(req.file.buffer.toString());
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    
    // Process gacha data
    const result = await processGachaData(req.prisma, user.id, gachaData);
    
    res.json(result);
  } catch (error) {
    req.logger.error('Error uploading gacha data:', error);
    res.status(500).json({ error: 'Failed to upload gacha data' });
  }
});

// Upload gacha data from HSR URL
router.post('/url/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const user = await req.prisma.user.findUnique({
      where: { uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Extract authkey from URL
    const authkey = extractAuthkey(url);
    if (!authkey) {
      return res.status(400).json({ error: 'Invalid HSR URL format' });
    }
    
    // Fetch gacha data from HSR API
    const gachaData = await fetchGachaDataFromAPI(authkey);
    
    // Process gacha data
    const result = await processGachaData(req.prisma, user.id, gachaData);
    
    res.json(result);
  } catch (error) {
    req.logger.error('Error fetching gacha data from URL:', error);
    res.status(500).json({ error: 'Failed to fetch gacha data from URL' });
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

// Helper function to fetch gacha data from HSR API
async function fetchGachaDataFromAPI(authkey: string): Promise<any[]> {
  const axios = await import('axios');
  const allPulls: any[] = [];
  
  // HSR gacha types
  const gachaTypes = ['1', '2', '11', '12']; // Character, Weapon, Standard, Beginner
  
  for (const gachaType of gachaTypes) {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await axios.default.get('https://sg-public-api.hoyoverse.com/event/gacha_info/api/getGachaLog', {
        params: {
          authkey,
          gacha_type: gachaType,
          page,
          size: 20,
          lang: 'en'
        },
        timeout: 10000
      });
      
      const data = response.data;
      
      if (data.retcode !== 0) {
        throw new Error(`API Error: ${data.message}`);
      }
      
      const pulls = data.data.list;
      
      if (pulls.length === 0) {
        hasMore = false;
      } else {
        allPulls.push(...pulls.map((pull: any) => ({
          ...pull,
          gacha_type: gachaType
        })));
        page++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
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
  
  for (const pull of gachaData) {
    try {
      // Calculate pity count
      const previousPulls = await prisma.gachaPull.findMany({
        where: {
          userId,
          bannerId: pull.gacha_type || pull.uigf_gacha_type,
          time: { lt: new Date(pull.time) }
        },
        orderBy: { time: 'desc' }
      });
      
      let pityCount = 1;
      for (const prevPull of previousPulls) {
        if (prevPull.rankType === 5) break;
        pityCount++;
      }
      
      await prisma.gachaPull.create({
        data: {
          userId,
          bannerId: pull.gacha_type || pull.uigf_gacha_type,
          gachaId: pull.id,
          itemName: pull.name,
          itemType: pull.item_type,
          rankType: Number(pull.rank_type),
          time: new Date(pull.time),
          pityCount
        }
      });
      
      importedCount++;
    } catch (error: any) {
      if (error.code === 'P2002') {
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
    errors: errorCount
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
