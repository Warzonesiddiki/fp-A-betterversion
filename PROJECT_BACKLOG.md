# Project Backlog – FinPlan Pro Perfection Sprint

## Tickets

- [ ] **Phase 1 – Foundation & Safety**
  - [ ] Stage all uncommitted files and push to `origin/main` (`A4 Auditor`)
  - [ ] Verify `DependencyGraph.tsx` line 179 fixed (tsc pass) (`A3 Fixer`)
  - [ ] Resolve remaining tsc errors (30) (`A3 Fixer`)
  - [ ] Ensure vite build passes (grid‑vendor & excel‑vendor warnings to be addressed) (`A1 Builder`)
  - [ ] Baseline test run, document fail count (48.7%) (`A4 Auditor`)
  - [ ] Clean up stale feature branches (`A4 Auditor`)

- [ ] **Phase 2 – Test Triage & Fix**
  - [ ] Implement missing functions in `src/utils/security.ts` (`A3 Fixer`)
  - [ ] Fix `LoginPage.test.tsx` failures (`A3 Fixer`)
  - [ ] Fix `DriverPlanningPage.test.tsx` failures (`A3 Fixer`)
  - [ ] Fix `ActivityFeed.test.tsx` – add localStorage mock (`A3 Fixer`)
  - [ ] Fix `Sidebar.test.tsx` failures (`A3 Fixer`)
  - [ ] Fix `BudgetGrid.test.tsx` failures (`A3 Fixer`)
  - [ ] Fix `ScenarioBuilderPage.test.tsx` failures (`A3 Fixer`)
  - [ ] Fix remaining component test failures (Churn, Headcount, Cohort, CompModeling, PayrollForecast, FXExposure, TemplatePreview, etc.) (`A3 Fixer`)
  - [ ] Reduce timeouts in `cubeMigration.test.ts` (`A3 Fixer`)
  - [ ] Fix engine test single failures (BankingEngine, IntercompanyMatchingEngine, …) (`A3 Fixer`)
  - [ ] Fix PluginEngine, CommandPalette, ExportMenu, ESGDashboard, OnboardingWizard, DriverTreeView, UnderwritingDashboard, CashForecastChart, ProductionDashboard, usePresence, useIntersectionObserver, DataTable, masterStorage tests (`A3 Fixer`)

- [ ] **Phase 3 – Engine & Store Hardening**
  - [ ] Validate all 174 engine data structures (`A1 Builder`)
  - [ ] Verify FormulaEngine functions (`A1 Builder`)
  - [ ] Verify ConsolidationEngine calculations (`A1 Builder`)
  - [ ] Verify ThreeStatementEngine balances (`A1 Builder`)
  - [ ] Ensure 32 stores follow canonical Zustand pattern (`A2 Wirer`)
  - [ ] Implement all missing `security.ts` functions (`A3 Fixer`)
  - [ ] Verify NLQEngine integration (`A1 Builder`)
  - [ ] Verify AICopilotEngine (`A1 Builder`)
  - [ ] Verify PluginEngine (`A1 Builder`)
  - [ ] Verify BatchOperationEngine (`A1 Builder`)
  - [ ] Verify MonteCarloEngine workers (`A1 Builder`)

- [ ] **Phase 4 – UI Engine & Layout**
  - [ ] Scan all 186 pages for stubs, placeholders, @ts‑nocheck (`A3 Fixer`)
  - [ ] Wire DashboardPage to live stores (`A2 Wirer`)
  - [ ] Implement full CRUD for Budget pages (`A2 Wirer`)
  - [ ] Implement Forecast pages (`A2 Wirer`)
  - [ ] Implement Scenario pages (`A2 Wirer`)
  - [ ] Implement financial statement pages (P&L, Balance Sheet, Cash Flow) (`A2 Wirer`)
  - [ ] Implement BudgetVsActual variance analysis (`A2 Wirer`)
  - [ ] Implement BoardPack export (`A2 Wirer`)
  - [ ] Implement all sector dashboards (`A2 Wirer`)
  - [ ] Implement consolidation, FX, audit, settings pages (`A2 Wirer`)

- [ ] **Phase 5 – Visual Style & Polish**
  - [ ] Add dark‑mode classes to remaining components (`A5 Documenter`)
  - [ ] Refine Framer Motion page transitions (`A5 Documenter`)
  - [ ] Apply brand tokens, spacing, typography (`A5 Documenter`)
  - [ ] Run axe‑core audit, fix any violations (`A4 Auditor`)
  - [ ] Keyboard navigation audit, focus management (`A4 Auditor`)

- [ ] **Phase 6 – Performance & Bundle**
  - [ ] Code‑split `grid‑vendor` and `excel‑vendor` into lazy chunks (`A1 Builder`)
  - [ ] Remove `xlsx` package and replace with `exceljs` (`A3 Fixer`)
  - [ ] Verify virtual scrolling for 100K rows (`A1 Builder`)
  - [ ] Confirm lazy loading of all route components (`A1 Builder`)
  - [ ] Memoization audit – add useMemo/useCallback/React.memo (`A5 Documenter`)
  - [ ] Verify Web Workers for heavy engines (`A1 Builder`)
  - [ ] Benchmark import 10K rows < 30 s (`A5 Documenter`)
  - [ ] Benchmark PDF export 500 rows < 3 s (`A5 Documenter`)

- [ ] **Phase 7 – Services & Integration**
  - [ ] Add tests for 21 untested service files (`A5 Documenter`)
  - [ ] Add tests for 7 plugin system files (`A5 Documenter`)
  - [ ] Verify WebSocket collaboration services (`A2 Wirer`)
  - [ ] Verify API connectors (QuickBooks, Xero) (`A2 Wirer`)
  - [ ] Verify full i18n coverage (`A2 Wirer`)

- [ ] **Phase 8 – Security Hardening**
  - [ ] Remove `xlsx` package (already done) and ensure no residual imports (`A3 Fixer`)
  - [ ] Move NVIDIA NIM API calls to backend proxy (`A3 Fixer`)
  - [ ] Harden CSP – remove unsafe‑inline/eval, add nonce (`A4 Auditor`)
  - [ ] Rotate and secure JWT secret (`A3 Fixer`)
  - [ ] Enable strict tsconfig options, fix resulting errors (`A3 Fixer`)
  - [ ] Reduce ESLint errors to 0 (`A4 Auditor`)
  - [ ] Add coverage reporting, achieve 80% statements (`A5 Documenter`)

- [ ] **Phase 9 – Documentation & Help**
  - [ ] Add HelpPanel to every page with F1 shortcut (`A5 Documenter`)
  - [ ] Populate `_docs.ts` with page‑specific help content (`A5 Documenter`)
  - [ ] Create architecture diagrams (Mermaid) (`A5 Documenter`)
  - [ ] Write sector‑specific KPI guides (`A5 Documenter`)
  - [ ] Complete README with setup, architecture, contributing (`A5 Documenter`)

- [ ] **Phase 10 – Tauri Desktop & Release**
  - [ ] Verify Tauri window config, plugins, SQLite (`A2 Wirer`)
  - [ ] Configure NSIS installer (`A2 Wirer`)
  - [ ] Implement auto‑update plugin (`A2 Wirer`)
  - [ ] Add About section in Settings (`A2 Wirer`)
  - [ ] Perform manual E2E walkthrough of install → export workflow (`A4 Auditor`)
  - [ ] Run final performance benchmarks (`A5 Documenter`)
  - [ ] Commit, tag `v1.0.0`, publish GitHub release (`A4 Auditor`)

*All tickets should be claimed by the appropriate specialist agent (Builder, Wirer, Fixer, Auditor, Documenter). Statuses will be updated as work progresses.*
