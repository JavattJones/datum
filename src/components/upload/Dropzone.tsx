import { useRef, useState } from 'react'

const HINTS = ['GPS / EXIF detection', 'Automatic overlap', 'Real metric scale'] as const

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

interface Props {
  /** Real photos picked from disk or dropped (posted to the backend). */
  onFiles: (files: File[]) => void
  /** Load the demo sample set (mock pipeline). */
  onSample: () => void
}

/**
 * Upload dropzone with real drag & drop. Dragging files applies the `.drag`
 * accent state; dropping or picking files posts them to the pipeline, while
 * "Use sample set" loads the demo set. Reference: README › Dropzone.
 */
export function Dropzone({ onFiles, onSample }: Props) {
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const handleFiles = (list: FileList | null) => {
    const files = list ? Array.from(list).filter((f) => f.type.startsWith('image/')) : []
    if (files.length) onFiles(files)
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        setDrag(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
        else onSample()
      }}
      className="relative flex flex-col items-center overflow-hidden rounded-[var(--radius-token)] bg-panel px-8 py-[46px] text-center transition-colors"
      style={{
        border: `1.5px dashed ${drag ? 'var(--accent)' : 'var(--stroke-2)'}`,
        background: drag ? 'var(--accent-soft)' : 'var(--panel)',
      }}
    >
      <div
        className="mb-[18px] grid h-14 w-14 place-items-center rounded-[14px] border border-stroke text-accent"
        style={{ background: 'var(--panel-2)' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4m0 0L8 8m4-4 4 4" />
          <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>
      </div>

      <h3 className="mb-[7px] text-[18px] font-[620] tracking-[-0.01em]">Drop your photographs here</h3>
      <p className="mb-[22px] text-[13.5px] text-text-2">
        JPG, PNG or RAW · 40–300 overlapping shots recommended
      </p>

      <div className="flex flex-wrap justify-center gap-2.5">
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-[9px] rounded-[var(--radius-token)] px-5 py-[11px] text-[14px] font-semibold text-on-accent transition-[filter] hover:brightness-105"
          style={{ background: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent-line), 0 6px 20px var(--accent-soft)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M4 7h4l2-2h4l2 2h4v12H4V7Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          Select photos
        </button>
        <button
          type="button"
          onClick={onSample}
          className="inline-flex items-center rounded-[var(--radius-token)] border border-stroke-2 bg-panel px-5 py-[11px] text-[14px] font-semibold text-text transition-colors hover:border-text-3"
        >
          Use sample set
        </button>
      </div>

      <div className="mt-[22px] flex flex-wrap justify-center gap-x-[18px] gap-y-[7px]">
        {HINTS.map((hint) => (
          <span key={hint} className="mono flex items-center gap-[7px] text-[12px] text-text-3">
            <span className="h-3.5 w-3.5 text-accent">
              <Check />
            </span>
            {hint}
          </span>
        ))}
      </div>
    </div>
  )
}
