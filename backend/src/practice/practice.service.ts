import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import type {
  PracticeAnswerDto,
  PracticeCompleteDto,
  PracticeHistoryItemDto,
  PracticeSessionDto,
  PracticeStep,
  QuizStep,
} from './practice.types';

/** Ánh xạ deckId FE (onboarding) → rootId trong DB. */
const ROOT_ALIAS: Record<string, string> = {
  people: 'r-ren',
  family: 'r-jia',
  study: 'r-xue',
  food: 'r-chi',
};
function resolveRootId(param: string): string {
  return ROOT_ALIAS[param] ?? param;
}

// TTL cache (giây).
const STEPS_TTL = 60 * 60; // nội dung bài (tĩnh) — cache 1h
const SESSION_TTL = 2 * 60 * 60; // phiên luyện tập — 2h

const XP_PER_CORRECT = 10; // khớp FE (usePracticeFlow)
const XP_PER_LEVEL = 100; // 100 XP / cấp
const levelFromXp = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
/** Mức thành thạo suy từ số lần đúng. */
function masteryFrom(correct: number): 'NEW' | 'LEARNING' | 'FAMILIAR' | 'MASTERED' {
  if (correct >= 5) return 'MASTERED';
  if (correct >= 3) return 'FAMILIAR';
  if (correct >= 1) return 'LEARNING';
  return 'NEW';
}

const stepsKey = (rootId: string) => `practice:steps:v4:${rootId}`;
const sessionKey = (sessionId: string) => `practice:session:${sessionId}`;

/** Phiên luyện tập (để chấm câu QUIZ). Lưu Redis + fallback Map in-memory. */
interface StoredSession {
  rootId: string;
  steps: PracticeStep[];
  /** User sở hữu phiên (đã resolve). */
  userId: string;
  /** Id row PracticeSession trong DB (để ghi answer + hoàn thành). */
  dbSessionId: string;
}
const sessions = new Map<string, StoredSession>();

/** Đọc field JSON đa ngữ { vi, en } → chuỗi vi. */
function vi(json: unknown, fallback = ''): string {
  if (!json) return fallback;
  if (typeof json === 'string') return json;
  const o = json as { vi?: string };
  return o.vi ?? fallback;
}
function viList(json: unknown): string[] {
  if (!json) return [];
  const o = json as { vi?: string[] };
  return Array.isArray(o.vi) ? o.vi : [];
}

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private users: UsersService,
  ) {}

  /** Bắt đầu phiên luyện tập theo gốc từ (rootId hoặc alias FE như "people"). */
  async start(rootParam: string, userId = ''): Promise<PracticeSessionDto> {
    const rootId = resolveRootId(rootParam);
    const steps = await this.getSteps(rootId);

    if (!steps || steps.length === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu luyện tập cho gốc này');
    }

    const totalQuiz = steps.filter((s) => s.kind === 'QUIZ').length;

    // Tạo phiên trong DB để lưu tiến trình (best-effort — lỗi DB không chặn UX).
    const resolvedUserId = await this.users.resolveUserId(userId);
    let dbSessionId = '';
    try {
      const p = this.prisma as any;
      // topicId của phiên = chủ đề chứa gốc từ (Root.topicId), nếu có.
      const rootRow = await p.root.findUnique({
        where: { id: rootId },
        select: { topicId: true },
      });
      const row = await p.practiceSession.create({
        data: {
          userId: resolvedUserId,
          rootId,
          topicId: rootRow?.topicId ?? null,
          total: totalQuiz,
        },
        select: { id: true },
      });
      dbSessionId = row.id;
    } catch (e) {
      this.logger.warn(`Không tạo được PracticeSession: ${(e as Error).message}`);
    }

    const sessionId = randomUUID();
    const session: StoredSession = {
      rootId,
      steps,
      userId: resolvedUserId,
      dbSessionId,
    };
    sessions.set(sessionId, session);
    await this.redis.setJson(sessionKey(sessionId), session, SESSION_TTL);

    const pattern = steps.find((s) => s.kind === 'PATTERN');
    const root =
      pattern && pattern.kind === 'PATTERN'
        ? { hz: pattern.hz, py: pattern.py, hv: pattern.hv }
        : { hz: '', py: '', hv: '' };

    return {
      sessionId,
      rootId,
      root,
      totalQuiz,
      steps,
    };
  }

  /** Chấm 1 câu QUIZ. `text` dùng cho variant='input' (gõ chữ Hán). */
  async answer(
    sessionId: string,
    exerciseId: string,
    optionIndex: number,
    text?: string,
  ): Promise<PracticeAnswerDto> {
    const s =
      sessions.get(sessionId) ??
      (await this.redis.getJson<StoredSession>(sessionKey(sessionId)));
    if (!s) throw new NotFoundException('Phiên không tồn tại hoặc đã hết hạn');
    const step = s.steps.find(
      (x): x is QuizStep => x.kind === 'QUIZ' && x.exerciseId === exerciseId,
    );
    if (!step) throw new NotFoundException('Câu hỏi không tồn tại trong phiên');

    const correct =
      step.variant === 'input'
        ? (text ?? '').trim() === (step.answerText ?? '').trim()
        : optionIndex === step.answerIndex;

    // Ghi tiến trình (best-effort — không chặn phản hồi chấm nếu DB lỗi).
    await this.persistAnswer(s, exerciseId, correct);

    return step.variant === 'input'
      ? {
          correct,
          answerIndex: -1,
          answerText: step.answerText,
          explanation: step.explanation,
        }
      : {
          correct,
          answerIndex: step.answerIndex,
          explanation: step.explanation,
        };
  }

  /** Ghi PracticeAnswer + cập nhật UserWordProgress cho 1 câu đã chấm. */
  private async persistAnswer(
    s: StoredSession,
    exerciseId: string,
    correct: boolean,
  ): Promise<void> {
    if (!s.dbSessionId) return;
    const p = this.prisma as any;
    try {
      const ex = await p.exercise.findUnique({
        where: { id: exerciseId },
        select: { wordId: true },
      });
      // Exercise không còn tồn tại (thường do steps cache cũ sau khi seed lại) →
      // bỏ qua để tránh lỗi khoá ngoại; phiên mới sẽ dựng lại với id hợp lệ.
      if (!ex) {
        this.logger.warn(
          `Bỏ qua ghi answer: exerciseId ${exerciseId} không tồn tại (cache cũ?).`,
        );
        return;
      }
      await p.practiceAnswer.create({
        data: { sessionId: s.dbSessionId, exerciseId, isCorrect: correct },
      });
      if (ex.wordId) {
        const prev = await p.userWordProgress.findUnique({
          where: { userId_wordId: { userId: s.userId, wordId: ex.wordId } },
          select: { correctCount: true },
        });
        const nextCorrect = (prev?.correctCount ?? 0) + (correct ? 1 : 0);
        await p.userWordProgress.upsert({
          where: { userId_wordId: { userId: s.userId, wordId: ex.wordId } },
          create: {
            userId: s.userId,
            wordId: ex.wordId,
            seenCount: 1,
            correctCount: correct ? 1 : 0,
            mastery: masteryFrom(correct ? 1 : 0),
            lastSeenAt: new Date(),
          },
          update: {
            seenCount: { increment: 1 },
            correctCount: { increment: correct ? 1 : 0 },
            mastery: masteryFrom(nextCorrect),
            lastSeenAt: new Date(),
          },
        });
      }
    } catch (e) {
      this.logger.warn(`Không ghi được tiến trình câu trả lời: ${(e as Error).message}`);
    }
  }

  /**
   * Hoàn thành phiên: tổng hợp kết quả từ PracticeAnswer, cập nhật
   * PracticeSession (completedAt/correctCount/xpEarned) và User (xp/level/streak).
   */
  async complete(sessionId: string, userId = ''): Promise<PracticeCompleteDto> {
    const s =
      sessions.get(sessionId) ??
      (await this.redis.getJson<StoredSession>(sessionKey(sessionId)));
    if (!s) throw new NotFoundException('Phiên không tồn tại hoặc đã hết hạn');

    const total = s.steps.filter((x) => x.kind === 'QUIZ').length;
    const p = this.prisma as any;
    const resolvedUserId = s.userId || (await this.users.resolveUserId(userId));

    let correct = 0;
    let xpEarned = 0;
    let totalXp = 0;
    let level = 1;
    let streak = 0;

    try {
      if (s.dbSessionId) {
        const rows = await p.practiceAnswer.findMany({
          where: { sessionId: s.dbSessionId },
          select: { isCorrect: true },
        });
        correct = rows.filter((r: any) => r.isCorrect).length;
        xpEarned = correct * XP_PER_CORRECT;

        await p.practiceSession.update({
          where: { id: s.dbSessionId },
          data: { completedAt: new Date(), correctCount: correct, xpEarned, total },
        });
      } else {
        // Không có row DB (tạo phiên lỗi) → vẫn tính XP để cập nhật user.
        xpEarned = 0;
      }

      const user = await p.user.findUnique({
        where: { id: resolvedUserId },
        select: { xp: true, streak: true, lastActiveDate: true },
      });
      totalXp = (user?.xp ?? 0) + xpEarned;
      level = levelFromXp(totalXp);
      streak = nextStreak(user?.lastActiveDate ?? null, user?.streak ?? 0);

      await p.user.update({
        where: { id: resolvedUserId },
        data: { xp: totalXp, level, streak, lastActiveDate: new Date() },
      });
    } catch (e) {
      this.logger.warn(`Không hoàn thành được phiên: ${(e as Error).message}`);
    }

    return { correct, total, xpEarned, totalXp, level, streak };
  }

  /** Lịch sử luyện tập của user: các phiên đã hoàn thành, mới nhất trước. */
  async history(userId = ''): Promise<PracticeHistoryItemDto[]> {
    const resolvedUserId = await this.users.resolveUserId(userId);
    const p = this.prisma as any;

    const rows = await p.practiceSession.findMany({
      where: { userId: resolvedUserId, completedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rootId: true,
        topicId: true,
        total: true,
        correctCount: true,
        xpEarned: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const rootIds = [...new Set(rows.map((r: any) => r.rootId).filter(Boolean))];
    const topicIds = [...new Set(rows.map((r: any) => r.topicId).filter(Boolean))];
    const roots = rootIds.length
      ? await p.root.findMany({ where: { id: { in: rootIds } }, select: { id: true, hz: true, hv: true } })
      : [];
    const topics = topicIds.length
      ? await p.topic.findMany({ where: { id: { in: topicIds } }, select: { id: true, title: true } })
      : [];
    const rootMap = new Map<string, any>(roots.map((r: any) => [r.id, r]));
    const topicMap = new Map<string, any>(topics.map((t: any) => [t.id, t]));

    return rows.map((r: any) => {
      const root = r.rootId ? rootMap.get(r.rootId) : null;
      const topic = r.topicId ? topicMap.get(r.topicId) : null;
      return {
        id: r.id,
        rootHz: root?.hz ?? null,
        rootHv: root ? cap(root.hv) : null,
        topicTitle: topic ? vi(topic.title) : null,
        correct: r.correctCount,
        total: r.total,
        xpEarned: r.xpEarned,
        completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
        createdAt: new Date(r.createdAt).toISOString(),
      };
    });
  }

  /**
   * Cache-aside: lấy steps đã dựng của 1 gốc từ. Hit Redis → trả ngay;
   * miss → dựng từ DB rồi cache (TTL 1h). Redis lỗi → tự rơi về DB.
   */
  private async getSteps(rootId: string): Promise<PracticeStep[]> {
    const cached = await this.redis.getJson<PracticeStep[]>(stepsKey(rootId));
    if (cached && cached.length) return cached;
    const steps = await this.buildStepsFromDb(rootId);
    if (steps.length) await this.redis.setJson(stepsKey(rootId), steps, STEPS_TTL);
    return steps;
  }

  /**
   * Dựng steps từ DB (model HSK: Root/RootPattern/PatternWord/Word/WordRoot/Exercise).
   * TEACH: mỗi từ ghép của pattern (kèm phân tích chữ từ WordRoot).
   * PATTERN: root + các pattern (RootPattern) + ví dụ (PatternWord → Word).
   * QUIZ: các Exercise dạng A1 gắn với rootId.
   */
  private async buildStepsFromDb(rootId: string): Promise<PracticeStep[]> {
    // Prisma delegate theo schema mới (Root/RootPattern/PatternWord/Word/WordRoot/Exercise).
    const p = this.prisma as any;

    const root = await p.root.findUnique({
      where: { id: rootId },
      include: {
        patterns: {
          orderBy: { order: 'asc' },
          include: {
            words: {
              orderBy: { order: 'asc' },
              include: { word: { include: { roots: { include: { root: true } } } } },
            },
          },
        },
      },
    });
    if (!root) return [];

    const steps: PracticeStep[] = [];

    // Danh sách từ minh hoạ (gộp mọi pattern, giữ thứ tự, khử trùng).
    const words: any[] = [];
    for (const pat of root.patterns)
      for (const pw of pat.words)
        if (!words.some((w) => w.id === pw.word.id)) words.push(pw.word);

    // Tra nghĩa theo TỪNG KÝ TỰ để "Phân tích chữ" tách đủ chữ (vd 包子 → 包 + 子).
    const teachWords = words.slice(0, 2);
    const HAN = /[一-鿿]/;
    const chars = Array.from(
      new Set(
        teachWords.flatMap((w: any) => [...w.hz]).filter((c: string) => HAN.test(c)),
      ),
    ) as string[];
    const [rootRows, wordRows] = await Promise.all([
      chars.length ? p.root.findMany({ where: { hz: { in: chars } } }) : [],
      chars.length ? p.word.findMany({ where: { hz: { in: chars } } }) : [],
    ]);
    const rootByHz = new Map<string, any>();
    for (const r of rootRows) if (!rootByHz.has(r.hz)) rootByHz.set(r.hz, r);
    const wordByHz = new Map<string, any>();
    for (const wd of wordRows) if (!wordByHz.has(wd.hz)) wordByHz.set(wd.hz, wd);

    // TEACH: 2 từ đầu.
    for (const w of teachWords) {
      const parts = ([...w.hz] as string[])
        .filter((ch) => HAN.test(ch))
        .map((ch) => {
          const wr = (w.roots ?? []).find((x: any) => x.root.hz === ch);
          const r = wr?.root ?? rootByHz.get(ch);
          if (r) return { hz: ch, hv: cap(r.hv), gloss: cap(r.hv) };
          const wd = wordByHz.get(ch);
          if (wd) return { hz: ch, hv: cap(wd.hv), gloss: vi(wd.meaning) || cap(wd.hv) };
          return { hz: ch, hv: '', gloss: '' };
        });
      const meaning = vi(w.meaning);
      const distractors = words
        .filter((x) => x.id !== w.id)
        .map((x) => vi(x.meaning))
        .slice(0, 3);
      const options = shuffle([meaning, ...distractors]);
      steps.push({
        kind: 'TEACH',
        wordId: w.id,
        hz: w.hz,
        py: w.py,
        hv: cap(w.hv),
        meaning,
        parts: parts.length ? parts : [{ hz: w.hz, hv: cap(w.hv), gloss: meaning }],
        options,
        answerIndex: options.indexOf(meaning),
        explanation: `${w.hz} [${w.py}]: ${meaning}`,
        example: {
          hz: w.exSample ?? '',
          py: w.exPinyin ?? '',
          meaning: vi(w.exMeaning),
        },
        audioUrl: w.audioUrl ?? null,
      });
    }

    // PATTERN.
    steps.push({
      kind: 'PATTERN',
      rootId: root.id,
      hz: root.hz,
      py: root.py,
      hv: cap(root.hv),
      title: 'Nhận ra pattern để ra từ mới',
      patterns: root.patterns.map((pat: any) => ({
        formula: pat.formula,
        meaning: pat.meaning,
        examples: pat.words.map((pw: any) => ({
          hz: pw.word.hz,
          py: pw.word.py,
          meaning: vi(pw.word.meaning),
        })),
      })),
    });

    // QUIZ: các dạng hỗ trợ (trắc nghiệm / đúng-sai / nghe / gõ chữ).
    // Bỏ B2 (nhìn ảnh) và D3 (nối từ) vì chưa có layout.
    const QUIZ_TYPES = [
      'A1', 'A2', 'A4', 'B1', 'A3', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'B3',
    ];
    const exercises = await p.exercise.findMany({
      where: { rootId, type: { in: QUIZ_TYPES } },
      orderBy: [{ order: 'asc' }],
      take: 8,
      include: { word: true },
    });
    for (const ex of exercises) {
      const type: string = ex.type;
      const optionsRaw = viList(ex.answers);
      const options = optionsRaw.map(stripLetter);
      const correct = vi(ex.correctAnswer); // "A".."D" hoặc chữ Hán (input)

      let variant: 'mcq' | 'boolean' | 'input' | 'audio' = 'mcq';
      if (type === 'B3') variant = 'input';
      else if (type === 'A2') variant = 'audio';
      else if (options.length === 2) variant = 'boolean';

      const isWordCard = type === 'A1' || type === 'A4';
      steps.push({
        kind: 'QUIZ',
        exerciseId: ex.id,
        type,
        variant,
        title: vi(ex.title, 'Luyện tập'),
        question: vi(ex.question),
        word: isWordCard ? { hz: ex.word.hz, py: ex.word.py } : null,
        prompt: isWordCard
          ? type === 'A4'
            ? 'Chọn phiên âm & nghĩa'
            : 'Nghĩa là gì nhỉ?'
          : undefined,
        audioText: variant === 'audio' ? ex.word.hz : undefined,
        options: variant === 'input' ? [] : options,
        answerIndex: variant === 'input' ? -1 : letterToIndex(correct, optionsRaw),
        answerText: variant === 'input' ? correct : undefined,
        explanation: vi(ex.explanation),
      });
    }

    return steps;
  }
}

/* ------------------------ helpers ------------------------ */
/** Streak mới dựa trên ngày hoạt động gần nhất: hôm nay giữ nguyên, hôm qua +1, xa hơn reset 1. */
function nextStreak(last: Date | null, current: number): number {
  if (!last) return 1;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(last))) / dayMs);
  if (diff <= 0) return current || 1; // cùng ngày
  if (diff === 1) return (current || 0) + 1; // ngày kế tiếp
  return 1; // đứt chuỗi
}
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
/** "A. công nhân" → "công nhân". */
function stripLetter(s: string): string {
  return s.replace(/^[A-D]\.\s*/, '');
}
/** correctAnswer "C" + options → index; fallback so khớp text. */
function letterToIndex(correct: string, options: string[]): number {
  const letter = correct.trim().toUpperCase();
  if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
  const i = options.findIndex((o) => stripLetter(o) === stripLetter(correct));
  return i >= 0 ? i : 0;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
