import type { GeoRef, ModelData, Photo } from '@/store/appStore'
import type { ExportFormat, JobProgress, JobResult, JobStatus, PipelineAdapter } from './types'
import { PHASE_COUNT } from './types'

/** WebODM task status codes (api/models/task.py). */
const STATUS: Record<number, JobStatus> = {
  10: 'queued', // QUEUED
  20: 'running', // RUNNING
  30: 'failed', // FAILED
  40: 'completed', // COMPLETED
  50: 'failed', // CANCELED
}

/** Format → WebODM downloadable asset name. */
const ASSET: Record<ExportFormat, string> = {
  gltf: 'textured_model.zip',
  geojson: 'shots.geojson',
  dxf: 'dsm.tif', // CAD pipelines convert the surface/contours downstream
  pdf: 'report.pdf',
}

export interface WebodmConfig {
  /** Base URL of the WebODM instance, e.g. https://odm.example.com */
  api: string
  /** JWT auth token (from POST /api/token-auth/). */
  token: string
  /** Project id that owns the tasks. */
  project: string
}

/**
 * WebODM backend adapter — the production photogrammetry path.
 *
 * Talks to the documented WebODM REST API: posts the photos as a task, polls
 * `running_progress`, and pulls the reconstructed assets. Metrics +
 * georeferencing are expected from a `datum-metrics.json` asset produced by the
 * pipeline post-process (so NO simulated data reaches production — if it's
 * missing we fail loudly rather than fabricate numbers).
 */
export class WebodmAdapter implements PipelineAdapter {
  readonly id = 'webodm'
  constructor(private cfg: WebodmConfig) {}

  private headers(): HeadersInit {
    return { Authorization: `JWT ${this.cfg.token}` }
  }

  private taskUrl(jobId: string): string {
    return `${this.cfg.api}/api/projects/${this.cfg.project}/tasks/${jobId}`
  }

  async createJob(photos: Photo[], onUploadProgress?: (pct: number) => void): Promise<string> {
    onUploadProgress?.(0)
    const form = new FormData()
    for (const p of photos) {
      if (p.file) form.append('images', p.file, p.file.name)
    }
    const res = await fetch(`${this.cfg.api}/api/projects/${this.cfg.project}/tasks/`, {
      method: 'POST',
      headers: this.headers(),
      body: form,
    })
    if (!res.ok) throw new Error(`WebODM createJob failed (${res.status})`)
    const task = (await res.json()) as { id: string }
    onUploadProgress?.(100)
    return task.id
  }

  async getProgress(jobId: string): Promise<JobProgress> {
    const res = await fetch(`${this.taskUrl(jobId)}/`, { headers: this.headers() })
    if (!res.ok) throw new Error(`WebODM getProgress failed (${res.status})`)
    const task = (await res.json()) as {
      status: number
      running_progress: number
      last_error?: string
    }
    const status = STATUS[task.status] ?? 'running'
    const progress = Math.round((task.running_progress ?? 0) * 100)
    const phase = Math.min(PHASE_COUNT - 1, Math.floor((progress / 100) * PHASE_COUNT))
    return { progress, phase, status, message: task.last_error }
  }

  async getResult(jobId: string): Promise<JobResult> {
    // Metrics + georeferencing from the pipeline post-process asset.
    const metricsUrl = `${this.taskUrl(jobId)}/download/datum-metrics.json`
    const res = await fetch(metricsUrl, { headers: this.headers() })
    if (!res.ok) {
      throw new Error(
        `WebODM result missing datum-metrics.json (${res.status}); the pipeline ` +
          `post-process must emit metrics — refusing to fabricate them.`,
      )
    }
    const data = (await res.json()) as { model: ModelData; georef: GeoRef }
    return {
      modelUrl: `${this.taskUrl(jobId)}/download/${ASSET.gltf}`,
      model: data.model,
      georef: data.georef,
    }
  }

  async exportAsset(jobId: string, format: ExportFormat) {
    const url = `${this.taskUrl(jobId)}/download/${ASSET[format]}`
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) throw new Error(`WebODM export ${format} failed (${res.status})`)
    return { filename: ASSET[format], blob: await res.blob() }
  }
}
