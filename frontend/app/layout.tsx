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
      <head>
        {/* Font Hán (Huninn) — dùng cho chữ Trung; --font-han trỏ về font này. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Huninn&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
