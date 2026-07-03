'use client';

/** ROUTE /premium — Paywall "Nâng cấp Premium". Responsive: full-bleed mobile, card giữa desktop. */

import { PaymentShell } from '@/components/payment/PaymentShell';
import { PaywallScreen } from '@/components/payment/PaywallScreen';

export default function PremiumPaywallPage() {
  return (
    <PaymentShell wide>
      <PaywallScreen />
    </PaymentShell>
  );
}
