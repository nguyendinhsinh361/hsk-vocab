/**
 * Thanh tiến trình onboarding — chia theo 4 bước (intro/example/level/choose-root).
 * `fillPercent`: 25 / 50 / 75 / 100. Chỉ hiện thanh gradient, không chữ.
 */
export function ProgressPill({ fillPercent = 25 }: { fillPercent?: number }) {
  return (
    <div className="w-[343px] max-w-full h-[12px] rounded-full bg-neutral-200 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${fillPercent}%`,
          backgroundImage: 'linear-gradient(-34.6deg, #12D18E 0%, #71E3BB 100%)',
          boxShadow: 'inset 0px 4px 4px 0px rgba(247,248,248,0.25)',
        }}
      />
    </div>
  );
}
