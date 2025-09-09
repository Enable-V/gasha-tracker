#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('=== ПРОВЕРКА СОСТОЯНИЯ БАЗЫ ДАННЫХ ===\n');
  
  // Подсчитываем крутки в базе
  const totalPulls = await prisma.gachaPull.count({
    where: { game: 'GENSHIN' }
  });
  
  console.log(`📊 Всего круток в базе: ${totalPulls}`);
  
  if (totalPulls > 0) {
    // Анализируем по баннерам
    const bannerStats = await prisma.gachaPull.groupBy({
      by: ['bannerId'],
      where: { game: 'GENSHIN' },
      _count: true
    });
    
    console.log('\n=== РАСПРЕДЕЛЕНИЕ ПО БАННЕРАМ ===');
    bannerStats.forEach(stat => {
      console.log(`${stat.bannerId}: ${stat._count} круток`);
    });
    
    // Ищем возможные дубликаты в базе
    const duplicateCheck = await prisma.$queryRaw`
      SELECT itemName, bannerId, time, COUNT(*) as count 
      FROM GachaPull 
      WHERE game = 'GENSHIN'
      GROUP BY itemName, bannerId, time 
      HAVING COUNT(*) > 1
      LIMIT 10
    ` as any[];
    
    console.log('\n=== ДУБЛИКАТЫ В БАЗЕ ДАННЫХ ===');
    if (duplicateCheck.length > 0) {
      console.log(`Найдено ${duplicateCheck.length} групп дубликатов:`);
      duplicateCheck.forEach((dup, i) => {
        console.log(`${i+1}. ${dup.itemName} (${dup.bannerId}) в ${dup.time}: ${dup.count} раз`);
      });
    } else {
      console.log('✅ Дубликатов в базе НЕ найдено');
    }
    
    // Последние импорты
    const recent = await prisma.gachaPull.findMany({
      where: { game: 'GENSHIN' },
      orderBy: { id: 'desc' },
      take: 5,
      select: { itemName: true, bannerId: true, time: true, id: true }
    });
    
    console.log('\n=== ПОСЛЕДНИЕ 5 ЗАПИСЕЙ ===');
    recent.forEach((pull, i) => {
      console.log(`${i+1}. ${pull.itemName} (${pull.bannerId}) - ${pull.time.toISOString()}`);
    });
  }
  
  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
