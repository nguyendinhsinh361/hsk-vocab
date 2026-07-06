'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { PatternStep, RootMini } from '@/lib/types';
import { FormulaText } from './FormulaText';
import { HanziText } from './HanziText';

/** Màn kết quả sau khi luyện tập (khớp Figma "Kết quả"). */
export function SummaryScreen({
  correct,
  total,
  xp,
  root,
  patterns,
  onRetry,
}: {
  correct: number;
  total: number;
  xp: number;
  root: { hz: string; py: string; hv: string } | null;
  patterns: PatternStep['patterns'];
  onRetry: () => void;
}) {
  const perfect = total > 0 && correct === total;

  // Chip các từ đã học (từ ví dụ của pattern, khử trùng).
  const words = Array.from(
    new Set(patterns.flatMap((p) => p.examples.map((e) => e.hz))),
  ).slice(0, 12);

  // Gợi ý gốc từ tiếp theo (lấy từ /home, bỏ gốc hiện tại).
  const [nextRoots, setNextRoots] = useState<RootMini[]>([]);
  useEffect(() => {
    api
      .home()
      .then((h) =>
        setNextRoots(h.popularRoots.filter((r) => r.hz !== root?.hz).slice(0, 4)),
      )
      .catch(() => {});
  }, [root?.hz]);

  const nextHref = nextRoots[0] ? `/practice/${nextRoots[0].id}` : '/onboarding';

  return (
    <>
      <div className="absolute inset-0 overflow-y-auto px-4 md:px-8 pt-16 pb-[9rem] flex flex-col items-center">
        <div className="w-full max-w-[84rem] flex flex-col items-center gap-5">
          {/* Header: trophy + lời chúc */}
          <div
            className="size-20 rounded-3xl flex items-center justify-center shadow-soft"
            style={{ backgroundImage: 'linear-gradient(135deg, #12BFA6 0%, #00958B 100%)' }}
          >
            <span className="text-4xl">🏆</span>
          </div>
          <div className="text-center">
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-800">
              {perfect ? 'Tuyệt vời!' : 'Hoàn thành!'}
            </h1>
            <p className="mt-1 font-sans text-base text-neutral-500">
              Bạn đang hoàn thành rất tốt luôn!
            </p>
          </div>

          {/* Thống kê Đúng / XP */}
          <div className="w-full grid grid-cols-2 gap-3">
            <Stat label="Đúng" value={`${correct}/${total}`} />
            <Stat label="Kinh nghiệm" value={`+${xp} XP`} />
          </div>

          {/* Tổng kết gốc */}
          {root && patterns.length > 0 && (
            <section className="w-full text-left">
              <h2 className="mb-2 flex items-baseline gap-1 font-sans font-bold text-lg text-primary-700">
                Tổng kết gốc
                <HanziText text={root.hz} />
              </h2>
              <div className="rounded-2xl bg-primary-100/60 border border-primary-200 p-4 flex flex-col gap-3">
                {patterns.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <FormulaText
                      text={p.formula}
                      className="font-han font-semibold text-lg text-neutral-900"
                    />
                    <span className="font-sans text-neutral-400">=</span>
                    <span className="font-sans text-base text-neutral-700">{p.meaning}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chip các từ đã học (ruby pinyin) */}
          {words.length > 0 && (
            <div className="w-full flex flex-wrap justify-center gap-3">
              {words.map((w) => (
                <span
                  key={w}
                  className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 leading-relaxed shadow-soft"
                >
                  <HanziText text={w} size="lg" />
                </span>
              ))}
            </div>
          )}

          {/* Gốc từ tiếp theo */}
          {nextRoots.length > 0 && (
            <section className="w-full text-left">
              <h2 className="mb-3 font-sans font-bold text-lg text-neutral-800">
                Chọn gốc từ tiếp theo
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {nextRoots.map((r) => (
                  <Link
                    key={r.id}
                    href={`/practice/${r.id}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col items-center gap-1 hover:border-primary-300"
                  >
                    <HanziText text={r.hz} size="lg" className="text-neutral-900" />
                    <span className="font-sans text-sm text-neutral-500">{r.hv}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* CTA dưới cùng */}
      <div className="absolute bottom-0 left-0 z-30 w-full px-4 pb-6 pt-3 flex flex-col items-center gap-2.5 bg-gradient-to-t from-white via-white to-transparent">
        <Link
          href={nextHref}
          className="w-full max-w-[21.4375rem] md:max-w-[84rem] h-12 md:h-14 rounded-full bg-primary border-b-4 border-[#008f85] text-white flex items-center justify-center gap-2 font-sans font-semibold text-base"
        >
          Gốc từ tiếp theo
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <div className="w-full max-w-[21.4375rem] md:max-w-[84rem] flex gap-3">
          <Link
            href="/home"
            className="flex-1 h-11 rounded-full border border-neutral-300 text-neutral-700 flex items-center justify-center font-sans font-semibold text-sm"
          >
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 h-11 rounded-full border border-neutral-300 text-neutral-700 font-sans font-semibold text-sm"
          >
            Luyện lại
          </button>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200 shadow-soft py-4 flex flex-col items-center gap-0.5">
      <span className="font-sans font-bold text-[1.375rem] text-primary">{value}</span>
      <span className="font-sans text-xs text-neutral-500">{label}</span>
    </div>
  );
}
