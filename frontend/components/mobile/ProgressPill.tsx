/**
 * Thanh tiến trình onboarding — chia theo 4 bước (intro/example/level/choose-root).
 * `fillPercent`: 25 / 50 / 75 / 100. Chỉ hiện thanh gradient, không chữ.
 */
export function ProgressPill({ fillPercent = 25 }: { fillPercent?: number }) {
  return (
    <div className="w-[21.4375rem] max-w-full h-3 rounded-full bg-neutral-200 overflow-hidden">
      <div
        className="h-full rounded-full transition-all bg-progress-teal"
        style={{
          width: `${fillPercent}%`,
          boxShadow: 'inset 0 0.25rem 0.25rem 0 rgba(247,248,248,0.25)',
        }}
      />
    </div>
  );
}
