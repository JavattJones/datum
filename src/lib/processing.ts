import { useEffect } from 'react'

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
  { title: 'Building dense point cloud', sub: 'Triangulating 2.1 M points from the overlap…' },
  { title: 'Building 3D mesh', sub: 'Reconstructing terrain surface and normals…' },
  { title: 'Projecting textures', sub: 'Mapping photographic color onto the geometry…' },
  { title: 'Georeferencing as-built', sub: 'Applying metric scale and coordinate system…' },
]

/** Simulated total reconstruction time (ms). */
export const PROCESSING_TOTAL_MS = 5000
/** Pause on 100% before advancing to the viewer (ms). */
const SETTLE_MS = 420

interface ProgressTick {
  /** 0–100. */
  progress: number
  /** Index of the active phase. */
  currentStep: number
}

/**
 * Simulated progress driver — a stand-in for backend polling/websocket
 * (wired in Phase 6). Drives `onTick` each frame from 0→100% over
 * `PROCESSING_TOTAL_MS`, then calls `onComplete` after a short settle.
 */
export function useSimulatedProcessing(
  onTick: (tick: ProgressTick) => void,
  onComplete: () => void,
) {
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    let settle = 0

    const frame = (now: number) => {
      const progress = Math.min(100, ((now - start) / PROCESSING_TOTAL_MS) * 100)
      const currentStep = Math.min(
        PROCESSING_PHASES.length - 1,
        Math.floor((progress / 100) * PROCESSING_PHASES.length),
      )
      onTick({ progress, currentStep })

      if (progress < 100) {
        raf = requestAnimationFrame(frame)
      } else {
        settle = window.setTimeout(onComplete, SETTLE_MS)
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
    }
    // Run once on mount; callbacks are stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
