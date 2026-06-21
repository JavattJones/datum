import { useAppStore } from '@/store/appStore'
import { PROCESSING_PHASES, useSimulatedProcessing } from '@/lib/processing'
import { PhaseList } from '@/components/processing/PhaseList'

const RING_LEN = 276.5 // 2π·44, the reference ring circumference

/**
 * Phase 3 — Processing screen.
 * SVG progress ring + 5-phase step list, fed by an abstracted progress driver
 * (simulated here; backend polling/websocket in Phase 6).
 * Reference: reference/design-handoff/README.md › SCREEN Processing.
 */
export function ProcessingScreen() {
  const progress = useAppStore((s) => s.processing.progress)
  const currentStep = useAppStore((s) => s.processing.currentStep)
  const setProcessing = useAppStore((s) => s.setProcessing)
  const setScreen = useAppStore((s) => s.setScreen)

  useSimulatedProcessing(setProcessing, () => setScreen('viewer'))

  const complete = progress >= 100
  const phase = PROCESSING_PHASES[currentStep]

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
