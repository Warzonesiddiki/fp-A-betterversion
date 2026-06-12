# FinPlan Pro — Architecture Guide

## 1. System Architecture Overview

FinPlan Pro follows a **strictly decoupled three-layer architecture**: Engines (business logic) → Stores (state) → Pages/Components (presentation). Each layer is independently testable and replaceable.

```
┌─────────────────────────────────────────────────────┐
│                     UI LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Pages   │  │Components│  │  Layout/Providers │  │
│  │ (74 rts) │  │ (55+ ui) │  │ (Theme, Router,   │  │
│  │          │  │          │  │  ErrorBoundary)   │  │
│  └────┬─────┘  └────┬─────┘  └───────────────────┘  │
│       │              │                               │
├───────┴──────────────┴───────────────────────────────┤
│                   STATE LAYER                        │
│  ┌────────────────────────────────────────────────┐  │
│  │          13 Zustand Stores (with Immer)        │  │
│  │  budgetStore │ glStore │ forecastStore │ ...   │  │
│  │           Persisted via IndexedDB              │  │
│  └──────────┬──────────────────────────┬──────────┘  │
│             │                          │              │
├─────────────┼──────────────────────────┼─────────────┤
│             ▼                          ▼              │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  24 Engines      │  │  4 Web Workers           │  │
│  │  (Pure Functions)│  │  (Offloaded Computation) │  │
│  │                  │  │                          │  │
│  │  Consolidation   │  │  consolidationWorker    │  │
│  │  MultiCurrency   │  │  scenarioWorker          │  │
│  │  Scenario        │  │  formulaWorker           │  │
│  │  TaxEngine       │  │  exportWorker            │  │
│  │  SaaSMetrics     │  │                          │  │
│  │  ... (24 total)  │  │                          │  │
│  └──────────────────┘  └──────────────────────────┘  │
│                   ENGINE LAYER                       │
└─────────────────────────────────────────────────────┘
```

## 2. Data Flow

### Primary Data Flow (Import → Consolidate → Report)

```
External Data (Excel/CSV/API)
        │
        ▼
┌─────────────────┐
│  Data Import    │  ← GLDropZone, FileUploader, GLColumnMapper
│  Pipeline       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Zustand Stores │  ← glStore, budgetStore, forecastStore
│  (Normalized)   │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Engines             │  ← ConsolidationEngine, MultiCurrencyEngine,
│  (Calculate/Transform)│     ScenarioEngine, TaxEngine, etc.
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Enriched Stores     │  ← reportStore, varianceStore, analyticsStore
│  (Derived Data)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  UI Layer            │  ← Pages consume store slices,
│  (Render)            │     Components render charts/grids
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Export Engine       │  ← PDF (jsPDF), Excel (ExcelJS), CSV
└──────────────────────┘
```

### User Interaction Flow

```
User Action (click, edit, import)
        │
        ▼
┌──────────────────┐
│  Component       │  ← Fires store action
│  (e.g., DataGrid)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Store Action    │  ← Updates state via Immer
│  (Zustand)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Re-render       │  ← Selective subscriptions
│  (React 19)      │     prevent unnecessary renders
└──────────────────┘
```

## 3. Component Hierarchy

```
<App>
  ├── <ThemeProvider>               (src/context/ThemeContext.tsx)
  ├── <ErrorBoundary>               (src/components/ui/ErrorBoundary.tsx)
  ├── <BrowserRouter>
  │   ├── <AppLayout>               (src/components/layout/AppLayout.tsx)
  │   │   ├── <Navbar>              (src/components/layout/Navbar.tsx)
  │   │   ├── <Sidebar>             (src/components/layout/Sidebar.tsx)
  │   │   └── <main>
  │   │       └── <Page />          (74 routes, lazy loaded)
  │   │
  │   └── UI Primitives (55+)
  │       ├── Button, Input, Select, Card, Modal, Badge
  │       ├── DataGrid, DataTable, FinancialTable
  │       ├── Charts: ComboChart, WaterfallChart, TornadoChart,
  │       │          SankeyChart, TreeMap, Heatmap, GaugeChart
  │       └── Overlay: Toast, CommandPalette, HelpPanel, GuidedTour
  │
  └── Domain Components
      ├── data/       — GLDataPreview, GLAccountDrillDown, FileUploader
      ├── budgets/    — Budget-specific components
      ├── reports/    — Report-specific components
      ├── scenarios/  — Scenario-specific components
      ├── variance/   — Variance analysis components
      ├── dashboard/  — Dashboard widgets
      ├── workforce/  — HeadcountHeatmap
      ├── retail/     — Retail-specific components
      ├── realestate/ — Real estate components
      ├── insurance/  — Insurance components
      ├── construction/— Construction components
      ├── manufacturing/ — Manufacturing components
      ├── saas/       — SaaS metrics components
      ├── treasury/   — Treasury components
      ├── esg/        — ESG reporting components
      ├── analytics/  — Analytics components
      └── settings/   — Settings components
```

### The 4-State Component Pattern

Every data-driven component handles four states:

| State   | What to Render                              |
| ------- | ------------------------------------------- |
| Loading | `<Skeleton />` or `<LoadingScreen />`       |
| Error   | `<Alert type="error">` with retry mechanism |
| Empty   | Empty state message with CTA                |
| Data    | Actual content (grid, chart, table)         |

## 4. Engine Architecture

Engines are **pure functions** with no side effects. Given the same inputs, they always produce the same outputs.

### Engine Catalog (24 total)

| Engine                      | File                                         | Purpose                                            |
| --------------------------- | -------------------------------------------- | -------------------------------------------------- |
| ConsolidationEngine         | `src/engines/ConsolidationEngine.ts`         | Multi-entity rollup with intercompany eliminations |
| MultiCurrencyEngine         | `src/engines/MultiCurrencyEngine.ts`         | FX translation with historical rate support        |
| FormulaEngine               | `src/engines/FormulaEngine.ts`               | High-performance calculation engine                |
| ScenarioEngine              | `src/engines/ScenarioEngine.ts`              | Multi-variant modeling (Base, Best, Worst)         |
| ScenarioEngine              | `src/engines/CapExEngine.ts`                 | Capital Expenditure planning & depreciation        |
| FiscalCalendar              | `src/engines/FiscalCalendar.ts`              | Fiscal period calculations                         |
| TaxEngine                   | `src/engines/TaxEngine.ts`                   | Tax provision and deferred tax calculations        |
| SaaSMetricsEngine           | `src/engines/SaaSMetricsEngine.ts`           | ARR, Churn, CAC, LTV calculations                  |
| RevRecEngine                | `src/engines/RevRecEngine.ts`                | ASC 606 revenue recognition                        |
| LeaseEngine                 | `src/engines/LeaseEngine.ts`                 | IFRS 16 / ASC 842 lease accounting                 |
| CashEngine                  | `src/engines/CashEngine.ts`                  | Cash flow forecasting                              |
| WorkforceEngine             | `src/engines/WorkforceEngine.ts`             | Headcount & compensation planning                  |
| InventoryEngine             | `src/engines/InventoryEngine.ts`             | Inventory valuation & turnover                     |
| COGSVarianceEngine          | `src/engines/COGSVarianceEngine.ts`          | Cost of goods sold variance analysis               |
| VarianceDecompositionEngine | `src/engines/VarianceDecompositionEngine.ts` | Multi-factor variance decomposition                |
| ESGEngine                   | `src/engines/ESGEngine.ts`                   | Environmental, Social, Governance metrics          |
| PeriodCloseEngine           | `src/engines/PeriodCloseEngine.ts`           | Month-end close checklist & automation             |
| CellAuditTrailEngine        | `src/engines/CellAuditTrailEngine.ts`        | Cell-level audit trail tracking                    |
| DataLineageEngine           | `src/engines/DataLineageEngine.ts`           | Data provenance and transformation tracking        |
| DocumentEngine              | `src/engines/DocumentEngine.ts`              | Document generation & management                   |
| CustomFieldEngine           | `src/engines/CustomFieldEngine.ts`           | User-defined field management                      |
| ExcelKeyboardEngine         | `src/engines/ExcelKeyboardEngine.ts`         | Excel-like keyboard navigation                     |
| ExportEngine                | `src/engines/ExportEngine.ts`                | PDF/Excel/CSV export                               |
| UndoRedoEngine              | `src/engines/UndoRedoEngine.ts`              | Undo/redo state management                         |

### Pattern

```typescript
// src/engines/ConsolidationEngine.ts
export class ConsolidationEngine {
  static consolidate(
    entities: Entity[],
    eliminations: Elimination[],
    fxRates: FxRate[]
  ): ConsolidatedResult {
    // Pure computation — no side effects, no async
  }
}
```

### Web Worker Offloading

Complex computations are offloaded to Web Workers:

| Worker                   | Computation                      |
| ------------------------ | -------------------------------- |
| `consolidationWorker.ts` | Large multi-entity consolidation |
| `scenarioWorker.ts`      | Monte Carlo simulations          |
| `formulaWorker.ts`       | Heavy formula recalculations     |
| `exportWorker.ts`        | PDF/Excel generation             |

## 5. State Management (Zustand + Immer)

### Store Separation

13 granular stores prevent unnecessary re-renders:

| Store                | Purpose                       | Persisted          |
| -------------------- | ----------------------------- | ------------------ |
| `authStore`          | User authentication & session | Yes (localStorage) |
| `glStore`            | General Ledger data           | Yes (IndexedDB)    |
| `budgetStore`        | Budget versions & line items  | Yes (IndexedDB)    |
| `forecastStore`      | Forecast models & runs        | Yes (IndexedDB)    |
| `reportStore`        | Report definitions & state    | No                 |
| `varianceStore`      | Variance analysis data        | No                 |
| `scenarioStore`      | Scenario definitions          | Yes (IndexedDB)    |
| `analyticsStore`     | Analytics & KPIs              | No                 |
| `dataStore`          | Imported data cache           | Yes (IndexedDB)    |
| `settingsStore`      | User & app settings           | Yes (localStorage) |
| `uiStore`            | UI state (theme, sidebar)     | Yes (localStorage) |
| `notificationStore`  | Notifications & alerts        | No                 |
| `collaborationStore` | Comments & approvals          | No                 |

### Usage Pattern

```typescript
// Selective picking prevents unnecessary re-renders
const { entries, addEntry } = useGLStore((state) => ({
  entries: state.entries,
  addEntry: state.addEntry,
}));
```

### Persistence Strategy

- **localStorage**: Small, frequently-read state (auth, UI, settings)
- **IndexedDB**: Large financial datasets (GL, budgets, forecasts)
- **Session-only**: Ephemeral state (notifications, analytics)

## 6. Key Design Decisions

### 1. Why Zustand over Redux?

Zustand 5 provides type-safe stores with minimal boilerplate. Combined with Immer, it enables immutable updates without reducers or action types. Selective subscriptions prevent the re-render cascades common in Redux.

### 2. Why pure-function engines?

Engines as pure functions (no class instances, no side effects) make them trivially testable, serializable, and offloadable to Web Workers. A given input always produces the same output.

### 3. Why AG Grid?

AG Grid 35 handles 1M+ rows, inline editing, Excel-like keyboard navigation, and enterprise features (pivot, grouping, aggregation) out of the box — eliminating thousands of lines of custom table code.

### 4. Why Tauri over Electron?

Tauri produces smaller binaries (~5MB vs ~150MB), uses less memory, and provides a Rust-based security model with strict CSP and API allowlisting — critical for enterprise financial data.

### 5. Worker offloading strategy

Consolidation and Monte Carlo simulations are CPU-bound. Offloading to Web Workers keeps the UI responsive at all times. The worker pool runs on `import.meta.url` — compatible with both Vite dev and production builds.

### 6. Accessibility-first

WCAG 2.2 AA is enforced at the lint level (eslint-plugin-jsx-a11y) and through component patterns (semantic HTML, ARIA labels, keyboard navigation, focus management). All Radix UI primitives ship with built-in accessibility.

### 7. Sector-specific dashboards

74 routes span 27 industry verticals (Energy, Healthcare, Real Estate, Construction, Retail, Insurance, Banking, etc.). Each sector has its own configuration in `src/config/sectors/` and dedicated components in `src/components/<sector>/`.

## 7. Routing Strategy

```
Lazy loading: All 74 pages are dynamically imported (React.lazy + Suspense)
Protected routes: Middleware checks auth before rendering
Error boundaries: Each route wrapped in <ErrorBoundary>
Help integration: Every page has contextual help via _docs.ts definitions
```

## 8. CI/CD Pipeline

```
Git push
  │
  ▼
┌──────────────────┐
│  Lint (ESLint)   │   ← .github/workflows/ci.yml
├──────────────────┤
│  Type Check      │   ← tsc --noEmit
├──────────────────┤
│  Unit Tests      │   ← vitest (519+ tests)
├──────────────────┤
│  E2E Tests       │   ← Playwright
├──────────────────┤
│  Build           │   ← vite build
├──────────────────┤
│  Deploy          │   ← .github/workflows/deploy.yml
└──────────────────┘
```

## 9. Desktop Architecture (Tauri)

```
┌────────────────────────────────┐
│  Tauri Rust Backend            │
│  ├── CSP enforcement           │
│  ├── File system access (scoped)│
│  └── Native menu & tray        │
├────────────────────────────────┤
│  Vite Web Build                │
│  ├── React 19 SPA              │
│  ├── Zustand stores            │
│  └── Engines + Workers         │
├────────────────────────────────┤
│  OS Installers                 │
│  ├── Windows: NSIS             │
│  ├── macOS: DMG                │
│  └── Linux: AppImage           │
└────────────────────────────────┘
```
