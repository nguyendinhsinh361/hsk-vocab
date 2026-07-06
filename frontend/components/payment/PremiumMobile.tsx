'use client';

/** Màn Nâng cấp — MOBILE (<md). Cùng style Home/Cá nhân: nền brand + card trắng + bottom tab. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, WifiOff, BookOpen, MonitorSmartphone } from 'lucide-react';
import { BottomTab } from '@/components/home/HomeMobile';
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

export default function PremiumMobile() {
  const router = useRouter();
  const [selected, setSelected] = useState('1y');

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-white">
      <BrandBackdrop />
      <div className="absolute inset-0 z-10 overflow-y-auto px-4 pt-8 pb-28">
        <header className="mb-4">
          <span className="inline-flex items-center rounded-full bg-[#F5851F] px-3.5 py-1 font-sans font-bold text-sm text-white shadow-[0_0.375rem_0.875rem_-0.25rem_rgba(245,133,31,0.6)]">
            Nâng cấp Premium
          </span>
          <h1 className="mt-3 font-sans font-bold text-2xl text-neutral-900">
            Học không giới hạn cùng Premium
          </h1>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            Mở khoá toàn bộ tính năng để chinh phục HSK nhanh hơn.
          </p>
        </header>

        {/* Card tính năng */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col gap-3.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="size-9 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="flex-1 font-sans font-medium text-[0.9375rem] text-neutral-800">{label}</span>
              <Check size={18} className="text-primary shrink-0" strokeWidth={3} />
            </div>
          ))}
        </div>

        {/* Card chọn gói + CTA */}
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="font-sans font-bold text-sm tracking-wide text-primary-700">PREMIUM</p>
          <p className="mt-1 font-sans font-bold text-lg text-neutral-800">Chọn gói phù hợp</p>

          <div className="mt-3 flex flex-col gap-3">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                active={selected === plan.id}
                onSelect={() => setSelected(plan.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push(`/premium/transfer?plan=${selected}`)}
            className="mt-4 w-full h-12 rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] text-white flex items-center justify-center font-sans font-semibold text-base active:translate-y-[0.0625rem]"
          >
            Tiếp tục
          </button>
        </div>
      </div>

      <BottomTab active="/premium" />
    </div>
  );
}

function PlanCard({ plan, active, onSelect }: { plan: Plan; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border-2 px-4 py-3.5 text-left transition-colors',
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
          <p className="font-sans font-bold text-[0.9375rem] text-neutral-800">{plan.label}</p>
          <p className="mt-0.5 font-sans text-xs text-neutral-400">{plan.perMonth}</p>
        </div>
        <div className="text-right">
          <p className="font-sans font-bold text-[0.9375rem] text-neutral-800">{plan.price}</p>
          <p className="mt-0.5 font-sans text-xs text-neutral-400 line-through">{plan.original}</p>
        </div>
      </div>
    </button>
  );
}
