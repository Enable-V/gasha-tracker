#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const logFile = path.resolve('error/gacha_import_log.jsonl');
if (!fs.existsSync(logFile)) {
  console.log('❌ Лог файл не найден');
  process.exit(1);
}

const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l.trim());
const skipped: any[] = [];

lines.forEach(line => {
  try {
    const entry = JSON.parse(line);
    if (entry.action === 'SKIP_DUPLICATE' && entry.source === 'JSON_IMPORT') {
      skipped.push(entry);
    }
  } catch (e) {}
});

console.log('=== АНАЛИЗ ПРОПУЩЕННЫХ ЗАПИСЕЙ ===');
console.log('Всего пропущено как дубликаты:', skipped.length);

console.log('\n=== ДЕТАЛИ ПРОПУЩЕННЫХ ЗАПИСЕЙ ===');
skipped.slice(0, 15).forEach((item: any, index: number) => {
  console.log(`${index + 1}. ${item.itemName} (${item.bannerId}) - ${new Date(item.ts).toLocaleString('ru-RU')}`);
  if (item.gachaId) console.log(`   gachaId: ${item.gachaId}`);
});

// Анализируем есть ли реальные дубликаты в JSON файле
const jsonPath = path.resolve('../paimon-moe-local-data.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const allPulls: any[] = [];
const banners = ['wish-counter-character-event', 'wish-counter-weapon-event', 'wish-counter-standard', 'wish-counter-chronicled'];

banners.forEach(bannerKey => {
  const banner = data[bannerKey];
  if (banner && banner.pulls) {
    banner.pulls.forEach((pull: any) => {
      allPulls.push({
        id: pull.id,
        name: pull.id,
        time: pull.time,
        banner: bannerKey
      });
    });
  }
});

console.log('\n=== АНАЛИЗ JSON ФАЙЛА ===');
console.log('Всего записей в JSON:', allPulls.length);

// Ищем реальные дубликаты по id + time
const timeGroups: Record<string, any[]> = {};
allPulls.forEach((pull: any) => {
  const key = `${pull.name}|${pull.time}`;
  if (!timeGroups[key]) timeGroups[key] = [];
  timeGroups[key].push(pull);
});

const realDuplicates = Object.entries(timeGroups).filter(([key, items]) => items.length > 1);

console.log('Реальных дубликатов в JSON (одинаковый предмет + время):', realDuplicates.length);

if (realDuplicates.length > 0) {
  console.log('\n=== РЕАЛЬНЫЕ ДУБЛИКАТЫ В JSON ===');
  realDuplicates.slice(0, 5).forEach(([key, items]) => {
    const [name, time] = key.split('|');
    console.log(`${name} в ${time}: ${items.length} раз`);
  });
} else {
  console.log('✅ В JSON файле НЕТ реальных дубликатов!');
  console.log(`❌ Система неправильно определила ${skipped.length} записей как дубликаты`);
}

// Проверим логику - может проблема в том что мы ищем дубликаты в уже импортированных данных?
console.log('\n=== ДИАГНОСТИКА ПРОБЛЕМЫ ===');
console.log('Возможные причины ложных дубликатов:');
console.log('1. Система ищет дубликаты среди уже импортированных записей');
console.log('2. База данных не была очищена перед импортом');  
console.log('3. Логика нормализации слишком агрессивна');
console.log('4. Проблема с точным сравнением времени');
