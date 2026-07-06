'use client';

/**
 * MÀN: Phiên ÔN TẬP — các từ đến hạn trong hàng đợi ôn (trả lời sai trước đó).
 * Mỗi từ 1 bài C1/C3 + bài nối từ chốt phiên. Dùng chung khung FlowScreen
 * và endpoint chấm/hoàn thành với luyện tập.
 */

import { usePracticeFlow } from '@/hooks/usePracticeFlow';
import { FlowScreen } from '@/components/practice/FlowScreen';
import { api } from '@/lib/api';

export default function ReviewPage() {
  const f = usePracticeFlow('review', api.reviewSession);
  return <FlowScreen f={f} backHref="/home" />;
}
