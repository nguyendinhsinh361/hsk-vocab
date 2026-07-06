'use client';

/**
 * ROUTE /onboarding/intro — "Biết 1 từ gốc" (bước onboarding CHỈ mobile, Figma Screen 1).
 * Nền full-bleed, nội dung căn giữa cột phone. Desktop ≥lg redirect /onboarding.
 */

import Link from 'next/link';
import { DesktopRedirect } from '@/components/DesktopRedirect';
import { PhoneFrame } from '@/components/mobile/PhoneFrame';
import { ProgressPill } from '@/components/mobile/ProgressPill';
import { WordTree, OnboardingTreeBg } from '@/components/mobile/WordTree';

export default function IntroScreen() {
  return (
    <>
      <DesktopRedirect to="/onboarding" />
      <PhoneFrame bg={<OnboardingTreeBg />}>
        <WordTree />
        <Link href="/home" className="absolute right-4 top-4 h-10 flex items-center z-20 font-sans font-semibold text-xs text-neutral-900">
          Skip
        </Link>
        <div className="absolute left-4 top-16 z-20">
          <ProgressPill fillPercent={25} />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[6.25rem] w-[21.4375rem] max-w-[90%] text-center flex flex-col gap-2 z-10">
          <h1 className="font-sans font-bold text-2xl leading-[1.875rem] tracking-[-0.0094rem] text-[#008f85]">Biết 1 từ gốc</h1>
          <p className="font-sans font-medium text-base leading-6 tracking-[-0.0112rem] text-neutral-900">Đoán được hàng chục từ mới</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full px-4 pb-6 flex justify-center z-20">
          <Link href="/onboarding/example" className="w-full max-w-[21.4375rem] h-12 bg-primary border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-sans font-semibold text-base text-white">
            Tiếp tục
          </Link>
        </div>
      </PhoneFrame>
    </>
  );
}
