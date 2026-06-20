# Conventions

> Extreme homogeneity. The model predicts better when the repo looks like
> itself everywhere.

## TypeScript / React

- **Strict TypeScript.** No `any` without an inline justification comment.
- **Function components + hooks.** No classes.
- **Named exports** for components/utilities (`export function TopBar()`),
  default export only for screen/page roots where it reads naturally.
- **Props typed inline or with a local `interface Props`.** No `React.FC`.
- **Imports:** external packages first, then `@/` aliases, then relative. The
  `@/*` alias maps to `src/*`.
- **Store access is granular:** select one slice per `useAppStore((s) => s.x)`
  call, not the whole store object, to avoid needless re-renders.

## Styling (Tailwind v4 + tokens)

- Use Tailwind utilities mapped to tokens: `bg-bg-2`, `text-text-2`,
  `border-stroke`, `text-accent`. For tokens without a utility, use
  `style={{ background: 'var(--accent)' }}` or arbitrary values
  `rounded-[var(--radius-token)]`.
- **Never** paste a raw hex that an existing token already covers.
- Numeric data gets the `mono` class (or `font-mono`).
- Respect the responsive breakpoints from the reference: 880 / 860 / 720 / 600.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Components / files | `PascalCase.tsx` | `TopBar.tsx`, `UploadScreen.tsx` |
| Hooks | `useCamelCase.ts` | `useTerrainGeometry` |
| Store / utils | `camelCase.ts` | `appStore.ts` |
| Types / interfaces | `PascalCase` | `ModelData`, `ViewMode` |
| CSS variables (tokens) | `--kebab-case` | `--accent`, `--panel-2` |

## File header (components)

```tsx
import { useAppStore } from '@/store/appStore'

// One-line note only when the "why" isn't obvious from the code.
export function Thing() { ... }
```

## Comments

By default, none. Allowed only to explain a non-obvious *why* (a workaround, a
subtle invariant, a reference to a spec section). Names carry the rest.

## Accessibility

- `aria-pressed` on toggles and segmented controls.
- Visible focus states; never remove the outline without a replacement.
- Hit targets ≥44px on mobile.

## Commits

Conventional: `feat:` · `fix:` · `chore:` · `refactor:` · `docs:`.
New feature → new branch → PR → merge. Commits are authored as `JavattJones`.

## Tests / verification

This is a UI project: the primary proof is **visual** (see
`docs/verification.md`), backed by `npm run typecheck` and `npm run build`. Add
unit tests (Vitest) for non-trivial pure logic in `lib/` (metrics, geo math).
