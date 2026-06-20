import { SceneCanvas } from '@/viewer/SceneCanvas'
import { useAppStore, type ViewMode } from '@/store/appStore'

const MODES: { id: ViewMode; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'wire', label: 'Mesh' },
  { id: 'points', label: 'Points' },
]

/**
 * Phase 4 + 5 — Viewer + Inspector (scaffold).
 * TODO: view toolbar (iso/plan/elevation), floating dimensions, scale bar,
 * full inspector sections, mobile bottom sheet.
 */
export function ViewerScreen() {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const autoRotate = useAppStore((s) => s.autoRotate)
  const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate)

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Viewer main */}
      <div className="relative min-h-[40%] flex-1">
        <SceneCanvas />

        {/* Mode group */}
        <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-0.5 rounded-[var(--radius-token)] border border-stroke bg-panel/80 p-0.5 backdrop-blur">
          {MODES.map((m) => {
            const active = m.id === viewMode
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                aria-pressed={active}
                className={`mono rounded-[5px] px-3 py-1.5 text-[12px] transition-colors ${
                  active ? 'text-on-accent' : 'text-text-2 hover:text-text'
                }`}
                style={active ? { background: 'var(--accent)' } : undefined}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Auto-orbit toggle */}
        <div className="absolute right-4 top-4">
          <button
            type="button"
            onClick={toggleAutoRotate}
            aria-pressed={autoRotate}
            className={`mono rounded-[var(--radius-token)] border border-stroke px-3 py-1.5 text-[12px] backdrop-blur transition-colors ${
              autoRotate ? 'text-on-accent' : 'bg-panel/80 text-text-2'
            }`}
            style={autoRotate ? { background: 'var(--accent)' } : undefined}
          >
            Auto-orbit
          </button>
        </div>

        {/* Scale bar */}
        <div className="mono absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[11px] text-text-2">
          <div className="mx-auto h-1 w-20 border-x border-b border-text-2" />
          10 m
        </div>
      </div>

      <Inspector />
    </div>
  )
}

function Inspector() {
  const model = useAppStore((s) => s.model)
  const layers = useAppStore((s) => s.layers)
  const toggleLayer = useAppStore((s) => s.toggleLayer)
  const reset = useAppStore((s) => s.reset)

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-stroke bg-bg-2 md:w-[340px] md:border-l md:border-t-0">
      {/* Header */}
      <div className="border-b border-stroke px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">
            {model.name} · {model.plot}
          </h2>
          <span
            className="mono flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] text-accent"
            style={{ background: 'var(--accent-soft)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            As-built
          </span>
        </div>
        <p className="mono mt-1 text-[11px] text-text-3">
          Reconstructed · {model.photoCount} photos · {model.date}
        </p>
      </div>

      {/* Surface */}
      <Section label="Surface">
        <div className="flex items-end gap-2">
          <span className="mono text-[38px] font-semibold leading-none">
            {model.surface.toLocaleString('en-US')} m²
          </span>
          <span className="mono text-[13px] text-accent">±{model.surfaceDelta}%</span>
        </div>
        <p className="mono mt-2 text-[11px] text-text-3">
          Horizontal projection · {(model.surface / 10000).toFixed(3)} ha · real 3D surface{' '}
          {model.surface3d.toLocaleString('en-US')} m²
        </p>
      </Section>

      {/* Dimensions */}
      <Section label="Elevations & dimensions">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-token)] bg-stroke">
          <Cell k="Width" v={`${model.width} m`} />
          <Cell k="Depth" v={`${model.depth} m`} />
          <Cell k="Perimeter" v={`${model.perimeter} m`} />
          <Cell k="Drop" v={`${model.drop} m`} />
          <Cell k="Min elev." v={`${model.minElevation} m`} />
          <Cell k="Max elev." v={`${model.maxElevation} m`} />
        </div>
      </Section>

      {/* Precision */}
      <Section label="Model precision">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-text-2">Mean error (RMSE)</span>
          <span className="mono text-[14px] font-semibold">{model.rmse} cm</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full" style={{ width: '86%', background: 'var(--accent)' }} />
        </div>
        <div className="mono mt-3 grid grid-cols-2 gap-2 text-[11px] text-text-3">
          <span>GSD {model.gsd} cm/px · Ground res.</span>
          <span className="text-right">{model.points} M · Mesh points</span>
        </div>
      </Section>

      {/* Layers */}
      <Section label="Layers">
        <LayerToggle name="Plot boundary" on={layers.boundary} onClick={() => toggleLayer('boundary')} />
        <LayerToggle name="Contours (0.5 m)" on={layers.contours} onClick={() => toggleLayer('contours')} />
        <LayerToggle name="Metric grid (1 m)" on={layers.grid} onClick={() => toggleLayer('grid')} />
      </Section>

      {/* Footer */}
      <div className="mt-auto flex gap-2 border-t border-stroke px-5 py-4">
        <button
          type="button"
          onClick={reset}
          className="mono flex-1 rounded-[var(--radius-token)] border border-stroke py-2.5 text-[13px] text-text-2 hover:text-text"
        >
          New
        </button>
        <button
          type="button"
          className="mono flex-1 rounded-[var(--radius-token)] py-2.5 text-[13px] font-medium text-on-accent"
          style={{ background: 'var(--accent)' }}
        >
          Export As-built
        </button>
      </div>
    </aside>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-stroke px-5 py-4">
      <p className="mono mb-3 text-[10.5px] uppercase tracking-[var(--label-track)] text-text-3">
        {label}
      </p>
      {children}
    </section>
  )
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-panel px-3 py-2.5">
      <p className="text-[11px] text-text-3">{k}</p>
      <p className="mono mt-0.5 text-[19px] font-semibold">{v}</p>
    </div>
  )
}

function LayerToggle({ name, on, onClick }: { name: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="text-[13px] text-text-2">{name}</span>
      <span
        className="relative h-4 w-7 rounded-full transition-colors"
        style={{ background: on ? 'var(--accent)' : 'var(--stroke-2)' }}
      >
        <span
          className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
          style={{ left: on ? '14px' : '2px' }}
        />
      </span>
    </button>
  )
}
