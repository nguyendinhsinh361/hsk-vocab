'use client';

import Link from 'next/link';
import type { TopicGroup } from '@/lib/types';
import { cn } from '@/lib/cn';

/**
 * Bảng màu nhấn cho card nhóm gốc (viền + gradient icon + viền đáy icon).
 * Data-driven nên giữ inline-style; các gradient brand cố định dùng token Tailwind.
 */
export const TOPIC_ACCENTS = [
  { border: '#EF9A9A', bBottom: '#D32F2F', grad: 'linear-gradient(-74deg, #FF5A5F 0%, #FF8A9B 100%)', icon: '🍜' },
  { border: '#90CAF9', bBottom: '#1976D2', grad: 'linear-gradient(-74deg, #42A5F5 0%, #90CAF9 100%)', icon: '🧑' },
  { border: '#FFCC80', bBottom: '#F57C00', grad: 'linear-gradient(-74deg, #FB8C00 0%, #FFB74D 100%)', icon: '💼' },
  { border: '#80CBC4', bBottom: '#00695C', grad: 'linear-gradient(-74deg, #00B2A5 0%, #5ECEC6 100%)', icon: '🚗' },
  { border: '#B39DDB', bBottom: '#512DA8', grad: 'linear-gradient(-74deg, #785BFF 0%, #B39DDB 100%)', icon: '📍' },
  { border: '#A5D6A7', bBottom: '#388E3C', grad: 'linear-gradient(-74deg, #43A047 0%, #A5D6A7 100%)', icon: '🌱' },
] as const;

export type TopicAccent = (typeof TOPIC_ACCENTS)[number];

export function TopicCard({
  topic,
  accent,
  className,
}: {
  topic: TopicGroup;
  accent: TopicAccent;
  className?: string;
}) {
  const href = topic.startRootId ? `/practice/${topic.startRootId}` : '#';
  return (
    <Link
      href={href}
      className={cn(
        'relative min-h-[10rem] xl:min-h-[11rem] rounded-2xl border border-neutral-200 bg-white px-5 py-4 flex items-stretch hover:shadow-soft transition-shadow',
        className,
      )}
      style={{ borderBottomColor: accent.border, borderBottomWidth: '0.25rem' }}
    >
      {/* badge "Đang học" — pill 1 dòng, góc trên phải */}
      {topic.active && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans font-semibold text-xs text-white whitespace-nowrap shadow-sm bg-badge-teal">
          <span className="size-1.5 rounded-full bg-white/90" />
          Đang học
        </span>
      )}

      {/* trái: icon trên, tiêu đề + số dưới */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-3">
        {/* Khung icon nhóm gốc — để trống, bổ sung icon theo style riêng sau. */}
        <div
          className="flex size-12 items-center justify-center rounded-full border-b-[0.1875rem] shrink-0"
          style={{ backgroundImage: accent.grad, borderBottomColor: accent.bBottom }}
        />
        <div>
          <p className="font-sans font-bold text-lg leading-[1.625rem] text-neutral-900 truncate">
            {topic.title}
          </p>
          <p className="font-sans text-base leading-6 text-neutral-500">{topic.rootCount} gốc từ</p>
        </div>
      </div>

      {/* mũi tên góc dưới phải */}
      <div className="flex items-end shrink-0">
        <span
          className="flex size-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent.border}33` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent.bBottom} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
