'use client';

/** Màn Nâng cấp Premium — DESKTOP (≥md). Sidebar dùng lại + nội dung căn giữa (giống màn Hồ sơ). */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, WifiOff, BookOpen, MonitorSmartphone } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
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

export default function PremiumWeb() {
  const router = useRouter();
  const [selected, setSelected] = useState('1y');

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="relative z-10 flex h-full w-full">
      <Sidebar active="/premium" />
      <main className="flex-1 h-full overflow-y-auto flex items-center justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-[60rem]">
          <div className="rounded-3xl border border-neutral-200 bg-white shadow-soft overflow-hidden flex flex-col lg:flex-row">
            {/* Hero (trái) */}
            <div className="lg:w-[42%] p-8 lg:p-10 flex flex-col justify-center gap-6 bg-primary-100/40 border-b lg:border-b-0 lg:border-r border-neutral-200">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#F5851F] px-4 py-1.5 font-sans font-bold text-sm text-white shadow-[0_0.375rem_0.875rem_-0.25rem_rgba(245,133,31,0.6)]">
                  Nâng cấp Premium
                </span>
                <h2 className="mt-4 font-sans font-bold text-[1.875rem] leading-tight text-neutral-900">
                  Học không giới hạn cùng Premium
                </h2>
                <p className="mt-2 font-sans text-base text-neutral-600">
                  Mở khoá toàn bộ tính năng để chinh phục HSK nhanh hơn.
                </p>
              </div>
              <ul className="flex flex-col gap-4">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-neutral-800">
                    <span className="size-10 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span className="font-sans font-semibold text-base">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chọn gói (phải) */}
            <div className="flex-1 p-8 lg:p-10 flex flex-col gap-4">
              <p className="font-sans font-bold text-sm tracking-wide text-primary-700">PREMIUM</p>
              <p className="font-sans font-bold text-xl text-neutral-800">Chọn gói phù hợp</p>

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

              <p className="mt-1 font-sans text-sm text-neutral-400">Một chút content gì đó nếu có…</p>

              <button
                type="button"
                onClick={() => router.push(`/premium/transfer?plan=${selected}`)}
                className="mt-2 h-14 rounded-full bg-primary border-b-4 border-[#008f85] text-white flex items-center justify-center font-sans font-semibold text-lg active:translate-y-[0.0625rem] transition"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      </main>
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
        'relative w-full rounded-2xl border-2 px-5 py-4 text-left transition-colors',
        active ? 'border-primary bg-primary-100/70' : 'border-neutral-200 bg-white hover:border-primary-300',
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
          <p className="font-sans font-bold text-lg text-neutral-800">{plan.label}</p>
          <p className="mt-0.5 font-sans text-sm text-neutral-400">{plan.perMonth}</p>
        </div>
        <div className="text-right">
          <p className="font-sans font-bold text-lg text-neutral-800">{plan.price}</p>
          <p className="mt-0.5 font-sans text-sm text-neutral-400 line-through">{plan.original}</p>
        </div>
      </div>
    </button>
  );
}
