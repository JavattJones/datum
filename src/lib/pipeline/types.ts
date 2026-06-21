import type { GeoRef, ModelData, Photo } from '@/store/appStore'

/** Number of reconstruction phases (see PROCESSING_PHASES). */
export const PHASE_COUNT = 5

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

/** A poll snapshot of a running reconstruction job. */
export interface JobProgress {
  /** Overall progress, 0–100. */
  progress: number
  /** Active phase index (0–4) into PROCESSING_PHASES. */
  phase: number
  status: JobStatus
  /** Optional human-readable detail (errors, sub-step). */
  message?: string
}

/** The finished reconstruction: mesh + metrics + georeferencing. */
export interface JobResult {
  /** glTF mesh URL, or null to fall back to the procedural mock terrain. */
  modelUrl: string | null
  model: ModelData
  georef: GeoRef
}

export type ExportFormat = 'dxf' | 'geojson' | 'gltf' | 'pdf'

export interface ExportArtifact {
  filename: string
  blob: Blob
}

/**
 * The contract every photogrammetry backend must satisfy. Swapping backends
 * (WebODM ↔ NodeODM ↔ custom ↔ mock) is just swapping the implementation —
 * no screen knows which one is running.
 */
export interface PipelineAdapter {
  /** Identifier for diagnostics ("webodm", "mock", …). */
  readonly id: string
  /** Post the photo set, returning a job id to poll.
   *  `onUploadProgress` fires with 0–100 during the upload phase. */
  createJob(photos: Photo[], onUploadProgress?: (pct: number) => void): Promise<string>
  /** One progress snapshot (screens poll this until completed/failed). */
  getProgress(jobId: string): Promise<JobProgress>
  /** Fetch the finished mesh + metrics once status is `completed`. */
  getResult(jobId: string): Promise<JobResult>
  /** Produce a downloadable as-built artifact in the requested format. */
  exportAsset(jobId: string, format: ExportFormat): Promise<ExportArtifact>
}

export const EXPORT_LABELS: Record<ExportFormat, string> = {
  gltf: 'glTF model',
  geojson: 'GeoJSON',
  dxf: 'DXF (CAD)',
  pdf: 'PDF report',
}
