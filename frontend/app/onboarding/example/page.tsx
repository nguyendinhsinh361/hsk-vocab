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
        <TopNav backHref="/onboarding/intro" skipHref="/dashboard" />
        <div className="absolute left-[16px] top-[64px] z-20">
          <ProgressPill fillPercent={50} />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[100px] w-[343px] max-w-[90%] text-center flex flex-col gap-[8px] z-10">
          <h1 className="font-sans font-bold text-[24px] leading-[30px] tracking-[-0.15px] text-[#008f85]">Tiếng Trung ở mọi nơi</h1>
          <p className="font-sans font-medium text-[16px] leading-[24px] tracking-[-0.18px] text-neutral-900">Thực ra người Việt đã biết sẵn tiếng Trung</p>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[190px] w-[311px] max-w-[90%] bg-white/70 backdrop-blur-sm border border-white rounded-[24px] p-[20px] z-10 flex flex-col items-center gap-[16px] shadow-soft">
          <span className="font-sans font-semibold text-[16px] text-neutral-800">Thử xem qua nhé</span>
          <div className="flex items-center gap-[12px]">
            <CharBox char="电" label="Điện" />
            <span className="font-sans font-bold text-[24px] text-neutral-400">+</span>
            <CharBox char="话" label="Thoại" />
          </div>
          <span className="font-sans font-bold text-[20px] text-neutral-400">=</span>
          <div className="w-full bg-white rounded-[16px] border border-neutral-200 py-[16px] flex items-center justify-center shadow-soft">
            <span className="font-sans font-bold text-[28px] text-[#00b2a5]">Điện thoại</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full px-[16px] pb-[24px] flex justify-center z-20">
          <Link href="/onboarding/level" className="w-full max-w-[343px] h-[48px] bg-[#00b2a5] border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-sans font-semibold text-[16px] text-white">
            Tiếp tục
          </Link>
        </div>
      </PhoneFrame>
    </>
  );
}

function CharBox({ char, label }: { char: string; label: string }) {
  return (
    <div className="w-[96px] bg-white rounded-[16px] border border-neutral-200 py-[12px] flex flex-col items-center gap-[4px] shadow-soft">
      <span className="font-han text-[40px] leading-[44px] text-neutral-900" lang="zh">{char}</span>
      <span className="font-sans font-medium text-[14px] text-neutral-500">{label}</span>
    </div>
  );
}
