import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { ReviewRepository } from '../review/review.repository';
import type { StoredSession } from './practice-session.store';
import type {
  PracticeAnswerDto,
  PracticeCompleteDto,
  QuizStep,
} from './practice.types';

/**
 * CHẤM câu QUIZ (thuần, không ghi DB) + NỘP phiên khi hoàn thành.
 * Luồng lưu: câu trả lời được tích luỹ trong phiên (Redis); tới khi user
 * hoàn thành mới ghi 1 lần vào DB (PracticeSession + PracticeAnswer +
 * UserWordProgress + XP/level/streak) trong 1 transaction → không có phiên dở.
 * Kèm cập nhật HÀNG ĐỢI ÔN TẬP (spec BNPD, best-effort, ngoài transaction).
 */
@Injectable()
export class PracticeGradingService {
  private readonly logger = new Logger(PracticeGradingService.name);

  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private reviews: ReviewRepository,
  ) {}

  /** Chấm 1 câu trong phiên (chỉ tính đúng/sai, KHÔNG ghi DB). */
  grade(
    session: StoredSession,
    exerciseId: string,
    optionIndex: number,
    text?: string,
  ): PracticeAnswerDto {
    const step = session.steps.find(
      (x): x is QuizStep => x.kind === 'QUIZ' && x.exerciseId === exerciseId,
    );
    if (!step) throw new NotFoundException('Câu hỏi không tồn tại trong phiên');

    const correct =
      step.variant === 'input'
        ? (text ?? '').trim() === (step.answerText ?? '').trim()
        : optionIndex === step.answerIndex;

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

  /**
   * NỘP phiên: ghi toàn bộ tiến trình vào DB một lần.
   * Idempotent nhờ PracticeSession.id = sessionId (gọi lại → trả kết quả cũ).
   */
  async submit(
    sessionId: string,
    s: StoredSession,
    resolvedUserId: string,
  ): Promise<PracticeCompleteDto> {
    const total = s.steps.filter((x) => x.kind === 'QUIZ').length;
    const answers = s.answers ?? [];

    // Đã nộp trước đó → trả kết quả cũ (không cộng XP trùng).
    const existing = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: { correctCount: true, total: true, xpEarned: true },
    });
    if (existing) {
      const user = await this.prisma.user.findUnique({
        where: { id: resolvedUserId },
        select: { xp: true, level: true, streak: true },
      });
      return {
        correct: existing.correctCount,
        total: existing.total,
        xpEarned: existing.xpEarned,
        totalXp: user?.xp ?? 0,
        level: user?.level ?? 1,
        streak: user?.streak ?? 0,
      };
    }

    const correct = answers.filter((a) => a.correct).length;
    const xpEarned = this.gamification.xpForCorrect(correct);

    // Đọc (ngoài transaction): wordId của từng exercise, topic của gốc, tiến trình cũ, user.
    const exIds = [...new Set(answers.map((a) => a.exerciseId))];
    const exs = exIds.length
      ? await this.prisma.exercise.findMany({
          where: { id: { in: exIds } },
          select: { id: true, wordId: true },
        })
      : [];
    const exWord = new Map(exs.map((e) => [e.id, e.wordId] as const));
    const valid = answers.filter((a) => exWord.has(a.exerciseId));

    // Gộp theo từ: số lần gặp + số lần đúng trong phiên.
    const wordAgg = new Map<string, { seen: number; correct: number }>();
    for (const a of valid) {
      const wid = exWord.get(a.exerciseId);
      if (!wid) continue;
      const c = wordAgg.get(wid) ?? { seen: 0, correct: 0 };
      c.seen += 1;
      if (a.correct) c.correct += 1;
      wordAgg.set(wid, c);
    }
    const wordIds = [...wordAgg.keys()];
    const prog = wordIds.length
      ? await this.prisma.userWordProgress.findMany({
          where: { userId: resolvedUserId, wordId: { in: wordIds } },
          select: { wordId: true, correctCount: true },
        })
      : [];
    const progMap = new Map(
      prog.map((p) => [p.wordId, p.correctCount] as const),
    );
    const rootRow = s.rootId
      ? await this.prisma.root.findUnique({
          where: { id: s.rootId },
          select: { topicId: true },
        })
      : null;
    const user = await this.prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: { xp: true, streak: true, lastActiveDate: true },
    });
    const totalXp = (user?.xp ?? 0) + xpEarned;
    const level = this.gamification.levelFromXp(totalXp);
    const streak = this.gamification.nextStreak(
      user?.lastActiveDate ?? null,
      user?.streak ?? 0,
    );

    // Ghi tất cả trong 1 transaction (dữ liệu học tập — không nuốt lỗi).
    await this.prisma.$transaction(async (tx) => {
      await tx.practiceSession.create({
        data: {
          id: sessionId,
          userId: resolvedUserId,
          rootId: s.rootId ?? null,
          topicId: rootRow?.topicId ?? null,
          total,
          correctCount: correct,
          xpEarned,
          completedAt: new Date(),
          answers: {
            create: valid.map((a) => ({
              exerciseId: a.exerciseId,
              isCorrect: a.correct,
              answer: a.answer ?? null,
            })),
          },
        },
      });
      for (const [wid, agg] of wordAgg) {
        const nextCorrect = (progMap.get(wid) ?? 0) + agg.correct;
        await tx.userWordProgress.upsert({
          where: { userId_wordId: { userId: resolvedUserId, wordId: wid } },
          create: {
            userId: resolvedUserId,
            wordId: wid,
            seenCount: agg.seen,
            correctCount: agg.correct,
            mastery: this.gamification.masteryFrom(agg.correct),
            lastSeenAt: new Date(),
          },
          update: {
            seenCount: { increment: agg.seen },
            correctCount: { increment: agg.correct },
            mastery: this.gamification.masteryFrom(nextCorrect),
            lastSeenAt: new Date(),
          },
        });
      }
      await tx.user.update({
        where: { id: resolvedUserId },
        data: { xp: totalXp, level, streak, lastActiveDate: new Date() },
      });
    });

    // Hàng đợi ôn tập (spec BNPD) — best-effort, ngoài transaction.
    for (const a of valid) {
      const wid = exWord.get(a.exerciseId);
      if (!wid) continue;
      const step = s.steps.find(
        (x): x is QuizStep =>
          x.kind === 'QUIZ' && x.exerciseId === a.exerciseId,
      );
      try {
        if (s.mode === 'REVIEW') {
          await this.reviews.applyReviewAnswer(resolvedUserId, wid, a.correct);
        } else if (!a.correct && step?.reviewOnWrong) {
          await this.reviews.markLapse(resolvedUserId, wid);
        }
      } catch (e) {
        this.logger.warn(
          `Không cập nhật được hàng đợi ôn tập: ${(e as Error).message}`,
        );
      }
    }

    return { correct, total, xpEarned, totalXp, level, streak };
  }
}
