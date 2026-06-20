# CHECKPOINTS — Final-state evaluation

> In multi-agent systems you don't evaluate the path, you evaluate the
> destination. These are the objective checkpoints a judge (human or AI) uses
> to decide if the project is healthy. The reviewer marks `[x]`/`[ ]` and
> blocks the close if any box in C1–C5 is empty.

## C1 — The harness is intact

- [ ] Base files exist: `AGENTS.md`, `feature_list.json`, `CHECKPOINTS.md`,
      `progress/current.md`.
- [ ] The 3 docs exist: `docs/architecture.md`, `docs/conventions.md`,
      `docs/verification.md`.
- [ ] `node scripts/verify.mjs --quick` exits 0.

## C2 — State is coherent

- [ ] At most one feature is `in_progress` in `feature_list.json`.
- [ ] Every `done` feature meets its `acceptance` and (if a UI feature) matches
      its `reference_shot`.
- [ ] `progress/current.md` is the empty template or describes the active
      session only (no leftovers from previous sessions).

## C3 — Code respects the architecture

- [ ] `src/` keeps to the layers in `docs/architecture.md`
      (store / theme / screens / viewer / components / lib).
- [ ] No loose hex/px that duplicates an existing design token.
- [ ] Numeric data renders in the mono font.
- [ ] No `any` without justification; no component over ~200 lines.
- [ ] No stray `console.log` debug; no TODOs without context.

## C4 — Verification is real (visual + typecheck)

- [ ] `npm run typecheck` and `npm run build` are green.
- [ ] `.shots/<screen>-<theme>.png` was captured for the touched screen(s).
- [ ] The capture visually matches the feature's `reference_shot`
      (layout, typography, color, states) — cite specific deltas if not.
- [ ] Any pure logic in `lib/` has a passing Vitest test.

## C5 — The session closed well

- [ ] No suspicious untracked files (`.shots/`, `dist/`, `node_modules/` are
      gitignored and stay out of commits).
- [ ] `progress/history.md` has an entry for this session.
- [ ] The worked feature is reflected in its correct status.
- [ ] Commit authored as `JavattJones`, conventional message.

---

**How to use:** the reviewer agent (`.claude/agents/reviewer.md`) walks every
box, marks it, and rejects the close while any C1–C5 box is empty.
