import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { PROCESSING_PHASES, useReconstruction } from '@/lib/processing'
import { pipeline } from '@/lib/pipeline'
import { PhaseList } from '@/components/processing/PhaseList'

const RING_LEN = 276.5 // 2π·44, the reference ring circumference

/**
 * Phase 3 — Processing screen.
 * SVG progress ring + 5-phase step list, fed by the pipeline backend via
 * polling (mock adapter offline). On completion it pulls the reconstruction
 * result and advances to the viewer; on failure it shows an error state.
 * Reference: reference/design-handoff/README.md › SCREEN Processing.
 */
export function ProcessingScreen() {
  const jobId = useAppStore((s) => s.jobId)
  const progress = useAppStore((s) => s.processing.progress)
  const currentStep = useAppStore((s) => s.processing.currentStep)
  const setProcessing = useAppStore((s) => s.setProcessing)
  const setResult = useAppStore((s) => s.setResult)
  const setScreen = useAppStore((s) => s.setScreen)
  const reset = useAppStore((s) => s.reset)
  const [error, setError] = useState<string | null>(null)

  useReconstruction(
    jobId,
    setProcessing,
    async () => {
      if (!jobId) return
      try {
        const result = await pipeline.getResult(jobId)
        setResult(result)
        setScreen('viewer')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load the reconstruction')
      }
    },
    (message) => setError(message),
  )

  const complete = progress >= 100
  const phase = PROCESSING_PHASES[currentStep]

  if (error) {
    return (
      <div className="grid h-full place-items-center px-7">
        <div className="w-full max-w-[420px] text-center">
          <div
            className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full"
            style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <h2 className="mb-2 text-[22px] font-[640] tracking-[-0.02em]">Reconstruction failed</h2>
          <p className="mb-7 text-[14px] text-text-2">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-[var(--radius-token)] px-5 py-[11px] text-[14px] font-semibold text-on-accent transition-[filter] hover:brightness-105"
            style={{ background: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent-line)' }}
          >
            Back to upload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full place-items-center px-7">
      <div className="w-full max-w-[560px] text-center">
        {/* Progress ring */}
        <div className="relative mx-auto mb-[30px] h-[220px] w-[220px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--stroke)" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_LEN}
              strokeDashoffset={RING_LEN * (1 - progress / 100)}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <div className="mono text-[40px] font-semibold leading-none tracking-[-0.02em]">
                {Math.round(progress)}%
              </div>
              <div className="mono mt-[7px] text-[10px] uppercase tracking-[0.16em] text-text-3">
                Reconstructing
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-[22px] font-[640] tracking-[-0.02em]">{phase.title}</h2>
        <p className="min-h-[21px] text-[14px] text-text-2">{phase.sub}</p>

        <PhaseList currentStep={currentStep} complete={complete} />
      </div>
    </div>
  )
}
