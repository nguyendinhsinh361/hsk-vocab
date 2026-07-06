import {
  assemblePracticeSteps,
  hskLevelNum,
  letterToIndex,
  shuffle,
  stripLetter,
  type PracticeContentBundle,
  type QuizCandidate,
} from './practice-content.builder';
import type { MatchStep, QuizStep } from './practice.types';

/* ------------- fixtures ------------- */

function quizStep(exerciseId: string, type: string): QuizStep {
  return {
    kind: 'QUIZ',
    exerciseId,
    type,
    variant: 'mcq',
    title: 'Luyện tập',
    question: 'q',
    options: ['a', 'b'],
    answerIndex: 0,
    explanation: '',
  };
}

function candidate(wordId: string | null, type: string): QuizCandidate {
  return { wordId, type, step: quizStep(`${wordId ?? 'root'}-${type}`, type) };
}

function bundle(
  overrides: Partial<PracticeContentBundle> = {},
): PracticeContentBundle {
  return {
    baseSteps: [],
    words: [
      {
        id: 'w1',
        hz: '生活',
        py: 'shēnghuó',
        meaning: 'cuộc sống',
        hanVietLevel: 'M1',
      },
      {
        id: 'w2',
        hz: '学生',
        py: 'xuésheng',
        meaning: 'học sinh',
        hanVietLevel: 'M2',
      },
    ],
    quizCandidates: [
      candidate('w1', 'D1'),
      candidate('w1', 'C1'),
      candidate('w1', 'C3'),
      candidate('w2', 'A1'),
      candidate('w2', 'D1'),
      candidate('w2', 'C3'),
      candidate('w2', 'C4'),
    ],
    patternCount: 1,
    levelNum: 1,
    ...overrides,
  };
}

const quizTypes = (steps: ReturnType<typeof assemblePracticeSteps>) =>
  steps.filter((s): s is QuizStep => s.kind === 'QUIZ').map((s) => s.type);

/* ------------- tests ------------- */

describe('assemblePracticeSteps', () => {
  it('chọn bài theo plan BNPD: M1 → D1+C, M2 → A+D1+C (xoay C không trùng)', () => {
    const steps = assemblePracticeSteps(bundle(), new Set());
    expect(quizTypes(steps)).toEqual(['D1', 'C1', 'A1', 'D1', 'C3']);
  });

  it('D3 tổng hợp thành bài MATCH cuối cùng với đủ cặp từ', () => {
    const steps = assemblePracticeSteps(bundle(), new Set());
    const last = steps[steps.length - 1];
    expect(last.kind).toBe('MATCH');
    const match = last as MatchStep;
    expect(match.pairs.map((p) => p.wordId)).toEqual(['w1', 'w2']);
    expect(match.pairs[0]).toMatchObject({ hz: '生活', meaning: 'cuộc sống' });
  });

  it('từ đã học → 1 bài C1/C3 mang cờ reviewOnWrong, vẫn có mặt trong MATCH', () => {
    const steps = assemblePracticeSteps(bundle(), new Set(['w1']));
    const w1Quiz = steps.filter(
      (s): s is QuizStep => s.kind === 'QUIZ' && s.exerciseId.startsWith('w1-'),
    );
    expect(w1Quiz).toHaveLength(1);
    expect(['C1', 'C3']).toContain(w1Quiz[0].type);
    expect(w1Quiz[0].reviewOnWrong).toBe(true);
    const match = steps[steps.length - 1] as MatchStep;
    expect(match.pairs.some((p) => p.wordId === 'w1')).toBe(true);
  });

  it('M3 → bài đầu mang cờ confusionWarning trên QuizStep', () => {
    const b = bundle({
      words: [
        {
          id: 'w1',
          hz: '医生',
          py: 'yīshēng',
          meaning: 'bác sĩ',
          hanVietLevel: 'M3',
        },
      ],
      quizCandidates: [
        candidate('w1', 'A1'),
        candidate('w1', 'B1'),
        candidate('w1', 'A3'),
        candidate('w1', 'C1'),
      ],
      patternCount: 0,
    });
    const steps = assemblePracticeSteps(b, new Set());
    const quiz = steps.filter((s): s is QuizStep => s.kind === 'QUIZ');
    expect(quiz[0].type).toBe('A1');
    expect(quiz[0].confusionWarning).toBe(true);
  });

  it('kho không khớp plan → fallback các bài đầu, không trắng bài', () => {
    // M1 ROOT cần D1/C nhưng kho chỉ có A1 → plan không chọn được gì.
    const b = bundle({
      words: [
        {
          id: 'w1',
          hz: '生活',
          py: 'shēnghuó',
          meaning: 'cuộc sống',
          hanVietLevel: 'M1',
        },
      ],
      quizCandidates: [candidate('w1', 'A1')],
      patternCount: 0,
    });
    const steps = assemblePracticeSteps(b, new Set());
    expect(quizTypes(steps)).toEqual(['A1']);
  });

  it('D2 lấy từ kho mức gốc theo số pattern', () => {
    const b = bundle({
      quizCandidates: [
        ...bundle().quizCandidates,
        candidate(null, 'D2'),
        candidate(null, 'D2'),
      ],
      patternCount: 2,
    });
    const steps = assemblePracticeSteps(b, new Set());
    expect(quizTypes(steps).filter((t) => t === 'D2')).toHaveLength(2);
  });
});

describe('hskLevelNum', () => {
  it('HSK1 → 1, HSK6 → 6, giá trị lạ → 1', () => {
    expect(hskLevelNum('HSK1')).toBe(1);
    expect(hskLevelNum('HSK6')).toBe(6);
    expect(hskLevelNum('unknown')).toBe(1);
  });
});

describe('helpers render', () => {
  it('stripLetter + letterToIndex + shuffle giữ hành vi cũ', () => {
    expect(stripLetter('A. công nhân')).toBe('công nhân');
    expect(letterToIndex('B', ['A. x', 'B. y'])).toBe(1);
    const src = [1, 2, 3];
    expect([...shuffle(src)].sort()).toEqual([1, 2, 3]);
  });
});
