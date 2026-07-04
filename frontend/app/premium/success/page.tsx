'use client';

/** ROUTE /premium/success — "Thanh toán thành công!". Overlay chúc mừng, responsive mọi màn. */

import { SuccessScreen, SuccessCard } from '@/components/payment/SuccessScreen';
import { PaymentWebShell } from '@/components/payment/PaymentWebShell';

export default function PremiumSuccessPage() {
  return (
    <>
      {/* Mobile (<md): modal chúc mừng trên backdrop. */}
      <div className="md:hidden">
        <SuccessScreen />
      </div>
      {/* Desktop (≥md): sidebar + card căn giữa. */}
      <div className="hidden md:block">
        <PaymentWebShell maxWidth="sm">
          <div className="p-8">
            <SuccessCard />
          </div>
        </PaymentWebShell>
      </div>
    </>
  );
}
