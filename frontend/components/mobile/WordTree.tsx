/**
 * Cụm minh hoạ "cây từ gốc" cho mobile (gốc 人 → 3 từ ghép), dựng đúng vị trí Figma.
 * Nền gradient phủ FULL-BLEED; cụm cây căn giữa trong cột 375 (không lệch trên màn rộng).
 */
/** Nền onboarding chung: ảnh tablet-bg phủ KÍN cả màn (object-cover), gradient dự phòng. */
export function OnboardingBg() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #5ecec6 73.488%)' }} />
      <img
        src="/img/tablet-bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
      />
    </div>
  );
}

/** Nền cho màn CÂY TỪ (intro/summary): ảnh onboarding-illustration (vầng sáng + mây) phủ kín.
 *  shiftY để đẩy nền lên cùng cụm cây (khi có bottom sheet). */
export function OnboardingTreeBg({ shiftY = 0 }: { shiftY?: number }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #5ecec6 73.488%)' }} />
      <img
        src="/img/onboarding-illustration.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={shiftY ? { transform: `translateY(${shiftY}px)` } : undefined}
        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
      />
    </div>
  );
}

export function WordTree({ shiftY = 0 }: { shiftY?: number }) {
  return (
    <>
      {/* Cụm cây căn giữa (cột 375); shiftY để đẩy lên khi bị bottom sheet che */}
      <div className="absolute inset-0 mx-auto w-[375px]" style={shiftY ? { transform: `translateY(${shiftY}px)` } : undefined}>
        {/* Nhánh nối nét đứt: đỏ/xanh xuất phát từ TRUNG ĐIỂM cạnh trái/phải thẻ gốc, bẻ 90° rồi xuống; tím thẳng xuống giữa */}
        <svg className="absolute inset-0 w-[375px] h-[812px] pointer-events-none" viewBox="0 0 375 812" fill="none">
          {/* đỏ: trung điểm cạnh trái gốc → bẻ 90° → xuống thẳng trục tâm thẻ trái (x=59) */}
          <path d="M121 370 Q59 370 59 436 L59 560" stroke="#EF5350" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round" />
          {/* tím: đáy gốc → THẲNG ĐỨNG xuống thẻ giữa (x=188, thẻ tím cao hơn) */}
          <path d="M188 436 L188 500" stroke="#785BFF" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round" />
          {/* xanh: trung điểm cạnh phải gốc → bẻ 90° → xuống thẳng trục tâm thẻ phải (x=316) */}
          <path d="M254 370 Q316 370 316 436 L316 550" stroke="#42A5F5" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round" />
        </svg>
        {/* Chip +10 gốc từ */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[234px] bg-neutral-100 border border-neutral-300 border-b-[3px] rounded-[16px] px-[12px] py-[6px]">
          <span className="font-sans font-medium text-[14px] leading-[20px] text-neutral-800">+10 gốc từ...</span>
        </div>
        {/* Thẻ gốc 人 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[304px] w-[132px] bg-white border border-[#00b2a5] border-b-[3px] rounded-[116px] p-[12px] flex flex-col items-center gap-[6px]"
          style={{ filter: 'drop-shadow(0px 0px 18px rgba(0,178,165,0.28))' }}
        >
          <div className="size-[36px] rounded-full bg-[#00b2a5] flex items-center justify-center">
            <span className="font-han font-bold text-white text-[24px] leading-[30px]" lang="zh">人</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-sans font-medium text-[14px] leading-[20px] text-[#1976d2]">rén</span>
            <span className="font-sans font-medium text-[14px] leading-[20px] text-neutral-800 whitespace-nowrap">nhân - người</span>
          </div>
          <div className="bg-neutral-100 rounded-[12px] px-[8px] py-[2px]">
            <span className="font-sans font-semibold text-[12px] leading-[16px] text-neutral-500">4 từ</span>
          </div>
        </div>
        {/* 3 thẻ nhánh */}
        <BranchCard className="left-[261px] top-[550px] bg-blue-50 border-blue-400" pinyinColor="#1565c0" />
        <BranchCard className="left-[133px] top-[500px] bg-[#eeebff] border-[#785bff]" pinyinColor="#543acc" />
        <BranchCard className="left-[4px] top-[560px] bg-red-50 border-red-400" pinyinColor="#d32f2f" />
        {/* Chấm nối đặt đúng trung điểm cạnh TRÊN mỗi thẻ */}
        <span className="absolute left-[54px] top-[555px] size-[9px] rounded-full bg-[#EF5350]" />
        <span className="absolute left-[183px] top-[495px] size-[9px] rounded-full bg-[#785BFF]" />
        <span className="absolute left-[311px] top-[545px] size-[9px] rounded-full bg-[#42A5F5]" />
      </div>
    </>
  );
}

function BranchCard({ className, pinyinColor }: { className: string; pinyinColor: string }) {
  return (
    <div className={`absolute w-[110px] border border-b-2 rounded-[16px] p-[12px] flex flex-col items-center gap-[6px] ${className}`}>
      <div className="bg-white rounded-full px-[8px] py-[4px]">
        <span className="font-han text-[16px] leading-[24px] text-neutral-800" lang="zh">人人</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-sans font-medium text-[14px] leading-[20px]" style={{ color: pinyinColor }}>rén rén</span>
        <span className="font-sans font-medium text-[14px] leading-[20px] text-neutral-900 whitespace-nowrap">Nhóm người</span>
      </div>
    </div>
  );
}
