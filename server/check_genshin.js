import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkGenshinData() {
  try {
    const itemTypes = await prisma.gachaPull.groupBy({
      by: ['itemType'],
      where: { game: 'GENSHIN' },
      _count: { itemType: true }
    })
    
    console.log('Genshin items by type:', itemTypes)
    
    const rarityTypes = await prisma.gachaPull.groupBy({
      by: ['rankType'],
      where: { game: 'GENSHIN' },
      _count: { rankType: true }
    })
    
    console.log('Genshin items by rarity:', rarityTypes)
    
    // Проверим несколько конкретных записей
    const samples = await prisma.gachaPull.findMany({
      where: { game: 'GENSHIN' },
      take: 5,
      select: { itemName: true, itemType: true, rankType: true }
    })
    
    console.log('Sample Genshin items:', samples)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGenshinData()
