# FinPlan Pro — Agent Instructions

Offline-first FP&A desktop app. React 19 + TypeScript strict + Vite + Tailwind 4 + Zustand/Immer + AG Grid + Recharts. Optional Tauri shell.

## Commands

```bash
npm run dev              # Vite dev server on :5173 (strictPort)
npm run build            # Production build
npm run lint             # ESLint with --fix
npm run format           # Prettier --write
npm run test             # Vitest single run (80GB heap — node --max-old-space-size=81920)
npm run test:watch       # Vitest watch mode (same heap)
npm run test:e2e         # Playwright (tests/ dir, chromium only, auto-starts dev server)
npx vitest run src/path/to/file.test.ts   # Single test file
npx tsc --noEmit         # Type check (CI runs this before lint)
```

CI order: `tsc --noEmit → lint → test → build → bundle size check`. Main chunk must stay under 150KB gzip, total JS under 2MB gzip.

## Architecture

Entry: `src/main.tsx` → `src/App.tsx` (all routes defined here, lazy-loaded).

| Directory | What lives here |
|-----------|----------------|
| `src/store/` | 20+ Zustand stores, colocated `.test.ts` files |
| `src/engines/` | 150+ pure calculation engines (financial logic, no side effects) |
| `src/pages/` | Route pages, 30+ domain subdirs, all `React.lazy` |
| `src/components/ui/` | 80+ atomic UI primitives, barrel-exported via `index.ts` |
| `src/components/` | Domain components (budget/, reports/, analytics/) |
| `src/hooks/` | 40+ custom hooks (`use` prefix) |
| `src/workers/` | Web Workers (Monte Carlo, consolidation, formulas) |
| `src/services/` | API layer, WebSocket, collaboration |
| `src/plugins/` | Plugin system (registry, sandbox, marketplace) |
| `src/utils/` | Formatters, calculations, storage, encryption |
| `src/config/` | Design tokens, keyboard shortcuts, sector configs |
| `src/types/` | Shared TS types |
| `src/templates/` | Report/budget templates |
| `src/test/` | Test setup, mocks, utilities |
| `src-tauri/` | Tauri desktop shell (Rust) |

## Path Alias

`@/` → `src/`. Use for all internal imports:
```typescript
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
```

## Zustand Store Pattern (required middleware order)

```typescript
export const useSomeStore = create<State>()(
  subscribeWithSelector(     // outermost — fine-grained subscriptions
    persist(                 // middle — for auth/settings/UI prefs; skip for transient data
      immer((set, get) => ({ // innermost — immutable updates via drafts
        // state + actions
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

Import `masterStorage` from `@/utils/masterStorage` for persistence. Store naming: `{domain}Store.ts`.

## Code Conventions

- **Named exports only** — no default exports
- **Component props** — explicit `{Component}Props` interface
- **No inline styles** — Tailwind only
- **No fetch in components** — use services/ or store actions
- **File size limits**: 300 lines (components), 500 lines (engines/stores)
- **Financial numbers**: raw `number`, formatted only at display layer
- **Percentages**: stored as decimals (0.15 = 15%)
- **Variance colors**: favorable = green (#16A34A), unfavorable = red (#DC2626)
- **No `any`** — use `unknown` for untrusted input (tsconfig strict + noUnusedLocals/Parameters)

## Testing

- **Unit**: Vitest + @testing-library/react (jsdom, threads pool, 4 max workers)
- **E2E**: Playwright in `tests/` dir, chromium only, 60s timeout, auto-starts dev server
- **Test files**: colocated with source (`Foo.tsx` → `Foo.test.tsx`)
- **Setup**: `src/test/setup.ts` (auto-cleanup via `@testing-library/jest-dom/vitest`)
- **Render helper**: `import { render } from '@/test/testUtils'` — wraps in BrowserRouter
- **Store tests**: reset state in `beforeEach` via `useStore.setState({...})`
- **Tauri mock**: `@tauri-apps/plugin-global-shortcut` aliased to `src/test/__mocks__/tauri-shortcut.ts`

## Build & Deploy

- Vite 7 with manual chunks: react-vendor, chart-vendor, grid-vendor, form-vendor, state-vendor, ai-vendor
- Tailwind CSS 4 via `@tailwindcss/vite` plugin (not PostCSS)
- PWA via vite-plugin-pwa (workbox, autoUpdate)
- Tauri desktop: `npm run tauri:dev` / `npm run tauri:build`
- CI: Node 22, `npm ci`

## Other

- i18next for internationalization (src/i18n/)
- MCP servers configured in `.mcp.json`: github, git, filesystem, excel-analyser, playwright
- Multi-agent task assignments in `agents/` dir (A1–A5 phased roadmap)
- Obsidian vault in `.obsidian/brain/` for project memory
