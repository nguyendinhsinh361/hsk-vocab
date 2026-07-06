import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { GamificationService } from '../gamification/gamification.service';
import { vi } from '../common/i18n-json.util';
import { cap } from '../common/string.util';
import { resolveRootId } from './practice.constants';
import {
  PracticeContentBuilder,
  assemblePracticeSteps,
} from './practice-content.builder';
import {
  PracticeSessionStore,
  type StoredSession,
} from './practice-session.store';
import { PracticeGradingService } from './practice-grading.service';
import type {
  PracticeAnswerDto,
  PracticeCompleteDto,
  PracticeHistoryItemDto,
  PracticeSessionDto,
  QuizStep,
} from './practice.types';

/**
 * ORCHESTRATOR luồng luyện tập — chỉ điều phối 4 use-case:
 * start / answer / complete / history. Chi tiết nằm ở:
 *   PracticeContentBuilder  — dựng nội dung bài (cache-aside)
 *   PracticeSessionStore    — phiên đang diễn ra (Redis)
 *   PracticeGradingService  — chấm + ghi tiến trình (transaction)
 *   GamificationService     — XP / level / streak / mastery
 */
@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private content: PracticeContentBuilder,
    private sessions: PracticeSessionStore,
    private grading: PracticeGradingService,
    private gamification: GamificationService,
  ) {}

  /** Bắt đầu phiên luyện tập theo gốc từ (rootId hoặc alias FE như "people"). */
  async start(rootParam: string, userId = ''): Promise<PracticeSessionDto> {
    const rootId = resolveRootId(rootParam);
    const bundle = await this.content.getBundle(rootId);

    if (!bundle || bundle.baseSteps.length === 0) {
      throw new NotFoundException(
        'Không tìm thấy dữ liệu luyện tập cho gốc này',
      );
    }

    // Plan sinh THEO USER: từ đã học (mastery FAMILIAR+) đi công thức riêng
    // của spec BNPD (1 bài C1/C3 + vẫn xuất hiện ở bài nối từ cuối).
    const resolvedUserId = await this.users.resolveUserId(userId);
    const learned = await this.learnedWordIds(
      resolvedUserId,
      bundle.words.map((w) => w.id),
    );
    const steps = assemblePracticeSteps(bundle, learned);
    const totalQuiz = steps.filter((s) => s.kind === 'QUIZ').length;

    // KHÔNG tạo PracticeSession lúc này — chỉ tích luỹ câu trả lời trong Redis,
    // ghi DB một lần khi user HOÀN THÀNH (nộp). Tránh phiên dở dang.
    const session: StoredSession = {
      rootId,
      steps,
      userId: resolvedUserId,
      answers: [],
    };
    const sessionId = await this.sessions.create(session);

    const pattern = steps.find((s) => s.kind === 'PATTERN');
    const root =
      pattern && pattern.kind === 'PATTERN'
        ? { hz: pattern.hz, py: pattern.py, hv: pattern.hv }
        : { hz: '', py: '', hv: '' };

    return { sessionId, rootId, root, totalQuiz, steps };
  }

  /**
   * Các từ user ĐÃ HỌC (mastery FAMILIAR trở lên) — đầu vào cờ `learned`
   * của thuật toán sinh bài. Lỗi DB → coi như chưa học từ nào (an toàn).
   */
  private async learnedWordIds(
    userId: string,
    wordIds: string[],
  ): Promise<Set<string>> {
    if (!wordIds.length) return new Set();
    try {
      const rows = await this.prisma.userWordProgress.findMany({
        where: {
          userId,
          wordId: { in: wordIds },
          mastery: { in: ['FAMILIAR', 'MASTERED'] },
        },
        select: { wordId: true },
      });
      return new Set(rows.map((r) => r.wordId));
    } catch {
      return new Set();
    }
  }

  /** Chấm 1 câu QUIZ (chưa ghi DB — chỉ tích luỹ vào phiên). */
  async answer(
    sessionId: string,
    exerciseId: string,
    optionIndex: number,
    text?: string,
  ): Promise<PracticeAnswerDto> {
    const session = await this.sessions.getOrThrow(sessionId);
    const result = this.grading.grade(session, exerciseId, optionIndex, text);

    // Đáp án user đã chọn/gõ (để lưu lịch sử):
    //   - input (gõ chữ): giữ nguyên chữ user gõ.
    //   - trắc nghiệm: kèm nhãn "A. "/"B. "... trước nội dung option (A=index 0).
    const step = session.steps.find(
      (x): x is QuizStep => x.kind === 'QUIZ' && x.exerciseId === exerciseId,
    );
    const chosen =
      step?.variant === 'input'
        ? (text ?? '').trim()
        : step?.options[optionIndex] != null
          ? `${String.fromCharCode(65 + optionIndex)}. ${step.options[optionIndex]}`
          : String(optionIndex);

    // Tích luỹ câu trả lời (ghi đè nếu trả lời lại cùng câu) rồi lưu Redis.
    session.answers = session.answers ?? [];
    const i = session.answers.findIndex((a) => a.exerciseId === exerciseId);
    const entry = { exerciseId, correct: result.correct, answer: chosen };
    if (i >= 0) session.answers[i] = entry;
    else session.answers.push(entry);
    await this.sessions.save(sessionId, session);

    return result;
  }

  /**
   * Hoàn thành phiên (NỘP): tạo PracticeSession + PracticeAnswer + tiến trình +
   * XP/level/streak trong 1 transaction. Chỉ lúc này DB mới có dữ liệu phiên.
   * IDEMPOTENT nhờ PracticeSession.id = sessionId (gọi lại → trả kết quả cũ).
   */
  async complete(sessionId: string, userId = ''): Promise<PracticeCompleteDto> {
    const s = await this.sessions.getOrThrow(sessionId);
    const resolvedUserId = s.userId || (await this.users.resolveUserId(userId));
    return this.grading.submit(sessionId, s, resolvedUserId);
  }

  /** Lịch sử luyện tập của user: các phiên đã hoàn thành, mới nhất trước. */
  async history(userId = ''): Promise<PracticeHistoryItemDto[]> {
    const resolvedUserId = await this.users.resolveUserId(userId);

    const rows = await this.prisma.practiceSession.findMany({
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

    const isStr = (x: string | null): x is string => !!x;
    const rootIds = [...new Set(rows.map((r) => r.rootId).filter(isStr))];
    const topicIds = [...new Set(rows.map((r) => r.topicId).filter(isStr))];
    const roots = rootIds.length
      ? await this.prisma.root.findMany({
          where: { id: { in: rootIds } },
          select: { id: true, hz: true, hv: true },
        })
      : [];
    const topics = topicIds.length
      ? await this.prisma.topic.findMany({
          where: { id: { in: topicIds } },
          select: { id: true, title: true },
        })
      : [];
    const rootMap = new Map(roots.map((r) => [r.id, r]));
    const topicMap = new Map(topics.map((t) => [t.id, t]));

    return rows.map((r) => {
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
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      };
    });
  }
}
