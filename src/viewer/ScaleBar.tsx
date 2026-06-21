/** Bottom-center scale reference (10 m). */
export function ScaleBar() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="flex flex-col items-center gap-1">
        <div className="scalebar-bar" />
        <span className="mono text-[10px] tracking-[0.05em] text-text-2">10 m</span>
      </div>
    </div>
  )
}
