/**
 * LỊCH ÔN TẬP — spaced repetition tối giản cho hàng đợi ôn (spec BNPD:
 * từ đã học trả lời sai → vào hàng đợi).
 *
 * Quy tắc:
 *   - Rơi vào queue (trả lời sai bài reviewOnWrong): ôn lại sau 1 ngày.
 *   - Ôn ĐÚNG: khoảng cách nhân đôi (1 → 2 ngày); đúng 2 lần liên tiếp
 *     (interval đã đạt ngưỡng) → RỜI queue (dueAt = null).
 *   - Ôn SAI: reset về 1 ngày, tính thêm 1 lapse.
 *
 * Hàm thuần — không side-effect, unit-test không cần Nest/DB.
 */

/** Khoảng cách lần ôn đầu tiên sau khi rơi vào queue (ngày). */
export const REVIEW_FIRST_INTERVAL_DAYS = 1;
/** Interval đạt mức này mà vẫn trả lời đúng → tốt nghiệp (rời queue). */
export const REVIEW_GRADUATE_INTERVAL_DAYS = 2;

export interface ReviewNextState {
  /** Interval mới (ngày). 0 khi đã rời queue. */
  intervalDays: number;
  /** Số ngày tới hạn ôn kế tiếp; null = rời queue. */
  dueInDays: number | null;
  /** Trả lời sai → +1 lapse. */
  addLapse: boolean;
}

/** Trạng thái khi 1 từ RƠI VÀO hàng đợi (trả lời sai bài reviewOnWrong). */
export function lapseState(): ReviewNextState {
  return {
    intervalDays: REVIEW_FIRST_INTERVAL_DAYS,
    dueInDays: REVIEW_FIRST_INTERVAL_DAYS,
    addLapse: true,
  };
}

/** Trạng thái mới sau 1 lần ÔN trong phiên ôn tập. */
export function nextReviewState(
  correct: boolean,
  currentIntervalDays: number,
): ReviewNextState {
  if (!correct) return lapseState();
  const cur = Math.max(REVIEW_FIRST_INTERVAL_DAYS, currentIntervalDays);
  if (cur >= REVIEW_GRADUATE_INTERVAL_DAYS) {
    // Đúng 2 lần liên tiếp (1 ngày → 2 ngày → tốt nghiệp).
    return { intervalDays: 0, dueInDays: null, addLapse: false };
  }
  const next = cur * 2;
  return { intervalDays: next, dueInDays: next, addLapse: false };
}

/** dueInDays → Date tuyệt đối (từ `from`, mặc định now). */
export function dueDate(days: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
