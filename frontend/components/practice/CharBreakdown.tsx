import type { CharPart } from '@/lib/types';

/** Panel "Phân tích chữ": các ô gốc thành phần, nối bằng dấu +. */
export function CharBreakdown({ parts }: { parts: CharPart[] }) {
  return (
    <div className="rounded-[1.25rem] bg-primary-100/60 border border-primary-200 p-4 md:p-6">
      <p className="mb-3 text-center font-sans font-semibold text-sm md:text-base text-primary-700">
        Phân tích chữ
      </p>
      <div className="flex items-stretch justify-center gap-3">
        {parts.map((p, i) => (
          <div key={i} className="flex items-stretch gap-3">
            {i > 0 && (
              <span className="self-center font-sans font-bold text-2xl text-neutral-400">
                +
              </span>
            )}
            <div className="min-w-[6rem] rounded-[0.875rem] bg-white border border-neutral-200 px-3 py-3 flex flex-col items-center gap-1">
              <span className="font-han font-bold text-3xl md:text-4xl leading-none text-neutral-900" lang="zh">
                {p.hz}
              </span>
              <span className="font-sans font-semibold text-sm md:text-base text-neutral-700">{p.hv}</span>
              {p.gloss && p.gloss !== p.hv && (
                <span className="font-sans text-xs text-neutral-400 text-center leading-tight">
                  {p.gloss}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
