# Implementation — feature 1 (app_shell)

> Note: the spawned `implementer` subagent hit the account session limit during
> orientation (0 file writes). The leader implemented directly to avoid a second
> cold-start spawn, keeping the harness discipline (visual capture + verify +
> traces).

## Files touched
- `src/components/TopBar.tsx` — rewritten: theme switch is now a **pill**
  (radius 999px, p-3px, gap-2px); brand-mark glow (`accent-line` + `accent-soft`);
  brand-name uses `.brand-name` (0.20em tracking in precision via index.css);
  brand-sub with left separator; project pill with bold `P-204` + dot glow;
  spacer moved to **after the brand** so pill + theme switch + help cluster right
  (matches reference HTML structure); help button opens the dialog.
- `src/components/HelpDialog.tsx` — **new** accessible dialog: backdrop + panel
  (`role=dialog`, `aria-modal`), closes on Escape / backdrop / close button,
  focuses panel on open; content = "What is DATUM" + 3-step flow. Tokens only.
- `src/App.tsx` — active screen wrapped in `<div key={screen} className="screen-enter">`
  so the enter animation retriggers on every screen change.
- `src/index.css` — `.brand-name` tracking (theme-aware), `@keyframes screen-in`
  (opacity + translateY(8px)) + `.screen-enter` (0.5s ease-out).
- `scripts/shoot.mjs` — capture with `animations: 'disabled'` so finite CSS
  animations (screen-in) are fast-forwarded; fixes a race where the screen body
  was caught mid-fade (blank capture). **Harness improvement.**

## Responsive (verified by capture)
- `max-[720px]:hidden` → project pill + brand sub hidden at 700px ✓
- `max-[860px]:hidden` → theme switch labels hidden (swatch-only) at 700px ✓

## Verify output
```
[OK] feature_list.json valid (8 features, 1 in progress)
[OK] tsc --noEmit clean
[OK] vite build
[OK] screenshots written to .shots/
[OK] Verification passed.
```

## Shots captured
- `.shots/upload-precision.png` — top bar vs `screenshots/01-upload.png`
- `.shots/help-dialog.png` — help affordance
- `.shots/topbar-700.png` — narrow breakpoints
- `.shots/viewer-{precision,dark,light}.png` — top bar in context across themes
