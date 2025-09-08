import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBanners() {
  try {
    console.log('=== Genshin Impact Banners ===');
    const genshinBanners = await prisma.banner.findMany({ 
      where: { game: 'GENSHIN' },
      select: { bannerName: true, bannerType: true }
    });
    genshinBanners.forEach(b => console.log(`- ${b.bannerName} (${b.bannerType})`));
    
    console.log('\n=== HSR Banners ===');
    const hsrBanners = await prisma.banner.findMany({ 
      where: { game: 'HSR' },
      select: { bannerName: true, bannerType: true }
    });
    hsrBanners.forEach(b => console.log(`- ${b.bannerName} (${b.bannerType})`));

    console.log('\n=== Recent 5-star pulls for Genshin ===');
    const user = await prisma.user.findFirst({ where: { uid: '11111111111' } });
    if (user) {
      const fiveStars = await prisma.gachaPull.findMany({
        where: { userId: user.id, rankType: 5, game: 'GENSHIN' },
        include: { banner: true },
        orderBy: { time: 'desc' },
        take: 5
      });
      fiveStars.forEach(p => console.log(`- ${p.itemName} (${p.itemType}) from ${p.banner?.bannerName}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBanners();
