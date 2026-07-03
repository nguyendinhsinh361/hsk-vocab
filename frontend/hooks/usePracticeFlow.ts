'use client';

/**
 * State machine cho LUỒNG LUYỆN TẬP (sau nút "Chiến luôn đi nào").
 * Tải phiên qua GET /practice/session, đi lần lượt qua các `steps`:
 *   TEACH   → chọn nghĩa (answering ⇄ checked) → Tiếp tục
 *   PATTERN → xem pattern → Luyện tập ngay
 *   QUIZ    → chọn nghĩa (answering → chấm qua POST /practice/answer → checked) → Tiếp tục
 * Hết steps → summary (điểm phần QUIZ). +10 XP mỗi câu QUIZ đúng.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { PracticeSession, PracticeStep } from '@/lib/types';

const XP_PER_CORRECT = 10;

type Phase = 'loading' | 'error' | 'step' | 'summary';
type Sub = 'answering' | 'checked';

interface State {
  phase: Phase;
  error: string | null;
  session: PracticeSession | null;
  index: number;
  sub: Sub;
  selected: number | null;
  inputText: string;
  isCorrect: boolean | null;
  quizCorrect: number;
}

const initial: State = {
  phase: 'loading',
  error: null,
  session: null,
  index: 0,
  sub: 'answering',
  selected: null,
  inputText: '',
  isCorrect: null,
  quizCorrect: 0,
};

export function usePracticeFlow(root: string) {
  const [s, setS] = useState<State>(initial);
  // Chặn gọi /practice/complete trùng (React strict-mode gọi effect 2 lần).
  const completedRef = useRef(false);
  // Chỉ tạo phiên (start) MỘT lần cho mỗi gốc — tránh Strict Mode gọi 2 lần
  // (sinh 2 PracticeSession, 1 dang dở).
  const loadedRootRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    completedRef.current = false;
    setS({ ...initial, phase: 'loading' });
    try {
      const session = await api.practiceSession(root);
      setS({ ...initial, phase: 'step', session });
    } catch (e) {
      setS({ ...initial, phase: 'error', error: (e as Error).message });
    }
  }, [root]);

  useEffect(() => {
    if (loadedRootRef.current === root) return;
    loadedRootRef.current = root;
    load();
  }, [root, load]);

  // Hết bài → báo BE hoàn thành phiên (lưu XP/level/streak + tiến trình).
  useEffect(() => {
    if (s.phase !== 'summary' || !s.session || completedRef.current) return;
    completedRef.current = true;
    api.practiceComplete(s.session.sessionId).catch(() => {});
  }, [s.phase, s.session]);

  const steps: PracticeStep[] = s.session?.steps ?? [];
  const current: PracticeStep | null = steps[s.index] ?? null;

  /** Chọn 1 đáp án (chưa chấm). */
  const select = useCallback((i: number) => {
    setS((p) => (p.sub === 'checked' ? p : { ...p, selected: i }));
  }, []);

  /** Nhập chữ (variant='input'). */
  const setInput = useCallback((text: string) => {
    setS((p) => (p.sub === 'checked' ? p : { ...p, inputText: text }));
  }, []);

  /** Bấm "Kiểm tra" — chấm câu hiện tại (TEACH chấm cục bộ, QUIZ gọi API). */
  const check = useCallback(async () => {
    const cur = steps[s.index];
    if (!cur || s.sub === 'checked') return;

    if (cur.kind === 'TEACH') {
      if (s.selected == null) return;
      const ok = s.selected === cur.answerIndex;
      setS((p) => ({ ...p, sub: 'checked', isCorrect: ok }));
      return;
    }
    if (cur.kind === 'QUIZ' && s.session) {
      const isInput = cur.variant === 'input';
      if (isInput ? !s.inputText.trim() : s.selected == null) return;
      try {
        const res = await api.practiceAnswer(
          s.session.sessionId,
          cur.exerciseId,
          isInput ? -1 : (s.selected as number),
          isInput ? s.inputText : undefined,
        );
        setS((p) => ({
          ...p,
          sub: 'checked',
          isCorrect: res.correct,
          quizCorrect: p.quizCorrect + (res.correct ? 1 : 0),
        }));
      } catch (e) {
        setS((p) => ({ ...p, phase: 'error', error: (e as Error).message }));
      }
    }
  }, [steps, s.index, s.selected, s.inputText, s.sub, s.session]);

  /** Sang step kế (hoặc summary). */
  const next = useCallback(() => {
    setS((p) => {
      const last = p.index >= (p.session?.steps.length ?? 0) - 1;
      if (last) return { ...p, phase: 'summary' };
      return {
        ...p,
        index: p.index + 1,
        sub: 'answering',
        selected: null,
        inputText: '',
        isCorrect: null,
      };
    });
  }, []);

  /** PATTERN: đi tiếp ngay (không chấm). */
  const advance = next;

  const quizDone = steps
    .slice(0, s.index + (s.sub === 'checked' ? 1 : 0))
    .filter((x) => x.kind === 'QUIZ').length;

  return {
    ...s,
    steps,
    current,
    total: steps.length,
    totalQuiz: s.session?.totalQuiz ?? 0,
    quizDone,
    xpEarned: s.quizCorrect * XP_PER_CORRECT,
    root: s.session?.root ?? null,
    select,
    setInput,
    check,
    next,
    advance,
    retry: load,
  };
}
