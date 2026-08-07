# FinPlan Pro — Project Knowledge

Enterprise FP&A platform. Offline-first desktop + web app that replaces spreadsheets with real-time multi-entity consolidation, scenario analysis, and 70+ industry dashboards.

## Tech Stack

- **UI**: React 19.2 + TypeScript 5.9 (strict mode)
- **Build**: Vite 8 (dev server :5173, strictPort)
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin (not PostCSS)
- **State**: Zustand 5 + Immer (subscribeWithSelector → persist → immer middleware order)
- **Data grid / Charts**: AG Grid 35, Recharts 3, D3 7
- **Routing**: react-router-dom 7
- **Forms / Validation**: react-hook-form, Zod 4
- **i18n**: i18next + react-i18next
- **Persistence**: IndexedDB via `@/utils/masterStorage`, sql.js
- **Desktop**: Tauri 2 (Rust shell in `src-tauri/`)
- **Testing**: Vitest 4 + @testing-library/react (jsdom), Playwright (E2E), jest-axe (a11y)
- **Lint/Format**: ESLint 9 (flat config) + Prettier 3 + typescript-eslint
- **PWA**: vite-plugin-pwa (workbox, autoUpdate)

## Commands

```bash
npm install              # Install deps (Node 22, npm ci in CI)

npm run dev              # Vite dev server :5173
npm run build            # Production build
npm run preview          # Preview production build
npm run tauri:dev        # Tauri desktop dev
npm run tauri:build      # Tauri desktop build (NSIS/DMG/AppImage)

npm run lint             # ESLint --fix on src/
npm run format           # Prettier --write on src/**/*.{ts,tsx,css,md}
npm run test             # Vitest single run (8GB heap: --max-old-space-size=8192)
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright (auto-starts dev server)

npx vitest run src/path/to/file.test.ts   # Single test file
npx tsc --noEmit                          # Type check (CI runs before lint)
```

CI order: `tsc --noEmit → lint → test → build → bundle size check`.

## Architecture

Entry: `src/main.tsx` → `src/App.tsx` (all routes defined here, all lazy-loaded via `React.lazy`).

| Directory            | Purpose                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/store/`         | Zustand stores (`{domain}Store.ts`), colocated `.test.ts`                                                                    |
| `src/engines/`       | Pure calculation engines — financial logic, no side effects (Consolidation, FX, Scenario, Tax, SaaS Metrics, Monte Carlo, …) |
| `src/pages/`         | Route pages, 30+ domain subdirs, all `React.lazy`                                                                            |
| `src/components/ui/` | 80+ atomic UI primitives, barrel-exported via `index.ts`                                                                     |
| `src/components/`    | Domain components (budget/, reports/, analytics/, allocations/, ai/, …)                                                      |
| `src/hooks/`         | 40+ custom hooks (`use` prefix)                                                                                              |
| `src/workers/`       | Web Workers (Monte Carlo, consolidation, formula, batch-calc, storage)                                                       |
| `src/services/`      | API layer, WebSocket, collaboration, mock data                                                                               |
| `src/plugins/`       | Plugin system (registry, sandbox, marketplace)                                                                               |
| `src/utils/`         | Formatters, calculations, `masterStorage`, encryption                                                                        |
| `src/config/`        | Design tokens, keyboard shortcuts, sector configs                                                                            |
| `src/types/`         | Shared TS types                                                                                                              |
| `src/templates/`     | Report/budget templates                                                                                                      |
| `src/i18n/`          | i18next setup + locale resources                                                                                             |
| `src/test/`          | Setup (`setup.ts`), mocks, `testUtils.tsx` (BrowserRouter render helper)                                                     |
| `src-tauri/`         | Tauri desktop shell (Rust)                                                                                                   |
| `tests/`             | Playwright E2E specs                                                                                                         |

**Decoupling rule**: Engines (pure) ← Stores (state) ← Pages/Components (presentation). No fetch in components — use services/ or store actions.

## Path Alias

`@/` → `src/`. Always use it for internal imports:

```typescript
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
import { masterStorage } from '@/utils/masterStorage';
```

## Zustand Store Pattern

Required middleware order:

```typescript
export const useSomeStore = create<State>()(
  subscribeWithSelector(
    // outermost — fine-grained subscriptions
    persist(
      // middle — for auth/settings/UI prefs; skip for transient data
      immer((set, get) => ({
        // innermost — immutable updates via drafts
        // state + actions
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

## Code Conventions

- **Named exports only** — no default exports
- **Component props** — explicit `{Component}Props` interface
- **No inline styles** — Tailwind utilities only
- **No fetch in components** — use services/ or store actions
- **No `any`** — use `unknown` for untrusted input (tsconfig strict + `noUnusedLocals` + `noUnusedParameters`)
- **File size limits**: 300 lines (components), 500 lines (engines/stores)
- **Financial numbers**: raw `number`, formatted only at the display layer
- **Percentages**: stored as decimals (0.15 = 15%)
- **Variance colors**: favorable = green `#16A34A`, unfavorable = red `#DC2626`
- **Test files**: colocated with source (`Foo.tsx` → `Foo.test.tsx`)
- **Lazy-load all pages**: every route in `App.tsx` is `React.lazy`

## Testing

- **Unit**: Vitest + @testing-library/react (jsdom, threads pool, 4 max workers)
- **E2E**: Playwright in `tests/`, chromium only, 60s timeout, auto-starts dev server
- **Setup**: `src/test/setup.ts` — auto-cleanup via `@testing-library/jest-dom/vitest`
- **Render helper**: `import { render } from '@/test/testUtils'` — wraps in `BrowserRouter`
- **Store tests**: reset via `useStore.setState({...})` in `beforeEach`
- **Tauri mock**: `@tauri-apps/plugin-global-shortcut` aliased to `src/test/__mocks__/tauri-shortcut.ts`

## Build & Bundling

- Vite manual chunks: `react-vendor`, `chart-vendor`, `grid-vendor`, `form-vendor`, `state-vendor`, `ai-vendor`, `i18n-vendor`
- **Bundle budgets** (per CLAUDE.md, enforced by `scripts/bundle-check.js`): main chunk ≤ 150KB gzip, total JS ≤ 2MB gzip
- Bundle visualizer: `stats.html` (rollup-plugin-visualizer)

## Gotchas (Windows-specific)

- This repo lives at `C:\Users\Tahir\Desktop\frontend that i want\fp&A` — the `&` and spaces in the parent path break some tools (PowerShell, certain CLIs). Prefer running scripts via `npm run …` over hand-typed PowerShell pipelines.
- ESLint/TSC stdout in PowerShell may include CRLF + ANSI noise; redirect to a file (`> tsc_out.txt`) and read it instead.
- Use `npm run` rather than calling node binaries directly when possible — package.json scripts already use `node node_modules/.../...js` to avoid Windows-shim quirks.
- Vitest hardcodes an 80GB heap (`--max-old-space-size=81920`) in package.json. To run with less memory locally without editing package.json, invoke vitest directly: `node --max-old-space-size=8192 node_modules/vitest/vitest.mjs run`.

## Other

- **MCP servers**: configured in `.mcp.json` (github, git, filesystem, excel-analyser, playwright)
- **Plugin system**: `src/plugins/` (registry, sandbox, marketplace)
- **Multi-agent workflow artifacts**: `.agents/`, `_bmad/`, `.claude-flow/` — these are tooling state, not app source
- **Reports/audits**: `reports/` directory holds generated TS error logs, accessibility audits, completion reports — safe to ignore when reading source

## Documentation Pointers

- `README.md` — public overview
- `CLAUDE.md` / `AGENTS.md` — agent-facing rules (mirror this file)
- `docs/ROADMAP.md`, `PROJECT_BACKLOG.md` — planning
- `docs/ARCHITECTURE.md` — deeper architecture
