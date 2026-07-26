<!-- LEGACY: Superseded by FINPLAN_PROJECT_BLUEPRINT.md + MASTER_PLAN_V2.md (2026-05-24) -->
﻿# FinPlan Pro — 18 Phase Product Roadmap

> **Mission:** Replace 1,000+ FP&A analysts with 50 across ALL global sectors
> **Critical Rule:** Mock data REMOVED from production. Every store starts empty. Users guided via onboarding.
> **Priority:** Data layer first → Features → Polish → Desktop shell LAST
> **Rollback Rule:** If any phase fails its quality gate, the agent must fix within 24h or the phase is reassigned.
> **Pre-requisites:** Node.js 18+, npm 9+. For Phase 16+: Rust nightly, Cargo, Windows 11 SDK.

---

## Phase Dependency Map

```
Phase 1 (Strip Mock Data) — NO DEPENDENCIES, 30 min
  ├──► Phase 2 (Persistence) — depends on Phase 1, 1 hr
  │     ├──► Phase 4 (Import Pipeline) — depends on Phase 2, 2 hr
  │     │     ├──► Phase 5 (Reports + Export) — depends on Phase 4, 2 hr
  │     │     │     ├──► Phase 6 (Keyboard) — depends on Phase 5, 1 hr
  │     │     │     └──► Phase 15a (Error Boundaries) — depends on Phase 5, 30 min
  │     │     │     └──► Phase 15b (Dark/Light Audit) — depends on Phase 5, 30 min
  │     │     │     └──► Phase 15c (Performance) — depends on Phase 5, 30 min
  │     │     ├──► Phase 8 (Multi-Entity) — depends on Phase 4, 2 hr
  │     │     │     └──► Phase 9 (Multi-Currency) — depends on Phase 8, 1.5 hr
  │     │     ├──► Phase 10 (Sectors) — depends on Phase 4, 1 hr
  │     │     ├──► Phase 11 (Compliance) — depends on Phase 4, 1.5 hr
  │     │     └──► Phase 12 (Customization) — depends on Phase 4, 1.5 hr
  │     └──► Phase 16 (Tauri Shell) — depends on Phase 2 + ALL, 2 hr
  │           └──► Phase 17 (Installer) — depends on Phase 16, 1 hr
  │
  ├──► Phase 3 (Onboarding) — depends on Phase 1, 1 hr
  │     └──► Phase 14 (Documentation) — depends on Phase 3, 2 hr
  │
  └──► Phase 18 (Final Build) — depends on ALL phases, 30 min
        └──► PHASES 19-68 (AGENT 5: ENTERPRISE DEPTH) — depends on ALL A1-A4 phases
              ├──► Domain 1: Data Foundation (Phases 19-23)
              │     ├──► Phase 19: GL Upload & Explorer
              │     ├──► Phase 20: Chart of Accounts CRUD
              │     ├──► Phase 21: Trial Balance + Journals
              │     ├──► Phase 22: Account Analysis + GL Reports
              │     └──► Phase 23: Data Reconciliation
              ├──► Domain 2: Dashboard & KPIs (Phases 24-28)
              │     ├──► Phase 24: Executive Summary
              │     ├──► Phase 25: Chart Components
              │     ├──► Phase 26: Revenue Trend
              │     ├──► Phase 27: Budget Compliance
              │     └──► Phase 28: Sector KPIs
              ├──► Domain 3: Budget Engine (Phases 29-33)
              │     ├──► Phase 29: Budget List CRUD
              │     ├──► Phase 30: Budget Wizard
              │     ├──► Phase 31: Budget Detail Grid
              │     ├──► Phase 32: Locking + Versions
              │     └──► Phase 33: Multi-Department Roll-Up
              ├──► Domain 4: Forecast & Scenarios (Phases 34-38)
              │     ├──► Phase 34: Forecast List
              │     ├──► Phase 35: Driver-Based Modeling
              │     ├──► Phase 36: Rolling Forecast
              │     ├──► Phase 37: Scenario List & Builder
              │     └──► Phase 38: Scenario Comparison
              ├──► Domain 5: Financial Reporting (Phases 39-43)
              │     ├──► Phase 39: Profit & Loss
              │     ├──► Phase 40: Balance Sheet
              │     ├──► Phase 41: Cash Flow
              │     ├──► Phase 42: Budget vs Actual
              │     └──► Phase 43: Board Pack
              ├──► Domain 6: Multi-Entity Depth (Phases 44-48)
              │     ├──► Phase 44: Consolidation Full CRUD
              │     ├──► Phase 45: Ownership Tree
              │     ├──► Phase 46: IC Elimination
              │     ├──► Phase 47: FX Rates
              │     └──► Phase 48: Translation & Hedging
              ├──► Domain 7: Sector Depth (Phases 49-53)
              │     ├──► Phase 49: Technology/SaaS
              │     ├──► Phase 50: Manufacturing/Inventory
              │     ├──► Phase 51: Banking/Insurance/RE
              │     ├──► Phase 52: Retail/Healthcare/Energy/ESG
              │     └──► Phase 53: Construction/Logistics/Hospitality/Gov/Edu/Telecom
              ├──► Domain 8: Enterprise Controls (Phases 54-58)
              │     ├──► Phase 54: Audit Trail Live Feed
              │     ├──► Phase 55: Approval Workflow
              │     ├──► Phase 56: Collaboration + Tasks
              │     ├──► Phase 57: Settings Full Functionality
              │     └──► Phase 58: Period Close
              ├──► Domain 9: Advanced Analytics (Phases 59-63)
              │     ├──► Phase 59: Analytics Dashboard
              │     ├──► Phase 60: Multi-Dim Variance
              │     ├──► Phase 61: What-If + Monte Carlo
              │     ├──► Phase 62: Benchmarking + Ratios
              │     └──► Phase 63: Custom Dashboards
              └──► Domain 10: Desktop Polish (Phases 64-68)
                    ├──► Phase 64: SQLite Migration
                    ├──► Phase 65: Web Workers
                    ├──► Phase 66: Error Recovery
                    ├──► Phase 67: Automated Smoke Tests
                    └──► Phase 68: Final Build + Clean Win11 QA
```

**Phase 7 (Testing, ~130 files) is distributed across ALL phases.** Each phase includes its OWN test files.
**Phase 13 (Accessibility) runs after Phase 5** (components must exist to audit).

---

## Shared Interface Contracts

Before starting, all agents must agree on these interfaces:

### Data Storage Interface (used by all phases)
```typescript
// Agent 3 builds this in Phase 2
interface PersistStorage<S> {
  getItem: (name: string) => Promise<S | null>;
  setItem: (name: string, value: S) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}
```

### Store Pattern (used by all phases)
```typescript
// Agent 1 establishes this in Phase 1
// Every store: Zustand + Immer
// No mock data — always starts empty
// All actions return void or Promise<void>
```

### Sector Config Pattern (used by Phase 10)
```typescript
// Agent 2 builds these in Phase 10
interface SectorConfig {
  id: string; name: string; description: string;
  defaultKPIs: { id: string; label: string; format: 'currency'|'percent'|'number'; target: number }[];
  enabledModules: string[];
  sidebarOrder: string[];
  defaultCurrency: string;
}
```

---

## Phase Details — With Time Estimates, File Lists, and Numeric Gates

### Phase 1: Strip Mock Data (A1)
**Est. time:** 30 min | **Files:** 10 store files
**Depends on:** Nothing
**Files:** `src/store/authStore.ts`, `budgetStore.ts`, `dataStore.ts`, `forecastStore.ts`, `varianceStore.ts`, `scenarioStore.ts`, `reportStore.ts`, `collaborationStore.ts`, `notificationStore.ts`, `settingsStore.ts`
**Action:** For EACH file: remove mock data import. Change ALL initial values to empty defaults:
- null for objects: `user: null`, `activeBudgetId: null`, `selectedAccountId: null`
- [] for arrays: `budgets: []`, `lineItems: []`, `analyses: []`, `scenarios: []`, `reports: []`, `notifications: []`, `comments: []`
- '' for strings: `activeEntityId: ''`, `accessToken: ''`
- false for booleans: `isAuthenticated: false`, `mfaRequired: false`
**Edge cases:** authStore.login() with null user → "Backend not connected". budgetStore.setActiveBudget('nonexistent') → no-op.
**Quality Gate:** `npm run build` passes. Open app → React DevTools → all stores show empty arrays/null.
**Rollback:** git checkout src/store/

### Phase 2: Persistence Layer (A3)
**Est. time:** 1 hr | **Files:** 4 new files
**Depends on:** Phase 1
**Files:** `src/utils/indexedDBStorage.ts`, `src/utils/backupRestore.ts`, `src/utils/dataMigration.ts`, `src/utils/storageConstants.ts`
**Action:** 
- `indexedDBStorage.ts`: Implement Zustand's `PersistStorage` interface exactly. `getItem(name)` reads from IndexedDB 'stores' object store. `setItem(name, value)` writes. `removeItem(name)` deletes. ALL methods wrapped in try/catch — if IndexedDB fails, return null silently.
- `backupRestore.ts`: `exportBackup()` reads ALL stores → JSON → download. `importBackup(file)` parses → validates → writes to stores. `checkIntegrity()` reads all stores → reports errors.
- `dataMigration.ts`: `CURRENT_VERSION = 1`. `runMigrations()` checks stored version, runs pending migrations.
- `storageConstants.ts`: `DB_NAME = 'finplan-pro'`, `DB_VERSION = 1`, `PERSIST_KEYS` with one key per store.
**Quality Gate:** Close browser → reopen → data persists. Export creates `.json` download. Import restores. Integrity check passes.
**Rollback:** Delete the 4 files.

### Phase 3: Onboarding Wizard (A4)
**Est. time:** 1 hr | **Files:** 4 (3 new, 1 edit)
**Depends on:** Phase 1
**Files:** `src/components/ui/OnboardingWizard.tsx` (new), `src/hooks/useFirstRun.ts` (new), `src/App.tsx` (edit), `src/pages/onboarding/SetupWizardPage.tsx` (new)
**Action:** 
- `useFirstRun()`: Check `glStore.entries.length === 0 && budgetStore.budgets.length === 0 && !localStorage('finplan-setup-complete')`. Returns `{ isFirstRun, completeSetup, skipSetup }`.
- `OnboardingWizard.tsx`: Full-screen 5-step overlay. Step 1: Welcome (plain language). Step 2: Company setup (name, fiscal year, currency, sector). Step 3: Import data (FileDropZone). Step 4: Accounts review. Step 5: Done + "Go to Dashboard".
- `App.tsx`: If `isFirstRun`, render wizard instead of router.
**Edge cases:** Mid-wizard browser close → restart at step 1 (acceptable). Import data then reopen → first-run false.
**Quality Gate:** Clear localStorage → refresh → wizard appears. Complete → dashboard. Refresh again → dashboard (no wizard).
**Rollback:** Delete 3 new files, revert App.tsx.

### Phase 4: Import Pipeline (A3)
**Est. time:** 2 hr | **Files:** 5 (1 edit, 4 enhance)
**Depends on:** Phase 2
**Files:** `src/store/glStore.ts` (enhance), `src/components/ui/FileDropZone.tsx` (enhance), `src/components/data/GLColumnMapper.tsx` (enhance), `src/components/data/GLDataPreview.tsx` (enhance), `src/pages/data/DataImportPage.tsx` (enhance)
**Action:** Add to glStore: `importProgress`, `importStatus`, `importError`, `lastImportResult`, `importHistory[]`, `lastImportEntryIds[]`. Actions: `setImportProgress`, `setImportStatus`, `recordImport`, `undoLastImport`, `checkDuplicates`.
**Edge cases:** Empty file → "File contains no data". 500K rows → chunked, progress bar updates. All rows invalid → "No valid rows". Duplicates → count shown.
**Quality Gate:** Create test.csv (100 rows) → drag → auto-map → preview → confirm → entries in glStore. Undo → entries removed. Time: < 5 seconds for 100 rows.
**Rollback:** Revert glStore.ts and 4 enhanced files.

### Phase 5: Reports + Export (A2)
**Est. time:** 2 hr | **Files:** 6 (1 edit, 5 enhance)
**Depends on:** Phase 4
**Files:** `src/engines/ExportEngine.ts`, `src/pages/reports/ProfitLossPage.tsx`, `BalanceSheetPage.tsx`, `CashFlowPage.tsx`, `BudgetVsActualPage.tsx`, `BoardPackPage.tsx`
**Action:** Enhance `ExportEngine.exportToPDF()`: headers (company + title), footers (Page X of Y), blue header row (#2980B9), alternating row colors, right-aligned currency columns. `exportToExcel()`: frozen header, `=SUM()` formulas, `$#,##0.00` format. BoardPack: 6 pages (cover, exec summary, P&L, BS, CF, variance commentary).
**Quality Gate:** Export P&L → valid PDF (< 3 seconds for 500 rows). Headers visible. Page numbers correct. Export BS → Excel with frozen panes. Board Pack generates all 6 sections.
**Rollback:** Revert ExportEngine.ts and 5 report files.

### Phase 6: Keyboard + Power UX (A2)
**Est. time:** 1 hr | **Files:** 3 (1 edit, 1 enhance, 1 new)
**Depends on:** Phase 5
**Files:** `src/components/ui/DataGrid.tsx` (enhance), `src/pages/HelpPage.tsx` (enhance), global keyboard handler
**Action:** DataGrid onKeyDown: Arrows navigate, Tab/Shift+Tab move focus, Enter confirm+down, F2 edit, Escape cancel. Ctrl+C copies TSV to clipboard. Ctrl+V pastes TSV from clipboard. Ctrl+Z/Y global undo/redo. HelpPage: keyboard shortcuts reference table.
**Edge cases:** Cell A1 + ArrowUp → stay at A1. Ctrl+V with non-TSV → ignore. Ctrl+Z with empty history → no-op.
**Quality Gate:** Enter 5 budget cells using only keyboard. Ctrl+C → paste into Excel → values match. Ctrl+Z undoes last edit.
**Rollback:** Revert DataGrid.tsx and HelpPage.tsx.

### Phase 7: Tests (ALL agents — ~130 files distributed across all phases)
**NOTE:** NOT a separate phase. Tests are written BY EACH AGENT as part of their phase.
- A1 writes engine/store tests during Phase 1 and 8
- A2 writes component tests during Phase 5 and 6
- A3 writes hook/persistence tests during Phase 2 and 4
- A4 writes page tests during Phase 3, 9, 11, 14
**Quality Gate:** At any point, `npm run test` passes with zero failures.
**Rollback:** Individual test files can be deleted and regenerated.

### Phase 8: Multi-Entity (A1)
**Est. time:** 2 hr | **Files:** 4 new page files
**Depends on:** Phase 4
**Files:** `src/pages/consolidation/ConsolidationDashboard.tsx`, `OwnershipTreePage.tsx`, `ICEliminationPage.tsx`, consolidated P&L section
**Action:** Entity CRUD with validation (unique code, 0-100% ownership, no circular parents). Visual ownership tree (parent→child, color by ownership %). IC auto-matching (from=A⇢to=B AND from=B⇢to=A with 1% tolerance). Consolidated P&L via ConsolidationEngine. Expected output format:
```
| Account        | Entity A | Entity B | Eliminations | Consolidated |
|---------------|:--------:|:--------:|:------------:|:-----------:|
| Revenue        |  100,000 |   50,000 |      (5,000) |     145,000 |
| Expenses       |  (60,000) |  (30,000)|       5,000  |    (85,000) |
| Net Income     |   40,000 |   20,000 |           0  |      60,000 |
| Attrib to Parent |        |          |              |      56,000 |
| Attrib to NCI    |        |          |              |       4,000 |
```
**Edge cases:** 0 entities → empty state. 1 entity → "add more". Circular parent → rejected. Ownership >100% → clamped.
**Quality Gate:** 2 entities (80% ownership) → consolidated P&L: parent=100%, sub=80%, minority=20%. IC pair auto-detected → eliminations balance.
**Rollback:** Delete 4 page files.

### Phase 9: Multi-Currency (A4)
**Est. time:** 1.5 hr | **Files:** 4 (3 enhance, 1 modify)
**Depends on:** Phase 8
**Files:** `src/pages/currency/FXRatesPage.tsx`, `TranslationResultPage.tsx`, `HedgeManagementPage.tsx`, all report pages (add currency selector)
**Action:** Rate CRUD with history chart. Default rate source: manual entry only (no API). Supported currencies: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR. No default rates included — user must add all rates. Translation page (avg/closing/historical rates). Hedge dashboard with effectiveness gauge (80-125% green, outside red). Currency selector dropdown on all reports.
**Edge cases:** Rate = 0 → show "Rate not available". Same from/to currency → return amount unchanged.
**Quality Gate:** Add USD→EUR 0.92 → translate €1000 → $920. Rate changes → translation gain/loss appears.
**Rollback:** Revert 4 files.

### Phase 10: Sectors (A2)
**Est. time:** 1 hr | **Files:** 15 config files
**Depends on:** Phase 4
**Files:** `src/config/sectors/{technology,manufacturing,retail,banking,healthcare,energy,realestate,construction,insurance,telecom,logistics,hospitality,government,education,agriculture}.ts`
**Action:** Each file exports SectorConfig with 7 KPIs, 3-5 modules, 12-15 sidebar paths, defaultCurrency.
**Quality Gate:** Switch sector → KPIs change. All 15 pass `validateConfig()`. Time to switch: < 500ms.
**Rollback:** Revert any/all 15 files.

### Phase 11: Compliance (A4)
**Est. time:** 1.5 hr | **Files:** 4 (2 new, 2 enhance)
**Depends on:** Phase 4
**Files:** `src/pages/audit/AuditTrailPage.tsx` (new), `src/pages/collaboration/ApprovalQueuePage.tsx` (enhance), RBAC guards on existing pages
**Action:** Audit trail viewer with filters (date range, user, account, action). Approval workflow (Approve/Reject with comment dialog). RBAC: viewers can't edit, only admins manage users.
**Quality Gate:** Edit budget cell → audit trail shows before/after/timestamp/user. Viewer can't see delete buttons.
**Rollback:** Revert 4 files.

### Phase 12: Customization (A3)
**Est. time:** 1.5 hr | **Files:** 3 settings tabs
**Depends on:** Phase 4
**Files:** `src/pages/settings/SettingsPage.tsx` (enhance)
**Action:** Add 3 tabs:
1. Custom Fields: Table (name, type, appliesTo, required) + Add form (name, type dropdown, appliesTo checkboxes, required toggle, options text for 'select' type). Validation: no duplicate names.
2. Report Templates: Save current report layout, apply template to report, delete templates.
3. Theme: Accent color picker (blue/green/purple/orange/teal/custom hex), dark/light toggle.
**Quality Gate:** Create "Department" custom field → appears on budget form. Save report template → reopen → apply → layout matches.
**Rollback:** Revert SettingsPage.tsx.

### Phase 13: Accessibility (A2)
**Est. time:** 1 hr | **Files:** 2 (1 edit, 1 report)
**Depends on:** Phase 5
**Files:** `src/index.css` (enhance), `reports/accessibility-audit.md` (new)
**Edge cases:** Page with zero interactive elements → only contrast/heading checks apply. prefers-reduced-motion set → all animations disabled, functionality unchanged. High contrast mode → all borders visible, no color-only indicators.
**Action:** CSS: @media (prefers-contrast: more) with stronger borders. @media (prefers-reduced-motion: reduce) disables ALL animations. aria-label on tables, charts, forms. role="grid" on data tables. Focus ring on all elements. axe-core audit of all pages → document violations.
**Quality Gate:** axe-core = 0 critical violations. Tab reaches all interactive elements. Focus ring visible.
**Rollback:** Revert index.css, delete report.

### Phase 14: Documentation (A4)
**Est. time:** 2 hr | **Files:** 3 new + 74 edits
**Depends on:** Phase 3
**Files:** `src/components/ui/HelpPanel.tsx` (new), `src/pages/_docs.ts` (new), ALL 74 pages (add "?" button + document.title), `src/pages/HelpPage.tsx` (enhance)
**Action:** HelpPanel: slide-in drawer, 380px, 300ms CSS transition, close via X/overlay-click. _docs.ts: help content for EVERY page route (title + 3-5 sections with plain-language explanations). Every page: add "?" button → opens HelpPanel + useEffect document.title. HelpPage: FAQ accordion (10 items), keyboard shortcuts table.
**Quality Gate:** Every page has "?" icon. Click → HelpPanel opens with relevant content. Browser tab = "FinPlan Pro — [Page Name]".
**Rollback:** Revert all 74 files (high impact — only if critical bugs).

### Phase 15a: Error Boundaries (A1)
**Est. time:** 30 min | **Files:** 1 edit
**Depends on:** Phase 5
**Files:** `src/App.tsx` (edit)
**Action:** Wrap EVERY `<Route>` with `<ErrorBoundary>`. Fallback: error icon + "Something went wrong" + "Try Again" button + "Go to Dashboard" link. ErrorBoundary catches render errors, resets state on retry, logs error to console.
**Quality Gate:** Throw error in any page → ErrorBoundary catches → fallback shows → "Try Again" works.
**Rollback:** Revert App.tsx.

### Phase 15b: Dark/Light Mode Audit (A1)
**Est. time:** 30 min | **Files:** All pages (check hardcoded colors)
**Depends on:** Phase 5
**Action:** Open EVERY page in dark mode. Check: no `bg-white` without `dark:` prefix, no `text-black`/`text-slate-900` without `dark:` variant, all CSS variables used (var(--bg-surface), var(--text-primary), var(--border-subtle)). Fix violations.
**Quality Gate:** All pages render correctly in both dark and light modes. No hardcoded colors.
**Rollback:** Revert any changed files.

### Phase 15c: Performance Check (A1)
**Est. time:** 30 min | **Files:** 0 (it's a test)
**Depends on:** Phase 5
**Action:** Test with 100K mock rows in grid. Verify smooth scrolling (>30fps). Verify import of 10K rows completes in <30 seconds. Verify PDF export of 500 rows completes in <3 seconds. Report findings to `reports/performance-audit.md`.
**Quality Gate:** 100K rows scroll without stutter. Import 10K rows <30 sec.
**Rollback:** Delete report file.

### Phase 16: Tauri Desktop Shell (A3)
**Est. time:** 2 hr | **Files:** 6 new
**Depends on:** Phase 2 + ALL previous phases must pass quality gates
**Pre-requisite:** Rust toolchain installed (`rustc`, `cargo`), Windows 11 SDK
**Edge cases:** Rust not installed → build fails with "rustc not found — install Rust toolchain first." Port 5173 in use → Tauri auto-increments. WebView2 missing → Tauri installer provides download. First build takes 5-10 min (compiling Rust dependencies). **Risk:** HIGH — requires Rust native build. If Rust not installed, Phase 16 is blocked.
**Files:** `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
**Action:** Create Tauri v2 project with window (title "FinPlan Pro", 1400x900, min 1024x600, centered, resizable). Plugins: dialog, fs, shell, sql. Bundle: NSIS for Windows 11. Update package.json with @tauri-apps/cli.
**Quality Gate:** `npm run tauri:dev` opens native window with app content. Window title = "FinPlan Pro".
**Rollback:** Delete src-tauri/ directory.

### Phase 17: Installer + Updates (A3)
**Est. time:** 1 hr | **Files:** 2 edits + 1 new
**Depends on:** Phase 16
**Files:** `src-tauri/tauri.conf.json` (edit), `package.json` (edit), Settings page (add About section)
**Edge cases:** Version not set in package.json → build fails with "version is required." Antivirus flags .exe → sign binary or add exclusion. Previous version installed → installer upgrades, %APPDATA% data preserved. Uninstall removes app but leaves %APPDATA% data (user choice).
**Action:** Configure NSIS: installMode=currentUser, desktop shortcut, Start Menu, uninstaller. Add Tauri updater plugin. Add version display in Settings → About. Add "Check for Updates" button.
**Quality Gate:** `npm run tauri:build` → FinPlan_Pro_0.1.0_x64-setup.exe. Installer creates Start Menu entry. Settings shows version.
**Rollback:** Revert tauri.conf.json and package.json.

### Phase 18: Final Build (ALL agents)
**Est. time:** 30 min | **Files:** The entire app
**Depends on:** ALL 17 phases passing
**Action:** `npm run build` (zero errors). `npm run test` (zero failures). `npm run tauri:build` → .exe. Manual full workflow: install .exe → launch → onboarding → import test data → create budget → generate P&L → export PDF → backup → restore.
**Quality Gate:** FinPlan Pro.exe produced. Full workflow passes.
**Rollback:** Fix whichever previous phase caused the failure. Then rebuild.

---

## Phase Details — Agent 5: Enterprise Depth (Phases 19-68)

### Domain 1: Data Foundation (Phases 19-23)

#### Phase 19: GL Upload & Explorer — Real Data Pipeline
**Est. time:** 2 hr | **Files:** 2 (enhance)
**Depends on:** ALL A1-A4 phases
**Files:** `src/pages/data/GLUploadPage.tsx`, `src/pages/data/GLExplorerPage.tsx`
**Action:** 
- **GLUploadPage:** Replace stub with 5-step upload wizard (File selection → Column mapping → Preview → Confirm → Result). Import `useGLStore` for state. Import `FileDropZone`, `GLColumnMapper`, `GLDataPreview` components. Implement CSV/XLSX parsing in-browser (no server). Validate: file type (.csv/.xlsx/.xls), file size (<50MB), required columns present. Auto-detect column mapping (accountCode, postDate, debit, credit, description). Show preview of first 20 rows with validation errors per row. Show duplicate count before import. Record import history. Support undo last import.
- **GLExplorerPage:** Show all imported entries in a filterable, sortable table. Filters: date range, account (multi-select), amount range, text search on description. Columns: Date, Account Code, Account Name, Description, Debit, Credit, Reference. Export filtered results to CSV.
**Edge cases:** File with BOM characters → strip BOM. CSV with commas inside quoted fields → handle quoted parsing. Empty CSV (headers but no rows) → "File contains no data". All rows invalid → show error with row-by-row breakdown. File exceeds 50MB → reject with size message. Duplicates detected → show count + confirm dialog.
**Quality Gate:** Drag 100-row CSV → step 1 shows auto-mapped columns → step 2 shows 20 preview rows → step 3 shows summary → confirm → 100 entries in glStore. Undo removes them. Explorer shows filters working.
**Rollback:** Revert GLUploadPage.tsx, GLExplorerPage.tsx.

#### Phase 20: Chart of Accounts — Full CRUD
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 19
**Files:** `src/pages/data/ChartOfAccountsPage.tsx`
**Action:**
Replace stub with full account CRUD: Add Account modal (code required 3-10 chars unique, name required 2+ chars, type dropdown: Asset/Liability/Equity/Revenue/Expense, category text, normal balance Debit/Credit, parent account tree select, active toggle). Table: Code | Name | Type | Category | Normal Balance | Active | Actions (Edit/Deactivate). Tree view toggle (flat vs indented hierarchy). Import from CSV button (reuse FileDropZone). Export to CSV. Search/filter by code, name, type. Sortable columns.
**Edge cases:** Duplicate code → reject with "Account code X already exists". Deactivate account with GL entries → warn "X entries reference this account — deactivate anyway?" (soft delete). Circular parent reference → detect and reject. Empty name → inline validation.
**Quality Gate:** Add 10 accounts (2 Revenue, 3 OpEx, 2 Asset, 3 Liability) → table shows all. Deactivate one → grayed out with "Inactive" badge. Filter by type → filtered list.
**Rollback:** Revert ChartOfAccountsPage.tsx.

#### Phase 21: Trial Balance + GL Journals
**Est. time:** 1.5 hr | **Files:** 2 (enhance)
**Depends on:** Phase 19
**Files:** `src/pages/data/GLTrialBalancePage.tsx`, `src/pages/data/GLJournalsPage.tsx`
**Action:**
- **GLTrialBalancePage:** Import useGLStore. useEffect auto-generates trial balance when entries change. Table: Account Code | Account Name | Type | Beginning Balance | Debits | Credits | Net Change | Ending Balance. Color: debits in blue, credits in green, zero in gray. Balance check indicator: "✓ Balanced" green or "✗ Off by $X" red. Summary row with totals. Period selector (month/year). Account type filter checkboxes. Export to CSV/PDF buttons.
- **GLJournalsPage:** Date range filter (default: current month). Account multi-select filter. Table: Date | Account Code | Account Name | Description | Debit | Credit | Reference. Summary: Total Debits, Total Credits, Net Change. Row click → expand to show full entry details. Export CSV.
**Edge cases:** No entries → empty state: "Import GL data first". All entries filtered out → "No entries match filters". Trial balance not yet generated → "Generate Trial Balance" button. Negative balances → show in red with parentheses.
**Quality Gate:** Import 50 entries → Trial Balance generates with correct totals (debits = credits). Journal page filter by month. Export CSV downloads valid file.
**Rollback:** Revert 2 files.

#### Phase 22: GL Account Analysis + GL Reporting
**Est. time:** 1.5 hr | **Files:** 2 (enhance)
**Depends on:** Phase 19
**Files:** `src/pages/data/GLAccountAnalysisPage.tsx`, `src/pages/data/GLReportingPage.tsx`
**Action:**
- **GLAccountAnalysisPage:** Account selector (searchable dropdown of all accounts). Monthly trend chart (Recharts BarChart: debits blue, credits green per month). Analysis table: Month | Debits | Credits | Net Change | Running Balance. Key stat cards: Total Debits, Total Credits, Average Balance, Transaction Count. Export chart as PNG.
- **GLReportingPage:** Drag-and-drop report builder. Select date range, accounts (grouped by type with Select All/Deselect All checkboxes), grouping (month/quarter/account type/category). Preview: table + bar chart side by side. Save report config to localStorage (name + config JSON). Export dropdown (PDF/Excel/CSV). Saved reports list with Load/Delete.
**Edge cases:** Account with no activity → chart shows empty with "No activity for this period". 0 transactions → stat shows 0. Monthly totals with no data → show 0 not blank. Report builder with 0 accounts selected → "Select at least one account".
**Quality Gate:** Select account → 12-month bar chart renders. Running balance calculated correctly (cumulative sum). Save report → reload page → Load restores config.
**Rollback:** Revert 2 files.

#### Phase 23: Data Reconciliation
**Est. time:** 1 hr | **Files:** 1 (enhance)
**Depends on:** Phase 19
**Files:** `src/pages/data/DataImportPage.tsx`
**Action:**
Add reconciliation section below existing upload wizard: Two FileDropZones side by side (Source A, Source B). Both accept CSV/XLSX. "Run Reconciliation" button → auto-match by account code (1% tolerance). Results table: Account | Source A | Source B | Difference | Status badge (✓ Matched green, ✗ Different red, ◐ Only in A yellow, ◑ Only in B yellow). Summary bar: "X matched, Y differences, Z unmatched". "Export Differences" → CSV of non-matching rows only. "Export Full Report" → CSV of all results.
**Edge cases:** Same file uploaded to both → all matched. 10 accounts in A, 8 in B → 2 shown as "Only in A". Zero rows in file → "File contains no data". Files with different column headers → column mapping dialog. 1% tolerance for floating point differences.
**Quality Gate:** Upload 2 CSVs (5 match, 2 differ) → 5 green, 2 red. Export Differences → CSV has exactly 2 rows. Summary bar counts correct.
**Rollback:** Revert DataImportPage.tsx.

---

### Domain 2: Dashboard & KPIs (Phases 24-28)

#### Phase 24: Executive Dashboard — Live Data
**Est. time:** 2 hr | **Files:** 1 (replace)
**Depends on:** Phase 19 (needs GL data)
**Files:** `src/pages/DashboardPage.tsx`
**Action:**
Remove `// @ts-nocheck`. Import `useGLStore`, `useBudgetStore`, `useSettingsStore`. Use `useMemo` to compute KPIs: totalRevenue (entries where accountCode starts with '4'), totalExpenses (starts with '5' or '6'), netIncome (revenue - expenses), activeBudgets (budgets with status Approved/InReview), grossMargin (if revenue>0, (revenue-cogs)/revenue*100). Compute monthly trend: group entries by period/month, sum revenue and expenses per month, compute net income, sort chronologically, take last 12. Render 4 KPI cards (Revenue, Expenses, Net Income, Active Budgets) using `KPICard` component. Render Revenue vs Expenses 12-month ComboChart. Render GaugeChart for Gross Margin. Render ActivityFeed. Each KPI card clickable → navigates to relevant page.
**Edge cases:** Zero entries → show empty state with quick-start guide (3-step cards: Import Data → Create Budget → Generate Reports). Zero revenue → Gross Margin shows "-" not Infinity%. Negative net income → red text. Single month of data → chart shows 1 bar with note "More data needed for trends".
**Quality Gate:** Import 200 entries across 12 months → dashboard shows revenue, expenses, net income. Chart renders 12 bars. KPIs formatted as currency with $ sign. Empty state shows when no data.
**Rollback:** Revert DashboardPage.tsx.

#### Phase 25: KPI Card + Activity Feed + Chart Components
**Est. time:** 1 hr | **Files:** 3 (enhance)
**Depends on:** Phase 24
**Files:** `src/components/dashboard/KPICard.tsx`, `src/components/dashboard/ActivityFeed.tsx`, `src/components/analytics/ChartWrapper.tsx`
**Action:**
- **KPICard:** Add `trend` prop ('up'/'down'/'neutral') with colored arrow indicator (green/red/gray). Add `change` prop formatted as "+X.X% / -X.X%". Add `onClick` handler for navigation. Add `sparklineData` for mini trend line. Format values: currency uses Intl.NumberFormat with $, percent with 1 decimal + %, number with commas. All states: normal, zero (show $0), null/undefined (show "-").
- **ActivityFeed:** Fetch from localStorage/computed events. Each item: icon + userName + action + resourceName + relative time ("2m ago", "3h ago", "2d ago", date). Empty: "No recent activity". Max items prop (default 10). Clickable items → navigate to resource.
- **ChartWrapper:** Card container with title bar, optional subtitle, export PNG button (uses canvas.toDataURL), fullscreen toggle, loading skeleton (300px gray pulse), empty state ("No data"), error state ("Chart failed to load" + retry).
**Quality Gate:** Dashboard shows 4 KPI cards with formatted values and trend arrows. Click KPI → navigates. Activity feed shows relative timestamps.
**Rollback:** Revert 3 component files.

#### Phase 26: Revenue vs Expenses Trend Chart
**Est. time:** 1 hr | **Files:** 1 (enhance)
**Depends on:** Phase 24
**Files:** `src/pages/DashboardPage.tsx`
**Action:**
Add 12-month revenue vs expenses chart section below KPI cards. Use Recharts `ComposedChart`: Bar for Revenue (blue #3B82F6), Bar for Expenses (red #F43F5E), Line for Net Income (green #10B981, strokeWidth 2, dots). XAxis: month labels (Jan, Feb...). YAxis: currency formatted. Tooltip: dark background, currency formatting, shows all 3 values. Legend at top. CartesianGrid with dashed lines. ResponsiveContainer fills parent. Empty: "Not enough data for 12-month trend" with subtext "Import data spanning at least 2 months".
**Edge cases:** Less than 2 months data → show message instead of chart. All values zero → show flat line at 0. Missing months → show as 0 (not gap). Negative net income → line dips below zero.
**Quality Gate:** 12 months data → ComposedChart renders with bars + line. Hover tooltip shows all 3 values with $ formatting.
**Rollback:** Revert DashboardPage.tsx.

#### Phase 27: Budget Compliance Gauge + Financial Health
**Est. time:** 1 hr | **Files:** 1 (enhance)
**Depends on:** Phase 24
**Files:** `src/pages/DashboardPage.tsx`
**Action:**
Add financial health section: 4 gauge cards in a row below charts.
1. Budget Compliance: % of budgets in Approved/OnTrack status. GaugeChart with green (>80%), yellow (40-80%), red (<40%) zones.
2. Monthly Run Rate: average of last 3 months total entries. Plain number card.
3. Active Budgets: count. Badge + link to /budgets.
4. Cash Position: if cash account data exists, show balance. Otherwise "Set up cash accounts".
Compute: budgetCompliance = (approvedBudgets / totalBudgets) * 100. monthlyRunRate = entries last 3 months / 3. activeBudgets = budgets.filter(b => b.status !== 'Draft').length.
**Edge cases:** No budgets → compliance shows 0% with note "Create a budget". No 3-month history → run rate shows "Insufficient data". All budgets draft → 0% compliance.
**Quality Gate:** Create 2 approved budgets + 1 draft → compliance gauge shows 66%. Compliance color = yellow zone.
**Rollback:** Revert DashboardPage.tsx.

#### Phase 28: Sector-Specific KPIs on Dashboard
**Est. time:** 1 hr | **Files:** 1 (enhance)
**Depends on:** Phase 24 + Phase 10 (sector configs)
**Files:** `src/pages/DashboardPage.tsx`
**Action:**
Import `useSector` hook. After executive summary KPIs, add sector-specific section with heading "{sector.name} KPIs". Map config.defaultKPIs to KPICard components. Compute sector KPI values where possible: for Technology/SaaS, compute ARR = monthly recurring revenue × 12, Gross Margin = (revenue - COGS) / revenue × 100. For unknown KPIs, show 0 with note "Manual entry required". Sector section only shows when sector config has defaultKPIs.length > 0. Collapsible section with toggle.
**Edge cases:** No sector selected → show nothing. Sector config has 0 KPIs → show nothing. All KPI values 0 → show cards with $0 with note "Import relevant data". Switch sector → KPIs re-render within 500ms.
**Quality Gate:** Switch to Technology sector → dashboard shows ARR, NRR, Churn KPI cards. Switch to Manufacturing → shows OEE, Scrap Rate, Throughput. KPIs change immediately.
**Rollback:** Revert DashboardPage.tsx.

---

### Domain 3: Budget Engine (Phases 29-33)

#### Phase 29: Budget List — Full CRUD with Status Workflow
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 24
**Files:** `src/pages/budgets/BudgetListPage.tsx`
**Action:**
Replace stub with full budget CRUD list. Import `useBudgetStore`. Table columns: Name (link to detail), Fiscal Year, Status (badge: Draft=gray, InReview=yellow, Approved=green, Locked=blue, Rejected=red), Period, Total Amount ($ formatted), Departments, Last Modified (relative time), Created By. Actions per row: Edit (navigate), Submit (confirmation → submitBudget()), Approve (only if role Admin/Manager, only if InReview), Reject (opens reason modal, required field), Delete (confirm dialog, checks for pending approvals), Duplicate (deep copy with "(Copy)" suffix). Filter bar: Status dropdown, Year dropdown, text search on name. Sort by clicking column headers. "Create Budget" button → /budgets/create. 4 states: Loading (skeleton 6 rows), Empty (CTA + illustration), Error, Data.
**Edge cases:** Delete budget with pending approvals → "This budget has pending approvals. Delete anyway?" confirm with extra warning. Duplicate name → auto-suffix "(2)". Zero row budget (no line items) → show with warning badge "Empty".
**Quality Gate:** Create 3 budgets (2 Draft, 1 Approved) → list shows all with correct status badges. Submit Draft → changes to InReview. Approve InReview → changes to Approved. Delete → removed from list.
**Rollback:** Revert BudgetListPage.tsx.

#### Phase 30: Budget Create — 4-Step Wizard
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 29
**Files:** `src/pages/budgets/BudgetCreatePage.tsx`
**Action:**
Replace stub with 4-step wizard using ProgressStepper (steps 1-4 highlighted). Step 1 — Details: Name (required, 2+ chars), Fiscal Year (dropdown 2024-2027), Period Type (Monthly/Quarterly/Annual), Department (multi-select), Base Currency (dropdown 9 currencies), Description (textarea, optional). Step 2 — Accounts: checkboxes grouped by type (Revenue, COGS, OpEx) from glStore.accounts. Select All / Deselect All per group. Search/filter accounts. Step 3 — Amounts: table Account | Jan-Dec (12 month inputs) | Total. Pre-fill with zeros or equal distribution. Quick fill: "Fill all with $X" input. Step 4 — Review: summary card (name, year, accounts count, total amount by type, grand total). "Save as Draft" and "Submit for Approval" buttons. On create: generate all 12 months × selected accounts line items, push to budgetStore, navigate to /budgets/:id.
**Edge cases:** No accounts in glStore → Step 2 shows "Create Chart of Accounts first" with link. 0 accounts selected → "Select at least one account". Name already used this year → warn but allow. Back navigation preserves form state. Total budget $0 → confirm "Total budget is $0. Intentional?"
**Quality Gate:** Create budget with 5 accounts × 12 months → 60 line items created. Budget appears in list. Total amount correct.
**Rollback:** Revert BudgetCreatePage.tsx.

#### Phase 31: Budget Detail — Excel-Like Grid Editor
**Est. time:** 2 hr | **Files:** 1 (replace)
**Depends on:** Phase 29
**Files:** `src/pages/budgets/BudgetDetailPage.tsx`
**Action:**
Replace stub with full budget editor. Import `useBudgetStore`, `useGLStore`, `useParams`. Header: budget name, status badge, period info. Toolbar: Undo/Redo buttons (Ctrl+Z/Y), Submit button (if Draft), Export dropdown (PDF/Excel/CSV), "Back to List" link. Formula bar: selected cell reference | current value | formula input. Data grid: rows = accounts, columns = months (Jan-Dec) + Total. AG Grid DataGrid: editable cells (type='currency'), pinned left columns (Code, Name), number format $X,XXX. Summary row at bottom: totals per month and account. Color: locked cells = gray bg, edited cells = yellow border, hover = blue tint. Cell edit via `updateCell(lineItemId, newValue)` with undo/redo support. Right sidebar: selected cell info, comments for this cell, audit trail for this cell. Keyboard shortcuts via DataGrid: Arrows, Tab, F2, Enter, Ctrl+C/V, Ctrl+Z/Y.
**Edge cases:** Budget ID not found → error state "Budget not found" + back button. 0 line items → "This budget has no accounts. Add accounts first." Locked budget → show lock banner, disable all edits, remove edit cursor. Division by zero in formula → show "Error: Division by zero".
**Quality Gate:** Open budget → grid shows 5 accounts × 12 months. Edit cell → value updates. Undo → reverts. Submit → status changes to InReview. Keyboard arrows navigate cells.
**Rollback:** Revert BudgetDetailPage.tsx.

#### Phase 32: Budget Locking, Versions, Approval Comments
**Est. time:** 1.5 hr | **Files:** 2 (enhance)
**Depends on:** Phase 31
**Files:** `src/pages/budgets/BudgetDetailPage.tsx`, `src/store/budgetStore.ts`
**Action:**
- **Locking:** Add lockBudget(id) to budgetStore. After approval, auto-lock budget. Locked indicator: banner "This budget is locked. Contact an admin to unlock." Grayed cells, no pointer events on grid. Lock/unlock button for admins.
- **Versions:** On each edit, auto-save version snapshot (deep copy of lineItems). Version history sidebar toggle: list of versions with timestamps + "Restore" button. restoreVersion(id, versionIndex) → replaces lineItems with snapshot. Max 50 versions auto-pruned (oldest removed).
- **Approval comments:** When rejecting, modal with reason textarea (required, min 10 chars). Store in collaborationStore or budgetStore.comments[]. Show comment timeline in right sidebar: "Rejected by User on Date — Reason: ...". Approve with optional comment.
**Add to budgetStore:** `lockBudget`, `unlockBudget`, `createVersion`, `restoreVersion`, `addComment`, `getVersionHistory`.
**Edge cases:** Restore version with different account set → warn "Account structure has changed since this version". Max 50 versions → show "Version history full, oldest will be pruned". Locked budget attempted edit → show toast "Cannot edit locked budget".
**Quality Gate:** Edit budget → version created. Submit → reject with reason → comment shows in sidebar. Lock → edit disabled. Unlock → edit enabled.
**Rollback:** Revert BudgetDetailPage.tsx and budgetStore.ts.

#### Phase 33: Multi-Department Roll-Up
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 29
**Files:** `src/pages/budgets/BudgetListPage.tsx`
**Action:**
Add toggle between Flat View and Department Roll-Up View. In roll-up view: group budgets by department. Each department section: header (department name, total budgets, total amount), child budgets indented. Expand/collapse per department. Consolidated summary card at top: total across all departments, total by status (Draft/InReview/Approved), compliance %. Add "Download Template" button → generates CSV with Account × Month headers for offline budget creation. Upload completed template (FileDropZone) → parse → validate column headers → auto-create budget with line items. Validation: check all required columns present, all amounts parseable, no duplicate account codes. Error report for invalid rows.
**Edge cases:** Department with 0 budgets → show "No budgets for this department". Upload template with wrong columns → "Template format invalid. Expected columns: Account, Jan, Feb, ..., Dec". Upload template with invalid amounts → show row-by-row errors.
**Quality Gate:** 3 budgets in 2 departments → roll-up shows 2 department sections with correct totals. Upload template → budget created with correct line items.
**Rollback:** Revert BudgetListPage.tsx.

---

### Domain 4: Forecast & Scenario (Phases 34-38)

#### Phase 34: Forecast List — CRUD
**Est. time:** 1 hr | **Files:** 1 (replace)
**Depends on:** Phase 24
**Files:** `src/pages/forecasts/ForecastListPage.tsx`
**Action:**
Replace stub with forecast CRUD list. Import `useForecastStore`. Table: Name, Type (Rolling/Periodic badge), Period, Status (Draft/InProgress/Completed with color badges), Version, Last Updated (relative), Created By. Actions: Edit, Publish (→ Completed), Archive (soft delete), Duplicate, Delete. Filter bar: Status dropdown, Type dropdown, text search. "Create Forecast" button → /forecasts/create. 4 states: Loading, Empty ("No forecasts yet. Create your first forecast." with CTA), Error, Data.
**Edge cases:** Duplicate forecast name → warn. Publish forecast with no drivers → "Forecast has no drivers. Add drivers first." Archived → move to separate "Archived" tab.
**Quality Gate:** Create 2 forecasts (Rolling, Periodic) → list shows both. Publish Rolling → status changes to Completed. Archive → moved to Archived tab.
**Rollback:** Revert ForecastListPage.tsx.

#### Phase 35: Forecast Builder — Driver-Based Modeling
**Est. time:** 2 hr | **Files:** 2 (replace)
**Depends on:** Phase 34
**Files:** `src/pages/forecasts/ForecastBuilderPage.tsx`, `src/components/scenarios/DriverTreeView.tsx`
**Action:**
Replace stub with full forecast builder. 3-panel layout: Left (Driver Tree), Center (Grid), Right (Charts). Import `useForecastStore`, `useGLStore`, `ForecastEngine`.
- **Driver Tree:** Recursive tree of drivers grouped by type (Revenue Drivers, Expense Drivers). Each node: drag handle | icon | name | current value | growth rate % | edit/delete buttons. Add driver button: type dropdown (Headcount/Revenue/Price/Volume/Rate/Custom), name input, base value input, growth rate (%, can be negative), affected accounts (multi-select checkboxes), formula input (e.g., "=Previous_Month * 1.05"). Delete with confirmation.
- **Center Grid:** Account × Month table computed from drivers. Each month: apply driver growth rates sequentially. Month 1 = base value. Month N = Month(N-1) × (1 + growthRate/100). If seasonality active, multiply by seasonal factor.
- **Run Forecast button:** iterates all drivers × months, stores results. Grid updates instantly.
**DriverTreeView component:** recursive TreeNode. Each level indented 20px. Expand/collapse chevron. Color by type. Inline edit (click name/value → input). Drag up/down buttons (no DnD library).
**Edge cases:** 0 drivers → "Add at least one driver to build a forecast". Driver with 0 growth rate → flat line. Division by zero in formula → show "#DIV/0!" in cell. Negative value → show red. Circular driver dependency → detect and reject.
**Quality Gate:** Add 3 drivers (Headcount +5%/mo, Price $100 +2%/mo, Volume 1000 +3%/mo) → Run → grid shows 12 months of computed values. Change Headcount growth to 10% → Re-run → values update.
**Rollback:** Revert 2 files.

#### Phase 36: Rolling Forecast + Auto-Fill + Seasonality
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 35
**Files:** `src/pages/forecasts/ForecastBuilderPage.tsx`
**Action:**
Add to forecast builder:
- **Rolling forecast:** "Add Next Period" button → shifts 12-month window by 1. Month 1 = latest actual from glStore. Remaining months shifted: old month 2 → new month 1, etc. New month 12 = extrapolated from trend (average of last 3 months' growth rates).
- **Auto-fill methods:** Dropdown for selected driver: "Linear Trend" (fit line to existing data), "Avg Last 3" (mean of last 3 periods), "Same Period LY" (copy from prior year), "Compound Growth" (apply CAGR), "Manual" (user enters each month). Apply to single driver or all drivers.
- **Seasonality:** Seasonality toggle. When active, show 12 input fields for monthly factors (default: 1.0). Preset buttons: "No Seasonality" (all 1.0), "Holiday Peak" (Dec=1.5, Nov=1.2), "Summer Peak" (Jul=1.3, Aug=1.2), "Custom". Factors applied to all computed values.
- **Forecast vs Actual overlay:** If actuals available for past months, overlay as dotted line on trend chart. Variance shown as red/green area below.
**Add to forecastStore:** `addRollingPeriod`, `autoFill(method, params)`, `setSeasonality(factors)`, `overlayActuals`.
**Edge cases:** No actuals for new month → use last actual value. Auto-fill with 0 data points → "Need at least 2 data points for trend". Seasonality factor 0 → that month shows 0. Invalid formula in auto-fill → skip with warning.
**Quality Gate:** Create rolling forecast → click "Add Next Period" → window shifts forward. Apply seasonality (Holiday Peak) → December values 1.5×. Auto-fill "Avg Last 3" → values computed from recent months.
**Rollback:** Revert ForecastBuilderPage.tsx.

#### Phase 37: Scenario List + Builder
**Est. time:** 1.5 hr | **Files:** 2 (replace)
**Depends on:** Phase 34
**Files:** `src/pages/scenarios/ScenarioListPage.tsx`, `src/pages/scenarios/ScenarioBuilderPage.tsx`
**Action:**
- **ScenarioListPage:** Same CRUD pattern as Forecast/Forecast lists. Table: Name, Type (Base/Optimistic/Pessimistic/Custom badge), Probability (slider 0-100%), Version, Created, Last Modified, Actions. "Base Scenario" badge on reference. "Set as Base" button → marks this scenario as comparison baseline. Duplicate → deep copy with "(Copy)".
- **ScenarioBuilderPage:** Left panel: Driver overrides table (Driver | Base Value | Override | Δ%). Override inputs: number input for value, or % change from base. Right panel: Comparison results (Metric | Base | Scenario | Δ | Δ%). Metrics: Revenue, EBITDA, Net Income, Cash Flow, Headcount, Burn Rate, Runway, Gross Margin, EBITDA Margin. Tornado chart: top 10 drivers sorted by impact (absolute range). Toolbar: Save Draft, Run (recalculates), Export comparison as CSV/PDF, "Set as Base".
**Wire to ScenarioEngine:** `ScenarioEngine.sensitivityAnalysis(baseCase, inputs)` → returns impact per driver. `ScenarioEngine.tornadoChart(inputs)` → sorted by range.
**Edge cases:** 0 driver overrides → "No changes from base scenario". All metrics 0 → "Run the base forecast first". Negative net income in scenario → show in red. Tornado chart with 0 range drivers → exclude (not shown).
**Quality Gate:** Create base scenario → create variant with +10% revenue override → comparison shows +$X net income impact. Tornado chart shows revenue as #1 driver. Set as base → badge updates.
**Rollback:** Revert 2 files.

#### Phase 38: Scenario Comparison — Side-by-Side + Weighted
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 37
**Files:** `src/pages/scenarios/ScenarioBuilderPage.tsx`
**Action:**
Add comparison mode with toggle "Single View / Compare / Weighted". 
- **Compare:** Select 2-4 scenarios via checkboxes. Side-by-side table: Metric | Scenario A | Δ vs Base | Scenario B | Δ vs Base | Δ A vs B. Waterfall chart: Base → each scenario's driver impacts → each scenario result. Color: scenarios in different colors (blue, green, orange, purple).
- **Weighted:** Probability inputs for each scenario (sum must = 100%). Weighted result row below comparison table. "Run Weighted" button calls `ScenarioEngine.probabilityWeighted(scenarios)`. Show weighted metrics with confidence interval.
- **Export:** "Export Comparison Report" → PDF with cover page, all scenarios side-by-side, waterfall chart, weighted results summary. "Export as CSV" → raw numbers.
**Wire to ScenarioEngine:** `ScenarioEngine.probabilityWeighted(scenarios)` → weighted metrics.
**Edge cases:** 1 scenario selected → "Select at least 2 scenarios to compare". Probabilities sum ≠ 100% → "Probabilities must sum to 100% (currently X%)" with auto-normalize button. All scenarios identical → comparison shows 0 differences.
**Quality Gate:** Create 3 scenarios (20%, 50%, 30% probabilities) → weighted result = (A×0.2 + B×0.5 + C×0.3). Export PDF shows all 3 + weighted summary. Waterfall chart renders by driver.
**Rollback:** Revert ScenarioBuilderPage.tsx.

---

### Domain 5: Financial Reporting (Phases 39-43)

#### Phase 39: Profit & Loss — Real P&L
**Est. time:** 2 hr | **Files:** 1 (replace)
**Depends on:** Phase 19 (needs GL data)
**Files:** `src/pages/reports/ProfitLossPage.tsx`
**Action:**
Replace stub with real P&L statement. Import `useGLStore`, `useBudgetStore`. Period selector (month/year dropdown). Compute P&L via useMemo: filter entries by period, group by account code prefix. Sections: Revenue (4xxx accounts with detail rows + total), COGS (5xxx accounts + total), Gross Profit (Revenue - COGS, highlighted row with margin %), Operating Expenses (6xxx accounts grouped by subcategory + total), Operating Income/EBIT (GP - OpEx, highlighted), Other Income (7xxx + total), Income Before Tax (Operating + Other, highlighted), Tax (8xxx + total), NET INCOME (final row, bold, double underline, green if positive red if negative). Each section: Account Name | Current Period | Budget (if available) | Variance | % | YTD. Export buttons: PDF (ExportEngine with proper formatting), Excel, CSV. Period-over-period comparison toggle.
**Edge cases:** No entries for period → "No transactions in selected period". Zero revenue → Gross Margin shows "-". Negative net income → red text with parentheses. Budget not available for period → show "N/A" in budget column.
**Quality Gate:** Import 200 entries (revenue, COGS, OpEx) → P&L shows correct Gross Profit, Operating Income, Net Income. Export PDF with headers, alternating rows, page numbers. Gross margin % calculated correctly.
**Rollback:** Revert ProfitLossPage.tsx.

#### Phase 40: Balance Sheet
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 19
**Files:** `src/pages/reports/BalanceSheetPage.tsx`
**Action:**
Replace stub with real balance sheet. As-of-date selector (date picker, default today). Compute via useMemo: filter entries up to as-of-date, group by account type prefix (1=Asset, 2=Liability, 3=Equity). Sections: ASSETS (Current Assets grouped, Fixed Assets grouped, Total Assets with double underline), LIABILITIES (Current Liabilities grouped, Long-Term grouped, Total Liabilities), EQUITY (Retained Earnings, Other Equity, Net Income from P&L, Total Equity), Total Liabilities + Equity. Balance check: "✓ Balanced" (green) if |Total Assets - Total Liabilities & Equity| < $0.01, otherwise "✗ Off by $X" (red) with the difference amount. Key ratios: Current Ratio (CA/CL), D/E (TL/TE), Working Capital (CA-CL).
**Edge cases:** No entries → "No data. Import GL entries first." 0 liability → D/E shows "N/A". Single entry → still balances (just one line on each side). Balance off by $0.01 → still shows as balanced (floating point tolerance).
**Quality Gate:** 5 asset + 5 liability + 2 equity accounts → balance sheet balances to $0. Balance check shows green "✓ Balanced". Current Ratio calculated correctly.
**Rollback:** Revert BalanceSheetPage.tsx.

#### Phase 41: Cash Flow Statement
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 19
**Files:** `src/pages/reports/CashFlowPage.tsx`
**Action:**
Replace stub with real cash flow statement. Period selector (month). Compute from P&L + Balance Sheet changes: Operating Activities = Net Income + Depreciation - ΔAccounts Receivable - ΔInventory + ΔAccounts Payable - ΔPrepaids. Investing Activities = -PP&E Purchases + Asset Sales. Financing Activities = +Debt Issued - Debt Repaid - Dividends. Net Change = Operating + Investing + Financing. Beginning Cash + Net Change = Ending Cash. Sections: OPERATING ACTIVITIES (each item with description + amount, subtotal with single underline), INVESTING ACTIVITIES (items + subtotal), FINANCING ACTIVITIES (items + subtotal), NET CHANGE IN CASH (bold, double underline), Beginning Cash Balance, Ending Cash Balance (must reconcile to Balance Sheet cash line). Negative amounts in parentheses.
**Edge cases:** No prior period data → show "-" for changes. All changes zero → "No cash movement in this period". Ending cash negative → show in red with alert "Negative cash balance". Beginning cash not set → show "Set beginning cash balance in Settings".
**Quality Gate:** 12 months of data → cash flow shows all 3 sections with correct math. Net change + beginning cash = ending cash. Ending cash matches Balance Sheet cash line.
**Rollback:** Revert CashFlowPage.tsx.

#### Phase 42: Budget vs Actual — Variance Analysis
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 19 + Phase 29
**Files:** `src/pages/reports/BudgetVsActualPage.tsx`
**Action:**
Replace stub with real variance report. Budget selector (dropdown of budgets), Period selector. Compute variance: for each budget account, find actual from glStore by matching accountCode + period. Variance = Actual - Budget. Variance % = Variance / |Budget| × 100. Table: Account | Budget | Actual | Variance $ | Variance % | Fav/Unfav badge. Color: Favourable = green row tint, Unfavourable = red row tint. Waterfall chart: Budget → each account variance → Actual. Top 5 most unfavourable highlighted at top with drill-down buttons. Export: PDF, Excel, CSV. Filters: account type, minimum variance threshold (e.g., "Show only >5% variance"), department.
**Wire to VarianceDecompositionEngine:** if volume/rate data available, show Rate vs Volume vs Mix decomposition for revenue accounts.
**Edge cases:** Budget with no actuals → variance = -Budget (100% unfavourable). Actual with no budget → show as "Unbudgeted" row. Zero budget amount → Variance % shows "∞" instead of division by zero. All variances within 5% → "All accounts on track" message.
**Quality Gate:** Budget with 10 accounts + actual entries for same period → correct variances calculated. Waterfall chart renders. Top 5 unfavourable highlighted. Export PDF downloads.
**Rollback:** Revert BudgetVsActualPage.tsx.

#### Phase 43: Board Pack — Executive Report Generator
**Est. time:** 2 hr | **Files:** 1 (replace)
**Depends on:** Phases 39-42
**Files:** `src/pages/reports/BoardPackPage.tsx`
**Action:**
Replace stub with 6-section board report generator. Section toggle checkboxes: Cover, Executive Summary, P&L, Balance Sheet, Cash Flow, Variance Commentary. Period selector. Company name input (default from settingsStore). "Generate PDF" button → creates single multi-page PDF via ExportEngine. Each section generated from the respective phase's computed data. Cover: company name "Board Report", period, "Prepared by FinPlan Pro", date. Exec Summary: 4 KPI cards as text blocks (Revenue, EBITDA, Net Income, FCF) with prior period comparison. P&L: summary table (Revenue, COGS, GP, OpEx, EBIT, Net Income) with budget comparison. BS: key metrics (Total Assets, Total Liabilities, Equity, Current Ratio, D/E). CF: Operating/Investing/Financing summary with net change. Variance: top 10 variances (favorable + unfavorable) with % and status. Save configuration (selected sections, company name) as template. "Schedule" → save to localStorage for recurring generation.
**Edge cases:** No data → "No data available. Import data first." Section with no data → "Section X skipped — insufficient data". Template name empty → "Enter a template name". PDF generation with 0 sections → "Select at least one section".
**Quality Gate:** Generate board pack → PDF with 6 sections, cover page, page numbers. Toggle off 2 sections → PDF has 4 sections. Save template → reload → Load restores config.
**Rollback:** Revert BoardPackPage.tsx.

---

### Domain 6: Multi-Entity Depth (Phases 44-48)

#### Phase 44: Consolidation Dashboard — Full CRUD + Live P&L
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 19
**Files:** `src/pages/consolidation/ConsolidationDashboard.tsx`
**Action:**
Enhance existing A1-built entity CRUD with live consolidated P&L. Wire entity management to glStore (add `entities[]` if not present). Entity table: Name, Code, Currency, Country, Parent, Ownership %, Actions. Add modal: form fields (Name required, Code required 3-8, Currency dropdown, Country, Parent Entity dropdown, Ownership% 0-100). Validate: unique code, no circular parents, ownership 0-100. Delete: confirm, blocked if entity has children. Live consolidated P&L section below table: computed via ConsolidationEngine.consolidate(). Show Account | Entity A | Entity B | Eliminations | Consolidated. Period selector. Entity breakdown chart (Recharts PieChart showing revenue % by entity). "Roll-up" toggle: entities <5% ownership merged into "Other". Export consolidated P&L as PDF.
**Edge cases:** 0 entities → "Add your first entity to begin consolidation". 1 entity → "Add more entities for multi-entity consolidation". Circular parent → "Circular reference detected" error toast. Ownership >100% → clamped to 100%.
**Quality Gate:** 2 entities (Parent 80% owns Sub) → consolidated P&L: Parent=100%, Sub=80%, Minority=20% of net income. Eliminations show IC entries correctly.
**Rollback:** Revert ConsolidationDashboard.tsx.

#### Phase 45: Ownership Tree — Interactive
**Est. time:** 1 hr | **Files:** 1 (enhance)
**Depends on:** Phase 44
**Files:** `src/pages/consolidation/OwnershipTreePage.tsx`
**Action:**
Enhance existing tree with interactivity. Recursive EntityNode component: indent by depth level (depth×24px). Expand/collapse chevron (▶/▼) for entities with children. Color: by ownership% (green >50%, yellow 20-50%, red <20%). Click entity → highlight entire chain to root (bg highlight). Hover → tooltip: Name, Code, Currency, Country, Ownership%, Direct + Effective%. Search box: filter by name or code. Toggle: Tree / Flat Table. Flat table: Entity | Parent | Direct % | Effective % | Chain. "Export as Image" → canvas.toDataURL or use dom-to-image library. "Export as Text" → indented text format.
**Edge cases:** 0 entities → "Add entities in Consolidation Dashboard first". Circular ownership → detect during tree build, show warning node "Circular reference detected". Entity with no parent (top-level) → no indent, different color (blue).
**Quality Gate:** 10 entities with 3-level hierarchy → tree renders correctly. Expand/collapse toggles children. Click entity → chain highlights. Flat table shows effective ownership %.
**Rollback:** Revert OwnershipTreePage.tsx.

#### Phase 46: IC Elimination — Auto-Match + Post Journals
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 44
**Files:** `src/pages/consolidation/ICEliminationPage.tsx`
**Action:**
Enhance existing IC elimination page. Auto-match on load: find pairs where A→B amount ≈ B→A amount within 1% tolerance via ConsolidationEngine.eliminateIntercompany(). Table: From Entity | To Entity | Account | Amount In | Amount Out | Status badge (Matched green / Unmatched red). Manual match: for unmatched pairs, select matching pair from dropdown + "Match" button. Unmatch button to break a match. Elimination journal preview: Date | Entity A Dr | Entity B Cr | Account | Amount. "Post Eliminations" → create journal entries in glStore entries[] with special type "elimination". "Unpost" → remove elimination entries. Summary bar: "X matched of Y total (Z%) — Eliminated $Amount".
**Edge cases:** 0 IC pairs → "No intercompany transactions to match". All unmatched → "No matching pairs found. Check that amounts are balanced between entities." Difference >1% → still show as unmatched with diff amount.
**Quality Gate:** 5 IC pairs (4 match, 1 off by 5%) → 4 auto-matched (green), 1 unmatched (red). Manual match → all 5 matched. Post → journal entries created in glStore. Unpost → entries removed.
**Rollback:** Revert ICEliminationPage.tsx.

#### Phase 47: FX Rates — Full Rate Management
**Est. time:** 1 hr | **Files:** 1 (enhance)
**Depends on:** Phase 44
**Files:** `src/pages/currency/FXRatesPage.tsx`
**Action:**
Enhance with full rate CRUD + history chart. Rate table: From | To | Rate | Date | Source (Manual/Import). Add rate form: From currency dropdown (9 currencies), To currency dropdown, Rate input (>0), Date picker. Edit: click row → inline edit or modal. Delete: confirm. Historical rate chart (Recharts LineChart): select currency pair dropdown, show rate over time (date × rate), line color blue, dots on data points. Bulk import: "Import CSV" button → FileDropZone → parse Date,From,To,Rate → validate → add all. "No rates" empty state: "Add exchange rates to enable multi-currency translation. Rates must be entered manually. Supported: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR." Stale rate detection: rate not updated in 30+ days → yellow warning badge.
**Edge cases:** Rate = 0 → show "Unknown" in table, cannot save (validation: >0). Same from/to currency → reject with "From and To must be different". Duplicate (same pair + date) → "Rate already exists for this date. Overwrite?" Import CSV with invalid rows → skip invalid, import valid, show error count.
**Quality Gate:** Add USD→EUR 0.92 → table updates. Add 12 monthly rates via CSV → chart shows 12 points. Stale rate (>30d) → yellow badge.
**Rollback:** Revert FXRatesPage.tsx.

#### Phase 48: Translation + Hedging
**Est. time:** 1.5 hr | **Files:** 2 (enhance)
**Depends on:** Phase 47
**Files:** `src/pages/currency/TranslationResultPage.tsx`, `src/pages/currency/HedgeManagementPage.tsx`
**Action:**
- **TranslationResultPage:** Entity selector (only entities with non-base currency). Target currency selector. Period selector. "Translate" button → applies latest rates from FXRatesPage to all entries of selected entity via MultiCurrencyEngine.translate(). Table: Account | Original (FC) | Rate | Translated (USD) | Gain/Loss. Negative gain/loss in red, positive in green. CTA (Cumulative Translation Adjustment) summary row. Export as PDF. Auto-detect: if entity currency changed, show warning.
- **HedgeManagementPage:** Table: Instrument Type (Forward/Swap/Option) | Counterparty | Notional | Maturity | Contract Rate | Current Rate | MTM Value | Effectiveness % (colored: green 80-125%, red outside). Add hedge form: Type dropdown, Counterparty input, Notional input, Maturity date picker, Contract Rate input, Designation dropdown (Cash Flow/Fair Value/Net Investment). MTM calculator: compares contract rate to current market rate. Effectiveness gauge: bar showing 80-125% range, needle at current effectiveness.
**Wire to MultiCurrencyEngine:** `MultiCurrencyEngine.translate(amount, from, to, rate)` for each entry. `MultiCurrencyEngine.calculateGainLoss(amount, oldRate, newRate)` for gain/loss column.
**Edge cases:** No rates for currency pair → "No exchange rate available for {from}→{to}. Add rate in FX Rates page." Entity with all 0 entries → "No entries to translate for this entity". Hedge effectiveness <80% or >125% → "Hedge ineffective — consider rebalancing" alert. Maturity past → gray row.
**Quality Gate:** Entity with EUR entries → translate at USD/EUR 0.92 → values correct. Add hedge → effectiveness calculated 85% (green). Change rate → MTM updates.
**Rollback:** Revert 2 files.

---

### Domain 7: Sector-Specific Depth (Phases 49-53)

#### Phase 49: Technology/SaaS Deep Dive
**Est. time:** 2 hr | **Files:** 3 (replace)
**Depends on:** Phase 19
**Files:** `src/pages/saas/ARRDashboard.tsx`, `src/pages/saas/ChurnDashboard.tsx`, `src/pages/saas/CohortAnalysisPage.tsx`
**Action:**
- **ARRDashboard:** Import useGLStore + SaaSMetricsEngine. Compute from accounts 4001-4004 (or user-configured SaaS accounts). KPI cards: Total ARR (MRR×12), Net New ARR, NRR%, GRR%, Quick Ratio. MRR Waterfall chart via WaterfallChart component: Opening MRR → New → Expansion → Contraction → Churn → Closing MRR. Monthly MRR trend over 12 months (area chart). Each card shows period-over-period change.
- **ChurnDashboard:** Logo Churn Rate % (lost customers / total), Revenue Churn Rate % (lost MRR / opening MRR). Monthly churn bar chart (12 months). Churn by reason breakdown via Recharts PieChart. Survival curve: months since signup (1-24) vs % remaining customers.
- **CohortAnalysisPage:** Monthly cohort table: rows = signup month, columns = months since signup (0-11). Cell value = % revenue retained. Color scale: green (100%) → yellow (50%) → red (0%). Summary: Average LTV, Median Lifetime (months), Churn Rate by cohort. Export as CSV.
**Wire to SaaSMetricsEngine:** `calculateARR(mrr)`, `calculateNRR(opening, expansion, contraction, churn)`, `calculateChurnRate(lost, total)`, `calculateLTV(avgRev, margin, churn, cac)`, `calculateQuickRatio(new, expansion, contraction, churn)`.
**Quality Gate:** Import SaaS data (accounts 4001-4004) → ARR = MRR×12. NRR >100% shows net negative churn. Cohort table renders with color scale. Churn chart shows 12 months.
**Rollback:** Revert 3 files.

#### Phase 50: Manufacturing/Inventory Deep Dive
**Est. time:** 1.5 hr | **Files:** 3 (replace)
**Depends on:** Phase 19
**Files:** `src/pages/manufacturing/ProductionDashboardPage.tsx`, `src/pages/manufacturing/COGSVariancePage.tsx`, `src/pages/manufacturing/InventoryPage.tsx`
**Action:**
- **ProductionDashboardPage:** Compute OEE = Availability × Performance × Quality. KPI cards: OEE %, Production Volume vs Target (bar chart by month), Scrap Rate % trend line, Downtime by reason (PieChart). Target values from budget/plan.
- **COGSVariancePage:** Import VarianceDecompositionEngine. COGS decomposition table: Material | Labor | Overhead = Total COGS. Each with Standard vs Actual vs Variance. Rate/Volume/Mix waterfall chart. Top variances highlighted.
- **InventoryPage:** Inventory by category stacked bar chart (Raw/WIP/Finished). KPI cards: Turnover Ratio (COGS / Avg Inventory), DIO (365 / Turnover). Slow-moving alerts: >90 days = yellow, >180 days = red. Inventory value by location/category table.
**Wire to COGSVarianceEngine, InventoryEngine.**
**Quality Gate:** Import manufacturing data → OEE calculated from availability×performance×quality. COGS variance waterfall shows rate/volume/mix components. Inventory turnover >0.
**Rollback:** Revert 3 files.

#### Phase 51: Banking/Insurance/Real Estate Deep Dive
**Est. time:** 2 hr | **Files:** 6 (replace)
**Depends on:** Phase 19
**Files:** `src/pages/banking/NIMDashboardPage.tsx`, `src/pages/banking/CapitalAdequacyPage.tsx`, `src/pages/banking/LoanLossPage.tsx`, `src/pages/insurance/UnderwritingDashboard.tsx` (create if missing), `src/pages/realestate/PropertyDashboard.tsx` etc.
**Action:**
Each page follows same pattern: 4-6 KPI cards, 1-2 charts, 1 data table.
- **NIMDashboardPage:** NIM% = (Interest Income - Interest Expense) / Average Earning Assets. KPI: NIM%, Yield on Assets%, Cost of Funds%, Net Interest Income$. Trend chart: NIM% over 12 months.
- **CapitalAdequacyPage:** CET1 Ratio, Tier 1 Ratio, Total Capital Ratio. RWA breakdown bar chart (Credit/Market/Operational). Capital conservation buffer indicator.
- **LoanLossPage:** ECL by Stage (1/2/3) stacked bar. NPL Ratio, Coverage Ratio, Provision charge trend. 
- **Insurance (Underwriting):** Combined Ratio, Loss Ratio, Expense Ratio. Premium growth chart.
- **Real Estate:** Occupancy %, NOI, Cap Rate, Cash-on-Cash Return. Property P&L table.
**Quality Gate:** Each page shows 4+ sector-specific KPI cards. Charts render from imported data. No two pages have identical layouts.
**Rollback:** Revert 6 files.

#### Phase 52: Retail/Healthcare/Energy/ESG Deep Dive
**Est. time:** 2 hr | **Files:** 6 (replace)
**Depends on:** Phase 19
**Files:** All remaining sector pages
**Action:**
- **Retail:** StoreDashboardPage: Same-store sales growth %, Foot traffic chart, Conversion rate, ATV. PromoAnalysisPage: promo lift %, ROI per campaign table, redemption rate by channel.
- **Healthcare:** VolumeDashboardPage: Patient visits bar chart, Procedure volume, Avg LOS, Admission rate. PayerMixPage: Revenue by payer pie chart, Denial rate, Collection rate trend.
- **Energy:** CommodityDashboardPage: Price trend line chart, Production volume vs target, Revenue per unit. ProductionDashboard: OpEx per unit, Reserve replacement ratio.
- **ESG:** CarbonDashboardPage: Scope 1/2/3 emissions stacked bar, YoY reduction %, Carbon intensity per $M revenue. CSRDReportPage: ESRS compliance checklist with checkboxes, Data point coverage % indicator.
**Quality Gate:** All 8 sector pages render unique KPI cards. Healthcare ≠ Retail ≠ Energy ≠ ESG in content. No data fallbacks with user guidance.
**Rollback:** Revert all sector pages.

#### Phase 53: Construction/Logistics/Hospitality/Gov/Edu/Telecom Deep Dive
**Est. time:** 1.5 hr | **Files:** 6 (replace)
**Depends on:** Phase 19
**Files:** Remaining sector pages
**Action:**
- **Construction:** Job Cost Dashboard: % complete per project, Cost to complete, Gross margin %, Change order impact ($).
- **Logistics:** Cost per mile trend, Revenue per shipment, Fleet utilization %, On-time delivery %.
- **Hospitality:** RevPAR, ADR, Occupancy %, GOPPAR — all trended over 12 months.
- **Government:** Budget vs actual by department table, Grant utilization % by grant, FTEs by agency.
- **Education:** Enrollment trend, Tuition revenue by program, Endowment return %, Cost per student.
- **Telecom:** ARPU trend, Subscriber churn %, SAC (Subscriber Acquisition Cost), Network capex per subscriber.
**Quality Gate:** All 6 sector-specific pages render. Each has unique KPIs (no overlap). No two pages show identical charts or tables.
**Rollback:** Revert all sector pages.

---

### Domain 8: Enterprise Controls (Phases 54-58)

#### Phase 54: Audit Trail — Live Feed from Engine
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 19 + Phase 29 (budget editing creates audit events)
**Files:** `src/pages/audit/AuditTrailPage.tsx`
**Action:**
Replace stub with live audit feed. Import CellAuditTrailEngine. Get entries from engine singleton. Table: Date/Time | User | Account | Field | Old Value | New Value | Reason. Sorted by date desc by default. Filters: Date range (start/end date pickers), User dropdown (distinct users from entries), Account dropdown (distinct accounts), Action type checkboxes (Edit/Approve/Reject/Lock/Import). Sortable columns (click header → toggle asc/desc). "Export Audit Report" → PDF summary: title, date range, total entries count, table of filtered results. Auto-refresh: poll CellAuditTrailEngine every 5 seconds for new entries. Also wire to budgetStore.updateCell to auto-record audit entries: in the updateCell action, call CellAuditTrailEngine.record({...}).
**Edge cases:** 0 audit entries → "No changes recorded. Audit entries appear as you edit budgets and forecasts." Filter with 0 results → "No matching audit entries found." User deleted from system → show userId instead of name. 10,000+ entries → paginate (50 per page) or virtual scroll.
**Quality Gate:** Edit 3 budget cells → audit trail shows 3 entries with correct before/after values. Filter by account → 1 entry shown. Export → PDF downloads with filtered results.
**Rollback:** Revert AuditTrailPage.tsx.

#### Phase 55: Approval Queue — Live Workflow
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 29
**Files:** `src/pages/collaboration/ApprovalQueuePage.tsx`
**Action:**
Replace stub with live approval workflow. Import collaborationStore. Card layout for each approval: Resource name (link to resource), Type badge (Budget/Forecast/Report with colors), Requester avatar circle (initials) + name, Amount $ formatted, Date submitted (relative), Status badge (Pending=yellow, Approved=green, Rejected=red). Action buttons: Approve (green) → optional comment dialog → approve(). Reject (red) → required reason textarea (min 10 chars) → reject(). Batch mode: multi-select checkboxes → "Approve Selected" / "Reject Selected" buttons. Filters: Pending (default) / All / Approved / Rejected. Sort: Newest first / Oldest first. Empty states per filter: "No pending approvals", "No approved requests", "No rejected requests".
**Add to collaborationStore:** `approvals: ApprovalRequest[]`, `approve(id, comment)`, `reject(id, reason)`, `getPendingApprovals()`, `getApprovalsByStatus(status)`.
**Edge cases:** Approve already-approved → no-op with toast "Already approved". Reject without reason → "Reason is required to reject". Network error → "Failed to submit. Try again." with retry button.
**Quality Gate:** Submit budget → appears in approval queue as Pending. Approve → status changes to Approved. Reject with reason → budget returns to Draft, reason visible.
**Rollback:** Revert ApprovalQueuePage.tsx.

#### Phase 56: Collaboration — Comments & Tasks
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 29
**Files:** `src/pages/collaboration/CollaborationPage.tsx`
**Action:**
Replace stub with 3-tab layout (Comments / Tasks / Activity Log).
- **Comments Tab:** Threaded comments on resources. List: resource type badge, title, comment preview, author, time, reply count. Click → expand thread. Add comment: textarea + "Post" button. Edit: pencil icon → inline edit. Delete: trash icon → confirm. @mentions: type @ → show user list dropdown.
- **Tasks Tab:** Table: Title, Assignee, Due date, Priority (Low/Med/High/Critical with color badges), Status (Todo/InProgress/Done), Linked resource. Add Task modal: title (required), description, assignee dropdown, due date picker, priority dropdown, link to resource type/id. Edit/Delete inline. Batch: mark selected as Done.
- **Activity Log Tab:** Chronological feed of all actions: imports, edits, approvals, comments, task changes. Each entry: icon | user | action | resource | time. Infinite scroll (load 20 at a time).
**Enhance collaborationStore:** `comments`, `tasks`, `activityLog` arrays with CRUD actions. Initialize to [].
**Edge cases:** 0 comments → "No comments yet. Start the conversation." 0 tasks → "No tasks. Create one to get started." @mention with no matching user → show suggestion "No users found". Delete task with linked resource → warn.
**Quality Gate:** Add comment → appears in thread with timestamp. Create task with due date → appears in task list. Activity log shows both events.
**Rollback:** Revert CollaborationPage.tsx.

#### Phase 57: Settings — All 6 Tabs Functional
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** ALL previous phases (settings affects many pages)
**Files:** `src/pages/settings/SettingsPage.tsx`
**Action:**
Wire all 6 tabs to settingsStore (with IndexedDB persistence via A3's layer). 
- **Organization Tab:** Company Name input, Fiscal Year Start month dropdown, Base Currency dropdown, Timezone (auto-detect via Intl), Date Format dropdown, Decimal Places (0-6). "Save" button → persists. Test: name appears in report headers.
- **Preferences Tab:** Default Page after login (dropdown of all route paths), Items Per Page (10/25/50/100), Auto-Save Interval (30s/60s/120s/Off), Currency Display ($/€/£/¥).
- **Feature Flags Tab:** Toggles with descriptions: Multi-currency (show FX pages), Multi-entity (show consolidation), Collaboration (show comments/tasks), Audit Trail (show audit page), ESG (show carbon/csrd pages), Sector-specific modules. Toggle → immediately shows/hides nav items.
- **Custom Fields Tab:** Table: Name | Type | Applies To | Required | Created | Actions (Edit/Delete). Add field modal: Name (text, required), Type dropdown (Text/Number/Date/Select/Boolean), Applies To checkboxes (Budget/Forecast/Account/Entity), Required toggle, Options text (only for Select type, comma-separated). Validation: no duplicate names.
- **Report Templates Tab:** Table: Template Name | Sections | Last Used | Actions (Apply/Delete). Save modal: Name + confirm. Templates stored in localStorage.
- **Theme Tab:** Accent color: 6 preset circles (blue #0EA5E9, green #10B981, purple #8B5CF6, orange #F97316, teal #14B8A6, pink #EC4899) + custom hex input with preview. Dark/Light toggle switch. Preview panel showing card, button, input with selected colors.
**Quality Gate:** Change company name → appears in P&L report header. Toggle dark mode → UI switches instantly. Create "Department" custom field → appears on budget forms. Save template → Load restores config.
**Rollback:** Revert SettingsPage.tsx.

#### Phase 58: Period Close — Month-End Workflow
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 29 + Phase 54
**Files:** `src/pages/collaboration/CollaborationPage.tsx`
**Action:**
Add Period Close section as 4th tab. Close checklist table: Task Name | Owner | Status (Pending/InProgress/Done/N/A) | Due Date | Actions. Pre-defined tasks: "Import all GL data", "Reconcile all accounts", "Review variances >5%", "Post adjusting entries", "Generate month-end reports", "Close period". Toggle status per task via click → cycle through Pending→InProgress→Done. "Close Period" button: runs checks via PeriodCloseEngine. Checks: all tasks Done? all entries posted? trial balance balanced? variance commentary submitted? If checks pass → period marked Closed in FiscalCalendar, locked banner shown on all edit pages for this period. If checks fail → show "Cannot close period" with list of incomplete tasks. Close log: date closed, closed by, tasks completed, exceptions. Locking: after close, budgetStore prevents edits to entries in closed period.
**Wire to PeriodCloseEngine:** `PeriodCloseEngine.getCloseStatus(period, tasks)` → `{ canClose: boolean, reasons: string[] }`. `PeriodCloseEngine.closePeriod(period)` → marks period as closed.
**Edge cases:** All tasks already Done → "Close Period" green and enabled. Previously closed period → "Period already closed. Reopen?" Un-close → require reason, creates audit entry. Attempting to edit closed period → "Period is closed. Reopen to make changes."
**Quality Gate:** Complete all 6 close tasks → "Close Period" enabled. Click → period locked. Try editing budget for closed period → blocked with message. Reopen → edits allowed.
**Rollback:** Revert CollaborationPage.tsx.

---

### Domain 9: Advanced Analytics (Phases 59-63)

#### Phase 59: Analytics Dashboard — Full Interactivity
**Est. time:** 2 hr | **Files:** 1 (replace)
**Depends on:** Phase 19
**Files:** `src/pages/analytics/AnalyticsPage.tsx`
**Action:**
Replace stub with full analytics dashboard. Date range selector (start/end). Account type filter checkboxes (Revenue/COGS/OpEx/CapEx). Comparison toggle: vs Budget / vs Prior Period. KPI row: Revenue, Expenses, EBITDA, Net Income — each with formatted value + period-over-period % change arrow (green up / red down). Revenue trend: 12-month AreaChart (blue gradient fill). Expense breakdown: PieChart by department or category. Profitability waterfall: Revenue → COGS → Gross Profit → OpEx → Operating Income → Other → Pre-tax → Tax → Net Income (each step as waterfall bar). Variance section: Top 5 favorable / top 5 unfavorable accounts in split columns. Export PDF button → generates report with all charts and tables.
**Wire to VarianceDecompositionEngine:** for rate/volume/mix breakdown on revenue accounts.
**Edge cases:** 0 entries → "Import data to see analytics". Single month → trend shows 1 data point "More data needed". 0% variance → show as flat. Negative EBITDA → red text. Comparison with no prior period → "N/A" for change.
**Quality Gate:** 12 months data → all charts render. Revenue AreaChart fills on hover. Expense PieChart shows categories. Top 5 variances correct. PDF exports.
**Rollback:** Revert AnalyticsPage.tsx.

#### Phase 60: Variance Dashboard — Multi-Dimensional
**Est. time:** 1.5 hr | **Files:** 1 (replace)
**Depends on:** Phase 42
**Files:** `src/pages/variance/VarianceDashboardPage.tsx`
**Action:**
Replace stub with multi-dimensional variance analysis. Dimension selector tabs: By Account / By Department / By Entity / By Month. Variance type: Budget vs Actual, Forecast vs Actual, Prior Year vs Current. Variance table: Category | Budget | Actual | Variance $ | Variance % | Trend (sparkline). Color: favorable=green, unfavorable=red. Waterfall chart by selected dimension. Heatmap: rows=accounts (or departments), cols=months, cell color = variance% intensity (green positive, red negative, white near-zero). Top 10 largest variances (absolute) list with drill-down "Investigate" button → navigates to GLExplorerPage filtered to that account. Export: PDF, Excel, CSV.
**Heatmap implementation:** cell style = `background: rgba(red/green, intensity)` where intensity = min(|variance%|/50, 1). Text = variance% with sign.
**Edge cases:** 0 budgets or 0 actuals → "Need both budget and actual data". All variances 0 → "All accounts on target!". Department with no data → "No data for this department". Single month → heatmap is 1 column.
**Quality Gate:** 3 departments × 12 months → heatmap renders (36 cells colored). Top 10 identified correctly. Click "Investigate" → navigates to GL explorer.
**Rollback:** Revert VarianceDashboardPage.tsx.

#### Phase 61: What-If — Goal Seek, Monte Carlo, Break-Even
**Est. time:** 2 hr | **Files:** 1 (enhance)
**Depends on:** Phase 37
**Files:** `src/pages/scenarios/ScenarioBuilderPage.tsx`
**Action:**
Add 3-tab tools section: Goal Seek | Monte Carlo | Break-Even.
- **Goal Seek:** Input: Target Net Income $. Select variable driver from dropdown (e.g., "Revenue Growth Rate"). "Calculate" button → iterates driver value from -100% to +1000% to find target. Shows: "To achieve Net Income of $X, {driver} must be {value}%". Iteration history chart. Max 50 iterations, stops when within 0.1% of target.
- **Monte Carlo:** For each driver, set distribution type (Normal/Uniform/Triangular) and parameters (mean, std dev, min, max, mode). "Run 1,000 simulations" button → calls ScenarioEngine.monteCarlo(). Results: histogram (20 buckets, bar chart), statistics (mean, median, std dev, P5, P25, P75, P95, min, max), probability of positive net income %. Distribution selector per driver with parameter inputs.
- **Break-Even:** Inputs: Fixed Costs $, Unit Price $, Variable Cost per Unit $. Computes: Break-Even Units = Fixed / (Price - Variable Cost). Break-Even Revenue = BE Units × Price. Contribution Margin = Price - Variable Cost. Contribution Margin Ratio = CM / Price. Chart: Revenue line vs Total Cost line, intersection = break-even point.
**Wire to ScenarioEngine:** `goalSeek()`, `monteCarlo()`, `sensitivityAnalysis()`, `tornadoChart()`.
**Edge cases:** Goal seek cannot find target → "No solution found within ±100% range. Widen range?" Unit Price ≤ Variable Cost → "Price must exceed variable cost". Monte Carlo with 0 std dev → all results identical. Monte Carlo with negative mean → left-skewed distribution.
**Quality Gate:** Goal seek → finds correct growth % to hit target. Monte Carlo histogram renders with 20 buckets. Break-even chart shows intersection point.
**Rollback:** Revert ScenarioBuilderPage.tsx.

#### Phase 62: Benchmarking — Ratios & Trends
**Est. time:** 1.5 hr | **Files:** 1 (enhance)
**Depends on:** Phase 59
**Files:** `src/pages/analytics/AnalyticsPage.tsx`
**Action:**
Add Benchmarking section below analytics. Ratio cards grid (8 ratios): Current Ratio, Quick Ratio, Debt-to-Equity, ROE, ROA, Gross Margin %, Net Margin %, EBITDA Margin %. Each: formatted value, trend vs prior period, color (green if healthy, red if concerning). Ratio definitions: Current Ratio = Current Assets / Current Liabilities. Quick Ratio = (CA - Inventory) / CL. D/E = Total Liabilities / Total Equity. ROE = Net Income / Total Equity × 100. ROA = Net Income / Total Assets × 100. Gross Margin = (Revenue - COGS) / Revenue × 100. Net Margin = Net Income / Revenue × 100. EBITDA Margin = EBITDA / Revenue × 100. Ratio trend chart: multi-line chart (each ratio as separate line) over 12 months. Tooltip shows all ratio values at hovered month. Export ratio report as PDF.
**Edge cases:** Zero denominator → "N/A" (e.g., 0 equity → D/E = "N/A"). Negative equity → D/E shows negative with red. Single month → trend line is a dot. All ratios identical → flat lines.
**Quality Gate:** Import data → all 8 ratios calculated. D/E shows correct leverage. Ratio trend chart renders 12 months. Export PDF with all ratios.
**Rollback:** Revert AnalyticsPage.tsx.

#### Phase 63: Custom Dashboards — Widget Builder
**Est. time:** 2 hr | **Files:** 1 (enhance)
**Depends on:** Phase 59
**Files:** `src/pages/DashboardPage.tsx`
**Action:**
Add "Customize" mode toggle in dashboard header. When enabled:
- "Add Widget" button → widget picker modal: KPI Card (select metric), Chart (bar/line/pie/waterfall, select data source), Variance Table, Activity Feed, Sector KPIs.
- Widget grid: user-placed widgets in 2-3 column layout. Each widget: title bar with drag handle, config gear icon, remove X button.
- Widget config modal (via gear): title (editable), data source (Revenue/Expenses/Net Income/EBITDA/etc), time period, format, chart type, colors.
- Reorder: up/down arrow buttons on each widget.
- "Save Layout" → persists to localStorage key "customDashboard-layout" as JSON array of widget configs.
- "Reset to Default" → clears localStorage, reloads default widget set.
- Toggle off Customize → shows saved custom layout (or default if none).
**Add to uiStore:** `dashboardLayout: WidgetConfig[]`, `setDashboardLayout()`, `resetDashboardLayout()`.
**Edge cases:** Layout saved with 0 widgets → "Your dashboard is empty. Click Customize to add widgets." Widget with deleted data source → show "Data source unavailable" in widget body. Invalid saved JSON → reset to defaults with toast. Multiple users on same machine → layout is per-browser (acceptable for v1).
**Quality Gate:** Customize → add 3 widgets → Save → refresh page → layout loads. Add KPI with Revenue source → shows live revenue. Reset → back to default. Change widget title → persists.
**Rollback:** Revert DashboardPage.tsx.

---

### Domain 10: Desktop Polish & QA (Phases 64-68)

#### Phase 64: SQLite Migration — Replace IndexedDB
**Est. time:** 2 hr | **Files:** 2 (modify)
**Depends on:** Phase 16 (Tauri shell built)
**Files:** `src/utils/indexedDBStorage.ts`, `src/hooks/usePersistence.ts`
**Action:**
Modify persistence layer to detect and use SQLite when running in Tauri. Detection: try `window.__TAURI__` (or `@tauri-apps/api/core` invoke). If Tauri → use `@tauri-apps/plugin-sql` to connect to SQLite database at `%APPDATA%/finplan-pro/finplan.db`. If browser → fall back to existing IndexedDB. Migration: on first Tauri launch, check if IndexedDB has data, read all stores, insert into SQLite tables. Schema: one table per store (auth_store, ui_store, budget_store, etc.) with columns: id TEXT PRIMARY KEY, value TEXT (JSON serialized). After migration, delete IndexedDB data. usePersistence hook: detect environment on mount, return appropriate storage backend config for Zustand persist middleware.
**Edge cases:** IndexedDB empty → no migration needed. SQLite file missing → create on first access. Migration interrupted → rollback to IndexedDB. Tauri not available → silently use IndexedDB.
**Quality Gate:** Browser → IndexedDB used. Tauri → SQLite used. Data persists across app restart in both modes. Migration preserves all data.
**Rollback:** Revert indexedDBStorage.ts and usePersistence.ts.

#### Phase 65: Web Workers for Heavy Computation
**Est. time:** 2 hr | **Files:** 4 new
**Depends on:** Phase 64
**Files:** `src/workers/formulaWorker.ts` (NEW), `src/workers/consolidationWorker.ts` (NEW), `src/workers/exportWorker.ts` (NEW), `src/workers/scenarioWorker.ts` (NEW)
**Action:**
Create web workers for CPU-intensive operations. Each worker: receives computation payload via postMessage, performs work, returns result. Workers use no DOM APIs — pure computation only.
- **formulaWorker:** Handles FormulaEngine.evaluate() for >10K cells. Message format: `{ type: 'evaluate', cells: Cell[], formulas: Record<string, string> }`. Response: `{ evaluatedCells: Cell[] }`.
- **consolidationWorker:** Handles ConsolidationEngine.consolidate() for >50 entities. Message: `{ entities: EntityData[], ownerships: Ownership[] }`. Response: `{ result: ConsolidatedResult }`.
- **exportWorker:** Handles ExportEngine.exportToPDF() for >10K rows. Message: `{ data: ExportData, config: ExportConfig }`. Response: `{ pdfBlob: ArrayBuffer }`.
- **scenarioWorker:** Handles ScenarioEngine.monteCarlo() for 1000+ iterations. Message: `{ assumptions, iterations }`. Response: `{ results: SimulationResult[] }`.
Usage pattern in pages: create Worker, postMessage, await onmessage, terminate when done.
**Edge cases:** Worker not available (no Web Worker support) → fall back to synchronous execution. Worker takes >10s → show "Still computing..." with spinner. Memory limit exceeded → catch OOM, fall back to sync. Multiple workers simultaneously → limit to navigator.hardwareConcurrency - 1.
**Quality Gate:** 50K cells → formula evaluation <100ms via worker (vs 2s+ without). 50 entities → consolidation <200ms. 10K rows → PDF export <2s.
**Rollback:** Delete src/workers/ directory.

#### Phase 66: Error Recovery — Graceful Degradation
**Est. time:** 1.5 hr | **Files:** ALL pages (add consistent error patterns)
**Depends on:** ALL previous phases
**Files:** Global error boundary, ALL pages (enhance error states)
**Action:**
Enhance error handling across ALL pages:
1. **IndexedDB/SQLite error:** "Could not save to database. Your changes are cached in memory and will be lost on page close." + "Export to Backup" emergency button + auto-retry every 30s.
2. **Calculation overflow:** "Value exceeds maximum supported size. Please reduce input values." + highlight offending cell/input.
3. **Empty required field:** On form submit, red border + "This field is required" below each empty field. Focus first error field.
4. **Render crash:** Enhanced ErrorBoundary (already in App.tsx from A4 Phase 3). Add: "Something went wrong" illustration, error ID (timestamp), expandable technical details (collapsed by default), "Copy Error Details" button (copies to clipboard), "Reload Page" button, "Go to Dashboard" link.
5. **Concurrent edit:** If two instances open, detect via localStorage timestamp → "Another save was detected. Reload to see latest data." + reload button.
**Edge cases:** Multiple sequential errors → show latest, stack previous in expandable list. Error during error recovery → show minimal fallback "Fatal error. Please restart the application."
**Quality Gate:** Force IndexedDB error → shows cache warning + export button. Calculation overflow → shows suggestion. ErrorBoundary catches render error → shows error ID + reload button.
**Rollback:** Revert ErrorBoundary.tsx (if changed) and any page with error enhancements.

#### Phase 67: Automated Smoke Tests
**Est. time:** 2 hr | **Files:** 4 new
**Depends on:** ALL previous phases
**Files:** `tests/smoke.spec.ts`, `tests/reporting.spec.ts`, `tests/import.spec.ts`, `tests/budget.spec.ts` (NEW)
**Action:**
Create Playwright E2E tests:
- **smoke.spec.ts:** Open app → verify landing page renders (no console errors). Check 4 main pages render: Dashboard, Budgets, Reports, Settings. Toggle dark mode → verify CSS variables change. Test keyboard Tab navigation through 2 forms.
- **import.spec.ts:** Upload test CSV (generate temp file) → verify entries in glStore via page.evaluate(). Check import history updated. Undo last import → verify entries removed.
- **budget.spec.ts:** Create budget via UI wizard → fill 4 steps → verify budget appears in list. Open budget → edit a cell → verify value changes. Undo → verify reverts. Submit for approval → verify status changes.
- **reporting.spec.ts:** Navigate to P&L → verify period selector works. Click "Export PDF" → verify file download initiated (check download event). Click "Export Excel" → verify .xlsx download.
Also run: `npm run build` (must pass zero errors), `npm run lint` (zero warnings), TypeScript `--noEmit --strict` (no `any` errors).
**Test infrastructure:** playwright.config.ts with chromium-only (Windows). Screenshot on failure. HTML report.
**Edge cases:** No data state → verify empty states render. Error state → trigger error, verify fallback. 0 results from filter → verify "No results" message.
**Quality Gate:** All 10+ Playwright tests pass on Windows 11 (Edge). Build passes 0 errors. Lint 0 warnings. No `any` types in new code.
**Rollback:** Delete tests/ directory.

#### Phase 68: Final Build & Desktop Verification
**Est. time:** 3 hr | **Files:** Entire app
**Depends on:** ALL 67 previous phases
**Action:**
Final verification on clean Windows 11 VM (no Node.js, no dev tools, no source code):
1. Install Rust: `winget install Rust.Rustup` (5 min). Verify: `rustc --version`, `cargo --version`.
2. `npm install` (restore node_modules from packages). `npm run build` → verify dist/ < 500KB JS + < 100KB CSS. 0 errors, 0 warnings.
3. `npm run tauri:build` → wait for Rust compilation (5-10 min first build). Verify `src-tauri/target/release/FinPlan Pro.msi` exists.
4. Run the MSI installer → verify Start Menu shortcut created, desktop shortcut optional.
5. Launch FinPlan Pro.exe → verify: 1400x900 native window, title "FinPlan Pro", centered on screen.
6. Complete onboarding wizard: Step 1 Welcome → Step 2 (enter company name "Test Corp", select USD, Technology sector) → Step 3 (skip import) → Step 4 (review) → Step 5 "Go to Dashboard".
7. Navigate to Chart of Accounts → add 10 accounts manually. Navigate to Import → upload test CSV (500 rows) → verify import completes in <5 seconds.
8. Navigate to Budgets → create budget (5 accounts × 12 months) → edit 3 cells → undo → verify reverts.
9. Navigate to Reports → P&L → select period → verify numbers correct → Export PDF → verify file downloads.
10. Toggle dark mode → verify all pages render correctly in both modes.
11. Close app (Alt+F4) → reopen → verify all data persists (budgets, entries, accounts, settings).
12. Run `npm test` → verify all Playwright tests pass.
Write final `reports/agent5-complete.md` with: total files changed, time spent per domain, build output sizes, quality gate results (pass/fail per phase), known issues, v0.2.0 recommendations.
**Quality Gate:** FinPlan Pro.exe installs and runs on clean Windows 11. Full flow: open → onboard → import → budget → report → export → close → reopen → data persists. Build < 500KB JS. All tests pass.
**Rollback:** N/A — this is the final delivery phase. If failed, fix the specific subphase that caused the issue and rebuild.

---

## Risk Register

| Risk | Phase | Likelihood | Impact | Mitigation |
|------|:-----:|:----------:|:------:|------------|
| Rust not installed | 16 | MEDIUM | BLOCKER | Document pre-req. Allow 30min to install Rust toolchain |
| IndexedDB quota exceeded | 2 | LOW | MEDIUM | Fall back to in-memory. Warn user. |
| AG Grid community row limit (10K) | 5 | LOW | LOW | Enable pagination in grid config |
| Browser compatibility (Safari) | 2 | LOW | MEDIUM | Not targeting Safari (Windows-only). Edge/Chrome only. |
| Phase overruns 24h fix window | ANY | MEDIUM | MEDIUM | Reassign phase to another agent |
| A5 page count (200 edits) causes drift | 19-68 | MEDIUM | HIGH | Build check after every 5 subphases. If build fails, fix immediately before continuing |
| A5 edits pages that A1/A2/A3 are concurrently modifying | 19-68 | LOW | HIGH | A5 runs AFTER A1-A4 complete. Build check verifies no conflicts |
| Sector page content too similar | 49-53 | MEDIUM | MEDIUM | Each sector must have unique KPIs (verify against sector config files) |

---

## Data Contracts — Store Exports vs Page Consumption

Every page imports from stores using these EXACT patterns. If a store doesn't export what a page needs, the page must adapt.

### Store Export Guarantees (after Phase 1)

| Store | Exports | Used By Pages |
|-------|---------|---------------|
| `useAuthStore` | `{ user, isAuthenticated, login, logout, switchEntity, activeEntityId }` | Navbar, all pages |
| `useBudgetStore` | `{ budgets[], activeBudgetId, lineItems[], setActiveBudget, updateCell, undo, redo }` | Budget pages |
| `useGLStore` | `{ entries[], accounts[], trialBalance[], importStatus, importProgress, recordImport, undoLastImport }` | GL pages, reports |
| `useSettingsStore` | `{ organization, preferences, featureFlags, updateOrganization, toggleFeatureFlag }` | Settings page |
| All other stores | Standard pattern: state array + CRUD actions | Respective pages |

### Mock Data Files (NOT imported by stores)

Mock data files remain in `src/services/mockData/` for DEVELOPMENT ONLY.
Stores do NOT import them in production. If an agent needs test data during development, they import mock data in their test files, NOT in store files.

---

Every agent must report progress via `reports/{agent}-phase{N}-report.md` in this EXACT format:

```markdown
# Agent X — Phase N Completion Report

## Files Created/Modified
- `src/path/to/file.tsx` — CREATED/MODIFIED — brief description

## Time Spent
- Phase started: YYYY-MM-DD HH:MM
- Phase completed: YYYY-MM-DD HH:MM
- Total time: X.X hours

## Quality Gate Results
- npm run build: PASS/FAIL (if FAIL, include error message)
- [Specific gate test]: PASS/FAIL

## Issues Encountered
- Issue 1: description + how it was resolved
- Issue 2: description + how it was resolved

## Self-Assessment
- All acceptance criteria met: YES/NO
- Any known bugs: YES (list) / NO
- Code follows strict TypeScript (no any): YES/NO
```

---

## Phase 14 Documentation Template

Every page edit in Phase 14 must add EXACTLY this content:

```typescript
// At top of component:
import { useEffect } from 'react';

// Inside component, before return:
useEffect(() => {
  document.title = 'FinPlan Pro — Page Name';
}, []);

// In the page header area (next to the title):
// Add: <HelpButton pageKey="route-path" />
// where route-path matches the key in _docs.ts
```

The HelpButton component opens HelpPanel with content from _docs.ts.
_docs.ts content format:

```typescript
PAGE_HELP['/budgets'] = {
  title: 'Budgets',
  sections: [
    {
      title: 'What is a budget?',
      content: 'A budget is your financial plan...',
      example: 'Like a spending plan for your household, but for a company.',
    },
  ],
};
```

---

## Phase 10 Config Validation Rules

validateConfig() must check:
1. id: unique across all 15 configs
2. name: non-empty string
3. defaultKPIs: minimum 5 items, each with id, label, format ('currency'|'percent'|'number'), target (number)
4. enabledModules: minimum 3 items, all lowercase
5. sidebarOrder: minimum 10 paths, all starting with lowercase
6. defaultCurrency: must be one of: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR

---

## Phase 12 Settings Page Layout

The 3 new tabs in Settings must follow this layout:
```
Settings Page
├── Organization Tab (existing)
├── Preferences Tab (existing)
├── Feature Flags Tab (existing)
├── Custom Fields Tab (NEW)
│   ├── Table: Name | Type | Applies To | Required | Created | Actions
│   └── Add Field Modal: Name (text) | Type (dropdown) | Applies To (multi-select) | Required (toggle) | Options (text, shown only when Type=select)
├── Report Templates Tab (NEW)
│   ├── Table: Template Name | Sections | Last Used | Actions
│   └── Save Template Modal: Name (text) | Confirm
└── Theme Tab (NEW)
    ├── Accent Color: Radial selector with 6 presets + custom hex input
    └── Mode: Dark/Light toggle
```

---

## Build Artifact Location

`npm run tauri:build` outputs to:
`src-tauri/target/release/FinPlan Pro.msi`
The final `.exe` is found in:
`src-tauri/target/release/FinPlan Pro.exe`

---

## Agent Workload Summary

| Agent | Phases | Est. Time | Files | Key Directories |
|:-----:|:------:|:---------:|:-----:|-----------------|
| **A1** 🧮 | 1, 8, 15a, 15b, 15c | 5.5 hr | ~25 | `store/`, `pages/consolidation/` |
| **A2** 🎨 | 5, 6, 10, 13 | 5 hr | ~31 | `components/ui/`, `config/sectors/`, `engines/ExportEngine.ts` |
| **A3** 🔌 | 2, 4, 12, 16, 17 | 7.5 hr | ~25 | `utils/`, `store/glStore.ts`, `src-tauri/` |
| **A4** 🏗️ | 3, 9, 11, 14 | 6.5 hr | ~95 | `pages/`, `components/ui/HelpPanel.tsx`, `hooks/` |
| **A5** 🚀 | 19-68 (50 subphases) | ~40 hr | ~200 | ALL `src/pages/`, `src/store/`, `src/components/` |

---

## File Conflict Matrix

| Directory | A1 | A2 | A3 | A4 |
|-----------|:--:|:--:|:--:|:--:|
| src/store/ | ✅ ALL | ❌ | ❌ (glStore only) | ❌ |
| src/utils/ | ❌ | ❌ | ✅ | ❌ |
| src/components/ui/ | ❌ | ✅ | ❌ | ✅ (new only) |
| src/components/data/ | ❌ | ✅ | ❌ | ❌ |
| src/engines/ | ❌ | ✅ (ExportEngine) | ❌ | ❌ |
| src/pages/consolidation/ | ✅ | ❌ | ❌ | ❌ |
| src/pages/reports/ | ❌ | ✅ | ❌ | ❌ |
| src/pages/currency/ | ❌ | ❌ | ❌ | ✅ |
| src/pages/audit/ | ❌ | ❌ | ❌ | ✅ |
| src/pages/ (all other) | ❌ | ❌ | ❌ | ✅ |
| src/hooks/ | ❌ | ❌ | ❌ | ✅ (useFirstRun) |
| src/config/sectors/ | ❌ | ✅ | ❌ | ❌ |
| src-tauri/ | ❌ | ❌ | ✅ | ❌ |

---

## Verification Process

Each phase completion MUST include:
1. Agent writes `reports/{agent}-phase{N}-report.md` listing files changed, time spent, any issues
2. Manager runs `npm run build` — zero errors
3. Manager runs the phase's specific Quality Gate test
4. If pass → next phase begins (may start parallel phases)
5. If fail → agent fixes within 24h or phase reassigned


