import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';

const quicksand = Quicksand({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-quicksand',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Migii HSK Vocab',
  description: 'Học từ vựng tiếng Trung theo HSK qua cây từ gốc',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={quicksand.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
