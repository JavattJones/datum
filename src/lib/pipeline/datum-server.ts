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
   * Creates a job, uploads all photos, and starts reconstruction.
   * Returns the job UUID to poll with getProgress().
   */
  async createJob(photos: Photo[]): Promise<string> {
    // 1 — Init task
    const initRes = await fetch(this.url('/api/jobs'), { method: 'POST' })
    if (!initRes.ok) throw new Error(`Failed to create job (${initRes.status})`)
    const { jobId } = (await initRes.json()) as { jobId: string }

    // 2 — Upload all photo files (may take minutes for large sets)
    const form = new FormData()
    for (const p of photos) {
      if (p.file) form.append('images', p.file, p.file.name)
    }
    const uploadRes = await fetch(this.url(`/api/jobs/${jobId}/photos`), {
      method: 'POST',
      body: form,
    })
    if (!uploadRes.ok) {
      const err = (await uploadRes.json().catch(() => ({ error: uploadRes.statusText }))) as {
        error: string
      }
      throw new Error(`Photo upload failed: ${err.error}`)
    }

    // 3 — Start reconstruction
    const startRes = await fetch(this.url(`/api/jobs/${jobId}/start`), { method: 'POST' })
    if (!startRes.ok) {
      const err = (await startRes.json().catch(() => ({ error: startRes.statusText }))) as {
        error: string
      }
      throw new Error(`Failed to start reconstruction: ${err.error}`)
    }

    return jobId
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
