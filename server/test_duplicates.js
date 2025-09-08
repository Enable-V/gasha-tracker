import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDuplicateLogic() {
  try {
    // Создаем тестовые данные для двух разных пользователей
    const testData = [
      {
        id: "test_hsr_1",
        name: "Test Character 1",
        item_type: "Character",
        rank_type: 5,
        time: "2025-09-08T10:00:00Z",
        gacha_type: "1"
      },
      {
        id: "test_hsr_2",
        name: "Test Character 2",
        item_type: "Character",
        rank_type: 5,
        time: "2025-09-08T11:00:00Z",
        gacha_type: "1"
      }
    ];

    // Получаем двух пользователей
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
      console.log('Нужно минимум 2 пользователя для теста');
      return;
    }

    console.log('Тестируем логику дубликатов...');

    // Импортируем данные для первого пользователя
    console.log(`\nИмпорт для пользователя ${users[0].uid}:`);
    for (const pull of testData) {
      const existing = await prisma.gachaPull.findFirst({
        where: {
          gachaId: pull.id,
          userId: users[0].id
        }
      });

      if (existing) {
        console.log(`  Крутка ${pull.id} уже существует для пользователя ${users[0].uid} - ПРОПУСК`);
      } else {
        await prisma.gachaPull.create({
          data: {
            userId: users[0].id,
            bannerId: pull.gacha_type,
            gachaId: pull.id,
            itemName: pull.name,
            itemType: pull.item_type,
            rankType: pull.rank_type,
            time: new Date(pull.time),
            game: 'HSR'
          }
        });
        console.log(`  Крутка ${pull.id} создана для пользователя ${users[0].uid}`);
      }
    }

    // Импортируем те же данные для второго пользователя
    console.log(`\nИмпорт для пользователя ${users[1].uid}:`);
    for (const pull of testData) {
      const existing = await prisma.gachaPull.findFirst({
        where: {
          gachaId: pull.id,
          userId: users[1].id
        }
      });

      if (existing) {
        console.log(`  Крутка ${pull.id} уже существует для пользователя ${users[1].uid} - ПРОПУСК`);
      } else {
        await prisma.gachaPull.create({
          data: {
            userId: users[1].id,
            bannerId: pull.gacha_type,
            gachaId: pull.id,
            itemName: pull.name,
            itemType: pull.item_type,
            rankType: pull.rank_type,
            time: new Date(pull.time),
            game: 'HSR'
          }
        });
        console.log(`  Крутка ${pull.id} создана для пользователя ${users[1].uid}`);
      }
    }

    // Проверяем результат
    console.log('\nПроверка результатов:');
    for (const user of users) {
      const pulls = await prisma.gachaPull.findMany({
        where: {
          userId: user.id,
          gachaId: { in: testData.map(p => p.id) }
        }
      });
      console.log(`Пользователь ${user.uid}: ${pulls.length} круток`);
    }

  } catch (error) {
    console.error('Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDuplicateLogic();
