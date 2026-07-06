'use client';

/** Màn Cá nhân — DESKTOP (≥md). Sidebar dùng lại của Home + nội dung hồ sơ căn giữa. */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gem, ChevronRight, Bell, Globe, HelpCircle, UserRound } from 'lucide-react';
import type { HomeData, UserProfile, PracticeHistoryItem } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorState } from '@/components/common/ErrorState';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
import { getStoredUser } from '@/lib/session';
import { api } from '@/lib/api';

const MENU = [
  { label: 'Thông tin tài khoản', Icon: UserRound, href: '#' },
  { label: 'Ngôn ngữ', Icon: Globe, href: '#' },
  { label: 'Thông báo', Icon: Bell, href: '#' },
  { label: 'Trợ giúp & phản hồi', Icon: HelpCircle, href: '#' },
];

export default function ProfileWeb({
  data,
  error,
}: {
  data: HomeData | null;
  error: string | null;
}) {
  const [stored, setStored] = useState<UserProfile | null>(null);
  useEffect(() => setStored(getStoredUser()), []);

  const [history, setHistory] = useState<PracticeHistoryItem[] | null>(null);
  const [historyErr, setHistoryErr] = useState<string | null>(null);
  useEffect(() => {
    api.practiceHistory().then(setHistory).catch((e) => setHistoryErr((e as Error).message));
  }, []);

  const user = data?.user;
  const pct = user?.totalRoots ? Math.round((user.learnedRoots / user.totalRoots) * 100) : 0;
  const name = stored?.name ?? user?.name ?? 'Học viên';
  const sub = stored?.email ?? `Level ${user?.level ?? 1}`;
  const initial = name.trim().charAt(0).toUpperCase() || 'H';

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="relative z-10 flex h-full w-full">
      <Sidebar active="/profile" />
      <main className="flex-1 h-full overflow-y-auto px-6 py-10">
        {error ? (
          <ErrorState detail={`API: ${error}`} />
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Cột trái: thông tin hiện tại */}
            <div className="flex flex-col gap-6">
            {/* Header hồ sơ — căn giữa */}
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-soft p-10 flex flex-col items-center text-center">
              <div
                className="size-28 rounded-full flex items-center justify-center text-white font-sans font-extrabold text-5xl shadow-soft"
                style={{ backgroundImage: 'linear-gradient(135deg,#12BFA6 0%,#00958B 100%)' }}
              >
                {initial}
              </div>
              <p className="mt-5 font-sans font-bold text-3xl text-neutral-900">{name}</p>
              <p className="mt-1 font-sans text-lg text-neutral-500">{sub}</p>
              <span className="mt-3 inline-flex items-center rounded-full bg-primary-100 px-4 py-1.5 font-sans font-semibold text-sm text-primary-700">
                Level {stored?.level ?? user?.level ?? 1}
              </span>

              {/* Chỉ số */}
              <div className="mt-6 grid grid-cols-3 gap-3 w-full">
                <Stat value={stored?.xp ?? 0} label="XP" />
                <Stat value={stored?.streak ?? 0} label="Ngày streak" />
                <Stat value={`${user?.learnedRoots ?? 0}/${user?.totalRoots ?? 0}`} label="Gốc đã học" />
              </div>
            </div>

            {/* Tiến độ */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-base text-neutral-800">Tiến độ học</span>
                <span className="font-sans font-semibold text-base text-primary-700">{pct}%</span>
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-progress-teal"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 font-sans text-sm text-neutral-400">
                Đã học {user?.learnedRoots ?? 0}/{user?.totalRoots ?? 0} gốc từ
              </p>
            </div>

            {/* Nâng cấp Premium */}
            <Link
              href="/premium"
              className="flex items-center gap-4 rounded-2xl p-5 text-white shadow-soft"
              style={{ backgroundImage: 'linear-gradient(135deg, #12BFA6 0%, #00958B 100%)' }}
            >
              <span className="size-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Gem size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-sans font-bold text-lg">Nâng cấp Premium</span>
                <span className="block font-sans text-sm text-white/85">
                  Mở khoá trọn bộ gốc từ, học offline, 3 thiết bị
                </span>
              </span>
              <ChevronRight size={22} className="text-white/80" />
            </Link>

            {/* Menu */}
            <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
              {MENU.map(({ label, Icon, href }) => (
                <Link key={label} href={href} className="flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors">
                  <Icon size={20} className="text-neutral-500 shrink-0" strokeWidth={2} />
                  <span className="flex-1 font-sans text-base text-neutral-800">{label}</span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </Link>
              ))}
            </div>
            </div>

            {/* Cột phải: lịch sử luyện tập */}
            <div className="flex flex-col gap-4">
              <h2 className="font-sans font-bold text-lg text-neutral-900">Lịch sử luyện tập</h2>
              <HistoryTab history={history} error={historyErr} />
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

/** Danh sách lịch sử các phiên đã hoàn thành. */
function HistoryTab({
  history,
  error,
}: {
  history: PracticeHistoryItem[] | null;
  error: string | null;
}) {
  if (error) return <ErrorState detail={`API: ${error}`} />;
  if (!history)
    return <p className="py-12 text-center font-sans text-sm text-neutral-400">Đang tải…</p>;
  if (history.length === 0)
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-soft py-16 text-center">
        <p className="font-sans font-semibold text-lg text-neutral-800">Chưa có lịch sử luyện tập</p>
        <p className="mt-1 font-sans text-sm text-neutral-500">
          Hoàn thành một buổi luyện tập để xem lại tại đây.
        </p>
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      {history.map((h) => (
        <HistoryRow key={h.id} item={h} />
      ))}
    </div>
  );
}

function HistoryRow({ item }: { item: PracticeHistoryItem }) {
  const title = item.rootHz
    ? `Gốc ${item.rootHz}${item.rootHv ? ` · ${item.rootHv}` : ''}`
    : item.topicTitle ?? 'Phiên luyện tập';
  const when = new Date(item.completedAt ?? item.createdAt);
  const dateStr = when.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="size-12 shrink-0 rounded-xl bg-primary-100 flex items-center justify-center">
        {item.rootHz ? (
          <span className="font-han font-bold text-2xl text-primary-700" lang="zh">{item.rootHz}</span>
        ) : (
          <span className="font-sans font-bold text-lg text-primary-700">
            {(item.topicTitle ?? 'P').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-base text-neutral-900 truncate">{title}</p>
        <p className="mt-0.5 font-sans text-sm text-neutral-500">
          Đúng {item.correct}/{item.total} · {dateStr}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-success/10 text-success font-sans font-bold text-sm px-3 py-1">
        +{item.xpEarned} XP
      </span>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200 py-5 flex flex-col items-center gap-1">
      <span className="font-sans font-bold text-2xl text-neutral-900">{value}</span>
      <span className="font-sans text-sm text-neutral-500 text-center leading-tight">{label}</span>
    </div>
  );
}
