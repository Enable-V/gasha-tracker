import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Получение всех маппингов названий предметов
router.get('/mappings', authenticateToken, async (req, res) => {
  try {
    const mappings = await prisma.itemNameMapping.findMany({
      orderBy: [
        { game: 'asc' },
        { itemType: 'asc' }, 
        { englishName: 'asc' }
      ]
    })

    res.json(mappings)
  } catch (error) {
    console.error('Error fetching item name mappings:', error)
    res.status(500).json({ error: 'Failed to fetch item name mappings' })
  }
})

// Создание нового маппинга
router.post('/mappings', authenticateToken, async (req, res) => {
  try {
    const { englishName, russianName, game, itemType } = req.body

    if (!englishName || !russianName || !game || !itemType) {
      return res.status(400).json({ 
        error: 'Missing required fields: englishName, russianName, game, itemType' 
      })
    }

    const mapping = await prisma.itemNameMapping.create({
      data: {
        englishName,
        russianName,
        game,
        itemType
      }
    })

    res.json(mapping)
  } catch (error) {
    console.error('Error creating item name mapping:', error)
    res.status(500).json({ error: 'Failed to create item name mapping' })
  }
})

// Обновление маппинга
router.put('/mappings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { englishName, russianName, game, itemType } = req.body

    const mapping = await prisma.itemNameMapping.update({
      where: { id: parseInt(id) },
      data: {
        englishName,
        russianName,
        game,
        itemType
      }
    })

    res.json(mapping)
  } catch (error) {
    console.error('Error updating item name mapping:', error)
    res.status(500).json({ error: 'Failed to update item name mapping' })
  }
})

// Удаление маппинга
router.delete('/mappings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.itemNameMapping.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Item name mapping deleted successfully' })
  } catch (error) {
    console.error('Error deleting item name mapping:', error)
    res.status(500).json({ error: 'Failed to delete item name mapping' })
  }
})

export default router
