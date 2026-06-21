import type { ReactNode } from 'react'
import { useAppStore, type CameraView } from '@/store/appStore'

function Tool({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="touch-target group relative grid h-9 w-9 place-items-center rounded-[8px] text-text-2 transition-colors hover:bg-panel-2 hover:text-text aria-pressed:text-accent"
      style={pressed ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
    >
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
        {children}
      </svg>
      <span
        className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-[7px] border border-stroke bg-bg-2 px-[9px] py-[5px] text-[11px] text-text opacity-0 transition-opacity group-hover:opacity-100"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </span>
    </button>
  )
}

const VIEW_BUTTONS: { view: CameraView; label: string; icon: ReactNode }[] = [
  {
    view: 'iso',
    label: 'Isometric view',
    icon: <path d="M12 2 2 8l10 6 10-6-10-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  },
  {
    view: 'plan',
    label: 'Plan (top-down)',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 9h16M9 4v16" stroke="currentColor" strokeWidth="1.2" />
      </>
    ),
  },
  {
    view: 'elevation',
    label: 'Elevation',
    icon: <path d="M3 18h18M5 18V9l7-4 7 4v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  },
]

function Bar({ side, label, children }: { side: 'tl' | 'tr'; label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`pointer-events-auto absolute top-4 flex gap-1 rounded-[6px] border border-stroke p-[5px] backdrop-blur ${
        side === 'tl' ? 'left-4' : 'right-4'
      }`}
      style={{ background: 'color-mix(in srgb, var(--panel) 86%, transparent)', boxShadow: 'var(--shadow)' }}
    >
      {children}
    </div>
  )
}

/** Top-left camera views (iso / plan / elevation). */
export function ViewsToolbar() {
  const requestView = useAppStore((s) => s.requestView)
  return (
    <Bar side="tl" label="Camera views">
      {VIEW_BUTTONS.map((b) => (
        <Tool key={b.view} label={b.label} onClick={() => requestView(b.view)}>
          {b.icon}
        </Tool>
      ))}
    </Bar>
  )
}

/** Top-right actions: auto-orbit toggle · measure toggle · fullscreen. */
export function ActionsToolbar({ onFullscreen }: { onFullscreen: () => void }) {
  const autoRotate = useAppStore((s) => s.autoRotate)
  const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate)
  const measureMode = useAppStore((s) => s.measureMode)
  const toggleMeasureMode = useAppStore((s) => s.toggleMeasureMode)

  return (
    <Bar side="tr" label="Viewer actions">
      <Tool label="Auto-orbit" pressed={autoRotate} onClick={toggleAutoRotate}>
        <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </Tool>
      <span className="mx-0.5 my-1 w-px self-stretch bg-stroke" />
      <Tool label="Measure" pressed={measureMode} onClick={toggleMeasureMode}>
        <path d="M3 7l4-4 14 14-4 4L3 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 7l2 2m1-4 2 2m1-1 2 2" stroke="currentColor" strokeWidth="1.3" />
      </Tool>
      <Tool label="Fullscreen" onClick={onFullscreen}>
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </Tool>
    </Bar>
  )
}
