import { create } from 'zustand'
import { DEFAULT_THEME, type ThemeId } from '@/theme/tokens'

export type Screen = 'upload' | 'processing' | 'viewer'
export type ViewMode = 'solid' | 'wire' | 'points'

export interface Photo {
  id: string
  label: string
}

export interface Layers {
  boundary: boolean
  contours: boolean
  grid: boolean
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

/** Demo model — replaced by the real pipeline output in production. */
const MOCK_MODEL: ModelData = {
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
  /** Index into the demo location cycle (Madrid / Barcelona / …). */
  location: number
  model: ModelData

  setScreen: (screen: Screen) => void
  setTheme: (theme: ThemeId) => void
  addPhotos: (photos: Photo[]) => void
  clearPhotos: () => void
  setProcessing: (processing: Partial<ProcessingState>) => void
  setViewMode: (mode: ViewMode) => void
  toggleAutoRotate: () => void
  toggleMeasureMode: () => void
  toggleLayer: (layer: keyof Layers) => void
  cycleLocation: () => void
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
  location: 0,
  model: MOCK_MODEL,

  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  addPhotos: (photos) => set((s) => ({ photos: [...s.photos, ...photos] })),
  clearPhotos: () => set({ photos: [] }),
  setProcessing: (processing) =>
    set((s) => ({ processing: { ...s.processing, ...processing } })),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleMeasureMode: () => set((s) => ({ measureMode: !s.measureMode })),
  toggleLayer: (layer) =>
    set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  cycleLocation: () => set((s) => ({ location: (s.location + 1) % 4 })),
  reset: () =>
    set({
      screen: 'upload',
      photos: [],
      processing: { progress: 0, currentStep: 0 },
    }),
}))
