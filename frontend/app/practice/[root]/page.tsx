'use client';

/**
 * MÀN: Luồng luyện tập — sau nút "Chiến luôn đi nào".
 * Chuỗi: Trailer (dạy từ) → Pattern (lộ gốc) → Test → Nối từ → Tổng kết.
 * Route: /practice/[root]  (vd /practice/people → gốc 人).
 * Khung UI dùng chung: components/practice/FlowScreen (chia sẻ với /review).
 */

import { use } from 'react';
import { usePracticeFlow } from '@/hooks/usePracticeFlow';
import { FlowScreen } from '@/components/practice/FlowScreen';

export default function PracticeFlowPage({
  params,
}: {
  params: Promise<{ root: string }>;
}) {
  const { root } = use(params);
  const f = usePracticeFlow(root);
  return <FlowScreen f={f} backHref="/home" />;
}
