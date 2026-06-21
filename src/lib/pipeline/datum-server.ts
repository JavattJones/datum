import type { GeoRef, ModelData, Photo } from '@/store/appStore'
import type { ExportFormat, JobProgress, JobResult, PipelineAdapter } from './types'

/**
 * Adapter for the DATUM backend proxy server (server/index.mjs).
 *
 * The proxy handles all NodeODM communication, ZIP extraction, and caching,
 * and exposes a clean JSON API. Configured via VITE_PIPELINE_SERVER env var
 * (default when unset: http://localhost:8080).
 *
 * Setup:
 *   cd server && npm install
 *   node server/index.mjs        # start the proxy
 *   docker compose up -d         # start NodeODM
 *   VITE_PIPELINE_SERVER=http://localhost:8080 npm run dev
 */
export class DatumServerAdapter implements PipelineAdapter {
  readonly id = 'datum-server'

  constructor(private base: string) {}

  private url(path: string): string {
    return `${this.base}${path}`
  }

  /**
   * Creates a job, uploads all photos in batches (20/batch) with real byte-level
   * XHR progress, then starts the reconstruction. Returns the job UUID.
   */
  async createJob(photos: Photo[], onUploadProgress?: (pct: number) => void): Promise<string> {
    onUploadProgress?.(0)

    // 1 — Init task
    const initRes = await fetch(this.url('/api/jobs'), { method: 'POST' })
    if (!initRes.ok) throw new Error(`Failed to create job (${initRes.status})`)
    const { jobId } = (await initRes.json()) as { jobId: string }

    // 2 — Batch upload with XHR so we get real byte-level progress per batch
    const toUpload = photos.filter((p) => p.file)
    if (toUpload.length > 0) {
      const BATCH = 20
      const batches: Photo[][] = []
      for (let i = 0; i < toUpload.length; i += BATCH) {
        batches.push(toUpload.slice(i, i + BATCH))
      }

      for (let b = 0; b < batches.length; b++) {
        await this.postBatch(
          this.url(`/api/jobs/${jobId}/photos`),
          batches[b],
          (loaded, total) => {
            // Map this batch's byte progress into the 0–90 range across all batches
            const batchBase = (b / batches.length) * 90
            const batchSpan = (1 / batches.length) * 90
            onUploadProgress?.(Math.round(batchBase + (loaded / total) * batchSpan))
          },
        )
      }
    }

    onUploadProgress?.(95)

    // 3 — Start reconstruction
    const startRes = await fetch(this.url(`/api/jobs/${jobId}/start`), { method: 'POST' })
    if (!startRes.ok) {
      const err = (await startRes.json().catch(() => ({ error: startRes.statusText }))) as {
        error: string
      }
      throw new Error(`Failed to start reconstruction: ${err.error}`)
    }

    onUploadProgress?.(100)
    return jobId
  }

  /** Upload one batch of photo files via XHR for byte-level progress tracking. */
  private postBatch(
    url: string,
    photos: Photo[],
    onProgress: (loaded: number, total: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const form = new FormData()
      for (const p of photos) {
        if (p.file) form.append('images', p.file, p.file.name)
      }
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total)
      })
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          try {
            const body = JSON.parse(xhr.responseText) as { error?: string }
            reject(new Error(body.error ?? `Upload failed (${xhr.status})`))
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`))
          }
        }
      })
      xhr.addEventListener('error', () => reject(new Error('Upload network error')))
      xhr.open('POST', url)
      xhr.send(form)
    })
  }

  async getProgress(jobId: string): Promise<JobProgress> {
    const res = await fetch(this.url(`/api/jobs/${jobId}/progress`))
    if (!res.ok) throw new Error(`Progress check failed (${res.status})`)
    return res.json() as Promise<JobProgress>
  }

  /**
   * Fetches reconstruction result. First call downloads + extracts the .glb
   * from NodeODM's ZIP output — may take a moment for large models.
   */
  async getResult(jobId: string): Promise<JobResult> {
    const res = await fetch(this.url(`/api/jobs/${jobId}/result`))
    if (!res.ok) {
      const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error: string }
      throw new Error(err.error || `Result unavailable (${res.status})`)
    }
    const data = (await res.json()) as {
      model: ModelData
      georef: GeoRef
      modelUrl: string
    }
    return {
      // Prepend base URL so Three.js can fetch the .glb from the proxy server
      modelUrl: this.base + data.modelUrl,
      model: data.model,
      georef: data.georef,
    }
  }

  async exportAsset(jobId: string, format: ExportFormat) {
    const res = await fetch(this.url(`/api/jobs/${jobId}/export/${format}`))
    if (!res.ok) throw new Error(`Export ${format} failed (${res.status})`)
    const ext = format === 'pdf' ? 'txt' : format
    return {
      filename: `survey-${jobId.slice(0, 8)}.${ext}`,
      blob: await res.blob(),
    }
  }
}
