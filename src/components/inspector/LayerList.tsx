import { useAppStore, type Layers } from '@/store/appStore'
import { Section } from './Section'

const ICON = (
  <>
    <path d="M12 3 2 8l10 5 10-5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="m2 13 10 5 10-5M2 18l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </>
)

const ROWS: { key: keyof Layers; name: string; count: string; swatch: string }[] = [
  { key: 'boundary', name: 'Plot boundary', count: '4 vert.', swatch: 'var(--accent)' },
  { key: 'contours', name: 'Contour lines', count: '0.5 m', swatch: '#ffffff' },
  { key: 'grid', name: 'Metric grid', count: '1 m', swatch: '#7c8694' },
]

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="relative h-[19px] w-[34px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--accent)' : 'var(--stroke-2)' }}
    >
      <span
        className="absolute top-0.5 h-[15px] w-[15px] rounded-full bg-white transition-transform"
        style={{ left: '2px', transform: on ? 'translateX(15px)' : 'none' }}
      />
    </span>
  )
}

/** Layer toggles — synced with the viewer through the shared store. */
export function LayerList() {
  const layers = useAppStore((s) => s.layers)
  const toggleLayer = useAppStore((s) => s.toggleLayer)

  return (
    <Section icon={ICON} label="Layers">
      {ROWS.map((row, i) => {
        const on = layers[row.key]
        return (
          <button
            key={row.key}
            type="button"
            onClick={() => toggleLayer(row.key)}
            aria-pressed={on}
            className={`flex w-full items-center gap-[11px] py-[9px] text-left ${
              i > 0 ? 'border-t border-stroke' : ''
            }`}
          >
            <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: row.swatch }} />
            <span className="flex-1 text-[13px]">{row.name}</span>
            <span className="mono text-[11px] text-text-3">{row.count}</span>
            <Toggle on={on} />
          </button>
        )
      })}
    </Section>
  )
}
