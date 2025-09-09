#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function viewMappings() {
  console.log('📊 Загрузка существующих маппингов из базы данных...\n')

  try {
    const mappings = await prisma.itemNameMapping.findMany({
      orderBy: [
        { game: 'asc' },
        { itemType: 'asc' },
        { englishName: 'asc' }
      ]
    })

    console.log(`📋 Всего маппингов: ${mappings.length}\n`)

    if (mappings.length === 0) {
      console.log('❌ Маппинги не найдены в базе данных')
      return
    }

    // Группируем по играм
    const genshinMappings = mappings.filter(m => m.game === 'GENSHIN')
    const hsrMappings = mappings.filter(m => m.game === 'HSR')

    if (genshinMappings.length > 0) {
      console.log('🎮 GENSHIN IMPACT:')
      console.log('─'.repeat(80))
      genshinMappings.forEach((m, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${m.englishName.padEnd(25)} -> ${m.russianName.padEnd(25)} (${m.itemType})`)
      })
      console.log()
    }

    if (hsrMappings.length > 0) {
      console.log('🌟 HONKAI STAR RAIL:')
      console.log('─'.repeat(80))
      hsrMappings.forEach((m, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${m.englishName.padEnd(25)} -> ${m.russianName.padEnd(25)} (${m.itemType})`)
      })
      console.log()
    }

    console.log('✅ Загрузка завершена')

  } catch (error) {
    console.error('❌ Ошибка загрузки маппингов:', error)
  } finally {
    await prisma.$disconnect()
  }
}

viewMappings()
