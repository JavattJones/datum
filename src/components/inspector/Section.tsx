import type { ReactNode } from 'react'

/** Inspector section with an accent-iconed uppercase label. */
export function Section({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-stroke px-5 py-4">
      <p className="mono mb-3.5 flex items-center gap-2 text-[10.5px] uppercase tracking-[var(--label-track)] text-text-3">
        <svg className="h-[13px] w-[13px] text-accent" viewBox="0 0 24 24" fill="none">
          {icon}
        </svg>
        {label}
      </p>
      {children}
    </section>
  )
}

/** Thousands-separated integer with spaces (reference style: "1 623"). */
export function fmtInt(n: number): string {
  return n.toLocaleString('en-US').replace(/,/g, ' ')
}
