import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

const PHASES = [
  { title: 'Aligning photographs', sub: 'Detecting keypoints and estimating camera poses…' },
  { title: 'Dense point cloud', sub: 'Triangulating 2.1 M points…' },
  { title: 'Building 3D mesh', sub: 'Reconstructing surface and normals…' },
  { title: 'Projecting textures', sub: 'Mapping photographic color…' },
  { title: 'Georeferencing as-built', sub: 'Applying metric scale and coordinates…' },
] as const

const TOTAL_MS = 5000
const RADIUS = 88
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Phase 3 — Processing screen (scaffold).
 * Simulated progress driver. In production this is fed by backend polling/websocket.
 */
export function ProcessingScreen() {
  const progress = useAppStore((s) => s.processing.progress)
  const currentStep = useAppStore((s) => s.processing.currentStep)
  const setProcessing = useAppStore((s) => s.setProcessing)
  const setScreen = useAppStore((s) => s.setScreen)

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / TOTAL_MS) * 100)
      setProcessing({
        progress: pct,
        currentStep: Math.min(PHASES.length - 1, Math.floor((pct / 100) * PHASES.length)),
      })
      if (pct < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => setScreen('viewer'), 420)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [setProcessing, setScreen])

  return (
    <div className="grid h-full place-items-center px-6">
      <div className="w-full max-w-[560px] text-center">
        {/* Progress ring */}
        <div className="relative mx-auto h-[220px] w-[220px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--stroke)" strokeWidth="6" />
            <circle
              cx="110"
              cy="110"
              r={RADIUS}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center">
            <span className="mono text-[40px] font-semibold leading-none">{Math.round(progress)}%</span>
            <span className="mono mt-1 text-[11px] uppercase tracking-[0.13em] text-text-3">
              Reconstructing
            </span>
          </div>
        </div>

        <h2 className="mt-8 text-[20px] font-semibold">{PHASES[currentStep].title}</h2>
        <p className="mt-1 text-[14px] text-text-2">{PHASES[currentStep].sub}</p>

        {/* Phase list */}
        <ul className="mx-auto mt-8 max-w-[420px] space-y-1.5 text-left">
          {PHASES.map((phase, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <li
                key={phase.title}
                className={`mono flex items-center gap-3 rounded-[var(--radius-token)] px-3 py-2.5 text-[13px] ${
                  active ? 'bg-panel text-text' : 'text-text-3'
                }`}
              >
                <span className={active || done ? 'text-accent' : 'text-text-3'}>
                  {done ? '✓' : active ? '◐' : '○'}
                </span>
                {phase.title}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
