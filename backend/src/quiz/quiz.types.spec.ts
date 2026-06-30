import { buildQuestions, shuffle, QuizCard } from './quiz.types';
import { QuizMode } from '@prisma/client';

const cards: QuizCard[] = [
  { id: 'a', character: '人', pinyin: 'rén', meaning: 'nhân - người' },
  { id: 'b', character: '大', pinyin: 'dà', meaning: 'to lớn' },
  { id: 'c', character: '好', pinyin: 'hǎo', meaning: 'tốt' },
  { id: 'd', character: '本', pinyin: 'běn', meaning: 'gốc' },
  { id: 'e', character: '空', pinyin: 'kōng', meaning: null }, // bỏ qua: không có nghĩa
];

describe('shuffle', () => {
  it('không mutate input và giữ nguyên phần tử', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(out.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('buildQuestions', () => {
  it('bỏ card không có nghĩa', () => {
    const qs = buildQuestions(cards, QuizMode.RECOGNITION);
    expect(qs).toHaveLength(4); // 5 card, 1 không có nghĩa
    expect(qs.find((q) => q.cardId === 'e')).toBeUndefined();
  });

  it('RECOGNITION: đề là chữ Hán, đáp án đúng là nghĩa và nằm trong options', () => {
    const qs = buildQuestions(cards, QuizMode.RECOGNITION);
    const q = qs.find((x) => x.cardId === 'a')!;
    expect(q.prompt).toBe('人');
    expect(q.correctAnswer).toBe('nhân - người');
    expect(q.options).toContain('nhân - người');
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.options.length).toBeLessThanOrEqual(4);
  });

  it('RECALL: đề là nghĩa, đáp án đúng là chữ Hán', () => {
    const qs = buildQuestions(cards, QuizMode.RECALL);
    const q = qs.find((x) => x.cardId === 'a')!;
    expect(q.prompt).toBe('nhân - người');
    expect(q.correctAnswer).toBe('人');
    expect(q.options).toContain('人');
  });

  it('options không trùng lặp', () => {
    const qs = buildQuestions(cards, QuizMode.RECOGNITION);
    for (const q of qs) {
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});
