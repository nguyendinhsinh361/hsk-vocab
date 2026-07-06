'use client';

/**
 * Màn Trang chủ — DESKTOP (≥lg). Bám sát Figma node 500:17230:
 *   Sidebar 272 · Home Card teal + banner phải · hàng gốc phổ biến ·
 *   "Khám phá nhóm gốc" lưới 3 cột.
 * File này chỉ COMPOSE — từng khối nằm ở components/home/* & components/layout/*.
 */

import Link from 'next/link';
import type { HomeData } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorState } from '@/components/common/ErrorState';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
import { Carousel } from '@/components/common/Carousel';
import { HomeCard } from './HomeCard';
import { AdBanner } from './AdBanner';
import { RootCard } from './RootCard';
import { TopicCard, TOPIC_ACCENTS } from './TopicCard';

const ROOTS_PER_PAGE = 6;
const TOPICS_PER_PAGE = 9; // 3 cột × 3 hàng mỗi trang

export default function HomeWeb({
  data,
  error,
  onRetry,
}: {
  data: HomeData | null;
  error: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="relative z-10 flex h-full w-full">
        <Sidebar active="/home" />
        <main className="flex-1 h-full overflow-y-auto px-6 py-6">
          {error && <ErrorState detail={`API: ${error}`} onRetry={onRetry} />}
          {!data && !error && <p className="text-neutral-400">Đang tải…</p>}

          {data && (
            <div className="w-full">
              <header className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-sans font-bold text-[1.75rem] leading-[2.375rem] tracking-[-0.0125rem] text-neutral-900">
                    Chào bạn!
                  </h1>
                  <p className="font-sans font-medium text-base text-neutral-500">
                    Khám phá thế giới từ vựng ngay!
                  </p>
                </div>
                <ReviewPill due={data.user.reviewDue} />
              </header>

              {/* Hero: Home Card (trái) + banner (phải) — 2 cột bằng nhau trên xl */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 h-72 xl:h-80">
                <HomeCard data={data} />
                <AdBanner />
              </div>

              {/* Gốc từ phổ biến */}
              {data.popularRoots.length > 0 && (
                <Carousel
                  className="mt-6"
                  title="Gốc từ phổ biến"
                  items={data.popularRoots}
                  perPage={ROOTS_PER_PAGE}
                  gridClassName="grid-cols-3 md:grid-cols-6 gap-3"
                  renderItem={(r) => <RootCard key={r.id} root={r} />}
                />
              )}

              {/* Khám phá nhóm gốc */}
              <Carousel
                className="mt-7"
                title="Khám phá nhóm gốc"
                items={data.topicGroups}
                perPage={TOPICS_PER_PAGE}
                gridClassName="grid-cols-2 md:grid-cols-3 gap-5"
                renderItem={(t, i) => (
                  <TopicCard
                    key={t.id}
                    topic={t}
                    accent={TOPIC_ACCENTS[i % TOPIC_ACCENTS.length]}
                  />
                )}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/** Nút "Ôn tập X từ" — chỉ hiện khi có từ đến hạn trong hàng đợi ôn. */
function ReviewPill({ due }: { due: number }) {
  if (!due) return null;
  return (
    <Link
      href="/review"
      className="shrink-0 inline-flex items-center gap-2 h-11 rounded-full px-4 bg-badge-teal text-white font-sans font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
    >
      <span className="size-2 rounded-full bg-white/90 animate-pulse" />
      Ôn tập {due} từ
    </Link>
  );
}
