'use client';

import { pinyin } from 'pinyin-pro';
import { cn } from '@/lib/cn';

/**
 * Hiển thị chữ Hán kèm pinyin PHÍA TRÊN từng chữ (ruby), tô màu theo thanh điệu.
 * - Mặc định: dọn pinyin/latin có sẵn (trong []/() và phần đuôi) để khỏi trùng — dùng cho từ/đáp án.
 * - preserve=true: GIỮ NGUYÊN toàn bộ chuỗi (kể cả xuống dòng, chú thích), chỉ chú pinyin lên chữ Hán
 *   — dùng cho đoạn giải thích nhiều dòng trộn Việt–Trung.
 */

const TONE_COLOR: Record<number, string> = {
  1: '#e11d48',
  2: '#f59e0b',
  3: '#10b981',
  4: '#3b82f6',
  0: '#94a3b8',
};

const isHan = (c: string) => /[一-鿿]/.test(c);

const SIZES = {
  sm: { char: 'text-base', rt: 'text-[0.625rem]' },
  base: { char: 'text-xl', rt: 'text-xs' },
  lg: { char: 'text-3xl', rt: 'text-sm' },
  xl: { char: 'text-5xl md:text-6xl', rt: 'text-base md:text-lg' },
};

/** Bỏ pinyin trong ngoặc và phần phiên âm latin ở đuôi (sau chữ Hán cuối). */
function cleanHanzi(raw: string): string {
  let s = raw.replace(/[[(（【][^\])）】]*[\])）】]/g, '').trim();
  const chars = [...s];
  let last = -1;
  chars.forEach((c, i) => {
    if (isHan(c)) last = i;
  });
  if (last >= 0) {
    let end = last + 1;
    while (end < chars.length && /[。，、！？；：\s]/.test(chars[end])) end++;
    s = chars.slice(0, end).join('');
  }
  return s.trim();
}

export function HanziText({
  text,
  className,
  size = 'base',
  preserve = false,
}: {
  text: string;
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  preserve?: boolean;
}) {
  if (!isHan(text)) {
    return <span className={cn(preserve && 'whitespace-pre-line', className)}>{text}</span>;
  }

  const src = preserve ? text : cleanHanzi(text);
  const { char: charCls, rt: rtCls } = SIZES[size];

  // Sinh pinyin theo NGỮ CẢNH cả câu (segmentation) rồi map lại từng chữ Hán.
  // nonZh:'removed' → mảng chỉ gồm pinyin của các chữ Hán, đúng thứ tự.
  const pyArr = pinyin(src, { type: 'array', toneType: 'symbol', nonZh: 'removed' });
  const toneArr = pinyin(src, { type: 'array', toneType: 'num', nonZh: 'removed' });
  let hanIdx = 0;

  const nodes: React.ReactNode[] = [];
  let buf = '';
  const flush = (key: string) => {
    if (buf) {
      nodes.push(<span key={key}>{buf}</span>);
      buf = '';
    }
  };
  [...src].forEach((ch, i) => {
    if (isHan(ch)) {
      flush(`t${i}`);
      const disp = pyArr[hanIdx] ?? pinyin(ch, { toneType: 'symbol' });
      const num = toneArr[hanIdx] ?? '';
      const tone = Number((num.match(/\d/) || ['0'])[0]);
      hanIdx += 1;
      nodes.push(
        <ruby key={i} className={cn('font-han mx-px', charCls)}>
          {ch}
          <rt
            className={cn('font-sans font-medium', rtCls)}
            style={{ color: TONE_COLOR[tone] ?? TONE_COLOR[0] }}
          >
            {disp}
          </rt>
        </ruby>,
      );
    } else {
      buf += ch;
    }
  });
  flush('end');

  return (
    <span className={cn('leading-relaxed', preserve && 'whitespace-pre-line', className)}>
      {nodes}
    </span>
  );
}
