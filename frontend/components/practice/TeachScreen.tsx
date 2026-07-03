'use client';

import type { TeachStep } from '@/lib/types';
import { cn } from '@/lib/cn';
import { optionGridCols } from '@/lib/optionGrid';
import { WordHead } from './WordHead';
import { CharBreakdown } from './CharBreakdown';
import { OptionButton } from './OptionButton';
import { ExplanationPanel } from './ExplanationPanel';
import { BottomCta } from './BottomCta';

/** Màn Trailer — dạy 1 từ: chữ Hán + phân tích chữ + chọn nghĩa + giải thích. */
export function TeachScreen({
  step,
  selected,
  checked,
  onSelect,
  onCheck,
  onNext,
}: {
  step: TeachStep;
  selected: number | null;
  checked: boolean;
  onSelect: (i: number) => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 overflow-y-auto px-4 md:px-8 pt-[5.75rem] md:pt-24 pb-[6.875rem] flex flex-col md:items-center">
        <div className="w-full md:max-w-[56rem] md:rounded-3xl md:border md:border-neutral-200 md:bg-white md:shadow-soft md:p-10 flex flex-col gap-5 md:gap-7">
          <WordHead hz={step.hz} py={step.py} subtitle={step.meaning} />
          <CharBreakdown parts={step.parts} />

          <div className={cn('grid gap-2.5 md:gap-4', optionGridCols(step.options.length))}>
            {step.options.map((opt, i) => (
              <OptionButton
                key={i}
                label={opt}
                selected={selected === i}
                checked={checked}
                isCorrect={checked && i === step.answerIndex}
                isWrongPick={checked && selected === i && i !== step.answerIndex}
                onClick={() => onSelect(i)}
              />
            ))}
          </div>

          {checked && (
            <ExplanationPanel
              meaning={step.meaning}
              explanation={step.explanation}
              example={step.example}
            />
          )}
        </div>
      </div>

      {checked ? (
        <BottomCta onClick={onNext} withArrow>
          Tiếp tục
        </BottomCta>
      ) : (
        <BottomCta disabled={selected == null} onClick={onCheck}>
          Kiểm tra
        </BottomCta>
      )}
    </>
  );
}
