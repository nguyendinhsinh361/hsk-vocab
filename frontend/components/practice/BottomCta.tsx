import { cn } from '@/lib/cn';

/**
 * Nút CTA dưới cùng (Kiểm tra / Tiếp tục / Luyện tập ngay).
 * disabled → xám; enabled → teal có viền đáy đậm (đồng bộ onboarding).
 */
export function BottomCta({
  children,
  disabled,
  onClick,
  withArrow,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  withArrow?: boolean;
}) {
  return (
    <div className="absolute bottom-0 left-0 z-30 w-full px-4 pb-6 pt-3 flex justify-center bg-gradient-to-t from-white via-white to-transparent">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'w-full max-w-[21.4375rem] md:max-w-[56rem] h-12 md:h-14 rounded-full flex items-center justify-center gap-2',
          'font-sans font-semibold text-base transition-colors',
          disabled
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            : 'bg-[#00b2a5] border-b-4 border-[#008f85] text-white active:translate-y-[0.0625rem]',
        )}
      >
        {children}
        {withArrow && !disabled && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </div>
  );
}
