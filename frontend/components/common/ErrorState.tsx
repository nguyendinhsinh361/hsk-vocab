'use client';

/** Màn thông báo lỗi dùng chung (theo style dự án): icon + tiêu đề + mô tả + nút thử lại. */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ErrorState({
  title = 'Ối, đã có lỗi xảy ra',
  description = 'Không tải được dữ liệu. Có thể máy chủ đang tạm gián đoạn — vui lòng thử lại sau giây lát.',
  detail,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  /** Thông tin kỹ thuật (tuỳ chọn, hiện nhỏ). */
  detail?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full min-h-[70dvh] flex flex-col items-center justify-center text-center px-6 py-16',
        className,
      )}
    >
      <div className="size-20 md:size-24 rounded-3xl bg-danger/10 text-danger flex items-center justify-center">
        <AlertTriangle size={44} strokeWidth={2} />
      </div>

      <h2 className="mt-6 font-sans font-bold text-xl md:text-2xl text-neutral-900">
        {title}
      </h2>
      <p className="mt-2 max-w-md font-sans text-sm md:text-base text-neutral-500">
        {description}
      </p>

      {detail && (
        <p className="mt-3 max-w-md font-sans text-xs text-neutral-400 break-words">
          {detail}
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] text-white font-sans font-semibold text-base active:translate-y-[0.0625rem] transition"
        >
          <RefreshCw size={18} />
          Thử lại
        </button>
      )}
    </div>
  );
}
