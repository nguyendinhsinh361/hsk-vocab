'use client';

/**
 * UI WEB (desktop ≥lg) cho route /onboarding — "Chọn 1 gốc từ" (Figma flow web).
 * Tiêu đề · cây mẫu · 3 thẻ chọn gốc (gốc + các từ ghép mờ) · 2 nút.
 * Dữ liệu gốc từ tĩnh (MVP, khớp HSK1). Chọn gốc → /practice/[deckId].
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

type RootLeaf = { id: string; character: string; meaning: string };
type RootTree = {
  deckId: string;
  character: string;
  pinyin: string;
  meaning: string;
  children: RootLeaf[];
};

const STATIC_ROOTS: RootTree[] = [
  {
    deckId: 'people',
    character: '人',
    pinyin: 'rén',
    meaning: 'nhân - người',
    children: [
      { id: 'w-gongren', character: '工人', meaning: 'công nhân' },
      { id: 'w-bingren', character: '病人', meaning: 'bệnh nhân' },
      { id: 'w-nanren', character: '男人', meaning: 'đàn ông' },
      { id: 'w-nren', character: '女人', meaning: 'phụ nữ' },
    ],
  },
  {
    deckId: 'family',
    character: '家',
    pinyin: 'jiā',
    meaning: 'gia - nhà',
    children: [
      { id: 'w-jiaren', character: '家人', meaning: 'người nhà' },
      { id: 'w-huijia', character: '回家', meaning: 'về nhà' },
      { id: 'w-zaijia', character: '在家', meaning: 'ở nhà' },
      { id: 'w-jiali', character: '家里', meaning: 'trong nhà' },
    ],
  },
  {
    deckId: 'study',
    character: '学',
    pinyin: 'xué',
    meaning: 'học',
    children: [
      { id: 'w-xuesheng', character: '学生', meaning: 'học sinh' },
      { id: 'w-xuexi', character: '学习', meaning: 'học tập' },
      { id: 'w-xuexiao', character: '学校', meaning: 'trường học' },
      { id: 'w-tongxue', character: '同学', meaning: 'bạn học' },
    ],
  },
];

export default function ChooseRootWeb() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  const roots = STATIC_ROOTS;
  const example = roots[0];
  const start = (i = selected) =>
    router.push(`/practice/${roots[i]?.deckId ?? 'people'}`);

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

      <div className="relative z-10 flex-1 w-full max-w-[77.5rem] mx-auto flex flex-col items-center justify-center gap-12 xl:gap-16 py-12 px-6">
        <h1 className="text-center font-bold text-[1.75rem] sm:text-[2rem] leading-tight tracking-tight text-neutral-900 max-w-[42.5rem]">
          Chọn 1 gốc từ để bắt đầu hành trình
        </h1>

        <div className="flex gap-4 items-end justify-center w-full">
          {example && <ExampleTree node={example} />}
          {roots.map((r, i) => (
            <RootOptionCard key={r.deckId} node={r} selected={selected === i} onSelect={() => setSelected(i)} onStart={() => start(i)} />
          ))}
        </div>

        <div className="flex gap-5 items-center justify-center w-full max-w-[51.25rem]">
          <button
            onClick={() => { const i = Math.floor(Math.random() * Math.max(roots.length, 1)); setSelected(i); start(i); }}
            className="flex-1 max-w-[25rem] h-[3.375rem] rounded-full bg-white border border-neutral-300 border-b-4 flex items-center justify-center font-semibold text-[0.9375rem] sm:text-base text-[#00b2a5] whitespace-nowrap px-3"
          >
            Chưa biết chọn gốc nào?
          </button>
          <button
            onClick={() => start()}
            className="flex-1 max-w-[25rem] h-[3.375rem] rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] flex items-center justify-center font-semibold text-[0.9375rem] sm:text-base text-white whitespace-nowrap px-3"
          >
            Làm bài ngay
          </button>
        </div>
      </div>
    </main>
  );
}

function RootCard({ node, variant }: { node: RootTree; variant: 'teal' | 'white' }) {
  const teal = variant === 'teal';
  return (
    <div
      className={cn(
        'w-44 flex flex-col items-center justify-center pt-4 pb-5 px-3 border border-b-4',
        'rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-bl-[2.5rem] rounded-br-[2.5rem]',
        teal ? 'bg-[#5ecec6] border-[#00655e]' : 'bg-white border-neutral-300',
      )}
    >
      <span className={cn('font-han font-semibold text-5xl leading-none', teal ? 'text-white' : 'text-neutral-900')} lang="zh">
        {node.character}
      </span>
      <span className={cn('mt-2 font-medium text-lg leading-6', teal ? 'text-[#00655e]' : 'text-base leading-5 text-[#1976d2]')}>
        {node.pinyin}
      </span>
      <span className={cn('font-semibold text-sm leading-5', teal ? 'text-white' : 'text-neutral-500')}>
        {node.meaning}
      </span>
    </div>
  );
}

function ExampleTree({ node }: { node: RootTree }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="shrink-0 hidden xl:flex items-center h-[34rem]">
      <div className="relative w-[20rem] h-[32rem]">
        {imgOk ? (
          <img src="/img/onboarding-tree.png" alt="" className="w-full h-full object-contain" onError={() => setImgOk(false)} />
        ) : (
          <CodedTree node={node} />
        )}
      </div>
    </div>
  );
}

function CodedTree({ node }: { node: RootTree }) {
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
      <div className="absolute left-[3.75rem] top-[19.6875rem]">
        <RootCard node={node} variant="teal" />
      </div>
    </>
  );
}

function LeafCloud({ char, meaning, style }: { char: string; meaning?: string | null; style: React.CSSProperties }) {
  return (
    <div className="absolute w-[8.125rem] h-[6.25rem]" style={style}>
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white pt-1">
        <span className="font-han font-semibold text-xl leading-6" lang="zh">{char}</span>
        <span className="font-medium text-sm leading-5">{meaning}</span>
      </div>
    </div>
  );
}

function RootOptionCard({
  node,
  selected,
  onSelect,
  onStart,
}: {
  node: RootTree;
  selected: boolean;
  onSelect: () => void;
  onStart: () => void;
}) {
  // 4 từ ghép mờ nằm TRONG vùng trên (320×256), luôn phía trên thẻ gốc → không bị đè.
  const ghostPos = [
    { left: 16, top: 12 },
    { left: 128, top: 52 },
    { left: 4, top: 128 },
    { left: 112, top: 172 },
  ];
  const kids = node.children.slice(0, 4);
  return (
    <button
      onClick={onSelect}
      onDoubleClick={onStart}
      className={cn(
        'h-[32rem] w-80 shrink-0 overflow-hidden rounded-[2.5rem] border border-b-4 px-4 py-6 flex flex-col items-center justify-between transition-colors',
        selected ? 'border-[#00655e] ring-2 ring-[#00b2a5]/30' : 'border-neutral-200',
      )}
      style={{
        backgroundImage: selected
          ? 'linear-gradient(135deg, #12BFA6 0%, #00B2A5 60%, #00958B 100%)'
          : 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 15%)',
      }}
    >
      {/* vùng trên: các từ ghép mờ */}
      <div className="relative w-full h-64">
        {kids.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              'absolute w-[6.75rem] flex flex-col items-center justify-center gap-1',
              selected ? 'text-white/85' : 'text-neutral-400',
            )}
            style={{ left: ghostPos[i].left, top: ghostPos[i].top }}
          >
            <span className="font-han font-semibold text-2xl leading-7" lang="zh">{c.character}</span>
            <span className="font-medium text-sm leading-5 text-center truncate max-w-full">{c.meaning}</span>
          </div>
        ))}
      </div>
      {/* vùng dưới: thẻ gốc (không đè lên chữ trên) */}
      <RootCard node={node} variant={selected ? 'teal' : 'white'} />
    </button>
  );
}
