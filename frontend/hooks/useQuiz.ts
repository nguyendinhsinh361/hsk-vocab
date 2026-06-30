'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type {
  ClientQuestion,
  CompleteResponse,
  QuizMode,
} from '@/lib/types';

type Phase = 'idle' | 'loading' | 'question' | 'review' | 'complete' | 'error';

interface State {
  phase: Phase;
  sessionId: string | null;
  questions: ClientQuestion[];
  index: number;
  selected: string | null;
  correctAnswer: string | null;
  isCorrect: boolean | null;
  result: CompleteResponse | null;
  error: string | null;
}

const initial: State = {
  phase: 'idle',
  sessionId: null,
  questions: [],
  index: 0,
  selected: null,
  correctAnswer: null,
  isCorrect: null,
  result: null,
  error: null,
};

/** State machine quiz: loading → question ⇄ review → complete. */
export function useQuiz(deckId: string) {
  const [s, setS] = useState<State>(initial);

  const start = useCallback(
    async (mode: QuizMode = 'RECOGNITION') => {
      setS({ ...initial, phase: 'loading' });
      try {
        const res = await api.startQuiz(deckId, mode);
        setS({
          ...initial,
          phase: 'question',
          sessionId: res.sessionId,
          questions: res.questions,
        });
      } catch (e) {
        setS({ ...initial, phase: 'error', error: (e as Error).message });
      }
    },
    [deckId],
  );

  const answer = useCallback(
    async (choice: string) => {
      if (!s.sessionId || s.phase !== 'question') return;
      const q = s.questions[s.index];
      try {
        const res = await api.answer(s.sessionId, q.cardId, choice);
        setS((p) => ({
          ...p,
          phase: 'review',
          selected: choice,
          correctAnswer: res.correctAnswer,
          isCorrect: res.correct,
        }));
      } catch (e) {
        setS((p) => ({ ...p, phase: 'error', error: (e as Error).message }));
      }
    },
    [s.sessionId, s.phase, s.questions, s.index],
  );

  const next = useCallback(async () => {
    if (s.phase !== 'review' || !s.sessionId) return;
    const last = s.index >= s.questions.length - 1;
    if (!last) {
      setS((p) => ({
        ...p,
        phase: 'question',
        index: p.index + 1,
        selected: null,
        correctAnswer: null,
        isCorrect: null,
      }));
      return;
    }
    try {
      const result = await api.complete(s.sessionId);
      setS((p) => ({ ...p, phase: 'complete', result }));
    } catch (e) {
      setS((p) => ({ ...p, phase: 'error', error: (e as Error).message }));
    }
  }, [s.phase, s.sessionId, s.index, s.questions.length]);

  return {
    ...s,
    current: s.questions[s.index] ?? null,
    total: s.questions.length,
    start,
    answer,
    next,
  };
}
