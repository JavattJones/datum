# History — append-only session log

> The leader appends one entry per closed session. Newest at the bottom.

---

## 2026-06-20 — Phase 0 scaffold + harness setup

- Scaffolded DATUM: Vite + React 19 + strict TS + Tailwind v4 + Zustand +
  react-three-fiber. Design tokens (3 themes), TopBar, screen router, and
  Upload/Processing/Viewer stubs. `npm run build` green.
- Public repo `JavattJones/datum` created; authored as JavattJones.
- Visual-capture harness: `scripts/shoot.mjs` (Playwright) → `.shots/`.
- Agent harness installed (this commit): `feature_list.json` (7 phases),
  `scripts/verify.mjs`, `docs/`, `CHECKPOINTS.md`, leader/implementer/reviewer,
  `progress/`. Verification backbone is **visual** (screenshots vs reference).
- Next: feature 1 (`app_shell`) — bring the TopBar to pixel-perfect fidelity.

---

## 2026-06-21 — Feature 1 (app_shell) DONE

- TopBar pixel-perfect vs `01-upload.png`: pill theme switch, brand glow + sub
  separator, project pill (P-204 bold), spacer after brand → right cluster.
- New `HelpDialog` (accessible: Escape/backdrop/close, focus on open).
- Screen router transition (`screen-in`: opacity + translateY(8px), 0.5s).
- Responsive verified at 700px: <720 hides pill + brand-sub, <860 swatch-only.
- Harness fix: `shoot.mjs` now captures with `animations:'disabled'` (was racing
  the screen fade-in → blank body).
- `npm run verify` green; reviewer (self) APPROVED. See
  `progress/{impl,review}_app_shell.md`.
- Orchestration note: the `implementer` subagent hit the account session limit
  mid-orientation; the leader implemented directly to avoid a costly re-spawn.
- Next: feature 2 (`upload_screen`).

---

## 2026-06-21 — Feature 2 (upload_screen) DONE

- Upload screen recreated pixel-perfect vs `01-upload.png` (Precision). Split
  into `components/upload/`: `StepIndicator`, `Dropzone`, `ThumbGrid` (each
  <200 lines); `UploadScreen` now composes them.
- `Dropzone`: real drag & drop (`.drag` accent state on dragenter/over,
  cleared on leave/drop), Select photos (primary, camera icon) + Use sample
  set (ghost), hint row (3 accent checks). Icon box panel-2 + stroke per ref.
- `ThumbGrid`: 4:3 tiles with a deterministic (mulberry32-seeded) procedural
  aerial canvas preview, IMG_xxxx mono label + accent check, staggered
  `thumb-pop` animation (new keyframe in `index.css`).
- Upload foot: count/overlap/coverage meta (mono numerals) + Reconstruct 3D
  model button → routes to processing.
- Verified: `tsc --noEmit` + `npm run build` green. Visual captured via system
  Chromium (`/opt/pw-browsers/chromium-1194`) since Playwright's bundled build
  couldn't download in the sandbox — empty + thumbs + foot states all match.
- Next: feature 3 (`processing_screen`).

