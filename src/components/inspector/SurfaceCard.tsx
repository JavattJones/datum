import { useAppStore } from '@/store/appStore'
import { Section, fmtInt } from './Section'

const ICON = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.3" />
  </>
)

/** Hero surface metric + delta + projection subtext. */
export function SurfaceCard() {
  const model = useAppStore((s) => s.model)
  return (
    <Section icon={ICON} label="Surface">
      <div className="flex items-baseline gap-2">
        <span className="mono text-[38px] font-semibold leading-none tracking-[-0.02em]">
          {fmtInt(model.surface)}
        </span>
        <span className="mono text-[16px] text-text-2">m²</span>
        <span className="mono ml-auto flex items-center gap-1 text-[11px] text-accent">
          <svg className="h-[11px] w-[11px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          ±{model.surfaceDelta}%
        </span>
      </div>
      <p className="mt-[9px] text-[12px] text-text-3">
        Horizontal projection · {(model.surface / 10000).toFixed(3)} ha · real 3D surface{' '}
        <b className="text-text-2">{fmtInt(model.surface3d)} m²</b>
      </p>
    </Section>
  )
}
