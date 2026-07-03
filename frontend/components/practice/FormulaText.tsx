/**
 * Render chuỗi có "___" (ô điền khuyết) → thay bằng ô gạch nét đứt cho đẹp.
 * Vd "___ + 人" → [ô trống] + 人.
 */
export function FormulaText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(_+)/);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        /^_+$/.test(p) ? (
          <span
            key={i}
            aria-hidden
            className="inline-block align-middle mx-1.5 h-[1.4em] w-11 rounded-lg border-2 border-dashed border-primary-400 bg-primary-100/70"
          />
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
