# Review mode — critique rubric

Use when the user shares an existing design (screenshot, Figma frame, live screen, or description) and wants feedback. Be specific and kind: name the issue, the reason (tie to a principle), and a concrete fix. Prioritize by impact, not by how easy something is to fix.

## Output structure

Always organize the critique as:

```
## Critical (fix before ship)
- [Issue] — why it matters (principle) — recommended fix

## Improve (worth doing)
- [Issue] — why — fix

## Working well (keep)
- [What's good and why]
```

Starting with what works is fine, but lead the actionable part with Critical. Give severity, and where useful, effort-to-fix.

## What to inspect (walk the five layers)

Go top-down, from cognitive foundation to pixels.

### 1. Cognitive & structure
- Too many choices/elements competing at once? (cognitive load, Hick's Law)
- Does it follow familiar conventions, or break them without payoff? (Jakob's Law)
- Does the structure match how users think, or how the system stores data? (IA)
- Is there one clear focal point, or does everything shout equally? (hierarchy)

### 2. Layout & reach
- Primary action obvious and in the thumb zone (mobile)? (Fitts's Law)
- Touch targets ≥44×44px with ≥8px spacing?
- Reading path sensible (F or Z pattern as appropriate)?

### 3. Visual execution
- Type ≥16px (≥18px for learning)? line-height ~1.5? line length 45–75?
- Spacing on an 8px scale, or random values?
- Contrast ≥4.5:1 body / ≥3:1 large & UI? checked, not eyeballed.
- Is color ever the *only* signal? (must pair with icon/text/shape)
- Enough whitespace to group and breathe?

### 4. Interaction & motion
- Are all states present (hover/focus/active/disabled/loading/empty/error)?
- Does every action give immediate feedback? (micro-interactions)
- Motion: sensible durations, GPU-only properties, reduced-motion fallback?
- Visible keyboard focus for accessibility?

### 5. Copy & memory
- Buttons outcome-oriented? errors explain the fix? empty states have a next action?
- (EdTech) Are the peak moment and the end screen deliberately designed?
- (EdTech) Is answer feedback multi-signal (color + icon + text)?

## Tone

- Be direct and honest — the user wants to ship something good, not be flattered.
- Every criticism gets a concrete, actionable fix.
- Quantify where possible ("body text looks ~13px; bump to 16px" beats "text is small").
- Acknowledge constraints; offer the highest-impact change first if time/effort is limited.

## Quick triage question

When reviewing any list/menu/screen, ask: "What is the single most important thing the user should do or remember here — and is the design making that the most prominent, reachable, and memorable element?" Most issues surface from that one question.
