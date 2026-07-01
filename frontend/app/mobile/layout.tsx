/**
 * Layout cho các màn MOBILE (375×812) dựng dạng responsive web.
 * Căn giữa khung điện thoại trên nền xám để xem như prototype.
 */
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex items-center justify-center py-8">
      {children}
    </div>
  );
}
