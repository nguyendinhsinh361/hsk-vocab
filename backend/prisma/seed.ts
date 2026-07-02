import 'dotenv/config';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Prisma 7: dùng adapter MySQL (không new PrismaClient trần).
const url = new URL(process.env.DATABASE_URL || 'mysql://root@localhost:3306/migii_hsk');
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const DATA_DIR = join(__dirname, 'data');

/* ------------------------- helpers ------------------------- */
type Row = Record<string, string>;
const readCsv = (dir: string, name: string): Row[] => {
  const p = join(dir, name);
  if (!existsSync(p)) return [];
  return parse(readFileSync(p), { columns: true, skip_empty_lines: true, bom: true }) as Row[];
};
// CSV có thể chứa literal Python 'None'/'nan' hoặc chuỗi rỗng → coi như thiếu.
const isBlank = (s?: string) => {
  if (s == null) return true;
  const t = s.trim();
  return t === '' || t === 'None' || t === 'null' || t === 'nan' || t === 'NaN';
};
// Vài ô nguồn không được JSON-encode (vd correctAnswer='B', question=câu trần).
// Parse được thì dùng, không thì bọc thành { vi: raw } để không mất dữ liệu.
const parseOrWrap = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return { vi: s };
  }
};
const j = (s?: string) => (isBlank(s) ? null : parseOrWrap(s as string));
const jReq = (s?: string) => (isBlank(s) ? {} : parseOrWrap(s as string));
const int = (s?: string) => (isBlank(s) ? 0 : parseInt(s as string, 10));
const posEnum = (s?: string) => (s && s.trim() ? s.trim().toUpperCase() : 'UNKNOWN');

/* Xoá sạch (đúng thứ tự FK) rồi nạp lại. */
async function reset() {
  await prisma.practiceAnswer.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.userWordProgress.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.patternWord.deleteMany();
  await prisma.wordRoot.deleteMany();
  await prisma.topicWord.deleteMany();
  await prisma.rootPattern.deleteMany();
  await prisma.root.deleteMany();
  await prisma.word.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();
}

async function chunked<T>(items: T[], size: number, fn: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) await fn(items.slice(i, i + size));
}

async function seedLevel(dir: string, hskLevel: string) {
  // 1) Topics
  const topics = readCsv(dir, 'topics.csv');
  await prisma.topic.createMany({
    data: topics.map((t) => ({
      id: t.id,
      hskLevel: hskLevel as any,
      order: int(t.order),
      title: jReq(t.title),
      groupType: (t.groupType || 'topic_group').toUpperCase() as any,
      estimatedMinutes: int(t.estimatedMinutes),
    })),
    skipDuplicates: true,
  });

  // 2) Words
  const words = readCsv(dir, 'words.csv');
  await chunked(words, 500, (batch) =>
    prisma.word.createMany({
      data: batch.map((w) => ({
        id: w.id,
        hz: w.hz,
        py: w.py,
        hv: w.hv,
        pos: posEnum(w.pos) as any,
        meaning: jReq(w.mn),
        audioUrl: w.audioUrl || null,
        mw: w.mw || null,
        exSample: w.exSample || null,
        exPinyin: w.exPinyin || null,
        exMeaning: j(w.exMeaning),
        hskLevel: hskLevel as any,
        hanVietLevel: (w.hanVietLevel || 'M1').toUpperCase() as any,
        isPublished: w.isPublished === 'true',
        createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
      })),
      skipDuplicates: true,
    }),
  );

  // 3) Roots (+ tách patterns → RootPattern + PatternWord)
  const roots = readCsv(dir, 'roots.csv');
  const rootPatterns: any[] = [];
  const patternWords: any[] = [];
  for (const r of roots) {
    const pats = j(r.patterns) || [];
    pats.forEach((p: any, idx: number) => {
      const pid = `${r.id}::${idx}`;
      rootPatterns.push({ id: pid, rootId: r.id, formula: p.formula, meaning: p.meaning ?? '', order: idx });
      (p.wordIds || []).forEach((wid: string, k: number) =>
        patternWords.push({ patternId: pid, wordId: wid, order: k }),
      );
    });
  }
  await prisma.root.createMany({
    data: roots.map((r) => ({
      id: r.id,
      hz: r.hz,
      py: r.py,
      hv: r.hv,
      hskLevel: hskLevel as any,
      topicId: r.topicId || null,
    })),
    skipDuplicates: true,
  });
  await prisma.rootPattern.createMany({ data: rootPatterns, skipDuplicates: true });
  await prisma.patternWord.createMany({ data: patternWords, skipDuplicates: true });

  // 4) Bảng nối
  const tw = readCsv(dir, 'topic_words.csv');
  await chunked(tw, 500, (b) =>
    prisma.topicWord.createMany({
      data: b.map((x) => ({ topicId: x.topicId, wordId: x.wordId, order: int(x.order) })),
      skipDuplicates: true,
    }),
  );
  const wr = readCsv(dir, 'word_roots.csv');
  await chunked(wr, 500, (b) =>
    prisma.wordRoot.createMany({
      data: b.map((x) => ({ wordId: x.wordId, rootId: x.rootId, order: int(x.order) })),
      skipDuplicates: true,
    }),
  );

  // 5) Exercises (batch)
  const ex = readCsv(dir, 'exercises.csv');
  await chunked(ex, 500, (b) =>
    prisma.exercise.createMany({
      data: b.map((x, i) => ({
        topicId: x.topicId || null,
        rootId: x.rootId || null,
        wordId: x.wordId,
        type: x.type as any,
        group: x.group as any,
        title: jReq(x.title),
        question: jReq(x.question),
        answers: jReq(x.answers),
        correctAnswer: jReq(x.correctAnswer),
        explanation: j(x.explanation),
        audioScript: isBlank(x.audio_script) ? null : x.audio_script,
        imageDescription: isBlank(x.image_description) ? null : x.image_description,
        hskLevel: hskLevel as any,
        order: int(x.order) || i,
      })),
    }),
  );

  console.log(
    `  [${hskLevel}] topics=${topics.length} words=${words.length} roots=${roots.length} ` +
      `patterns=${rootPatterns.length} patternWords=${patternWords.length} topicWords=${tw.length} wordRoots=${wr.length} exercises=${ex.length}`,
  );
}

async function main() {
  console.log('Reset DB…');
  await reset();

  // Duyệt từng thư mục cấp độ: data/hsk1, data/hsk2, …
  const levels = readdirSync(DATA_DIR)
    .filter((d) => statSync(join(DATA_DIR, d)).isDirectory())
    .sort();
  for (const lv of levels) {
    const dir = join(DATA_DIR, lv);
    if (!existsSync(join(dir, 'topics.csv'))) {
      console.log(`  bỏ qua ${lv} (chưa có dữ liệu)`);
      continue;
    }
    await seedLevel(dir, lv.toUpperCase());
  }

  // Demo user (chưa có auth)
  await prisma.user.upsert({
    where: { email: 'demo@migii.local' },
    update: {},
    create: { email: 'demo@migii.local', name: 'Demo User' },
  });

  console.log('Seed xong.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
