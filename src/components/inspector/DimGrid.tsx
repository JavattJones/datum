import { useAppStore } from '@/store/appStore'
import { Section } from './Section'

const ICON = (
  <path
    d="M3 21V3M3 21h18M7 21v-4m4 4v-8m4 8v-5m4 5V8"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  />
)

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-panel px-3.5 py-[13px]">
      <p className="mono mb-[7px] text-[10px] uppercase tracking-[0.05em] text-text-3">{k}</p>
      <p className="mono text-[19px] font-semibold tracking-[-0.01em]">
        {v} <small className="text-[11px] font-normal text-text-2">m</small>
      </p>
    </div>
  )
}

/** 2×3 grid of elevation & dimension metrics. */
export function DimGrid() {
  const model = useAppStore((s) => s.model)
  return (
    <Section icon={ICON} label="Elevations & dimensions">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-stroke bg-stroke">
        <Cell k="Width" v={model.width.toFixed(2)} />
        <Cell k="Depth" v={model.depth.toFixed(2)} />
        <Cell k="Perimeter" v={model.perimeter.toFixed(1)} />
        <Cell k="Drop" v={model.drop.toFixed(2)} />
        <Cell k="Min elev." v={model.minElevation.toFixed(1)} />
        <Cell k="Max elev." v={model.maxElevation.toFixed(1)} />
      </div>
    </Section>
  )
}
