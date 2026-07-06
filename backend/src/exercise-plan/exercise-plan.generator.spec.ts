import { chunkForD3, generateExercisePlan } from './exercise-plan.generator';
import type { ExerciseTypeCode, PlanWordInput } from './exercise-plan.types';

/** Từ có đủ dữ liệu mọi dạng bài (trừ khi chỉ định). */
const ALL_TYPES: ExerciseTypeCode[] = [
  'A1',
  'A2',
  'A3',
  'A4',
  'B1',
  'B2',
  'B3',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'D1',
  'D2',
  'D3',
];

function word(
  id: string,
  hanViet: 'M1' | 'M2' | 'M3',
  overrides: Partial<PlanWordInput> = {},
): PlanWordInput {
  return { wordId: id, hanViet, availableTypes: ALL_TYPES, ...overrides };
}

const typesOf = (
  plan: ReturnType<typeof generateExercisePlan>,
  wordId: string,
) => plan.filter((p) => p.wordId === wordId).map((p) => p.type);

describe('Công thức theo loại từ (sheet 06)', () => {
  it('M1 gốc từ: 2 bài — D1 → nhóm C', () => {
    const plan = generateExercisePlan([word('w1', 'M1')], {
      mode: 'ROOT',
      patternCount: 0,
    });
    expect(typesOf(plan, 'w1')).toEqual(['D1', 'C1']);
  });

  it('M1 chủ đề: 2 bài — nhóm A thay D1 → nhóm C', () => {
    const plan = generateExercisePlan([word('w1', 'M1')], { mode: 'TOPIC' });
    expect(typesOf(plan, 'w1')).toEqual(['A1', 'C1']);
  });

  it('M2 gốc từ: 3 bài — A → D1 → C', () => {
    const plan = generateExercisePlan([word('w1', 'M2')], {
      mode: 'ROOT',
      patternCount: 0,
    });
    expect(typesOf(plan, 'w1')).toEqual(['A1', 'D1', 'C1']);
  });

  it('M2 gốc từ thiếu dữ liệu D1 → thay bằng nhóm B', () => {
    const w = word('w1', 'M2', {
      availableTypes: ALL_TYPES.filter((t) => t !== 'D1'),
    });
    const plan = generateExercisePlan([w], { mode: 'ROOT', patternCount: 0 });
    expect(typesOf(plan, 'w1')).toEqual(['A1', 'B1', 'C1']);
  });

  it('M2 chủ đề: 3 bài — A → B → C (không dùng D1)', () => {
    const plan = generateExercisePlan([word('w1', 'M2')], { mode: 'TOPIC' });
    expect(typesOf(plan, 'w1')).toEqual(['A1', 'B1', 'C1']);
    expect(typesOf(plan, 'w1')).not.toContain('D1');
  });

  it('M3: 4 bài — A1 (cảnh báo) → B → A3/A2 → C', () => {
    const plan = generateExercisePlan([word('w1', 'M3')], { mode: 'TOPIC' });
    const mine = plan.filter((p) => p.wordId === 'w1');
    expect(mine.map((p) => p.type)).toEqual(['A1', 'B1', 'A3', 'C1']);
    expect(mine[0].confusionWarning).toBe(true);
  });

  it('M3 thiếu A1 → dùng A4 cho bài nhận diện đầu', () => {
    const w = word('w1', 'M3', {
      availableTypes: ALL_TYPES.filter((t) => t !== 'A1'),
    });
    const plan = generateExercisePlan([w], { mode: 'TOPIC' });
    expect(typesOf(plan, 'w1')[0]).toBe('A4');
  });

  it('M3 level 4+: nhóm C ưu tiên C2', () => {
    const plan = generateExercisePlan([word('w1', 'M3')], {
      mode: 'TOPIC',
      userLevel: 4,
    });
    expect(typesOf(plan, 'w1')[3]).toBe('C2');
  });

  it('Từ đã học: 1 bài C1/C3, gắn cờ đưa vào hàng đợi ôn khi sai', () => {
    const w = word('w1', 'M1', { learned: true });
    const plan = generateExercisePlan([w], { mode: 'ROOT', patternCount: 0 });
    const mine = plan.filter((p) => p.wordId === 'w1');
    expect(mine).toHaveLength(1);
    expect(['C1', 'C3']).toContain(mine[0].type);
    expect(mine[0].reviewOnWrong).toBe(true);
  });
});

describe('Quy tắc không trùng giữa 2 từ liền kề (sheet 07)', () => {
  it('vòng xoay nhóm A: A1 → A3 → A4 → A2 qua các từ M1 chủ đề', () => {
    const plan = generateExercisePlan(
      [word('w1', 'M1'), word('w2', 'M1'), word('w3', 'M1'), word('w4', 'M1')],
      { mode: 'TOPIC' },
    );
    const firstTypes = ['w1', 'w2', 'w3', 'w4'].map(
      (id) => typesOf(plan, id)[0],
    );
    expect(firstTypes).toEqual(['A1', 'A3', 'A4', 'A2']);
  });

  it('vòng xoay nhóm C: C1 → C3 → C4 → C2 (ví dụ gốc 生 sheet 07)', () => {
    const plan = generateExercisePlan(
      [word('w1', 'M1'), word('w2', 'M1'), word('w3', 'M1'), word('w4', 'M1')],
      { mode: 'ROOT', patternCount: 0 },
    );
    const cTypes = ['w1', 'w2', 'w3', 'w4'].map((id) => typesOf(plan, id)[1]);
    expect(cTypes).toEqual(['C1', 'C3', 'C4', 'C2']);
  });

  it('2 từ liền kề không trùng dạng cùng nhóm; D1 được phép trùng', () => {
    const plan = generateExercisePlan([word('w1', 'M2'), word('w2', 'M2')], {
      mode: 'ROOT',
      patternCount: 0,
    });
    const [t1, t2] = [typesOf(plan, 'w1'), typesOf(plan, 'w2')];
    expect(t1[0]).not.toBe(t2[0]); // nhóm A khác dạng
    expect(t1[2]).not.toBe(t2[2]); // nhóm C khác dạng
    expect(t1[1]).toBe('D1');
    expect(t2[1]).toBe('D1'); // D1 chấp nhận trùng
  });

  it('2 từ M3 liền kề đều dùng A1 (không xoay bài cảnh báo)', () => {
    const plan = generateExercisePlan([word('w1', 'M3'), word('w2', 'M3')], {
      mode: 'TOPIC',
    });
    expect(typesOf(plan, 'w1')[0]).toBe('A1');
    expect(typesOf(plan, 'w2')[0]).toBe('A1');
  });

  it('dạng thiếu dữ liệu bị bỏ qua trong vòng xoay (A2 cần audio)', () => {
    const noAudio = ALL_TYPES.filter((t) => t !== 'A2');
    const plan = generateExercisePlan(
      [
        word('w1', 'M1', { availableTypes: noAudio }),
        word('w2', 'M1', { availableTypes: noAudio }),
        word('w3', 'M1', { availableTypes: noAudio }),
        word('w4', 'M1', { availableTypes: noAudio }),
      ],
      { mode: 'TOPIC' },
    );
    const firstTypes = ['w1', 'w2', 'w3', 'w4'].map(
      (id) => typesOf(plan, id)[0],
    );
    expect(firstTypes).toEqual(['A1', 'A3', 'A4', 'A1']); // bỏ A2, quay lại đầu vòng
  });

  it('C5 không vào vòng xoay level 1–2, xuất hiện từ level 3', () => {
    const words5 = ['w1', 'w2', 'w3', 'w4', 'w5'].map((id) => word(id, 'M1'));
    const low = generateExercisePlan(words5, { mode: 'TOPIC', userLevel: 2 });
    expect(low.map((p) => p.type)).not.toContain('C5');
    const high = generateExercisePlan(words5, { mode: 'TOPIC', userLevel: 3 });
    expect(high.map((p) => p.type)).toContain('C5');
  });
});

describe('Khối tổng kết (sau tất cả từ)', () => {
  it('ROOT: D2 × số pattern + D3 luôn là bài cuối, gồm mọi từ kể cả đã học', () => {
    const plan = generateExercisePlan(
      [word('w1', 'M1'), word('w2', 'M2', { learned: true })],
      { mode: 'ROOT', patternCount: 2 },
    );
    const d2 = plan.filter((p) => p.type === 'D2');
    expect(d2).toHaveLength(2);
    expect(d2.map((p) => p.patternIndex)).toEqual([0, 1]);
    const last = plan[plan.length - 1];
    expect(last.type).toBe('D3');
    expect(last.wordIds).toEqual(['w1', 'w2']);
  });

  it('TOPIC: không có D2; ≤8 từ → 1 bài D3 cuối cùng', () => {
    const words = ['w1', 'w2', 'w3'].map((id) => word(id, 'M1'));
    const plan = generateExercisePlan(words, { mode: 'TOPIC' });
    expect(plan.some((p) => p.type === 'D2')).toBe(false);
    const d3 = plan.filter((p) => p.type === 'D3');
    expect(d3).toHaveLength(1);
    expect(plan[plan.length - 1].type).toBe('D3');
  });

  it('TOPIC > 8 từ: chia nhiều bài D3 nhỏ 3–5 cặp, phủ đủ mọi từ', () => {
    const ids = Array.from({ length: 11 }, (_, i) => `w${i + 1}`);
    const plan = generateExercisePlan(
      ids.map((id) => word(id, 'M1')),
      { mode: 'TOPIC' },
    );
    const d3 = plan.filter((p) => p.type === 'D3');
    expect(d3.length).toBeGreaterThan(1);
    for (const b of d3) {
      expect(b.wordIds!.length).toBeGreaterThanOrEqual(3);
      expect(b.wordIds!.length).toBeLessThanOrEqual(5);
    }
    expect(d3.flatMap((b) => b.wordIds!)).toEqual(ids);
  });
});

describe('chunkForD3', () => {
  it('rỗng → không có bài', () => {
    expect(chunkForD3([])).toEqual([]);
  });
  it('≤8 từ → 1 bài duy nhất', () => {
    expect(chunkForD3(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])).toHaveLength(
      1,
    );
  });
  it('10 từ → 5+5 · 11 từ → 4+4+3 (chia đều, không bài nào <3)', () => {
    expect(
      chunkForD3(Array.from({ length: 10 }, (_, i) => `${i}`)).map(
        (c) => c.length,
      ),
    ).toEqual([5, 5]);
    expect(
      chunkForD3(Array.from({ length: 11 }, (_, i) => `${i}`)).map(
        (c) => c.length,
      ),
    ).toEqual([4, 4, 3]);
  });
});
