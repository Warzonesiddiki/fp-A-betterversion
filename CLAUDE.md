# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server on :5173 (strictPort)
npm run build            # Production build
npm run preview          # Preview production build
npm run tauri:dev        # Tauri dev mode
npm run tauri:build      # Tauri production build
npm run lint             # ESLint with --fix
npm run format           # Prettier --write
npm run test             # Vitest single run (8GB heap — node --max-old-space-size=8192)
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
| `src/store/`         | 20+ Zustand stores, colocated `.test.ts` files                   |
| `src/engines/`       | 150+ pure calculation engines (financial logic, no side effects) |
| `src/pages/`         | Route pages, 30+ domain subdirs, all `React.lazy`                |
| `src/components/ui/` | 80+ atomic UI primitives, barrel-exported via `index.ts`         |
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

## MCP Servers

Configured in `.mcp.json`:

- **github** — GitHub API operations
- **git** — Git repository operations
- **filesystem** — Local filesystem access
- **excel-analyser** — Excel/CSV file analysis
- **playwright** — Browser automation

## Agent Orchestration

Agents in `.claude/agents/`:
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |

**Parallel execution**: Always spawn independent agents in parallel.
**Immediate usage**: No user prompt needed for complex features (planner), code just written (code-reviewer), bug fixes (tdd-guide), architectural decisions (architect).

## Multi-Agent Phased Roadmap

Located in `agents/` dir (A1–A5):

- **A1** (agent1-phases-1-8-15.md): Consolidation specialist — phases 1, 8, 15
- **A2** (agent2-phases-5-6-10-13.md): Reports & UI specialist — phases 5, 6, 10, 13
- **A3** (agent3-phases-2-4-12-16-17.md): Persistence & Tauri specialist — phases 2, 4, 12, 16, 17
- **A4** (agent4-phases-3-9-11-14.md): Onboarding & docs specialist — phases 3, 9, 11, 14
- **A5** (agent5-phases-19-68.md): Content specialist — phases 19-68 (enterprise depth across 10 domains)

## Development Workflow

1. **Research & Reuse** — GitHub code search first, then library docs (Context7), then Exa
2. **Plan First** — Use planner agent, generate PRD/architecture/task_list
3. **TDD** — Use tdd-guide agent, write tests first (RED→GREEN→REFactor)
4. **Code Review** — Use code-reviewer agent immediately after writing code
5. **Commit & Push** — Conventional commits, detailed messages
6. **Pre-Review Checks** — CI passing, merge conflicts resolved, branch up to date

## Key Rules Files

- `.claude/rules/finplan-conventions.md` — TypeScript, component, Zustand patterns
- `.claude/rules/finplan-financial.md` — Currency, variance, rounding, budget workflow
- `.claude/rules/finplan-accessibility.md` — WCAG 2.1 AA, ARIA, focus management
- `.claude/rules/finplan-testing.md` — Coverage requirements, test organization
- `.claude/rules/finplan-security.md` — Auth, RBAC, input validation, data protection
- `.claude/rules/development-workflow.md` — Feature implementation pipeline
- `.claude/rules/git-workflow.md` — Commit format, PR workflow
- `.claude/rules/skill-auto-lint-fix.md` — Self-correction loop for lint/type errors
- `.claude/rules/skill-caveman-mode.md` — Terse communication mode
- `.claude/rules/skill-finplan-scope.md` — Stay in FP&A scope guard
- `.claude/rules/skill-gsd-architect.md` — Architect mode for multi-file features
- `.claude/rules/skill-surgical-diffs.md` — Patch-only edits, no full rewrites
- `.claude/rules/skill-vibe-context-manager.md` — Context bleed prevention
- `.claude/rules/skill-zustand-pattern.md` — Canonical store pattern

## Other

- i18next for internationalization (src/i18n/)
- Obsidian vault in `.obsidian/brain/` for project memory
- Multi-agent task assignments in `agents/` dir (A1–A5 phased roadmap)
