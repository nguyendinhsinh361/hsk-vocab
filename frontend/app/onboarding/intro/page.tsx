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
        <Link href="/dashboard" className="absolute right-[16px] top-[16px] h-[40px] flex items-center z-20 font-sans font-semibold text-[12px] text-neutral-900">
          Skip
        </Link>
        <div className="absolute left-[16px] top-[64px] z-20">
          <ProgressPill fillPercent={25} />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[100px] w-[343px] max-w-[90%] text-center flex flex-col gap-[8px] z-10">
          <h1 className="font-sans font-bold text-[24px] leading-[30px] tracking-[-0.15px] text-[#008f85]">Biết 1 từ gốc</h1>
          <p className="font-sans font-medium text-[16px] leading-[24px] tracking-[-0.18px] text-neutral-900">Đoán được hàng chục từ mới</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full px-[16px] pb-[24px] flex justify-center z-20">
          <Link href="/onboarding/example" className="w-full max-w-[343px] h-[48px] bg-[#00b2a5] border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-sans font-semibold text-[16px] text-white">
            Tiếp tục
          </Link>
        </div>
      </PhoneFrame>
    </>
  );
}
