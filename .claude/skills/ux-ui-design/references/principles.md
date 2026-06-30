# UX/UI principles (with the "why")

Research-backed principles that justify UI decisions. Each ends with the concrete UI lever it implies. EdTech examples throughout. Read the relevant entries when designing or reviewing; don't apply mechanically — understand the reason and adapt.

## Table of contents

1. Cognitive load
2. Affordances & signifiers
3. Jakob's Law (conventions)
4. Fitts's Law (size & distance)
5. Information architecture
6. Visual hierarchy
7. Micro-interactions
8. Typography
9. Color & accessibility
10. Whitespace
11. UX writing
12. Peak-End Rule (memory)

---

## 1. Cognitive load

Working memory holds ~4 chunks (Miller's "7±2" revised down). Hick's Law: decision time grows with the log of the number of choices (Iyengar's jam study — 6 jams converted ~10× better than 24). Three loads: intrinsic (the task itself), extraneous (caused by bad design — eliminable), germane (the productive effort of learning).

**UI lever:** Limit visible choices; chunk related items; prefer recognition over recall; drive extraneous load toward zero so the user spends mental budget on the actual task. In EdTech, every confusing menu or vague icon steals brain from learning.

## 2. Affordances & signifiers

Affordance = what an object can do; signifier = the visible cue that reveals it (Norman). Perceived ≠ real affordance → confusion. Ghost buttons (border only, no fill) get tapped ~37% less than solid buttons.

**UI lever:** Make primary actions look pressable (fill + shadow/contrast). Avoid false affordances (bold text that looks like a link but isn't). If users need a tutorial to find a feature, that's a design bug.

## 3. Jakob's Law (conventions)

Users spend 99% of their time in other apps and carry those expectations over. Breaking a convention imposes a switching cost: unlearn + relearn + error + trust.

**UI lever:** Match familiar mental models (bottom tab bar, top-right streak à la Duolingo, swipe-right back, swipe-down to dismiss). Innovate only where the benefit clearly exceeds the total switching cost.

## 4. Fitts's Law (size & distance)

T = a + b·log₂(2D/W). Bigger and closer targets are faster and produce fewer mis-taps. Mobile: ~49% use one thumb, so the bottom third is the natural reach ("thumb zone"). Minimums: iOS 44×44pt, Android 48×48dp, WCAG 24×24px (44 recommended). Raising a button from 42→72px once lifted mobile checkout conversion 32%.

**UI lever:** Primary CTA full-width in the bottom third on mobile. Keep frequent actions inside the thumb zone; push destructive actions away.

## 5. Information architecture

Organize content to match the user's mental model, not the database schema. ("I want to talk about daily routines" ≠ "Grammar → Tense → Present Simple"). Validate with card sorting and tree testing.

**UI lever:** Group lessons/content the way learners think; label in user language ("Review" not "flashcard_table"). If users ask "where is that feature?", fix IA, not onboarding.

## 6. Visual hierarchy

Pre-attentive attributes are processed in <250ms. Strength order: **Size > Weight > Color > Spacing/Position.** F-pattern for content/feeds; Z-pattern for single-CTA screens. Serial position effect: first and last list items are remembered best.

**UI lever:** Give each screen one clear focal point. Put "continue learning" first in lists; put dangerous actions (delete account) last or in a separate section. Randomize quiz answer positions.

## 7. Micro-interactions

Framework (Saffer): Trigger → Rules → Feedback → Loops/Modes. The four experiential phases: anticipation (before) → preview (during gesture) → commit (on release) → resolution (settling). Operant conditioning (Skinner): immediate feedback reinforces the behavior loop; missing feedback breaks habit formation and causes double-submits.

**UI lever:** Never ship an action without feedback. On a correct hard answer: animation + checkmark + haptic, scaled to difficulty. Build feedback that happens *during* a gesture, not only on release.

## 8. Typography

Legibility (each character distinct) vs readability (comfortable sustained reading). Body ≥16px (≥18px for learning), never <12px. Line-height 1.4–1.6 body, 1.1–1.3 headings. Line length 45–75 chars (30–50 mobile). Raising body 14→18px once raised time-on-page 14%.

**UI lever:** Set a type scale; protect reading comfort; tighten heading line-height, loosen body. Reading fatigue ends sessions early.

## 9. Color & accessibility

~8% of men have color vision deficiency (mostly red-green). Two rules: (1) color is never the only carrier of meaning — pair with icon/text/shape; (2) contrast ≥4.5:1 body, ≥3:1 large text/UI components (WCAG AA). Fixing accessibility after launch costs 50–100× more than designing it in.

**UI lever:** Answer feedback = color + icon + text ("✓ Correct!" / "✗ Try again"). Check contrast with a tool. Treat AA as a baseline, not a nice-to-have.

## 10. Whitespace

Negative space is a tool, not waste (Gestalt: proximity, figure/ground). It creates perceptual grouping and reduces extraneous load. Standardize with a spacing scale (multiples of 8px). Adequate whitespace raises perceived professionalism/trust ~18% with identical content.

**UI lever:** Use macro whitespace to structure sections and micro whitespace (padding, gaps) inside components. No "random" 14/22px values — snap to the scale. Defend whitespace against "fill the empty space" requests.

## 11. UX writing

Microcopy is UI. The 5 Cs: Clear, Concise, Consistent, Considerate, plus context. Bad microcopy kills conversion silently — users stop without knowing why.

**UI lever:** Outcome-oriented labels ("Start lesson"), errors that explain the fix, empty states with a next action. See `ux-writing.md`.

## 12. Peak-End Rule (memory)

Kahneman: people judge an experience by its emotional peak and its end, not the average; duration is largely neglected. A 10-minute lesson with a strong peak + end beats a 5-minute one with neither.

**UI lever (EdTech-critical):** Deliberately design (a) a peak moment — celebrate correct-on-hard, streak milestones, unlocks; and (b) the end screen — make finishing a lesson feel rewarding, with a clear next step. These two points drive D7 retention more than the 80% in the middle.
