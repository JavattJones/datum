import type { PipelineAdapter } from './types'
import { MockAdapter } from './mock'
import { WebodmAdapter } from './webodm'
import { DatumServerAdapter } from './datum-server'

export * from './types'
export { downloadArtifact } from './export'

/**
 * Resolve the active pipeline adapter once, from build-time env vars.
 *
 * Priority order:
 *
 *   VITE_PIPELINE_SERVER   → DATUM proxy server URL (NodeODM backend)
 *                            e.g. http://localhost:8080
 *                            Run: cd server && npm install && node index.mjs
 *                            Also needs NodeODM: docker compose up -d
 *
 *   VITE_PIPELINE_API      → Direct WebODM base URL
 *   VITE_PIPELINE_TOKEN    → WebODM JWT token
 *   VITE_PIPELINE_PROJECT  → WebODM project id
 *
 * When neither is set (local dev), the mock adapter runs so the app works
 * offline without any backend. In production one of the above must be set.
 */
function createPipeline(): PipelineAdapter {
  const env = import.meta.env

  // Priority 1: DATUM proxy server (NodeODM backend)
  const server = env.VITE_PIPELINE_SERVER as string | undefined
  if (server) {
    return new DatumServerAdapter(server.replace(/\/$/, ''))
  }

  // Priority 2: Direct WebODM connection
  const api = env.VITE_PIPELINE_API as string | undefined
  if (api) {
    return new WebodmAdapter({
      api,
      token: (env.VITE_PIPELINE_TOKEN as string) ?? '',
      project: (env.VITE_PIPELINE_PROJECT as string) ?? '1',
    })
  }

  if (import.meta.env.PROD) {
    console.warn('[DATUM] No pipeline configured — falling back to mock data.')
  }
  return new MockAdapter()
}

/** The singleton pipeline client used across screens. */
export const pipeline: PipelineAdapter = createPipeline()
