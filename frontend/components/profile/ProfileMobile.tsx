'use client';

/** Màn Cá nhân — MOBILE (<md). 2 tab: Hiện tại · Lịch sử luyện tập. Bottom tab dùng lại của Home. */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gem, User, ChevronRight, Bell, Globe, HelpCircle, LogOut } from 'lucide-react';
import type { HomeData, PracticeHistoryItem } from '@/lib/types';
import { BottomTab } from '@/components/home/HomeMobile';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { clearSession } from '@/lib/session';

const MENU = [
  { label: 'Thông tin tài khoản', Icon: User, href: '#' },
  { label: 'Ngôn ngữ', Icon: Globe, href: '#' },
  { label: 'Thông báo', Icon: Bell, href: '#' },
  { label: 'Trợ giúp & phản hồi', Icon: HelpCircle, href: '#' },
];

export default function ProfileMobile({
  data,
  error,
}: {
  data: HomeData | null;
  error: string | null;
}) {
  const router = useRouter();
  const user = data?.user;
  const pct = user?.totalRoots ? Math.round((user.learnedRoots / user.totalRoots) * 100) : 0;

  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<PracticeHistoryItem[] | null>(null);
  const [historyErr, setHistoryErr] = useState<string | null>(null);
  useEffect(() => {
    if (tab !== 'history' || history || historyErr) return;
    api.practiceHistory().then(setHistory).catch((e) => setHistoryErr((e as Error).message));
  }, [tab, history, historyErr]);

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="absolute inset-0 z-10 overflow-y-auto px-4 pt-8 pb-28">
        {error && <p className="mb-3 text-center text-danger text-sm">Lỗi: {error}</p>}

        <TabBar tab={tab} onTab={setTab} />

        {tab === 'current' && (
          <div className="mt-4">
            {/* Header hồ sơ */}
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                <User size={30} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="font-sans font-bold text-lg text-neutral-900 truncate">{user?.name ?? 'Học viên'}</p>
                <p className="font-sans text-sm text-neutral-500">Level {user?.level ?? 1}</p>
              </div>
            </div>

            {/* Tiến độ */}
            <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-sm text-neutral-800">Tiến độ học</span>
                <span className="font-sans text-sm text-primary-700">{pct}%</span>
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#00b2a5]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 font-sans text-xs text-neutral-400">
                Đã học {user?.learnedRoots ?? 0}/{user?.totalRoots ?? 0} gốc từ
              </p>
            </div>

            {/* Nâng cấp Premium */}
            <Link
              href="/premium"
              className="mt-4 flex items-center gap-3 rounded-2xl p-4 text-white"
              style={{ backgroundImage: 'linear-gradient(135deg, #12BFA6 0%, #00958B 100%)' }}
            >
              <span className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Gem size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-sans font-bold text-base">Nâng cấp Premium</span>
                <span className="block font-sans text-xs text-white/85">Mở khoá trọn bộ gốc từ, học offline</span>
              </span>
              <ChevronRight size={20} className="text-white/80" />
            </Link>

            {/* Menu */}
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
              {MENU.map(({ label, Icon, href }) => (
                <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3.5">
                  <Icon size={20} className="text-neutral-500 shrink-0" strokeWidth={2} />
                  <span className="flex-1 font-sans text-[0.9375rem] text-neutral-800">{label}</span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3.5 font-sans font-semibold text-sm text-danger"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div className="mt-4">
            <HistoryList history={history} error={historyErr} />
          </div>
        )}
      </div>

      <BottomTab active="/profile" />
    </div>
  );
}

/** Thanh chuyển tab. */
function TabBar({
  tab,
  onTab,
}: {
  tab: 'current' | 'history';
  onTab: (t: 'current' | 'history') => void;
}) {
  const tabs = [
    { id: 'current', label: 'Thông tin' },
    { id: 'history', label: 'Lịch sử' },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-full border border-neutral-200 bg-white p-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTab(t.id)}
          className={cn(
            'h-10 rounded-full font-sans font-semibold text-sm transition-colors',
            tab === t.id ? 'bg-primary-100 text-primary-700' : 'text-neutral-500',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function HistoryList({
  history,
  error,
}: {
  history: PracticeHistoryItem[] | null;
  error: string | null;
}) {
  if (error) return <p className="py-10 text-center text-danger text-sm">Lỗi: {error}</p>;
  if (!history) return <p className="py-10 text-center text-neutral-400 text-sm">Đang tải…</p>;
  if (history.length === 0)
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white py-12 text-center">
        <p className="font-sans font-semibold text-base text-neutral-800">Chưa có lịch sử</p>
        <p className="mt-1 font-sans text-sm text-neutral-500">Hoàn thành một buổi luyện tập để xem lại.</p>
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
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
      <div className="size-11 shrink-0 rounded-xl bg-primary-100 flex items-center justify-center">
        {item.rootHz ? (
          <span className="font-han font-bold text-xl text-primary-700" lang="zh">{item.rootHz}</span>
        ) : (
          <span className="font-sans font-bold text-base text-primary-700">
            {(item.topicTitle ?? 'P').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-[0.9375rem] text-neutral-900 truncate">{title}</p>
        <p className="mt-0.5 font-sans text-xs text-neutral-500">
          Đúng {item.correct}/{item.total} · {dateStr}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-success/10 text-success font-sans font-bold text-xs px-2.5 py-1">
        +{item.xpEarned} XP
      </span>
    </div>
  );
}
