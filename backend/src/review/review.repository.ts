import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dueDate, lapseState, nextReviewState } from './review.schedule';

/**
 * Truy cập cột hàng đợi ôn tập (dueAt / reviewInterval / lapses) trên
 * UserWordProgress.
 *
 * DÙNG RAW SQL CÓ CHỦ ĐÍCH: Prisma client trong repo chưa regenerate được
 * sau migration (cần chạy `prisma generate` trên máy dev). Toàn bộ raw SQL
 * cô lập trong file này — khi client đã regenerate, chỉ cần thay ruột các
 * method bằng delegate typed, chữ ký giữ nguyên.
 * Mọi tham số đều bind qua tagged template (an toàn SQL injection).
 */

/** Client hoặc transaction — để gọi được bên trong $transaction. */
type Db = PrismaService | Prisma.TransactionClient;

export interface DueItem {
  wordId: string;
  reviewInterval: number;
  lapses: number;
}

@Injectable()
export class ReviewRepository {
  constructor(private prisma: PrismaService) {}

  /** Số từ đến hạn ôn của user. */
  async countDue(userId: string, db: Db = this.prisma): Promise<number> {
    const rows = await db.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) AS c FROM UserWordProgress
      WHERE userId = ${userId} AND dueAt IS NOT NULL AND dueAt <= NOW(3)`;
    return Number(rows[0]?.c ?? 0);
  }

  /** Các từ đến hạn ôn, cũ nhất trước. */
  async findDue(
    userId: string,
    limit: number,
    db: Db = this.prisma,
  ): Promise<DueItem[]> {
    return db.$queryRaw<DueItem[]>`
      SELECT wordId, reviewInterval, lapses FROM UserWordProgress
      WHERE userId = ${userId} AND dueAt IS NOT NULL AND dueAt <= NOW(3)
      ORDER BY dueAt ASC
      LIMIT ${limit}`;
  }

  /** Interval hiện tại của 1 từ trong queue (0/null nếu không có). */
  async getInterval(
    userId: string,
    wordId: string,
    db: Db = this.prisma,
  ): Promise<number> {
    const rows = await db.$queryRaw<{ reviewInterval: number }[]>`
      SELECT reviewInterval FROM UserWordProgress
      WHERE userId = ${userId} AND wordId = ${wordId}`;
    return rows[0]?.reviewInterval ?? 0;
  }

  /**
   * Từ RƠI VÀO hàng đợi (trả lời sai bài reviewOnWrong trong luyện tập).
   * Row UserWordProgress đã tồn tại (grading upsert trước đó cùng transaction).
   */
  async markLapse(
    userId: string,
    wordId: string,
    db: Db = this.prisma,
  ): Promise<void> {
    const s = lapseState();
    await db.$executeRaw`
      UPDATE UserWordProgress
      SET dueAt = ${dueDate(s.dueInDays ?? 1)},
          reviewInterval = ${s.intervalDays},
          lapses = lapses + 1
      WHERE userId = ${userId} AND wordId = ${wordId}`;
  }

  /** Cập nhật lịch sau 1 lần ÔN trong phiên ôn tập (đúng → giãn/rời queue). */
  async applyReviewAnswer(
    userId: string,
    wordId: string,
    correct: boolean,
    db: Db = this.prisma,
  ): Promise<void> {
    const cur = await this.getInterval(userId, wordId, db);
    const next = nextReviewState(correct, cur);
    await db.$executeRaw`
      UPDATE UserWordProgress
      SET dueAt = ${next.dueInDays === null ? null : dueDate(next.dueInDays)},
          reviewInterval = ${next.intervalDays},
          lapses = lapses + ${next.addLapse ? 1 : 0}
      WHERE userId = ${userId} AND wordId = ${wordId}`;
  }
}
