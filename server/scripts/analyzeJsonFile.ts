#!/usr/bin/env tsx

/**
 * Анализирует paimon-moe JSON файл и показывает статистику
 */

import fs from 'fs'
import path from 'path'
import { normalizeItemName } from '../src/utils/normalizeUtils'

const jsonPath = path.resolve('../paimon-moe-local-data.json')

if (!fs.existsSync(jsonPath)) {
  console.error('❌ JSON файл не найден:', jsonPath)
  process.exit(1)
}

console.log('📁 Анализируем paimon-moe JSON файл...')
console.log('📂 Путь:', jsonPath)

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

// Анализируем структуру
console.log('\n=== СТРУКТУРА ФАЙЛА ===')
console.log('🎮 UID:', data['wish-uid'])
console.log('🌍 Сервер:', data.server)
console.log('🗓️ Обновлен:', data['update-time'])

// Анализируем баннеры
const banners = [
  'wish-counter-character-event',
  'wish-counter-weapon-event', 
  'wish-counter-standard',
  'wish-counter-chronicled'
]

console.log('\n=== СТАТИСТИКА БАННЕРОВ ===')
let totalPulls = 0
let uniqueItems = new Set()

banners.forEach(bannerKey => {
  const banner = data[bannerKey]
  if (banner && banner.pulls) {
    const pulls = banner.pulls.length
    console.log(`${bannerKey}: ${pulls} круток`)
    totalPulls += pulls
    
    banner.pulls.forEach((pull: any) => {
      uniqueItems.add(pull.id || pull.name || 'unknown')
    })
  }
})

console.log(`📊 Общее количество круток: ${totalPulls}`)
console.log(`🎯 Уникальных предметов: ${uniqueItems.size}`)

// Анализируем нормализацию имен
console.log('\n=== ТЕСТ НОРМАЛИЗАЦИИ ИМЕН ===')

// Собираем все предметы из всех баннеров
const allItems: Array<{name: string, banner: string, time: string}> = []

banners.forEach(bannerKey => {
  const banner = data[bannerKey]
  if (banner && banner.pulls) {
    banner.pulls.forEach((pull: any) => {
      const itemName = pull.id || pull.name || 'unknown'
      allItems.push({
        name: itemName,
        banner: bannerKey,
        time: pull.time
      })
    })
  }
})

// Группируем по нормализованным именам для поиска дубликатов
const normalizedGroups: Record<string, Array<{name: string, banner: string, time: string}>> = {}

allItems.forEach(item => {
  const normalized = normalizeItemName(item.name)
  if (!normalizedGroups[normalized]) {
    normalizedGroups[normalized] = []
  }
  normalizedGroups[normalized].push(item)
})

console.log('\n=== ТОП ЧАСТО ВСТРЕЧАЮЩИХСЯ ПРЕДМЕТОВ ===')
Object.entries(normalizedGroups)
  .sort(([,a], [,b]) => b.length - a.length)
  .slice(0, 10)
  .forEach(([normalized, items]) => {
    console.log(`"${normalized}": ${items.length} раз`)
    if (items.length > 1) {
      const uniqueNames = [...new Set(items.map(i => i.name))]
      if (uniqueNames.length > 1) {
        console.log(`  ⚠️ Разные варианты: ${uniqueNames.join(', ')}`)
      }
    }
  })

// Анализируем время для 10-pull батчей
console.log('\n=== АНАЛИЗ ВРЕМЕНИ (10-PULL БАТЧИ) ===')
const timeGroups: Record<string, number> = {}

allItems.forEach(item => {
  const timeKey = item.time
  timeGroups[timeKey] = (timeGroups[timeKey] || 0) + 1
})

const batchTimes = Object.entries(timeGroups)
  .filter(([,count]) => count >= 10)
  .sort(([,a], [,b]) => b - a)

console.log(`🕐 Найдено ${batchTimes.length} 10-pull батчей:`)
batchTimes.slice(0, 5).forEach(([time, count]) => {
  console.log(`  ${time}: ${count} круток`)
})

if (batchTimes.length > 0) {
  console.log('\n✅ Файл содержит 10-pull батчи - отличный тест для нашей логики!')
} else {
  console.log('\n⚠️ 10-pull батчи не найдены, но файл все равно подходит для тестирования')
}

console.log('\n🎯 Готово к импорту! Этот файл протестирует:')
console.log('✅ Нормализацию имен (разные форматы)')
console.log('✅ Обработку разных типов баннеров')
console.log('✅ Логику дубликатов по времени')
console.log(`✅ Импорт ${totalPulls} круток из ${uniqueItems.size} уникальных предметов`)
