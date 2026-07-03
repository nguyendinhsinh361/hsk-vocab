'use client';

/**
 * PaywallScreen — màn "Nâng cấp Premium" (chỉ mobile, khớp Figma Paywall).
 * Nền trời teal có coin 子 + mây; sheet trắng chứa list tính năng + 3 gói + CTA.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, WifiOff, BookOpen, MonitorSmartphone, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

type Plan = {
  id: string;
  label: string;
  price: string;
  perMonth: string;
  original: string;
  best?: boolean;
};

const PLANS: Plan[] = [
  { id: '1y', label: '1 năm', price: '629.000 đ', perMonth: '19.002đ/ tháng', original: '2.096.000 đ', best: true },
  { id: '6m', label: '6 tháng', price: '629.000 đ', perMonth: '19.002đ/ tháng', original: '2.096.000 đ' },
  { id: '3m', label: '3 tháng', price: '629.000 đ', perMonth: '19.002đ/ tháng', original: '2.096.000 đ' },
];

const FEATURES = [
  { icon: WifiOff, label: 'Sử dụng offline' },
  { icon: BookOpen, label: 'Mở khoá trọn bộ gốc từ' },
  { icon: MonitorSmartphone, label: 'Truy cập 3 thiết bị cùng lúc' },
];

export function PaywallScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('1y');

  return (
    <div className="relative flex min-h-0 flex-1 flex-col md:items-center md:justify-center md:p-8">
      {/* Nền brand PHỦ TOÀN MÀN (desktop/tablet): tablet-bg (<lg) · web-bg (lg+) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block lg:hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/tablet-bg.png)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/web-bg.png)' }}
      />

      {/* CARD nổi (desktop) / full-bleed (mobile) — bọc 2 cột để nội dung bật lên nền ảnh */}
      <div className="relative z-10 flex w-full min-h-0 flex-1 flex-col md:h-auto md:min-h-0 md:max-h-[calc(100dvh-4rem)] md:w-full md:max-w-[72rem] md:flex-none md:flex-row md:overflow-hidden md:rounded-[2rem] md:bg-white md:shadow-[0_1.5rem_3rem_-1rem_rgba(15,23,42,0.35)]">
        {/* Nút đóng — góc trên phải card */}
        <button
          type="button"
          onClick={() => router.push('/home')}
          aria-label="Đóng"
          className="absolute right-4 top-4 z-30 size-9 rounded-full bg-white/25 md:bg-neutral-100 backdrop-blur flex items-center justify-center text-white md:text-neutral-500 md:hover:bg-neutral-200 active:scale-95"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* PANEL TEAL — banner (mobile) / hero cột trái (desktop) */}
        <div className="relative z-10 shrink-0 h-[13.5rem] sm:h-[15.5rem] md:h-auto md:w-[42%] lg:w-[45%] overflow-hidden bg-primary-300 md:bg-transparent">
          {/* Mobile: nền trời vẽ tay */}
          <SkyBackground className="md:hidden" />

        {/* Hero — chỉ desktop, nội dung giới hạn bề rộng + căn giữa panel */}
        <div className="relative z-10 hidden h-full flex-col justify-center gap-7 px-8 py-12 lg:px-14 md:flex">
          <div className="w-full max-w-[30rem] mx-auto">
            <span className="inline-flex items-center rounded-full bg-[#F5851F] px-4 py-1.5 font-sans font-bold text-sm text-white shadow-[0_0.375rem_0.875rem_-0.25rem_rgba(245,133,31,0.6)]">
              Nâng cấp Premium
            </span>
            <h2 className="mt-5 font-sans font-bold text-[2.125rem] leading-[1.2] text-neutral-900">
              Học không giới hạn cùng Premium
            </h2>
            <p className="mt-3 font-sans text-neutral-700 text-lg leading-relaxed">
              Mở khoá toàn bộ tính năng để chinh phục HSK nhanh hơn.
            </p>
            <ul className="mt-8 flex flex-col gap-5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3.5 text-neutral-800">
                  <span className="size-11 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <span className="font-sans font-semibold text-base">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Đường ngăn cách dọc giữa 2 cột (desktop) */}
      <div aria-hidden className="hidden md:block w-px self-stretch my-10 bg-neutral-200" />

      {/* PANEL TRẮNG (mobile) / trong suốt trên nền ảnh (desktop) — nội dung + gói + CTA */}
      <div className="relative z-10 -mt-6 md:mt-0 flex min-h-0 flex-1 flex-col rounded-t-[1.75rem] md:rounded-none bg-white md:bg-transparent">
        {/* Badge — chỉ mobile (đè lên mép sheet) */}
        <div className="pointer-events-none absolute -top-4 left-1/2 z-20 -translate-x-1/2 md:hidden">
          <span className="inline-flex items-center rounded-full bg-[#F5851F] px-5 py-2 font-sans font-bold text-sm text-white shadow-[0_0.375rem_0.875rem_-0.25rem_rgba(245,133,31,0.6)]">
            Nâng cấp Premium
          </span>
        </div>

        {/* Vùng cuộn — nội dung giới hạn bề rộng + căn giữa panel */}
        <div className="min-h-0 flex-1 overflow-y-auto md:flex md:items-center">
          <div className="w-full max-w-[34rem] mx-auto flex flex-col gap-5 px-5 pt-9 pb-4 md:px-10 md:py-12">
            <p className="text-right md:text-left font-sans font-bold text-sm tracking-wide text-primary-700">
              PREMIUM
            </p>

            {/* List tính năng — chỉ mobile (desktop đã có ở hero) */}
            <ul className="flex flex-col gap-3.5 md:hidden">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <Icon size={20} className="text-primary-700 shrink-0" strokeWidth={2} />
                  <span className="flex-1 font-sans font-medium text-[0.9375rem] text-neutral-800">{label}</span>
                  <Check size={18} className="text-primary shrink-0" strokeWidth={3} />
                </li>
              ))}
            </ul>

            <p className="hidden md:block font-sans font-bold text-xl text-neutral-800">Chọn gói phù hợp</p>

            {/* Các gói */}
            <div className="mt-1 flex flex-col gap-3">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  active={selected === plan.id}
                  onSelect={() => setSelected(plan.id)}
                />
              ))}
            </div>

            <p className="mt-1 text-center md:text-left font-sans text-sm text-neutral-400">
              Một chút content gì đó nếu có…
            </p>
          </div>
        </div>

        {/* CTA dính đáy panel */}
        <div className="shrink-0 w-full border-t border-neutral-100 bg-white md:border-0 md:bg-transparent">
          <div className="w-full max-w-[34rem] mx-auto px-4 pb-6 pt-3 md:px-10 md:pb-12 flex justify-center">
            <button
              type="button"
              onClick={() => router.push(`/premium/transfer?plan=${selected}`)}
              className="w-full h-12 md:h-14 rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] text-white flex items-center justify-center font-sans font-semibold text-base md:text-lg active:translate-y-[0.0625rem]"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, active, onSelect }: { plan: Plan; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border-2 px-5 py-4 md:py-5 text-left transition-colors',
        active ? 'border-primary bg-primary-100/70' : 'border-neutral-200 bg-white',
      )}
    >
      {plan.best && (
        <span className="absolute -top-2.5 left-3 rounded-md bg-primary px-2 py-0.5 font-sans font-semibold text-[0.6875rem] text-white">
          Best choice
        </span>
      )}
      {active && (
        <span className="absolute -top-2.5 right-3 size-5 rounded-full bg-primary flex items-center justify-center text-white">
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-sans font-bold text-base md:text-lg text-neutral-800">{plan.label}</p>
          <p className="mt-0.5 font-sans text-sm text-neutral-400">{plan.perMonth}</p>
        </div>
        <div className="text-right">
          <p className="font-sans font-bold text-base md:text-lg text-neutral-800">{plan.price}</p>
          <p className="mt-0.5 font-sans text-sm text-neutral-400 line-through">{plan.original}</p>
        </div>
      </div>
    </button>
  );
}

/** Nền trời với coin 子 nổi + mây (SVG nhẹ, khớp Figma). */
function SkyBackground({ className }: { className?: string }) {
  const coins = [
    { x: '18%', y: '46%', size: 40, bg: '#2FA9E0' },
    { x: '52%', y: '18%', size: 30, bg: '#F6C445' },
    { x: '76%', y: '30%', size: 44, bg: '#F5851F' },
    { x: '24%', y: '74%', size: 34, bg: '#5EC9C0' },
    { x: '58%', y: '64%', size: 40, bg: '#F5851F' },
    { x: '84%', y: '70%', size: 34, bg: '#7C6BF0' },
  ];
  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ backgroundImage: 'linear-gradient(180deg,#7BD3CC 0%,#5EC9C0 100%)' }}
    >
      {/* mây */}
      <div className="absolute left-6 top-10 h-3 w-16 rounded-full bg-white/70" />
      <div className="absolute left-10 top-8 h-4 w-10 rounded-full bg-white/70" />
      <div className="absolute right-10 top-16 h-3 w-14 rounded-full bg-white/60" />
      <div className="absolute left-1/3 top-24 h-2.5 w-12 rounded-full bg-white/50" />
      {/* coin 子 */}
      {coins.map((c, i) => (
        <span
          key={i}
          className="absolute flex items-center justify-center rounded-full font-han font-bold text-white shadow-[0_0.25rem_0.5rem_rgba(0,0,0,0.12)]"
          style={{
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size,
            background: c.bg,
            fontSize: c.size * 0.5,
          }}
          lang="zh"
        >
          子
        </span>
      ))}
      {/* sao nhỏ */}
      <span className="absolute left-[12%] top-[24%] text-yellow-300 text-lg">★</span>
      <span className="absolute left-[46%] top-[52%] text-yellow-200 text-sm">★</span>
    </div>
  );
}
