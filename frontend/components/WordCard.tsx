import { cn } from '@/lib/cn';

interface WordCardProps {
  character: string;
  pinyin?: string;
  meaning?: string | null;
  size?: 'sm' | 'lg';
  className?: string;
}

/** Thẻ từ: chữ Hán (font-han) + pinyin + nghĩa. Dùng ở cây từ / list. */
export function WordCard({
  character,
  pinyin,
  meaning,
  size = 'sm',
  className,
}: WordCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-neutral-200 shadow-soft text-center',
        size === 'lg' ? 'p-6' : 'p-4',
        className,
      )}
    >
      <div
        className={cn(
          'font-han font-extrabold text-neutral-900',
          size === 'lg' ? 'text-5xl' : 'text-3xl',
        )}
        lang="zh"
      >
        {character}
      </div>
      {pinyin && <div className="mt-1 text-sm text-primary">{pinyin}</div>}
      {meaning && <div className="text-sm text-neutral-500">{meaning}</div>}
    </div>
  );
}
