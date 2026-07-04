/** Nền brand phủ sau nội dung: tablet-bg (mobile & tablet, <lg) · web-bg (lg+). */
export function BrandBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 block lg:hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/tablet-bg.png)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/web-bg.png)' }}
      />
    </>
  );
}
