import { redirect } from 'next/navigation';

// Entry: vào flow onboarding. (Khi có auth → returning user đi thẳng /dashboard.)
export default function Home() {
  redirect('/onboarding');
}
