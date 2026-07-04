'use client';

/**
 * MÀN: Luồng luyện tập (mobile) — sau nút "Chiến luôn đi nào".
 * Chuỗi: Trailer (dạy từ) → Pattern (lộ gốc) → Test (chọn nghĩa) → Tổng kết.
 * State machine: hooks/usePracticeFlow. Nguồn dữ liệu: GET /practice/session (model HSK mới).
 * Route: /practice/[root]  (vd /practice/people → gốc 人).
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { PatternStep } from '@/lib/types';
import { usePracticeFlow } from '@/hooks/usePracticeFlow';
import { TeachScreen } from '@/components/practice/TeachScreen';
import { PatternScreen } from '@/components/practice/PatternScreen';
import { QuizScreen } from '@/components/practice/QuizScreen';
import { SummaryScreen } from '@/components/practice/SummaryScreen';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';

export default function PracticeFlowPage({
  params,
}: {
  params: Promise<{ root: string }>;
}) {
  const { root } = use(params);
  const f = usePracticeFlow(root);

  const patternStep = f.steps.find(
    (s): s is PatternStep => s.kind === 'PATTERN',
  );

  const fill =
    f.total > 0
      ? Math.round(
          ((f.index + (f.phase === 'summary' ? 1 : 0)) / f.total) * 100,
        )
      : 0;

  return (
    <div className="relative min-h-[100dvh] w-full bg-white">
      <BrandBackdrop />
      {/* Mobile: cột 430px. Desktop: full-width, panel nội dung tự căn giữa (Figma web). */}
      <div className="relative z-10 mx-auto min-h-[100dvh] w-full max-w-[26.875rem] md:max-w-none bg-transparent">
        {f.phase !== 'summary' && (
          <div className="absolute left-0 top-0 z-20 w-full px-4 md:px-8 pt-4 md:pt-6 flex justify-center">
            <div className="flex items-center gap-3 md:gap-4 w-full max-w-[26.875rem] md:max-w-[56rem]">
              <Link
                href="/onboarding/summary"
                aria-label="Quay lại"
                className="shrink-0 size-10 flex items-center justify-center text-neutral-900"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex-1 h-3 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${fill}%`, backgroundImage: 'linear-gradient(-34.6deg, #12D18E 0%, #71E3BB 100%)' }}
                />
              </div>
              <PracticeTimer running={f.phase === 'step'} />
            </div>
          </div>
        )}

        {f.phase === 'loading' && <Centered>Đang tải bài luyện tập…</Centered>}

        {f.phase === 'error' && (
          <Centered>
            <p className="text-danger font-medium">Lỗi: {f.error}</p>
            <button
              onClick={f.retry}
              className="mt-4 h-11 px-6 rounded-full bg-[#00b2a5] text-white font-semibold"
            >
              Thử lại
            </button>
          </Centered>
        )}

        {f.phase === 'step' && f.current?.kind === 'TEACH' && (
          <TeachScreen
            step={f.current}
            selected={f.selected}
            checked={f.sub === 'checked'}
            onSelect={f.select}
            onCheck={f.check}
            onNext={f.next}
          />
        )}

        {f.phase === 'step' && f.current?.kind === 'PATTERN' && (
          <PatternScreen step={f.current} onNext={f.advance} />
        )}

        {f.phase === 'step' && f.current?.kind === 'QUIZ' && (
          <QuizScreen
            step={f.current}
            selected={f.selected}
            inputText={f.inputText}
            checked={f.sub === 'checked'}
            isCorrect={f.isCorrect}
            onSelect={f.select}
            onInput={f.setInput}
            onCheck={f.check}
            onNext={f.next}
            isLast={f.index >= f.total - 1}
          />
        )}

        {f.phase === 'summary' && (
          <SummaryScreen
            correct={f.quizCorrect}
            total={f.totalQuiz}
            xp={f.xpEarned}
            root={f.root}
            patterns={patternStep?.patterns ?? []}
            onRetry={f.retry}
          />
        )}
      </div>
    </div>
  );
}

/** Bộ đếm thời gian làm bài (đếm lên mm:ss); chỉ chạy khi đang ở bước luyện tập. */
function PracticeTimer({ running }: { running: boolean }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return (
    <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 h-8 md:h-9 font-sans font-semibold text-sm md:text-base text-neutral-600 tabular-nums">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9 2h6" />
      </svg>
      {mm}:{ss}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-neutral-600">
      {children}
    </div>
  );
}
