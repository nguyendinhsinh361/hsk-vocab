'use client';

import Link from 'next/link';
import type { RootMini } from '@/lib/types';

/** Ô gốc từ phổ biến — bấm vào là luyện tập gốc đó. */
export function RootCard({ root }: { root: RootMini }) {
  return (
    <Link
      href={`/practice/${root.id}`}
      className="w-full h-28 rounded-2xl border border-neutral-200 bg-white flex flex-col items-center justify-center gap-1 hover:border-primary-300"
    >
      <span className="font-han font-bold text-5xl leading-none text-neutral-900" lang="zh">
        {root.hz}
      </span>
      <span className="font-sans text-sm text-neutral-500 truncate max-w-full px-1">{root.hv}</span>
    </Link>
  );
}
