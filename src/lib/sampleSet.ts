import type { Photo } from '@/store/appStore'

/**
 * Demo sample set — 11 real site photographs of a walled kitchen garden,
 * bundled in `/public/samples`. Loaded by the upload screen's "Use sample set"
 * to drive the mock pipeline with real imagery. Replaced by the architect's own
 * photo set in real use. (The originals carried no GPS/EXIF, so this dataset
 * stands in for a small, hand-georeferenced as-built.)
 */
const COUNT = 11

export function sampleSet(): Photo[] {
  return Array.from({ length: COUNT }, (_, i) => {
    const n = i + 1
    return {
      id: `sample-${n}`,
      label: `IMG_${4700 + n}`,
      src: `${import.meta.env.BASE_URL}samples/sample-${String(n).padStart(2, '0')}.jpg`,
    }
  })
}
