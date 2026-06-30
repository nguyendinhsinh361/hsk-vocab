# UI/UX essentials — distilled & cited

The highest-value, broadly-agreed UI/UX practices, synthesized from authoritative primary sources (NN/g, Laws of UX, W3C/WCAG, Apple HIG, Material Design 3, Baymard, DTCG). Use this as the "ground truth" layer behind `principles.md` and `design-tokens.md`. Numbers are concrete; sources are listed at the bottom.

## Contents
1. Nielsen Norman Group — 10 usability heuristics
2. Laws of UX
3. Refactoring UI — core moves
4. Accessibility & platform standards (hard numbers)
5. Forms & checkout (Baymard)
6. Current practice 2025–2026 (tokens, AI UI, motion, dark mode, thumb-zone)
7. EdTech / learning UX
8. Confidence notes & sources

---

## 1. Nielsen Norman Group — 10 usability heuristics

Jakob Nielsen's 10 heuristics (1994, unchanged) — the most-cited usability baseline. Check any interface against them:

1. **Visibility of system status** — keep users informed with timely feedback.
2. **Match between system and real world** — use the user's language and real-world conventions, not internal jargon.
3. **User control and freedom** — provide a clearly marked "emergency exit" (undo/redo).
4. **Consistency and standards** — follow platform/industry conventions; same word = same thing.
5. **Error prevention** — eliminate error-prone conditions or confirm before commit (better than good error messages).
6. **Recognition rather than recall** — make options visible; don't force users to remember across screens.
7. **Flexibility and efficiency of use** — accelerators (shortcuts) for experts, hidden from novices.
8. **Aesthetic and minimalist design** — every extra unit of information competes with and weakens the relevant ones.
9. **Help users recognize, diagnose, recover from errors** — plain language (no codes), name the problem, suggest a fix.
10. **Help and documentation** — searchable, task-focused, concise, concrete steps.

## 2. Laws of UX

| Law | Core idea | Design implication |
|---|---|---|
| Jakob's Law | Users spend most time on *other* apps | Match familiar conventions; innovate only when worth the switching cost |
| Fitts's Law | Acquisition time depends on target distance + size | Make targets large and close; full-width CTAs are near-impossible to miss |
| Hick's Law | Decision time grows with number/complexity of choices | Limit and chunk options; progressive disclosure |
| Miller's Law | ~7±2 items in working memory (practical limit closer to 3–6) | Chunk information into meaningful groups |
| Tesler's Law | Every system has irreducible complexity | Absorb complexity into the product, don't dump it on the user |
| Aesthetic-Usability Effect | Pleasing designs are *perceived* as more usable | Visual polish builds trust and tolerance for minor flaws |
| Peak-End Rule | Experience judged by its peak + its end | Design a deliberate peak moment and a strong ending |
| Doherty Threshold | Productivity soars when system responds in <400ms | Keep interactions under ~400ms; use progress/optimistic UI when slower |
| Serial Position Effect | First and last items are best remembered | Put key items at the start or end of lists |
| Postel's Law | Be liberal in what you accept, strict in what you send | Accept varied/messy input (dates, phone formats), output cleanly |

## 3. Refactoring UI — core moves

- Build hierarchy with **font weight + color**, not size alone (over-relying on size makes primary too big, secondary too small).
- Create hierarchy by **de-emphasizing** secondary/tertiary elements (e.g., grey) rather than emphasizing everything.
- Design with **one accent color + a range of greys**; use color sparingly to emphasize.
- **Avoid pure black** text/borders (use a slightly lighter shade); use **subtle, not harsh, shadows** for depth/elevation.
- **Limit choices**: a few font families, a constrained/consistent spacing system — no arbitrary values.
- **Streamline forms**: remove unnecessary fields, use clear descriptive labels, give designs generous whitespace.

## 4. Accessibility & platform standards (hard numbers)

**WCAG 2.2:**
- **Contrast (1.4.3, AA):** text ≥ **4.5:1**; large text (≥18pt / ≥14pt bold ≈ 24px / 18.5px) ≥ **3:1**.
- **Non-text contrast (1.4.11, AA):** UI components & graphical objects ≥ **3:1**.
- **Target size minimum (2.5.8, AA):** ≥ **24×24 CSS px** (with spacing exception).
- **Target size enhanced (2.5.5, AAA):** ≥ **44×44 CSS px**.
- **Focus appearance (2.4.13, AAA):** focus indicator ≥ 2px-thick perimeter and ≥ 3:1 contrast between focused/unfocused states.
- Contrast ratio = (L1+0.05)/(L2+0.05), range 1:1–21:1; relative luminance L = 0.2126R + 0.7152G + 0.0722B.

**Apple HIG:** controls hit region ≥ **44×44 pt** (60×60 pt on visionOS); default Body text **17 pt**; support Dynamic Type.

**Material Design 3:** touch targets ≥ **48×48 dp** (≈9mm); **8 dp** spacing grid; accessible color pairs meet **3:1**; type scale = 5 roles × 3 sizes (15 styles).

**Practical synthesis:** AA is the floor (24px targets, 4.5:1 text). For confident cross-platform UI use **≥44–48px** touch targets, **4.5:1** body contrast, **3:1** for large text and UI components, and an always-visible focus ring.

## 5. Forms & checkout (Baymard Institute)

- Documented **average cart-abandonment ≈ 70.2%** (across 50 studies).
- Top *fixable* abandonment reason: **39%** leave because extra costs (shipping/tax/fees) are too high; **19%** because forced account creation; **18%** because checkout too long/complicated.
- Average checkout = **5.1 steps / 11.3 form fields** (2024), but most need only **~8 fields**; an ideal flow is **7–8 fields**.
- Use a **single "Full Name" field** (with two name fields, 42% of users mis-type into "First Name"; a single field → only 4% hesitate).
- Hide **"Address Line 2"** behind a link (30% of users stall on it; 75% of sites don't hide it).
- Fixing solvable checkout issues can lift large-site conversion by **~35%**.

## 6. Current practice 2025–2026

**Design tokens / systems:**
- W3C **Design Tokens Format (DTCG)** reached its first stable version (**2025.10**, Oct 2025): vendor-neutral JSON; properties prefixed with `$` (`$value`, `$type`).
- Three-tier architecture: **primitive** (raw, e.g. `blue-600 = #1A73E8`) → **semantic** (intent, e.g. `color-text-primary`) → **component**.
- Name semantic tokens by **intent, not value** (`color-text-primary`, not `color-blue-500`) — value-named tokens break when the brand changes.

**AI-native UI (NN/g):**
- Generative AI is treated as the first genuinely new interaction paradigm in ~60 years; map human needs (clarity, control, confidence) to AI realities (non-determinism, opacity, delay).
- **Lead with the answer**, not conversational filler; use **progressive disclosure** for extra detail and follow-up prompts.
- **Stream** responses to cut perceived latency (target time-to-first-token ~200–500ms). Nielsen response limits: **0.1s** = instant, **1s** = keeps flow, **10s** = attention limit.

**Motion / microinteractions:**
- Small components (buttons) ~**100–200ms**; larger elements ~**400ms**; transitions >~400ms feel slow on mobile (Material).
- Use ease-in-out / "emphasized" easing for most transitions; quick standard easing for small utility transitions.
- Honor **`prefers-reduced-motion`**: disable/tone down non-essential motion (large movement, parallax, sliding) — fades/color transitions are safer (mitigates vestibular triggers). Don't remove motion essential to meaning.

**Dark mode:**
- Use dark grey (e.g. **#121212**), not pure black, for surfaces — supports elevation and reduces strain.
- **Desaturate** colors for dark backgrounds (saturated hues vibrate on dark).
- Offer a **theme choice** — ~1/3 of users still prefer/switch to light depending on task & lighting.

**Mobile thumb-zone (Hoober, 1,300+ users):** 49% hold one-handed, 36% cradle, 15% two-handed. Put primary actions & navigation in the **bottom-center "easy reach" zone**; top corners are hard to reach.

## 7. EdTech / learning UX

**Cognitive load (Sweller) + minimizing it (NN/g):** three load types — intrinsic (task), extraneous (bad presentation), germane (learning). **Minimize extraneous load**: avoid clutter, build on existing mental models, and offload memory (show pictures, re-display entered info, set smart defaults). Chunk info (Miller; practical 3–6).

**Mayer's multimedia principles (most actionable for screens):**
- **Coherence** — exclude extraneous material (decorative graphics, background music).
- **Signaling** — add cues (arrows, highlights, bold) to mark essential structure.
- **Redundancy** — graphics + narration beats graphics + narration + identical on-screen text.
- **Modality** — graphics + spoken narration spreads load across channels.
- **Segmenting** — break content into bite-size, learner-paced steps.
- **Spatial contiguity** — place feedback next to the relevant question; keep related text + visuals together.

**Motivation (Self-Determination Theory — autonomy, competence, relatedness):** design to satisfy all three; note they can conflict (a step-by-step wizard raises competence but lowers autonomy) — user-test to prioritize.

**Gamification — use with care:**
- A meta-analysis found gamification positively affects perceived **autonomy and relatedness** but has **minimal effect on competence**, with a small overall effect size.
- **Overjustification effect:** extrinsic rewards (points/badges) can *undermine* existing intrinsic motivation — don't gamify learners who are already motivated.
- **Variable reward schedules** (Skinner) sustain engagement more than fixed; dopamine peaks at *anticipation* — the basis of streaks/notifications (use ethically, avoid dark patterns).

**Feedback & streaks:**
- Feedback timing is **context-dependent**: applied classroom quizzes generally favor **immediate** feedback; some lab/transfer studies favor delayed. A 2024 medical-education study found immediate and delayed feedback equally beneficial in formative MCQs. Default to **immediate, multi-signal** feedback for in-app quizzes.
- Streak mechanics leverage loss aversion: Duolingo reports a "streak wager" ~**+14% day-14 retention** and that Streak Freeze reduced churn — *vendor/case-study figures, not independently verified.*

## 8. Confidence notes & sources

**High confidence (primary sources):** WCAG 2.2 numbers (w3.org), Apple HIG, Material 3, NN/g heuristics & articles, Baymard figures, Laws of UX definitions, DTCG spec.

**Medium / treat as indicative:** Refactoring UI tips (book is paywalled; some summarized via a secondary write-up); the "no grey text on colored backgrounds" tip is well-known but wasn't confirmed from a free primary source. Duolingo retention numbers are vendor/case-study claims. Miller's 7±2 is widely cited but the practical limit is closer to 3–6.

**Sources:**
- NN/g 10 heuristics — https://www.nngroup.com/articles/ten-usability-heuristics/
- Minimize cognitive load — https://www.nngroup.com/articles/minimize-cognitive-load/
- Working/external memory — https://www.nngroup.com/articles/working-memory-external-memory/
- Autonomy/competence/relatedness — https://www.nngroup.com/articles/autonomy-relatedness-competence/
- GenAI UX & chatbot guidelines — https://www.nngroup.com/articles/genai-ux-research-agenda/ , https://www.nngroup.com/articles/ai-chatbots-design-guidelines/ , https://www.nngroup.com/articles/less-chat-more-answer/
- Response-time limits — https://www.nngroup.com/articles/response-times-3-important-limits/
- Dark mode — https://www.nngroup.com/articles/dark-mode/
- Laws of UX — https://lawsofux.com/ (jakobs-law, fittss-law, hicks-law, millers-law, teslers-law, aesthetic-usability-effect, peak-end-rule, doherty-threshold, serial-position-effect, postels-law)
- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/Understanding/ (contrast-minimum, non-text-contrast, target-size-minimum, target-size-enhanced, focus-appearance)
- WCAG animation / reduced motion — https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html , https://www.w3.org/WAI/WCAG21/Techniques/css/C39 , https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Apple HIG — https://developer.apple.com/design/human-interface-guidelines/ (accessibility, buttons, typography)
- Material Design 3 — https://m3.material.io/ (structure, layout/spacing, accessible-design, typography, motion/easing-and-duration) ; dark theme — https://m2.material.io/design/color/dark-theme.html
- Baymard — https://baymard.com/lists/cart-abandonment-rate , https://baymard.com/blog/checkout-flow-average-form-fields
- Refactoring UI — https://www.refactoringui.com/ (+ summary: https://medium.com/design-bootcamp/top-20-key-points-from-refactoring-ui-by-adam-wathan-steve-schoger-d81042ac9802 )
- Design tokens — https://www.designtokens.org/tr/drafts/format/ , https://www.w3.org/community/design-tokens/ , https://styledictionary.com/info/dtcg/
- Thumb-zone — https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/
- Mayer's multimedia principles — https://www.digitallearninginstitute.com/blog/mayers-principles-multimedia-learning
- Gamification meta-analysis — https://link.springer.com/article/10.1007/s11423-023-10337-7
- Overjustification effect — https://en.wikipedia.org/wiki/Overjustification_effect
- Feedback timing — https://asmepublications.onlinelibrary.wiley.com/doi/full/10.1111/medu.15287
- Duolingo streaks (case study) — https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo
