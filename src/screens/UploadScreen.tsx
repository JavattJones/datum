import { useAppStore, type Photo } from '@/store/appStore'
import { StepIndicator } from '@/components/upload/StepIndicator'
import { Dropzone } from '@/components/upload/Dropzone'
import { ThumbGrid } from '@/components/upload/ThumbGrid'

/** Demo sample set — replaced by the real upload in Phase 6. */
function makeSamplePhotos(n: number, start: number): Photo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(),
    label: `IMG_${String(2040 + start + i).padStart(4, '0')}`,
  }))
}

/**
 * Phase 2 — Upload screen.
 * Step indicator → hero → dropzone (real drag & drop) → thumb grid → upload foot.
 * Reference: reference/design-handoff/README.md › SCREEN Upload.
 */
export function UploadScreen() {
  const photos = useAppStore((s) => s.photos)
  const addPhotos = useAppStore((s) => s.addPhotos)
  const setScreen = useAppStore((s) => s.setScreen)

  // Demo: any add action loads the 18-photo sample set, once.
  const handleAdd = () => {
    if (photos.length === 0) addPhotos(makeSamplePhotos(18, photos.length))
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1060px] px-7 pb-16 pt-[52px]">
        <StepIndicator active={0} />

        <p className="mono mb-3.5 text-[12px] uppercase tracking-[0.16em] text-accent">New survey</p>
        <h1 className="mb-4 max-w-[16ch] text-[clamp(30px,4.4vw,46px)] font-[680] leading-[1.04] tracking-[-0.025em]">
          From photographs to a measurable model.
        </h1>
        <p className="mb-[38px] max-w-[52ch] text-[16px] leading-[1.55] text-text-2">
          Upload the flight or field image set. DATUM reconstructs the plot's 3D mesh, computes
          surface, elevations and contour lines, and georeferences it as an <em>as-built</em>.
        </p>

        <Dropzone onAdd={handleAdd} />

        <ThumbGrid photos={photos} />

        {photos.length > 0 && (
          <div className="mt-[30px] flex flex-wrap items-center justify-between gap-4">
            <span className="text-[13px] text-text-2">
              <b className="mono font-semibold text-text">{photos.length}</b> photographs · avg overlap{' '}
              <b className="mono font-semibold text-text">78%</b> · coverage{' '}
              <b className="mono font-semibold text-text">96%</b>
            </span>
            <button
              type="button"
              onClick={() => setScreen('processing')}
              className="inline-flex items-center gap-[9px] rounded-[var(--radius-token)] px-5 py-[11px] text-[14px] font-semibold text-on-accent transition-[filter] hover:brightness-105"
              style={{ background: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent-line), 0 6px 20px var(--accent-soft)' }}
            >
              Reconstruct 3D model
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
