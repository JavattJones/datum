import type { ReactNode } from 'react'
import { useAppStore, type ViewMode } from '@/store/appStore'

const MODES: { id: ViewMode; label: string; icon: ReactNode }[] = [
  {
    id: 'solid',
    label: 'Solid',
    icon: (
      <>
        <path d="M12 2 2 8l10 6 10-6-10-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m2 16 10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: 'wire',
    label: 'Mesh',
    icon: <path d="M3 6h18M3 12h18M3 18h18M7 3v18M12 3v18M17 3v18" stroke="currentColor" strokeWidth="1.3" />,
  },
  {
    id: 'points',
    label: 'Points',
    icon: (
      <>
        {[
          [6, 7],
          [12, 5],
          [18, 8],
          [8, 13],
          [15, 12],
          [6, 18],
          [12, 19],
          [18, 17],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.3" fill="currentColor" />
        ))}
      </>
    ),
  },
]

/** Centered segmented control to switch the terrain render mode. */
export function ModeToolbar() {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)

  return (
    <div
      role="group"
      aria-label="Render mode"
      className="pointer-events-auto absolute left-1/2 top-4 flex -translate-x-1/2 gap-[3px] rounded-[6px] border border-stroke p-1 backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--panel) 86%, transparent)', boxShadow: 'var(--shadow)' }}
    >
      {MODES.map((m) => {
        const active = m.id === viewMode
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setViewMode(m.id)}
            aria-pressed={active}
            className={`touch-target flex items-center justify-center gap-[7px] rounded-[6px] px-3.5 py-[7px] text-[12px] font-semibold transition-colors ${
              active ? 'text-on-accent' : 'text-text-3 hover:text-text'
            }`}
            style={active ? { background: 'var(--accent)' } : undefined}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              {m.icon}
            </svg>
            <span className="max-[600px]:hidden">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
