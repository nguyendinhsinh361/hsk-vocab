'use client';

import type { PatternStep } from '@/lib/types';
import { BottomCta } from './BottomCta';
import { FormulaText } from './FormulaText';

/** Màn Trailer — lộ pattern gốc từ: "1 gốc → hàng loạt từ". */
export function PatternScreen({
  step,
  onNext,
}: {
  step: PatternStep;
  onNext: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 overflow-y-auto px-4 pt-20 pb-[6.875rem] flex flex-col items-center gap-4">
        <div className="size-20 rounded-full bg-primary flex items-center justify-center shadow-soft">
          <span className="font-han font-bold text-[2.5rem] text-white" lang="zh">{step.hz}</span>
        </div>
        <p className="font-sans font-medium text-base text-neutral-500">
          {step.py} · {step.hv}
        </p>
        <h2 className="text-center font-sans font-bold text-xl md:text-2xl leading-tight text-neutral-800 whitespace-nowrap">
          {step.title}
        </h2>

        <div className="w-full md:max-w-[84rem] flex flex-col gap-3">
          {step.patterns.map((pat, i) => (
            <div key={i} className="rounded-[1.25rem] bg-white border border-neutral-200 shadow-soft p-4 md:p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2">
                <FormulaText
                  text={pat.formula}
                  className="font-han font-bold text-xl text-neutral-900"
                />
                <span className="font-sans font-semibold text-sm md:text-base text-primary-700">
                  = {pat.meaning}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {pat.examples.map((ex, j) => (
                  <li key={j} className="flex items-baseline gap-3">
                    <span className="font-han font-semibold text-2xl text-neutral-900 min-w-[3.5rem]" lang="zh">
                      {ex.hz}
                    </span>
                    <span className="font-sans text-sm text-neutral-400">{ex.py}</span>
                    <span className="font-sans text-base text-neutral-600">{ex.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <BottomCta onClick={onNext} withArrow>
        Luyện tập ngay
      </BottomCta>
    </>
  );
}
