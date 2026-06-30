import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Trang chủ' },
  // Thêm khi build: Học, Flashcards, Luyện tập, Hồ sơ…
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar 272px theo design web (xem design/components.md) */}
      <aside className="hidden md:flex w-[272px] shrink-0 flex-col gap-2 border-r border-neutral-200 bg-white p-5">
        <div className="text-2xl font-extrabold text-primary mb-4">migii</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-3 text-neutral-700 hover:bg-primary-100 hover:text-primary font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
