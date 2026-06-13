# FinPlan Pro — Agent Instructions

Offline-first FP&A desktop app. React 19 + TypeScript strict + Vite 8 + Tailwind 4 + Zustand/Immer + AG Grid + Recharts. Optional Tauri shell.

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

| Directory            | What lives here                                                  |
| -------------------- | ---------------------------------------------------------------- |
| `src/store/`         | 28+ Zustand stores, colocated `.test.ts` files                   |
| `src/engines/`       | 180+ pure calculation engines (financial logic, no side effects) |
| `src/pages/`         | Route pages, 30+ domain subdirs, all `React.lazy`                |
| `src/components/ui/` | 240+ atomic UI primitives, barrel-exported via `index.ts`        |
| `src/components/`    | Domain components (budget/, reports/, analytics/)                |
| `src/hooks/`         | 40+ custom hooks (`use` prefix)                                  |
| `src/workers/`       | Web Workers (Monte Carlo, consolidation, formulas)               |
| `src/services/`      | API layer, WebSocket, collaboration                              |
| `src/plugins/`       | Plugin system (registry, sandbox, marketplace)                   |
| `src/utils/`         | Formatters, calculations, storage, encryption                    |
| `src/config/`        | Design tokens, keyboard shortcuts, sector configs                |
| `src/types/`         | Shared TS types                                                  |
| `src/templates/`     | Report/budget templates                                          |
| `src/test/`          | Test setup, mocks, utilities                                     |
| `src-tauri/`         | Tauri desktop shell (Rust)                                       |

## Path Alias

`@/` → `src/`. Use for all internal imports:

```typescript
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
```

## Zustand Store Pattern (required middleware order)

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
- **No `any`** — use `unknown` for untrusted input (tsconfig strict + noUncheckedIndexedAccess)

## Testing

- **Unit**: Vitest + @testing-library/react (jsdom, forks pool, 4 max workers)
- **E2E**: Playwright in `tests/` dir, chromium only, 60s timeout, auto-starts dev server
- **Test files**: colocated with source (`Foo.tsx` → `Foo.test.tsx`)
- **Setup**: `src/test/setup.ts` (auto-cleanup via `@testing-library/jest-dom/vitest`)
- **Render helper**: `import { render } from '@/test/testUtils'` — wraps in BrowserRouter + I18nextProvider
- **Store tests**: `import { resetStore } from '@/test/storeTestUtils'` — use `resetStore(store, initialState)` in `beforeEach`
- **Engine tests**: `import { expectCloseTo, expectFinancialEqual } from '@/test/engineTestUtils'`
- **Tauri mock**: `@tauri-apps/plugin-global-shortcut` aliased to `src/test/__mocks__/tauri-shortcut.ts`
- **Global mocks**: lucide-react, sql.js, worker-pool all mocked in setup.ts

## Build & Deploy

- Vite 8 with manual chunks: react-vendor, chart-vendor, grid-vendor, form-vendor, state-vendor, ai-vendor
- Tailwind CSS 4 via `@tailwindcss/vite` plugin (not PostCSS)
- PWA via vite-plugin-pwa (workbox, autoUpdate)
- Tauri desktop: `npm run tauri:dev` / `npm run tauri:build`
- CI: Node 22, `npm ci`
- Bundle limits: main chunk 150KB gzip, total JS 2MB gzip (`scripts/bundle-check.js`)

## App Behavior

- **Tauri-only**: App shows alert and returns null if not running in Tauri desktop shell
- **First run**: Shows onboarding wizard on first launch
- **Mock auth gate**: `main.tsx` throws if `VITE_USE_MOCK_AUTH=true` in production builds

## Pre-push Hooks

Husky pre-push runs 4 gates (each with 240s timeout):

1. `tsc --noEmit`
2. `eslint src --max-warnings 0`
3. Focused vitest subset (plugins, authStore, dataStore, ScenarioLocking, safeJSONStorage, CopilotSidebar)
4. `npm run build`

## Other

- i18next for internationalization (src/i18n/)
- MCP servers configured in `.mcp.json`: github, git, filesystem, excel-analyser, playwright
- Multi-agent task assignments in `agents/` dir (A1–A5 phased roadmap)
- `server/` directory: separate Express backend (own package.json, not bundled with frontend)

## Disciplines

5 cascade-discipline ground rules (formalized 2026-06-13, cycle-9 wave 4 close; Mnemosyne augmentation 2026-06-13 cycle-10 wave 6 added D-011 + D-012):

- **D-002 Three-Witnesses** (rule / evidence / consequence) — applied to every $X claim across all Muse deliverables. Each empirical claim (file:line, count, size, mtime, LOC, $X) must be backed by 3 independent witnesses (typically a Read, a wc -l / stat, and a Grep). Source-of-truth: `docs/STRATEGIC_DECISIONS_LOG.md` §D-002 row (L75).
- **D-007 IDLE patrol + Honest Labeling** — pre-flight self-correction before claiming "X is verified / Glob-checked / Glob-ABSOLUTE-path". Cumulative count: **13 fabrications caught, 0 escaped** (per `docs/drafts/TASKBOARD.md` §PROTOCOL COMPLIANCE L1140, verified 2026-06-13 by Mnemosyne D-002 Glob+Read+Grep triangulation). "Honest Labeling" cohort = 10/11 Muses (91%, cycle 8 final). Mnemosyne 14th Honest Labeling moment in cycle-9 wave 4 (per Leader ACK 2026-06-13).
- **D-009 Triangulation** — file:line citations to real source docs (NOT "all Glob-verified" without count). 8th codification = Glob with ABSOLUTE path parameter. 9th codification = wc -l before/after every file size claim. 10th codification = Glob path+pattern in single call. Source-of-truth: `docs/ONBOARDING.md` §2.4 (L83 11 ADRs + 8 D-009 codifications).
- **D-011 4-ICP Verdict** (added 2026-06-13 cycle-10 wave 6 by Mnemosyne T-MN-015 v2 §9.1, integrated with Strategos T-ST-018 v0.2) — every major decision (ADR acceptance, cascade authorization, P0/P1 fix) must pass a 4-ICP verdict. ICP-1 Carla (cascade discipline), ICP-2 Vera (logic/evidence), ICP-3 Chris (operational), ICP-4 Beth (user/customer). Recorded as `VERDICT: 4/4 ICPs ACCEPT (Carla ✓, Vera ✓, Chris ✓, Beth ✓)`.
- **D-012 Canonical ICP-Numbering** (added 2026-06-13 cycle-10 wave 6 by Mnemosyne T-MN-015 v2 §9.1, integrated with Strategos T-ST-018 v0.2) — the 4 ICPs are numbered ICP-1 Carla, ICP-2 Vera, ICP-3 Chris, ICP-4 Beth. This order is STABLE across all PR reviews, Muse handoffs, and task IDs. DO NOT renumber. If a 5th ICP is added, it is ICP-5.

**Ratification State** (per T-MN-015 v2 §5.2, as of 2026-06-13):

| ADR                      | Carla (ICP-1) | Vera (ICP-2) | Chris (ICP-3) | Beth (ICP-4) | Founder-ping  |
| ------------------------ | ------------- | ------------ | ------------- | ------------ | ------------- |
| ADR-002 Zustand          | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-003 OLAP cube        | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-004 Decimal.js       | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-005 masterStorage    | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-010 Schema migration | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |

⏳ = pending. ✅ = signed. ❌ = rejected. All 5 P0 ADRs are at **0 of 4 ICPs** + **0 of 1 Founder-ping**. TENTATIVE per D-011.
