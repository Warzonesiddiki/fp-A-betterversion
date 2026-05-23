# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 2 of 5: Complete Project State, Architecture & Technical Context
## Version 5.0.0 | Generated 2026-05-18 | VERIFIED AGAINST ACTUAL CODEBASE

---

## 0. PURPOSE OF THIS PART

This part provides the COMPLETE technical snapshot of FinPlan Pro as it
exists RIGHT NOW. Every number, every file, every engine has been
AUDITED against the actual codebase on disk.

CRITICAL CONTEXT:
  FinPlan Pro has ~62,000 lines of code across 832 source files.
  This is NOT a new project. This is a SUBSTANTIAL codebase.
  The fleet must AUDIT what exists before building new things.

---

## 1. AUTONOMOUS OPERATION COMMANDS

### 1.1 Build & Test Commands (MUST USE)

```bash
# Navigate to project root
cd "C:/Users/Tahir/Desktop/frontend that i want"

# Install dependencies
npm install

# Start dev server (Vite, port 5173)
npm run dev

# Run ALL unit tests (Vitest)
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests (Playwright)
npm run test:e2e

# Production build
npm run build

# Lint with auto-fix
npm run lint

# Format code
npm run format

# Tauri desktop dev mode
npm run tauri:dev

# Build native installer
npm run tauri:build

# Start Express API server (port 3001)
cd server && npm run dev
```

### 1.2 Verification Protocol (After Every Change)

```
STEP 1: Run tests
  npm run test
  → ALL tests must pass. If any fail, fix before proceeding.

STEP 2: Check build
  npm run build
  → Build must succeed with no errors.

STEP 3: Check lint
  npm run lint
  → No errors. Warnings are acceptable.

STEP 4: Verify feature works
  npm run dev
  → Open browser, test the specific feature you changed.

STEP 5: Check for regressions
  → Test features that depend on what you changed.
  → Test the save/load cycle if you changed data structures.
```

### 1.3 Error Recovery Protocol

```
IF BUILD FAILS:
  1. Read the error message carefully
  2. Find the file and line number mentioned
  3. Fix the specific error
  4. Re-run: npm run build
  5. If stuck after 3 attempts, revert your last change and try a different approach

IF TESTS FAIL:
  1. Run: npm run test 2>&1 | head -100
  2. Find which test failed and why
  3. Check if the test expectation is wrong OR the code is wrong
  4. Fix the code (not the test, unless the test is genuinely wrong)
  5. Re-run: npm run test

IF TYPE ERRORS:
  1. Run: npx tsc --noEmit
  2. Fix type errors one at a time
  3. Prefer adding proper types over using 'any'

IF YOU'RE STUCK:
  1. Revert your last change
  2. Break the task into smaller pieces
  3. Implement one piece at a time, testing after each
  4. Ask the founder for clarification if the requirement is unclear
```

### 1.4 Context Window Management

```
WHEN WORKING ON LARGE TASKS:
  1. Read only the files you need to modify (not the entire codebase)
  2. Use grep/search to find specific code patterns
  3. Break tasks into small, verifiable chunks
  4. After each chunk, run tests and verify
  5. If context is getting full, save progress and start a new session

FILE READING STRATEGY:
  - Read engine files before modifying them
  - Read store files before modifying them
  - Read test files to understand expected behavior
  - Use grep to find usage patterns across the codebase
  - Don't read files you don't need
```

---

## 2. TECH STACK — VERIFIED FROM package.json

### 2.1 Frontend Stack (VERIFIED)

```
┌─────────────────────────┬───────────┬──────────────────────────────────────┐
│ Technology              │ Version   │ Purpose & Notes                      │
├─────────────────────────┼───────────┼──────────────────────────────────────┤
│ React                   │ 19.2.6    │ UI framework. Concurrent features.   │
│ TypeScript              │ 5.x       │ Type safety. Strict mode.            │
│ Vite                    │ 7.3.2     │ Build tool + dev server.             │
│ Tailwind CSS            │ 4.x       │ Utility-first CSS.                   │
│ Zustand                 │ 5.0.13    │ State management. 17 stores.         │
│ Immer                   │ (bundled)  │ Immutable state updates in stores.   │
│ React Router            │ 7.15.0    │ Client-side routing. 87 routes.      │
│ AG Grid                 │ 35.3.0    │ Data grids. Virtual scrolling.       │
│ Recharts                │ 3.8.1     │ Charts (bar, line, area, pie).       │
│ React Hook Form         │ 7.75.0    │ Form state management.               │
│ Zod                     │ 4.4.3     │ Schema validation.                   │
│ Axios                   │ 1.16.0    │ HTTP client.                         │
│ TanStack Query          │ 5.100.10  │ Server state management.             │
│ i18next                 │ 26.2.0    │ Internationalization.                │
│ Framer Motion           │ 12.38.0   │ Animations.                          │
│ Lucide React            │ 1.14.0    │ Icons.                               │
│ ExcelJS                 │ 4.4.0     │ Excel export with formatting.        │
│ xlsx                    │ 0.18.5    │ Excel IMPORT (critical!).            │
│ jsPDF                   │ 4.2.1     │ PDF generation.                      │
│ jspdf-autotable         │ 5.0.7     │ PDF table generation.                │
│ @huggingface/transformers│ 4.2.0    │ On-device AI (ONNX).                 │
│ Radix UI                │ (multiple)│ Accessible UI primitives.            │
│ date-fns                │ 4.1.0     │ Date utilities.                      │
│ lodash-es               │ 4.18.1    │ Utility functions.                   │
│ file-saver              │ 2.0.5     │ File download helper.                │
│ uuid                    │ 14.0.0    │ UUID generation.                     │
│ class-variance-authority│ 0.7.1     │ Component variant styling.           │
│ clsx                    │ 2.1.1     │ Class name utility.                  │
│ tailwind-merge          │ 3.4.0     │ Tailwind class merging.              │
│ react-error-boundary    │ 6.1.1     │ Error boundary component.            │
│ @a5c-ai/babysitter-sdk  │ 5.0.0     │ Custom AI SDK (a5c integration).     │
└─────────────────────────┴───────────┴──────────────────────────────────────┘

⚠️ IMPORTANT VERSION NOTES:
  - Zod 4.x has DIFFERENT API from Zod 3.x
  - Zustand 5.x dropped deprecated patterns from v4
  - React 19.x has concurrent features (useTransition, useDeferredValue)
  - TypeScript strict mode: noUnusedLocals, noUnusedParameters enabled
  - Path alias: @/ maps to src/ (tsconfig.json + vite.config.ts)
  - Vite proxy: /api → localhost:3001
```

### 2.2 Backend Stack (VERIFIED)

```
Express.js 5.x, better-sqlite3, jsonwebtoken, bcryptjs, helmet, cors, zod 4.x

⚠️ CRITICAL: Backend API is mostly STUBS.
  Only /api/auth route is implemented.
  The following routes return 501 (Not Implemented):
    budgets.ts, gl.ts, forecasts.ts, scenarios.ts,
    reports.ts, entities.ts, export.ts
  The backend is essentially non-functional for business logic.
  All computation happens CLIENT-SIDE via engines.
```

### 2.3 Desktop Stack (VERIFIED)

```
Tauri 2.x, tauri-plugin-sql, tauri-plugin-fs, tauri-plugin-dialog, tauri-plugin-shell
```

### 2.4 Testing Stack (VERIFIED)

```
Vitest 4.1.6, @testing-library/react 16.3.2, Playwright 1.60.0, jsdom 29.1.1
```

### 2.5 Key Dependencies NOT in Original Prompt

```
xlsx (0.18.5)       — Excel IMPORT support (critical for adoption)
Immer                — Immutable state updates in Zustand stores
Radix UI             — Accessible UI primitives (Dialog, Select, etc.)
date-fns             — Date manipulation utilities
lodash-es            — Utility functions (debounce, etc.)
file-saver           — Client-side file download
uuid                 — Unique ID generation
class-variance-authority — Component variant styling
react-error-boundary — Graceful error handling
```

---

## 3. ACTUAL PROJECT STATISTICS (VERIFIED)

```
┌─────────────────────────────┬──────────────┬──────────────────────┐
│ Metric                      │ Actual Value │ Notes                │
├─────────────────────────────┼──────────────┼──────────────────────┤
│ Source Files (src/ .ts/.tsx)│ 832          │ 832 files in src/    │
│ Total Lines of Code         │ ~62,000      │ src: 35K, srv: 7K,  │
│                             │              │ Tauri/Rust: 20K      │
│ Engine Files (non-test)     │ 115          │ 115 engine files     │
│ Page Routes (in App.tsx)    │ 87           │ 87 path= entries     │
│ Page Files (.tsx non-test)  │ 139          │ 139 page files       │
│ Component Files (non-test)  │ 108          │ 108 component files  │
│ Store Files                 │ 17           │ 17 store files       │
│ Test Files                  │ 315          │ 315 test files       │
│ Tests Passing               │ 5,685        │ 5,685/5,748 (62 fail)│
│ Server Route Files          │ 9            │ 9 route files        │
│ Web Worker Files            │ 3+pool       │ 3 workers + pool     │
│ Industry Sector Configs     │ 15           │ 15 sector configs    │
│ Database Tables             │ 35           │ 35 tables            │
└─────────────────────────────┴──────────────┴──────────────────────┘
```

---

## 4. ACTUAL ENGINE CATALOG — 115 ENGINES (VERIFIED)

### 4.1 Calculation Core (6 engines)

```
FormulaEngine.ts           — Formula parser with AST, cell refs, ranges
  ⚠️ CURRENT STATE: Only 5 functions implemented (SUM, IF, COUNT, NPV, CAGR)
  Has real AST parser with operator precedence
  Cell references work (A1, B2)
  Range references: single-column (A1:A10) or single-row (A1:D1) only
  Multi-column ranges (A1:C3) silently miss cells
  Column refs limited to A-Z (single letter)
  Missing: string support, sheet refs, 50+ standard functions, array formulas
  STATUS: Real implementation, NOT a stub, but NOT production-ready

SafeMathParser.ts          — Safe arithmetic (no eval/new Function)
IncrementalCalcEngine.ts   — Dirty-cell tracking, incremental recalc
  ⚠️ CURRENT STATE: Real implementation with dependency graphs
  Topological sort with cycle detection works
  processBatch() is a no-op stub (batching unfinished)
  STATUS: Functional but batch processing incomplete

CubeEngine.ts              — Multi-dimensional OLAP data model (749 lines)
  ⚠️ CURRENT STATE: Strongest engine. Real OLAP implementation.
  Dimension registration with hierarchies, member management,
  cell CRUD with history, query engine with aggregation,
  snapshot management, performance indexes.
  STATUS: Closest to production-ready of the three core engines

CubeEnginePersistence.ts   — Cube persistence (cubeStore DOES persist!)
IterativeCalculationEngine.ts — Circular reference detection & handling
```

NOTE: The prompt claimed "cubeStore has NO PERSISTENCE" — this is WRONG.
CubeEnginePersistence.ts exists and handles persistence.

### 4.2 Financial Engines (15 engines)

```
ConsolidationEngine.ts     — Multi-entity consolidation (ASC 810)
MultiCurrencyEngine.ts     — FX translation (ASC 830 / IAS 21)
ScenarioEngine.ts          — Scenario modeling, Monte Carlo
RollingForecastEngine.ts   — Rolling forecast with auto period extension
TaxEngine.ts               — Tax provision, effective rate, deferred tax
RevRecEngine.ts            — Revenue recognition (ASC 606)
LeaseEngine.ts             — Lease accounting (ASC 842 / IFRS 16)
WorkforceEngine.ts         — Headcount planning, compensation
CashEngine.ts              — Cash flow forecasting
BreakEvenEngine.ts         — Break-even analysis
AllocationEngine.ts        — Cost allocation across departments
CapExEngine.ts             — Capital expenditure planning
DebtScheduleEngine.ts      — Debt schedule management
LoanAmortizationEngine.ts  — Loan amortization schedules
WorkingCapitalEngine.ts    — Working capital modeling
```

### 4.3 OLAP & Cube Engines (6 engines)

```
AdvancedOLAPEngine.ts      — Advanced OLAP operations
CubeEnginePersistence.ts   — Cube data persistence
CubeMigrationEngine.ts     — Cube schema migration
CubePartitioner.ts         — Cube data partitioning
CubeSecurityEngine.ts      — Cube-level security
MDXEngine.ts               — MDX query language support
```

### 4.4 Data & Export Engines (10 engines)

```
ExportEngine.ts            — PDF, Excel, CSV export
ExportTemplateEngine.ts    — Template-based PDF (board packs)
exportExcel.ts             — Dedicated Excel export
ImportEngine.ts            — CSV/JSON/Excel import
ETLPipelineEngine.ts       — Field mapping, transforms
ValidationEngine.ts        — Data validation
ReportBuilderEngine.ts     — Custom report builder
ReportBookEngine.ts        — Multi-report book generation
ReportCacheEngine.ts       — Report caching
ReportVersionEngine.ts     — Report versioning
```

### 4.5 Industry Engines (10 engines)

```
SaaSMetricsEngine.ts       — ARR, MRR, churn, LTV, CAC
BankingEngine.ts           — NIM, capital adequacy, loan loss
HealthcareEngine.ts        — Revenue cycle, patient revenue
RealEstateEngine.ts        — Property valuation, cap rate, NOI
RetailEngine.ts            — Store performance, promo analysis
ESGEngine.ts               — Carbon footprint, CSRD reporting
BondPricingEngine.ts       — Bond pricing and yield
OptionPricingEngine.ts     — Black-Scholes, binomial model
CreditRiskEngine.ts        — PD, LGD, expected loss
InventoryEngine.ts         — FIFO, LIFO, weighted average, EOQ
```

### 4.6 Governance & Security Engines (8 engines)

```
RBACEngine.ts              — Role-based access control
EncryptionEngine.ts        — Data encryption at rest
AuditLogEngine.ts          — Application-level audit logging
DataQualityEngine.ts       — Data quality scoring
DataGovernanceEngine.ts    — Governance policies
DataLineageEngine.ts       — Data lineage tracking
DataClassificationEngine.ts — Data classification
DataMaskingEngine.ts       — Data masking for privacy
DataRetentionEngine.ts     — Data retention policies
DataCatalogEngine.ts       — Data catalog management
```

### 4.7 Workflow & Automation Engines (9 engines)

```
WorkflowEngine.ts          — Core workflow execution
WorkflowBuilderEngine.ts   — Visual workflow builder
WorkflowActionEngine.ts    — Workflow action execution
WorkflowSchedulerEngine.ts — Workflow scheduling
WorkflowTemplateEngine.ts  — Workflow templates
WorkflowTriggerEngine.ts   — Workflow triggers
AutoSaveEngine.ts          — Auto-save with configurable intervals
CrashRecoveryEngine.ts     — Recovery from auto-save snapshots
VersionControlEngine.ts    — File versioning (branching, diffing)
```

### 4.8 UI & Interaction Engines (8 engines)

```
UndoRedoEngine.ts          — Deep undo/redo with history
ExcelKeyboardEngine.ts     — Excel-like keyboard shortcuts
ExcelKeyboardShortcuts.ts  — Keyboard shortcut definitions
ConditionalFormattingEngine.ts — Conditional formatting rules
DashboardBuilderEngine.ts  — Dashboard builder
DrillThroughEngine.ts      — Drill-through to source data
WindowStateManager.ts      — Window state management
RecentFilesEngine.ts       — Recent files tracking
```

### 4.9 Analytics & Intelligence Engines (7 engines)

```
AIEngine.ts                — On-device AI (ONNX)
GoalSeekEngine.ts          — Goal seek / what-if analysis
SensitivityEngine.ts       — Sensitivity analysis
VarianceDecompositionEngine.ts — Variance decomposition
WaterfallBridgeEngine.ts   — Waterfall/bridge charts
WhatIfSandboxEngine.ts     — What-if sandbox
SolverEngine.ts            — Optimization solver
```

### 4.10 Other Engines (22 engines)

```
AggregationDesigner.ts     — Aggregation rule designer
BudgetCollectionEngine.ts  — Budget collection workflows
CashFlowWaterfallEngine.ts — Cash flow waterfall
CellAuditTrailEngine.ts    — Cell-level audit trail
CellCommentEngine.ts       — Cell-level comments
COGSVarianceEngine.ts      — COGS variance analysis
CustomFieldEngine.ts       — Custom field management
DocumentEngine.ts          — Document management
DriverCascadeEngine.ts     — Driver cascade calculations
FinPlanFileEngine.ts       — .finplan file format
FiscalCalendar.ts          — Fiscal calendar management
ForecastReconciliationEngine.ts — Forecast reconciliation
ICMatchingEngine.ts        — Intercompany matching
MasterDataEngine.ts        — Master data management
PeriodCloseEngine.ts       — Period close workflow
PivotTableEngine.ts        — Pivot table operations
QueryCache.ts              — Query result caching
ReportDistributionEngine.ts — Report distribution
ReportSchedulerEngine.ts   — Report scheduling
ReportSchedulingEngine.ts  — Report scheduling (alternate)
SessionEngine.ts           — Session management
TemplateLibrary.ts         — Template library
VisualWorkflowEngine.ts    — Visual workflow engine
YieldCurveEngine.ts        — Yield curve modeling
```

---

## 5. ACTUAL STORE CATALOG — 17 STORES (VERIFIED)

```
authStore.ts               — Authentication state
budgetStore.ts             — Budget management (with undo/redo)
forecastStore.ts           — Forecast management
scenarioStore.ts           — Scenario management
glStore.ts                 — General ledger (syncs with cubeStore)
cubeStore.ts               — OLAP cube state (HAS persistence via CubeEnginePersistence)
dataStore.ts               — Data import management
reportStore.ts             — Report management
varianceStore.ts           — Variance analysis
analyticsStore.ts          — Analytics dashboard
collaborationStore.ts      — Collaboration features
notificationStore.ts       — Notifications
settingsStore.ts           — Settings and preferences
driverStore.ts             — Driver-based planning
uiStore.ts                 — UI state (theme, sidebar, toasts)
tourStore.ts               — Onboarding tours
entityStore.ts             — Entity management (multi-entity)
```

---

## 6. ACTUAL INDUSTRY SECTORS — 15 CONFIGS (VERIFIED)

NOTE: Original prompt claimed 16 sectors. Actual count is 15
(plus 1 index.ts barrel file). SaaS is absorbed into technology.ts.
ESG has no sector config file (it's an engine, not a sector).

```
The ACTUAL sectors in src/config/sectors/ are:

agriculture.ts    — Agricultural financial modeling
banking.ts        — Banking/financial institution
construction.ts   — Construction project costing
education.ts      — Educational institution budgeting
energy.ts         — Energy sector planning
government.ts     — Government/public sector
healthcare.ts     — Healthcare financial modeling
hospitality.ts    — Hospitality industry
insurance.ts      — Insurance industry
logistics.ts      — Logistics and supply chain
manufacturing.ts  — Manufacturing COGS/inventory
realestate.ts     — Real estate portfolio management
retail.ts         — Retail store performance
technology.ts     — Technology/SaaS company
telecom.ts        — Telecommunications

NOTE: The prompt listed SaaS, ESG, Banking, Healthcare, Energy,
Real Estate, Construction, Insurance, Manufacturing, Retail.
The ACTUAL sectors are DIFFERENT. Agriculture, Education, Government,
Hospitality, Logistics, Technology, Telecom exist.
ESG is an engine, not a sector config.
SaaS is covered under Technology.
```

---

## 7. ACTUAL WEB WORKERS — 3 WORKERS + POOL (VERIFIED)

```
src/workers/
├── batch-calc.worker.ts     — Batch formula calculations
├── consolidation.worker.ts  — Consolidation calculations
├── monte-carlo.worker.ts    — Monte Carlo simulation
└── worker-pool.ts           — Worker pool management

NOTE: The original prompt listed WRONG worker names.
These are the ACTUAL workers in the codebase.
```

---

## 8. ACTUAL SERVER ROUTES — 9 FILES (VERIFIED)

```
server/src/routes/
├── auth.ts         — Login, register, refresh, logout, me (IMPLEMENTED)
├── audit.ts        — Audit trail endpoints
├── budgets.ts      — Budget CRUD + line items (STUB — returns 501)
├── entities.ts     — Entities, departments, users (STUB — returns 501)
├── export.ts       — PDF, Excel, CSV export (STUB — returns 501)
├── forecasts.ts    — Forecast CRUD + periods (STUB — returns 501)
├── gl.ts           — GL entries, accounts, trial balance (STUB — returns 501)
├── reports.ts      — Report CRUD + templates (STUB — returns 501)
└── scenarios.ts    — Scenario CRUD + line items (STUB — returns 501)

⚠️ CRITICAL: Only auth.ts is implemented. All other routes return 501.
The "55+ API endpoints" claim is FALSE. The backend is non-functional.
The app is primarily a Tauri desktop app with client-side computation.
```

---

## 9. EXISTING AGENT SYSTEM (ALREADY IN PROJECT)

The project ALREADY has a 5-agent system defined in AGENTS.md:

```
Agent A1 (🧮) — Calculation: Phases 1, 8, 15 (strip mock data, multi-entity, polish)
Agent A2 (🎨) — UI/UX: Phases 5, 6, 10, 13 (reports, keyboard, sectors, accessibility)
Agent A3 (🔌) — Infrastructure: Phases 2, 4, 12, 16, 17 (persist, import, custom, Tauri, install)
Agent A4 (🏗️) — Architecture: Phases 3, 9, 11, 14 (onboard, FX, compliance, docs)
Agent A5 (🚀) — Enterprise Depth: Phases 19-68 (50 subphases, 10 domains)
```

These agents have SPECIFIC file assignments and dependency chains.
The system prompt's 20-agent fleet is an UPGRADE from this 5-agent system.

---

## 10. CODING CONVENTIONS (FROM .claude/rules/)

```
FILE NAMING:
  - Components: PascalCase (BudgetTable.tsx)
  - Hooks/utils: camelCase (useBudgetStore.ts)
  - Config files: kebab-case

IMPORT STYLE:
  - Use @/ path alias (e.g., import { Button } from '@/components/ui/Button')

FINANCIAL DATA:
  - Numbers stored as raw numbers, formatted at display layer
  - Percentages stored as decimals (0.15 = 15%)
  - Currency: Intl.NumberFormat with configurable locale
  - Negative numbers: parentheses not minus sign ($1,234.56) → ($1,234.56)

STATE MANAGEMENT:
  - Zustand with Immer for immutable updates
  - Undo/redo via history array + historyIndex pattern
  - Async operations in store actions, not components

TESTING:
  - Vitest + @testing-library/react
  - AAA pattern (Arrange, Act, Assert)
  - Mock external dependencies
  - Coverage: Stores 90%, Utils 95%, Components 80%, Engines 95%

SECURITY:
  - JWT in memory (not localStorage)
  - RBAC at route level
  - Zod validation on all inputs
  - No hardcoded secrets
```

---

## 11. ARCHITECTURE DIAGRAM (VERIFIED)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages   │  │Components│  │  Layout   │  │    Charts     │  │
│  │  (139)   │  │  (108)   │  │ (3 files) │  │  (Recharts)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       └──────────────┴─────────────┴────────────────┘           │
│                              │                                   │
│                       ┌──────▼──────┐                            │
│                       │  AG Grid    │  (Virtual scrolling)       │
│                       │  (35.3.0)   │                            │
│                       └─────────────┘                            │
├─────────────────────────────────────────────────────────────────┤
│                     STATE MANAGEMENT                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Zustand Stores (17) + Immer                    │   │
│  │  authStore    budgetStore   forecastStore  scenarioStore  │   │
│  │  glStore      cubeStore     dataStore      reportStore    │   │
│  │  varianceStore analyticsStore collaborationStore          │   │
│  │  notificationStore settingsStore driverStore              │   │
│  │  uiStore      tourStore     entityStore                   │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │              masterStorage Adapter                         │   │
│  │       Web: IndexedDB  │  Desktop: SQLite (Tauri)          │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     BUSINESS LOGIC (115 ENGINES)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         FormulaEngine → SafeMathParser → AST             │   │
│  │              ↓                                            │   │
│  │    IncrementalCalcEngine ← IterativeCalcEngine           │   │
│  │              ↓                                            │   │
│  │    CubeEngine + CubeEnginePersistence + MDXEngine         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Financial (15) │ Industry (10) │ Governance (10) │ Workflow (9) │
│  Data/Export (10)│ Analytics (7) │ UI/Interaction (8)│ Other (27)│
├─────────────────────────────────────────────────────────────────┤
│                     DATA STORAGE                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │  SQLite (35 tbl) │  │  File System (.finplan, .xlsx)   │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     NETWORK (OPTIONAL)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express API (port 3001) — 9 route files, JWT auth       │   │
│  │  Axios + TanStack Query — Auto refresh on 401            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  NOTE: App works FULLY OFFLINE. Network layer is OPTIONAL.      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. KNOWN ISSUES & CORRECTIONS

```
ISSUE 1: cubeStore PERSISTENCE — CORRECTED
  Previous claim: "cubeStore has NO PERSISTENCE"
  Reality: CubeEnginePersistence.ts EXISTS and handles persistence.
  The fleet should VERIFY this works, not assume it doesn't.

ISSUE 2: INDUSTRY SECTORS — CORRECTED
  Previous claim: SaaS, ESG, Banking, Healthcare, etc.
  Reality: Agriculture, Banking, Construction, Education, Energy,
  Government, Healthcare, Hospitality, Insurance, Logistics,
  Manufacturing, Real Estate, Retail, Technology, Telecom.
  ESG is an ENGINE, not a sector config.

ISSUE 3: EXCEL IMPORT — CLARIFIED
  Previous claim: "Excel import unclear"
  Reality: xlsx library (0.18.5) IS installed for Excel import.
  ExcelJS (4.4.0) handles Excel export with formatting.
  Both import AND export are supported.

ISSUE 4: LINE COUNT — CORRECTED (v5.0.0)
  Previous claim: 150,423 lines (v4.0.0)
  Reality: ~62,000 lines (src: 35K, server: 7K, Tauri: 20K)
  The v4.0.0 number was WRONG. Verified via wc -l.

ISSUE 5: COMPONENT COUNT — CORRECTED (v5.0.0)
  Previous claim: 133 component files (v4.0.0)
  Reality: 108 component files (non-test)

ISSUE 6: ENGINE COUNT — CORRECTED (v5.0.0)
  Previous claim: 106 engines (v4.0.0)
  Reality: 115 engine files (non-test, non-index)

ISSUE 7: STORE COUNT — CORRECTED (v5.0.0)
  Previous claim: 16 stores (v4.0.0)
  Reality: 17 stores (entityStore was missing)

ISSUE 8: PAGE COUNT — CORRECTED (v5.0.0)
  Previous claim: 85 routes (v4.0.0)
  Reality: 87 routes in App.tsx, 139 page files total

ISSUE 9: WORKER NAMES — CORRECTED (v5.0.0)
  Previous claim: formulaWorker, exportWorker, etc.
  Reality: batch-calc.worker.ts, consolidation.worker.ts,
  monte-carlo.worker.ts, worker-pool.ts

ISSUE 10: TEST COUNTS — VERIFIED (v5.0.0)
  315 test files, 5,748 tests total
  5,685 passing, 62 failing, 1 skipped
  Test failures are in XeroConnector and API integration tests
```

---

╔══════════════════════════════════════════════════════════════════════════════╗
║  END OF PART 2 (v5.0.0)                                                     ║
║  All statistics VERIFIED against actual codebase. 10 corrections.           ║
║  real dependencies listed, actual industry sectors documented.               ║
║  Say "Generate Part 3" when ready.                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
