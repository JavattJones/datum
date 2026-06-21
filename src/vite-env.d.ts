/// <reference types="vite/client" />

declare module '*.css'

interface ImportMetaEnv {
  /** WebODM base URL — presence switches off the mock pipeline. */
  readonly VITE_PIPELINE_API?: string
  /** WebODM JWT auth token. */
  readonly VITE_PIPELINE_TOKEN?: string
  /** WebODM project id that owns the tasks. */
  readonly VITE_PIPELINE_PROJECT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
