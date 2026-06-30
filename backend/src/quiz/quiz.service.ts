import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ProgressService } from '../progress/progress.service';
import { QuizMode } from '@prisma/client';
import {
  buildQuestions,
  ClientQuestion,
  StoredQuiz,
  QuizCard,
} from './quiz.types';
import { isFakeData } from '../fake/fake.util';
import { fakeDeckCards } from '../fake/fixtures';

const QUIZ_TTL = 2 * 60 * 60; // 2h
const XP_PER_CORRECT = 10;

// Store in-memory cho fake mode (không cần Redis/DB). Chỉ dùng khi USE_FAKE_DATA.
interface FakeSession {
  deckId: string;
  mode: QuizMode;
  questions: StoredQuiz['questions'];
  answers: { cardId: string; isCorrect: boolean }[];
}
const fakeSessions = new Map<string, FakeSession>();

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private progress: ProgressService,
  ) {}

  private key(sessionId: string) {
    return `quiz:questions:${sessionId}`;
  }

  async start(userId: string, deckId: string, mode: QuizMode = QuizMode.RECOGNITION) {
    // ---- FAKE ----
    if (isFakeData()) {
      const cards = fakeDeckCards(deckId) as unknown as QuizCard[];
      if (cards.length === 0) throw new NotFoundException('Deck rỗng hoặc không tồn tại');
      const questions = buildQuestions(cards, mode);
      if (questions.length === 0)
        throw new BadRequestException('Không đủ dữ liệu để tạo câu hỏi');
      const sessionId = randomUUID();
      fakeSessions.set(sessionId, { deckId, mode, questions, answers: [] });
      return {
        sessionId,
        mode,
        total: questions.length,
        questions: this.toClient(questions),
      };
    }

    // ---- REAL (Prisma + Redis) ----
    const cards = await this.prisma.card.findMany({
      where: { deckId },
      select: { id: true, character: true, pinyin: true, meaning: true },
      orderBy: { position: 'asc' },
    });
    if (cards.length === 0) throw new NotFoundException('Deck rỗng hoặc không tồn tại');

    const questions = buildQuestions(cards as QuizCard[], mode);
    if (questions.length === 0)
      throw new BadRequestException('Không đủ dữ liệu để tạo câu hỏi (thiếu nghĩa)');

    const session = await this.prisma.quizSession.create({
      data: { userId, deckId, mode, totalQuestions: questions.length },
    });
    const stored: StoredQuiz = { mode, questions };
    await this.redis.set(this.key(session.id), JSON.stringify(stored), QUIZ_TTL);

    return {
      sessionId: session.id,
      mode,
      total: questions.length,
      questions: this.toClient(questions),
    };
  }

  async submitAnswer(userId: string, sessionId: string, cardId: string, answer: string) {
    // ---- FAKE ----
    if (isFakeData()) {
      const s = fakeSessions.get(sessionId);
      if (!s) throw new NotFoundException('Phiên quiz hết hạn hoặc không tồn tại');
      const q = s.questions.find((x) => x.cardId === cardId);
      if (!q) throw new BadRequestException('Câu hỏi không thuộc phiên này');
      const isCorrect = answer === q.correctAnswer;
      s.answers.push({ cardId, isCorrect });
      return { correct: isCorrect, correctAnswer: q.correctAnswer };
    }

    // ---- REAL ----
    const raw = await this.redis.get(this.key(sessionId));
    if (!raw) throw new NotFoundException('Phiên quiz hết hạn hoặc không tồn tại');
    const stored = JSON.parse(raw) as StoredQuiz;
    const question = stored.questions.find((q) => q.cardId === cardId);
    if (!question) throw new BadRequestException('Câu hỏi không thuộc phiên này');

    const isCorrect = answer === question.correctAnswer;
    await this.prisma.quizAnswer.create({ data: { sessionId, cardId, isCorrect } });
    await this.progress.record(userId, cardId, isCorrect);
    return { correct: isCorrect, correctAnswer: question.correctAnswer };
  }

  async complete(userId: string, sessionId: string) {
    // ---- FAKE ----
    if (isFakeData()) {
      const s = fakeSessions.get(sessionId);
      if (!s) throw new NotFoundException('Session không tồn tại');
      const correctCount = s.answers.filter((a) => a.isCorrect).length;
      const xpEarned = correctCount * XP_PER_CORRECT;
      fakeSessions.delete(sessionId);
      return { sessionId, total: s.questions.length, correctCount, xpEarned };
    }

    // ---- REAL ----
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { answers: true },
    });
    if (!session) throw new NotFoundException('Session không tồn tại');
    if (session.userId !== userId) throw new BadRequestException('Sai chủ phiên');

    const correctCount = session.answers.filter((a) => a.isCorrect).length;
    const xpEarned = correctCount * XP_PER_CORRECT;

    const [updated] = await this.prisma.$transaction([
      this.prisma.quizSession.update({
        where: { id: sessionId },
        data: { correctCount, xpEarned, completedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpEarned }, lastActiveDate: new Date() },
      }),
    ]);

    await this.redis.del(this.key(sessionId));
    return { sessionId, total: updated.totalQuestions, correctCount, xpEarned };
  }

  private toClient(questions: StoredQuiz['questions']): ClientQuestion[] {
    return questions.map((q) => ({
      cardId: q.cardId,
      prompt: q.prompt,
      options: q.options,
    }));
  }
}
