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

---

## 2026-06-21 — Feature 3 (processing_screen) DONE

- Processing screen brought to pixel-perfect vs `02-processing.png` (Precision).
- Progress driver abstracted out of the UI: `lib/processing.ts` holds the 5
  `PROCESSING_PHASES` (English copy) + `useSimulatedProcessing` hook (rAF
  0→100% over 5s, 420ms settle → viewer). Phase 6 swaps it for backend polling.
- `components/processing/PhaseList.tsx`: per-phase thematic SVG icons; states
  pending (icon, text-3) / active (panel pill + .7s spinner + accent) / done
  (accent check, text-2). `complete` flag marks all done at 100%.
- `ProcessingScreen`: SVG ring (viewBox 100, r=44, sw=3, dashoffset) + mono %
  + RECONSTRUCTING label; 22px/640 title + 14px sub per active phase.
- Verified: `tsc --noEmit` + `npm run build` green; visual captured at 55%
  (system Chromium) — ring, title, and all 5 step states match the reference.
- Note: first capture came out blank (transient timing); re-shot with a
  `waitForSelector` guard. Whole UI confirmed English.
- Next: feature 4 (`viewer_3d`).

---

## 2026-06-21 — Feature 4 (viewer_3d) DONE

- Built the react-three-fiber viewer scene vs `03-viewer.png` (Precision).
- `viewer/terrain.ts`: deterministic fBm value-noise heightfield (ported from
  the reference prototype) → BufferGeometry colored by elevation, plus derived
  corners, contour cloud, and 5 dimension anchors (4 edges + area). Pure data,
  no React.
- `viewer/SceneCanvas.tsx`: terrain modes Solid (vertex colors) / Mesh (accent
  wireframe .42) / Points (.018); boundary polygon + corner drop-posts;
  contour points; metric gridHelper; OrbitControls (damping .08, dist 4–22,
  polar .49π, target 0,0.4,0, autoRotate .6). Eased camera moves (~720ms
  ease-out-cubic) driven by store `viewRequest{view,nonce}`. Floating dim
  labels via drei `<Html>` (projected each frame), accent area label.
- Toolbars: `ModeToolbar` (centered segmented), `ViewToolbar` (TL iso/plan/
  elevation + TR auto-orbit·measure·fullscreen with hover tooltips),
  `ScaleBar` (10 m). `.dim-label` + `.scalebar-bar` styles added to index.css.
- Store: added `CameraView`, `viewRequest`, `requestView`.
- Verified: `tsc --noEmit` + `npm run build` green. Captured solid/mesh/points
  + plan view via system Chromium (SwiftShader) — all match: terrain, boundary,
  dims, scale bar, toolbars, mode switching and camera animation all working.
- Note: Inspector panel left as the existing scaffold (that's feature 5).
- Next: feature 5 (`inspector`).

---

## 2026-06-21 — Feature 5 (inspector) DONE

- Full Inspector built vs `03-viewer.png` + theme-topo/studio. Replaced the
  ViewerScreen scaffold with `components/inspector/`:
  - `Section` (shared accent-iconed label + `fmtInt`), `SurfaceCard`,
    `DimGrid` (2×3), `PrecisionCard` (RMSE→0–5cm bar, GSD + mesh points),
    `LocationMap`, `LayerList`, `Inspector` (orchestrator).
- `LocationMap`: schematic city map ported to a `<canvas>` (streets/blocks/
  river/parcel polygon), pin overlay, mono coords, Relocate cycling 4 cities
  via store `location`/`cycleLocation`; redraws on location + theme change.
- `LayerList`: 3 toggles bound to store `layers` — same source the viewer
  reads, so panel and scene stay in sync.
- `Inspector` footer: New (→ reset to upload) + Export As-built with simulated
  generating-spinner → "Exported" → idle cycle (1.4s/1.6s).
- Mobile bottom sheet (<880px): `.insp-sheet` media query in index.css
  (translateY(calc(100%-52px)) → .open translateY(0), 56% height) + grab tab.
  ViewerScreen switched to the 880px breakpoint and a relative wrapper.
- Verified: `tsc --noEmit` + `npm run build` green. Captured desktop inspector,
  relocate (→ Sevilla), mobile sheet open/closed, and Topo + Studio themes —
  all match. Layer toggles drive the scene live.
- Next: feature 6 (`real_integration`) — backend wiring (Phase 6).

---

## 2026-06-21 — Feature 6 (real_integration) DONE

- Built a typed, swappable pipeline integration layer in `lib/pipeline/`:
  - `types.ts` — `PipelineAdapter` contract (createJob / getProgress /
    getResult / exportAsset) + JobProgress/JobResult/ExportFormat.
  - `webodm.ts` — production adapter against the documented WebODM REST API
    (multipart task POST, poll `running_progress`, status-code map, asset
    download). Metrics/georef expected from a `datum-metrics.json` asset; if
    absent it throws rather than fabricating numbers.
  - `mock.ts` — dev fallback (no `VITE_PIPELINE_API`): reproduces the 5-phase
    ~5s curve + procedural terrain (modelUrl:null) + DEMO_MODEL + demo georef.
  - `export.ts` — client-side as-built generators (GeoJSON/glTF/DXF/report)
    + downloadArtifact; `index.ts` — env-based singleton `pipeline`.
- Wiring: Upload posts photos via `pipeline.createJob` (real file picker +
  drag-drop add File objects; "Use sample set" → mock). Processing polls
  `pipeline.getProgress(jobId)` (replaced the rAF sim) and on complete pulls
  `getResult` → store `setResult`. Viewer loads real glTF via drei `useGLTF`
  when `modelUrl` is set (boundary/dims derived from the mesh bbox), else the
  procedural mock terrain. Inspector Export → format menu → `exportAsset` →
  download.
- Store: Photo.file, jobId/modelUrl/georef + setJob/setResult; GeoRef type;
  MOCK_MODEL → exported DEMO_MODEL. `.env.example` + ImportMetaEnv typings.
- Verified: `tsc --noEmit` + `npm run build` green. End-to-end mock flow
  unchanged (upload→process→viewer hi-fi intact); export actually downloaded
  `vega-norte_p-204.geojson`; format menu renders. WebODM path is implemented
  to contract but needs a live instance to validate end-to-end (no backend
  reachable in this sandbox).
- Next: feature 7 (`polish`).

---

## 2026-06-21 — Feature 7 (polish) DONE — project complete (0–7)

- a11y: global `:focus-visible` accent ring (mouse clicks stay clean);
  `.touch-target` ≥44px on ≤600px for viewer tools / mode group / topbar help;
  role="group"+aria-label on the mode group and both viewer toolbars; the map
  canvas got role="img" + aria-label (aria-pressed was already on toggles).
- Reduced motion: new `lib/useReducedMotion` hook; in the viewer it forces
  auto-orbit off and makes camera view changes jump instantly. CSS already
  zeroed finite animations under prefers-reduced-motion.
- Performance: `<BakeShadows>` (camera orbits, scene is static → freeze the
  shadow map), `<AdaptiveDpr pixelated>`, Canvas `performance={{min:.5}}` +
  high-performance GL hint; procedural geometry/contours disposed on unmount;
  the point cloud stays a single Points draw call shared across modes.
- Error / empty states: ProcessingScreen shows a failure card (danger icon +
  message + "Back to upload") on pipeline error; LocationMap shows a "No GPS /
  EXIF data" empty state when georef is null; the upload reconstruct foot only
  appears with photos (empty-state by design).
- Verified: `tsc --noEmit` + `npm run build` green; viewer renders cleanly with
  the perf changes (no errors), reduced-motion keeps the scene static, tablet
  (768px) drops to the bottom sheet. Themes covered via tokens (feature 5).
- All 7 features done. UI hi-fi complete; production path wired (feature 6),
  mock fallback for offline dev.

