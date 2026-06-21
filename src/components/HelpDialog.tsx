import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

const STEPS = [
  { n: '1', title: 'Capture', body: 'Shoot 40–300 overlapping photos of the plot.' },
  { n: '2', title: 'Process', body: 'Photogrammetry reconstructs a dense cloud → textured mesh.' },
  { n: '3', title: '3D model', body: 'Navigate, measure and georeference the as-built.' },
]

export function HelpDialog({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="About DATUM"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[var(--radius-token)] border border-stroke bg-panel p-6 outline-none"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.16em] text-accent">Photogrammetry Suite</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">What is DATUM</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-stroke text-text-2 transition-colors hover:text-text"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-[14px] leading-[1.55] text-text-2">
          DATUM turns site photographs into a measurable, georeferenced 3D model — an{' '}
          <em>as-built</em> ready for CAD/GIS.
        </p>

        <ul className="mt-5 space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span
                className="mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] text-accent"
                style={{ background: 'var(--accent-soft)' }}
              >
                {s.n}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-text">{s.title}</p>
                <p className="text-[12.5px] leading-[1.5] text-text-3">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
