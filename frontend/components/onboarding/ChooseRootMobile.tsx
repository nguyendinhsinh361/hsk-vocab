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

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-[26.25rem] mx-auto px-4 pt-10 pb-6">
        {/* progress */}
        <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full w-full rounded-full" style={{ backgroundImage: 'linear-gradient(-7deg, #12D18E 0%, #71E3BB 100%)' }} />
        </div>

        {/* title */}
        <div className="mt-6 text-center flex flex-col gap-1.5">
          <h1 className="font-bold text-2xl leading-[1.875rem] tracking-[-0.0094rem] text-[#008f85]">Nhìn nè!</h1>
          <p className="font-medium text-base leading-6 tracking-[-0.0112rem] text-neutral-900">
            Chọn 1 gốc từ để bắt đầu hành trình
          </p>
        </div>

        {/* lưới 2×2 */}
        <div className="flex-1 flex items-center">
          <div className="w-full flex flex-col gap-4">
            <div className="flex gap-4">
              <GridCard r={ROOTS[0]} selected={selected === 0} onSelect={() => setSelected(0)} />
              <GridCard r={ROOTS[1]} selected={selected === 1} onSelect={() => setSelected(1)} />
            </div>
            <div className="flex gap-4">
              <GridCard r={ROOTS[2]} selected={selected === 2} onSelect={() => setSelected(2)} />
              <GridCard r={ROOTS[3]} selected={selected === 3} onSelect={() => setSelected(3)} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={start}
            className="w-full h-12 bg-primary border-b-4 border-[#008f85] rounded-full flex items-center justify-center font-semibold text-base text-white"
          >
            Bắt đầu
          </button>
          <button onClick={start} className="h-10 font-semibold text-base text-neutral-700">
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
        'flex-1 min-w-0 flex flex-col items-center justify-center pt-3 pb-5 px-3 border border-b-4',
        'rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-bl-[2.5rem] rounded-br-[2.5rem]',
        selected ? 'bg-primary-300 border-primary-800' : 'bg-white border-neutral-300',
      )}
    >
      <span className={cn('font-han font-semibold text-[2.5rem] leading-[3rem] tracking-[-0.0187rem]', selected ? 'text-white' : 'text-neutral-900')} lang="zh">
        {r.char}
      </span>
      <span className={cn('font-medium text-sm leading-5', selected ? 'text-primary-800' : 'text-blue-700')}>{r.pinyin}</span>
      <span className={cn('font-semibold text-sm leading-5', selected ? 'text-white' : 'text-neutral-500')}>{r.meaning}</span>
    </button>
  );
}
