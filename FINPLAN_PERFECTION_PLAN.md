# FinPlan Pro — Definitive Perfection Plan

> **Date:** 2026-05-24 | **Status:** ACTIVE
> **Supersedes:** All prior plans (marked LEGACY)
> **Goal:** Production-ready desktop FP&A app — zero stubs, zero errors, 100% test pass rate

---

## Phase 1: Foundation & Safety

> Lock down what exists. Prevent data loss. Establish baseline health.

○ **Commit 1,506 uncommitted files**
  - All Phase 1-4 work sitting uncommitted on disk
  - One disk failure = total loss of 9,577 insertions
  - Stage all tracked + untracked, push to origin/main

○ **Fix DependencyGraph.tsx line 179**
  - Escaped backticks blocking tsc + vite build
  - Already fixed this session — verify clean

○ **Verify tsc passes (0 errors)**
  - Current: 30 errors across 4 files (DependencyGraph fixed, security.ts missing exports, testUtils.ts, UnitNormalizationEngine.ts)
  - Target: 0 errors

○ **Verify vite build passes**
  - Current: PASS (5m 21s, 147 precache entries, main chunk 46KB gzip)
  - Warnings: excel-vendor 268KB gzip, grid-vendor 314KB gzip (over 300KB limit)

○ **Run full test suite — establish baseline**
  - Current: **297 pass / 313 fail (48.7% pass rate)** — 610 tests in 63 completed files
  - Test suite timed out at 10 minutes (cubeMigration alone = 360s)
  - Target: > 95% pass rate

○ **Clean up stale feature branches**
  - 6 local branches: auth-fix, excel-import, formula-engine, skills-acquisition, store-fix, stub-pages
  - Merge or delete

**Quality Gate:** Clean git history, tsc 0 errors, build PASS, test baseline documented

---

## Phase 2: Test Triage & Fix

> Fix all failing tests. The 48.7% pass rate is the #1 blocker.

○ **Fix security.ts missing exports (102 test failures)**
  - `src/utils/security.test.ts` imports 20+ functions not yet implemented
  - escapeHTML, stripScripts, stripEventHandlers, sanitizeURL, generateCSRFToken, getCSRFToken, validateCSRFToken, sanitizeUserInput, SECURITY_CONSTANTS, etc.
  - Agent already implementing these — verify completion

○ **Fix LoginPage.test.tsx (8/8 failures)**
  - All tests fail — likely auth store mock issue
  - Check test setup, mock authStore properly

○ **Fix DriverPlanningPage.test.tsx (17/17 failures)**
  - All tests fail — component render crash
  - Check missing providers (i18n, router, store)

○ **Fix ActivityFeed.test.tsx (18/18 failures)**
  - All tests fail — localStorage unavailable in test env
  - Add localStorage mock to test setup

○ **Fix Sidebar.test.tsx (17/20 failures)**
  - Most tests fail — render/missing provider issue
  - Check router and store mocks

○ **Fix BudgetGrid.test.tsx (14/14 failures)**
  - All tests fail — component render crash
  - Check AG Grid mock setup

○ **Fix ScenarioBuilderPage.test.tsx (5/5 failures)**
  - All tests fail — likely missing store mock

○ **Fix ChurnDashboard.test.tsx (6/6 failures)**
  - All tests fail — SaaS store mock issue

○ **Fix ChurnAnalysisPage.test.tsx (5/5 failures)**

○ **Fix HeadcountPlanPage.test.tsx (6/6 failures)**

○ **Fix CohortAnalysisPage.test.tsx (5/5 failures)**

○ **Fix CompModelingPage.test.tsx (6/6 failures)**

○ **Fix PayrollForecastPage.test.tsx (5/5 failures)**

○ **Fix FXExposurePage.test.tsx (5/5 failures)**

○ **Fix TemplatePreviewPage.test.tsx (5/5 failures)**

○ **Fix cubeMigration.test.ts (12/51 failures)**
  - 12 tests timeout at 30s each = 360s consumed
  - Reduce timeout or mock slow operations
  - 39 tests pass — keep those

○ **Fix remaining engine test failures (1 each)**
  - BankingEngine, IntercompanyMatchingEngine, ManufacturingEngine, EnergyEngine, WorkingCapitalEngine, InsuranceEngine, exportExcel, MultiBookEngine
  - Pattern: 1 failure per file — likely edge case assertions

○ **Fix PluginEngine.test.ts (4/25 failures)**

○ **Fix CommandPalette.test.tsx (4/11 failures)**

○ **Fix ExportMenu.test.tsx (2/9 failures)**

○ **Fix ESGDashboard.test.tsx (2/8 failures)**

○ **Fix OnboardingWizard.test.tsx (2/4 failures)**

○ **Fix DriverTreeView.test.tsx (3/11 failures)**

○ **Fix UnderwritingDashboard.test.tsx (2/6 failures)**

○ **Fix CashForecastChart.test.tsx (6/10 failures)**

○ **Fix ProductionDashboard.test.tsx (2/8 failures)**

○ **Fix usePresence.test.ts (3/12 failures)**

○ **Fix useIntersectionObserver.test.ts (1/6 failures)**

○ **Fix DataTable.test.tsx (1/12 failures)**

○ **Fix masterStorage.bench.test.ts (timeout at 60s)**
  - Move to separate config or mark as test.skip for CI

○ **Fix masterStorage.stress.test.ts (3/3 failures — timeouts at 30s each)**

○ **Fix masterStorage.test.ts (1/6 failures)**

○ **Fix TrafficLightIndicator.test.tsx (1/27 failures)**

○ **Fix VarianceDashboardPage.test.tsx (4/5 failures)**

○ **Fix smoke-all-pages.test.tsx (1/43 failures)**

○ **Fix smoke-reports-retail-saas-1.test.tsx (1/12 failures)**

**Quality Gate:** Test pass rate > 95%. All test files complete within timeout.

---

## Phase 3: Engine & Store Hardening

> Verify every engine is functional. Every store follows canonical pattern.

○ **Validate all 174 engine data structures**
  - Input/output types correct
  - Edge cases: zero, negative, NaN, Infinity, null, undefined
  - Pure functions (no side effects)

○ **Verify FormulaEngine (245+ functions)**
  - Excel-compatible function registry
  - ArrayFormulaEngine integration
  - Test all financial functions: NPV, IRR, XIRR, XNPV, PMT, FV, PV

○ **Verify ConsolidationEngine (ASC 810)**
  - Multi-entity with minority interest
  - IC elimination with 1% tolerance
  - Ownership tree validation (no circular parents, 0-100%)

○ **Verify ThreeStatementEngine (1076 lines)**
  - P&L + BS + CF auto-linking
  - Balance check: Assets = Liabilities + Equity

○ **Verify all 32 stores follow canonical pattern**
  - subscribeWithSelector (outermost)
  - persist (if needed) with masterStorage
  - immer (innermost)
  - No `any` types
  - Test file exists

○ **Implement security.ts missing functions**
  - 20+ functions needed by test file
  - escapeHTML, stripScripts, stripEventHandlers, sanitizeURL, CSRF token management, SECURITY_CONSTANTS
  - Agent already working — verify completion

○ **Verify NLQEngine (540 lines)**
  - First offline NLQ in FP&A
  - Natural language → financial query
  - HuggingFace Transformers.js integration

○ **Verify AICopilotEngine**
  - Local AI inference with WebGPU
  - AutoCommentaryEngine integration
  - AnomalyDetectionEngine + AnomalyExplainer

○ **Verify PluginEngine**
  - PluginRegistry, PluginSandbox, PluginManager
  - Sandboxed execution
  - Plugin marketplace

○ **Verify BatchOperationEngine**
  - Bulk operations on GL entries
  - Worker pool integration

○ **Verify MonteCarloEngine**
  - Monte Carlo simulation via Web Worker
  - Scenario probability weighting

**Quality Gate:** All engines pass type check. All stores follow canonical pattern. security.ts fully implemented.

---

## Phase 4: UI Engine & Layout

> Every page functional. Every component wired to stores. No stubs.

○ **Define UI engine choices**
  - AG Grid for all data tables (35.3.0)
  - Recharts for charts (3.8.1)
  - D3 for advanced viz (heatmaps, treemaps)
  - Framer Motion for animations (12.38.0)
  - Radix UI for primitives (12 packages)

○ **Scan all 186 pages for stubs**
  - `// @ts-nocheck` present → remove and fix types
  - Component returns placeholder text → implement
  - No store imports → wire to store
  - File under 50 lines → likely stub
  - Hardcoded mock data → connect to real store

○ **Wire DashboardPage to live data**
  - Import useGLStore, useBudgetStore, useSettingsStore
  - Compute KPIs: totalRevenue, totalExpenses, netIncome, activeBudgets, grossMargin
  - 12-month trend chart
  - Empty state with quick-start guide

○ **Verify BudgetListPage + BudgetCreatePage + BudgetDetailPage**
  - Full CRUD with approval workflow
  - Budget line items with formula support
  - Department roll-up view

○ **Verify ForecastListPage + ForecastBuilderPage**
  - Driver-based modeling
  - Rolling forecast with auto-fill
  - Seasonality patterns

○ **Verify ScenarioListPage + ScenarioBuilderPage**
  - What-if analysis
  - Tornado charts
  - Probability-weighted scenarios

○ **Verify ProfitLossPage, BalanceSheetPage, CashFlowPage**
  - Real financial statement rendering
  - Drill-down to GL entries
  - Export to PDF/Excel

○ **Verify BudgetVsActualPage**
  - Variance analysis with favorable/unfavorable colors
  - Green (#16A34A) / Red (#DC2626)

○ **Verify BoardPackPage**
  - Board-ready report package
  - Multi-page PDF export

○ **Verify all 16 sector dashboard pages**
  - AgricultureDashboard, BankingDashboard, ConstructionDashboard
  - EducationDashboard, EnergyDashboard, GovernmentDashboard
  - HealthcareDashboard, HospitalityDashboard, InsuranceDashboard
  - LogisticsDashboard, ManufacturingDashboard, RealEstateDashboard
  - RetailDashboard, SaaSDashboard, TechnologyDashboard, TelecomDashboard

○ **Verify ConsolidationDashboard + OwnershipTreePage + ICEliminationPage**
  - Visual ownership tree
  - IC auto-matching
  - Consolidated P&L

○ **Verify FXRatesPage + TranslationResultPage + HedgeManagementPage**
  - ASC 830 translation
  - FX gain/loss calculation

○ **Verify AuditTrailPage + SOXCompliancePage + ApprovalQueuePage**
  - Segregation of duties
  - Data retention policies

○ **Verify SettingsPage (3 tabs: Custom Fields, Templates, Theme)**
  - Custom field management
  - Report templates
  - Theme switching (dark/light)

○ **Review layout strategy**
  - AppLayout with Sidebar + TopNav
  - Responsive: min 1024x600
  - Sidebar: collapsible, sector-aware ordering

**Quality Gate:** All 186 pages functional. Zero stubs. Zero @ts-nocheck. All pages connected to stores.

---

## Phase 5: Visual Style & Polish

> Dark mode, accessibility, animations, brand tokens.

○ **Review visual style guide**
  - Tailwind CSS 4.1.17 via @tailwindcss/vite plugin
  - Design tokens in src/config/designTokens.ts
  - Color palette: primary, secondary, accent, success, warning, error

○ **Add dark mode to all components**
  - Current: 57 files with dark: classes
  - Target: ALL component files
  - No hardcoded bg-white/text-black
  - Use Tailwind dark: prefix throughout

○ **Refine interactive animations**
  - Framer Motion for page transitions
  - Hover states on all interactive elements
  - Loading skeletons for async data
  - Smooth sidebar expand/collapse

○ **Add polish and brand tokens**
  - Consistent spacing (Tailwind scale)
  - Typography: headings, body, mono
  - Shadows: sm, md, lg, xl
  - Border radius: consistent rounding
  - Focus rings: 2px, offset, visible

○ **axe-core accessibility audit**
  - Run on all pages
  - Zero critical violations
  - Zero serious violations
  - All icon buttons have aria-label
  - All data tables have proper th headers with scope

○ **Keyboard navigation audit**
  - All interactive elements keyboard-accessible
  - Tab order follows visual layout
  - Arrow keys for grid/cell navigation
  - Escape key closes modals, dropdowns, popovers
  - Ctrl+K command palette works everywhere

○ **Focus management**
  - Visible focus ring on all interactive elements
  - Skip-to-content link on every page
  - Route changes focus main heading
  - Modal dialogs trap focus and restore on close

○ **Screen reader support**
  - Icons have accessible labels via aria-label or <title>
  - Loading states announced via aria-busy and aria-live="polite"
  - Status messages via role="status"
  - Financial data tables have proper <th> headers with scope

**Quality Gate:** axe-core = 0 critical, 0 serious. Dark mode works on all pages. All keyboard shortcuts functional.

---

## Phase 6: Performance & Bundle

> Sub-second everything. Optimize bundle. Virtual scrolling. Workers.

○ **Bundle size optimization**
  - Main chunk: 46KB gzip (already under 150KB target)
  - grid-vendor: 314KB gzip → code-split into lazy chunk
  - excel-vendor: 268KB gzip → code-split into lazy chunk
  - ai-vendor: 162KB gzip (acceptable, lazy-loaded)
  - Remove xlsx package (429KB + security vulnerability)
  - Target: all chunks under 300KB gzip

○ **Virtual scrolling verification**
  - AG Grid handles 100K+ rows at 30fps
  - TanStack Virtual for large lists
  - Test with 100K mock rows

○ **Lazy loading verification**
  - All route components React.lazy + Suspense
  - Dynamic imports for heavy components
  - Code-split by route

○ **Memoization audit**
  - useMemo for expensive computations (P&L, consolidation, forecasts)
  - useCallback for event handlers passed to children
  - React.memo for pure components

○ **Web Workers verification**
  - MonteCarloEngine → monte-carlo.worker
  - ConsolidationEngine → consolidation.worker
  - FormulaEngine → formulaWorker
  - BatchOperationEngine → batch-calc.worker
  - WorkerPool for task distribution

○ **Import pipeline performance**
  - Import 10K rows < 30 seconds
  - ExcelJS parsing optimization
  - Progress indicator during import

○ **Export performance**
  - PDF export of 500 rows < 3 seconds
  - Excel export with formatting
  - CSV export for large datasets

○ **Debug edge cases & resizing**
  - Window resize: responsive layout
  - Min window: 1024x600
  - Max window: unlimited
  - Sidebar collapse on small screens

**Quality Gate:** Main chunk < 150KB gzip. 100K rows scroll at 30fps. Import 10K rows < 30s. PDF export 500 rows < 3s.

---

## Phase 7: Services & Integration

> Fill test coverage gaps. Wire up services. Plugin system.

○ **Add service layer tests (21 untested files)**
  - BenchmarkService, accounts, activity, analytics, budgets
  - cellAuditEntries, collaboration, data, departments, entities
  - exchangeRates, forecasts, generators, glData
  - notifications, reports, scenarios, settings, users, variances

○ **Add plugin system tests (7 untested files)**
  - PluginAPI, PluginLoader, PluginManager
  - PluginMarketplace, PluginSandbox
  - index, types

○ **Verify WebSocket collaboration**
  - PresenceService — user presence tracking
  - ChangeBroadcaster — change event broadcasting
  - RealtimeCollaborationManager — real-time collaboration

○ **Verify API integration layer**
  - QuickBooks connector
  - Xero connector
  - REST API client (Axios)

○ **Verify i18n integration**
  - i18next with browser language detection
  - All UI strings wrapped in t() function
  - Currency/date formatting per locale

○ **Verify plugin marketplace**
  - Plugin discovery
  - Plugin installation
  - Plugin sandbox execution

**Quality Gate:** Services test coverage > 80%. Plugin system test coverage > 80%.

---

## Phase 8: Security Hardening

> Fix all security vulnerabilities. Harden CSP. Protect data.

○ **Remove xlsx package (CRITICAL)**
  - Prototype pollution + ReDoS vulnerabilities
  - No fix available
  - Rewrite MigrationEngine.ts to use exceljs
  - Remove from package.json

○ **Fix NVIDIA NIM API key exposure**
  - VITE_ prefix bundles keys into client JS
  - Move NIM calls behind backend proxy OR use Tauri-only path
  - Rotate keys after fix

○ **Harden CSP for production**
  - Remove 'unsafe-inline' and 'unsafe-eval' from script-src
  - Use nonce-based CSP for production builds
  - Add integrate.api.nvidia.com to connect-src (or proxy)

○ **Fix weak JWT secret**
  - Change from "finplan-dev-secret-change-in-production"
  - Generate cryptographically random secret
  - Document in .env.example

○ **Enable tsconfig strict settings**
  - noUnusedLocals: true (currently false)
  - noUnusedParameters: true (currently false)
  - Fix all resulting errors

○ **ESLint error reduction**
  - Current: 49 errors, 1,241 warnings
  - Fix react-compiler errors (6): setState in effects
  - Fix no-case-declarations (5): lexical declarations in case blocks
  - Fix no-non-null-asserted-optional-chain (4)
  - Fix conditional hooks (3): useMemo/useVirtualizer/useGLStore/useBudgetStore called conditionally
  - Target: 0 errors

○ **Enable coverage reporting**
  - Install @vitest/coverage-v8
  - Add coverage config to vite.config.ts
  - Target: 80% statement coverage minimum

**Quality Gate:** Zero security vulnerabilities. CSP hardened. tsconfig strict. ESLint 0 errors.

---

## Phase 9: Documentation & Help

> HelpPanel on every page. Architecture docs. Industry guides.

○ **HelpPanel on every page**
  - "?" button → slide-in drawer
  - Page-specific help content
  - Keyboard shortcut: F1

○ **_docs.ts completeness**
  - Help content for all 186 page routes
  - Context-sensitive tips
  - Keyboard shortcut reference

○ **Architecture diagrams (Mermaid)**
  - Data flow: External → Import → Engines → Stores → UI → Export
  - Store relationship map
  - Engine dependency graph
  - Component hierarchy

○ **Industry guides (16 sectors)**
  - Sector-specific KPI explanations
  - Usage examples per sector
  - Template recommendations

○ **README.md**
  - Project overview
  - Setup instructions
  - Architecture summary
  - Contributing guidelines

**Quality Gate:** Every page has "?" button. HelpPanel opens with relevant content. README complete.

---

## Phase 10: Tauri Desktop & Release

> Native desktop build. Installer. Final verification.

○ **Verify Tauri desktop shell**
  - Window: "FinPlan Pro", 1400x900, min 1024x600, centered, resizable
  - Plugins: dialog, fs, shell, sql, global-shortcut, notification
  - SQLite database via @tauri-apps/plugin-sql

○ **Verify NSIS installer config**
  - Bundle: NSIS for Windows 11
  - App icons configured
  - Uninstaller

○ **Verify Tauri updater plugin**
  - Auto-update capability
  - Version check on startup

○ **Add About section to Settings**
  - Current version display
  - Check for updates button
  - License information

○ **Manual E2E walkthrough**
  - Install via NSIS installer
  - Onboarding wizard (sector selection, company setup)
  - Import GL data (Excel)
  - Create budget with line items
  - Generate P&L report
  - Export to PDF
  - Backup data
  - Restore from backup
  - All keyboard shortcuts work

○ **Final UX audit**
  - Every button clickable
  - Every form submittable
  - Every chart renderable
  - Every export downloadable
  - Every error boundary catchable
  - Loading states everywhere
  - Empty states with guidance

○ **Performance benchmarks**
  - 100K rows scroll at 30fps
  - Import 10K rows < 30s
  - PDF export 500 rows < 3s
  - AI inference 1000 items < 2s
  - Master storage 1000 concurrent writes: pass

○ **Commit + tag v1.0.0**
  - FinPlan_Pro_1.0.0_x64-setup.exe
  - Release notes
  - GitHub release

**Quality Gate:** Tauri .exe builds. Full E2E workflow passes. Zero errors. v1.0.0 tagged.

---

## Execution Strategy

### 5-Agent Parallel Pattern
| Slot | Role | Scope |
|------|------|-------|
| 1 | Builder | New feature/engine/component |
| 2 | Wirer | Wire pages to stores |
| 3 | Fixer | Fix stubs, tests, types |
| 4 | Auditor | Verify patterns, lint, build |
| 5 | Documenter | Obsidian brain, graphify |

### Rules
- Each agent: read → build → test → commit
- Main thread: monitor, merge, resolve conflicts
- After each batch: run full test suite
- Incremental commits after each agent batch
- Max 5 agents (memory limit from crash history)

### Memory Config
- NODE_OPTIONS: `--max-old-space-size=81920` (80GB)
- Vitest: threads pool, 4 max workers
- Pagefile: 80GB on D: drive

### File Conflict Matrix
| Directory | Owner | Others |
|-----------|-------|--------|
| src/store/ | A4 only | no touch |
| src/engines/ | A1, A2, A3 | coordinated |
| src/pages/ | A2, A3, A5 | domain-split |
| src/components/ | A1, A2, A3, A5 | domain-split |
| src/hooks/ | A4 only | no touch |
| src-tauri/ | no agent | manual only |

---

## Current Baseline (2026-05-24)

| Metric | Value | Target |
|--------|-------|--------|
| Build | PASS (5m 21s) | PASS |
| tsc errors | 30 | 0 |
| Test pass rate | 48.7% (297/610) | > 95% |
| Test files | 728 | 728 |
| ESLint errors | 49 | 0 |
| ESLint warnings | 1,241 | 0 |
| Bundle main chunk | 46KB gzip | < 150KB gzip |
| Stubs | Unknown | 0 |
| @ts-nocheck | Unknown | 0 |
| axe-core critical | Unknown | 0 |
| Dark mode files | 57 | All |
| Uncommitted files | 1,506 | 0 |
| Services test coverage | 38% | > 80% |
| Plugin test coverage | 13% | > 80% |

---

## Legacy Documents

All prior plans preserved for history but superseded:
ROADMAP.md, MASTER_PLAN.md, PHASE_4_PLAN.md, PHASE_5_PLAN.md, PHASES_16_35_MASTER_PLAN.md, PHASE_16_35_ROADMAP.md, COMPETITIVE_ROADMAP.md, FRONTEND_BLUEPRINT.md, PLAN.md, PROGRESS.md, GEMINI.md, AGENT_SWARM.md

**Active:** This document + FINPLAN_PROJECT_BLUEPRINT.md

---

*"The goal is not to ship. The goal is to ship something perfect."*
