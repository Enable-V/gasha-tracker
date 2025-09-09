#!/usr/bin/env tsx

/**
 * Скрипт для анализа всех круток пользователя и создания полного маппинга
 */
import { PrismaClient, GameType } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeUserPulls() {
  console.log('🔍 Анализ всех круток пользователя для создания полного маппинга...\n')

  try {
    // Получаем все уникальные предметы для каждой игры
    const hsrItems = await prisma.gachaPull.findMany({
      where: { game: 'HSR' },
      select: {
        itemName: true,
        itemType: true,
        game: true
      },
      distinct: ['itemName', 'itemType'],
      orderBy: [
        { itemType: 'asc' },
        { itemName: 'asc' }
      ]
    })

    const genshinItems = await prisma.gachaPull.findMany({
      where: { game: 'GENSHIN' },
      select: {
        itemName: true,
        itemType: true, 
        game: true
      },
      distinct: ['itemName', 'itemType'],
      orderBy: [
        { itemType: 'asc' },
        { itemName: 'asc' }
      ]
    })

    console.log(`📊 Найдено предметов:`)
    console.log(`   HSR: ${hsrItems.length} уникальных предметов`)
    console.log(`   GENSHIN: ${genshinItems.length} уникальных предметов`)
    console.log(`   Всего: ${hsrItems.length + genshinItems.length} предметов\n`)

    // Генерируем TypeScript код для маппинга
    console.log('📝 Генерация TypeScript кода для полного маппинга:\n')
    console.log('```typescript')
    console.log('// Полный маппинг всех предметов из базы данных')
    console.log('const fullItemMappings = [')

    // HSR предметы
    if (hsrItems.length > 0) {
      console.log('  // === HSR ПРЕДМЕТЫ ===')
      hsrItems.forEach(item => {
        const russianName = item.itemName // Пока оставляем как есть, можно будет заменить вручную
        console.log(`  { englishName: '${item.itemName}', russianName: '${russianName}', game: 'HSR' as GameType, itemType: '${item.itemType}' },`)
      })
    }

    // Genshin предметы
    if (genshinItems.length > 0) {
      console.log('  // === GENSHIN ПРЕДМЕТЫ ===')
      genshinItems.forEach(item => {
        const russianName = item.itemName // Пока оставляем как есть, можно будет заменить вручную  
        console.log(`  { englishName: '${item.itemName}', russianName: '${russianName}', game: 'GENSHIN' as GameType, itemType: '${item.itemType}' },`)
      })
    }

    console.log(']')
    console.log('```\n')

    // Статистика по типам предметов
    const hsrStats: { [key: string]: number } = {}
    const genshinStats: { [key: string]: number } = {}

    hsrItems.forEach(item => {
      hsrStats[item.itemType] = (hsrStats[item.itemType] || 0) + 1
    })

    genshinItems.forEach(item => {
      genshinStats[item.itemType] = (genshinStats[item.itemType] || 0) + 1
    })

    console.log('📈 Статистика по типам предметов:')
    console.log('\n🎮 HSR:')
    Object.entries(hsrStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} предметов`)
    })

    console.log('\n🎯 GENSHIN:')
    Object.entries(genshinStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} предметов`)
    })

    // Проверяем существующие маппинги
    console.log('\n🔍 Проверка существующих маппингов...')
    const existingMappings = await prisma.itemNameMapping.findMany()
    console.log(`   Уже есть в базе: ${existingMappings.length} маппингов`)

    const existingNames = new Set(existingMappings.map(m => `${m.englishName}_${m.game}`))
    
    let missingHSR = 0
    let missingGenshin = 0

    hsrItems.forEach(item => {
      if (!existingNames.has(`${item.itemName}_HSR`)) {
        missingHSR++
      }
    })

    genshinItems.forEach(item => {
      if (!existingNames.has(`${item.itemName}_GENSHIN`)) {
        missingGenshin++
      }
    })

    console.log(`   Нужно добавить HSR: ${missingHSR} предметов`)
    console.log(`   Нужно добавить GENSHIN: ${missingGenshin} предметов`)
    console.log(`   Всего нужно добавить: ${missingHSR + missingGenshin} предметов`)

    // Показываем отсутствующие предметы
    if (missingHSR > 0 || missingGenshin > 0) {
      console.log('\n❓ Отсутствующие предметы:')
      
      if (missingHSR > 0) {
        console.log('\n📋 HSR предметы без маппинга:')
        hsrItems.forEach(item => {
          if (!existingNames.has(`${item.itemName}_HSR`)) {
            console.log(`   - ${item.itemName} (${item.itemType})`)
          }
        })
      }

      if (missingGenshin > 0) {
        console.log('\n📋 GENSHIN предметы без маппинга:')
        genshinItems.forEach(item => {
          if (!existingNames.has(`${item.itemName}_GENSHIN`)) {
            console.log(`   - ${item.itemName} (${item.itemType})`)
          }
        })
      }
    }

  } catch (error) {
    console.error('❌ Ошибка анализа:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeUserPulls()
