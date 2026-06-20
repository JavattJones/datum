/**
 * Theme metadata. The actual token values live in `src/index.css` as CSS
 * variables under `[data-theme]`. Precision is the default and chosen look.
 */
export type ThemeId = 'precision' | 'dark' | 'light'

export interface ThemeMeta {
  id: ThemeId
  /** Short label shown in the theme switch. */
  label: string
  /** Swatch color (matches the theme accent) for the segmented control. */
  swatch: string
}

export const THEMES: ThemeMeta[] = [
  { id: 'precision', label: 'Precision', swatch: '#2dd4a7' },
  { id: 'dark', label: 'Topo', swatch: '#34d399' },
  { id: 'light', label: 'Studio', swatch: '#059669' },
]

export const DEFAULT_THEME: ThemeId = 'precision'
