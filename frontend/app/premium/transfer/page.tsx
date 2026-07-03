'use client';

/** ROUTE /premium/transfer — "Thông tin chuyển khoản". Responsive: full-bleed mobile, card giữa desktop. */

import { PaymentShell } from '@/components/payment/PaymentShell';
import { TransferScreen } from '@/components/payment/TransferScreen';

export default function PremiumTransferPage() {
  return (
    <PaymentShell cardWidth="lg">
      <TransferScreen />
    </PaymentShell>
  );
}
