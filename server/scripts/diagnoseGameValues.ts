import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const uid = process.argv[2] || '11111111111'
  console.log('Checking games for UID:', uid)

  const user = await prisma.user.findUnique({ where: { uid } })
  if (!user) {
    console.error('User not found:', uid)
    process.exit(1)
  }

  console.log('Found user:', user.id, `(${user.uid})`)

  // Query distinct game values and counts
  const rows: any[] = await prisma.$queryRaw`
    SELECT game, COUNT(*) as cnt FROM gacha_pulls WHERE user_id = ${user.id} GROUP BY game
  `

  console.log('\nDistinct game counts:')
  for (const r of rows) {
    console.log(`${r.game} -> ${r.cnt}`)
  }

  // Show sample pulls
  const samples = await prisma.gachaPull.findMany({
    where: { userId: user.id },
    select: { id: true, gachaId: true, itemName: true, itemType: true, game: true, time: true },
    orderBy: { time: 'desc' },
    take: 20
  })

  console.log('\nSample pulls (latest 20):')
  samples.forEach((p: any) => {
    console.log(p.id.toString(), p.gachaId, p.itemName, p.itemType, p.game, p.time?.toISOString())
  })

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
