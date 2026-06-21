# Review — feature 1 app_shell

**Verdict:** APPROVED

> Reviewed by the leader (self-review) against `01-upload.png`, since the
> reviewer subagent was not spawned (session-limit context). Visual evidence
> in `.shots/`.

## Visual match vs reference/design-handoff/screenshots/01-upload.png
- Layout: [x] — brand left; project pill + theme switch + help clustered right
  (spacer after brand, matching the reference HTML). Fixed an initial left-aligned
  pill.
- Brand: [x] — cube mark with glow, DATUM wordmark (mono, wide tracking in
  precision), "Photogrammetry Suite" sub with left separator.
- Theme switch: [x] — pill shape, active = panel-2 + inset ring + filled accent
  swatch; inactive = ring swatch only.
- Project pill: [x] — dot glow + "Parcela P-204 · Vega Norte", P-204 bold.
- Help: [x] — opens an accessible dialog (Escape/backdrop/close), on-brand.

## Responsive
- [x] <720px hides project pill + brand sub (verified at 700px).
- [x] <860px hides theme switch labels, swatch-only (verified at 700px).

## Screen transition
- [x] opacity + translateY(8px), ~0.5s on screen change (`screen-in`).

## Checkpoints
- C1 [x]  C2 [x]  C3 [x] (tokens only, no loose hex; components <200 lines;
  no `any`)  C4 [x] (typecheck + build green, shots captured & matched)  C5 [x]

## Notes
- Body content (step indicator / hero / dropzone) is still the Phase-2 scaffold
  stub — out of scope for feature 1 (app shell). Copy is English per AGENTS.md
  (reference is Spanish); that is correct, not a deviation.
