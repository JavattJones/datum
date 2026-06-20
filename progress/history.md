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
