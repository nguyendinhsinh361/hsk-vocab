import { cn } from '@/lib/cn';
import { HanziText } from './HanziText';

/**
 * 1 lựa chọn đáp án (dùng cho cả TEACH & QUIZ).
 * States: idle · selected (xanh dương) · correct (xanh lá) · wrong (đỏ) — sau khi Kiểm tra.
 */
export function OptionButton({
  label,
  selected,
  checked,
  isCorrect,
  isWrongPick,
  onClick,
}: {
  label: string;
  selected: boolean;
  checked: boolean;
  isCorrect: boolean;
  isWrongPick: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={checked}
      onClick={onClick}
      className={cn(
        'min-h-14 md:min-h-[5rem] w-full rounded-xl md:rounded-2xl border-2 px-3 py-2.5 md:px-4 md:py-4',
        'flex items-center justify-center text-center',
        'font-sans font-semibold text-base md:text-lg leading-snug transition-colors',
        // idle
        'border-neutral-200 bg-white text-neutral-800',
        // đang chọn (chưa chấm)
        selected && !checked && 'border-blue-400 bg-blue-400 text-white',
        // đã chấm: đáp án đúng
        checked && isCorrect && 'border-success bg-success/10 text-success',
        // đã chấm: chọn sai
        checked && isWrongPick && 'border-danger bg-danger/10 text-danger',
      )}
    >
      <HanziText text={label} />
    </button>
  );
}
