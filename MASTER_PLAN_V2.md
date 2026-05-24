# FinPlan Pro — Master Plan V2 (Fresh)

> **Created:** 2026-05-24 | **Supersedes:** All prior plans (marked LEGACY)
> **Companion:** `FINPLAN_PROJECT_BLUEPRINT.md` — single source of truth for project state
> **Goal:** Ship production-ready FinPlan Pro desktop app

---

## Current State Summary

| Metric | Value | Target |
|--------|-------|--------|
| TS Errors | 30 (12 files) | 0 |
| ESLint Errors | 49 | 0 |
| ESLint Warnings | 1,241 | < 100 |
| Test Pass Rate | ~99.88% (last known) | 100% |
| Build | PASS | PASS |
| Uncommitted Files | 1,506 | 0 |
| xlsx Vulnerability | HIGH | Removed |
| Security (NIM keys) | CRITICAL | Fixed |
| Documentation | Stale | Current |

---

## Phase 0: Git Hygiene (30 min)
**Priority: CRITICAL — all work at risk**

- [ ] Commit all 1,506 uncommitted files with descriptive message
- [ ] Delete stale local branches: `feature/auth-fix`, `feature/excel-import`, `feature/formula-engine`, `feature/skills-acquisition`, `feature/store-fix`, `feature/stub-pages`
- [ ] Push to remote

---

## Phase 1: Fix TypeScript Errors (1-2 hr)
**30 errors across 12 files:**

| File | Errors | Likely Cause |
|------|--------|-------------|
| `src/utils/chunkedStorage.ts` | 5 | Missing types/exports |
| `src/hooks/useTauriGlobalShortcuts.ts` | 5 | Tauri API changes |
| `src/pages/budgets/BudgetVAReport.tsx` | 4 | Type mismatches |
| `src/utils/masterStorage.stress.test.ts` | 3 | Missing exports |
| `src/pages/admin/BenchmarksPage.tsx` | 3 | Missing types |
| `src/pages/DashboardPage.tsx` | 2 | Type issues |
| `src/engines/ExcelImportEngine.ts` | 2 | API mismatch |
| `src/components/admin/DependencyGraph.tsx` | 2 | Resolved (backtick fix) |
| `src/utils/masterStorage.ts` | 1 | Missing export |
| `src/utils/masterStorage.bench.test.ts` | 1 | Missing export |
| `src/pages/data/GLUploadPage.tsx` | 1 | Type issue |
| `src/hooks/usePresence.ts` | 1 | Type issue |

**Quality Gate:** `tsc --noEmit` returns 0 errors

---

## Phase 2: Security Fixes (1-2 hr)

### Critical
- [ ] Remove `xlsx` package — rewrite `MigrationEngine.ts` to use `exceljs`
- [ ] Remove `VITE_NIM_API_KEY_*` from `.env` — move NIM calls to Tauri-only path or backend proxy
- [ ] Rotate NVIDIA NIM API keys
- [ ] Generate proper JWT secret

### High
- [ ] Enable `noUnusedLocals` and `noUnusedParameters` in tsconfig.json
- [ ] Move `prettier-plugin-packagejson` from dependencies to devDependencies
- [ ] Investigate `@a5c-ai/babysitter-sdk` provenance (version anomaly)
- [ ] Move `@types/d3` to devDependencies

### Medium
- [ ] Harden production CSP (remove 'unsafe-inline' 'unsafe-eval' for prod builds)
- [ ] Add `integrate.api.nvidia.com` to CSP connect-src or proxy

**Quality Gate:** `npm audit` returns 0 high/critical vulnerabilities

---

## Phase 3: ESLint Cleanup (2-3 hr)
**49 errors, 1,241 warnings**

### Errors (fix all)
- 6 react-compiler (setState in effect)
- 5 no-case-declarations
- 4 no-non-null-asserted-optional-chain
- 3 conditional hooks (useMemo, useVirtualizer, useGLStore, useBudgetStore)
- 3+ no-useless-escape
- 2 react-compiler (reassign after render)
- 2 control characters in regex
- 1 jsx-a11y/interactive-supports-focus
- 1 react/jsx-no-undef (LayoutDashboard)
- 1 prefer-const
- 1 no-empty
- 1 prefer-spread
- 1 no-constant-binary-expression

### Warnings (reduce to < 100)
- ~595 no-unused-vars — remove dead imports
- ~500 no-explicit-any — replace with proper types
- ~146 label-has-associated-control — add aria-label or htmlFor

**Quality Gate:** `npm run lint` returns 0 errors, < 100 warnings

---

## Phase 4: Test Verification (1-2 hr)

- [ ] Run full test suite: `npm run test`
- [ ] Fix any regressions
- [ ] Verify test count matches expected (~6,256)
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Verify build: `npm run build`

**Quality Gate:** All tests pass, build succeeds, bundle within limits

---

## Phase 5: Dependency Updates (1-2 hr)

### Patch Updates (safe)
- [ ] `@types/react` 19.2.7 → 19.2.15
- [ ] `react-hook-form` 7.76.0 → 7.76.1
- [ ] `@tanstack/react-query` 5.100.11 → 5.100.14
- [ ] `date-fns` 4.2.1 → 4.3.0
- [ ] `tailwind-merge` 3.4.0 → 3.6.0
- [ ] `tailwindcss` 4.1.17 → 4.3.0
- [ ] `@tailwindcss/vite` 4.1.17 → 4.3.0

### Major Updates (careful)
- [ ] `exceljs` 3.x → 4.x (breaking changes)
- [ ] Plan coordinated upgrade: `vite` 7→8, `typescript` 5→6, `eslint` 9→10, `@vitejs/plugin-react` 5→6

**Quality Gate:** All tests pass after each update batch

---

## Phase 6: Phase 4 A5 — Documentation Refresh (2 hr)

- [ ] Architecture diagrams (component hierarchy, data flow, store relationships)
- [ ] Industry guides (16 sectors)
- [ ] Update EXECUTION_LOG.md
- [ ] Verify CLAUDE.md accuracy

**Quality Gate:** Documentation reflects current state

---

## Phase 7: Enterprise Features — Phase 5 Plan (8-12 hr)

From PHASE_5_PLAN.md (drafted by Gemini, ready for execution):

### A1: Multi-Entity Consolidation Depth (3 hr)
- A1.1: Multi-tier hierarchy (recursive ownership trees)
- A1.2: Equity & cost method implementation
- A1.3: Real-time IC matching UI
- A1.4: Consolidation worksheet generator
- A1.5: Minority interest (NCI) depth

### A2: Cross-Tenant Security (2 hr)
- A2.1: Tenant ID injection
- A2.2: Row-level security
- A2.3: Data isolation verification
- A2.4: Access control matrix
- A2.5: Audit trail per tenant

### A3: Audit Trail Expansion (2 hr)
- A3.1: Cell-level change tracking
- A3.2: Approval workflow audit
- A3.3: Compliance report generation
- A3.4: Data retention automation
- A3.5: Regulatory export formats

### A4: Large-Scale Data (3 hr)
- A4.1: Data partitioning strategy
- A4.2: Virtual scrolling for 1M+ rows
- A4.3: Indexed query optimization
- A4.4: Background data processing
- A4.5: Memory-efficient aggregation

---

## Phase 8: ROADMAP Completion (Phases 19-68)

### Domain 1: Data Layer (Phases 19-23)
- Phase 19: GL Upload — Full Chart of Accounts
- Phase 20: GL Upload — Entry Import
- Phase 21: Account Reconciliation
- Phase 22: Data Summary + Drill-Down
- Phase 23: Data Export — All Formats

### Domain 2: Dashboard & KPIs (Phases 24-28)
- Phase 24: Executive Dashboard — Live Data
- Phase 25: KPI Card + Activity Feed + Chart Components
- Phase 26: Revenue vs Expenses Trend Chart
- Phase 27: Budget Compliance Gauge + Financial Health
- Phase 28: Sector-Specific KPIs on Dashboard

### Domain 3: Budget Engine (Phases 29-33)
- Phase 29: Budget List — Full CRUD with Status Workflow
- Phase 30: Budget Create — 4-Step Wizard
- Phase 31: Budget Detail — Excel-Like Grid Editor
- Phase 32: Budget Locking, Versions, Approval Comments
- Phase 33: Multi-Department Roll-Up

### Domain 4: Forecast & Scenario (Phases 34-38)
- Phase 34: Forecast List — CRUD
- Phase 35: Forecast Builder — Driver-Based Modeling
- Phase 36: Rolling Forecast + Auto-Fill + Seasonality
- Phase 37: Scenario List + Builder
- Phase 38: Scenario Comparison — Side-by-Side + Weighted

### Domain 5: Financial Reporting (Phases 39-43)
- Phase 39: Profit & Loss — Real P&L
- Phase 40: Balance Sheet
- Phase 41: Cash Flow Statement
- Phase 42: 3-Statement Integrated Dashboard
- Phase 43: Board Pack Export

### Domain 6: Advanced Features (Phases 44-50)
- Phase 44: Variance Analysis — Deep
- Phase 45: What-If Scenario Sandbox
- Phase 46: Rolling Forecast Engine
- Phase 47: Driver-Based Planning
- Phase 48: Multi-Currency (ASC 830)
- Phase 49: Compliance (SOX, SOD)
- Phase 50: Plugin Marketplace

---

## Phase 9: Performance & Polish (2-3 hr)

- [ ] Verify 100K rows scroll at >30fps
- [ ] Verify import 10K rows < 30 seconds
- [ ] Verify PDF export 500 rows < 3 seconds
- [ ] Lazy-load all route components
- [ ] Memoize expensive computations
- [ ] Verify PWA works offline
- [ ] Verify Tauri native window loads

---

## Phase 10: Final Ship (1-2 hr)

- [ ] Full regression test
- [ ] Security audit final pass
- [ ] Bundle size check (main < 150KB gzip, total < 2MB gzip)
- [ ] Create release commit
- [ ] Tag release
- [ ] Build Tauri installer (NSIS)

---

## Execution Order

```
Phase 0 (Git) → Phase 1 (TS) → Phase 2 (Security) → Phase 3 (Lint)
  → Phase 4 (Tests) → Phase 5 (Deps) → Phase 6 (Docs)
    → Phase 7 (Enterprise) → Phase 8 (ROADMAP) → Phase 9 (Perf) → Phase 10 (Ship)
```

Phases 0-6 are **prerequisites** — must be green before enterprise features.

---

## 5-Agent Allocation (per OpenCode pattern)

| Slot | Role | Current Focus |
|------|------|---------------|
| 1 | Builder | Fix TS errors (Phase 1) |
| 2 | Security | Remove xlsx, fix keys (Phase 2) |
| 3 | Linter | ESLint cleanup (Phase 3) |
| 4 | Auditor | Test verification (Phase 4) |
| 5 | Documenter | Blueprint + docs (Phase 6) |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| 1,506 uncommitted files | CRITICAL — disk failure = total loss | Phase 0: commit immediately |
| xlsx vulnerability | HIGH — prototype pollution | Phase 2: remove package |
| NIM keys in client bundle | CRITICAL — API key exposure | Phase 2: proxy or remove |
| 30 TS errors | MEDIUM — CI blocked | Phase 1: fix all |
| 49 ESLint errors | MEDIUM — code quality | Phase 3: fix all |
| Stale feature branches | LOW — confusion | Phase 0: delete |
| Node 26.2.0 compatibility | LOW — very new version | Monitor for issues |

---

*This plan supersedes all prior plans. Refer to `FINPLAN_PROJECT_BLUEPRINT.md` for detailed project state.*
