# Design tokens & concrete standards

The numeric defaults that turn principles into measurable UI. Use these unless the user supplies their own system. Never invent off-scale values.

## Units & responsiveness (read first)

The px numbers in this file are **reference baselines**. In a real, multi-device project (desktop / tablet / mobile) implement them in **relative units** so the UI scales with the viewport and with the user's font-size/zoom:

- **Type & spacing → `rem`** (relative to root font-size; respects user accessibility settings). At a 16px root: 1rem = 16px, so divide any px figure by 16.
- **Layout widths → `%`, `fr` (grid), `flex`**, plus `max-width`/`min()`/`max()`; avoid fixed px widths/heights. Use `aspect-ratio` for media.
- **Fluid type/spacing → `clamp(min, preferred-vw, max)`** so headings and gaps grow smoothly between breakpoints instead of jumping.
- **Line length → `ch`** (e.g. `max-width: 65ch`).
- **Breakpoints → em/rem**, not px (they track zoom correctly). Design **mobile-first** (`min-width` queries). Consider **container queries** for components that appear in different-width slots.
- **px is allowed only** where the value must stay crisp regardless of scale: 1px borders/hairlines, focus-ring thickness, sometimes shadow offsets.

Why: px font-size and px layout don't respond to the user enlarging text or to different screen sizes — the two things a responsive project must handle.

## Spacing — 8px base scale (ship as rem)

Use steps on an 8px scale (4 as the half-step), expressed in rem:

```
px:  4     8    12     16   24    32   48   64    96
rem: 0.25  0.5  0.75   1    1.5   2    3    4     6
```

- 4px: tight spacing within a component (icon-to-label).
- 8px: default gap between related elements.
- 16px: padding inside cards/buttons; gap between sections within a card.
- 24px: between cards / content blocks.
- 32–48px: major section breaks.

Rule: every padding, margin, and gap is a multiple of the base. Consistent spacing creates a visual rhythm the eye scans faster; random values (14px, 22px) read as "messy" even with good content.

## Type scale

| Role | Mobile | Desktop | Notes |
|---|---|---|---|
| Display / H1 | 28–32px | 32–40px | One per screen |
| H2 | 22–24px | 24–28px | Section titles |
| H3 | 18–20px | 20px | Sub-sections |
| Body | 16px | 16px | Minimum for adults |
| Body (learning) | 18px | 18px | Sustained reading |
| Caption / label | 12–14px | 12–14px | Short labels only |
| Never | <12px | <12px | Inaccessible |

- Line-height: body 1.4–1.6 (use 1.5); headings 1.1–1.3.
- Line length: 45–75 characters (30–50 on mobile).
- Two weights are usually enough (regular 400, medium/semibold 500–600). Use weight for hierarchy, not decoration.

## Color & contrast

- Body text contrast ≥ 4.5:1; large text (≥24px regular or ≥18.66px bold) and UI components ≥ 3:1 — WCAG AA.
- For long reading, #333 on #fff (~12.6:1) is gentler than pure black (#000 on #fff = 21:1).
- Color is never the only signal. Pair with icon, text, or shape. Red-green is the #1 ambiguity (deuteranopia/protanopia).
- Define semantic tokens, not raw hex in components: e.g. `color.action.primary`, `color.feedback.success`, `color.surface.background`. Document what each is *for* ("action.primary = CTAs and interactive elements, not decoration").

### Suggested semantic token set

```
color.surface.background      color.text.primary
color.surface.raised          color.text.secondary
color.border.default          color.text.inverse
color.action.primary          color.feedback.success
color.action.primary.hover    color.feedback.error
color.action.secondary        color.feedback.warning
```

## Touch targets & layout

- Minimum touch target: 44×44px (iOS) / 48×48dp (Android); 8px spacing between adjacent targets.
- Primary CTA: full-width, bottom third of the screen on mobile (thumb zone).
- Push destructive/rare actions out of the thumb zone or into a separate section.
- Mobile viewport for mockups: 390×844 (modern phone). Account for safe areas (notch/home indicator) and tab bar height (~49–56px).

## Radius & elevation

- Radius scale: 4 (inputs/small), 8 (buttons/cards), 12 (large cards), 16 (sheets/modals); full pill only when intentional.
- Elevation via subtle shadow, not heavy drop shadows; reserve the strongest elevation for the most important raised surface (modal > card > flat).

## Motion timing

| Element | Duration |
|---|---|
| Button press / hover | ~100ms (below conscious perception) |
| Tooltip | ~150ms |
| Toggle / small panel | ~200–250ms |
| Modal / sheet | ~300ms |
| Page transition | ~400ms |
| Total choreography budget | ≤700ms |

- Animate only GPU-friendly properties: `transform`, `opacity`, `filter`. Avoid animating `width`/`height`/`top`/`left` (causes jank/layout thrash).
- Easing by product personality: snappy/precise for SaaS & banking; bouncy for playful/kids/EdTech rewards; calm for wellness. Bounce delights in a kids' game but erodes trust in a bank.
- Accessibility: always provide a `prefers-reduced-motion: reduce` fallback that removes large movement (keep subtle opacity if needed). ~35% of adults over 40 have vestibular sensitivity.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Interactive states (every interactive element)

Ship all relevant states, not just default:

- default, hover (pointer devices), focus (visible focus ring — keyboard a11y), active/pressed, disabled, and where relevant loading, error, selected.
- Don't rely on hover for essential info on mobile (no hover). Provide a tap/press equivalent.
