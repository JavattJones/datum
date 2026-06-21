import { useState } from 'react'
import { useAppStore, type Photo } from '@/store/appStore'
import { pipeline } from '@/lib/pipeline'
import { StepIndicator } from '@/components/upload/StepIndicator'
import { Dropzone } from '@/components/upload/Dropzone'
import { ThumbGrid } from '@/components/upload/ThumbGrid'

/** Demo sample set — used with the mock pipeline (no real files). */
function makeSamplePhotos(n: number, start: number): Photo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(),
    label: `IMG_${String(2040 + start + i).padStart(4, '0')}`,
  }))
}

/**
 * Phase 2 — Upload screen.
 * Step indicator → hero → dropzone (real drag & drop / file picker) → thumb
 * grid → upload foot. Reconstruct posts the photos to the pipeline backend.
 * Reference: reference/design-handoff/README.md › SCREEN Upload.
 */
export function UploadScreen() {
  const photos = useAppStore((s) => s.photos)
  const addPhotos = useAppStore((s) => s.addPhotos)
  const setScreen = useAppStore((s) => s.setScreen)
  const setJob = useAppStore((s) => s.setJob)
  const [submitting, setSubmitting] = useState(false)
  /** -1 = idle; 0–100 = uploading with real progress */
  const [uploadPct, setUploadPct] = useState(-1)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFiles = (files: File[]) => {
    addPhotos(
      files.map((file) => ({
        id: crypto.randomUUID(),
        label: file.name.replace(/\.[^.]+$/, ''),
        file,
      })),
    )
    setUploadError(null)
  }

  const handleSample = () => {
    if (photos.length === 0) addPhotos(makeSamplePhotos(18, photos.length))
    setUploadError(null)
  }

  const handleReconstruct = async () => {
    if (submitting || photos.length === 0) return
    setSubmitting(true)
    setUploadPct(0)
    setUploadError(null)
    try {
      const jobId = await pipeline.createJob(photos, (pct) => setUploadPct(pct))
      setJob(jobId)
      setScreen('processing')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(msg)
      setSubmitting(false)
      setUploadPct(-1)
    }
  }

  const uploading = submitting && uploadPct >= 0

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

        <Dropzone onFiles={handleFiles} onSample={handleSample} />

        <ThumbGrid photos={photos} />

        {photos.length > 0 && (
          <div className="mt-[30px] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-text-2">
                <b className="mono font-semibold text-text">{photos.length}</b> photographs · avg
                overlap <b className="mono font-semibold text-text">78%</b> · coverage{' '}
                <b className="mono font-semibold text-text">96%</b>
              </span>
              {uploadError && (
                <span className="text-[12px]" style={{ color: 'var(--danger)' }}>
                  {uploadError}
                </span>
              )}
            </div>

            {uploading ? (
              <UploadProgress pct={uploadPct} />
            ) : (
              <button
                type="button"
                onClick={handleReconstruct}
                disabled={submitting}
                className="inline-flex items-center gap-[9px] rounded-[var(--radius-token)] px-5 py-[11px] text-[14px] font-semibold text-on-accent transition-[filter] hover:brightness-105 disabled:opacity-70"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 0 0 1px var(--accent-line), 0 6px 20px var(--accent-soft)',
                }}
              >
                Reconstruct 3D model
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Compact progress bar shown in place of the Reconstruct button while uploading. */
function UploadProgress({ pct }: { pct: number }) {
  const label = pct >= 100 ? 'Starting reconstruction…' : 'Uploading photos…'
  // Keep the bar at least 4% wide so it's visible at the very start
  const barW = Math.max(pct, 4)

  return (
    <div className="flex min-w-[220px] flex-col gap-[7px]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] text-text-2">{label}</span>
        <span className="mono text-[13px] font-semibold text-accent">{pct}%</span>
      </div>
      <div
        className="h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: 'var(--stroke)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${barW}%`,
            background: 'var(--accent)',
            transition: 'width 150ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
