import type { ReactNode } from 'react'
import { PROCESSING_PHASES } from '@/lib/processing'

/** Thematic icon per phase, shown while the phase is still pending. */
const PHASE_ICONS: ReactNode[] = [
  // align
  <>
    <path d="M4 4h6v6H4zM14 14h6v6h-6zM10 7h4M7 10v4" stroke="currentColor" strokeWidth="1.6" />
  </>,
  // dense cloud
  <>
    <circle cx="7" cy="9" r="1.2" fill="currentColor" />
    <circle cx="13" cy="6" r="1.2" fill="currentColor" />
    <circle cx="17" cy="11" r="1.2" fill="currentColor" />
    <circle cx="9" cy="14" r="1.2" fill="currentColor" />
    <circle cx="15" cy="16" r="1.2" fill="currentColor" />
  </>,
  // mesh
  <path d="M12 3 3 8v8l9 5 9-5V8l-9-5ZM3 8l9 5 9-5M12 13v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  // textures
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="m4 15 4-4 5 5M14 13l2-2 4 4" stroke="currentColor" strokeWidth="1.5" />
  </>,
  // georeference
  <>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.3" />
  </>,
]

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The 5-phase reconstruction list. Each phase is pending (thematic icon,
 * text-3), active (panel pill + spinner + accent) or done (accent check).
 * Reference: README › SCREEN Processing › proc-steps.
 */
export function PhaseList({ currentStep, complete }: { currentStep: number; complete: boolean }) {
  return (
    <div className="mx-auto mt-[30px] flex max-w-[380px] flex-col gap-0.5 text-left">
      {PROCESSING_PHASES.map((phase, i) => {
        const done = complete || i < currentStep
        const active = !complete && i === currentStep
        return (
          <div
            key={phase.title}
            className={`flex items-center gap-3 rounded-[10px] px-3.5 py-[11px] text-[13.5px] transition-colors duration-300 ${
              active ? 'bg-panel text-text' : done ? 'text-text-2' : 'text-text-3'
            }`}
          >
            <span className={`grid h-5 w-5 shrink-0 place-items-center ${active || done ? 'text-accent' : ''}`}>
              {done ? (
                <span className="h-4 w-4">
                  <Check />
                </span>
              ) : active ? (
                <span
                  className="h-[15px] w-[15px] animate-spin rounded-full"
                  style={{
                    border: '2px solid var(--stroke-2)',
                    borderTopColor: 'var(--accent)',
                    animationDuration: '0.7s',
                  }}
                />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  {PHASE_ICONS[i]}
                </svg>
              )}
            </span>
            <span>{phase.title}</span>
          </div>
        )
      })}
    </div>
  )
}
