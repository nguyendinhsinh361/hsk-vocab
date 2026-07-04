'use client';

/** ROUTE /premium — Paywall "Nâng cấp Premium". Responsive: full-bleed mobile, card giữa desktop. */

import { PaymentShell } from '@/components/payment/PaymentShell';
import { PaywallScreen } from '@/components/payment/PaywallScreen';
import PremiumWeb from '@/components/payment/PremiumWeb';
import { BottomTab } from '@/components/home/HomeMobile';

export default function PremiumPaywallPage() {
  return (
    <>
      {/* Mobile (<md): paywall + thanh menu dưới (chừa chỗ bằng pb). */}
      <div className="md:hidden relative min-h-[100dvh]">
        <PaymentShell wide className="pb-24">
          <PaywallScreen />
        </PaymentShell>
        <BottomTab active="/premium" />
      </div>
      {/* Desktop (≥md): có sidebar + nội dung căn giữa (giống màn Hồ sơ). */}
      <div className="hidden md:block">
        <PremiumWeb />
      </div>
    </>
  );
}
