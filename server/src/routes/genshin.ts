import { Router, Request, Response } from 'express'
import { genshinImportService } from '../services/genshinImportService'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Импорт данных Genshin Impact
router.post('/import/:uid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params
    const { gachaUrl } = req.body

    // Проверяем, что пользователь импортирует свои данные
    if (req.user?.uid !== uid) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (!gachaUrl) {
      return res.status(400).json({ error: 'Genshin Impact gacha URL is required' })
    }

    console.log(`Starting Genshin import for UID: ${uid}`)
    const result = await genshinImportService.importGenshinData(gachaUrl, uid)

    if (result.success) {
      res.json({
        message: result.message,
        stats: result.stats
      })
    } else {
      res.status(400).json({
        error: result.message
      })
    }

  } catch (error: any) {
    console.error('Error importing Genshin data:', error)
    res.status(500).json({ error: 'Failed to import Genshin data' })
  }
})

// Получение статистики пользователя по Genshin Impact
router.get('/stats/:uid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params

    // Проверяем, что пользователь запрашивает свою статистику
    if (req.user?.uid !== uid) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const stats = await genshinImportService.getGenshinStats(uid)
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

export default router
