<!-- LEGACY: Superseded by FINPLAN_PROJECT_BLUEPRINT.md + MASTER_PLAN_V2.md (2026-05-24) -->
# FinPlan Pro — 50-Phase Master Plan

**Total: 50 phases × 50 subphases = 2,500 actionable items**
**Status: Phase 1 IN PROGRESS**

---

## Phase 1: TypeScript Error Resolution (1,021 errors)

| # | Subphase | Status |
|---|----------|--------|
| 1.1 | Run `tsc --noEmit`, capture full error log | ✅ DONE |
| 1.2 | Analyze error distribution by file (top 30 = 60%) | ✅ DONE |
| 1.3 | Fix CollaborationPage.tsx (20 errors) | ⬜ |
| 1.4 | Fix PluginEngine.test.ts (15 errors) | ⬜ |
| 1.5 | Fix GenerativeDashboard.tsx (13 errors) | ⬜ |
| 1.6 | Fix ExportEngine.ts (11 errors) | ⬜ |
| 1.7 | Fix SectorPage.tsx (10 errors) | ⬜ |
| 1.8 | Fix TemplateEngine.test.ts (9 errors) | ⬜ |
| 1.9 | Fix BudgetVAReport.tsx (9 errors) | ⬜ |
| 1.10 | Fix report-builder-templates.ts (8 errors) | ⬜ |
| 1.11 | Fix RetailDashboard.tsx (8 errors) | ⬜ |
| 1.12 | Fix CellFormatter.tsx (8 errors) | ⬜ |
| 1.13 | Fix ReportGrid.test.tsx (8 errors) | ⬜ |
| 1.14 | Fix FormulaFunctionRegistry.test.ts (8 errors) | ⬜ |
| 1.15 | Fix CapExDashboard.tsx (8 errors) | ⬜ |
| 1.16 | Fix ExcelKeyboardEngine.test.ts (7 errors) | ⬜ |
| 1.17 | Fix UserManagementPage.tsx (7 errors) | ⬜ |
| 1.18 | Fix MultiBookEngine.test.ts (7 errors) | ⬜ |
| 1.19 | Fix GLUploadPage.tsx (7 errors) | ⬜ |
| 1.20 | Fix driverStore.ts (7 errors) | ⬜ |
| 1.21 | Fix PluginMarketplace.ts (7 errors) | ⬜ |
| 1.22 | Fix TaxProvisionPage.tsx (7 errors) | ⬜ |
| 1.23 | Fix useSector.test.ts (7 errors) | ⬜ |
| 1.24 | Fix NIMDashboardPage.tsx (7 errors) | ⬜ |
| 1.25 | Fix DriverPlanningPage.tsx (7 errors) | ⬜ |
| 1.26 | Fix FormulaBar.tsx (6 errors) | ⬜ |
| 1.27 | Fix OnboardingWizard.tsx (6 errors) | ⬜ |
| 1.28 | Fix ICMatchingEngine.ts (6 errors) | ⬜ |
| 1.29 | Fix BatchOperationEngine.test.ts (6 errors) | ⬜ |
| 1.30 | Fix TemplatePreviewPage.tsx (6 errors) | ⬜ |
| 1.31 | Fix DeferredSchedulePage.tsx (6 errors) | ⬜ |
| 1.32 | Fix RevRecDashboard.tsx (6 errors) | ⬜ |
| 1.33 | Fix remaining ~700 errors across ~170 files | ⬜ |
| 1.34 | Run `tsc --noEmit` → 0 errors | ⬜ |
| 1.35-1.50 | (Reserved for follow-up fixes) | ⬜ |

---

## Phase 2: Strict TypeScript Config

| # | Subphase | Status |
|---|----------|--------|
| 2.1 | Enable `noUnusedLocals: true` | ⬜ |
| 2.2 | Enable `noUnusedParameters: true` | ⬜ |
| 2.3 | Fix all resulting errors | ⬜ |
| 2.4 | Enable `strictNullChecks` review | ⬜ |
| 2.5 | Fix null/undefined errors | ⬜ |
| 2.6-2.50 | (Remaining strict config items) | ⬜ |

---

## Phase 3: Type System Improvements

| # | Subphase | Status |
|---|----------|--------|
| 3.1 | Remove all 5 `any` type usages | ⬜ |
| 3.2 | Add explicit return types to engines | ⬜ |
| 3.3 | Add explicit return types to hooks | ⬜ |
| 3.4 | Add explicit return types to stores | ⬜ |
| 3.5 | Create shared financial types | ⬜ |
| 3.6-3.50 | (Remaining type improvements) | ⬜ |

---

## Phase 4: Import Cleanup

| # | Subphase | Status |
|---|----------|--------|
| 4.1 | Audit all imports for unused | ⬜ |
| 4.2 | Fix circular dependencies | ⬜ |
| 4.3 | Consolidate barrel exports | ⬜ |
| 4.4-4.50 | (Remaining import cleanup) | ⬜ |

---

## Phase 5: Build Pipeline Hardening

| # | Subphase | Status |
|---|----------|--------|
| 5.1 | Verify `npm run build` passes | ⬜ |
| 5.2 | Verify bundle size ≤150KB gzip main | ⬜ |
| 5.3 | Verify total JS ≤2MB gzip | ⬜ |
| 5.4 | Add build size check to CI | ⬜ |
| 5.5-5.50 | (Remaining build items) | ⬜ |

---

## Phase 6: Lint & Code Quality

| # | Subphase | Status |
|---|----------|--------|
| 6.1 | Run `npm run lint` | ⬜ |
| 6.2 | Fix all lint errors | ⬜ |
| 6.3 | Fix all lint warnings | ⬜ |
| 6.4-6.50 | (Remaining lint items) | ⬜ |

---

## Phase 7: Dead Code Removal

| # | Subphase | Status |
|---|----------|--------|
| 7.1 | Find unused exports | ⬜ |
| 7.2 | Remove orphan test files (6) | ⬜ |
| 7.3 | Remove unused mock data | ⬜ |
| 7.4-7.50 | (Remaining dead code) | ⬜ |

---

## Phase 8: Dependency Audit

| # | Subphase | Status |
|---|----------|--------|
| 8.1 | Run `npm audit` | ⬜ |
| 8.2 | Fix critical vulnerabilities | ⬜ |
| 8.3 | Update outdated packages | ⬜ |
| 8.4-8.50 | (Remaining dep items) | ⬜ |

---

## Phase 9: Bundle Size Optimization

| # | Subphase | Status |
|---|----------|--------|
| 9.1 | Analyze bundle with `vite-bundle-analyzer` | ⬜ |
| 9.2 | Lazy load heavy components | ⬜ |
| 9.3 | Tree-shake unused exports | ⬜ |
| 9.4-9.50 | (Remaining bundle items) | ⬜ |

---

## Phase 10: Build Performance

| # | Subphase | Status |
|---|----------|--------|
| 10.1 | Measure build time baseline | ⬜ |
| 10.2 | Optimize Vite config | ⬜ |
| 10.3 | Add build caching | ⬜ |
| 10.4-10.50 | (Remaining perf items) | ⬜ |

---

## Phase 11: Page Test Coverage — Core Pages

| # | Subphase | Status |
|---|----------|--------|
| 11.1 | DashboardPage smoke test | ⬜ |
| 11.2 | LoginPage smoke test | ⬜ |
| 11.3 | SettingsPage smoke test | ⬜ |
| 11.4 | ProfilePage smoke test | ⬜ |
| 11.5 | HelpPage smoke test | ⬜ |
| 11.6 | NotFoundPage smoke test | ⬜ |
| 11.7-11.50 | (Remaining core page tests) | ⬜ |

---

## Phase 12: Page Test Coverage — Domain Pages

| # | Subphase | Status |
|---|----------|--------|
| 12.1 | Budget pages (4) smoke tests | ⬜ |
| 12.2 | Report pages (9) smoke tests | ⬜ |
| 12.3 | Data pages (9) smoke tests | ⬜ |
| 12.4 | Analytics pages (3) smoke tests | ⬜ |
| 12.5 | Forecast pages (2) smoke tests | ⬜ |
| 12.6-12.50 | (Remaining domain page tests) | ⬜ |

---

## Phase 13: Page Test Coverage — Feature Pages

| # | Subphase | Status |
|---|----------|--------|
| 13.1 | Auth pages (4) smoke tests | ⬜ |
| 13.2 | Banking pages (3) smoke tests | ⬜ |
| 13.3 | Cash pages (3) smoke tests | ⬜ |
| 13.4 | CapEx pages (2) smoke tests | ⬜ |
| 13.5 | Consolidation pages (3) smoke tests | ⬜ |
| 13.6-13.50 | (Remaining feature page tests) | ⬜ |

---

## Phase 14: UI Component Tests — Primitives

| # | Subphase | Status |
|---|----------|--------|
| 14.1 | Test AccountTree | ⬜ |
| 14.2 | Test AllocationHistory | ⬜ |
| 14.3 | Test AllocationPreview | ⬜ |
| 14.4 | Test AllocationRuleBuilder | ⬜ |
| 14.5 | Test ApprovalDashboard | ⬜ |
| 14.6-14.50 | (Remaining primitive tests) | ⬜ |

---

## Phase 15: UI Component Tests — Composite

| # | Subphase | Status |
|---|----------|--------|
| 15.1 | Test BoxPlotChart | ⬜ |
| 15.2 | Test BulletChart | ⬜ |
| 15.3 | Test FunnelChart | ⬜ |
| 15.4 | Test GanttChart | ⬜ |
| 15.5 | Test WaterfallBridge | ⬜ |
| 15.6-15.50 | (Remaining composite tests) | ⬜ |

---

## Phase 16: Hook Tests

| # | Subphase | Status |
|---|----------|--------|
| 16.1 | Test useConfirmation | ⬜ |
| 16.2 | Test useFocusManagement | ⬜ |
| 16.3 | Test useTour | ⬜ |
| 16.4 | Test useUndoableAction | ⬜ |
| 16.5-16.50 | (Remaining hook tests) | ⬜ |

---

## Phase 17: Engine Tests — Financial

| # | Subphase | Status |
|---|----------|--------|
| 17.1 | Verify FormulaFunctionRegistry tests | ⬜ |
| 17.2 | Verify SafeMathParser tests | ⬜ |
| 17.3 | Verify ThreeStatementEngine tests | ⬜ |
| 17.4 | Verify ConsolidationEngine tests | ⬜ |
| 17.5-17.50 | (Remaining financial engine tests) | ⬜ |

---

## Phase 18: Engine Tests — Domain

| # | Subphase | Status |
|---|----------|--------|
| 18.1 | Verify BankingEngine tests | ⬜ |
| 18.2 | Verify InventoryEngine tests | ⬜ |
| 18.3 | Verify RetailEngine tests | ⬜ |
| 18.4 | Verify HealthcareEngine tests | ⬜ |
| 18.5-18.50 | (Remaining domain engine tests) | ⬜ |

---

## Phase 19: Store Tests

| # | Subphase | Status |
|---|----------|--------|
| 19.1 | Verify all 15 store tests pass | ⬜ |
| 19.2 | Test store persistence | ⬜ |
| 19.3 | Test store undo/redo | ⬜ |
| 19.4-19.50 | (Remaining store tests) | ⬜ |

---

## Phase 20: Integration Tests

| # | Subphase | Status |
|---|----------|--------|
| 20.1 | Test budget → report flow | ⬜ |
| 20.2 | Test data import → GL flow | ⬜ |
| 20.3 | Test forecast → variance flow | ⬜ |
| 20.4-20.50 | (Remaining integration tests) | ⬜ |

---

## Phase 21: ARIA Landmarks

| # | Subphase | Status |
|---|----------|--------|
| 21.1 | Add `<main>` landmark to all pages | ⬜ |
| 21.2 | Add `<nav>` landmark | ⬜ |
| 21.3 | Add `<aside>` landmark | ⬜ |
| 21.4 | Add `<header>` landmark | ⬜ |
| 21.5 | Add `<footer>` landmark | ⬜ |
| 21.6-21.50 | (Remaining ARIA items) | ⬜ |

---

## Phase 22: Form Accessibility

| # | Subphase | Status |
|---|----------|--------|
| 22.1 | Add labels to all inputs | ⬜ |
| 22.2 | Add aria-required to required fields | ⬜ |
| 22.3 | Add aria-invalid for validation | ⬜ |
| 22.4 | Add error announcements | ⬜ |
| 22.5-22.50 | (Remaining form a11y) | ⬜ |

---

## Phase 23: Table Accessibility

| # | Subphase | Status |
|---|----------|--------|
| 23.1 | Add scope to th elements | ⬜ |
| 23.2 | Add caption to tables | ⬜ |
| 23.3 | Add aria-sort to sortable columns | ⬜ |
| 23.4-23.50 | (Remaining table a11y) | ⬜ |

---

## Phase 24: Keyboard Navigation

| # | Subphase | Status |
|---|----------|--------|
| 24.1 | Test Tab order on all pages | ⬜ |
| 24.2 | Add skip-to-content link | ⬜ |
| 24.3 | Test Escape closes modals | ⬜ |
| 24.4 | Test Enter submits forms | ⬜ |
| 24.5-24.50 | (Remaining keyboard items) | ⬜ |

---

## Phase 25: Focus Management

| # | Subphase | Status |
|---|----------|--------|
| 25.1 | Test focus trap in modals | ⬜ |
| 25.2 | Test focus restore on modal close | ⬜ |
| 25.3 | Test focus on route change | ⬜ |
| 25.4-25.50 | (Remaining focus items) | ⬜ |

---

## Phase 26: Screen Reader Support

| # | Subphase | Status |
|---|----------|--------|
| 26.1 | Add aria-live for dynamic content | ⬜ |
| 26.2 | Add aria-label to icon buttons | ⬜ |
| 26.3 | Test with NVDA/VoiceOver | ⬜ |
| 26.4-26.50 | (Remaining screen reader items) | ⬜ |

---

## Phase 27: Color Contrast

| # | Subphase | Status |
|---|----------|--------|
| 27.1 | Audit text contrast ratios | ⬜ |
| 27.2 | Fix variance colors (green/red) | ⬜ |
| 27.3 | Fix chart color contrast | ⬜ |
| 27.4-27.50 | (Remaining contrast items) | ⬜ |

---

## Phase 28: Responsive Design

| # | Subphase | Status |
|---|----------|--------|
| 28.1 | Test 1024px breakpoint | ⬜ |
| 28.2 | Test 768px breakpoint | ⬜ |
| 28.3 | Fix mobile layout issues | ⬜ |
| 28.4-28.50 | (Remaining responsive items) | ⬜ |

---

## Phase 29: Error UX

| # | Subphase | Status |
|---|----------|--------|
| 29.1 | Add error boundary to all routes | ⬜ |
| 29.2 | Add user-friendly error messages | ⬜ |
| 29.3 | Add retry buttons | ⬜ |
| 29.4-29.50 | (Remaining error UX items) | ⬜ |

---

## Phase 30: Loading UX

| # | Subphase | Status |
|---|----------|--------|
| 30.1 | Add skeleton loaders | ⬜ |
| 30.2 | Add progress indicators | ⬜ |
| 30.3 | Add optimistic updates | ⬜ |
| 30.4-30.50 | (Remaining loading UX items) | ⬜ |

---

## Phase 31: Stub Pages — Auth

| # | Subphase | Status |
|---|----------|--------|
| 31.1 | Complete RegisterPage validation | ⬜ |
| 31.2 | Complete OnboardingWizard steps | ⬜ |
| 31.3 | Complete SetupWizardPage | ⬜ |
| 31.4 | Complete NotFoundPage | ⬜ |
| 31.5-31.50 | (Remaining stub auth items) | ⬜ |

---

## Phase 32: Stub Pages — Features

| # | Subphase | Status |
|---|----------|--------|
| 32.1 | Complete null-returning pages (20) | ⬜ |
| 32.2-32.50 | (Remaining stub feature items) | ⬜ |

---

## Phase 33: Multi-Entity Polish

| # | Subphase | Status |
|---|----------|--------|
| 33.1 | Test entity switching | ⬜ |
| 33.2 | Test consolidation views | ⬜ |
| 33.3-33.50 | (Remaining multi-entity items) | ⬜ |

---

## Phase 34: Multi-Currency Polish

| # | Subphase | Status |
|---|----------|--------|
| 34.1 | Test FX rate updates | ⬜ |
| 34.2 | Test translation gains/losses | ⬜ |
| 34.3-34.50 | (Remaining currency items) | ⬜ |

---

## Phase 35: Compliance Polish

| # | Subphase | Status |
|---|----------|--------|
| 35.1 | Test SOX audit trail | ⬜ |
| 35.2 | Test data retention | ⬜ |
| 35.3-35.50 | (Remaining compliance items) | ⬜ |

---

## Phase 36: Budget Workflow

| # | Subphase | Status |
|---|----------|--------|
| 36.1 | Test budget creation flow | ⬜ |
| 36.2 | Test budget approval flow | ⬜ |
| 36.3 | Test budget vs actual | ⬜ |
| 36.4-36.50 | (Remaining budget workflow items) | ⬜ |

---

## Phase 37: Scenario Workflow

| # | Subphase | Status |
|---|----------|--------|
| 37.1 | Test scenario creation | ⬜ |
| 37.2 | Test scenario comparison | ⬜ |
| 37.3 | Test what-if analysis | ⬜ |
| 37.4-37.50 | (Remaining scenario items) | ⬜ |

---

## Phase 38: Dashboard Workflow

| # | Subphase | Status |
|---|----------|--------|
| 38.1 | Test dashboard customization | ⬜ |
| 38.2 | Test widget drag/drop | ⬜ |
| 38.3 | Test dashboard templates | ⬜ |
| 38.4-38.50 | (Remaining dashboard items) | ⬜ |

---

## Phase 39: Import/Export Workflow

| # | Subphase | Status |
|---|----------|--------|
| 39.1 | Test Excel import | ⬜ |
| 39.2 | Test CSV import | ⬜ |
| 39.3 | Test PDF export | ⬜ |
| 39.4 | Test Excel export | ⬜ |
| 39.5-39.50 | (Remaining import/export items) | ⬜ |

---

## Phase 40: Collaboration Workflow

| # | Subphase | Status |
|---|----------|--------|
| 40.1 | Test real-time editing | ⬜ |
| 40.2 | Test comments | ⬜ |
| 40.3 | Test approvals | ⬜ |
| 40.4-40.50 | (Remaining collaboration items) | ⬜ |

---

## Phase 41: File Refactoring — Large Files

| # | Subphase | Status |
|---|----------|--------|
| 41.1 | Split FormulaFunctionRegistry (6,517 lines) | ⬜ |
| 41.2 | Split TemplateLibrary (2,965 lines) | ⬜ |
| 41.3 | Split ReportBuilderEngine (2,535 lines) | ⬜ |
| 41.4 | Split SafeMathParser (2,450 lines) | ⬜ |
| 41.5-41.50 | (Remaining file splits) | ⬜ |

---

## Phase 42: State Management Refactoring

| # | Subphase | Status |
|---|----------|--------|
| 42.1 | Audit store sizes | ⬜ |
| 42.2 | Split large stores | ⬜ |
| 42.3 | Add store selectors | ⬜ |
| 42.4-42.50 | (Remaining state items) | ⬜ |

---

## Phase 43: Error Handling

| # | Subphase | Status |
|---|----------|--------|
| 43.1 | Add try-catch to all async operations | ⬜ |
| 43.2 | Add error logging | ⬜ |
| 43.3 | Add user-facing error messages | ⬜ |
| 43.4-43.50 | (Remaining error handling items) | ⬜ |

---

## Phase 44: API Layer

| # | Subphase | Status |
|---|----------|--------|
| 44.1 | Test api.ts service | ⬜ |
| 44.2 | Add retry logic | ⬜ |
| 44.3 | Add request cancellation | ⬜ |
| 44.4-44.50 | (Remaining API items) | ⬜ |

---

## Phase 45: Tauri Polish

| # | Subphase | Status |
|---|----------|--------|
| 45.1 | Test file system access | ⬜ |
| 45.2 | Test native menus | ⬜ |
| 45.3 | Test auto-update | ⬜ |
| 45.4-45.50 | (Remaining Tauri items) | ⬜ |

---

## Phase 46: Security Hardening

| # | Subphase | Status |
|---|----------|--------|
| 46.1 | Audit CSP headers | ⬜ |
| 46.2 | Audit IPC security | ⬜ |
| 46.3 | Audit data encryption | ⬜ |
| 46.4-46.50 | (Remaining security items) | ⬜ |

---

## Phase 47: Performance Optimization

| # | Subphase | Status |
|---|----------|--------|
| 47.1 | Profile render performance | ⬜ |
| 47.2 | Optimize re-renders | ⬜ |
| 47.3 | Add memoization | ⬜ |
| 47.4-47.50 | (Remaining perf items) | ⬜ |

---

## Phase 48: Documentation

| # | Subphase | Status |
|---|----------|--------|
| 48.1 | Update README | ⬜ |
| 48.2 | Add API docs | ⬜ |
| 48.3 | Add component docs | ⬜ |
| 48.4-48.50 | (Remaining doc items) | ⬜ |

---

## Phase 49: CI/CD Pipeline

| # | Subphase | Status |
|---|----------|--------|
| 49.1 | Verify CI passes | ⬜ |
| 49.2 | Add coverage reporting | ⬜ |
| 49.3 | Add bundle size check | ⬜ |
| 49.4-49.50 | (Remaining CI items) | ⬜ |

---

## Phase 50: Release Preparation

| # | Subphase | Status |
|---|----------|--------|
| 50.1 | Version bump | ⬜ |
| 50.2 | Changelog generation | ⬜ |
| 50.3 | Release notes | ⬜ |
| 50.4-50.50 | (Remaining release items) | ⬜ |

---

**Current Phase: 1 (TypeScript Error Resolution)**
**Current Subphase: 1.3 (Fix CollaborationPage.tsx)**
**Errors Remaining: 1,021**
