# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinPlan Pro is an offline-first, enterprise-grade FP&A (Financial Planning & Analysis) desktop application. Budgeting, forecasting, multi-entity consolidation, scenario planning, variance analysis, and financial reporting — all running client-side with optional Tauri desktop shell.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint with --fix
npm run format       # Prettier format
npm run test         # Vitest (single run, 8GB heap)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E tests
npm run tauri:dev    # Tauri desktop dev
npm run tauri:build  # Tauri desktop build
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Architecture

### Tech Stack
React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · Zustand + Immer · AG Grid 35 · Recharts · i18next · PWA (VitePWA) · Tauri (optional desktop)

### Data Flow

```
External Data (Excel/CSV/API)
  → Import Engines (src/engines/ImportEngine.ts, ExcelImportEngine.ts)
    → Zustand Stores (src/store/)
      → Calculation Engines (src/engines/) — pure functions
        → UI Components / Export Engine
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/store/` | 15+ Zustand stores, each with colocated `.test.ts` |
| `src/engines/` | 200+ pure calculation engines (financial logic) |
| `src/pages/` | Route pages, 30+ domain subdirectories, all lazy-loaded |
| `src/components/ui/` | Atomic UI primitives (Button, Card, Input, etc.) |
| `src/components/` | Domain components (budget/, reports/, analytics/, etc.) |
| `src/hooks/` | 40+ custom hooks (`use` prefix) |
| `src/workers/` | Web Workers for heavy computation (Monte Carlo, consolidation, formulas) |
| `src/services/` | API layer, WebSocket, collaboration services |
| `src/plugins/` | Plugin system (registry, sandbox, marketplace) |
| `src/utils/` | Formatters, calculations, storage, encryption |
| `src/config/` | Design tokens, keyboard shortcuts, sector configs |
| `src/i18n/` | Internationalization (i18next) |
| `src/types/` | Shared TypeScript types (cube, sector, plugin) |
| `src/templates/` | Report/budget templates |
| `agents/` | Agent task assignment files for multi-agent workflows |

### Zustand Store Pattern

All stores use this middleware stack (required order):

```typescript
export const useSomeStore = create<State>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // state + actions using immer drafts
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

- `subscribeWithSelector` — outermost (enables fine-grained subscriptions)
- `persist` — middle (for auth, settings, UI prefs; skip for transient data)
- `immer` — innermost (immutable updates via drafts)

Store naming: `{domain}Store.ts` (e.g., `budgetStore.ts`, `glStore.ts`, `scenarioStore.ts`)

### Engine Pattern

Engines are pure functions — same inputs always produce same outputs. No side effects. Highly testable. Heavy computations offloaded to Web Workers in `src/workers/`.

Key engines: `FormulaEngine` (Excel-compatible), `ConsolidationEngine`, `CubeEngine` (OLAP), `ScenarioEngine`, `MonteCarloEngine`, `ExportEngine`.

### Routing

- All pages lazy-loaded via `React.lazy` + `Suspense`
- Routes defined in `src/App.tsx`
- Protected routes check auth store
- Error boundaries wrap route segments

### Path Alias

`@/` maps to `src/` — use for all imports:
```typescript
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
```

## Code Standards

- **TypeScript strict mode** — no `any`, prefer `unknown` for untrusted input
- **Named exports only** — no default exports
- **Component props** — explicit `{Component}Props` interface
- **No inline styles** — Tailwind only
- **No fetch in components** — use services/ or store actions
- **Files under 300 lines** (components), **500 lines** (engines/stores)
- **Financial numbers** — stored as raw `number`, formatted only at display layer
- **Percentages** — stored as decimals (0.15 = 15%)
- **Variance** — favorable = green (#16A34A), unfavorable = red (#DC2626)

## Testing

- **Unit**: Vitest + @testing-library/react
- **E2E**: Playwright (`tests/` directory)
- **Test files**: colocated with source (`Foo.tsx` → `Foo.test.tsx`)
- **Coverage targets**: 90%+ stores, 95%+ utils, 80%+ components
- **Pattern**: AAA (Arrange, Act, Assert), mock external deps

## MCP Servers

Configured in `.mcp.json`: github, git, filesystem, excel-analyser, playwright.

## Agent System

Five specialized agents handle phased development (see `AGENTS.md`):
- **A1**: Strip mock data, multi-entity, polish
- **A2**: Reports, keyboard, sectors, accessibility
- **A3**: Persistence, import, custom fields, Tauri, install
- **A4**: Onboarding, FX, compliance, docs
- **A5**: Enterprise depth (phases 19-68, 10 domains)

Agent files in `agents/` and `.claude/agents/`. Use hierarchical topology for multi-file features.
