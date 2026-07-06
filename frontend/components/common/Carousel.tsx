'use client';

/**
 * Carousel phân trang dùng chung (trước đây RootsCarousel + TopicCarousel
 * trong HomeWeb trùng ~80%). Tự quản lý trang hiện tại.
 */

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Carousel<T>({
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
  /** Lớp grid cho 1 trang (vd "grid-cols-3 md:grid-cols-6 gap-3"). */
  gridClassName: string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const [page, setPage] = useState(0);

  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  const total = Math.max(1, pages.length);
  const cur = Math.min(page, total - 1);

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans font-bold text-xl text-neutral-900">{title}</h2>
        {total > 1 && (
          <CarouselControls cur={cur} total={total} onPage={setPage} />
        )}
      </div>
      <div className="overflow-hidden">
        <div
          className="flex items-start transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${cur * 100}%)` }}
        >
          {pages.map((pg, pi) => (
            <div
              key={pi}
              className={cn('w-full shrink-0 grid content-start', gridClassName)}
            >
              {pg.map((item, i) => renderItem(item, pi * perPage + i))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarouselControls({
  cur,
  total,
  onPage,
}: {
  cur: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Trang trước"
        disabled={cur === 0}
        onClick={() => onPage(cur - 1)}
        className="size-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-300 hover:text-primary-700 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="flex items-center gap-1.5 px-1">
        {Array.from({ length: total }).map((_, i) => (
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
        disabled={cur >= total - 1}
        onClick={() => onPage(cur + 1)}
        className="h-9 pl-4 pr-3 rounded-full bg-primary-100 flex items-center gap-1 font-sans font-semibold text-sm text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-200 transition-colors"
      >
        Xem thêm
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
