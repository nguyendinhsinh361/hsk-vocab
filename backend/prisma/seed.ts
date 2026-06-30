import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Prisma 7: phải dùng adapter, không dùng `new PrismaClient()` trần.
const url = new URL(process.env.DATABASE_URL ?? '');
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Demo user (chưa có auth — userId tạm dùng cho quiz/progress, xem README).
  const user = await prisma.user.upsert({
    where: { email: 'demo@migii.local' },
    update: {},
    create: { email: 'demo@migii.local', name: 'Demo User' },
  });

  // Deck mẫu: chủ đề "Con người" - HSK1
  const deck = await prisma.deck.upsert({
    where: { id: 'seed-deck-hsk1-people' },
    update: {},
    create: {
      id: 'seed-deck-hsk1-people',
      name: 'Con người',
      description: 'Nhóm gốc từ về con người — HSK1',
      level: 'HSK1',
      position: 0,
    },
  });

  // Gốc từ 人 + các từ ghép (cây từ)
  const root = await prisma.card.upsert({
    where: { deckId_character: { deckId: deck.id, character: '人' } },
    update: {},
    create: {
      deckId: deck.id,
      character: '人',
      pinyin: 'rén',
      meaning: 'nhân - người',
      level: 'HSK1',
      position: 0,
    },
  });

  const compounds = [
    { character: '人人', pinyin: 'rén rén', meaning: 'mọi người' },
    { character: '大人', pinyin: 'dà rén', meaning: 'người lớn' },
    { character: '好人', pinyin: 'hǎo rén', meaning: 'người tốt' },
    { character: '本人', pinyin: 'běn rén', meaning: 'bản thân' },
  ];

  for (let i = 0; i < compounds.length; i++) {
    const c = compounds[i];
    await prisma.card.upsert({
      where: { deckId_character: { deckId: deck.id, character: c.character } },
      update: {},
      create: {
        deckId: deck.id,
        character: c.character,
        pinyin: c.pinyin,
        meaning: c.meaning,
        level: 'HSK1',
        position: i + 1,
        parentId: root.id,
      },
    });
  }

  console.log(`Seeded user=${user.email}, deck=${deck.name}, cards=${compounds.length + 1}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
