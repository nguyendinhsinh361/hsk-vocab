import { cn } from '@/lib/cn';

/**
 * Khung màn mobile: nền `bg` phủ FULL-BLEED (kín viewport, không lộ dải trắng),
 * nội dung căn giữa trong cột phone-width (≤430). Không status bar/home indicator giả.
 */
export function PhoneFrame({
  children,
  bg,
  className,
}: {
  children: React.ReactNode;
  bg?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className="relative w-full min-h-[100dvh] overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {bg}
      <div className={cn('relative mx-auto w-full max-w-[26.875rem] min-h-[100dvh]', className)}>
        {children}
      </div>
    </div>
  );
}
