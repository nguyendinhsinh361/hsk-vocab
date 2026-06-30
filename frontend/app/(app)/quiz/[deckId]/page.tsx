'use client';

/**
 * MÀN: Quiz (luyện tập trắc nghiệm) + Kết quả.
 * Mục đích: kiểm tra nhận biết chữ Hán ↔ nghĩa; cộng XP.
 * Thành phần: đề bài (chữ Hán lớn), 4 đáp án, thanh tiến trình câu, khối review, màn kết quả.
 * CTA & điều hướng: chọn đáp án → review; "Tiếp tục"/"Xem kết quả" → câu kế/hoàn thành;
 *                   "Làm lại" → start lại; "Về trang chủ" → /dashboard.
 * States: idle / loading / question / review (đúng-sai) / complete / error.
 * Route: /quiz/[deckId]
 * API: POST /quiz/start → POST /quiz/answer (mỗi câu) → POST /quiz/:sessionId/complete
 */

import { use } from 'react';
import Link from 'next/link';
import { useQuiz } from '@/hooks/useQuiz';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export default function QuizPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const q = useQuiz(deckId);

  if (q.phase === 'idle') {
    return (
      <Center>
        <h1 className="text-2xl font-bold text-neutral-800">Sẵn sàng luyện tập?</h1>
        <p className="mt-1 text-neutral-500">Chọn 1 gốc từ và bắt đầu hành trình.</p>
        <Button className="mt-6" onClick={() => q.start('RECOGNITION')}>
          Bắt đầu
        </Button>
      </Center>
    );
  }

  if (q.phase === 'loading') return <Center>Đang tạo câu hỏi…</Center>;

  if (q.phase === 'error')
    return (
      <Center>
        <p className="text-danger">Lỗi: {q.error}</p>
        <Button variant="outline" className="mt-4" onClick={() => q.start()}>
          Thử lại
        </Button>
      </Center>
    );

  if (q.phase === 'complete' && q.result) {
    return (
      <Center>
        <h1 className="text-2xl font-bold text-neutral-800">Hoàn thành! 🎉</h1>
        <p className="mt-2 text-neutral-600">
          Đúng {q.result.correctCount}/{q.result.total} — +{q.result.xpEarned} XP
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => q.start()}>Làm lại</Button>
          <Link href="/dashboard">
            <Button variant="outline">Về trang chủ</Button>
          </Link>
        </div>
      </Center>
    );
  }

  const cur = q.current;
  if (!cur) return null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-sm text-neutral-500">
        Câu {q.index + 1}/{q.total}
      </div>
      <div className="mt-4 rounded-2xl bg-white border border-neutral-200 shadow-soft p-8 text-center">
        <div className="font-han text-6xl font-extrabold text-neutral-900" lang="zh">
          {cur.prompt}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {cur.options.map((opt) => {
          const isReview = q.phase === 'review';
          const isCorrectOpt = isReview && opt === q.correctAnswer;
          const isWrongPick =
            isReview && opt === q.selected && !q.isCorrect;
          return (
            <button
              key={opt}
              disabled={isReview}
              onClick={() => q.answer(opt)}
              className={cn(
                'rounded-xl border p-4 text-left font-medium transition-colors',
                'border-neutral-300 hover:border-primary-300 disabled:hover:border-neutral-300',
                isCorrectOpt && 'border-success bg-success/10 text-success',
                isWrongPick && 'border-danger bg-danger/10 text-danger',
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {q.phase === 'review' && (
        <div className="mt-6 flex items-center justify-between">
          <span className={cn('font-semibold', q.isCorrect ? 'text-success' : 'text-danger')}>
            {q.isCorrect ? '✓ Chính xác! +10 XP' : `✗ Đáp án đúng: ${q.correctAnswer}`}
          </span>
          <Button onClick={() => q.next()}>
            {q.index >= q.total - 1 ? 'Xem kết quả' : 'Tiếp tục'}
          </Button>
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
      {children}
    </div>
  );
}
