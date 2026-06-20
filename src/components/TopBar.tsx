import { useAppStore } from '@/store/appStore'
import { THEMES } from '@/theme/tokens'

export function TopBar() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 border-b border-stroke bg-bg-2 px-4"
      style={{ borderBottomWidth: 1 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-[27px] w-[27px] place-items-center rounded-[7px] text-on-accent"
          style={{ background: 'var(--accent)' }}
          aria-hidden
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold tracking-[0.16em] text-text">DATUM</span>
          <span className="mono hidden border-l border-stroke pl-2.5 text-[10px] uppercase tracking-[0.13em] text-text-3 sm:inline">
            Photogrammetry Suite
          </span>
        </div>
      </div>

      {/* Project pill */}
      <div className="mono hidden items-center gap-2 rounded-full border border-stroke bg-panel px-3 py-1.5 text-[11px] text-text-2 sm:flex">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        Parcela P-204 · Vega Norte
      </div>

      <div className="flex-1" />

      {/* Theme switch */}
      <div
        className="flex items-center gap-0.5 rounded-[7px] border border-stroke bg-panel p-0.5"
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
              className={`mono flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] transition-colors ${
                active ? 'bg-panel-2 text-text' : 'text-text-3 hover:text-text-2'
              }`}
            >
              <span
                className="h-[11px] w-[11px] rounded-full border"
                style={{
                  borderColor: t.swatch,
                  background: active ? t.swatch : 'transparent',
                }}
              />
              <span className="hidden md:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Help */}
      <button
        type="button"
        aria-label="Help"
        className="grid h-[34px] w-[34px] place-items-center rounded-[5px] border border-stroke bg-panel text-text-2 transition-colors hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
    </header>
  )
}
