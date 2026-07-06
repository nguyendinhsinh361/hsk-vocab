import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { vi } from '../common/i18n-json.util';
import { cap } from '../common/string.util';
import { QUIZ_TYPES } from '../practice/practice.constants';
import {
  assemblePracticeSteps,
  toQuizStep,
  type PracticeContentBundle,
} from '../practice/practice-content.builder';
import { PracticeSessionStore } from '../practice/practice-session.store';
import type { PracticeSessionDto } from '../practice/practice.types';
import { ReviewRepository } from './review.repository';

/** Số từ tối đa mỗi phiên ôn. */
const REVIEW_SESSION_WORDS = 10;
/** Số từ preview ở màn queue. */
const QUEUE_PREVIEW = 5;

export interface ReviewQueueDto {
  /** Tổng số từ đến hạn ôn. */
  due: number;
  /** Vài từ đầu tiên để hiển thị preview. */
  words: { id: string; hz: string; py: string; hv: string }[];
}

/**
 * PHIÊN ÔN TẬP — khép kín vòng học của spec BNPD:
 * từ đã học trả lời sai (grading đánh dấu) → đến hạn → phiên ôn.
 *
 * Tái dùng tối đa hạ tầng luyện tập: mọi từ đi công thức "đã học"
 * (generateExercisePlan với learned=true → 1 bài C1/C3 + D3 nối từ cuối),
 * chấm/hoàn thành dùng chung endpoint /practice/answer + /practice/complete.
 */
@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private sessions: PracticeSessionStore,
    private repo: ReviewRepository,
  ) {}

  /** Trạng thái hàng đợi: tổng số từ đến hạn + preview. */
  async queue(userId: string): Promise<ReviewQueueDto> {
    const resolvedUserId = await this.users.resolveUserId(userId);
    const [due, items] = await Promise.all([
      this.repo.countDue(resolvedUserId),
      this.repo.findDue(resolvedUserId, QUEUE_PREVIEW),
    ]);
    if (items.length === 0) return { due, words: [] };

    const rows = await this.prisma.word.findMany({
      where: { id: { in: items.map((i) => i.wordId) } },
      select: { id: true, hz: true, py: true, hv: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const words = items
      .map((i) => byId.get(i.wordId))
      .filter((w): w is NonNullable<typeof w> => !!w)
      .map((w) => ({ id: w.id, hz: w.hz, py: w.py, hv: cap(w.hv) }));
    return { due, words };
  }

  /** Tạo phiên ôn từ các từ đến hạn (nhiều nhất 10 từ, cũ nhất trước). */
  async start(userId: string): Promise<PracticeSessionDto> {
    const resolvedUserId = await this.users.resolveUserId(userId);
    const due = await this.repo.findDue(resolvedUserId, REVIEW_SESSION_WORDS);
    if (due.length === 0) {
      throw new NotFoundException('Chưa có từ nào đến hạn ôn tập');
    }
    const dueIds = due.map((d) => d.wordId);

    const [words, exercises] = await Promise.all([
      this.prisma.word.findMany({ where: { id: { in: dueIds } } }),
      this.prisma.exercise.findMany({
        where: { wordId: { in: dueIds }, type: { in: QUIZ_TYPES } },
        orderBy: [{ order: 'asc' }],
        include: { word: true },
      }),
    ]);
    const wordById = new Map(words.map((w) => [w.id, w]));

    // Bundle tối giản: không TEACH/PATTERN, không D2; giữ thứ tự đến hạn.
    const bundle: PracticeContentBundle = {
      baseSteps: [],
      words: dueIds
        .map((id) => wordById.get(id))
        .filter((w): w is NonNullable<typeof w> => !!w)
        .map((w) => ({
          id: w.id,
          hz: w.hz,
          py: w.py,
          meaning: vi(w.meaning),
          hanVietLevel: w.hanVietLevel,
        })),
      quizCandidates: exercises.map((ex) => ({
        wordId: ex.wordId,
        type: ex.type,
        step: toQuizStep(ex),
      })),
      patternCount: 0,
      levelNum: 1,
    };

    // Mọi từ đều "đã học" → công thức C1/C3 + MATCH nối từ cuối phiên.
    const steps = assemblePracticeSteps(bundle, new Set(dueIds));
    const totalQuiz = steps.filter((s) => s.kind === 'QUIZ').length;

    // KHÔNG tạo PracticeSession lúc này — chỉ ghi DB khi user hoàn thành (nộp).
    const sessionId = await this.sessions.create({
      rootId: '',
      steps,
      userId: resolvedUserId,
      mode: 'REVIEW',
      answers: [],
    });

    return {
      sessionId,
      rootId: 'review',
      root: { hz: '', py: '', hv: '' },
      totalQuiz,
      steps,
    };
  }
}
