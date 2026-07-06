'use client';

import Link from 'next/link';
import type { HomeData } from '@/lib/types';

/** Home Card teal (Figma): tiến độ học + gốc từ đang học + nút Học tiếp. */
export function HomeCard({ data }: { data: HomeData }) {
  const { user, continueLearning } = data;
  const pct = user.totalRoots
    ? Math.max(4, Math.round((user.learnedRoots / user.totalRoots) * 100))
    : 0;
  return (
    <div className="relative flex-1 min-w-0 h-full overflow-hidden rounded-[1.25rem] border-b-[0.3125rem] border-primary-800 px-5 py-4 flex flex-col justify-between gap-2.5 bg-card-teal">
      {/* nội dung: tiêu đề + progress */}
      <div className="relative flex w-full flex-col gap-3">
        <div className="flex w-full items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full border-b-[0.1875rem] border-primary-700 shrink-0 bg-card-teal">
            <span className="font-han font-bold text-[1.375rem] text-white" lang="zh">字</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-2xl leading-[1.875rem] tracking-[-0.0094rem] text-white truncate">
              {continueLearning ? `Nhóm ${continueLearning.topicTitle}` : `Level ${user.level}`}
            </p>
            <p className="font-sans font-medium text-base leading-6 text-neutral-100">
              Bạn đã học <span className="font-bold text-white">{user.learnedRoots}/{user.totalRoots}</span> gốc từ
            </p>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-progress-teal"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* hàng gốc từ + nút Học tiếp (chữ sáng trên nền teal) */}
      {continueLearning && (
        <div className="relative flex w-full items-center gap-3">
          <div className="flex w-[3.125rem] flex-col items-center justify-center rounded-xl border border-neutral-300 bg-white py-2.5 shrink-0">
            <span className="font-han font-bold text-2xl leading-[1.875rem] text-neutral-900" lang="zh">
              {continueLearning.root.hz}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-base leading-6 text-blue-50 truncate">
              {continueLearning.root.py}
            </p>
            <p className="font-sans font-medium text-base leading-6 text-neutral-100 truncate">
              {continueLearning.root.hv}
            </p>
          </div>
          <Link
            href={`/practice/${continueLearning.root.id}`}
            className="h-9 px-4 rounded-full bg-white border-b-4 border-neutral-300 flex items-center font-sans font-semibold text-sm text-primary shrink-0"
          >
            Học tiếp
          </Link>
        </div>
      )}
    </div>
  );
}
