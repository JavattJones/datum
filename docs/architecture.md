# Architecture — what "good work" means in DATUM

> This document defines the quality bar. The reviewer agent evaluates code
> against it. If it isn't here, it isn't a requirement.

## Layers (and only these)

```
src/
├── store/      Zustand global state. The single source of truth for UI state.
├── theme/      Theme metadata. Token VALUES live in index.css as CSS variables.
├── screens/    One component per screen (Upload / Processing / Viewer). Compose, don't compute.
├── viewer/     react-three-fiber scene + 3D-only helpers. No DOM-layout concerns here.
├── components/ Shared, reusable UI primitives (TopBar, buttons, toggles, segmented).
└── lib/        Side-effectful services: pipeline client, metrics, geo helpers.
```

Do not introduce new layers (services/, repositories/, contexts/) until a
feature in `feature_list.json` documents a concrete need.

## Principles

1. **Design tokens are centralized.** Colors, radii, spacing and fonts come from
   the CSS variables in `src/index.css` (`var(--accent)`, `bg-panel`, …). Never
   hardcode a loose hex value in a component — if a token is missing, add it to
   the token layer first.
2. **Numeric data is always monospaced.** Surfaces, elevations, coordinates,
   percentages → mono font (`.mono` / `font-mono`). This is a domain rule, not a
   preference.
3. **3D / pipeline logic stays out of the UI.** Scene math, geometry and backend
   calls live in `viewer/` and `lib/`. Screens and components render state, they
   don't compute it.
4. **State lives in the store.** Cross-screen state (screen, theme, photos,
   processing, viewMode, layers, location, model) is read from `useAppStore`.
   Local-only UI state (hover, a single input) may stay in the component.
5. **The reference is the spec.** `reference/design-handoff/` is the source of
   truth for layout, tokens and behavior. When in doubt, open it — don't invent.
6. **Production data is never simulated.** Demo geometry/metrics are placeholders;
   Phase 6 wires the real photogrammetry pipeline. Don't leave mocks on the
   production path.

## Data flow

```
photos → lib/pipeline (backend) → mesh(glTF) + metrics(JSON)
                                        │
                                        ▼
                              store (model, processing)
                                        │
                 ┌──────────────────────┼───────────────────────┐
                 ▼                      ▼                        ▼
          UploadScreen          ProcessingScreen          ViewerScreen
                                                          (viewer/ + Inspector)
```

## What NOT to do

- No loose hex/px values that duplicate an existing token.
- No business/scene logic inside JSX of a screen component.
- No component over ~200 lines — split it.
- No `any` without an inline justification comment.
- No new runtime dependency without a documented reason (prefer the stack we have).
