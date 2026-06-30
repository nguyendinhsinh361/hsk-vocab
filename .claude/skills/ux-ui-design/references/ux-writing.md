# UX writing — microcopy patterns

Words are UI. Write to help the user accomplish a goal with minimal friction, not to persuade. Understand the user's emotional state before writing. Every piece of copy comes with a reason.

## The 5 Cs

- **Clear** — no ambiguity; the user shouldn't have to guess. ("Continue" → "Continue to payment".)
- **Concise** — short enough to scan, long enough to inform.
- **Consistent** — same term for the same thing everywhere ("Review" vs "Practice" vs "Flashcards" — pick one).
- **Considerate** — match the user's emotional state; don't be jokey in errors.
- **Context** — the same word means different things in different places; write for the specific moment.

## Patterns by component

### Buttons / CTAs
Describe the outcome, not the mechanism. Max ~3 words where possible.

- Don't: "OK", "Submit", "Yes"
- Do: "Start lesson", "Save changes", "Delete this lesson"

Why: outcome labels tell the user what will happen and reduce hesitation (and accidental destructive taps).

### Error messages
Say what went wrong AND how to fix it. Never blame the user; never just "Error".

- Don't: "Error occurred", "Invalid input", "Oops!"
- Do: "That email is already registered. Log in instead?" / "Password needs at least 8 characters."

Why: users are frustrated, not amused — they need a path forward, not personality.

### Empty states
Always include a next action; never a blank screen or a flat "No data".

- Don't: (blank), "No lessons"
- Do: "No lessons yet. Start with Present Simple →"

Why: empty states are an onboarding opportunity, not a dead end.

### Confirmation dialogs
State the consequence in the button, not just the title.

- Don't: title "Are you sure?" + buttons "Yes / No"
- Do: title "Delete this lesson?" + buttons "Delete lesson / Keep"

### Loading states
Set expectations; reassure progress. Prefer specific over generic when you can ("Checking your answers…" > "Loading…"). For multi-second waits, show progress or skeletons.

### Tooltips / helper text
Explain the non-obvious; don't restate the label. Keep to one short sentence.

### Notifications
Lead with value to the user, not the system event. "Your streak is about to reset — finish one lesson to keep it" > "Reminder".

### AI / generated content
Be honest about uncertainty and give the user control ("Here's a draft — edit anything").

## Psychology cues (use sparingly and honestly)

- **Endowment effect**: "Your dashboard" engages more than "The dashboard".
- **Loss aversion**: streak-protection framing works because losing a streak hurts more than gaining one feels good — but don't manufacture dark-pattern anxiety.
- **Cognitive fluency**: simpler words are perceived as more true and easier — write plainly.

## Localization & accessibility notes

- Leave room for text expansion: German/French can run 30–40% longer than English; Vietnamese diacritics affect line height. Don't pin layouts to exact English string widths.
- Write link text that makes sense out of context (screen readers read links in isolation): "View lesson details" not "click here".
- Avoid idioms that don't translate; prefer literal, friendly phrasing.
