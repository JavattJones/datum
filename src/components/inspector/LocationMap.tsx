import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { Section } from './Section'

const ICON = (
  <>
    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
  </>
)

/** Demo as-built locations cycled by Relocate (Madrid → BCN → Sevilla → VLC). */
const COORDS: [number, number][] = [
  [40.4168, -3.7038],
  [41.3874, 2.1686],
  [37.3891, -5.9845],
  [39.4699, -0.3763],
]

/** Schematic city map drawn to canvas — replaced by MapLibre in production. */
function drawMap(canvas: HTMLCanvasElement, ci: number) {
  const x = canvas.getContext('2d')
  if (!x) return
  const W = canvas.width
  const H = canvas.height
  const cs = getComputedStyle(document.documentElement)
  const acc = cs.getPropertyValue('--accent').trim() || '#2dd4a7'
  const stroke = cs.getPropertyValue('--stroke-2').trim() || '#2a333f'
  const isLight = cs.getPropertyValue('--bg').trim() === '#f3f4f1'

  x.fillStyle = isLight ? '#e8ebe5' : '#0c1116'
  x.fillRect(0, 0, W, H)

  // street grid
  x.strokeStyle = stroke
  x.globalAlpha = 0.5
  x.lineWidth = 1
  const off = (ci * 40) % 80
  for (let gx = -off; gx < W; gx += 64) {
    x.beginPath()
    x.moveTo(gx, 0)
    x.lineTo(gx + 40, H)
    x.stroke()
  }
  for (let gy = 20; gy < H; gy += 50) {
    x.beginPath()
    x.moveTo(0, gy)
    x.lineTo(W, gy - 26)
    x.stroke()
  }
  x.globalAlpha = 1

  // blocks
  x.fillStyle = isLight ? '#dfe3dc' : '#11171e'
  for (let k = 0; k < 6; k++) x.fillRect((k * 97 + ci * 30) % W, (k * 61) % H, 46, 30)

  // river
  x.strokeStyle = isLight ? '#bcd0d8' : '#16323b'
  x.lineWidth = 10
  x.globalAlpha = 0.8
  x.beginPath()
  x.moveTo(-10, H * 0.2 + ci * 8)
  x.bezierCurveTo(W * 0.3, H * 0.5, W * 0.6, H * 0.3, W + 10, H * 0.7)
  x.stroke()
  x.globalAlpha = 1

  // parcel polygon (center)
  x.save()
  x.translate(W / 2, H * 0.5)
  x.rotate(0.18 + ci * 0.3)
  x.beginPath()
  x.moveTo(-46, -30)
  x.lineTo(48, -26)
  x.lineTo(42, 30)
  x.lineTo(-50, 26)
  x.closePath()
  x.fillStyle = acc + '33'
  x.fill()
  x.strokeStyle = acc
  x.lineWidth = 2
  x.stroke()
  x.fillStyle = acc
  ;[
    [-46, -30],
    [48, -26],
    [42, 30],
    [-50, 26],
  ].forEach((p) => {
    x.beginPath()
    x.arc(p[0], p[1], 2.6, 0, 7)
    x.fill()
  })
  x.restore()
}

/** Location section: schematic map + coordinates + Relocate. */
export function LocationMap() {
  const location = useAppStore((s) => s.location)
  const cycleLocation = useAppStore((s) => s.cycleLocation)
  const theme = useAppStore((s) => s.theme)
  const georef = useAppStore((s) => s.georef)
  const ref = useRef<HTMLCanvasElement>(null)

  // No GPS/EXIF data → the pipeline couldn't georeference the model.
  const hasGps = georef !== null

  useEffect(() => {
    if (ref.current) drawMap(ref.current, location)
  }, [location, theme])

  const [lat, lon] = COORDS[location]
  const coord = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(4)}° ${
    lon >= 0 ? 'E' : 'W'
  }`

  if (!hasGps) {
    return (
      <Section icon={ICON} label="Location · As-built">
        <div className="rounded-[10px] border border-dashed border-stroke-2 bg-panel px-4 py-6 text-center">
          <p className="mono text-[12px] text-text-2">No GPS / EXIF data</p>
          <p className="mt-1.5 text-[11px] text-text-3">
            Add ground control points to georeference this as-built.
          </p>
        </div>
      </Section>
    )
  }

  return (
    <Section icon={ICON} label="Location · As-built">
      <div className="relative overflow-hidden rounded-[10px] border border-stroke">
        <canvas ref={ref} width={600} height={260} className="block h-[130px] w-full" role="img" aria-label="As-built location map" />
        <div className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-full text-accent">
          <svg className="h-[26px] w-[26px]" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }}>
            <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-stroke bg-panel px-3 py-2.5">
          <span className="mono text-[11px] text-text-2">{coord}</span>
          <button
            type="button"
            onClick={cycleLocation}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-accent"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
              <path d="M4 13v7h7m9-9V4h-7M4 11 20 4M4 20l9-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Relocate
          </button>
        </div>
      </div>
    </Section>
  )
}
