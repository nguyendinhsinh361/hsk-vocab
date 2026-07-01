'use client';

/**
 * UI WEB (desktop ≥lg) cho route /onboarding — "Chọn 1 gốc từ" (Figma flow web).
 * Tiêu đề · cây mẫu (ảnh) · 3 thẻ chọn gốc · 2 nút. Dùng trong page responsive.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { WordTreeNode } from '@/lib/types';
import { cn } from '@/lib/cn';

const DECK_IDS = ['people', 'family', 'study'];

export default function ChooseRootWeb() {
  const router = useRouter();
  const [roots, setRoots] = useState<{ deckId: string; node: WordTreeNode }[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    Promise.all(DECK_IDS.map((id) => api.wordTree(id)))
      .then((trees) =>
        setRoots(trees.map((t, i) => ({ deckId: DECK_IDS[i], node: t[0] })).filter((r) => r.node)),
      )
      .catch(() => {});
  }, []);

  const example = roots[0]?.node;
  const start = (i = selected) => router.push(`/quiz/${roots[i]?.deckId ?? 'people'}`);

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col"
      style={{ backgroundImage: 'linear-gradient(180deg, #FFFFFF 50%, #5ECEC6 100%)' }}
    >
      <img
        src="/img/web-bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
      />

      <div className="relative z-10 flex-1 w-full max-w-[1240px] mx-auto flex flex-col items-center justify-center gap-[48px] xl:gap-[64px] py-[48px] px-6">
        <h1 className="text-center font-bold text-[28px] sm:text-[32px] leading-[1.2] tracking-[-0.2px] text-neutral-900 max-w-[680px]">
          Chọn 1 gốc từ để bắt đầu hành trình
        </h1>

        <div className="flex gap-[16px] items-end justify-center w-full">
          {example && <ExampleTree node={example} />}
          {roots.map((r, i) => (
            <RootOptionCard key={r.deckId} node={r.node} selected={selected === i} onSelect={() => setSelected(i)} />
          ))}
        </div>

        <div className="flex gap-[20px] items-center justify-center w-full max-w-[820px]">
          <button
            onClick={() => { const i = Math.floor(Math.random() * Math.max(roots.length, 1)); setSelected(i); start(i); }}
            className="flex-1 max-w-[400px] h-[54px] rounded-full bg-white border border-neutral-300 border-b-4 flex items-center justify-center font-semibold text-[15px] sm:text-[16px] tracking-[-0.18px] text-[#00b2a5] whitespace-nowrap px-3"
          >
            Chưa biết chọn gốc nào?
          </button>
          <button
            onClick={() => start()}
            className="flex-1 max-w-[400px] h-[54px] rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] flex items-center justify-center font-semibold text-[15px] sm:text-[16px] tracking-[-0.18px] text-white whitespace-nowrap px-3"
          >
            Làm bài ngay
          </button>
        </div>
      </div>
    </main>
  );
}

function RootCard({ node, variant }: { node: WordTreeNode; variant: 'teal' | 'white' }) {
  const teal = variant === 'teal';
  return (
    <div
      className={cn(
        'w-[167.5px] flex flex-col items-center justify-center pt-[12px] pb-[20px] px-[12px] border border-b-4',
        'rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[40px] rounded-br-[40px]',
        teal ? 'bg-[#5ecec6] border-[#00655e]' : 'bg-white border-neutral-300',
      )}
    >
      <span className={cn('font-han font-semibold text-[40px] leading-[48px] tracking-[-0.3px]', teal ? 'text-white' : 'text-neutral-900')} lang="zh">
        {node.character}
      </span>
      <span className={cn('font-medium text-[16px] leading-[24px] tracking-[-0.18px]', teal ? 'text-[#00655e]' : 'text-[14px] leading-[20px] text-[#1976d2]')}>
        {node.pinyin}
      </span>
      <span className={cn('font-semibold text-[14px] leading-[20px] tracking-[-0.16px]', teal ? 'text-white' : 'text-neutral-500')}>
        {node.meaning}
      </span>
    </div>
  );
}

function ExampleTree({ node }: { node: WordTreeNode }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="shrink-0 hidden xl:flex items-center h-[471px]">
      <div className="relative w-[287px] h-[447px]">
        {imgOk ? (
          <img src="/img/onboarding-tree.png" alt="" className="w-[287px] h-[447px] object-contain" onError={() => setImgOk(false)} />
        ) : (
          <CodedTree node={node} />
        )}
      </div>
    </div>
  );
}

function CodedTree({ node }: { node: WordTreeNode }) {
  const kids = node.children.slice(0, 4);
  const clouds = [
    { left: 24, top: 0 },
    { left: -6, top: 120 },
    { left: 158, top: 60 },
    { left: 132, top: 188 },
  ];
  return (
    <>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 287 447" fill="none">
        <path d="M143 330 C110 280 95 230 80 175" stroke="#9A6A3C" strokeWidth="3" fill="none" />
        <path d="M143 332 C120 290 90 250 70 200" stroke="#9A6A3C" strokeWidth="3" fill="none" />
        <path d="M150 330 C190 285 215 230 220 120" stroke="#9A6A3C" strokeWidth="3" fill="none" />
        <path d="M148 332 C170 305 185 270 190 240" stroke="#9A6A3C" strokeWidth="3" fill="none" />
      </svg>
      {kids.map((c, i) => (
        <LeafCloud key={c.id} char={c.character} meaning={c.meaning} style={{ left: clouds[i].left, top: clouds[i].top }} />
      ))}
      <div className="absolute left-[60px] top-[315px]">
        <RootCard node={node} variant="teal" />
      </div>
    </>
  );
}

function LeafCloud({ char, meaning, style }: { char: string; meaning?: string | null; style: React.CSSProperties }) {
  return (
    <div className="absolute w-[130px] h-[100px]" style={style}>
      <svg viewBox="0 0 130 100" className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <g fill="url(#leaf)">
          <circle cx="40" cy="40" r="30" />
          <circle cx="72" cy="34" r="26" />
          <circle cx="92" cy="56" r="26" />
          <circle cx="58" cy="62" r="30" />
          <circle cx="28" cy="60" r="22" />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white pt-[4px]">
        <span className="font-han font-semibold text-[20px] leading-[24px]" lang="zh">{char}</span>
        <span className="font-medium text-[14px] leading-[20px]">{meaning}</span>
      </div>
    </div>
  );
}

function RootOptionCard({ node, selected, onSelect }: { node: WordTreeNode; selected: boolean; onSelect: () => void }) {
  const ghostPos = [
    { left: 7, top: 147 },
    { left: 44, top: 18 },
    { left: 181, top: 84 },
    { left: 145, top: 192 },
  ];
  const kids = node.children.slice(0, 4);
  return (
    <button
      onClick={onSelect}
      className={cn(
        'h-[471px] rounded-[40px] border py-[12px] flex items-end justify-center transition-colors',
        selected ? 'border-[#00b2a5] ring-2 ring-[#00b2a5]/30' : 'border-neutral-200',
      )}
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 15%)' }}
    >
      <div className="relative w-[287px] h-[395px]">
        {kids.map((c, i) => (
          <div key={c.id} className="absolute w-[95px] flex flex-col items-center justify-center gap-[6px] p-[8px] text-neutral-400" style={{ left: ghostPos[i].left, top: ghostPos[i].top }}>
            <span className="font-han font-semibold text-[20px] leading-[24px]" lang="zh">{c.character}</span>
            <span className="font-medium text-[14px] leading-[20px] whitespace-nowrap">{c.meaning}</span>
          </div>
        ))}
        <div className="absolute left-[60px] top-[267px]">
          <RootCard node={node} variant="white" />
        </div>
      </div>
    </button>
  );
}
