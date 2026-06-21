const STEPS = ['Capture', 'Process', '3D Model'] as const

/**
 * Upload step indicator: 3 mono chips with a numbered circle, joined by thin
 * separator lines. The active step (the first one on Upload) renders in accent.
 * Reference: README › SCREEN Upload › step-row.
 */
export function StepIndicator({ active = 0 }: { active?: number }) {
  return (
    <div className="mb-[30px] flex items-center gap-2.5">
      {STEPS.map((step, i) => (
        <div key={step} className="contents">
          <div
            className={`mono flex items-center gap-2 text-[12px] tracking-[0.04em] ${
              i === active ? 'text-accent' : 'text-text-3'
            }`}
          >
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[10px]"
              style={{
                border: `1px solid ${i === active ? 'var(--accent)' : 'var(--stroke-2)'}`,
                background: i === active ? 'var(--accent-soft)' : 'transparent',
                color: i === active ? 'var(--accent)' : 'inherit',
              }}
            >
              {i + 1}
            </span>
            <span className="whitespace-nowrap">{step}</span>
          </div>
          {i < STEPS.length - 1 && (
            <span className="h-px max-w-[48px] flex-1 bg-stroke" />
          )}
        </div>
      ))}
    </div>
  )
}
