/** Status bar iOS 375×44: giờ 9:41 trái + signal/wifi/battery phải (theo Figma). */
export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? '#FFFFFF' : '#0F172A';
  return (
    <div className="absolute top-0 left-0 w-[375px] h-[44px] z-20 flex items-center justify-between px-[21px]">
      <span
        className="font-sans font-semibold text-[15px] tracking-tight"
        style={{ color }}
      >
        9:41
      </span>
      <div className="flex items-center gap-[6px]" style={{ color }}>
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill={color} aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill={color} aria-hidden>
          <path d="M8.5 1C5.4 1 2.6 2.2.5 4.2l1.5 1.5C3.7 4 6 3 8.5 3s4.8 1 6.5 2.7L16.5 4.2C14.4 2.2 11.6 1 8.5 1z" />
          <path d="M8.5 5.5c-1.9 0-3.6.7-4.9 2l1.5 1.5c.9-.9 2.1-1.5 3.4-1.5s2.5.6 3.4 1.5l1.5-1.5c-1.3-1.3-3-2-4.9-2z" />
          <circle cx="8.5" cy="10.5" r="1.5" />
        </svg>
        {/* battery */}
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke={color} fill="none" opacity="0.4" />
          <rect x="2" y="2" width="18" height="9" rx="1.5" fill={color} />
          <rect x="24" y="4" width="2" height="5" rx="1" fill={color} opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
