'use client';

/**
 * App shell web — sidebar cố định 272px (theo Figma Desktop-3) + vùng nội dung.
 * Sidebar: logo migii, nav item (icon + label, item active highlight), khối "Get Pro" ở đáy.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Network, Layers, Dumbbell, Gem, User } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/dashboard', label: 'Trang chủ', icon: Home },
  { href: '/decks/people', label: 'Họ từ', icon: Network },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/practice', label: 'Luyện tập', icon: Dumbbell },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[272px] flex-col bg-white border-r border-neutral-200 p-[20px]">
        <div className="text-[26px] font-extrabold text-primary px-[8px] py-[4px]">migii</div>

        <nav className="mt-[24px] flex flex-col gap-[4px]">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-[12px] h-[56px] px-[16px] rounded-[16px] font-medium transition-colors',
                  active ? 'bg-primary-100 text-primary-700' : 'text-neutral-700 hover:bg-neutral-100',
                )}
              >
                <Icon size={22} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
          <Link href="/profile" className="flex items-center gap-[12px] h-[56px] px-[16px] rounded-[16px] font-medium text-neutral-700 hover:bg-neutral-100">
            <User size={22} strokeWidth={2} />
            Hồ sơ
          </Link>
        </nav>

        {/* Get Pro CTA */}
        <div className="mt-auto rounded-[20px] bg-gradient-to-br from-primary-300 to-primary p-[16px] text-white">
          <div className="flex items-center gap-[8px] font-semibold">
            <Gem size={18} /> Nâng cấp Pro
          </div>
          <p className="mt-[6px] text-[13px] leading-[18px] text-white/90">
            Mở khoá tất cả chủ đề và gốc từ HSK.
          </p>
          <button className="mt-[12px] w-full h-[40px] rounded-full bg-white text-primary-700 font-semibold text-[14px]">
            Nâng cấp ngay
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-[272px] p-6 md:p-8">{children}</main>
    </div>
  );
}
