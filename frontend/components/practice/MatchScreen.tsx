'use client';

/**
 * Màn NỐI TỪ (bài D3 tổng kết — spec BNPD: luôn là bài cuối cùng).
 * Cột trái: chữ Hán (ruby pinyin) · cột phải: nghĩa (xáo trộn). Chạm 1 bên rồi
 * chạm bên kia: đúng → khoá cặp (xanh + tích), sai → rung đỏ. Nối đủ cặp → Tiếp tục.
 * Chấm cục bộ, không tính vào điểm QUIZ.
 */

import { useMemo, useState } from 'react';
import type { MatchStep } from '@/lib/types';
import { cn } from '@/lib/cn';
import { BottomCta } from './BottomCta';
import { HanziText } from './HanziText';

export function MatchScreen({
  step,
  onNext,
}: {
  step: MatchStep;
  onNext: () => void;
}) {
  // Cột phải xáo trộn 1 lần mỗi lượt hiển thị.
  const rights = useMemo(() => shuffle(step.pairs), [step]);

  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  const total = step.pairs.length;
  const done = matched.size === total;
  const pct = total ? Math.round((matched.size / total) * 100) : 0;

  const pickLeft = (wordId: string) => {
    if (matched.has(wordId)) return;
    setLeftSel((cur) => (cur === wordId ? null : wordId));
  };

  const pickRight = (wordId: string) => {
    if (matched.has(wordId) || !leftSel) return;
    if (wordId === leftSel) {
      setMatched((prev) => new Set(prev).add(wordId));
      setLeftSel(null);
    } else {
      setWrong(wordId);
      setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <>
      <div className="absolute inset-0 overflow-y-auto px-2 md:px-8 pt-[5.75rem] md:pt-24 pb-[6.875rem] flex flex-col md:items-center">
        <div className="w-full max-w-[26.875rem] md:max-w-[84rem] rounded-3xl border border-neutral-200 bg-white shadow-soft p-4 md:p-12 md:min-h-[calc(100dvh-13rem)] flex flex-col gap-4 md:gap-6">
          <div className="text-center">
            <h2 className="font-sans font-bold text-lg md:text-2xl text-neutral-800">{step.title}</h2>
            <p className="mt-1 font-sans text-sm text-neutral-500">
              Chạm chữ Hán rồi chạm nghĩa tương ứng
            </p>
          </div>

          {/* Thanh tiến trình nối cặp */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundImage: 'linear-gradient(-34.6deg,#12D18E 0%,#71E3BB 100%)' }}
              />
            </div>
            <span className="font-sans font-semibold text-sm text-neutral-500 tabular-nums">
              {matched.size}/{total}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-5">
            {/* Cột trái: chữ Hán */}
            <div className="flex flex-col gap-3">
              {step.pairs.map((p) => {
                const isMatched = matched.has(p.wordId);
                const isSel = leftSel === p.wordId;
                return (
                  <button
                    key={p.wordId}
                    type="button"
                    disabled={isMatched}
                    onClick={() => pickLeft(p.wordId)}
                    className={cn(
                      'relative min-h-[4.5rem] rounded-2xl border-2 px-3 py-2.5 flex items-center justify-center transition-all',
                      isMatched
                        ? 'border-success bg-success/10'
                        : isSel
                          ? 'border-primary bg-primary-100 ring-4 ring-primary/15'
                          : 'border-neutral-200 bg-white hover:border-primary-300',
                    )}
                  >
                    <HanziText text={p.hz} size="base" />
                    {isMatched && <MatchCheck />}
                  </button>
                );
              })}
            </div>

            {/* Cột phải: nghĩa (xáo trộn) */}
            <div className="flex flex-col gap-3">
              {rights.map((p) => {
                const isMatched = matched.has(p.wordId);
                const isWrong = wrong === p.wordId;
                return (
                  <button
                    key={p.wordId}
                    type="button"
                    disabled={isMatched}
                    onClick={() => pickRight(p.wordId)}
                    className={cn(
                      'relative min-h-[4.5rem] rounded-2xl border-2 px-3 py-2.5 flex items-center justify-center text-center transition-all',
                      'font-sans font-semibold text-sm md:text-base leading-snug',
                      isMatched
                        ? 'border-success bg-success/10 text-success'
                        : isWrong
                          ? 'border-danger bg-danger/10 text-danger animate-shake'
                          : cn(
                              'border-neutral-200 bg-white text-neutral-800',
                              leftSel ? 'hover:border-primary hover:bg-primary-100/40' : 'hover:border-primary-300',
                            ),
                    )}
                  >
                    {p.meaning}
                    {isMatched && <MatchCheck />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BottomCta disabled={!done} onClick={onNext} withArrow>
        {done ? 'Tiếp tục' : `Đã nối ${matched.size}/${total}`}
      </BottomCta>
    </>
  );
}

/** Dấu tích góc trên phải khi nối đúng. */
function MatchCheck() {
  return (
    <span className="absolute -top-2 -right-2 size-5 rounded-full bg-success text-white flex items-center justify-center shadow-sm">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
