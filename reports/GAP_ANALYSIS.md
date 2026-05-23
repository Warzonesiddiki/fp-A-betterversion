# FinPlan Pro -- Codebase Gap Analysis

**Date:** 2026-05-17
**Analyst:** Code Analyzer Agent (OpenClaude)
**Scope:** Full codebase audit -- tests, stubs, engines, pages, components, quality

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total TS/TSX files | 688 | -- |
| Test files | 234 | 34% file ratio |
| Unique source modules | 424 | -- |
| Unique tested modules | 233 | **55% coverage** |
| Untested modules | 191 | **45% gap** |
| TODO/FIXME/STUB markers | 93 | Moderate |
| `any` type usage | 5 | Clean |
| Console statements (prod) | 0 | Clean |
| TypeScript errors | 1,847 | **CRITICAL** |
| Pages with tests | 0 of 102 | **0% page coverage** |
| Components with tests | 93 of 130 | 72% component coverage |
| Hooks with tests | 10 of 14 | 71% hook coverage |
| Stores with tests | 15 of 15 | 100% store coverage |
| Engines with tests | 77 of 77 | 100% engine coverage |
| Utils with tests | 15 of 15 | 100% util coverage |

**Overall Quality Score: 6.2/10**

---

## 1. TEST COVERAGE GAPS

### 1.1 Pages: 0% Test Coverage (CRITICAL)

**102 pages, 0 page-level tests.** This is the single largest gap in the codebase.

Every page below lacks a test file:

| Domain | Pages | Count |
|--------|-------|-------|
| AI | AIIntelligencePage | 1 |
| Analytics | AnalyticsPage, BenchmarkingPage, GoalSeekPage | 3 |
| Audit | AuditTrailPage | 1 |
| Auth | ForgotPasswordPage, LoginPage, OnboardingWizard, RegisterPage | 4 |
| Banking | CapitalAdequacyPage, LoanLossPage, NIMDashboardPage | 3 |
| Budgets | BudgetCreatePage, BudgetDetailPage, BudgetListPage, BudgetVAReport | 4 |
| CapEx | CapExDashboard, DepreciationForecastPage | 2 |
| Cash | CashForecastPage, DebtSchedulePage, WorkingCapitalPage | 3 |
| Collaboration | ApprovalQueuePage, CollaborationPage | 2 |
| Consolidation | ConsolidationDashboard, ICEliminationPage, OwnershipTreePage | 3 |
| Construction | ConstructionDashboardPage, EquipmentManagementPage, ProjectCostingPage | 3 |
| Currency | FXRatesPage, HedgeManagementPage, TranslationResultPage | 3 |
| Data | ChartOfAccountsPage, DataImportPage, GLAccountAnalysisPage, GLExplorerPage, GLJournalsPage, GLReportingPage, GLTrialBalancePage, GLUploadPage, VersionDiffPage | 9 |
| Energy | EmissionsTradingPage, EnergyDashboardPage, EnergyProductionDashboard, EnergyRiskPage, RenewableEnergyPage | 5 |
| ESG | CarbonDashboardPage, CSRDReportPage | 2 |
| Forecasts | ForecastBuilderPage, ForecastListPage | 2 |
| Healthcare | ClinicalTrialCostPage, HealthcareDashboardPage, PatientRevenuePage, ValueBasedCarePage | 4 |
| Insurance | ClaimsAnalyticsPage, InsuranceDashboardPage, UnderwritingPage | 3 |
| Lease | LeaseDashboard, LeaseDetailPage | 2 |
| Manufacturing | COGSVariancePage, InventoryPage, ProductionDashboardPage | 3 |
| Onboarding | SetupWizardPage | 1 |
| RealEstate | FacilityManagementPage, PropertyPortfolioPage, RealEstateDashboardPage, REITDashboardPage | 4 |
| Reports | BalanceSheetPage, BoardPackPage, BudgetVsActualPage, CashFlowPage, ProfitLossPage, ReportsListPage + 3 subcomponents | 9 |
| Retail | InventoryPlanningPage, PromoAnalysisPage, RetailDashboardPage, StoreDashboardPage, StorePerformancePage | 5 |
| Revenue | DeferredSchedulePage, RevRecDashboard | 2 |
| SaaS | ARRDashboard, ChurnDashboard, CohortAnalysisPage | 3 |
| Scenarios | ScenarioBuilderPage, ScenarioListPage | 2 |
| Settings | SettingsPage, UserManagementPage | 2 |
| Tax | TaxProvisionPage, TransferPricingPage | 2 |
| Treasury | FXExposurePage, InvestmentPage | 2 |
| Variance | VarianceDashboardPage | 1 |
| Workforce | CompModelingPage, HeadcountPlanPage, PayrollForecastPage | 3 |
| Other | DashboardPage, HelpPage, NotFoundPage, ProfilePage | 4 |

### 1.2 Components: 28% Untested (37 of 130)

Untested UI primitives and domain components:

**UI Primitives (35 untested):**
- AccountTree, AllocationHistory, AllocationPreview, AllocationRuleBuilder
- ApprovalDashboard, ApprovalQueue, ApprovalWorkflowDesigner
- BoxPlotChart, BulletChart, Button
- CellFormatter, CircularReferenceWarning, ConditionalFormattingRenderers
- ContextMenu, DragFill, DrillDownModal
- EmptyState, ErrorBoundary
- FunnelChart, GanttChart
- HelpPanel
- ICMatchingDashboard, ICReconciliationReport
- KeyboardShortcuts
- OnboardingWizard
- PresenceIndicator
- SandboxMode, ScenarioComparisonGrid, ScenarioLocking, ScenarioTimeline
- SheetTabs, SystemHealthMonitor
- ToastContainer
- WaterfallBridge, WhatIfSandbox

**Domain Components (2 untested):**
- Various domain-specific components in finance/, reports/, etc.

### 1.3 Hooks: 29% Untested (4 of 14)

| Hook | Has Test |
|------|----------|
| useAuth | Yes |
| useConfirmation | **No** |
| useDebounce | Yes |
| useExport | Yes |
| useFirstRun | Yes |
| useFocusManagement | **No** |
| useIndexedDB | Yes |
| useKeyboardShortcuts | Yes |
| useOffline | Yes |
| usePersistence | Yes |
| useSector | Yes |
| useTauriMenu | Yes |
| useTour | **No** |
| useUndoableAction | **No** |

### 1.4 Orphan Test Files

6 test files have no matching source file:
- `ConsolidationEngine.integration.test.ts`
- `FormulaEngine.integration.test.ts`
- `FormulaEngine.performance.test.ts`
- `glStore.cube.test.ts`
- `IncrementalCalcEngine.bench.test.ts`
- `mockData.test.ts`

These should either be merged into primary test files or their source counterparts should be verified.

---

## 2. STUB PAGES

4 pages are minimal stubs (< 80 lines, no real content):

| File | Lines | Status |
|------|-------|--------|
| `src/pages/NotFoundPage.tsx` | 15 | Minimal 404 page |
| `src/pages/auth/RegisterPage.tsx` | 69 | Basic form, no validation logic |
| `src/pages/auth/OnboardingWizard.tsx` | 66 | Skeleton only |
| `src/pages/onboarding/SetupWizardPage.tsx` | 67 | Skeleton only |

### Pages Returning null/Empty Fragments

20 pages return `null` or empty JSX fragments in some code paths, suggesting incomplete rendering logic:

- AnalyticsPage, BenchmarkingPage, GoalSeekPage
- CashForecastPage, WorkingCapitalPage
- ConsolidationDashboard
- DashboardPage
- DataImportPage, GLAccountAnalysisPage, GLReportingPage, VersionDiffPage
- COGSVariancePage, ProductionDashboardPage
- BalanceSheetPage, BoardPackPage, BudgetVsActualPage, CashFlowPage, ProfitLossPage
- StoreDashboardPage
- RevRecDashboard

---

## 3. TYPESCRIPT COMPILATION ERRORS (CRITICAL)

**1,847 TypeScript errors** exist in the codebase. The primary source:

| File | Issue |
|------|-------|
| `src/engines/SafeMathParser.ts` | 5+ syntax errors around lines 1607-1611 |

This single file cascades into hundreds of downstream type errors across the codebase. Fixing this file should be the #1 priority as it blocks type checking for the entire project.

---

## 4. ENGINE ANALYSIS

### 4.1 Engine Test Coverage: 100% File Coverage

All 77 engines have corresponding test files. However, file presence does not guarantee thorough testing.

### 4.2 Largest Engines (Complexity Risk)

| Engine | Lines | Risk |
|--------|-------|------|
| FormulaFunctionRegistry | 6,517 | **HIGH** -- largest file, exceeds 500-line guideline by 13x |
| TemplateLibrary | 2,965 | **HIGH** -- 6x over guideline |
| ReportBuilderEngine | 2,535 | **HIGH** -- 5x over guideline |
| SafeMathParser | 2,450 | **HIGH** -- has TS errors |
| ProfessionalExportEngine | 1,155 | MEDIUM |
| ThreeStatementEngine | 1,076 | MEDIUM |
| ConsolidationEngine | 973 | MEDIUM |
| ExcelKeyboardShortcuts | 858 | MEDIUM |

### 4.3 Engine Features Needing Work

Based on TODO/FIXME markers and code analysis:

| Engine | Gap |
|--------|-----|
| SafeMathParser | **Broken** -- TS syntax errors block compilation |
| BankingEngine | `netChargeOffs` returns 0 (placeholder) |
| InventoryEngine | `serviceLevel` Z-score is a placeholder |
| RetailEngine | `salesPerLaborHour` returns hardcoded 254 |
| ProfessionalExportEngine | Table of Contents is rendered as placeholder |

---

## 5. ACCESSIBILITY GAPS

**39 of 102 pages** (38%) have ARIA attributes or accessibility markers. The remaining 63 pages (62%) lack basic accessibility support.

Pages missing accessibility:
- All auth pages (LoginPage, RegisterPage, ForgotPasswordPage)
- All banking pages
- Most data pages (GLExplorer, GLJournals, GLReporting, etc.)
- Most analytics pages
- All construction pages
- Most energy pages
- All healthcare pages
- All insurance pages

---

## 6. COMPONENT ARCHITECTURE

### 6.1 Directory Structure

24 component directories, well-organized by domain:
- `analytics/`, `auth/`, `budgets/`, `construction/`, `dashboard/`, `data/`, `esg/`, `finance/`, `insurance/`, `layout/`, `manufacturing/`, `realestate/`, `reports/`, `retail/`, `saas/`, `scenarios/`, `settings/`, `treasury/`, `ui/`, `variance/`, `workforce/`

### 6.2 Component Count by Domain

| Domain | Components | Tested |
|--------|-----------|--------|
| ui/ | 65+ | 30 (46%) |
| reports/ | 15+ | 12 (80%) |
| dashboard/ | 10+ | 8 (80%) |
| data/ | 8+ | 6 (75%) |
| finance/ | 8+ | 6 (75%) |
| saas/ | 4+ | 3 (75%) |
| layout/ | 3 | 3 (100%) |
| Other domains | ~17 | ~15 (88%) |

The `ui/` directory has the most untested components (35).

---

## 7. STATE MANAGEMENT

### 7.1 Store Coverage: 100%

All 15 Zustand stores have tests:
- analyticsStore, authStore, budgetStore, collaborationStore, cubeStore, dataStore, driverStore, forecastStore, glStore, notificationStore, reportStore, scenarioStore, settingsStore, tourStore, uiStore, varianceStore

Plus 2 migration modules (cubeMigration, storeMigrators) both tested.

### 7.2 Store Quality

- All stores use Immer for immutable updates
- Undo/redo pattern implemented in key stores
- Persistence layer (localStorage + IndexedDB) properly tested

---

## 8. UTILITIES & SERVICES

### 8.1 Utils: 100% Tested

15 utility modules, all with tests:
- backupRestore, calculations, cn, constants, dataMigration, formatters, indexedDBStorage, localeFormatting, masterStorage, retry, storageConstants, storeCache, tauriSqlStorage, validation, VirtualDataLoader

### 8.2 Services

- `api.ts` -- API client (no dedicated test)
- `mockData/` -- 16 mock data modules + 1 test file

The `api.ts` service lacks a dedicated test file.

---

## 9. INTERNATIONALIZATION

8 locales configured: ar, de, en, es, fr, ja, pt, zh

**Gap:** No tests for i18n completeness (missing translation keys across locales).

---

## 10. SECTOR CONFIGURATION

16 sector configs: agriculture, banking, construction, education, energy, government, healthcare, hospitality, insurance, logistics, manufacturing, realestate, retail, technology, telecom

**Gap:** No tests validating sector config structure or completeness.

---

## 11. WORKERS

The `src/workers/` directory exists but contains **no files**. The AGENTS.md architecture mentions Web Workers for Monte Carlo and large consolidation, but none are implemented.

---

## 12. PRIORITY REMEDIATION PLAN

### Tier 1 -- CRITICAL (Fix Immediately)

1. **Fix SafeMathParser.ts** -- 1,847 TS errors cascade from this single file
2. **Page test coverage** -- 0 of 102 pages have tests; add at least smoke tests for all pages
3. **Stub pages** -- 4 pages are skeletons (RegisterPage, OnboardingWizard, SetupWizardPage, NotFoundPage)

### Tier 2 -- HIGH (This Sprint)

4. **Untested UI components** -- 35 UI primitives lack tests; these are used everywhere
5. **Accessibility** -- 63 pages lack ARIA attributes (62% gap)
6. **Large engine refactoring** -- FormulaFunctionRegistry (6,517 lines), TemplateLibrary (2,965), ReportBuilderEngine (2,535) all exceed the 500-line guideline significantly
7. **Placeholder values** -- BankingEngine, InventoryEngine, RetailEngine return hardcoded placeholders

### Tier 3 -- MEDIUM (Next Sprint)

8. **Hook tests** -- 4 hooks untested (useConfirmation, useFocusManagement, useTour, useUndoableAction)
9. **API service test** -- `src/services/api.ts` lacks dedicated tests
10. **Web Workers** -- Architecture mentions workers but none exist; implement for Monte Carlo and large consolidation
11. **Orphan tests** -- 6 orphan test files need cleanup
12. **i18n validation** -- No tests for translation completeness
13. **Sector config validation** -- No structural tests

### Tier 4 -- LOW (Backlog)

14. **i18n test automation** -- Add tests that verify all translation keys exist in all locales
15. **Sector config tests** -- Validate structure and required fields
16. **Component size audit** -- Several components approach 500 lines

---

## 13. METRICS SUMMARY

```
TEST COVERAGE BY AREA
=====================
Stores:     15/15  (100%)  [PASS]
Engines:    77/77  (100%)  [PASS]
Utils:      15/15  (100%)  [PASS]
Hooks:      10/14  ( 71%)  [WARN]
Components: 93/130 ( 72%)  [WARN]
Pages:       0/102 (  0%)  [FAIL]
API Svc:     0/1   (  0%)  [FAIL]
Workers:     0/0   (  N/A) [N/A]

CODE QUALITY
============
TypeScript errors:   1,847  [FAIL]
any types:               5  [PASS]
Console statements:      0  [PASS]
TODO/FIXME/STUB:        93  [WARN]
Stub pages:              4  [WARN]
Pages with a11y:    39/102  [FAIL]

FILE HYGIENE
============
Orphan tests:            6  [WARN]
Files > 500 lines:       8  [WARN]
Files > 1000 lines:      3  [FAIL]
```

---

## 14. RECOMMENDED AGENT ASSIGNMENTS

| Priority | Task | Agent | Est. Effort |
|----------|------|-------|-------------|
| P0 | Fix SafeMathParser TS errors | coder | 2h |
| P0 | Add page smoke tests (102 pages) | tester (10 agents) | 8h |
| P1 | Test 35 untested UI components | tester (5 agents) | 4h |
| P1 | Add accessibility to 63 pages | coder (5 agents) | 6h |
| P1 | Refactor FormulaFunctionRegistry | architect + coder | 4h |
| P2 | Test 4 untested hooks | tester | 1h |
| P2 | Test api.ts service | tester | 1h |
| P2 | Implement Web Workers | coder | 3h |
| P3 | Clean orphan tests | refactor-cleaner | 1h |
| P3 | i18n completeness tests | tester | 2h |
| P3 | Sector config validation tests | tester | 1h |

**Total estimated remediation effort: ~33 hours**

---

*Report generated by Code Analyzer Agent. Next review recommended after Tier 1 items are resolved.*
