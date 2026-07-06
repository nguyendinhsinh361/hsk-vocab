'use client';

/**
 * Sidebar desktop dùng chung cho Home / Premium / Hồ sơ.
 * (Tách khỏi HomeWeb — component layout không sống trong file màn hình.)
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { clearSession, getStoredUser, isLoggedIn } from '@/lib/session';

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
        <div className="rounded-xl p-4 text-white bg-card-teal">
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

/**
 * Thẻ thông tin user + nút đăng xuất (đáy sidebar).
 * Hiện hồ sơ cache (localStorage) ngay, rồi fetch /users/me để cập nhật
 * XP/level mới nhất — tránh hiển thị dữ liệu stale sau khi luyện tập.
 */
function UserPanel() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    if (isLoggedIn()) {
      api
        .me()
        .then(setUser)
        .catch(() => {
          /* offline/lỗi → giữ bản cache */
        });
    }
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
