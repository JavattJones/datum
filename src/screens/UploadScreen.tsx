import { useAppStore, type Photo } from '@/store/appStore'

const STEPS = ['Capture', 'Process', '3D Model'] as const

function makeSamplePhotos(n: number): Photo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(),
    label: `IMG_${2040 + i}`,
  }))
}

/**
 * Phase 2 — Upload screen (scaffold).
 * TODO: real drag & drop, thumb grid with canvas previews, upload foot meta.
 */
export function UploadScreen() {
  const photos = useAppStore((s) => s.photos)
  const addPhotos = useAppStore((s) => s.addPhotos)
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1060px] px-7 pb-16 pt-12">
        {/* Step indicator */}
        <div className="mono mb-10 flex items-center gap-3 text-[12px]">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className={i === 0 ? 'text-accent' : 'text-text-3'}>
                <span
                  className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full border"
                  style={{ borderColor: i === 0 ? 'var(--accent)' : 'var(--stroke-2)' }}
                >
                  {i + 1}
                </span>
                {step}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-8 bg-stroke-2" />}
            </div>
          ))}
        </div>

        <p className="mono mb-3 text-[12px] uppercase tracking-[0.16em] text-accent">
          New survey
        </p>
        <h1 className="max-w-[16ch] text-[clamp(30px,4.4vw,46px)] font-[680] leading-[1.04] tracking-[-0.025em]">
          From photographs to a measurable model.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.55] text-text-2">
          Upload your site photos and DATUM reconstructs a metric 3D model, ready to navigate,
          measure and georeference as an <em>as-built</em>.
        </p>

        {/* Dropzone (scaffold) */}
        <div
          className="mt-9 grid place-items-center rounded-[var(--radius-token)] px-8 py-12 text-center"
          style={{ border: '1.5px dashed var(--stroke-2)' }}
        >
          <div
            className="grid h-14 w-14 place-items-center rounded-[14px] text-accent"
            style={{ background: 'var(--accent-soft)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </div>
          <h3 className="mt-4 text-[17px] font-semibold">Drop your photographs here</h3>
          <p className="mono mt-1 text-[12px] text-text-3">
            JPG, PNG or RAW · 40–300 overlapping shots recommended
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => addPhotos(makeSamplePhotos(18))}
              className="mono rounded-[var(--radius-token)] px-5 py-2.5 text-[13px] font-medium text-on-accent"
              style={{ background: 'var(--accent)' }}
            >
              Use sample set
            </button>
          </div>
        </div>

        {/* Upload foot */}
        {photos.length > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-[var(--radius-token)] border border-stroke bg-panel px-5 py-4">
            <span className="mono text-[12px] text-text-2">
              {photos.length} photographs · avg overlap 78% · coverage 96%
            </span>
            <button
              type="button"
              onClick={() => setScreen('processing')}
              className="mono flex items-center gap-2 rounded-[var(--radius-token)] px-5 py-2.5 text-[13px] font-medium text-on-accent"
              style={{ background: 'var(--accent)' }}
            >
              Reconstruct 3D model
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
