import type { Metadata, Viewport } from 'next';
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

// Bắt buộc trình duyệt/thiết bị dùng đúng bề rộng thật (tránh render ở 980px rồi scale
// khiến media query sm/md kích hoạt sai → mobile bị nhầm sang layout tablet/desktop).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={quicksand.variable}>
      <head>
        {/* Font Hán: Noto Sans SC (phủ đủ giản thể, nét 400/500/700) → --font-han. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
