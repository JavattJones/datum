import { useEffect, useState } from 'react'
import type { Photo } from '@/store/appStore'

/**
 * Resolve the preview URL for a photo: bundled samples expose a static `src`,
 * while photos picked from disk get a transient object URL (revoked on unmount).
 */
function usePhotoSrc(photo: Photo): string | undefined {
  const [url, setUrl] = useState<string | undefined>(photo.src)

  useEffect(() => {
    if (photo.src) {
      setUrl(photo.src)
      return
    }
    if (photo.file) {
      const objectUrl = URL.createObjectURL(photo.file)
      setUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    setUrl(undefined)
  }, [photo.src, photo.file])

  return url
}

function Thumb({ photo, index }: { photo: Photo; index: number }) {
  const src = usePhotoSrc(photo)

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-stroke bg-panel-2"
      style={{ animation: 'thumb-pop .4s ease backwards', animationDelay: `${index * 0.025}s` }}
    >
      {src ? (
        <img
          src={src}
          alt={photo.label}
          loading="lazy"
          decoding="async"
          className="block h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-text-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M4 7h4l2-2h4l2 2h4v12H4V7Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
      )}
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
