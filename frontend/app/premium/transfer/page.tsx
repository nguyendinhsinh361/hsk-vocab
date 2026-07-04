'use client';

/** ROUTE /premium/transfer — "Thông tin chuyển khoản". Responsive: full-bleed mobile, card giữa desktop. */

import { PaymentShell } from '@/components/payment/PaymentShell';
import { PaymentWebShell } from '@/components/payment/PaymentWebShell';
import { TransferScreen } from '@/components/payment/TransferScreen';

export default function PremiumTransferPage() {
  return (
    <>
      {/* Mobile (<md): card full-bleed trên nền brand. */}
      <div className="md:hidden">
        <PaymentShell cardWidth="lg">
          <TransferScreen />
        </PaymentShell>
      </div>
      {/* Desktop (≥md): sidebar + card căn giữa (giống màn Hồ sơ/Premium). */}
      <div className="hidden md:block">
        <PaymentWebShell maxWidth="lg">
          <TransferScreen />
        </PaymentWebShell>
      </div>
    </>
  );
}
