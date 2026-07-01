/** Home indicator iOS: pill đen 134×5 ở đáy. */
export function HomeIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 w-full h-[34px] flex items-end justify-center pb-[8px] z-20">
      <div
        className="w-[134px] h-[5px] rounded-full"
        style={{ background: dark ? '#FFFFFF' : '#0F172A' }}
      />
    </div>
  );
}
