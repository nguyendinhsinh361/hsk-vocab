'use client';

/**
 * PaymentShell — khung responsive cho luồng thanh toán.
 *   <md  : full-bleed kín màn (trải nghiệm app trên điện thoại).
 *   ≥md  : card căn giữa, rộng cỡ phone, cao theo nội dung (tối đa gần full viewport
 *          rồi cuộn nội bộ), nền trang mờ tối để nổi card.
 * Con bên trong nên là flex-col h-full: vùng cuộn `flex-1 min-h-0 overflow-y-auto`
 * + CTA `shrink-0` để nút luôn dính đáy card ở cả 2 chế độ.
 */

import { cn } from '@/lib/cn';

export function PaymentShell({
  children,
  className,
  wide = false,
  cardWidth = 'phone',
}: {
  children: React.ReactNode;
  className?: string;
  /** wide: card rộng 2 cột trên desktop (dùng cho paywall). Mặc định: rộng cỡ phone. */
  wide?: boolean;
  /** cardWidth: bề rộng card căn giữa trên desktop. 'phone' (mặc định) hoặc 'lg' (2 cột). */
  cardWidth?: 'phone' | 'lg';
}) {
  // wide (paywall): phủ kín viewport, không card/nền xám → không có khoảng trắng hai bên.
  if (wide) {
    return (
      <div
        className={cn('flex w-full min-h-[100dvh] flex-col bg-white', className)}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {children}
      </div>
    );
  }

  // mặc định (form/modal): card bo góc căn giữa trên nền ảnh brand ở MỌI kích thước.
  //   mobile & tablet (<lg) → tablet-bg.png · web (lg+) → web-bg.png
  return (
    <div
      className="relative flex w-full min-h-[100dvh] items-center justify-center bg-neutral-100 p-3 sm:p-6"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Nền brand: mobile + tablet (<lg) dùng tablet-bg; web (lg+) dùng web-bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block lg:hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/tablet-bg.png)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/web-bg.png)' }}
      />
      <div
        className={cn(
          // Card căn giữa, nổi trên nền ảnh; nội dung cao tối đa gần full rồi cuộn nội bộ.
          'relative z-10 mx-auto flex w-full max-w-[26.875rem] flex-col overflow-hidden bg-white',
          cardWidth === 'lg' && 'sm:max-w-[52rem]',
          'max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)]',
          'rounded-[1.75rem] sm:rounded-[2rem] shadow-[0_1.5rem_3rem_-1rem_rgba(15,23,42,0.35)]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
