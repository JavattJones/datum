import type { PipelineAdapter } from './types'
import { MockAdapter } from './mock'
import { WebodmAdapter } from './webodm'

export * from './types'
export { downloadArtifact } from './export'

/**
 * Resolve the active pipeline adapter once, from build-time env:
 *
 *   VITE_PIPELINE_API      → WebODM base URL (presence switches to the real backend)
 *   VITE_PIPELINE_TOKEN    → JWT auth token
 *   VITE_PIPELINE_PROJECT  → WebODM project id
 *
 * When `VITE_PIPELINE_API` is unset (local dev), the mock adapter runs so the
 * app works offline. In production the env is set and no simulated data is used.
 */
function createPipeline(): PipelineAdapter {
  const env = import.meta.env
  const api = env.VITE_PIPELINE_API as string | undefined
  if (api) {
    return new WebodmAdapter({
      api,
      token: (env.VITE_PIPELINE_TOKEN as string) ?? '',
      project: (env.VITE_PIPELINE_PROJECT as string) ?? '1',
    })
  }
  if (import.meta.env.PROD) {
    // Surface the misconfiguration instead of silently shipping mock data.
    console.warn('[DATUM] No VITE_PIPELINE_API configured — falling back to the mock pipeline.')
  }
  return new MockAdapter()
}

/** The singleton pipeline client used across screens. */
export const pipeline: PipelineAdapter = createPipeline()
