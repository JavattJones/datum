# Verification — how to prove the work is done

> Golden rule: the agent doesn't say "it works", it **shows** it. For a hi-fi
> UI the proof is visual — the screenshot **is** the test.

## Why visual is the primary level

DATUM is a pixel-perfect recreation of `reference/design-handoff/`. A green
typecheck says the code compiles; it says nothing about whether the screen
looks right. So the judge of "done" is a **screenshot compared against the
reference**, not a unit test.

## Levels

### Level 1 — Structural + typecheck (always)

```bash
node scripts/verify.mjs --quick
```
Checks the harness base files, the `feature_list.json` invariant (≤1
`in_progress`), and `tsc --noEmit`. Must be green before any visual work.

### Level 2 — Visual capture (mandatory to close a UI feature)

```bash
npm run dev      # in one shell (leave running)
npm run shoot    # captures .shots/<screen>-<theme>.png
```
Then **open** the relevant `.shots/*.png` and the feature's `reference_shot`
(from `feature_list.json`, under `reference/design-handoff/screenshots/`) and
compare:

- Layout & spacing (positions, sizes, gaps match)
- Typography (family, weight, size, tracking; numeric data is mono)
- Color (tokens, accent, panels, strokes per the active theme)
- States present in the reference (active/hover/badges)

A feature is **not** `done` if its screen doesn't match its `reference_shot`.

### Level 3 — Full verify (before marking done)

```bash
node scripts/verify.mjs      # structural + typecheck + build + shoot (if dev server up)
```
Equivalent: `npm run verify`. Must end with `[OK] Verification passed.`

### Level 4 — Logic unit tests (when applicable)

Pure logic in `lib/` (metrics, geo math) gets Vitest tests covering the happy
path and at least one error path. UI components are verified visually, not via
DOM-snapshot tests.

## Anti-patterns

- ❌ "I added the component, it should look right." → no screenshot, not done.
- ❌ Marking `done` with a screen that visibly diverges from `reference_shot`.
- ❌ Closing with `tsc`/`build` red.
- ❌ Leaving simulated data on the production path (Phase 6).

## Final gate before closing a feature

1. `node scripts/verify.mjs` → `[OK] Verification passed.`
2. `.shots/<feature>` visually matches its `reference_shot`.
3. `feature_list.json` status set to `done`; session summary appended to
   `progress/history.md`; `progress/current.md` reset to the template.
