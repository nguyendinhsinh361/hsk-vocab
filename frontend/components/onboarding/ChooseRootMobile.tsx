'use client';

/**
 * UI MOBILE (<lg) cho route /onboarding — "Nhìn nè!" lưới 2×2 (Figma flow mobile, Screen 4).
 * Full-screen (không khung điện thoại giả). Dùng trong page responsive.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

const ROOTS = [
  { deckId: 'people', char: '人', pinyin: 'rén', meaning: 'nhân - người' },
  { deckId: 'family', char: '家', pinyin: 'jiā', meaning: 'nhà - gia đình' },
  { deckId: 'study', char: '学', pinyin: 'xué', meaning: 'học' },
  { deckId: 'food', char: '吃', pinyin: 'chī', meaning: 'ăn' },
];

export default function ChooseRootMobile() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const start = () => router.push('/onboarding/summary');

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Nền phủ kín cả màn */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #5ecec6 73.488%)' }} />
      <img
        src="/img/tablet-bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
      />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-[420px] mx-auto px-[16px] pt-[40px] pb-[24px]">
        {/* progress */}
        <div className="h-[12px] w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full w-full rounded-full" style={{ backgroundImage: 'linear-gradient(-7deg, #12D18E 0%, #71E3BB 100%)' }} />
        </div>

        {/* title */}
        <div className="mt-[24px] text-center flex flex-col gap-[6px]">
          <h1 className="font-bold text-[24px] leading-[30px] tracking-[-0.15px] text-[#008f85]">Nhìn nè!</h1>
          <p className="font-medium text-[16px] leading-[24px] tracking-[-0.18px] text-neutral-900">
            Chọn 1 gốc từ để bắt đầu hành trình
          </p>
        </div>

        {/* lưới 2×2 */}
        <div className="flex-1 flex items-center">
          <div className="w-full flex flex-col gap-[16px]">
            <div className="flex gap-[16px]">
              <GridCard r={ROOTS[0]} selected={selected === 0} onSelect={() => setSelected(0)} />
              <GridCard r={ROOTS[1]} selected={selected === 1} onSelect={() => setSelected(1)} />
            </div>
            <div className="flex gap-[16px]">
              <GridCard r={ROOTS[2]} selected={selected === 2} onSelect={() => setSelected(2)} />
              <GridCard r={ROOTS[3]} selected={selected === 3} onSelect={() => setSelected(3)} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-[12px]">
          <button
            onClick={start}
            className="w-full h-[48px] bg-[#00b2a5] border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-semibold text-[16px] text-white"
          >
            Bắt đầu
          </button>
          <button onClick={start} className="h-[40px] font-semibold text-[16px] text-neutral-700">
            Thử một gốc bất kỳ
          </button>
        </div>
      </div>
    </main>
  );
}

function GridCard({ r, selected, onSelect }: { r: (typeof ROOTS)[number]; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex-1 min-w-0 flex flex-col items-center justify-center pt-[12px] pb-[20px] px-[12px] border border-b-4',
        'rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[40px] rounded-br-[40px]',
        selected ? 'bg-[#5ecec6] border-[#00655e]' : 'bg-white border-neutral-300',
      )}
    >
      <span className={cn('font-han font-semibold text-[40px] leading-[48px] tracking-[-0.3px]', selected ? 'text-white' : 'text-neutral-900')} lang="zh">
        {r.char}
      </span>
      <span className={cn('font-medium text-[14px] leading-[20px]', selected ? 'text-[#00655e]' : 'text-[#1976d2]')}>{r.pinyin}</span>
      <span className={cn('font-semibold text-[14px] leading-[20px]', selected ? 'text-white' : 'text-neutral-500')}>{r.meaning}</span>
    </button>
  );
}
