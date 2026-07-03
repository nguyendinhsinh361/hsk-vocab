import type { PracticeExample } from '@/lib/types';
import { HanziText } from './HanziText';

// Dấu thanh macron/caron chỉ xuất hiện ở pinyin (không có trong tiếng Việt).
const PINYIN_MARK = /[āēīōūǖǎěǐǒǔǚǘǜ]/;
const hasHan = (l: string) => /[一-鿿]/.test(l);

/** Bỏ các DÒNG chỉ chứa pinyin (không có chữ Hán) — vì ruby đã tự sinh pinyin. */
function stripPinyinLines(text: string): string {
  return text
    .split('\n')
    .filter((l) => hasHan(l) || !PINYIN_MARK.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/** Panel "Giải thích" hiện sau khi Kiểm tra (nghĩa + diễn giải + câu ví dụ). */
export function ExplanationPanel({
  meaning,
  explanation,
  example,
}: {
  meaning: string;
  explanation: string;
  example?: PracticeExample;
}) {
  return (
    <div className="rounded-[1.25rem] bg-success/5 border border-success/30 p-4 md:p-6 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-success">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span className="font-sans font-bold text-base">Giải thích</span>
      </div>
      <div className="font-sans font-bold text-lg text-neutral-800">
        <HanziText text={meaning} />
      </div>
      <div className="font-sans text-sm md:text-base leading-relaxed text-neutral-600">
        <HanziText
          text={stripPinyinLines(explanation.replace(/<br\s*\/?>/gi, '\n'))
            .replace(/[[(（【][^\])）】]*[\])）】]/g, '')
            .replace(/[ \t]{2,}/g, ' ')}
          size="sm"
          preserve
        />
      </div>
      {example?.hz && (
        <div className="mt-1 rounded-[0.75rem] bg-white border border-neutral-200 p-3 md:p-4 flex flex-col gap-2">
          <HanziText text={example.hz} className="text-primary-700" />
          {example.meaning && (
            <span className="font-sans text-sm md:text-base text-neutral-700">{example.meaning}</span>
          )}
        </div>
      )}
    </div>
  );
}
