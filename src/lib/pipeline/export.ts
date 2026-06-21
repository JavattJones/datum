import type { GeoRef, ModelData } from '@/store/appStore'
import type { ExportArtifact, ExportFormat } from './types'

/**
 * Client-side as-built exporters used by the mock adapter (and as a fallback).
 * A real backend would serve these assets directly; here we synthesize valid,
 * openable files from the model + georeferencing so the export flow is real.
 */
export function buildArtifact(
  format: ExportFormat,
  model: ModelData,
  georef: GeoRef,
): ExportArtifact {
  const base = `${model.name.replace(/\s+/g, '-')}_${model.plot}`.toLowerCase()
  switch (format) {
    case 'geojson':
      return { filename: `${base}.geojson`, blob: json(geojson(model, georef)) }
    case 'gltf':
      return { filename: `${base}.gltf`, blob: json(minimalGltf(model)) }
    case 'dxf':
      return { filename: `${base}.dxf`, blob: text(dxf(georef)) }
    case 'pdf':
      return { filename: `${base}-report.txt`, blob: text(report(model, georef)) }
  }
}

const json = (o: unknown) => new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' })
const text = (s: string) => new Blob([s], { type: 'text/plain' })

/** GeoJSON FeatureCollection: the plot boundary + metric properties. */
function geojson(model: ModelData, georef: GeoRef) {
  const ring = [...georef.boundary, georef.boundary[0]]
  return {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: georef.epsg } },
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: {
          name: `${model.name} · ${model.plot}`,
          surface_m2: model.surface,
          surface_3d_m2: model.surface3d,
          perimeter_m: model.perimeter,
          drop_m: model.drop,
          rmse_cm: model.rmse,
          gsd_cm_px: model.gsd,
        },
      },
    ],
  }
}

/** Minimal valid glTF 2.0 envelope (metadata-only, no buffers). */
function minimalGltf(model: ModelData) {
  return {
    asset: { version: '2.0', generator: 'DATUM as-built export' },
    extras: { plot: `${model.name} · ${model.plot}`, surface_m2: model.surface },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [{ name: `${model.name}-${model.plot}` }],
  }
}

/** Tiny DXF with the boundary polyline (R12 ASCII). */
function dxf(georef: GeoRef): string {
  const verts = georef.boundary
    .map(([lon, lat]) => `0\nVERTEX\n8\nBOUNDARY\n10\n${lon}\n20\n${lat}\n`)
    .join('')
  return [
    '0\nSECTION\n2\nENTITIES\n',
    '0\nPOLYLINE\n8\nBOUNDARY\n66\n1\n70\n1\n',
    verts,
    '0\nSEQEND\n',
    '0\nENDSEC\n0\nEOF\n',
  ].join('')
}

/** Plain-text as-built report (stand-in for a rendered PDF). */
function report(model: ModelData, georef: GeoRef): string {
  return [
    `DATUM — As-built report`,
    `Plot: ${model.name} · ${model.plot}`,
    `Reconstructed from ${model.photoCount} photos · ${model.date}`,
    ``,
    `Surface (horizontal): ${model.surface} m²`,
    `Surface (real 3D):    ${model.surface3d} m²`,
    `Width × Depth:        ${model.width} × ${model.depth} m`,
    `Perimeter:            ${model.perimeter} m`,
    `Elevation drop:       ${model.drop} m (${model.minElevation}–${model.maxElevation} m)`,
    `RMSE:                 ${model.rmse} cm`,
    `GSD:                  ${model.gsd} cm/px`,
    `Mesh points:          ${model.points} M`,
    ``,
    `CRS:    ${georef.epsg}`,
    `Center: ${georef.center[0].toFixed(5)}, ${georef.center[1].toFixed(5)}`,
  ].join('\n')
}

/** Trigger a browser download for a produced artifact. */
export function downloadArtifact({ filename, blob }: ExportArtifact) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
