import { Injectable } from '@nestjs/common';
import type { HanVietLevel, Prisma, Root, Word } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { vi, viList } from '../common/i18n-json.util';
import { cap } from '../common/string.util';
import { generateExercisePlan } from '../exercise-plan/exercise-plan.generator';
import type {
  ExerciseTypeCode,
  PlanWordInput,
} from '../exercise-plan/exercise-plan.types';
import {
  QUIZ_TAKE,
  QUIZ_TYPES,
  STEPS_TTL,
  bundleKey,
} from './practice.constants';
import type { MatchStep, PracticeStep, QuizStep } from './practice.types';

/** Từ kèm phân tích gốc (WordRoot → Root) — payload của include bên dưới. */
type WordWithRoots = Prisma.WordGetPayload<{
  include: { roots: { include: { root: true } } };
}>;

/** Exercise kèm từ — payload của include bên dưới. */
export type ExerciseWithWord = Prisma.ExerciseGetPayload<{
  include: { word: true };
}>;

/** Thông tin từ trong bundle (đủ cho plan + bài nối từ). */
export interface BundleWord {
  id: string;
  hz: string;
  py: string;
  meaning: string;
  hanVietLevel: HanVietLevel;
}

/** 1 bài QUIZ đã render sẵn trong kho, chờ plan chọn. */
export interface QuizCandidate {
  /** null = bài mức gốc (D2). */
  wordId: string | null;
  type: string;
  step: QuizStep;
}

/**
 * BUNDLE nội dung 1 gốc từ — USER-AGNOSTIC nên cache chung được.
 * Phần phụ thuộc user (learned → plan) sinh lúc start() từ bundle này.
 */
export interface PracticeContentBundle {
  /** TEACH + PATTERN theo thứ tự sư phạm. */
  baseSteps: PracticeStep[];
  words: BundleWord[];
  quizCandidates: QuizCandidate[];
  patternCount: number;
  /** Level nội dung suy từ Root.hskLevel (HSK1 → 1) — đầu vào cho plan. */
  levelNum: number;
}

/**
 * Dựng NỘI DUNG bài luyện tập của 1 gốc từ:
 * TEACH: mỗi từ ghép của pattern (kèm phân tích chữ từ WordRoot).
 * PATTERN: root + các pattern (RootPattern) + ví dụ (PatternWord → Word).
 * QUIZ: kho candidates theo (từ, dạng) — thuật toán BNPD chọn lúc start().
 */
@Injectable()
export class PracticeContentBuilder {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Cache-aside: hit Redis → trả ngay; miss → dựng từ DB rồi cache (TTL 1h).
   * Redis lỗi → tự rơi về DB.
   */
  async getBundle(rootId: string): Promise<PracticeContentBundle | null> {
    const cached = await this.redis.getJson<PracticeContentBundle>(
      bundleKey(rootId),
    );
    if (cached && cached.baseSteps.length) return cached;
    const bundle = await this.buildBundleFromDb(rootId);
    if (bundle && bundle.baseSteps.length)
      await this.redis.setJson(bundleKey(rootId), bundle, STEPS_TTL);
    return bundle;
  }

  private async buildBundleFromDb(
    rootId: string,
  ): Promise<PracticeContentBundle | null> {
    const root = await this.prisma.root.findUnique({
      where: { id: rootId },
      include: {
        patterns: {
          orderBy: { order: 'asc' },
          include: {
            words: {
              orderBy: { order: 'asc' },
              include: {
                word: { include: { roots: { include: { root: true } } } },
              },
            },
          },
        },
      },
    });
    if (!root) return null;

    const baseSteps: PracticeStep[] = [];

    // Danh sách từ minh hoạ (gộp mọi pattern, giữ thứ tự, khử trùng).
    const words: WordWithRoots[] = [];
    for (const pat of root.patterns)
      for (const pw of pat.words)
        if (!words.some((w) => w.id === pw.word.id)) words.push(pw.word);

    // Tra nghĩa theo TỪNG KÝ TỰ để "Phân tích chữ" tách đủ chữ (vd 包子 → 包 + 子).
    const teachWords = words.slice(0, 2);
    const HAN = /[一-鿿]/;
    const chars = Array.from(
      new Set(teachWords.flatMap((w) => [...w.hz]).filter((c) => HAN.test(c))),
    );
    const [rootRows, wordRows] = await Promise.all([
      chars.length
        ? this.prisma.root.findMany({ where: { hz: { in: chars } } })
        : Promise.resolve([] as Root[]),
      chars.length
        ? this.prisma.word.findMany({ where: { hz: { in: chars } } })
        : Promise.resolve([] as Word[]),
    ]);
    const rootByHz = new Map<string, Root>();
    for (const r of rootRows) if (!rootByHz.has(r.hz)) rootByHz.set(r.hz, r);
    const wordByHz = new Map<string, Word>();
    for (const wd of wordRows)
      if (!wordByHz.has(wd.hz)) wordByHz.set(wd.hz, wd);

    // TEACH: 2 từ đầu.
    for (const w of teachWords) {
      const parts = [...w.hz]
        .filter((ch) => HAN.test(ch))
        .map((ch) => {
          const wr = (w.roots ?? []).find((x) => x.root.hz === ch);
          const r = wr?.root ?? rootByHz.get(ch);
          if (r) return { hz: ch, hv: cap(r.hv), gloss: cap(r.hv) };
          const wd = wordByHz.get(ch);
          if (wd)
            return {
              hz: ch,
              hv: cap(wd.hv),
              gloss: vi(wd.meaning) || cap(wd.hv),
            };
          return { hz: ch, hv: '', gloss: '' };
        });
      const meaning = vi(w.meaning);
      const distractors = words
        .filter((x) => x.id !== w.id)
        .map((x) => vi(x.meaning))
        .slice(0, 3);
      const options = shuffle([meaning, ...distractors]);
      baseSteps.push({
        kind: 'TEACH',
        wordId: w.id,
        hz: w.hz,
        py: w.py,
        hv: cap(w.hv),
        meaning,
        parts: parts.length
          ? parts
          : [{ hz: w.hz, hv: cap(w.hv), gloss: meaning }],
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
    baseSteps.push({
      kind: 'PATTERN',
      rootId: root.id,
      hz: root.hz,
      py: root.py,
      hv: cap(root.hv),
      title: 'Nhận ra pattern để ra từ mới',
      patterns: root.patterns.map((pat) => ({
        formula: pat.formula,
        meaning: pat.meaning,
        examples: pat.words.map((pw) => ({
          hz: pw.word.hz,
          py: pw.word.py,
          meaning: vi(pw.word.meaning),
        })),
      })),
    });

    // Kho bài QUIZ: mọi bài có dữ liệu cho các từ của gốc + bài mức gốc (D2).
    const wordIds = words.map((w) => w.id);
    const exercises = await this.prisma.exercise.findMany({
      where: {
        type: { in: QUIZ_TYPES },
        OR: [{ wordId: { in: wordIds } }, { rootId }],
      },
      orderBy: [{ order: 'asc' }],
      include: { word: true },
    });
    const quizCandidates: QuizCandidate[] = exercises.map((ex) => ({
      // D2 là bài tổng kết mức gốc — plan tra theo wordId null.
      wordId: ex.type === 'D2' ? null : ex.wordId,
      type: ex.type,
      step: toQuizStep(ex),
    }));

    return {
      baseSteps,
      words: words.map((w) => ({
        id: w.id,
        hz: w.hz,
        py: w.py,
        meaning: vi(w.meaning),
        hanVietLevel: w.hanVietLevel,
      })),
      quizCandidates,
      patternCount: root.patterns.length,
      levelNum: hskLevelNum(root.hskLevel),
    };
  }
}

/**
 * LẮP RÁP steps cho 1 phiên theo user (hàm THUẦN — unit-test được):
 * 1. Sinh plan BNPD từ bundle: hanViet của từ, learned theo user,
 *    level nội dung, số pattern.
 * 2. Map từng bài đã lên lịch → candidate trong kho (không dùng lại);
 *    D3 tổng hợp thành bài MATCH (nối từ) từ chính words — luôn cuối cùng.
 * 3. Kho không khớp plan (dữ liệu cũ) → fallback QUIZ_TAKE bài đầu.
 */
export function assemblePracticeSteps(
  bundle: PracticeContentBundle,
  learnedWordIds: ReadonlySet<string>,
): PracticeStep[] {
  const planInput: PlanWordInput[] = bundle.words.map((w) => ({
    wordId: w.id,
    hanViet: w.hanVietLevel,
    learned: learnedWordIds.has(w.id),
    availableTypes: [
      ...new Set(
        bundle.quizCandidates
          .filter((c) => c.wordId === w.id)
          .map((c) => c.type as ExerciseTypeCode),
      ),
    ],
  }));

  const plan = generateExercisePlan(planInput, {
    mode: 'ROOT',
    patternCount: bundle.patternCount,
    userLevel: bundle.levelNum,
  });

  // Kho lấy-1-lần theo (wordId, dạng).
  const pool = new Map<string, QuizStep[]>();
  const keyOf = (wordId: string | null, type: string) =>
    `${wordId ?? 'root'}:${type}`;
  for (const c of bundle.quizCandidates) {
    const k = keyOf(c.wordId, c.type);
    (pool.get(k) ?? pool.set(k, []).get(k)!).push(c.step);
  }

  const wordById = new Map(bundle.words.map((w) => [w.id, w]));
  const quizSteps: QuizStep[] = [];
  const matchSteps: MatchStep[] = [];

  for (const item of plan) {
    if (item.type === 'D3') {
      // D3 — Nối từ: tổng hợp từ words, KHÔNG cần row Exercise trong DB.
      const pairs = (item.wordIds ?? [])
        .map((id) => wordById.get(id))
        .filter((w): w is BundleWord => !!w && !!w.meaning)
        .map((w) => ({ wordId: w.id, hz: w.hz, py: w.py, meaning: w.meaning }));
      if (pairs.length >= 2) {
        matchSteps.push({ kind: 'MATCH', title: 'Nối từ với nghĩa', pairs });
      }
      continue;
    }
    // Dạng FE chưa có layout (B2 / C5) không nằm trong QUIZ_TYPES → bỏ qua.
    if (!(QUIZ_TYPES as string[]).includes(item.type)) continue;
    const step = pool.get(keyOf(item.wordId, item.type))?.shift();
    if (!step) continue; // plan có nhưng kho hết bài dạng này
    quizSteps.push({
      ...step,
      ...(item.confusionWarning ? { confusionWarning: true } : {}),
      ...(item.reviewOnWrong ? { reviewOnWrong: true } : {}),
    });
  }

  // Fallback: dữ liệu cũ chưa gắn wordId/hanVietLevel → không trắng bài.
  const quiz =
    quizSteps.length > 0
      ? quizSteps
      : bundle.quizCandidates.slice(0, QUIZ_TAKE).map((c) => c.step);

  // D3 (MATCH) luôn là bài cuối cùng (spec BNPD).
  return [...bundle.baseSteps, ...quiz, ...matchSteps];
}

/* ---------------- helpers thuần (export để unit-test + review) ---------------- */

/** Map 1 row Exercise → QuizStep hiển thị (dùng chung với phiên ôn tập). */
export function toQuizStep(ex: ExerciseWithWord): QuizStep {
  const type = ex.type;
  const optionsRaw = viList(ex.answers);
  const options = optionsRaw.map(stripLetter);
  const correct = vi(ex.correctAnswer); // "A".."D" hoặc chữ Hán (input)

  let variant: 'mcq' | 'boolean' | 'input' | 'audio' = 'mcq';
  if (type === 'B3') variant = 'input';
  else if (type === 'A2') variant = 'audio';
  else if (options.length === 2) variant = 'boolean';

  const isWordCard = type === 'A1' || type === 'A4';
  return {
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
  };
}

/** "HSK1" → 1 (level nội dung cho thuật toán sinh bài). */
export function hskLevelNum(level: string): number {
  const n = Number(String(level).replace(/^HSK/, ''));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** "A. công nhân" → "công nhân". */
export function stripLetter(s: string): string {
  return s.replace(/^[A-D]\.\s*/, '');
}

/** correctAnswer "C" + options → index; fallback so khớp text. */
export function letterToIndex(correct: string, options: string[]): number {
  const letter = correct.trim().toUpperCase();
  if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
  const i = options.findIndex((o) => stripLetter(o) === stripLetter(correct));
  return i >= 0 ? i : 0;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
