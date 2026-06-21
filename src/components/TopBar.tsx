import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { THEMES } from '@/theme/tokens'
import { HelpDialog } from '@/components/HelpDialog'

export function TopBar() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-stroke bg-bg-2 px-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-[27px] w-[27px] place-items-center rounded-[7px] text-on-accent"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 0 0 1px var(--accent-line), 0 0 18px var(--accent-soft)',
          }}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex items-center gap-3">
          <span className="brand-name text-[15px] font-bold text-text">DATUM</span>
          <span className="mono border-l border-stroke pl-3 text-[10px] uppercase tracking-[0.1em] text-text-3 max-[720px]:hidden">
            Photogrammetry Suite
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Project pill */}
      <div className="mono flex items-center gap-2.5 rounded-full border border-stroke bg-panel px-[13px] py-1.5 text-[12.5px] text-text-2 max-[720px]:hidden">
        <span
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
        />
        <span>
          Parcela <b className="font-semibold text-text">P-204</b> · Vega Norte
        </span>
      </div>

      {/* Theme switch (pill) */}
      <div
        className="flex items-center gap-0.5 rounded-full border border-stroke bg-panel p-[3px]"
        role="group"
        aria-label="Theme"
      >
        {THEMES.map((t) => {
          const active = t.id === theme
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              className={`mono flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors max-[860px]:px-[7px] ${
                active ? 'bg-panel-2 text-text' : 'text-text-3 hover:text-text-2'
              }`}
              style={active ? { boxShadow: 'inset 0 0 0 1px var(--stroke)' } : undefined}
            >
              <span
                className="h-[11px] w-[11px] rounded-full"
                style={{
                  border: `1.5px solid ${active ? t.swatch : 'currentColor'}`,
                  background: active ? t.swatch : 'transparent',
                }}
              />
              <span className="max-[860px]:hidden">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Help */}
      <button
        type="button"
        aria-label="Help"
        aria-haspopup="dialog"
        onClick={() => setHelpOpen(true)}
        className="grid h-[34px] w-[34px] place-items-center rounded-full border border-stroke bg-panel text-text-2 transition-colors hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}
