'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Carousel phân trang, trượt phải→trái + VUỐT (touch) trên điện thoại.
 * Header: tiêu đề + chấm chỉ trang + nút "Xem thêm ›" (cuộn vòng).
 */
export function SwipeCarousel<T>({
  title,
  items,
  perPage,
  gridClassName,
  renderItem,
  className,
}: {
  title: string;
  items: T[];
  perPage: number;
  gridClassName: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}) {
  const [page, setPage] = useState(0);
  const startX = useRef<number | null>(null);

  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  const total = Math.max(1, pages.length);
  const cur = Math.min(page, total - 1);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    const TH = 40;
    if (dx < -TH) setPage((cur + 1) % total); // vuốt sang trái → trang kế
    else if (dx > TH) setPage((cur - 1 + total) % total); // vuốt sang phải → trang trước
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans font-bold text-base text-neutral-900">{title}</h2>
        {total > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {pages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === cur ? 'w-4 bg-primary' : 'w-1.5 bg-neutral-300',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPage((cur + 1) % total)}
              className="font-sans font-semibold text-[0.8125rem] text-primary-700 active:opacity-70"
            >
              Xem thêm ›
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          className="flex items-start transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${cur * 100}%)` }}
        >
          {pages.map((pg, pi) => (
            <div
              key={pi}
              className={cn('w-full shrink-0 self-start auto-rows-min', gridClassName)}
            >
              {pg.map((it, i) => renderItem(it, pi * perPage + i))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
