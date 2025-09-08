import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGenshinFiveStars() {
  try {
    const user = await prisma.user.findFirst({ where: { uid: '11111111111' } });
    if (user) {
      const fiveStars = await prisma.gachaPull.findMany({
        where: { userId: user.id, rankType: 5, game: 'GENSHIN' },
        include: { banner: true },
        orderBy: { time: 'desc' },
        take: 5
      });
      console.log('Recent 5-stars for Genshin:');
      fiveStars.forEach((p, i) => {
        console.log(`${i+1}. ${p.itemName} (${p.itemType}) from ${p.banner?.bannerName}`);
      });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGenshinFiveStars();
