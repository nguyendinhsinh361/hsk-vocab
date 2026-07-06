import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { SESSION_TTL, sessionKey } from './practice.constants';
import type { PracticeStep } from './practice.types';

/**
 * Phiên luyện tập đang diễn ra (để chấm câu QUIZ).
 * Lưu DUY NHẤT trên Redis — không dùng Map in-memory (leak + sai khi
 * chạy nhiều instance). Redis down → tạo/chấm phiên fail rõ ràng.
 */
export interface StoredSession {
  rootId: string;
  steps: PracticeStep[];
  /** User sở hữu phiên (đã resolve). */
  userId: string;
  /**
   * PRACTICE (mặc định — session cũ trong Redis không có field này)
   * hay REVIEW (phiên ôn tập: mỗi câu trả lời cập nhật lịch ôn).
   */
  mode?: 'PRACTICE' | 'REVIEW';
  /**
   * Các câu đã trả lời (tích luỹ trên Redis). CHỈ ghi DB khi user hoàn thành
   * (nộp) — tránh tạo phiên dở dang trong PracticeSession.
   * `answer` = đáp án user chọn/gõ (để lưu lại lịch sử chi tiết).
   */
  answers?: { exerciseId: string; correct: boolean; answer: string }[];
}

@Injectable()
export class PracticeSessionStore {
  constructor(private redis: RedisService) {}

  /** Tạo phiên mới, trả về sessionId (UUID). */
  async create(session: StoredSession): Promise<string> {
    const sessionId = randomUUID();
    await this.redis.setJson(sessionKey(sessionId), session, SESSION_TTL);
    return sessionId;
  }

  /** Lấy phiên; không có / hết hạn → 404. */
  async getOrThrow(sessionId: string): Promise<StoredSession> {
    const s = await this.redis.getJson<StoredSession>(sessionKey(sessionId));
    if (!s) throw new NotFoundException('Phiên không tồn tại hoặc đã hết hạn');
    return s;
  }

  /** Ghi đè phiên (dùng khi tích luỹ câu trả lời). */
  async save(sessionId: string, session: StoredSession): Promise<void> {
    await this.redis.setJson(sessionKey(sessionId), session, SESSION_TTL);
  }
}
