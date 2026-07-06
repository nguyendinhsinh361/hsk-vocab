import { Injectable } from '@nestjs/common';
import type { MasteryLevel } from '@prisma/client';

/**
 * GAMIFICATION — nguồn sự thật DUY NHẤT cho XP / level / streak / mastery.
 * FE không tự tính, module khác không copy công thức.
 * Các hàm thuần được export riêng để unit-test không cần Nest context.
 */

export const XP_PER_CORRECT = 10; // XP mỗi câu QUIZ đúng
export const XP_PER_LEVEL = 100; // 100 XP / cấp

/** Level suy từ tổng XP (level 1 khi 0–99 XP). */
export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

/** Mức thành thạo suy từ số lần trả lời đúng. */
export function masteryFrom(correct: number): MasteryLevel {
  if (correct >= 5) return 'MASTERED';
  if (correct >= 3) return 'FAMILIAR';
  if (correct >= 1) return 'LEARNING';
  return 'NEW';
}

/**
 * Streak mới dựa trên ngày hoạt động gần nhất:
 * cùng ngày giữ nguyên, hôm qua +1, xa hơn reset 1, chưa từng học → 1.
 * (Nhận Date | string vì dữ liệu có thể đi qua JSON/Redis.)
 */
export function nextStreak(
  last: Date | string | null,
  current: number,
): number {
  if (!last) return 1;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round(
    (startOfDay(new Date()) - startOfDay(new Date(last))) / dayMs,
  );
  if (diff <= 0) return current || 1; // cùng ngày
  if (diff === 1) return (current || 0) + 1; // ngày kế tiếp
  return 1; // đứt chuỗi
}

@Injectable()
export class GamificationService {
  xpForCorrect(correctCount: number): number {
    return correctCount * XP_PER_CORRECT;
  }

  levelFromXp = levelFromXp;
  masteryFrom = masteryFrom;
  nextStreak = nextStreak;
}
