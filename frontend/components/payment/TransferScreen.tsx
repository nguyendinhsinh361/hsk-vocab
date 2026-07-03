'use client';

/**
 * TransferScreen — màn "Thông tin chuyển khoản" (chỉ mobile, khớp Figma).
 * Chọn quốc gia → số tiền → QR → các trường copy → hướng dẫn → lưu ý → CTA xác nhận.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Copy, Check, Download, Timer, Info } from 'lucide-react';

const FIELDS = [
  { label: 'Người nhận', value: 'CONG TY CO PHAN CONG NGHE EUP' },
  { label: 'Tên ngân hàng', value: 'ACB' },
  { label: 'Số tài khoản', value: '42873907' },
  { label: 'Nội dung C/K', value: 'TRLW0gRr4y2VXN1W' },
];

const STEPS = [
  'Mở ứng dụng ngân hàng trên thiết bị di động của bạn',
  'Trên ứng dụng, chọn tính năng Quét mã QR',
  'Quét mã QR bên trên và thanh toán',
  'Sau khi thanh toán, nhấn vào nút “Xác nhận thanh toán bank” bên dưới',
];

export function TransferScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-primary-100/40">
      {/* Header */}
      <div className="relative shrink-0 bg-primary-100 px-4 pt-4 pb-3 sm:py-5 flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Quay lại"
          className="absolute left-3 sm:left-5 size-9 flex items-center justify-center text-neutral-800"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="font-sans font-bold text-base sm:text-xl text-neutral-800">Thông tin chuyển khoản</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8 pt-3 sm:pt-6 pb-4 sm:pb-6 flex flex-col gap-3 sm:gap-5">
        {/* Chọn quốc gia thanh toán */}
        <button
          type="button"
          className="w-full flex items-center justify-between rounded-xl bg-white border border-neutral-200 px-4 py-3 sm:py-3.5"
        >
          <span className="font-sans text-sm sm:text-base text-neutral-500">Chọn quốc gia thanh toán</span>
          <span className="flex items-center gap-1.5 font-sans font-semibold text-sm sm:text-base text-neutral-800">
            <span className="text-base leading-none">🇻🇳</span>
            Việt Nam
            <ChevronRight size={16} className="text-neutral-400" />
          </span>
        </button>

        {/* Desktop 2 cột: card chuyển khoản (trái) · hướng dẫn + lưu ý (phải) */}
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-5 sm:items-start">
          {/* Card chuyển khoản */}
          <div className="rounded-2xl bg-white border border-primary-200 shadow-soft p-4 sm:p-6 flex flex-col items-center">
            <span className="size-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <Timer size={18} strokeWidth={2} />
            </span>
            <p className="mt-2 font-sans text-xs sm:text-sm text-neutral-500">Chuyển khoản ngân hàng</p>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="font-sans font-bold text-2xl sm:text-3xl text-neutral-900">VND 702,000</p>
              <button type="button" onClick={() => copy('amount', '702000')} aria-label="Sao chép số tiền">
                {copied === 'amount' ? <Check size={16} className="text-primary" /> : <Copy size={16} className="text-neutral-400" />}
              </button>
            </div>
            <p className="font-sans text-sm text-neutral-400 line-through">1,678,000 VND</p>
            <button type="button" className="mt-0.5 font-sans text-xs sm:text-sm text-primary-700 underline">Chi tiết</button>

            {/* QR */}
            <div className="mt-3 rounded-xl border border-neutral-200 p-2.5 sm:p-3">
              <QrCode />
            </div>
            <button type="button" className="mt-2 flex items-center gap-1.5 font-sans text-xs sm:text-sm font-medium text-neutral-500">
              <Download size={14} /> Tải xuống
            </button>

            {/* Các trường copy */}
            <div className="mt-3 w-full divide-y divide-neutral-100">
              {FIELDS.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3 py-2.5 sm:py-3">
                  <span className="font-sans text-xs sm:text-sm text-neutral-500 shrink-0">{f.label}</span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="font-sans font-semibold text-[0.8125rem] sm:text-sm text-neutral-800 truncate text-right">{f.value}</span>
                    <button type="button" onClick={() => copy(f.label, f.value)} aria-label={`Sao chép ${f.label}`} className="shrink-0">
                      {copied === f.label ? <Check size={15} className="text-primary" /> : <Copy size={15} className="text-neutral-400" />}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: hướng dẫn + lưu ý */}
          <div className="flex flex-col gap-3 sm:gap-5">
            {/* Hướng dẫn chuyển khoản */}
            <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-6">
              <h2 className="font-sans font-bold text-sm sm:text-base text-neutral-800">Hướng dẫn chuyển khoản</h2>
              <ol className="mt-2.5 sm:mt-4 flex flex-col gap-2.5 sm:gap-3.5">
                {STEPS.map((s, i) => (
                  <li key={i} className="flex gap-2.5 sm:gap-3">
                    <span className="mt-0.5 size-5 sm:size-6 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-sans font-bold text-[0.6875rem] sm:text-xs">
                      {i + 1}
                    </span>
                    <span className="font-sans text-[0.8125rem] sm:text-sm leading-snug sm:leading-relaxed text-neutral-600">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Lưu ý */}
            <div className="flex gap-2.5 rounded-2xl bg-blue-50 border border-blue-400/30 p-3.5 sm:p-4">
              <Info size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="font-sans text-[0.8125rem] sm:text-sm leading-snug sm:leading-relaxed text-neutral-600">
                <span className="font-semibold text-blue-800">Lưu ý:</span> Gói Premium sẽ được{' '}
                <span className="font-semibold text-neutral-800">kích hoạt tự động sau 5–10 phút</span>. Nếu quá 10 phút vẫn
                chưa thấy, bạn chỉ cần tắt ứng dụng và mở lại nhé!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA xác nhận — dính đáy */}
      <div className="shrink-0 w-full px-4 sm:px-8 pb-6 sm:pb-5 pt-3 sm:pt-4 flex justify-center border-t border-neutral-200/70 bg-white">
        <button
          type="button"
          onClick={() => router.push('/premium/success')}
          className="w-full max-w-[21.4375rem] sm:max-w-[24rem] h-12 sm:h-14 rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] text-white flex items-center justify-center font-sans font-semibold text-base active:translate-y-[0.0625rem]"
        >
          Xác nhận thanh toán bank
        </button>
      </div>
    </div>
  );
}

/** QR giả lập (SVG) — finder pattern 3 góc + module ngẫu nhiên tất định. */
function QrCode() {
  const N = 25;
  const cell = 5;
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
  };
  const finderOn = (r: number, c: number) => {
    const box = (br: number, bc: number) => {
      const lr = r - br;
      const lc = c - bc;
      if (lr < 0 || lr > 6 || lc < 0 || lc > 6) return false;
      const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6;
      const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
      return ring || core;
    };
    return box(0, 0) || box(0, N - 7) || box(N - 7, 0);
  };
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c)) {
        if (finderOn(r, c)) cells.push({ r, c });
      } else if (((r * 7 + c * 13 + r * c) % 3) === 0) {
        cells.push({ r, c });
      }
    }
  }
  return (
    <svg className="w-32 sm:w-40 h-auto" viewBox={`0 0 ${N * cell} ${N * cell}`} shapeRendering="crispEdges">
      <rect width={N * cell} height={N * cell} fill="#fff" />
      {cells.map(({ r, c }, i) => (
        <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0F172A" />
      ))}
    </svg>
  );
}
