'use client';

/**
 * ROUTE /onboarding/summary — "Tóm tắt bài học" (bước onboarding CHỈ mobile, Figma Pre-Test).
 * Nền full-bleed, nội dung căn giữa cột phone. Desktop redirect /onboarding.
 */

import Link from 'next/link';
import { DesktopRedirect } from '@/components/DesktopRedirect';
import { PhoneFrame } from '@/components/mobile/PhoneFrame';
import { TopNav } from '@/components/mobile/TopNav';
import { WordTree, OnboardingTreeBg } from '@/components/mobile/WordTree';

export default function SummaryScreen() {
  return (
    <>
      <DesktopRedirect to="/onboarding" />
      <PhoneFrame bg={<OnboardingTreeBg shiftY={-130} />}>
        <WordTree shiftY={-130} />
        <TopNav backHref="/onboarding" topClass="top-[12px]" />
        <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[28px] px-[24px] pt-[24px] pb-[28px] z-20 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.25)] flex flex-col items-center gap-[6px]">
          <h2 className="font-sans font-bold text-[18px] text-neutral-800">Tóm tắt bài học</h2>
          <p className="font-sans font-medium text-[14px] text-neutral-500 text-center">
            Thêm <span className="font-han text-neutral-800" lang="zh">人</span> vào bất kỳ khái niệm nào
          </p>
          <p className="font-sans font-medium text-[14px] text-neutral-500 text-center">Để cho ra được từ có nghĩa</p>
          <Link href="/dashboard" className="mt-[12px] w-full max-w-[327px] h-[48px] bg-[#00b2a5] border-b-4 border-[#008f85] rounded-full flex items-center justify-center gap-[8px] font-sans font-semibold text-[16px] text-white">
            Chiến luôn đi nào
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </PhoneFrame>
    </>
  );
}
