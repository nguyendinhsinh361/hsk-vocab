import Link from 'next/link';
import { cn } from '@/lib/cn';

/** Thanh trên cùng mobile: nút back (mũi tên ← đầy đủ, theo Figma) + (tuỳ chọn) Skip phải. */
export function TopNav({
  backHref,
  skipHref,
  topClass = 'top-4',
}: {
  backHref?: string;
  skipHref?: string;
  topClass?: string;
}) {
  return (
    <>
      {backHref && (
        <Link
          href={backHref}
          aria-label="Quay lại"
          className={cn('absolute left-3 z-20 size-10 flex items-center justify-center text-neutral-900', topClass)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>
      )}
      {skipHref && (
        <Link href={skipHref} className={cn('absolute right-4 z-20 h-10 flex items-center font-sans font-semibold text-xs text-neutral-900', topClass)}>
          Skip
        </Link>
      )}
    </>
  );
}
