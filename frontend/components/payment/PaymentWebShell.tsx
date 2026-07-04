'use client';

/** Khung desktop cho luồng thanh toán: Sidebar (navbar) + card căn giữa (giống màn Hồ sơ/Premium). */

import { Sidebar } from '@/components/home/HomeWeb';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
import { cn } from '@/lib/cn';

export function PaymentWebShell({
  children,
  maxWidth = 'lg',
}: {
  children: React.ReactNode;
  /** 'lg' cho form nhiều nội dung; 'sm' cho card gọn (vd thành công). */
  maxWidth?: 'lg' | 'sm';
}) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="relative z-10 flex h-full w-full">
        <Sidebar active="/premium" />
        <main className="flex-1 h-full overflow-y-auto flex items-center justify-center px-6 py-10">
          <div className={cn('w-full', maxWidth === 'lg' ? 'max-w-[52rem]' : 'max-w-[26rem]')}>
            <div className="relative flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-soft">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
