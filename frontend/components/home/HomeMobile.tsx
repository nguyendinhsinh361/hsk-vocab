'use client';

/** Màn Trang chủ — MOBILE (<md). Fluid full-width (không khung phone) + bottom tab. */

import Link from 'next/link';
import { Home, Gem, User } from 'lucide-react';
import type { HomeData, RootMini, TopicGroup } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ErrorState } from '@/components/common/ErrorState';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
import { SwipeCarousel } from './SwipeCarousel';

const ACCENTS = ['#EF5350', '#42A5F5', '#F59E0B', '#00B2A5', '#785BFF'];

export default function HomeMobile({
  data,
  error,
  onRetry,
}: {
  data: HomeData | null;
  error: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="absolute inset-0 z-10 overflow-y-auto px-4 pt-6 pb-24">
        {error && <ErrorState detail={`API: ${error}`} onRetry={onRetry} />}
        {!data && !error && (
          <p className="mt-10 text-center text-neutral-400 text-sm">Đang tải…</p>
        )}

        {data && (
          <>
            <header className="mb-4">
              <h1 className="font-sans font-bold text-2xl text-neutral-900">
                Chào bạn!
              </h1>
              <p className="mt-0.5 font-sans text-sm text-neutral-500">
                Bắt đầu đặt những viên gạch đầu tiên nào
              </p>
            </header>

            <LevelCard data={data} />

            <SwipeCarousel
              title="Khám phá nhóm gốc"
              items={data.topicGroups}
              perPage={4}
              gridClassName="grid grid-cols-2 gap-3"
              renderItem={(t, i) => (
                <TopicCard key={t.id} topic={t} accent={ACCENTS[i % ACCENTS.length]} />
              )}
            />

            <SwipeCarousel
              title="Gốc từ phổ biến"
              className="mt-5"
              items={data.popularRoots}
              perPage={6}
              gridClassName="grid grid-cols-3 gap-3"
              renderItem={(r) => <PopularRootCard key={r.id} root={r} />}
            />
          </>
        )}
      </div>

      <BottomTab active="/home" />
    </div>
  );
}

function LevelCard({ data }: { data: HomeData }) {
  const { user, continueLearning } = data;
  const pct = user.totalRoots
    ? Math.round((user.learnedRoots / user.totalRoots) * 100)
    : 0;
  return (
    <div
      className="mb-6 rounded-3xl p-6 text-white shadow-soft"
      style={{ backgroundImage: 'linear-gradient(135deg, #12BFA6 0%, #00B2A5 60%, #00958B 100%)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-sans font-bold text-2xl">Level {user.level}</span>
      </div>
      <p className="mt-1.5 font-sans text-base text-white/85">
        Bạn đã học {user.learnedRoots}/{user.totalRoots} gốc từ
      </p>
      <div className="mt-4 h-3 w-full rounded-full bg-white/25 overflow-hidden">
        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>

      {continueLearning && (
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white p-4">
          <div className="size-16 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
            <span className="font-han font-bold text-[2.5rem] leading-none text-neutral-900" lang="zh">
              {continueLearning.root.hz}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-semibold text-lg text-neutral-900 truncate">
              {continueLearning.root.py}
            </p>
            <p className="font-sans text-sm text-neutral-500 truncate">
              {continueLearning.root.hv}
            </p>
          </div>
          <Link
            href={`/practice/${continueLearning.root.id}`}
            className="h-11 px-6 rounded-full bg-[#00b2a5] text-white font-sans font-semibold text-base flex items-center shrink-0"
          >
            Học tiếp
          </Link>
        </div>
      )}
    </div>
  );
}


function TopicCard({ topic, accent }: { topic: TopicGroup; accent: string }) {
  const href = topic.startRootId ? `/practice/${topic.startRootId}` : '#';
  return (
    <Link
      href={href}
      className="relative rounded-xl border border-neutral-200 bg-white p-3 flex flex-col gap-2"
      style={{ borderTopColor: accent, borderTopWidth: '0.1875rem' }}
    >
      {topic.active && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-success/15 text-success font-sans font-semibold text-[0.625rem] px-2 py-0.5">
          Đang học
        </span>
      )}
      {/* Khung icon nhóm gốc — để trống, bổ sung icon theo style riêng sau. */}
      <div className="size-9 rounded-full" style={{ backgroundColor: `${accent}22` }} />
      <div>
        <p className="font-sans font-semibold text-[0.9375rem] text-neutral-900">{topic.title}</p>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="font-sans text-xs text-neutral-400">{topic.rootCount} gốc từ</span>
          <span className="font-sans text-base" style={{ color: accent }}>→</span>
        </div>
      </div>
    </Link>
  );
}

function PopularRootCard({ root }: { root: RootMini }) {
  return (
    <Link
      href={`/practice/${root.id}`}
      className="w-full h-24 rounded-2xl border border-neutral-200 bg-white flex flex-col items-center justify-center gap-0.5"
    >
      <span className="font-han font-bold text-4xl leading-none text-neutral-900" lang="zh">
        {root.hz}
      </span>
      <span className="font-sans text-xs text-neutral-500 truncate max-w-full px-1">{root.hv}</span>
    </Link>
  );
}

export function BottomTab({ active = '/home' }: { active?: string }) {
  const items = [
    { label: 'Trang chủ', Icon: Home, href: '/home' },
    { label: 'Nâng cấp', Icon: Gem, href: '/premium' },
    { label: 'Cá nhân', Icon: User, href: '/profile' },
  ].map((it) => ({ ...it, active: it.href === active }));
  return (
    <nav className="absolute bottom-4 left-4 right-4 z-30 rounded-[1.75rem] border border-neutral-100 bg-white/95 backdrop-blur px-3 py-2.5 flex items-center justify-around shadow-[0_0.5rem_1.875rem_rgba(15,23,42,0.14)]">
      {items.map(({ label, Icon, href, active }) => (
        <Link
          key={label}
          href={href}
          className={cn(
            'rounded-2xl transition-all duration-300 ease-out active:scale-95',
            active
              ? 'flex items-center gap-2 bg-primary-100 px-4 py-2.5 text-primary-700'
              : 'flex flex-col items-center gap-1 px-3 py-1 text-neutral-400 hover:text-primary-600',
          )}
        >
          <Icon size={active ? 20 : 22} strokeWidth={active ? 2.2 : 2} />
          <span
            className={cn(
              'font-sans whitespace-nowrap',
              active ? 'font-semibold text-sm' : 'font-medium text-xs',
            )}
          >
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
