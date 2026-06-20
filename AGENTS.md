# 🛰️ DATUM — Development Agent

You are the development agent for **DATUM**: a responsive web app (mobile + desktop) for
**architecture studios** that turns a set of site photographs into a **measurable, georeferenced
3D model** of a plot/terrain. Photos in → photogrammetry pipeline → a navigable 3D model with
metric data (surface, elevations, accuracy), delivered as an **as-built**.

> **Language:** the product, code, comments and docs are in **English**. Talk to Javier in
> **Spanish**.

The hero flow is: **upload photos → process → navigable 3D result**.

---

## Key paths

- **Project:** `C:\Users\javie\Desktop\FOTOMETRIA\`
- **Design source of truth:** `reference/design-handoff/` (hi-fi HTML/CSS/JS + Three.js prototype +
  screenshots). Read `reference/design-handoff/README.md` (full spec) and `IMPLEMENTATION.md`
  (phased plan) before building UI.
- **Obsidian vault (Octopus):** `C:\Users\javie\iCloudDrive\iCloud~md~obsidian\Octopus\`

---

## The problem it solves

Architecture studios need a fast, low-cost way to capture the real state of a site (an *as-built*)
without paying for heavy surveying tools. With only a phone/drone camera they should be able to:

1. **Capture** — shoot 40–300 overlapping photos of the plot.
2. **Reconstruct** — run photogrammetry to get a dense point cloud → textured 3D mesh.
3. **Measure & georeference** — read surface, dimensions, elevations and accuracy (RMSE), and place
   the model on a map as a real-world as-built.
4. **Export** — hand the result to CAD/GIS (DXF, GeoJSON, glTF) or a PDF report.

DATUM wraps these steps in a single, polished web app.

---

## Domain — photogrammetry concepts

The agent must understand and use these precisely:

| Concept | Description |
|---|---|
| **Photogrammetry** | Reconstructing 3D geometry from overlapping 2D photos via feature matching + camera pose estimation. |
| **SfM** (Structure from Motion) | Aligns photos and estimates camera positions + a sparse point cloud. |
| **MVS** (Multi-View Stereo) | Densifies the sparse cloud into a dense point cloud. |
| **Point cloud** | Set of 3D points (sparse or dense) reconstructed from the photos. |
| **Mesh** | Triangulated surface built from the dense cloud; textured by projecting photo color. |
| **GSD** (Ground Sampling Distance) | Real-world size of one pixel on the ground (e.g. 1.4 cm/px) — drives resolution. |
| **RMSE** | Root-mean-square error of the reconstruction vs. control — the model's accuracy (e.g. 1.8 cm). |
| **GCP** (Ground Control Point) | Surveyed point used to scale/georeference the model to real coordinates. |
| **EXIF / GPS** | Photo metadata used for auto-overlap detection and rough georeferencing. |
| **As-built** | The model georeferenced to real-world coordinates (EPSG/CRS) — the deliverable. |
| **Georeferencing** | Placing the model in a coordinate reference system (CRS / EPSG code). |
| **Contours** | Level curves (e.g. every 0.5 m) derived from the mesh elevation. |
| **Footprint / boundary** | The surveyed plot polygon (vertices) overlaid on the model. |

### Pipeline backends (production)
The 3D reconstruction is **not** done in the browser. The app talks to a photogrammetry backend —
**WebODM**, **Metashape**, **RealityCapture**, or a custom service — and consumes its output
(glTF/OBJ mesh + texture + a JSON of metrics and georeferencing).

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Build** | Vite | Fast dev server + ES modules |
| **Frontend** | React 19 + **strict TypeScript** | Same pattern as Javier's other projects |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Consistent with the stack; tokens via CSS variables |
| **3D viewer** | **react-three-fiber** + **@react-three/drei** + Three.js | Declarative React bindings for the WebGL scene |
| **State** | **Zustand** | Light global store for screen/theme/model state |
| **Fonts** | `@fontsource-variable/inter` + `@fontsource-variable/geist-mono` | Inter (UI) + Geist Mono (all numeric data) |
| **Map (prod)** | MapLibre / Mapbox / Leaflet | Replace the schematic canvas map with the real georeferenced polygon |

### Code rules
- **Strict TypeScript** — no `any` without an explicit justification.
- React components **< 200 lines** — split when they grow.
- Keep **3D / pipeline logic out of the UI** (services / hooks layer).
- **Design tokens are centralized** as CSS variables per `data-theme`. Never hardcode loose hex
  values — reference the tokens.
- **All numeric data renders in the mono font** (surface, elevations, coordinates, percentages).
- Accessibility: `aria-pressed` on toggles/segmented controls, visible focus, hit targets ≥44px on
  mobile.
- Commits: `feat:` · `fix:` · `chore:` · `refactor:` · `docs:`. New feature → new branch → PR → merge.

---

## Design system (must respect)

The full spec lives in `reference/design-handoff/README.md`. Non-negotiables:

- **Three switchable themes** via `data-theme` on `<html>`: **`precision`** (default — dark,
  monospaced, dense, turquoise accent `#2dd4a7`), **`dark`** ("Topo", CAD dark), **`light`**
  ("Studio"). Implement with CSS variables.
- **Precision is the default and chosen direction.** In Precision the whole base typography uses the
  **mono** font.
- **Responsive** mobile + desktop: 340px side inspector on desktop → draggable **bottom sheet** on
  mobile (<880px).
- Recreate the reference **pixel-perfect** (hi-fi). The only placeholders are the **data** (sample
  photos, metrics, coordinates) and the **terrain geometry** (procedural) — replaced by the real
  pipeline output in production.

---

## Architecture

```
datum (Vite + React + TS)
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # App shell: TopBar + screen router
│   ├── index.css               # Tailwind + design tokens (3 themes) + base
│   ├── theme/
│   │   └── tokens.ts           # Theme ids + metadata
│   ├── store/
│   │   └── appStore.ts         # Zustand: screen, theme, photos, processing, viewMode, …
│   ├── components/
│   │   ├── TopBar.tsx          # Brand, project pill, theme switch, help
│   │   └── ui/                 # Shared primitives (buttons, toggles, segmented)
│   ├── screens/
│   │   ├── UploadScreen.tsx    # Dropzone, thumb grid, step indicator
│   │   ├── ProcessingScreen.tsx# Progress ring + 5-phase step list
│   │   └── ViewerScreen.tsx    # 3D scene + Inspector
│   ├── viewer/                 # react-three-fiber scene, toolbars, dim labels, layers
│   └── lib/                    # Pipeline client, metrics, geo helpers
└── reference/design-handoff/   # Hi-fi reference (source of truth) — do not ship to prod
```

### Reference → components map
| Reference (HTML) | Component |
|---|---|
| `.topbar` | `TopBar` |
| `#screen-upload` | `UploadScreen` (+ `Dropzone`, `ThumbGrid`, `StepIndicator`) |
| `#screen-processing` | `ProcessingScreen` (+ `ProgressRing`, `StepList`) |
| `#screen-viewer .viewer-main` | `ViewerScene` (+ `ModeToolbar`, `ViewToolbar`, `DimLabels`, `ScaleBar`) |
| `.inspector` | `Inspector` (+ `SurfaceCard`, `DimGrid`, `PrecisionCard`, `LocationMap`, `LayerList`) |

---

## Main user flow

```
1. UPLOAD     Select/drop site photos → auto overlap + EXIF/GPS detection
2. PROCESS    Reconstruction feedback (progress ring + 5 phases), driven by backend polling
3. VIEW       Navigate the 3D model (solid/mesh/points), read metrics in the Inspector
4. EXPORT     As-built → DXF / GeoJSON / glTF / PDF report
```

5 processing phases (exact copy in the reference): *Aligning photos → Dense point cloud → Building
mesh → Projecting textures → Georeferencing as-built*.

---

## Project phases

See `reference/design-handoff/IMPLEMENTATION.md` for the full checklist.

- **Phase 0 — Setup** ⬅️ scaffold (this repo): Vite + React + TS + Tailwind + tokens + store. ✅
- **Phase 1 — App shell:** TopBar, screen router, global store.
- **Phase 2 — Upload screen:** step indicator, hero, dropzone, thumb grid.
- **Phase 3 — Processing screen:** progress ring + phase list.
- **Phase 4 — Viewer 3D:** r3f scene, modes, views, floating dimensions, layers.
- **Phase 5 — Inspector:** surface, dimensions, precision, map, layers, footer.
- **Phase 6 — Real integration:** photogrammetry backend, real mesh + metrics, export.
- **Phase 7 — Polish:** a11y, reduced motion, performance (LOD/instancing), error/empty states.

---

## ⚡ Updating Octopus

Write to the agent mailbox **only when Javier asks explicitly** ("update the vault", "log this in
Octopus", "save this progress"):

**Mailbox file:**
```
C:\Users\javie\iCloudDrive\iCloud~md~obsidian\Octopus\01-Trabajo\Proyectos\Actualizaciones Pendientes.md
```

**Format:**
```markdown
## UPDATE
agent: DATUM
date: DD/MM/YYYY
type: feature | technical | phase-done | decision | progress
summary: one line
changes:
- change 1
notes-to-update:
- DATUM.md: what to update
---
```

---

## What NOT to do
- Don't invent new content or sections without confirming with Javier.
- Don't change the visual direction (Precision theme) unless told to.
- Don't leave simulated data in production — wire it to the real pipeline.
- Don't copy the reference HTML/JS verbatim — recreate it in the React/TS stack.
