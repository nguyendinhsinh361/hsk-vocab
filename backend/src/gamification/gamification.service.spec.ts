import {
  XP_PER_CORRECT,
  levelFromXp,
  masteryFrom,
  nextStreak,
  GamificationService,
} from './gamification.service';

describe('levelFromXp', () => {
  it('level 1 khi 0–99 XP', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });
  it('lên cấp mỗi 100 XP', () => {
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
    expect(levelFromXp(1000)).toBe(11);
  });
  it('XP âm không làm vỡ công thức', () => {
    expect(levelFromXp(-50)).toBe(1);
  });
});

describe('masteryFrom', () => {
  it('mốc NEW/LEARNING/FAMILIAR/MASTERED theo số câu đúng', () => {
    expect(masteryFrom(0)).toBe('NEW');
    expect(masteryFrom(1)).toBe('LEARNING');
    expect(masteryFrom(2)).toBe('LEARNING');
    expect(masteryFrom(3)).toBe('FAMILIAR');
    expect(masteryFrom(4)).toBe('FAMILIAR');
    expect(masteryFrom(5)).toBe('MASTERED');
    expect(masteryFrom(99)).toBe('MASTERED');
  });
});

describe('nextStreak', () => {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  it('chưa từng học → 1', () => {
    expect(nextStreak(null, 0)).toBe(1);
  });
  it('cùng ngày → giữ nguyên (tối thiểu 1)', () => {
    expect(nextStreak(new Date(), 4)).toBe(4);
    expect(nextStreak(new Date(), 0)).toBe(1);
  });
  it('hôm qua → +1', () => {
    expect(nextStreak(daysAgo(1), 4)).toBe(5);
    expect(nextStreak(daysAgo(1), 0)).toBe(1);
  });
  it('đứt chuỗi (≥2 ngày) → reset 1', () => {
    expect(nextStreak(daysAgo(2), 9)).toBe(1);
    expect(nextStreak(daysAgo(30), 9)).toBe(1);
  });
  it('nhận cả chuỗi ISO (dữ liệu qua JSON/Redis)', () => {
    expect(nextStreak(daysAgo(1).toISOString(), 2)).toBe(3);
  });
});

describe('GamificationService', () => {
  it('xpForCorrect = số câu đúng × XP_PER_CORRECT', () => {
    const svc = new GamificationService();
    expect(svc.xpForCorrect(0)).toBe(0);
    expect(svc.xpForCorrect(7)).toBe(7 * XP_PER_CORRECT);
  });
});
