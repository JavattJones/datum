import { useAppStore } from '@/store/appStore'
import { Section } from './Section'

const ICON = (
  <>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </>
)

/** RMSE bar + GSD / mesh-points figures. */
export function PrecisionCard() {
  const model = useAppStore((s) => s.model)
  // Map RMSE onto the 0–5 cm "survey grade" track.
  const fill = Math.min(100, Math.max(0, (1 - model.rmse / 5) * 100))

  return (
    <Section icon={ICON} label="Model precision">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12.5px] text-text-2">Mean error (RMSE)</span>
        <span className="mono text-[13px] font-semibold">{model.rmse} cm</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[4px] border border-stroke bg-panel-2">
        <div
          className="h-full rounded-[4px]"
          style={{ width: `${fill}%`, background: 'linear-gradient(90deg, var(--accent-2), var(--accent))' }}
        />
      </div>
      <div className="mono mt-1.5 flex justify-between text-[9.5px] text-text-3">
        <span>0 cm</span>
        <span>Survey grade</span>
        <span>5 cm</span>
      </div>

      <div className="mt-4 flex gap-[18px]">
        <div>
          <p className="mono text-[18px] font-semibold leading-none">
            GSD {model.gsd}
            <small className="ml-0.5 text-[11px] font-normal text-text-2">cm/px</small>
          </p>
          <p className="mt-1 text-[11px] text-text-3">Ground resolution</p>
        </div>
        <div>
          <p className="mono text-[18px] font-semibold leading-none">{model.points} M</p>
          <p className="mt-1 text-[11px] text-text-3">Mesh points</p>
        </div>
      </div>
    </Section>
  )
}
