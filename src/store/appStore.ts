import { create } from 'zustand'
import { DEFAULT_THEME, type ThemeId } from '@/theme/tokens'

export type Screen = 'upload' | 'processing' | 'viewer'
export type ViewMode = 'solid' | 'wire' | 'points'
export type CameraView = 'iso' | 'plan' | 'elevation'

export interface Photo {
  id: string
  label: string
  /** Real file when picked from disk; absent for the demo sample set. */
  file?: File
}

export interface Layers {
  boundary: boolean
  contours: boolean
  grid: boolean
}

/** Real-world georeferencing returned by the pipeline (CRS + boundary). */
export interface GeoRef {
  /** Coordinate reference system, e.g. "EPSG:25830". */
  epsg: string
  /** Model center as [lat, lon] in WGS84 degrees. */
  center: [number, number]
  /** Plot boundary polygon as [lon, lat] pairs (GeoJSON order). */
  boundary: [number, number][]
}

/** Metrics + georeferencing produced by the photogrammetry pipeline. */
export interface ModelData {
  name: string
  plot: string
  photoCount: number
  date: string
  /** Horizontal projected surface (m²). */
  surface: number
  /** Real 3D surface (m²). */
  surface3d: number
  surfaceDelta: number
  width: number
  depth: number
  perimeter: number
  drop: number
  minElevation: number
  maxElevation: number
  /** Root-mean-square error (cm). */
  rmse: number
  /** Ground sampling distance (cm/px). */
  gsd: number
  /** Mesh points (millions). */
  points: number
}

export interface ProcessingState {
  progress: number
  currentStep: number
}

/** Demo model — returned by the mock pipeline adapter (dev fallback only). */
export const DEMO_MODEL: ModelData = {
  name: 'Vega Norte',
  plot: 'P-204',
  photoCount: 184,
  date: '12 Jun 2026',
  surface: 1623,
  surface3d: 1671,
  surfaceDelta: 0.4,
  width: 48.6,
  depth: 33.4,
  perimeter: 164.0,
  drop: 4.85,
  minElevation: 820.4,
  maxElevation: 825.2,
  rmse: 1.8,
  gsd: 1.4,
  points: 2.1,
}

interface AppState {
  screen: Screen
  theme: ThemeId
  photos: Photo[]
  processing: ProcessingState
  viewMode: ViewMode
  autoRotate: boolean
  measureMode: boolean
  layers: Layers
  /** Camera-view request: bumps `nonce` so the scene re-animates on repeat clicks. */
  viewRequest: { view: CameraView; nonce: number }
  /** Index into the demo location cycle (Madrid / Barcelona / …). */
  location: number
  model: ModelData
  /** Reconstruction job id from the pipeline (null until upload posts photos). */
  jobId: string | null
  /** URL of the reconstructed glTF mesh (null → procedural mock terrain). */
  modelUrl: string | null
  /** Georeferencing from the pipeline result (null until reconstructed). */
  georef: GeoRef | null

  setScreen: (screen: Screen) => void
  setTheme: (theme: ThemeId) => void
  addPhotos: (photos: Photo[]) => void
  clearPhotos: () => void
  setProcessing: (processing: Partial<ProcessingState>) => void
  setViewMode: (mode: ViewMode) => void
  requestView: (view: CameraView) => void
  toggleAutoRotate: () => void
  toggleMeasureMode: () => void
  toggleLayer: (layer: keyof Layers) => void
  cycleLocation: () => void
  setJob: (jobId: string) => void
  setResult: (result: { model: ModelData; modelUrl: string | null; georef: GeoRef }) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'upload',
  theme: DEFAULT_THEME,
  photos: [],
  processing: { progress: 0, currentStep: 0 },
  viewMode: 'solid',
  autoRotate: false,
  measureMode: false,
  layers: { boundary: true, contours: false, grid: true },
  viewRequest: { view: 'iso', nonce: 0 },
  location: 0,
  model: DEMO_MODEL,
  jobId: null,
  modelUrl: null,
  georef: null,

  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  addPhotos: (photos) => set((s) => ({ photos: [...s.photos, ...photos] })),
  clearPhotos: () => set({ photos: [] }),
  setProcessing: (processing) =>
    set((s) => ({ processing: { ...s.processing, ...processing } })),
  setViewMode: (viewMode) => set({ viewMode }),
  requestView: (view) =>
    set((s) => ({ viewRequest: { view, nonce: s.viewRequest.nonce + 1 } })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleMeasureMode: () => set((s) => ({ measureMode: !s.measureMode })),
  toggleLayer: (layer) =>
    set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  cycleLocation: () => set((s) => ({ location: (s.location + 1) % 4 })),
  setJob: (jobId) => set({ jobId }),
  setResult: ({ model, modelUrl, georef }) => set({ model, modelUrl, georef }),
  reset: () =>
    set({
      screen: 'upload',
      photos: [],
      processing: { progress: 0, currentStep: 0 },
      jobId: null,
      modelUrl: null,
      georef: null,
    }),
}))
