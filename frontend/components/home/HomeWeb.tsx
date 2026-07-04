'use client';

/**
 * Màn Trang chủ — DESKTOP (≥lg). Bám sát Figma node 500:17230:
 *   Sidebar 272 · Home Card teal 470×184 (dọc) + banner phải · hàng gốc phổ biến ·
 *   "Khám phá nhóm gốc" lưới 3 cột (icon trên, tiêu đề+số dưới, badge + mũi tên).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import type { HomeData, RootMini, TopicGroup, UserProfile } from '@/lib/types';
import { cn } from '@/lib/cn';
import { clearSession, getStoredUser } from '@/lib/session';
import { ErrorState } from '@/components/common/ErrorState';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';

// Gradient teal chuẩn Figma (Home Card + icon).
const CARD_GRADIENT =
  'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), linear-gradient(180deg, #21C99D 0%, #11BD9E 50%, #00B2A5 100%)';
const PROGRESS_FILL = 'linear-gradient(-34.6deg, #12D18E 0%, #71E3BB 100%)';
const BADGE_FILL = 'linear-gradient(-44.6deg, #12D18E 0%, #71E3BB 100%)';

// Bảng màu nhấn cho card nhóm gốc (viền + gradient icon + viền đáy icon).
const ACCENTS = [
  { border: '#EF9A9A', bBottom: '#D32F2F', grad: 'linear-gradient(-74deg, #FF5A5F 0%, #FF8A9B 100%)', icon: '🍜' },
  { border: '#90CAF9', bBottom: '#1976D2', grad: 'linear-gradient(-74deg, #42A5F5 0%, #90CAF9 100%)', icon: '🧑' },
  { border: '#FFCC80', bBottom: '#F57C00', grad: 'linear-gradient(-74deg, #FB8C00 0%, #FFB74D 100%)', icon: '💼' },
  { border: '#80CBC4', bBottom: '#00695C', grad: 'linear-gradient(-74deg, #00B2A5 0%, #5ECEC6 100%)', icon: '🚗' },
  { border: '#B39DDB', bBottom: '#512DA8', grad: 'linear-gradient(-74deg, #785BFF 0%, #B39DDB 100%)', icon: '📍' },
  { border: '#A5D6A7', bBottom: '#388E3C', grad: 'linear-gradient(-74deg, #43A047 0%, #A5D6A7 100%)', icon: '🌱' },
];

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
  const [page, setPage] = useState(0);
  const [rootPage, setRootPage] = useState(0);
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
            <header className="mb-5">
              <h1 className="font-sans font-bold text-[1.75rem] leading-[2.375rem] tracking-[-0.0125rem] text-neutral-900">
                Chào bạn!
              </h1>
              <p className="font-sans font-medium text-base text-neutral-500">
                Khám phá thế giới từ vựng ngay!
              </p>
            </header>

            {/* Hero: Home Card (trái) + banner (phải) — 2 cột bằng nhau (1:1) trên xl */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 h-72 xl:h-80">
              <HomeCard data={data} />
              <AdBanner />
            </div>

            {/* Gốc từ phổ biến — carousel */}
            {data.popularRoots.length > 0 && (
              <RootsCarousel
                roots={data.popularRoots}
                page={rootPage}
                onPage={setRootPage}
              />
            )}

            {/* Khám phá nhóm gốc */}
            <TopicCarousel
              topics={data.topicGroups}
              page={page}
              onPage={setPage}
            />
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

/* ------------------------------ Sidebar ------------------------------ */
export function Sidebar({ active = '/home' }: { active?: string }) {
  // icon: '' — chỗ trống để bổ sung icon theo style riêng sau này.
  const nav = [
    { label: 'Trang chủ', icon: '', href: '/home' },
    { label: 'Nạp VIP', icon: '', href: '/premium' },
    { label: 'Hồ sơ', icon: '', href: '/profile' },
  ].map((n) => ({ ...n, active: n.href === active }));
  return (
    <aside className="hidden md:flex h-[calc(100dvh-1.5rem)] my-3 ml-3 w-[13.75rem] xl:w-[17rem] shrink-0 flex-col overflow-y-auto no-scrollbar rounded-2xl border border-neutral-200 shadow-soft bg-white px-4 xl:px-5 pt-8 pb-6">
      <div className="px-2 mb-9 font-sans font-extrabold text-2xl text-primary-700">
        migii
      </div>
      <nav className="flex flex-col gap-0">
        {nav.map((n) => (
          <Link
            key={n.label}
            href={n.href}
            className={cn(
              'flex items-center gap-3 h-14 rounded-full px-4 font-sans font-semibold text-base',
              n.active
                ? 'bg-primary-100 text-primary-800'
                : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            {n.icon && <span className="text-lg">{n.icon}</span>}
            <span className="flex-1">{n.label}</span>
            {n.active && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-xl p-4 text-white" style={{ backgroundImage: CARD_GRADIENT }}>
          <p className="font-sans font-medium text-sm leading-5">
            Nâng cấp để mở khoá tất cả chủ đề và gốc từ
          </p>
          <Link
            href="/premium"
            className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-white text-primary-700 font-sans font-semibold text-sm"
          >
            Nâng cấp ngay
          </Link>
        </div>

        <UserPanel />
      </div>
    </aside>
  );
}

/** Thẻ thông tin user + nút đăng xuất (đáy sidebar). */
function UserPanel() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  const name = user?.name ?? 'Khách';
  const sub = user?.email ?? `Level ${user?.level ?? 1}`;
  const initial = name.trim().charAt(0).toUpperCase() || 'K';

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5 flex items-center gap-2.5">
      <div className="size-9 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-sans font-bold">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-sm text-neutral-900 truncate">{name}</p>
        <p className="font-sans text-xs text-neutral-400 truncate">{sub}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        aria-label="Đăng xuất"
        title="Đăng xuất"
        className="shrink-0 size-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}

/* ---------------------------- Home Card ---------------------------- */
function HomeCard({ data }: { data: HomeData }) {
  const { user, continueLearning } = data;
  const pct = user.totalRoots
    ? Math.max(4, Math.round((user.learnedRoots / user.totalRoots) * 100))
    : 0;
  return (
    <div
      className="relative flex-1 min-w-0 h-full overflow-hidden rounded-[1.25rem] border-b-[0.3125rem] border-[#00655e] px-5 py-4 flex flex-col justify-between gap-2.5"
      style={{ backgroundImage: CARD_GRADIENT }}
    >
      {/* nội dung: tiêu đề + progress */}
      <div className="relative flex w-full flex-col gap-3">
        <div className="flex w-full items-center gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-full border-b-[0.1875rem] border-[#008f85] shrink-0"
            style={{ backgroundImage: CARD_GRADIENT }}
          >
            <span className="font-han font-bold text-[1.375rem] text-white" lang="zh">字</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-2xl leading-[1.875rem] tracking-[-0.0094rem] text-white truncate">
              {continueLearning ? `Nhóm ${continueLearning.topicTitle}` : `Level ${user.level}`}
            </p>
            <p className="font-sans font-medium text-base leading-6 text-[#f1f5f9]">
              Bạn đã học <span className="font-bold text-white">{user.learnedRoots}/{user.totalRoots}</span> gốc từ
            </p>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundImage: PROGRESS_FILL }} />
        </div>
      </div>

      {/* hàng gốc từ + nút Học tiếp (chữ sáng trên nền teal) */}
      {continueLearning && (
        <div className="relative flex w-full items-center gap-3">
          <div className="flex w-[3.125rem] flex-col items-center justify-center rounded-xl border border-[#cbd5e1] bg-white py-2.5 shrink-0">
            <span className="font-han font-bold text-2xl leading-[1.875rem] text-neutral-900" lang="zh">
              {continueLearning.root.hz}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-base leading-6 text-[#e3f2fd] truncate">
              {continueLearning.root.py}
            </p>
            <p className="font-sans font-medium text-base leading-6 text-[#f1f5f9] truncate">
              {continueLearning.root.hv}
            </p>
          </div>
          <Link
            href={`/practice/${continueLearning.root.id}`}
            className="h-9 px-4 rounded-full bg-white border-b-4 border-[#cbd5e1] flex items-center font-sans font-semibold text-sm text-[#00b2a5] shrink-0"
          >
            Học tiếp
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Ad banner ---------------------------- */
// Ảnh banner trong /public/banner — tự chuyển mỗi 5s (cross-fade).
const BANNERS = ['/banner/hskk.webp', '/banner/ydx.png'];

function AdBanner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (BANNERS.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden xl:block h-full w-full self-stretch rounded-[1.25rem] overflow-hidden border border-neutral-200 bg-primary-100 relative">
      {BANNERS.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt="Quảng cáo"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out',
            i === idx ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/40 text-white font-sans text-[0.6875rem] px-2 py-0.5">
        Quảng cáo
      </span>
      {BANNERS.length > 1 && (
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {BANNERS.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------ Popular root card ------------------------ */
function RootCard({ root }: { root: RootMini }) {
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

/* ------------------------- Topic group card ------------------------- */
type Accent = (typeof ACCENTS)[number];
/* ---------------- Điều khiển carousel dùng chung ---------------- */
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

/* ---------------- Carousel "Gốc từ phổ biến" ---------------- */
const ROOTS_PER_PAGE = 6;
function RootsCarousel({
  roots,
  page,
  onPage,
}: {
  roots: RootMini[];
  page: number;
  onPage: (p: number) => void;
}) {
  const pages: RootMini[][] = [];
  for (let i = 0; i < roots.length; i += ROOTS_PER_PAGE) {
    pages.push(roots.slice(i, i + ROOTS_PER_PAGE));
  }
  const total = Math.max(1, pages.length);
  const cur = Math.min(page, total - 1);
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans font-bold text-xl text-neutral-900">Gốc từ phổ biến</h2>
        {total > 1 && <CarouselControls cur={cur} total={total} onPage={onPage} />}
      </div>
      <div className="overflow-hidden">
        <div
          className="flex items-start transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${cur * 100}%)` }}
        >
          {pages.map((pg, pi) => (
            <div key={pi} className="w-full shrink-0 grid grid-cols-3 md:grid-cols-6 gap-3">
              {pg.map((r) => (
                <RootCard key={r.id} root={r} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Carousel "Khám phá nhóm gốc" (trượt ngang) ---------------- */
function TopicCarousel({
  topics,
  page,
  onPage,
}: {
  topics: TopicGroup[];
  page: number;
  onPage: (p: number) => void;
}) {
  const pages: TopicGroup[][] = [];
  for (let i = 0; i < topics.length; i += TOPICS_PER_PAGE) {
    pages.push(topics.slice(i, i + TOPICS_PER_PAGE));
  }
  const total = Math.max(1, pages.length);
  const cur = Math.min(page, total - 1);

  return (
    <>
      <div className="mt-7 mb-4 flex items-center justify-between">
        <h2 className="font-sans font-bold text-xl text-neutral-900">Khám phá nhóm gốc</h2>
        {total > 1 && <CarouselControls cur={cur} total={total} onPage={onPage} />}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex items-start transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${cur * 100}%)` }}
        >
          {pages.map((pg, pi) => (
            <div
              key={pi}
              className="w-full shrink-0 grid grid-cols-2 md:grid-cols-3 gap-5 content-start"
            >
              {pg.map((t, i) => (
                <TopicCard
                  key={t.id}
                  topic={t}
                  accent={ACCENTS[(pi * TOPICS_PER_PAGE + i) % ACCENTS.length]}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TopicCard({
  topic,
  accent,
  className,
}: {
  topic: TopicGroup;
  accent: Accent;
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
        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans font-semibold text-xs text-white whitespace-nowrap shadow-sm"
          style={{ backgroundImage: BADGE_FILL }}
        >
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
