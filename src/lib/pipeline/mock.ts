import { DEMO_MODEL, type GeoRef } from '@/store/appStore'
import type { JobProgress, JobResult, PipelineAdapter, ExportFormat } from './types'
import { PHASE_COUNT } from './types'
import { buildArtifact } from './export'

/** Simulated reconstruction time (ms) — matches the original demo timing. */
const DURATION = 5000

/** Demo georeferencing (Madrid, ETRS89/UTM 30N) for the mock as-built. */
const DEMO_GEOREF: GeoRef = {
  epsg: 'EPSG:25830',
  center: [40.4168, -3.7038],
  boundary: [
    [-3.70425, 40.4165],
    [-3.70335, 40.41658],
    [-3.70342, 40.41702],
    [-3.70432, 40.41694],
  ],
}

/**
 * Mock pipeline — the development fallback used when no `VITE_PIPELINE_API`
 * is configured. Reproduces the simulated 5-phase progress, procedural terrain
 * (modelUrl: null → the viewer builds the noise mesh) and demo metrics, so the
 * app stays fully runnable offline. NEVER selected when a backend is set.
 */
export class MockAdapter implements PipelineAdapter {
  readonly id = 'mock'
  private starts = new Map<string, number>()

  async createJob(_photos?: unknown, onUploadProgress?: (pct: number) => void): Promise<string> {
    onUploadProgress?.(100)
    const jobId = `mock-${Date.now().toString(36)}`
    this.starts.set(jobId, performance.now())
    return jobId
  }

  async getProgress(jobId: string): Promise<JobProgress> {
    const start = this.starts.get(jobId) ?? performance.now()
    const progress = Math.min(100, ((performance.now() - start) / DURATION) * 100)
    const phase = Math.min(PHASE_COUNT - 1, Math.floor((progress / 100) * PHASE_COUNT))
    return { progress, phase, status: progress >= 100 ? 'completed' : 'running' }
  }

  async getResult(): Promise<JobResult> {
    return { modelUrl: null, model: DEMO_MODEL, georef: DEMO_GEOREF }
  }

  async exportAsset(_jobId: string, format: ExportFormat) {
    return buildArtifact(format, DEMO_MODEL, DEMO_GEOREF)
  }
}
