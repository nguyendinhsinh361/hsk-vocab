'use client';

/**
 * ROUTE /onboarding/level — "Chọn level" (bước onboarding CHỈ mobile, Figma Screen 5).
 * Nền full-bleed, nội dung căn giữa cột phone. Desktop redirect /onboarding.
 */

import { useState } from 'react';
import Link from 'next/link';
import { DesktopRedirect } from '@/components/DesktopRedirect';
import { PhoneFrame } from '@/components/mobile/PhoneFrame';
import { OnboardingBg } from '@/components/mobile/WordTree';
import { ProgressPill } from '@/components/mobile/ProgressPill';
import { TopNav } from '@/components/mobile/TopNav';
import { cn } from '@/lib/cn';

const LEVELS = [
  { id: 'HSK1', label: 'HSK 1', icon: 'Seed', available: true },
  { id: 'HSK2', label: 'HSK 2', icon: 'Sprout', available: true },
  { id: 'HSK3', label: 'HSK 3', icon: 'Sapling', available: true },
  { id: 'HSK4', label: 'HSK 4', icon: 'Bud', available: false },
  { id: 'HSK5', label: 'HSK 5', icon: 'Bloom', available: false },
  { id: 'HSK6', label: 'HSK 6', icon: 'Tree', available: false },
];

export default function ChooseLevelScreen() {
  const [selected, setSelected] = useState('HSK1');
  return (
    <>
      <DesktopRedirect to="/onboarding" />
      <PhoneFrame bg={<OnboardingBg />}>
        <TopNav backHref="/onboarding/example" />
        <div className="absolute left-[16px] top-[64px] z-20">
          <ProgressPill fillPercent={75} />
        </div>
        <div className="absolute left-[16px] top-[100px] right-[16px] flex flex-col gap-[6px] z-10">
          <h1 className="font-sans font-bold text-[24px] leading-[30px] tracking-[-0.15px] text-neutral-900">Chọn level</h1>
          <p className="font-sans font-medium text-[16px] leading-[24px] tracking-[-0.18px] text-neutral-500">Bắt đầu hành trình bằng level phù hợp với bạn!</p>
        </div>
        <div className="no-scrollbar absolute left-[16px] right-[16px] top-[188px] bottom-[100px] overflow-y-auto flex flex-col gap-[12px] z-10">
          {LEVELS.map((lv) => {
            const isSel = selected === lv.id;
            return (
              <button
                key={lv.id}
                disabled={!lv.available}
                onClick={() => setSelected(lv.id)}
                className={cn(
                  'flex items-center gap-[12px] rounded-[20px] border bg-white p-[16px] text-left transition-colors border-neutral-200',
                  isSel && 'border-[#00b2a5] ring-2 ring-[#00b2a5]/25',
                  !lv.available && 'opacity-60',
                )}
              >
                <img src={`/img/svg/${lv.icon}.svg`} alt="" className="w-[36px] h-[36px] object-contain shrink-0" />
                <div className="flex-1 font-sans font-semibold text-[16px] text-neutral-800">{lv.label}</div>
                {lv.available ? (
                  <span className={cn('size-[22px] rounded-full border-2 flex items-center justify-center shrink-0', isSel ? 'border-[#00b2a5]' : 'border-neutral-300')}>
                    {isSel && <span className="size-[12px] rounded-full bg-[#00b2a5]" />}
                  </span>
                ) : (
                  <img src="/img/svg/Comming-Soon.svg" alt="Coming soon" className="shrink-0 h-[28px] w-auto" />
                )}
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 w-full px-[16px] pt-[12px] pb-[24px] flex justify-center z-20 bg-gradient-to-t from-white via-white/90 to-transparent">
          <Link href="/onboarding" className="w-full max-w-[343px] h-[48px] bg-[#00b2a5] border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-sans font-semibold text-[16px] text-white">
            Tiếp tục
          </Link>
        </div>
      </PhoneFrame>
    </>
  );
}
