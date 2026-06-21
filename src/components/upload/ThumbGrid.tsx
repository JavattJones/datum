import { useEffect, useRef } from 'react'
import type { Photo } from '@/store/appStore'

/** Terrain washes for the procedural site-photo previews (demo data only). */
const PALETTES: [string, string, string][] = [
  ['#3d5a3a', '#6b8e4e', '#a8b56a'],
  ['#4a6741', '#7a9b5a', '#c2c081'],
  ['#2f4a35', '#5c7d48', '#9aae5f'],
  ['#5a6b3c', '#8a9b54', '#bcc488'],
  ['#3a5240', '#688a52', '#a6b870'],
  ['#465c38', '#7d985a', '#cabf86'],
]

/** Deterministic PRNG so a thumbnail looks identical across re-renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Draws a plausible aerial site photo (procedural placeholder, demo only). */
function drawThumb(canvas: HTMLCanvasElement, i: number) {
  const x = canvas.getContext('2d')
  if (!x) return
  const rnd = mulberry32(i + 1)
  const pal = PALETTES[i % PALETTES.length]

  const g = x.createLinearGradient(0, 0, 160, 120)
  g.addColorStop(0, pal[0])
  g.addColorStop(0.55, pal[1])
  g.addColorStop(1, pal[2])
  x.fillStyle = g
  x.fillRect(0, 0, 160, 120)

  // field rows
  x.save()
  x.translate(80, 60)
  x.rotate((((i * 37) % 90) - 45) * (Math.PI / 180))
  x.globalAlpha = 0.18
  x.strokeStyle = '#1c2a16'
  x.lineWidth = 1
  for (let k = -120; k < 120; k += 9) {
    x.beginPath()
    x.moveTo(k, -120)
    x.lineTo(k, 120)
    x.stroke()
  }
  x.restore()

  // patches
  for (let k = 0; k < 5; k++) {
    x.globalAlpha = 0.12 + rnd() * 0.16
    x.fillStyle = rnd() > 0.5 ? '#27381c' : '#c9cf95'
    x.beginPath()
    x.ellipse(rnd() * 160, rnd() * 120, 14 + rnd() * 30, (14 + rnd() * 30) * 0.7, rnd() * 3, 0, 7)
    x.fill()
  }

  // path / road
  x.globalAlpha = 0.5
  x.strokeStyle = '#d8d2b4'
  x.lineWidth = 2.4
  x.beginPath()
  x.moveTo(-5, 30 + (i % 40))
  x.bezierCurveTo(50, 60, 110, 40, 165, 80 + (i % 20))
  x.stroke()
  x.globalAlpha = 1

  // vignette
  const v = x.createRadialGradient(80, 60, 20, 80, 60, 100)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.28)')
  x.fillStyle = v
  x.fillRect(0, 0, 160, 120)
}

function Thumb({ photo, index }: { photo: Photo; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) drawThumb(ref.current, index)
  }, [index])

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-stroke bg-panel-2"
      style={{ animation: 'thumb-pop .4s ease backwards', animationDelay: `${index * 0.025}s` }}
    >
      <canvas ref={ref} width={160} height={120} className="block h-full w-full" />
      <span className="mono absolute bottom-1.5 left-[7px] rounded-[5px] bg-black/45 px-1.5 py-0.5 text-[9.5px] tracking-[0.04em] text-white">
        {photo.label}
      </span>
      <span
        className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
    </div>
  )
}

/** Grid of uploaded site photos (4:3 tiles, staggered pop-in). */
export function ThumbGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null
  return (
    <div
      className="mt-[26px] grid gap-2.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}
    >
      {photos.map((photo, i) => (
        <Thumb key={photo.id} photo={photo} index={i} />
      ))}
    </div>
  )
}
