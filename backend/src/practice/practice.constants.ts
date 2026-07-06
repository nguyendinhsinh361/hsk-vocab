import type { ExerciseType } from '@prisma/client';

/** Ánh xạ deckId FE (onboarding) → rootId trong DB. */
export const ROOT_ALIAS: Record<string, string> = {
  people: 'r-ren',
  family: 'r-jia',
  study: 'r-xue',
  food: 'r-chi',
};

export function resolveRootId(param: string): string {
  return ROOT_ALIAS[param] ?? param;
}

// TTL cache (giây).
export const STEPS_TTL = 60 * 60; // nội dung bài (tĩnh) — cache 1h
export const SESSION_TTL = 2 * 60 * 60; // phiên luyện tập — 2h

// Đổi version (vN) khi cấu trúc cache thay đổi để bỏ cache cũ.
// v6: cache BUNDLE nội dung (user-agnostic); plan sinh theo user lúc start().
export const bundleKey = (rootId: string) => `practice:bundle:v6:${rootId}`;
export const sessionKey = (sessionId: string) =>
  `practice:session:${sessionId}`;

/**
 * Các dạng bài QUIZ hỗ trợ (trắc nghiệm / đúng-sai / nghe / gõ chữ).
 * Bỏ B2 (nhìn ảnh) và D3 (nối từ) vì FE chưa có layout.
 */
export const QUIZ_TYPES: ExerciseType[] = [
  'A1',
  'A2',
  'A4',
  'B1',
  'A3',
  'C1',
  'C2',
  'C3',
  'C4',
  'D1',
  'D2',
  'B3',
];

/** Số câu QUIZ tối đa mỗi phiên. */
export const QUIZ_TAKE = 8;
