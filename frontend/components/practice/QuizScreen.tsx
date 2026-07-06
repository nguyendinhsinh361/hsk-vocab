'use client';

import type { QuizStep } from '@/lib/types';
import { cn } from '@/lib/cn';
import { optionGridCols } from '@/lib/optionGrid';
import { WordHead } from './WordHead';
import { OptionButton } from './OptionButton';
import { ExplanationPanel } from './ExplanationPanel';
import { BottomCta } from './BottomCta';
import { HanziText } from './HanziText';

/** Màn Test — generic đa dạng bài (mcq / đúng-sai / gõ chữ / nghe). */
export function QuizScreen({
  step,
  selected,
  inputText,
  checked,
  isCorrect,
  onSelect,
  onInput,
  onCheck,
  onNext,
  isLast,
}: {
  step: QuizStep;
  selected: number | null;
  inputText: string;
  checked: boolean;
  isCorrect: boolean | null;
  onSelect: (i: number) => void;
  onInput: (text: string) => void;
  onCheck: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const isInput = step.variant === 'input';
  const canCheck = isInput ? inputText.trim().length > 0 : selected != null;

  // 2 lựa chọn NHƯNG là câu dài (vd C2 "chọn câu đúng") → xếp 1 cột cho dễ đọc.
  const twoLong =
    step.options.length === 2 &&
    step.options.some((o) => o.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, '').length > 10);
  const gridColsCls = twoLong ? 'grid-cols-1' : optionGridCols(step.options.length);

  return (
    <>
      <div className="absolute inset-0 overflow-y-auto px-2 md:px-8 pt-[5.75rem] md:pt-24 pb-[6.875rem] flex flex-col md:items-center">
        <div className="w-full rounded-3xl border border-neutral-200 bg-white shadow-soft p-4 md:max-w-[84rem] md:p-12 md:min-h-[calc(100dvh-13rem)] flex flex-col gap-5 md:gap-8">
          <h2 className="text-center font-sans font-bold text-lg md:text-2xl text-neutral-800">
            {step.title}
          </h2>

          {/* M3: cảnh báo từ có âm Hán Việt dễ nhầm (spec BNPD) */}
          {step.confusionWarning && (
            <div className="-mt-2 mx-auto inline-flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/25 px-3 py-1 font-sans font-semibold text-xs text-danger">
              <span aria-hidden>⚠</span> Từ dễ nhầm — chú ý phân biệt
            </div>
          )}

          {/* Đề bài: từ đơn / nghe / khối câu */}
          {step.word ? (
            <WordHead
              hz={step.word.hz}
              py={step.word.py}
              subtitle={step.prompt}
              showAudio={false}
            />
          ) : step.variant === 'audio' ? (
            <AudioPrompt text={step.audioText ?? ''} />
          ) : (
            <QuestionBlock text={step.question} />
          )}

          {/* Vùng trả lời */}
          {isInput ? (
            <InputArea
              value={inputText}
              onChange={onInput}
              disabled={checked}
              isCorrect={isCorrect}
              answer={step.answerText}
            />
          ) : (
            <div className={cn('grid gap-2.5 md:gap-4', gridColsCls)}>
              {step.options.map((opt, i) => (
                <OptionButton
                  key={i}
                  label={opt}
                  selected={selected === i}
                  checked={checked}
                  isCorrect={checked && i === step.answerIndex}
                  isWrongPick={checked && selected === i && i !== step.answerIndex}
                  onClick={() => onSelect(i)}
                />
              ))}
            </div>
          )}

          {checked && (
            <ExplanationPanel
              meaning={isInput ? step.answerText ?? '' : step.options[step.answerIndex] ?? ''}
              explanation={step.explanation}
            />
          )}
        </div>
      </div>

      {checked ? (
        <BottomCta onClick={onNext} withArrow>
          {isLast ? 'Xem kết quả' : 'Tiếp tục'}
        </BottomCta>
      ) : (
        <BottomCta disabled={!canCheck} onClick={onCheck}>
          Kiểm tra
        </BottomCta>
      )}
    </>
  );
}

// Dấu thanh của pinyin (macron/caron) — không có trong tiếng Việt → nhận diện dòng phiên âm.
const PINYIN_MARK = /[āēīōūǖǎěǐǒǔǚǘǜ]/;
const lineHasHan = (l: string) => /[一-鿿]/.test(l);
/** Bỏ các DÒNG chỉ là phiên âm pinyin (không có chữ Hán) — vì ruby đã tự sinh pinyin. */
function stripPinyinLines(text: string): string {
  return text
    .split('\n')
    .filter((l) => lineHasHan(l) || !PINYIN_MARK.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/** Khối đề bài dạng câu/hội thoại (đa dòng, có ___). */
function QuestionBlock({ text }: { text: string }) {
  const t = text.replace(/<br\s*\/?>/gi, '\n');
  const hasBlank = /_/.test(t);

  if (hasBlank) return <FillBlankBlock text={t} />;

  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 md:p-6">
      <p className="whitespace-pre-line text-center font-sans text-lg md:text-xl leading-relaxed text-neutral-800">
        {/* Câu thường: bỏ dòng pinyin thừa + pinyin trong ngoặc; giữ mệnh đề "= …". */}
        <HanziText
          text={stripPinyinLines(t)
            .replace(/[[(（【][^\])）】]*[\])）】]/g, '')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/[ \t]+\n/g, '\n')}
          size="lg"
          preserve
        />
      </p>
    </div>
  );
}

/** Đề bài ĐIỀN TRỐNG: nhãn gợi ý + câu Hán (ruby pinyin trên đầu) + ô trống bo tròn. */
function FillBlankBlock({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  // Dòng đầu là hướng dẫn (kết thúc ":" và không có ô trống) → tách ra làm nhãn.
  let prompt = '';
  let body = lines;
  if (lines.length > 1 && lines[0].endsWith(':') && !/_/.test(lines[0])) {
    prompt = lines[0].replace(/:$/, '');
    body = lines.slice(1);
  }
  // Bỏ dòng phiên âm pinyin thuần — ruby đã hiện pinyin trên chữ Hán.
  body = body.filter((l) => lineHasHan(l) || !PINYIN_MARK.test(l));

  return (
    <div className="rounded-2xl border border-primary-200 bg-primary-100/40 p-5 md:p-8 flex flex-col items-center gap-4">
      {prompt && (
        <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-sm md:text-base text-primary-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {prompt}
        </span>
      )}
      <div className="flex flex-col items-center gap-3">
        {body.map((line, i) => (
          <BlankLine key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

/** 1 dòng câu điền trống: chữ Hán có ruby pinyin + ô trống dạng gạch nét đứt. */
function BlankLine({ line }: { line: string }) {
  // Bỏ pinyin trong ngoặc [..] (ruby tự sinh), gộp khoảng trắng thừa.
  const clean = line.replace(/[[(（【][^\])）】]*[\])）】]/g, '').replace(/[ \t]{2,}/g, ' ');
  const parts = clean.split(/(_+)/);
  return (
    <p className="text-center leading-relaxed font-han text-2xl md:text-[1.75rem] font-semibold text-neutral-900">
      {parts.map((p, i) =>
        /^_+$/.test(p) ? (
          <span
            key={i}
            aria-hidden
            className="inline-block align-middle mx-1.5 h-[1.4em] w-11 rounded-lg border-2 border-dashed border-primary-400 bg-primary-100/70"
          />
        ) : (
          <HanziText key={i} text={p} size="lg" preserve className="align-middle" />
        ),
      )}
    </p>
  );
}

/** Đề bài dạng nghe: nút phát audio (TTS). */
function AudioPrompt({ text }: { text: string }) {
  const speak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={speak}
        aria-label="Phát âm"
        className="size-24 rounded-full bg-primary text-white flex items-center justify-center shadow-soft active:translate-y-px"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
        </svg>
      </button>
      <p className="font-sans font-semibold text-lg md:text-xl text-neutral-800">
        Nghe và chọn từ phù hợp
      </p>
    </div>
  );
}

/** Vùng gõ chữ Hán (variant='input'). */
function InputArea({
  value,
  onChange,
  disabled,
  isCorrect,
  answer,
}: {
  value: string;
  onChange: (t: string) => void;
  disabled: boolean;
  isCorrect: boolean | null;
  answer?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-md">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          lang="zh"
          placeholder="Gõ chữ Hán…"
          autoFocus
          className={cn(
            'w-full h-16 rounded-2xl border-2 px-12 text-center font-han text-3xl text-neutral-900 shadow-soft outline-none transition-all',
            'placeholder:font-sans placeholder:text-lg placeholder:text-neutral-300',
            disabled && isCorrect && 'border-success bg-success/10',
            disabled && isCorrect === false && 'border-danger bg-danger/10',
            !disabled &&
              'border-neutral-200 bg-neutral-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15',
          )}
        />
      </div>
      {disabled && isCorrect === false && answer && (
        <p className="font-sans text-sm text-neutral-500">
          Đáp án đúng: <span className="font-han text-neutral-800" lang="zh">{answer}</span>
        </p>
      )}
    </div>
  );
}
