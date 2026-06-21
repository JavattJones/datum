import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { pipeline, downloadArtifact, EXPORT_LABELS, type ExportFormat } from '@/lib/pipeline'
import { SurfaceCard } from './SurfaceCard'
import { DimGrid } from './DimGrid'
import { PrecisionCard } from './PrecisionCard'
import { LocationMap } from './LocationMap'
import { LayerList } from './LayerList'

type ExportState = 'idle' | 'generating' | 'done'
const FORMATS: ExportFormat[] = ['gltf', 'geojson', 'dxf', 'pdf']

/** Export As-built button: pick a format → backend produces & downloads it. */
function ExportButton() {
  const jobId = useAppStore((s) => s.jobId)
  const [state, setState] = useState<ExportState>('idle')
  const [open, setOpen] = useState(false)
  const timer = useRef<number>(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const run = async (format: ExportFormat) => {
    setOpen(false)
    if (state !== 'idle' || !jobId) return
    setState('generating')
    try {
      const artifact = await pipeline.exportAsset(jobId, format)
      downloadArtifact(artifact)
      setState('done')
      timer.current = window.setTimeout(() => setState('idle'), 1600)
    } catch (err) {
      console.error('[DATUM] export failed:', err)
      setState('idle')
    }
  }

  return (
    <div className="relative flex-[1.4]">
      {open && state === 'idle' && (
        <div
          className="absolute bottom-[calc(100%+6px)] left-0 right-0 overflow-hidden rounded-[var(--radius-token)] border border-stroke bg-panel"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => run(f)}
              className="mono block w-full px-3 py-2 text-left text-[12px] text-text-2 transition-colors hover:bg-panel-2 hover:text-text"
            >
              {EXPORT_LABELS[f]}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => (state === 'idle' ? setOpen((o) => !o) : undefined)}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-token)] py-2.5 text-[13px] font-semibold text-on-accent transition-[filter] hover:brightness-105"
        style={{ background: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent-line)' }}
      >
        {state === 'generating' ? (
          <>
            <span
              className="h-[15px] w-[15px] animate-spin rounded-full"
              style={{ border: '2px solid rgba(4,19,13,.3)', borderTopColor: '#04130d', animationDuration: '0.7s' }}
            />
            Generating…
          </>
        ) : state === 'done' ? (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exported
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export As-built
          </>
        )}
      </button>
    </div>
  )
}

/** Phase 5 — Inspector data panel (desktop side panel / mobile bottom sheet). */
export function Inspector() {
  const model = useAppStore((s) => s.model)
  const reset = useAppStore((s) => s.reset)
  const [open, setOpen] = useState(false)

  return (
    <aside
      className={`insp-sheet flex w-full flex-col overflow-hidden border-stroke bg-bg-2 min-[880px]:w-[340px] min-[880px]:flex-none min-[880px]:border-l ${
        open ? 'open' : ''
      }`}
    >
      {/* Mobile grab tab (hidden on desktop via CSS) */}
      <button type="button" className="insp-mobile-tab relative" onClick={() => setOpen((o) => !o)}>
        <span className="grip" />
        <svg className="h-[15px] w-[15px] text-accent" viewBox="0 0 24 24" fill="none">
          <path d="M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        Model data
      </button>

      {/* Header */}
      <div className="border-b border-stroke px-5 pb-3.5 pt-[18px]">
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="text-[17px] font-[660] tracking-[-0.01em]">
            {model.name} · {model.plot}
          </h2>
          <span
            className="mono flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10.5px] uppercase tracking-[0.06em] text-accent"
            style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
          >
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: 'var(--accent)' }} />
            As-built
          </span>
        </div>
        <p className="mono mt-[7px] text-[12.5px] text-text-2">
          Reconstructed · {model.photoCount} photos · {model.date}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-6 pt-1.5">
        <SurfaceCard />
        <DimGrid />
        <PrecisionCard />
        <LocationMap />
        <LayerList />
      </div>

      {/* Footer */}
      <div className="flex gap-2.5 border-t border-stroke bg-bg-2 px-5 py-3.5">
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-token)] border border-stroke-2 bg-panel px-4 py-2.5 text-[13px] font-semibold text-text transition-colors hover:border-text-3"
        >
          New
        </button>
        <ExportButton />
      </div>
    </aside>
  )
}
