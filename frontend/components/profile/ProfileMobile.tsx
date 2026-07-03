'use client';

/** Màn Cá nhân — MOBILE (<md). Header hồ sơ + tiến độ + nâng cấp + menu. Bottom tab dùng lại của Home. */

import Link from 'next/link';
import { Gem, User, ChevronRight, Bell, Globe, HelpCircle, LogOut } from 'lucide-react';
import type { HomeData } from '@/lib/types';
import { BottomTab } from '@/components/home/HomeMobile';

const MENU = [
  { label: 'Thông tin tài khoản', Icon: User, href: '#' },
  { label: 'Ngôn ngữ', Icon: Globe, href: '#' },
  { label: 'Thông báo', Icon: Bell, href: '#' },
  { label: 'Trợ giúp & phản hồi', Icon: HelpCircle, href: '#' },
];

export default function ProfileMobile({ data, error }: { data: HomeData | null; error: string | null }) {
  const user = data?.user;
  const pct = user?.totalRoots ? Math.round((user.learnedRoots / user.totalRoots) * 100) : 0;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-white">
      <div className="absolute inset-0 overflow-y-auto px-4 pt-8 pb-28">
        <h1 className="mb-4 font-sans font-bold text-2xl text-neutral-900">Cá nhân</h1>
        {error && <p className="text-center text-danger text-sm">Lỗi: {error}</p>}

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
        <div className="mt-5 rounded-2xl border border-neutral-200 p-4">
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
        <div className="mt-4 rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-3.5 font-sans font-semibold text-sm text-danger"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>

      <BottomTab active="/profile" />
    </div>
  );
}
