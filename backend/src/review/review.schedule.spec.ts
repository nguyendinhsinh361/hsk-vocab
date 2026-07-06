import {
  REVIEW_FIRST_INTERVAL_DAYS,
  dueDate,
  lapseState,
  nextReviewState,
} from './review.schedule';

describe('lịch ôn tập (spaced repetition tối giản)', () => {
  it('rơi vào queue: ôn lại sau 1 ngày, +1 lapse', () => {
    expect(lapseState()).toEqual({
      intervalDays: REVIEW_FIRST_INTERVAL_DAYS,
      dueInDays: REVIEW_FIRST_INTERVAL_DAYS,
      addLapse: true,
    });
  });

  it('ôn đúng lần 1 (interval 1) → giãn lên 2 ngày, chưa rời queue', () => {
    expect(nextReviewState(true, 1)).toEqual({
      intervalDays: 2,
      dueInDays: 2,
      addLapse: false,
    });
  });

  it('ôn đúng lần 2 liên tiếp (interval 2) → tốt nghiệp, rời queue', () => {
    expect(nextReviewState(true, 2)).toEqual({
      intervalDays: 0,
      dueInDays: null,
      addLapse: false,
    });
  });

  it('ôn sai ở bất kỳ interval nào → reset 1 ngày + lapse', () => {
    expect(nextReviewState(false, 2)).toEqual(lapseState());
    expect(nextReviewState(false, 1)).toEqual(lapseState());
  });

  it('interval rác (0/âm) được chuẩn hoá về 1 trước khi tính', () => {
    expect(nextReviewState(true, 0).intervalDays).toBe(2);
    expect(nextReviewState(true, -5).intervalDays).toBe(2);
  });

  it('dueDate cộng đúng số ngày', () => {
    const from = new Date('2026-07-04T10:00:00Z');
    expect(dueDate(2, from).toISOString()).toBe('2026-07-06T10:00:00.000Z');
  });
});
