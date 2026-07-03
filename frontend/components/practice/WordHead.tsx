'use client';

import { cn } from '@/lib/cn';
import { HanziText } from './HanziText';

/**
 * Thẻ đầu màn: chữ Hán lớn kèm ruby pinyin (tô màu theo thanh) + (tuỳ chọn) nút Phát âm.
 * Dưới thẻ: `subtitle` = nghĩa (TEACH) hoặc câu hỏi "Nghĩa là gì nhỉ?" (QUIZ).
 * `py` giữ để tương thích nhưng pinyin được sinh theo ngữ cảnh từ `hz` (đồng bộ toàn app).
 */
export function WordHead({
  hz,
  subtitle,
  showAudio = true,
  className,
}: {
  hz: string;
  py?: string;
  subtitle?: string;
  showAudio?: boolean;
  className?: string;
}) {
  const speak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(hz);
    u.lang = 'zh-CN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="w-fit min-w-[12.5rem] md:min-w-[15rem] max-w-[90%] rounded-[1.25rem] bg-primary-100 border border-primary-200 px-6 py-4 md:px-8 md:py-6 flex flex-col items-center gap-1">
        <HanziText text={hz} size="xl" className="text-neutral-900" />
        {showAudio && (
          <button
            type="button"
            onClick={speak}
            className="mt-0.5 flex items-center gap-1.5 font-sans font-semibold text-[0.8125rem] text-primary-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
            </svg>
            Phát âm
          </button>
        )}
      </div>
      {subtitle && (
        <p className="mt-3 font-sans font-semibold text-lg md:text-xl text-neutral-800 text-center">
          {subtitle}
        </p>
      )}
    </div>
  );
}
