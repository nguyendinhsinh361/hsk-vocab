import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryLevel } from '@prisma/client';
import { isFakeData } from '../fake/fake.util';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /** Tiến độ của user trên 1 deck (theo từng card). */
  listByDeck(userId: string, deckId: string) {
    if (isFakeData()) return Promise.resolve([]); // fake: chưa theo dõi tiến độ
    return this.prisma.userCardProgress.findMany({
      where: { userId, card: { deckId } },
      select: {
        cardId: true,
        mastery: true,
        correctCount: true,
        seenCount: true,
        lastSeenAt: true,
      },
    });
  }

  /** Cập nhật tiến độ sau mỗi câu trả lời (idempotent theo unique userId+cardId). */
  async record(userId: string, cardId: string, isCorrect: boolean) {
    const existing = await this.prisma.userCardProgress.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
    const correctCount = (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0);
    const seenCount = (existing?.seenCount ?? 0) + 1;
    return this.prisma.userCardProgress.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: {
        userId,
        cardId,
        correctCount,
        seenCount,
        mastery: this.computeMastery(correctCount),
        lastSeenAt: new Date(),
      },
      update: {
        correctCount,
        seenCount,
        mastery: this.computeMastery(correctCount),
        lastSeenAt: new Date(),
      },
    });
  }

  private computeMastery(correctCount: number): MasteryLevel {
    if (correctCount >= 6) return MasteryLevel.MASTERED;
    if (correctCount >= 3) return MasteryLevel.FAMILIAR;
    if (correctCount >= 1) return MasteryLevel.LEARNING;
    return MasteryLevel.NEW;
  }
}
