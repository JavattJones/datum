import * as THREE from 'three'

/**
 * Procedural terrain — a deterministic placeholder for the real photogrammetry
 * mesh (replaced by the pipeline's glTF in Phase 6). Ported from the reference
 * Three.js prototype (reference/design-handoff/viewer.js): value-noise fBm
 * heightfield, colored by elevation, with the parcel footprint mapped to the
 * scene. Pure geometry/data — no React, no rendering.
 */

/** Real-world parcel footprint (meters). */
export const PARCEL = { w: 48.6, d: 33.4 }
const SIZE = 10 // scene units across (maps to PARCEL.w)
const SEG = 140
const HEIGHT = 1.55

const DEPTH_UNITS = (SIZE * PARCEL.d) / PARCEL.w

function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PERM = (() => {
  const rnd = mulberry32(20240611)
  const p = new Float32Array(256 * 256)
  for (let i = 0; i < p.length; i++) p[i] = rnd()
  return p
})()

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const g = (ix: number, iy: number) => PERM[(((ix & 255) + ((iy & 255) * 256)) & 65535)]
  const a = g(xi, yi)
  const b = g(xi + 1, yi)
  const c = g(xi, yi + 1)
  const d = g(xi + 1, yi + 1)
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}

function fbm(x: number, y: number): number {
  let s = 0
  let amp = 0.5
  let f = 1
  for (let o = 0; o < 5; o++) {
    s += amp * vnoise(x * f, y * f)
    f *= 2.03
    amp *= 0.5
  }
  return s
}

/** Height (scene units) at normalized parcel coords u,v ∈ [0,1]. */
function heightAt(u: number, v: number): number {
  const n = fbm(u * 3.1 + 10, v * 3.1 + 4)
  const ridge = Math.pow(Math.sin(u * Math.PI * 0.9) * Math.cos(v * Math.PI * 0.7), 2) * 0.4
  const slope = u * 0.35 + v * 0.18
  return (n * 0.8 + ridge + slope) * HEIGHT
}

/** A floating label anchored to a 3D point projected by the viewer each frame. */
export interface DimAnchor {
  type: 'edge' | 'area'
  label: string
  position: [number, number, number]
}

export interface TerrainData {
  geometry: THREE.BufferGeometry
  /** White contour points (one merged cloud); toggled by the contours layer. */
  contours: THREE.BufferGeometry
  /** Parcel corners (closed loop drawn as the boundary). */
  corners: THREE.Vector3[]
  /** Lowest reconstructed elevation (scene units) — grid/posts sit just below. */
  elevMin: number
  elevMax: number
  /** Floating dimension labels (4 edges + area). */
  anchors: DimAnchor[]
}

/** Build the terrain geometry + derived overlays once (deterministic). */
export function buildTerrain(): TerrainData {
  const rows = Math.round(SEG * (PARCEL.d / PARCEL.w))
  const geo = new THREE.PlaneGeometry(SIZE, DEPTH_UNITS, SEG, rows)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position
  const halfX = SIZE / 2
  const halfZ = DEPTH_UNITS / 2
  let elevMin = Infinity
  let elevMax = -Infinity

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const u = (x + halfX) / SIZE
    const v = (z + halfZ) / DEPTH_UNITS
    const h = heightAt(u, v)
    pos.setY(i, h)
    if (h < elevMin) elevMin = h
    if (h > elevMax) elevMax = h
  }

  // Color by elevation: meadow green → olive → sand.
  const c1 = new THREE.Color('#1f6f54')
  const c2 = new THREE.Color('#9bb04e')
  const c3 = new THREE.Color('#d9c98f')
  const colors: number[] = []
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - elevMin) / (elevMax - elevMin)
    const col = t < 0.5 ? c1.clone().lerp(c2, t * 2) : c2.clone().lerp(c3, (t - 0.5) * 2)
    colors.push(col.r, col.g, col.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  // Corners (for boundary + dimension anchors).
  const cs: [number, number][] = [
    [-halfX, -halfZ],
    [halfX, -halfZ],
    [halfX, halfZ],
    [-halfX, halfZ],
  ]
  const corners = cs.map(([x, z]) => {
    const u = (x + halfX) / SIZE
    const v = (z + halfZ) / DEPTH_UNITS
    return new THREE.Vector3(x, heightAt(u, v) + 0.04, z)
  })

  // Dimension anchors: 4 edge midpoints (width/depth) + center (area).
  const edgeLabel = (i: number) => (i % 2 === 0 ? `${PARCEL.w} m` : `${PARCEL.d} m`)
  const anchors: DimAnchor[] = corners.map((a, i) => {
    const b = corners[(i + 1) % 4]
    const mid = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.25, 0))
    return { type: 'edge', label: edgeLabel(i), position: [mid.x, mid.y, mid.z] }
  })
  const center = corners
    .reduce((s, c) => s.add(c.clone()), new THREE.Vector3())
    .multiplyScalar(0.25)
    .add(new THREE.Vector3(0, 0.6, 0))
  anchors.push({
    type: 'area',
    label: `${Math.round(PARCEL.w * PARCEL.d)} m²`,
    position: [center.x, center.y, center.z],
  })

  const contours = buildContours(geo, elevMin, elevMax, rows)

  return { geometry: geo, contours, corners, elevMin, elevMax, anchors }
}

/** Coarse contour cloud: grid cells the level plane passes through. */
function buildContours(
  geo: THREE.BufferGeometry,
  elevMin: number,
  elevMax: number,
  rows: number,
): THREE.BufferGeometry {
  const pos = geo.attributes.position
  const cols = SEG + 1
  const nRows = rows + 1
  const levels = 7
  const pts: number[] = []
  for (let l = 1; l < levels; l++) {
    const y = elevMin + (elevMax - elevMin) * (l / levels)
    for (let r = 0; r < nRows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i = r * cols + c
        const yy = [pos.getY(i), pos.getY(i + 1), pos.getY(i + cols), pos.getY(i + cols + 1)]
        const mn = Math.min(...yy)
        const mx = Math.max(...yy)
        if (y > mn && y < mx) pts.push(pos.getX(i), y + 0.01, pos.getZ(i))
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}
