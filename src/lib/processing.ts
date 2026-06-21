import { useEffect } from 'react'
import { pipeline } from '@/lib/pipeline'

/** One reconstruction phase shown on the Processing screen. */
export interface ProcessingPhase {
  title: string
  sub: string
}

/**
 * The 5 photogrammetry phases, in order. Copy mirrors the reference
 * (reference/design-handoff › SCREEN Processing).
 */
export const PROCESSING_PHASES: ProcessingPhase[] = [
  { title: 'Aligning photographs', sub: 'Detecting keypoints and estimating camera poses…' },
  { title: 'Building dense point cloud', sub: 'Triangulating 5.8 M points from the overlap…' },
  { title: 'Building 3D mesh', sub: 'Reconstructing terrain surface and normals…' },
  { title: 'Projecting textures', sub: 'Mapping photographic color onto the geometry…' },
  { title: 'Georeferencing as-built', sub: 'Applying metric scale and coordinate system…' },
]

/** Pause on 100% before advancing to the viewer (ms). */
const SETTLE_MS = 420
/** How often the screen polls the backend for progress (ms). */
const POLL_MS = 180

interface ProgressTick {
  /** 0–100. */
  progress: number
  /** Index of the active phase. */
  currentStep: number
}

/**
 * Reconstruction progress driver. Polls the pipeline backend for `jobId` and
 * pushes each snapshot to `onTick`; on completion it settles briefly then calls
 * `onComplete`. The mock adapter drives the same ~5s curve offline, so the
 * Processing screen behaves identically with or without a real backend.
 */
export function useReconstruction(
  jobId: string | null,
  onTick: (tick: ProgressTick) => void,
  onComplete: () => void,
  onError?: (message: string) => void,
) {
  useEffect(() => {
    if (!jobId) return
    let active = true
    let timer = 0

    const poll = async () => {
      if (!active) return
      try {
        const p = await pipeline.getProgress(jobId)
        if (!active) return
        onTick({ progress: p.progress, currentStep: p.phase })
        if (p.status === 'completed') {
          timer = window.setTimeout(onComplete, SETTLE_MS)
          return
        }
        if (p.status === 'failed') {
          onError?.(p.message ?? 'Reconstruction failed')
          return
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Pipeline unreachable')
        return
      }
      timer = window.setTimeout(poll, POLL_MS)
    }

    poll()
    return () => {
      active = false
      clearTimeout(timer)
    }
    // Re-run only when the job changes; callbacks are stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])
}
