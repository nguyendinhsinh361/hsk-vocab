'use client';

/**
 * ROUTE /onboarding/example — "Tiếng Trung ở mọi nơi" (bước onboarding CHỈ mobile, Figma Screen 2).
 * Nền full-bleed, nội dung căn giữa cột phone. Desktop redirect /onboarding.
 */

import Link from 'next/link';
import { DesktopRedirect } from '@/components/DesktopRedirect';
import { PhoneFrame } from '@/components/mobile/PhoneFrame';
import { OnboardingBg } from '@/components/mobile/WordTree';
import { ProgressPill } from '@/components/mobile/ProgressPill';
import { TopNav } from '@/components/mobile/TopNav';

export default function ExampleScreen() {
  return (
    <>
      <DesktopRedirect to="/onboarding" />
      <PhoneFrame bg={<OnboardingBg />}>
        <TopNav backHref="/onboarding/intro" skipHref="/home" />
        <div className="absolute left-4 top-16 z-20">
          <ProgressPill fillPercent={50} />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[6.25rem] w-[21.4375rem] max-w-[90%] text-center flex flex-col gap-2 z-10">
          <h1 className="font-sans font-bold text-2xl leading-[1.875rem] tracking-[-0.0094rem] text-[#008f85]">Tiếng Trung ở mọi nơi</h1>
          <p className="font-sans font-medium text-base leading-6 tracking-[-0.0112rem] text-neutral-900">Thực ra người Việt đã biết sẵn tiếng Trung</p>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[11.875rem] w-[19.4375rem] max-w-[90%] bg-white/70 backdrop-blur-sm border border-white rounded-2xl p-5 z-10 flex flex-col items-center gap-4 shadow-soft">
          <span className="font-sans font-semibold text-base text-neutral-800">Thử xem qua nhé</span>
          <div className="flex items-center gap-3">
            <CharBox char="电" label="Điện" />
            <span className="font-sans font-bold text-2xl text-neutral-400">+</span>
            <CharBox char="话" label="Thoại" />
          </div>
          <span className="font-sans font-bold text-xl text-neutral-400">=</span>
          <div className="w-full bg-white rounded-xl border border-neutral-200 py-4 flex items-center justify-center shadow-soft">
            <span className="font-sans font-bold text-[1.75rem] text-[#00b2a5]">Điện thoại</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full px-4 pb-6 flex justify-center z-20">
          <Link href="/onboarding/level" className="w-full max-w-[21.4375rem] h-12 bg-[#00b2a5] border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-sans font-semibold text-base text-white">
            Tiếp tục
          </Link>
        </div>
      </PhoneFrame>
    </>
  );
}

function CharBox({ char, label }: { char: string; label: string }) {
  return (
    <div className="w-24 bg-white rounded-xl border border-neutral-200 py-3 flex flex-col items-center gap-1 shadow-soft">
      <span className="font-han text-[2.5rem] leading-[2.75rem] text-neutral-900" lang="zh">{char}</span>
      <span className="font-sans font-medium text-sm text-neutral-500">{label}</span>
    </div>
  );
}
