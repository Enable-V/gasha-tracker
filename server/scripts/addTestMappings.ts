#!/usr/bin/env tsx

/**
 * Скрипт для добавления тестовых переводов предметов
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testMappings = [
  // Genshin Impact - Weapons  
  { englishName: 'rainslasher', russianName: 'Дождерез', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'black tassel', russianName: 'Чёрная кисть', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'harbinger of dawn', russianName: 'Предвестник зари', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'slingshot', russianName: 'Рогатка', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'magic guide', russianName: 'Магический справочник', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'bloodtainted greatsword', russianName: 'Покрытый кровью двуручный меч', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'debate club', russianName: 'Дискуссия', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'sharpshooters oath', russianName: 'Клятва стрелка', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'emerald orb', russianName: 'Изумрудная сфера', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'thrilling tales of dragon slayers', russianName: 'Драконоборцы', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'raven bow', russianName: 'Воронов лук', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'cool steel', russianName: 'Холодное лезвие', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'skyrider sword', russianName: 'Меч небесного всадника', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'the bell', russianName: 'Колокол', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'sacrificial bow', russianName: 'Жертвенный лук', game: 'GENSHIN' as const, itemType: 'weapon' },
  { englishName: 'ferrous shadow', russianName: 'Стальная тень', game: 'GENSHIN' as const, itemType: 'weapon' },

  // Genshin Impact - Characters
  { englishName: 'kachina', russianName: 'Качина', game: 'GENSHIN' as const, itemType: 'Character' },
  { englishName: 'thoma', russianName: 'Тома', game: 'GENSHIN' as const, itemType: 'Character' },
  { englishName: 'chevreuse', russianName: 'Шеврёз', game: 'GENSHIN' as const, itemType: 'Character' },
  { englishName: 'gorou', russianName: 'Гороу', game: 'GENSHIN' as const, itemType: 'Character' },
  { englishName: 'lisa', russianName: 'Лиза', game: 'GENSHIN' as const, itemType: 'Character' },

  // HSR - Light Cones
  { englishName: 'arrows', russianName: 'Стрелы', game: 'HSR' as const, itemType: 'Light Cone' },
  { englishName: 'cornucopia', russianName: 'Рог изобилия', game: 'HSR' as const, itemType: 'Light Cone' },
  { englishName: 'data bank', russianName: 'Банк данных', game: 'HSR' as const, itemType: 'Light Cone' },
  
  // HSR - Characters  
  { englishName: 'march 7th', russianName: 'Марта 7-е', game: 'HSR' as const, itemType: 'Character' },
  { englishName: 'dan heng', russianName: 'Дань Хэн', game: 'HSR' as const, itemType: 'Character' },
  { englishName: 'himeko', russianName: 'Химэко', game: 'HSR' as const, itemType: 'Character' },
]

async function addTestMappings() {
  console.log('🌟 Добавление тестовых переводов предметов...')
  
  try {
    for (const mapping of testMappings) {
      try {
        await prisma.itemNameMapping.create({
          data: mapping
        })
        console.log(`✅ Добавлен: ${mapping.englishName} → ${mapping.russianName} (${mapping.game})`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⏭️ Пропущен (уже существует): ${mapping.englishName} (${mapping.game})`)
        } else {
          console.error(`❌ Ошибка при добавлении ${mapping.englishName}:`, error.message)
        }
      }
    }
    
    console.log('\n🎉 Тестовые переводы добавлены!')
    
    // Показываем статистику
    const totalCount = await prisma.itemNameMapping.count()
    const genshinCount = await prisma.itemNameMapping.count({ where: { game: 'GENSHIN' } })
    const hsrCount = await prisma.itemNameMapping.count({ where: { game: 'HSR' } })
    
    console.log(`📊 Статистика переводов:`)
    console.log(`   Всего: ${totalCount}`)
    console.log(`   Genshin Impact: ${genshinCount}`)
    console.log(`   Honkai Star Rail: ${hsrCount}`)
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestMappings()
