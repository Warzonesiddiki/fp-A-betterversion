# FINPLAN PRO — COMPLETE ARCHITECTURE & SYSTEM DOCUMENT

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Application Architecture](#4-application-architecture)
5. [State Management (Zustand Stores)](#5-state-management-zustand-stores)
6. [Engine Architecture (174 Engines)](#6-engine-architecture-174-engines)
7. [Page Architecture (140+ Pages)](#7-page-architecture-140-pages)
8. [Component System (150+ Components)](#8-component-system-150-components)
9. [Data Flow & How Everything Connects](#9-data-flow--how-everything-connects)
10. [Routing System](#10-routing-system)
11. [Persistence & Storage](#11-persistence--storage)
12. [Industry Sectors (15 Sectors)](#12-industry-sectors-15-sectors)
13. [Internationalization (8 Languages)](#13-internationalization-8-languages)
14. [Accessibility System](#14-accessibility-system)
15. [Security Architecture](#15-security-architecture)
16. [Performance Architecture](#16-performance-architecture)
17. [Testing Architecture](#17-testing-architecture)
18. [Desktop App (Tauri)](#18-desktop-app-tauri)
19. [Plugin Architecture](#19-plugin-architecture)
20. [Real-Time Collaboration](#20-real-time-collaboration)
21. [External Integrations](#21-external-integrations)
22. [Complete Route Map](#22-complete-route-map)
23. [Store-to-Engine-to-Page Wiring](#23-store-to-engine-to-page-wiring)
24. [File Counts & Metrics](#24-file-counts--metrics)

---

## 1. Executive Summary

**FinPlan Pro** is an enterprise-grade Financial Planning & Analysis (FP&A) desktop/web application built with React 19, TypeScript, Zustand, and Vite. It is an offline-first application that runs as both a web app and a native desktop app via Tauri.

**What it does:**
- Budgeting and forecasting with driver-based planning
- Multi-entity financial consolidation (ASC 810 compliant)
- Three-statement financial modeling (P&L, Balance Sheet, Cash Flow)
- Scenario planning with Monte Carlo simulation
- Variance analysis with automated commentary
- Industry-specific dashboards for 15 sectors
- Real-time collaboration with approval workflows
- Export to PDF, Excel, CSV
- AI-powered anomaly detection and natural language queries

**Scale:**
- 1,190 TypeScript files
- 174 calculation engines
- 140+ page components
- 150+ UI components
- 24 Zustand stores
- 30 custom hooks
- 36 utility modules
- 473 test files
- 8 languages supported
- 15 industry sector configurations

---

## 2. Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.6 | UI framework |
| TypeScript | 5.9.3 | Type safety (strict mode) |
| Vite | 7.3.2 | Build tool & dev server |
| React Router | 7.15.0 | Client-side routing |

### State Management
| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 5.0.13 | Global state management |
| Immer | (bundled) | Immutable state updates |
| subscribeWithSelector | (zustand) | Fine-grained subscriptions |
| persist | (zustand) | State persistence to IndexedDB/SQLite |

### UI & Design
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.1.17 | Utility-first styling |
| Radix UI | 13 packages | Accessible primitives (dialog, dropdown, tabs, etc.) |
| Lucide React | 1.14.0 | Icon library |
| Framer Motion | 12.38.0 | Animations |
| class-variance-authority | 0.7.1 | Component variants |
| tailwind-merge | 3.4.0 | Class merging |

### Data & Grid
| Technology | Version | Purpose |
|------------|---------|---------|
| AG Grid | 35.3.0 | Enterprise data grids |
| @tanstack/react-virtual | 3.13.24 | Virtual scrolling |
| Recharts | 3.8.1 | Charts & visualizations |

### Forms & Validation
| Technology | Version | Purpose |
|------------|---------|---------|
| React Hook Form | 7.75.0 | Form management |
| Zod | 4.4.3 | Schema validation |

### Data Import/Export
| Technology | Version | Purpose |
|------------|---------|---------|
| ExcelJS | 4.4.0 | Excel generation |
| xlsx | 0.18.5 | Excel parsing |
| jsPDF | 4.2.1 | PDF generation |
| jspdf-autotable | 5.0.7 | PDF tables |
| file-saver | 2.0.5 | File download |

### AI & Intelligence
| Technology | Version | Purpose |
|------------|---------|---------|
| @huggingface/transformers | 4.2.0 | On-device AI (WebGPU/WASM) |

### Internationalization
| Technology | Version | Purpose |
|------------|---------|---------|
| i18next | 26.2.0 | i18n framework |
| react-i18next | 17.0.8 | React bindings |
| i18next-browser-languagedetector | 8.2.1 | Auto-detect locale |

### Desktop
| Technology | Purpose |
|------------|---------|
| Tauri | Native desktop wrapper (Rust backend) |
| SQLite | Desktop persistence |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | 4.1.6 | Unit testing |
| @testing-library/react | 16.3.2 | Component testing |
| Playwright | 1.60.0 | E2E testing |
| jsdom | 29.1.1 | DOM simulation |

### PWA
| Technology | Purpose |
|------------|---------|
| vite-plugin-pwa | Service worker, offline support |
| Workbox | Runtime caching strategies |

---

## 3. Project Structure

```
finplan-pro/
├── src/
│   ├── App.tsx                    # Root component with all routing
│   ├── main.tsx                   # Entry point (ReactDOM.createRoot)
│   ├── index.css                  # Global styles + Tailwind
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # 103 primitive/design-system components
│   │   ├── layout/                # AppLayout, Navbar, Sidebar
│   │   ├── analytics/             # ChartWrapper, BenchmarkRadar, DataLineageViewer
│   │   ├── auth/                  # ProtectedRoute
│   │   ├── budgets/               # BudgetGrid
│   │   ├── charts/                # Gauge, Heatmap, Sparkline, Treemap, Variance, Waterfall
│   │   ├── collaboration/         # PresenceIndicator
│   │   ├── construction/          # JobCostDashboard
│   │   ├── dashboard/             # KPICard, ActivityFeed, SankeyDiagram, TornadoChart
│   │   ├── data/                  # FileUploader, GLDropZone, ColumnMapper, GLTrialBalanceGrid
│   │   ├── errors/                # EngineErrorBoundary, GridErrorBoundary, PluginErrorBoundary
│   │   ├── esg/                   # ESGDashboard
│   │   ├── finance/               # ConsolidationTree, DriverPanel, FXPositionGrid, LeaseSchedule
│   │   ├── generative/            # GenerativeDashboard, NLQ
│   │   ├── insurance/             # UnderwritingDashboard
│   │   ├── manufacturing/         # ProductionDashboard
│   │   ├── migration/             # MigrationWizard
│   │   ├── realestate/            # PropertyDashboard
│   │   ├── reports/               # ReportBuilder, BoardPackBuilder, ExportDialog, FormulaBar
│   │   ├── retail/                # StoreDashboard
│   │   ├── saas/                  # ChurnWaterfall, MRRBreakdown, SaaSCohortTable
│   │   ├── scenarios/             # DriverTreeView
│   │   ├── settings/              # TemplateMarketplace
│   │   ├── treasury/              # CashForecastChart
│   │   ├── variance/              # VarianceTable
│   │   └── workforce/             # HeadcountHeatmap
│   │
│   ├── config/                    # Configuration
│   │   ├── designTokens.ts        # Colors, spacing, typography
│   │   ├── keyboardShortcuts.ts   # Shortcut definitions
│   │   ├── sectors/               # 15 industry sector configs
│   │   │   ├── index.ts           # Sector registry
│   │   │   ├── technology.ts
│   │   │   ├── manufacturing.ts
│   │   │   ├── retail.ts
│   │   │   ├── banking.ts
│   │   │   ├── healthcare.ts
│   │   │   ├── energy.ts
│   │   │   ├── realestate.ts
│   │   │   ├── construction.ts
│   │   │   ├── insurance.ts
│   │   │   ├── telecom.ts
│   │   │   ├── logistics.ts
│   │   │   ├── hospitality.ts
│   │   │   ├── government.ts
│   │   │   ├── education.ts
│   │   │   └── agriculture.ts
│   │   └── templates/             # Sector templates
│   │
│   ├── context/
│   │   └── ThemeContext.tsx        # Light/dark theme provider
│   │
│   ├── engines/                   # 174 calculation engines
│   │   ├── index.ts               # Barrel export (35 most-used engines)
│   │   ├── EngineRegistry.ts      # Lazy-load registry for 129 engines
│   │   ├── formula-functions/     # Formula function library
│   │   │   ├── financial.ts       # NPV, IRR, PMT, etc.
│   │   │   ├── statistical.ts     # AVG, STDEV, PERCENTILE, etc.
│   │   │   ├── logical.ts         # IF, AND, OR, SWITCH, etc.
│   │   │   ├── lookup.ts          # VLOOKUP, HLOOKUP, INDEX, MATCH
│   │   │   ├── math.ts            # SUM, ROUND, ABS, etc.
│   │   │   ├── text.ts            # CONCAT, LEFT, RIGHT, etc.
│   │   │   └── helpers.ts         # Shared helpers
│   │   └── templates/             # Industry report templates
│   │       ├── banking.ts
│   │       ├── energy.ts
│   │       ├── healthcare.ts
│   │       ├── insurance.ts
│   │       ├── manufacturing.ts
│   │       ├── real-estate.ts
│   │       ├── retail.ts
│   │       └── saas.ts
│   │
│   ├── hooks/                     # 30 custom React hooks
│   │
│   ├── i18n/                      # Internationalization
│   │   ├── index.ts               # i18next config
│   │   └── locales/               # 8 language files
│   │       ├── en.json
│   │       ├── es.json
│   │       ├── fr.json
│   │       ├── de.json
│   │       ├── ja.json
│   │       ├── zh.json
│   │       ├── ar.json
│   │       └── pt.json
│   │
│   ├── pages/                     # 140+ page components (40+ directories)
│   │   ├── DashboardPage.tsx
│   │   ├── _docs.ts               # Page help documentation
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── banking/
│   │   ├── bonds/
│   │   ├── budgets/
│   │   ├── capex/
│   │   ├── cash/
│   │   ├── charts/
│   │   ├── collaboration/
│   │   ├── consolidation/
│   │   ├── construction/
│   │   ├── credit/
│   │   ├── currency/
│   │   ├── data/
│   │   ├── education/
│   │   ├── energy/
│   │   ├── esg/
│   │   ├── forecasts/
│   │   ├── government/
│   │   ├── healthcare/
│   │   ├── insurance/
│   │   ├── lease/
│   │   ├── logistics/
│   │   ├── manufacturing/
│   │   ├── onboarding/
│   │   ├── realestate/
│   │   ├── reports/
│   │   ├── retail/
│   │   ├── revenue/
│   │   ├── saas/
│   │   ├── scenarios/
│   │   ├── sector/
│   │   ├── settings/
│   │   ├── tax/
│   │   ├── telecom/
│   │   ├── templates/
│   │   ├── treasury/
│   │   ├── variance/
│   │   └── workforce/
│   │
│   ├── services/                  # External services
│   │   ├── api.ts                 # Axios HTTP client
│   │   ├── WebSocketManager.ts    # WebSocket management
│   │   ├── ChangeBroadcaster.ts   # Real-time change broadcasting
│   │   ├── PresenceService.ts     # User presence tracking
│   │   ├── RealtimeCollaborationManager.ts
│   │   ├── api-integration/       # External API connectors
│   │   │   ├── BaseConnector.ts
│   │   │   ├── ConnectorRegistry.ts
│   │   │   ├── RestApiClient.ts
│   │   │   ├── QuickBooksConnector.ts
│   │   │   └── XeroConnector.ts
│   │   └── mockData/              # 19 mock data files
│   │
│   ├── store/                     # 24 Zustand stores
│   │   └── migration/             # Store schema migrations
│   │
│   ├── styles/
│   │   ├── accessibility.css      # WCAG compliance styles
│   │   └── print.css              # Print-specific styles
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── index.ts               # 818 lines — all core types
│   │   ├── cube-types.ts          # OLAP cube types
│   │   ├── sector-types.ts        # Industry-specific types
│   │   └── plugin.ts              # Plugin architecture types
│   │
│   ├── utils/                     # 36 utility modules
│   │
│   ├── workers/                   # Web Workers for heavy computation
│   │   ├── WorkerPool.ts          # Worker pool manager
│   │   ├── batch-calc.worker.ts   # Batch calculations
│   │   ├── consolidation.worker.ts # Consolidation
│   │   ├── monte-carlo.worker.ts  # Monte Carlo simulation
│   │   ├── formulaWorker.ts       # Formula evaluation
│   │   ├── exportWorker.ts        # Export generation
│   │   └── scenarioWorker.ts      # Scenario calculations
│   │
│   └── test/
│       └── setup.ts               # Vitest setup
│
├── prompt/                        # 18 specification documents
├── agents/                        # Agent task assignments
├── src-tauri/                     # Tauri desktop wrapper
├── tests/                         # E2E tests (Playwright)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── AGENTS.md                      # Agent coordination docs
```

---

## 4. Application Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Sidebar  │ │  Navbar  │ │  Pages   │ │  Command Palette │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     COMPONENT LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ UI (103) │ │ Charts   │ │ Grids    │ │ Domain Components│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     STATE MANAGEMENT                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Zustand  │ │  Immer   │ │ Persist  │ │ subscribeWith    │   │
│  │ 24 stores│ │ mutable  │ │ IndexedDB│ │   Selector       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     ENGINE LAYER                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Formula  │ │ Cube     │ │ Industry │ │ AI/ML            │   │
│  │ Engine   │ │ Engine   │ │ Engines  │ │ Engine           │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     PERSISTENCE LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ IndexedDB│ │ Tauri    │ │ Offline  │ │ Backup/          │   │
│  │ (Web)    │ │ SQLite   │ │ Cache    │ │ Restore          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     EXTERNAL LAYER                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ QuickBooks│ │ Xero    │ │ WebSocket│ │ REST APIs        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Hierarchy

```
App.tsx
├── ThemeProvider (context/ThemeContext.tsx)
├── Router (react-router-dom)
│   ├── Public Routes (/login, /register, /forgot-password)
│   └── AppLayout (components/layout/AppLayout.tsx)
│       ├── Sidebar (components/layout/Sidebar.tsx)
│       │   ├── Logo
│       │   ├── Quick Search
│       │   ├── Navigation Sections (Main, Analysis, Management)
│       │   └── Footer (Settings, Help, Theme Toggle, Collapse)
│       ├── Navbar (components/layout/Navbar.tsx)
│       │   ├── Entity Selector (multi-entity switching)
│       │   ├── Search
│       │   ├── Notifications
│       │   ├── Quick Create Menu
│       │   └── User Menu
│       ├── Main Content Area (<Outlet />)
│       │   └── Page Components (lazy-loaded)
│       ├── ToastContainer
│       └── CommandPalette (Ctrl+K)
```

### 4.3 Data Flow Pattern

```
User Action → Component → Store Action → Engine Calculation → Store Update → Component Re-render
                                                    ↓
                                            Persistence (IndexedDB/SQLite)
                                                    ↓
                                            Offline Cache (if offline)
```

---

## 5. State Management (Zustand Stores)

### 5.1 Store Architecture

Every store follows this canonical pattern:

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '../utils/masterStorage';

export const useExampleStore = create<StateType>()(
  subscribeWithSelector(      // 1. Fine-grained subscriptions
    persist(                   // 2. Persistence to IndexedDB/SQLite
      immer((set, get) => ({   // 3. Immutable updates via Immer
        // State
        items: [],
        isLoading: false,
        
        // Actions
        addItem: (item) => set((state) => {
          state.items.push(item);  // Immer draft — looks mutable, is immutable
        }),
      })),
      {
        name: 'example-store',     // Storage key
        storage: masterStorage,    // IndexedDB (web) or SQLite (Tauri)
      }
    )
  )
);
```

### 5.2 All 24 Stores

| Store | File | State | Purpose |
|-------|------|-------|---------|
| **authStore** | `authStore.ts` | `user, token, activeEntityId, mfaEnabled` | Authentication, RBAC permissions, entity switching |
| **budgetStore** | `budgetStore.ts` | `budgets, lineItems, activeBudgetId, history, historyIndex` | Budget CRUD, undo/redo, cell selection |
| **forecastStore** | `forecastStore.ts` | `forecasts, drivers, selectedForecastId` | Forecast CRUD, driver management, undo/redo |
| **scenarioStore** | `scenarioStore.ts` | `scenarios, selectedScenarioId, comparedScenarioIds` | Scenario CRUD, comparison toggling |
| **varianceStore** | `varianceStore.ts` | `analyses` | Variance analysis data |
| **glStore** | `glStore.ts` | `entries, accounts, trialBalance, accountAnalysis, columnMapping, importHistory` | GL data, import pipeline, undo/redo |
| **reportStore** | `reportStore.ts` | `reports, scheduledReports, activeReportId` | Report CRUD, scheduling |
| **analyticsStore** | `analyticsStore.ts` | `charts, selectedChartId, dateRange, filter, drillDownPath` | Chart configs, drill-down state |
| **dataStore** | `dataStore.ts` | `accounts, importJobs, selectedAccountId` | Chart of accounts, import jobs |
| **entityStore** | `entityStore.ts` | `entities, selectedEntityId` | Multi-entity management, offline cache |
| **settingsStore** | `settingsStore.ts` | `organization, users, roles, preferences` | Org settings, user management, sector preferences |
| **uiStore** | `uiStore.ts` | `sidebarCollapsed, theme, commandPaletteOpen, toasts, isOnline, globalDateRange` | UI state, theme, toasts, online status |
| **notificationStore** | `notificationStore.ts` | `notifications, unreadCount` | Notifications, read/unread |
| **collaborationStore** | `collaborationStore.ts` | `comments, tasks, approvals, activityLog` | Comments, tasks, approvals, activity log |
| **cubeStore** | `cubeStore.ts` | `engine (CubeEngine), cellCount, snapshots` | OLAP cube operations |
| **driverStore** | `driverStore.ts` | `engine (DriverCascadeEngine), selectedDriverId` | Driver-based planning, cascade calculations |
| **tourStore** | `tourStore.ts` | `isActive, currentStepIndex, steps, completedTours` | Guided tours |
| **constructionStore** | `constructionStore.ts` | `costBreakdown, changeOrders, costLedger` | Construction sector data |
| **energyStore** | `energyStore.ts` | `assets, generationTrend, capacityMix` | Energy sector data |
| **healthcareStore** | `healthcareStore.ts` | `qualityMetrics, savingsData, programs` | Healthcare sector data |
| **insuranceStore** | `insuranceStore.ts` | `rateAdequacy, lossPicks, rateFilings` | Insurance sector data |
| **realEstateStore** | `realEstateStore.ts` | `maintenanceTrend, facilities` | Real estate sector data |

### 5.3 Store Dependencies

```
authStore ──────► entityStore (entity switching)
budgetStore ────► glStore (account references)
forecastStore ──► budgetStore (base budget references)
scenarioStore ──► budgetStore (base budget references)
collaborationStore ──► SyncEngine (real-time sync)
driverStore ────► DriverCascadeEngine (calculations)
cubeStore ──────► CubeEngine (OLAP operations)
```

---

## 6. Engine Architecture (174 Engines)

### 6.1 Engine Categories

All engines are pure TypeScript classes with static methods. They take raw data as input and return calculated results. They do NOT touch the DOM or React state directly.

#### Core Financial Engines (Always Loaded)
| Engine | Purpose |
|--------|---------|
| `FormulaEngine` | Parse and evaluate Excel-like formulas (`=SUM(A1:A10)`, `=IF(B2>100, "High", "Low")`) |
| `ThreeStatementEngine` | Generate P&L, Balance Sheet, Cash Flow from GL entries |
| `ConsolidationEngine` | Multi-entity consolidation (ASC 810 compliant — full, equity, cost methods) |
| `CalculationGraph` | Dependency graph for formula recalculation (topological sort) |
| `ImportEngine` | Parse and import data from Excel, CSV, JSON |

#### Cube/OLAP Engines
| Engine | Purpose |
|--------|---------|
| `CubeEngine` | Core multi-dimensional OLAP cube (dimensions, measures, cells) |
| `AdvancedOLAPEngine` | Advanced OLAP operations (slicing, dicing, drilling) |
| `MDXEngine` | MDX query language for OLAP |
| `PivotTableEngine` | Pivot table operations |
| `DimensionalModelingEngine` | Star/snowflake schema design |
| `CubePartitioner` | Cube data partitioning for performance |
| `CubeSecurityEngine` | Cube-level access control |
| `CubeEnginePersistence` | Cube data persistence |
| `CubeMigrationEngine` | Migrate flat data to cube model |
| `AggregateTableEngine` | Pre-aggregated table computations |
| `AggregationDesigner` | Design aggregation rules |
| `QueryCache` | Cache OLAP query results |

#### Budget & Forecast Engines
| Engine | Purpose |
|--------|---------|
| `BudgetCollectionEngine` | Budget collection/aggregation workflows |
| `RollingForecastEngine` | Rolling forecast calculations |
| `ForecastReconciliationEngine` | Forecast reconciliation |
| `DriverCascadeEngine` | Cascading driver calculations |
| `DriverLibrary` | Forecast driver library |
| `SpreadEngine` | Spread/interpolation across periods |
| `AssumptionEngine` | Manage budget/forecast assumptions |
| `AllocationEngine` | Cost/revenue allocation |
| `AllocationRuleEngine` | Rule-based allocation |

#### Scenario & Analysis Engines
| Engine | Purpose |
|--------|---------|
| `ScenarioEngine` | Scenario modeling (base, optimistic, pessimistic, custom) |
| `MonteCarloEngine` | Monte Carlo simulation (normal, uniform, triangular distributions) |
| `SensitivityEngine` | Sensitivity analysis |
| `SensitivityTableEngine` | Sensitivity table generation |
| `GoalSeekEngine` | Goal seek/solver |
| `SolverEngine` | Mathematical solver |
| `WhatIfSandboxEngine` | What-if sandbox |
| `BreakEvenEngine` | Break-even analysis |
| `VarianceDecompositionEngine` | Variance decomposition (rate vs volume) |

#### Financial Operations Engines
| Engine | Purpose |
|--------|---------|
| `CashEngine` | Cash flow modeling |
| `CashFlowWaterfallEngine` | Cash flow waterfall charts |
| `DebtScheduleEngine` | Debt schedule calculations |
| `WorkingCapitalEngine` | Working capital calculations |
| `CapExEngine` | Capital expenditure and depreciation |
| `LeaseEngine` | Lease accounting (ASC 842/IFRS 16) |
| `RevRecEngine` | Revenue recognition (ASC 606) |
| `TaxEngine` | Tax provision calculations |
| `FXEngine` | Foreign exchange rates |
| `MultiCurrencyEngine` | Multi-currency handling |
| `LoanAmortizationEngine` | Loan amortization schedules |

#### Treasury & Investment Engines
| Engine | Purpose |
|--------|---------|
| `BondPricingEngine` | Bond pricing and yield |
| `YieldCurveEngine` | Yield curve modeling |
| `OptionPricingEngine` | Options pricing (Black-Scholes) |
| `CreditRiskEngine` | Credit risk scoring |
| `FinancialInstrumentsEngine` | Financial instrument pricing |

#### Data & Import Engines
| Engine | Purpose |
|--------|---------|
| `ExcelImportEngine` | Excel file import |
| `SmartImportMapper` | AI-powered column mapping |
| `SmartImportMapping` | Smart import mapping logic |
| `StreamImportEngine` | Streaming import for large files |
| `ETLPipelineEngine` | ETL data pipeline |
| `MigrationEngine` | Data migration workflows |
| `DataQualityEngine` | Data quality validation |
| `DataLineageEngine` | Data lineage tracking |
| `DataCatalogEngine` | Data catalog/metadata |
| `DataClassificationEngine` | Data classification (PII, sensitive) |
| `DataGovernanceEngine` | Data governance rules |
| `DataMaskingEngine` | Data masking |
| `DataRetentionEngine` | Data retention policies |
| `MasterDataEngine` | Master data management |

#### Export Engines
| Engine | Purpose |
|--------|---------|
| `ExportEngine` | Export to CSV, Excel, PDF |
| `ProfessionalExportEngine` | Professional PDF/PPTX export |
| `ExportTemplateEngine` | Export template management |
| `ReportBookEngine` | Report book/packet generation |
| `ReportBuilderEngine` | Custom report builder |
| `ReportLayoutEngine` | Report layout |
| `ReportCacheEngine` | Report caching |
| `ReportVersionEngine` | Report versioning |
| `ReportSchedulerEngine` | Report scheduling |
| `ReportDistributionEngine` | Report distribution |

#### Compliance & Audit Engines
| Engine | Purpose |
|--------|---------|
| `AuditLogEngine` | Structured audit logging |
| `CellAuditTrailEngine` | Per-cell audit trail |
| `AuditEngine` | Audit trail operations |
| `SOXComplianceEngine` | SOX compliance checks |
| `ComplianceEngine` | Regulatory compliance |
| `EncryptionEngine` | Data encryption at rest |
| `RBACEngine` | Role-based access control |

#### AI & Intelligence Engines
| Engine | Purpose |
|--------|---------|
| `AIEngine` | On-device AI via HuggingFace transformers (WebGPU/WASM) |
| `AICopilotEngine` | AI copilot assistant |
| `FinanceCopilotEngine` | AI finance copilot |
| `NLQEngine` | Natural Language Query engine |
| `AnomalyDetectionEngine` | Statistical anomaly detection |
| `AnomalyExplainer` | Natural language anomaly explanations |
| `AutoCommentaryEngine` | Auto-generated variance commentary |

#### Industry-Specific Engines
| Engine | Industry | Purpose |
|--------|----------|---------|
| `SaaSMetricsEngine` | SaaS | ARR, NRR, LTV, CAC, churn |
| `COGSVarianceEngine` | Manufacturing | COGS variance analysis |
| `InventoryEngine` | Manufacturing/Retail | Inventory management |
| `ManufacturingEngine` | Manufacturing | OEE, BOM, throughput |
| `BankingEngine` | Banking | NIM, capital adequacy, loan loss |
| `HealthcareEngine` | Healthcare | Patient revenue, clinical trials |
| `RealEstateEngine` | Real Estate | NOI, cap rate, DSCR |
| `RetailEngine` | Retail | Sell-through, GMROI |
| `ConstructionEngine` | Construction | Job costing, EVM |
| `EnergyEngine` | Energy | Production, reserves, emissions |
| `InsuranceEngine` | Insurance | Loss triangles, premiums |
| `ESGEngine` | ESG | Carbon, CSRD, sustainability |

#### Workflow & Collaboration Engines
| Engine | Purpose |
|--------|---------|
| `WorkflowEngine` | Core workflow engine |
| `WorkflowBuilderEngine` | Visual workflow builder |
| `WorkflowActionEngine` | Workflow action execution |
| `WorkflowTriggerEngine` | Workflow triggers |
| `WorkflowSchedulerEngine` | Workflow scheduling |
| `WorkflowTemplateEngine` | Workflow templates |
| `VisualWorkflowEngine` | Visual workflow UI |
| `SyncEngine` | Data synchronization |
| `CellCommentEngine` | Cell-level comments |
| `DocumentEngine` | Document attachments |

#### Grid & UI Engines
| Engine | Purpose |
|--------|---------|
| `ExcelKeyboardEngine` | Excel-like keyboard shortcuts |
| `ExcelKeyboardShortcuts` | Shortcut definitions |
| `ConditionalFormattingEngine` | Conditional formatting rules |
| `CellProtectionEngine` | Cell locking/protection |
| `CellValidationEngine` | Cell data validation |
| `FormulaAutoCompleteEngine` | Formula bar autocomplete |
| `GroupOutlineEngine` | Row/column grouping |
| `DragFillEngine` | Drag-fill operations |
| `ChartAnnotationEngine` | Chart annotations |
| `DrillThroughEngine` | Drill-through navigation |
| `GridOfflineEngine` | Offline grid operations |

#### Utility Engines
| Engine | Purpose |
|--------|---------|
| `UndoRedoEngine` | Generic undo/redo state management |
| `FiscalCalendar` | Fiscal calendar (Standard, 4-4-5, 4-5-4, 13-period) |
| `ValidationEngine` | Data validation |
| `CustomFieldEngine` | User-defined custom fields |
| `TemplateEngine` | Budget/forecast templates |
| `TemplateLibrary` | Template library |
| `VersionControlEngine` | Version control for budgets |
| `PeriodCloseEngine` | Period close workflow |
| `AutoSaveEngine` | Auto-save |
| `CrashRecoveryEngine` | Crash recovery |
| `SessionEngine` | Session management |
| `WindowStateManager` | Window state persistence |
| `RecentFilesEngine` | Recent files |
| `PluginEngine` | Plugin architecture |
| `ConnectorEngine` | External data connectors |
| `BatchOperationEngine` | Bulk operations |
| `IncrementalCalcEngine` | Incremental calculations |
| `IterativeCalculationEngine` | Circular reference resolution |
| `SafeMathParser` | Safe math expression parser |
| `SignConventionEngine` | Sign convention handling |
| `ReconciliationEngine` | Account reconciliation |
| `ICMatchingEngine` | Intercompany matching |
| `IntercompanyMatchingEngine` | Intercompany transactions |
| `FinPlanFileEngine` | Native file format |
| `DashboardBuilderEngine` | Custom dashboard builder |
| `StateMachine` | Generic state machine |

### 6.2 Engine Registry (Lazy Loading)

The `EngineRegistry` class manages lazy loading of all 174 engines:

```typescript
class EngineRegistry {
  // Critical engines loaded at startup
  private static CRITICAL_ENGINES = [
    'FormulaEngine',
    'ThreeStatementEngine', 
    'CalculationGraph',
    'ConsolidationEngine',
    'ImportEngine',
  ];
  
  // All other engines loaded on-demand
  async load(engineId: string): Promise<EngineModule> {
    // Returns cached if already loaded
    // Deduplicates concurrent loads
    // Dynamic import for code splitting
  }
}
```

### 6.3 Formula Engine Details

The `FormulaEngine` supports Excel-like formulas:

**Supported Functions:**
- **Math:** SUM, ROUND, ABS, MIN, MAX, AVERAGE, COUNT, MOD, POWER, SQRT
- **Logical:** IF, AND, OR, NOT, SWITCH, IFS, TRUE, FALSE
- **Financial:** NPV, IRR, PMT, PV, FV, RATE, NPER, XNPV, XIRR, SLN, SYD, DDB
- **Statistical:** STDEV, VAR, PERCENTILE, MEDIAN, CORREL, FORECAST
- **Lookup:** VLOOKUP, HLOOKUP, INDEX, MATCH, CHOOSE
- **Text:** CONCAT, LEFT, RIGHT, MID, LEN, UPPER, LOWER, TRIM, SUBSTITUTE

**Circular Reference Handling:**
- `IterativeCalculationEngine` resolves circular references
- Configurable max iterations and convergence threshold
- `CircularReferenceWarning` component alerts users

---

## 7. Page Architecture (140+ Pages)

### 7.1 Page Organization

Pages are organized into 40+ directories by domain:

#### Core FP&A Pages (8 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | `DashboardPage` | Executive dashboard with KPIs, charts, activity feed |
| `/budgets` | `BudgetListPage` | List all budgets |
| `/budgets/create` | `BudgetCreatePage` | Create new budget |
| `/budgets/:id` | `BudgetDetailPage` | Edit budget with spreadsheet grid |
| `/budgets/bva` | `BudgetVAReport` | Budget vs Actual report |
| `/forecasts` | `ForecastListPage` | List all forecasts |
| `/forecasts/create` | `ForecastBuilderPage` | Create/edit forecast with drivers |
| `/forecasts/what-if` | `WhatIfPage` | What-if analysis sandbox |

#### Analysis Pages (6 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/scenarios` | `ScenarioListPage` | List all scenarios |
| `/scenarios/create` | `ScenarioBuilderPage` | Create/edit scenario |
| `/variance` | `VarianceDashboardPage` | Variance analysis dashboard |
| `/analytics` | `AnalyticsPage` | Analytics dashboard with charts |
| `/analytics/benchmarking` | `BenchmarkingPage` | Benchmarking analysis |
| `/analytics/goal-seek` | `GoalSeekPage` | Goal seek solver |

#### Data Management Pages (11 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/data` | `DataImportPage` | Import data from files |
| `/data/migration` | `MigrationPage` | Data migration wizard |
| `/data/chart-of-accounts` | `ChartOfAccountsPage` | Chart of accounts tree |
| `/data/gl-upload` | `GLUploadPage` | GL data upload |
| `/data/gl-explorer` | `GLExplorerPage` | GL account explorer |
| `/data/gl-trial-balance` | `GLTrialBalancePage` | Trial balance grid |
| `/data/gl-journals` | `GLJournalsPage` | Journal entries |
| `/data/gl-account-analysis` | `GLAccountAnalysisPage` | Account analysis |
| `/data/gl-reporting` | `GLReportingPage` | GL reporting |
| `/audit/trail` | `AuditTrailPage` | Audit trail log |
| `/ai` | `AIIntelligencePage` | AI-powered analysis |

#### Financial Operations Pages (14 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/consolidation` | `ConsolidationDashboard` | Multi-entity consolidation |
| `/consolidation/ic-eliminations` | `ICEliminationPage` | Intercompany eliminations |
| `/consolidation/ownership` | `OwnershipTreePage` | Ownership structure tree |
| `/currency/fx-rates` | `FXRatesPage` | Exchange rate management |
| `/currency/translation` | `TranslationResultPage` | Currency translation results |
| `/currency/hedging` | `HedgeManagementPage` | Hedge management |
| `/revenue/rev-rec` | `RevRecDashboard` | Revenue recognition (ASC 606) |
| `/revenue/deferred` | `DeferredSchedulePage` | Deferred revenue schedule |
| `/lease` | `LeaseDashboard` | Lease accounting (ASC 842) |
| `/lease/:id` | `LeaseDetailPage` | Lease detail |
| `/tax/provision` | `TaxProvisionPage` | Tax provision |
| `/tax/transfer-pricing` | `TransferPricingPage` | Transfer pricing |
| `/capex` | `CapExDashboard` | Capital expenditure |
| `/capex/depreciation` | `DepreciationForecastPage` | Depreciation forecast |

#### Cash & Treasury Pages (5 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/cash/forecast` | `CashForecastPage` | Cash flow forecast |
| `/cash/debt` | `DebtSchedulePage` | Debt schedule |
| `/cash/working-capital` | `WorkingCapitalPage` | Working capital analysis |
| `/treasury/investments` | `InvestmentPage` | Investment portfolio |
| `/treasury/fx-exposure` | `FXExposurePage` | FX exposure analysis |

#### Report Pages (10 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/reports` | `ReportsListPage` | List all reports |
| `/reports/profit-loss` | `ProfitLossPage` | Income statement |
| `/reports/balance-sheet` | `BalanceSheetPage` | Balance sheet |
| `/reports/cash-flow` | `CashFlowPage` | Cash flow statement |
| `/reports/three-statement` | `ThreeStatementDashboardPage` | Three-statement model |
| `/reports/budget-vs-actual` | `BudgetVsActualPage` | Budget vs actual |
| `/board-pack` | `BoardPackPage` | Board pack generator |
| `/templates` | `TemplateGalleryPage` | Template gallery |

#### Industry Pages (25+ pages)

**SaaS (3 pages):**
- `/saas/arr` — ARR Dashboard
- `/saas/cohort` — Cohort Analysis
- `/saas/churn` — Churn Dashboard

**Manufacturing (3 pages):**
- `/manufacturing/production` — Production Dashboard
- `/manufacturing/cogs` — COGS Variance
- `/manufacturing/inventory` — Inventory Management

**Retail (2 pages):**
- `/retail/stores` — Store Dashboard
- `/retail/promo` — Promo Analysis

**Banking (3 pages):**
- `/banking/nim` — NIM Dashboard
- `/banking/capital` — Capital Adequacy
- `/banking/loan-loss` — Loan Loss Reserves

**Healthcare (3 pages):**
- `/healthcare/dashboard` — Healthcare Dashboard
- `/healthcare/revenue` — Patient Revenue
- `/healthcare/clinical-trials` — Clinical Trial Costs

**Energy (5 pages):**
- `/energy/dashboard` — Energy Dashboard
- `/energy/production` — Energy Production
- `/energy/risk` — Energy Risk
- `/energy/renewable` — Renewable Energy
- `/energy/emissions` — Emissions Trading

**ESG (2 pages):**
- `/esg/carbon` — Carbon Dashboard
- `/esg/csrd` — CSRD Report

#### Workforce Pages (3 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/workforce/headcount` | `HeadcountPlanPage` | Headcount planning |
| `/workforce/compensation` | `CompModelingPage` | Compensation modeling |
| `/workforce/payroll` | `PayrollForecastPage` | Payroll forecast |

#### Utility Pages (6 pages)
| Route | Page | Purpose |
|-------|------|---------|
| `/collaboration` | `CollaborationPage` | Comments, tasks, activity |
| `/collaboration/approvals` | `ApprovalQueuePage` | Approval workflows |
| `/settings` | `SettingsPage` | Organization settings |
| `/settings/users` | `UserManagementPage` | User management |
| `/profile` | `ProfilePage` | User profile |
| `/help` | `HelpPage` | Help documentation |

### 7.2 Page Pattern

Every page follows this pattern:

```tsx
import { lazy } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/dashboard/KPICard';

export default function SomePage() {
  // 1. Get data from stores
  const { budgets, isLoading } = useBudgetStore();
  const { entries } = useGLStore();
  
  // 2. Calculate metrics (pure functions or engine calls)
  const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
  
  // 3. Render UI with components
  return (
    <div className="space-y-6">
      <h1>Page Title</h1>
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Budget" value={totalBudget} format="currency" />
      </div>
      <Card>
        <CardHeader>Content</CardHeader>
        <CardContent>{/* Page-specific content */}</CardContent>
      </Card>
    </div>
  );
}
```

---

## 8. Component System (150+ Components)

### 8.1 UI Primitives (103 components in `components/ui/`)

These are the building blocks used across all pages:

#### Layout & Structure
- `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`
- `Modal`, `SplitPane`, `Tabs`, `Breadcrumb`
- `EmptyState`, `ErrorState`, `LoadingScreen`, `Skeleton`
- `Progress`, `ProgressStepper`

#### Form Controls
- `Button`, `Input`, `Select`, `CurrencyInput`
- `FileDropZone`, `PeriodPicker`
- `DriverSlider` (for scenario planning)

#### Data Display
- `DataGrid`, `DataTable`, `FinancialTable`, `SpreadsheetGrid`
- `AccountTree`, `EntityTree`
- `Pagination`, `Badge`, `Avatar`

#### Charts & Visualizations
- `GaugeChart`, `Sparkline`, `Heatmap`, `WaterfallChart`, `WaterfallBridge`
- `TornadoChart`, `TreeMap`, `BulletChart`, `FunnelChart`, `GanttChart`
- `CalendarHeatmap`, `BoxPlotChart`, `SankeyChart`, `ScatterPlot`, `ComboChart`

#### Spreadsheet Components
- `FormulaBar`, `SheetTabs`, `ContextMenu`, `CellFormatter`
- `DragFill`, `ConditionalFormattingPanel`, `ConditionalFormattingRenderers`
- `CircularReferenceWarning`, `CellCommentPanel`

#### Workflow & Collaboration
- `ApprovalWorkflowDesigner`, `ApprovalQueue`, `ApprovalDashboard`
- `PresenceIndicator`, `ICMatchingDashboard`, `ICReconciliationReport`
- `ChatPanel`, `ChatMessage`, `ChatChart`

#### AI & Intelligence
- `NLQInput`, `GenerativeDashboard`

#### Accessibility
- `SkipToContent`, `FocusTrap`, `LiveRegion`, `VisuallyHidden`
- `KeyboardOverlay`, `KeyboardShortcuts`, `KeyboardShortcutProvider`
- `ShortcutHelpModal`

#### Utility
- `CommandPalette` (Ctrl+K), `GuidedTour`, `TourOverlay`
- `ExportMenu`, `SystemHealthMonitor`, `SaveStatusIndicator`
- `VersionDiffViewer`, `WhatIfSandbox`, `SandboxMode`
- `ErrorBoundary`, `AsyncErrorBoundary`, `PageErrorBoundary`
- `ErrorFallback`, `Toast`, `ToastContainer`

### 8.2 Domain Components

| Directory | Components | Purpose |
|-----------|------------|---------|
| `analytics/` | ChartWrapper, BenchmarkRadar, DataLineageViewer | Analytics visualizations |
| `budgets/` | BudgetGrid | Budget spreadsheet grid |
| `charts/` | GaugeChart, HeatmapChart, SparklineChart, TreemapChart, VarianceChart, WaterfallChart | Chart library |
| `dashboard/` | KPICard, KPICardEnhanced, ActivityFeed, HeatmapGrid, SankeyDiagram, TornadoChart, TrafficLightIndicator, DashboardTemplate | Dashboard widgets |
| `data/` | FileUploader, ColumnMapper, GLDropZone, GLTrialBalanceGrid, GLAccountDrillDown, GLColumnMapper, GLDataPreview, ImportPreview, FindReplaceDialog, financialGridConfig | Data import/management |
| `finance/` | ConsolidationTree, DriverPanel, FXPositionGrid, LeaseSchedule, RevRecSchedule, DepreciationProjection, CascadeRuleBuilder | Financial operations |
| `reports/` | ReportBuilder, ReportGrid, BoardPackBuilder, BoardPackGenerator, BoardPackTemplate, ExecutiveSummary, ExportDialog, FormulaBar, ReportScheduler, ReportBookBuilder, ReportTemplateLibrary, TemplateDesigner, ConditionalFormatPanel, FinancialStatementTemplates | Reporting |
| `saas/` | ChurnWaterfall, MRRBreakdown, SaaSCohortTable | SaaS metrics |
| `scenarios/` | DriverTreeView | Scenario planning |
| `construction/` | JobCostDashboard | Construction metrics |
| `manufacturing/` | ProductionDashboard | Manufacturing metrics |
| `insurance/` | UnderwritingDashboard | Insurance metrics |
| `realestate/` | PropertyDashboard | Real estate metrics |
| `retail/` | StoreDashboard | Retail metrics |
| `esg/` | ESGDashboard | ESG metrics |
| `treasury/` | CashForecastChart | Treasury charts |
| `workforce/` | HeadcountHeatmap | Workforce heatmaps |
| `variance/` | VarianceTable | Variance analysis |

---

## 9. Data Flow & How Everything Connects

### 9.1 Budget Creation Flow

```
1. User clicks "Create Budget" on BudgetListPage
   └──► Navigate to /budgets/create

2. BudgetCreatePage renders
   ├──► Reads entities from entityStore
   ├──► Reads accounts from dataStore
   └──► Shows form (React Hook Form + Zod validation)

3. User fills form and submits
   └──► budgetStore.createBudget(budgetData)
       ├──► Creates Budget object with ID
       ├──► Adds to budgets array (Immer draft)
       └──► Persists to IndexedDB via masterStorage

4. User navigates to /budgets/:id (BudgetDetailPage)
   ├──► budgetStore.setActiveBudget(id)
   ├──► Reads lineItems from budgetStore
   └──► Renders SpreadsheetGrid with line items

5. User edits a cell
   └──► budgetStore.updateLineItem(id, { amount: newValue })
       ├──► Validates amount (finite number)
       ├──► Updates lineItems array (Immer draft)
       ├──► Records lastChange for undo
       └──► Persists to IndexedDB

6. Formula recalculation
   └──► FormulaEngine.parseFormula('=SUM(A1:A10)')
       ├──► CalculationGraph determines dependencies
       ├──► Topological sort for recalculation order
       └──► Updates dependent cells
```

### 9.2 Data Import Flow

```
1. User uploads Excel file on DataImportPage
   └──► FileUploader component handles file selection

2. ExcelImportEngine.parseFile(file)
   ├──► Parses Excel/CSV using xlsx library
   ├──► Returns raw rows and columns
   └──► SmartImportMapper suggests column mappings

3. User confirms column mappings
   └──► ImportEngine.importData(mappings, data)
       ├──► Validates data types
       ├──► Creates GLEntry objects
       └──► glStore.setEntries(entries)

4. GL data available across app
   ├──► GLExplorerPage — browse entries
   ├──► GLTrialBalancePage — trial balance
   ├──► BudgetDetailPage — reference accounts
   └──► DashboardPage — KPI calculations

5. Cube store integration
   └──► cubeStore.writeCell(cube, coords, measure, value)
       └──► CubeEngine stores in multi-dimensional structure
```

### 9.3 Consolidation Flow

```
1. User navigates to /consolidation
   └──► ConsolidationDashboard renders

2. Entity data loaded from entityStore
   └──► Each entity has GL entries from glStore

3. ConsolidationEngine.consolidate(entities, ownership)
   ├──► For each entity:
   │   ├──► Translate to parent currency (FXEngine)
   │   ├──► Apply ownership percentage
   │   └──► Aggregate line items
   ├──► Eliminate intercompany transactions (ICMatchingEngine)
   ├──► Apply consolidation adjustments
   └──► Return consolidated financials

4. ICEliminationPage
   └──► ConsolidationEngine.eliminateIC(icPairs)
       ├──► Match receivables/payables
       ├──► Match revenue/expense
       └──► Generate elimination entries

5. OwnershipTreePage
   └──► Renders entity hierarchy tree
       └──► Shows ownership percentages and methods
```

### 9.4 Scenario Analysis Flow

```
1. User creates scenario on ScenarioBuilderPage
   └──► scenarioStore.createScenario(scenarioData)

2. User adjusts drivers
   └──► ScenarioEngine.calculateMetrics(entries, drivers)
       ├──► Adjust revenue by growth rate
       ├──► Adjust expenses by inflation
       ├──► Recalculate EBITDA, net income, cash flow
       └──► Return ScenarioMetrics

3. Monte Carlo simulation
   └──► MonteCarloEngine.simulate(distributions, iterations)
       ├──► Generate random samples (normal, uniform, triangular)
       ├──► Run scenario calculation for each iteration
       ├──► Calculate statistics (mean, std dev, percentiles)
       └──► Return SimulationResult[]

4. Sensitivity analysis
   └──► SensitivityEngine.analyze(inputs, output)
       ├──► Vary each input across range
       ├──► Calculate output for each variation
       └──► Return TornadoItem[] for tornado chart

5. Results displayed on ScenarioBuilderPage
   ├──► TornadoChart showing sensitivity
   ├──► Monte Carlo distribution chart
   └──► Scenario comparison grid
```

### 9.5 Report Generation Flow

```
1. User navigates to /reports/profit-loss
   └──► ProfitLossPage renders

2. ThreeStatementEngine.generateIncomeStatement(entries)
   ├──► Groups entries by account type
   ├──► Calculates revenue, COGS, gross profit, OpEx, EBITDA
   └──► Returns structured income statement

3. User clicks "Export"
   └──► ExportEngine.exportToPDF(data, config)
       ├──► Creates jsPDF document
       ├──► Adds header, title, date
       ├──► Generates table with autoTable
       ├──► Applies conditional formatting
       └──► Saves file

4. Board Pack generation
   └──► ReportBookEngine.generateBoardPack(reports)
       ├──► Aggregates multiple reports
       ├──► Adds executive summary
       ├──► Generates cover page
       └──► Exports as single PDF
```

---

## 10. Routing System

### 10.1 Route Configuration

All routes are defined in `App.tsx` using React Router v7:

```tsx
<Router>
  <ThemeProvider>
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes (inside AppLayout) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          
          {/* Route groups with shared ErrorBoundary + Suspense */}
          <Route element={<RouteGroupWrapper />}>
            <Route path="/budgets" element={<BudgetListPage />} />
            <Route path="/budgets/create" element={<BudgetCreatePage />} />
            {/* ... more routes */}
          </Route>
        </Route>
      </Routes>
    </Suspense>
  </ThemeProvider>
</Router>
```

### 10.2 Lazy Loading

Every page is lazy-loaded:

```tsx
const BudgetListPage = lazy(() => import('./pages/budgets/BudgetListPage'));
```

This means each page's code is only downloaded when the user navigates to it.

### 10.3 Route Groups

Routes are grouped logically:
1. **Core Modules** — budgets, forecasts, scenarios, variance, analytics, AI
2. **Data & GL** — data import, GL pages, audit trail
3. **Financial Operations** — consolidation, currency, revenue, lease, tax, capex
4. **Cash & Treasury** — cash forecast, debt, working capital, investments
5. **Reports** — P&L, balance sheet, cash flow, three-statement, board pack
6. **Industry & Workforce** — SaaS, manufacturing, retail, banking, healthcare, energy, ESG
7. **Utility** — collaboration, approvals, settings, profile, help

---

## 11. Persistence & Storage

### 11.1 Master Storage Abstraction

The `masterStorage` utility provides a unified storage interface:

```typescript
export const masterStorage: PersistStorage<any> = {
  getItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return tauriSqlStorage.getItem(name);  // SQLite on desktop
    }
    return indexedDBStorage.getItem(name);    // IndexedDB on web
  },
  setItem: async (name, value) => {
    // Same pattern — routes to correct storage
  },
  removeItem: async (name) => {
    // Same pattern
  },
};
```

### 11.2 Storage Layers

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Web Browser** | IndexedDB | Primary storage for web app |
| **Desktop (Tauri)** | SQLite | Primary storage for desktop app |
| **Offline Cache** | `offlineCache.ts` | Offline-first caching with sync |
| **Store Cache** | `storeCache.ts` | In-memory cache for store queries |
| **Session Storage** | Zustand (in-memory) | Transient UI state |

### 11.3 Persistence Configuration

Each store declares what to persist:

```typescript
persist(
  immer((set, get) => ({ /* state */ })),
  {
    name: 'budget-store',        // Storage key
    storage: masterStorage,       // IndexedDB or SQLite
    partialize: (state) => ({     // Only persist certain fields
      budgets: state.budgets,
      lineItems: state.lineItems,
    }),
  }
)
```

### 11.4 Backup & Restore

The `backupRestore.ts` utility provides:
- Export all store data as JSON
- Import JSON to restore state
- Version migration for schema changes

---

## 12. Industry Sectors (15 Sectors)

### 12.1 Sector Configuration

Each sector has a configuration file defining:

```typescript
interface SectorConfig {
  id: string;                    // e.g., 'banking'
  name: string;                  // e.g., 'Banking & Financial Services'
  description: string;
  defaultKPIs: SectorKPI[];      // 5+ KPIs per sector
  enabledModules: string[];       // Which features to show
  sidebarOrder: string[];         // Navigation order
  defaultCurrency: string;        // e.g., 'USD'
}
```

### 12.2 All 15 Sectors

| Sector | Config | KPIs | Modules |
|--------|--------|------|---------|
| **Technology** | `technology.ts` | ARR, MRR, Churn, LTV:CAC, Burn Rate | SaaS metrics, forecasting |
| **Manufacturing** | `manufacturing.ts` | OEE, Yield, Scrap Rate, Cycle Time | COGS, inventory, production |
| **Retail** | `retail.ts` | GMROI, Sell-Through, Inventory Turnover | Store performance, promo |
| **Banking** | `banking.ts` | NIM, ROA, ROE, Capital Adequacy | Loan loss, credit risk |
| **Healthcare** | `healthcare.ts` | Patient Revenue, Cost per Case, Occupancy | Clinical trials, VBC |
| **Energy** | `energy.ts` | Production Volume, Reserve Life, Emissions | Renewable, risk |
| **Real Estate** | `realestate.ts` | NOI, Cap Rate, DSCR, Occupancy | Property, valuation |
| **Construction** | `construction.ts` | Job Cost, EVM, Change Order % | Equipment, project costing |
| **Insurance** | `insurance.ts` | Loss Ratio, Combined Ratio, Rate Adequacy | Underwriting, claims |
| **Telecom** | `telecom.ts` | ARPU, Churn, Network Utilization | Subscriber, revenue |
| **Logistics** | `logistics.ts` | Fleet Utilization, On-Time Delivery, Cost per Mile | Route optimization |
| **Hospitality** | `hospitality.ts` | RevPAR, ADR, Occupancy Rate | Revenue management |
| **Government** | `government.ts` | Budget Variance, Fund Balance, Compliance | Grant management |
| **Education** | `education.ts` | Enrollment, Cost per Student, Graduation Rate | Fund management |
| **Agriculture** | `agriculture.ts` | Yield per Acre, Cost per Bushel, Crop Rotation | Seasonal planning |

### 12.3 Sector Switching

Users can switch sectors via Settings. The active sector determines:
- Which KPIs appear on the dashboard
- Which navigation items are visible
- Which industry-specific pages are accessible
- Default currency and formatting

---

## 13. Internationalization (8 Languages)

### 13.1 Supported Languages

| Language | Code | Direction |
|----------|------|-----------|
| English | `en` | LTR |
| Spanish | `es` | LTR |
| French | `fr` | LTR |
| German | `de` | LTR |
| Japanese | `ja` | LTR |
| Chinese | `zh` | LTR |
| Arabic | `ar` | RTL |
| Portuguese | `pt` | LTR |

### 13.2 i18n Implementation

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)      // Auto-detect from browser
  .use(initReactI18next)      // React bindings
  .init({
    resources,                 // 8 language files
    fallbackLng: 'en',         // Fallback to English
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });
```

### 13.3 RTL Support

Arabic is fully supported with RTL layout:

```tsx
// AppLayout.tsx
const dir = getLocaleDirection(i18n.language);
<div dir={dir}> {/* RTL or LTR */}</div>
```

---

## 14. Accessibility System

### 14.1 WCAG 2.1 AA Compliance

- **Skip Navigation:** Skip-to-content links on every page
- **Focus Management:** `useFocusManagement` hook manages focus flow
- **Focus Restore:** `useFocusRestore` restores focus after modal close
- **Screen Reader:** `useAnnounce` hook for live region announcements
- **Reduced Motion:** `useReducedMotion` respects `prefers-reduced-motion`
- **Keyboard Navigation:** All interactive elements keyboard accessible
- **ARIA Labels:** Proper `aria-label`, `aria-haspopup`, `aria-expanded`
- **Color Contrast:** Minimum 4.5:1 for text, 3:1 for large text

### 14.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+/` | Open command palette |
| `Ctrl+1` | Navigate to Dashboard |
| `Ctrl+2` | Navigate to Budgets |
| `Ctrl+3` | Navigate to Forecasts |
| `Ctrl+4` | Navigate to Scenarios |
| `Ctrl+5` | Navigate to Reports |
| `Ctrl+6` | Navigate to Consolidation |
| `Escape` | Close modals/dropdowns |

### 14.3 Keyboard Overlay

The `KeyboardOverlay` component shows available shortcuts for the current context.

---

## 15. Security Architecture

### 15.1 Authentication

- JWT-based authentication
- Access tokens stored in memory (not localStorage)
- Token refresh handled by axios interceptor
- MFA support (`mfaEnabled` flag)

### 15.2 Role-Based Access Control (RBAC)

Five roles with specific permissions:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access — all CRUD, user management, settings, audit, encryption |
| **FP&A Manager** | Budget/forecast/scenario CRUD + approve, reports, read GL/entity |
| **Analyst** | Budget/forecast/scenario CRUD, reports, read GL/entity |
| **Department Head** | Read budgets/forecasts/scenarios/reports, create budgets |
| **Viewer** | Read-only access to budgets/forecasts/scenarios/reports |

### 15.3 Security Utilities

| Utility | Purpose |
|---------|---------|
| `encryption.ts` | Data encryption at rest |
| `security.ts` | Security utilities |
| `securityHeaders.ts` | HTTP security headers |
| `tokenRotation.ts` | JWT token rotation |
| `validation.ts` | Input validation |
| `RBACEngine` | Role-based access control |
| `DataMaskingEngine` | Mask sensitive data |
| `DataClassificationEngine` | Classify data sensitivity |
| `SOXComplianceEngine` | SOX compliance checks |

### 15.4 Security Headers (Vite Config)

```typescript
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
}
```

---

## 16. Performance Architecture

### 16.1 Code Splitting

- **Lazy Loading:** All 140+ pages are lazy-loaded via `React.lazy()`
- **Manual Chunks:** Vendor libraries split into separate chunks:
  - `react-vendor` — React, React DOM, React Router
  - `chart-vendor` — Recharts
  - `grid-vendor` — AG Grid
  - `form-vendor` — React Hook Form, Zod
  - `state-vendor` — Zustand
  - `ai-vendor` — HuggingFace Transformers

### 16.2 Web Workers

Heavy computations offloaded to Web Workers:

| Worker | Purpose |
|--------|---------|
| `WorkerPool.ts` | Manages worker pool (min 2, max 4 threads) |
| `batch-calc.worker.ts` | Batch calculations |
| `consolidation.worker.ts` | Multi-entity consolidation |
| `monte-carlo.worker.ts` | Monte Carlo simulation |
| `formulaWorker.ts` | Formula evaluation |
| `exportWorker.ts` | Export generation |
| `scenarioWorker.ts` | Scenario calculations |

### 16.3 Performance Utilities

| Utility | Purpose |
|---------|---------|
| `performance.ts` | Performance measurement |
| `performanceMonitor.ts` | Runtime performance monitoring |
| `performanceBudget.ts` | Performance budget enforcement |
| `memoryMonitor.ts` | Memory usage monitoring |
| `bundleAnalyzer.ts` | Bundle size analysis |
| `memoization.ts` | Memoization utilities |
| `storeCache.ts` | Store query caching |
| `QueryCache.ts` | OLAP query caching |
| `persistenceDebouncer.ts` | Debounced persistence |
| `IncrementalCalcEngine` | Incremental recalculation |
| `routePreloader.ts` | Route-based preloading |

### 16.4 Virtual Scrolling

`@tanstack/react-virtual` is used for large data grids to only render visible rows.

### 16.5 PWA & Offline

- Service Worker via Workbox
- Runtime caching for fonts, images, static assets
- Offline-first architecture via `offlineCache.ts`
- `useOffline` hook detects online/offline status

---

## 17. Testing Architecture

### 17.1 Test Statistics

- **473 test files** total
- **Unit tests:** Vitest with jsdom
- **Component tests:** @testing-library/react
- **E2E tests:** Playwright

### 17.2 Test Organization

Tests are colocated with source files:

```
src/store/budgetStore.ts
src/store/budgetStore.test.ts    ← Same directory

src/engines/FormulaEngine.ts
src/engines/FormulaEngine.test.ts

src/pages/budgets/BudgetListPage.tsx
src/pages/budgets/BudgetListPage.test.tsx
```

### 17.3 Test Configuration

```typescript
// vite.config.ts
test: {
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  environment: 'jsdom',
  pool: 'threads',           // Thread pool for parallel tests
  maxThreads: 4,
  minThreads: 2,
  testTimeout: 30000,
  setupFiles: ['./src/test/setup.ts'],
}
```

### 17.4 Smoke Tests

Comprehensive smoke tests verify all pages render without errors:
- `smoke-all-pages.test.tsx`
- `smoke-banking-bonds-credit-data.test.tsx`
- `smoke-data-pages.test.tsx`
- `smoke-energy-esg.test.tsx`
- `smoke-five-pages.test.tsx`
- `smoke-new-sectors.test.tsx`
- `smoke-pages.test.tsx`
- `smoke-reports-retail-saas-1.test.tsx`
- `smoke-retail-saas.test.tsx`
- `smoke-sector-scenarios-settings.test.tsx`
- `smoke-sectors.test.tsx`
- `smoke-sector-subpages.test.tsx`
- `smoke-tax-telecom-treasury-workforce.test.tsx`
- `smoke-uncovered-pages.test.tsx`

---

## 18. Desktop App (Tauri)

### 18.1 Hybrid Architecture

FinPlan Pro runs as both:
1. **Web App** — Vite dev server or static build
2. **Desktop App** — Tauri wrapper with Rust backend

### 18.2 Tauri-Specific Features

| Feature | Implementation |
|---------|----------------|
| **SQLite Storage** | `tauriSqlStorage.ts` — replaces IndexedDB on desktop |
| **Native Menus** | `useTauriMenu.ts` hook |
| **Window State** | `WindowStateManager.ts` persists window position/size |
| **Global Shortcuts** | System-wide keyboard shortcuts |
| **File Associations** | `.finplan` file format |

### 18.3 Storage Routing

The `masterStorage` automatically routes to the correct storage backend:

```typescript
if (isDesktop) {
  return tauriSqlStorage.getItem(name);  // SQLite
} else {
  return indexedDBStorage.getItem(name);  // IndexedDB
}
```

---

## 19. Plugin Architecture

### 19.1 Plugin Types

Defined in `src/types/plugin.ts`:

```typescript
interface Plugin {
  manifest: PluginManifest;
  formulaSpecs?: FormulaSpec[];
  reportTemplates?: ReportTemplate[];
  importConnectors?: ImportConnector[];
  exportFormats?: ExportFormat[];
  dashboardWidgets?: DashboardWidget[];
  workflowRules?: WorkflowRule[];
}
```

### 19.2 Plugin Capabilities

| Capability | Purpose |
|------------|---------|
| `FormulaSpec` | Custom formula functions |
| `ReportTemplate` | Custom report templates |
| `ImportConnector` | Custom data source connectors |
| `ExportFormat` | Custom export formats |
| `DashboardWidget` | Custom dashboard widgets |
| `WorkflowRule` | Custom workflow automation |

### 19.3 Plugin Engine

The `PluginEngine` manages plugin lifecycle:
- Registration
- Activation/Deactivation
- API exposure
- Error isolation (`PluginErrorBoundary`)

---

## 20. Real-Time Collaboration

### 20.1 Collaboration Components

| Component | Purpose |
|-----------|---------|
| `WebSocketManager` | WebSocket connection management |
| `ChangeBroadcaster` | Broadcast data changes to other users |
| `PresenceService` | Track who is online and where |
| `RealtimeCollaborationManager` | Coordinate real-time editing |
| `PresenceIndicator` | Show who is viewing/editing |
| `SyncEngine` | Synchronize offline changes |

### 20.2 Collaboration Features

- **Comments:** Cell-level comments with mentions and replies
- **Tasks:** Assign tasks with due dates and priorities
- **Approvals:** Multi-step approval workflows
- **Activity Log:** Track all changes with user attribution
- **Presence:** See who is viewing/editing in real-time

---

## 21. External Integrations

### 21.1 API Connectors

Located in `src/services/api-integration/`:

| Connector | Purpose |
|-----------|---------|
| `BaseConnector` | Abstract base for all connectors |
| `ConnectorRegistry` | Registry of available connectors |
| `RestApiClient` | Generic REST API client |
| `QuickBooksConnector` | QuickBooks Online integration |
| `XeroConnector` | Xero accounting integration |

### 21.2 Mock Data

19 mock data files for development:

```
src/services/mockData/
├── accounts.ts
├── activity.ts
├── analytics.ts
├── budgets.ts
├── cellAuditEntries.ts
├── collaboration.ts
├── data.ts
├── departments.ts
├── entities.ts
├── exchangeRates.ts
├── forecasts.ts
├── generators.ts
├── glData.ts
├── index.ts
├── notifications.ts
├── reports.ts
├── scenarios.ts
├── settings.ts
├── users.ts
└── variances.ts
```

---

## 22. Complete Route Map

### Public Routes
| Path | Page |
|------|------|
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/forgot-password` | ForgotPasswordPage |
| `/onboarding` | OnboardingWizard |

### Protected Routes (inside AppLayout)

#### Core FP&A
| Path | Page |
|------|------|
| `/` | DashboardPage |
| `/dashboard` | DashboardPage |
| `/budgets` | BudgetListPage |
| `/budgets/create` | BudgetCreatePage |
| `/budgets/bva` | BudgetVAReport |
| `/budgets/:id` | BudgetDetailPage |
| `/forecasts` | ForecastListPage |
| `/forecasts/create` | ForecastBuilderPage |
| `/forecasts/:id` | ForecastBuilderPage |
| `/forecasts/what-if` | WhatIfPage |
| `/scenarios` | ScenarioListPage |
| `/scenarios/create` | ScenarioBuilderPage |
| `/scenarios/:id` | ScenarioBuilderPage |
| `/variance` | VarianceDashboardPage |
| `/analytics` | AnalyticsPage |
| `/analytics/benchmarking` | BenchmarkingPage |
| `/analytics/goal-seek` | GoalSeekPage |
| `/ai` | AIIntelligencePage |

#### Data & GL
| Path | Page |
|------|------|
| `/data` | DataImportPage |
| `/data/migration` | MigrationPage |
| `/data/chart-of-accounts` | ChartOfAccountsPage |
| `/data/gl-upload` | GLUploadPage |
| `/data/gl-explorer` | GLExplorerPage |
| `/data/gl-trial-balance` | GLTrialBalancePage |
| `/data/gl-journals` | GLJournalsPage |
| `/data/gl-account-analysis` | GLAccountAnalysisPage |
| `/data/gl-reporting` | GLReportingPage |
| `/audit/trail` | AuditTrailPage |

#### Financial Operations
| Path | Page |
|------|------|
| `/consolidation` | ConsolidationDashboard |
| `/consolidation/ic-eliminations` | ICEliminationPage |
| `/consolidation/ownership` | OwnershipTreePage |
| `/currency/fx-rates` | FXRatesPage |
| `/currency/translation` | TranslationResultPage |
| `/currency/hedging` | HedgeManagementPage |
| `/revenue/rev-rec` | RevRecDashboard |
| `/revenue/deferred` | DeferredSchedulePage |
| `/lease` | LeaseDashboard |
| `/lease/:id` | LeaseDetailPage |
| `/tax/provision` | TaxProvisionPage |
| `/tax/transfer-pricing` | TransferPricingPage |
| `/capex` | CapExDashboard |
| `/capex/depreciation` | DepreciationForecastPage |

#### Cash & Treasury
| Path | Page |
|------|------|
| `/cash/forecast` | CashForecastPage |
| `/cash/debt` | DebtSchedulePage |
| `/cash/working-capital` | WorkingCapitalPage |
| `/treasury/investments` | InvestmentPage |
| `/treasury/fx-exposure` | FXExposurePage |

#### Reports
| Path | Page |
|------|------|
| `/reports` | ReportsListPage |
| `/reports/profit-loss` | ProfitLossPage |
| `/reports/balance-sheet` | BalanceSheetPage |
| `/reports/cash-flow` | CashFlowPage |
| `/reports/three-statement` | ThreeStatementDashboardPage |
| `/reports/budget-vs-actual` | BudgetVsActualPage |
| `/board-pack` | BoardPackPage |
| `/templates` | TemplateGalleryPage |

#### Industry
| Path | Page |
|------|------|
| `/workforce/headcount` | HeadcountPlanPage |
| `/workforce/compensation` | CompModelingPage |
| `/workforce/payroll` | PayrollForecastPage |
| `/saas/arr` | ARRDashboard |
| `/saas/cohort` | CohortAnalysisPage |
| `/saas/churn` | ChurnDashboard |
| `/manufacturing/production` | ProductionDashboardPage |
| `/manufacturing/cogs` | COGSVariancePage |
| `/manufacturing/inventory` | InventoryPage |
| `/retail/stores` | StoreDashboardPage |
| `/retail/promo` | PromoAnalysisPage |
| `/banking/nim` | NIMDashboardPage |
| `/banking/capital` | CapitalAdequacyPage |
| `/banking/loan-loss` | LoanLossPage |
| `/healthcare/dashboard` | HealthcareDashboardPage |
| `/healthcare/revenue` | PatientRevenuePage |
| `/healthcare/clinical-trials` | ClinicalTrialCostPage |
| `/energy/dashboard` | EnergyDashboardPage |
| `/energy/production` | EnergyProductionDashboard |
| `/energy/risk` | EnergyRiskPage |
| `/energy/renewable` | RenewableEnergyPage |
| `/energy/emissions` | EmissionsTradingPage |
| `/esg/carbon` | CarbonDashboardPage |
| `/esg/csrd` | CSRDReportPage |

#### Utility
| Path | Page |
|------|------|
| `/collaboration` | CollaborationPage |
| `/collaboration/approvals` | ApprovalQueuePage |
| `/settings` | SettingsPage |
| `/settings/users` | UserManagementPage |
| `/profile` | ProfilePage |
| `/help` | HelpPage |
| `*` | NotFoundPage |

---

## 23. Store-to-Engine-to-Page Wiring

### 23.1 Complete Wiring Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ STORE                    ENGINE                   PAGE              │
├─────────────────────────────────────────────────────────────────────┤
│ authStore ────────────── RBACEngine ───────────── LoginPage          │
│                          SessionEngine            ProfilePage        │
│                          TokenRotation                              │
├─────────────────────────────────────────────────────────────────────┤
│ budgetStore ──────────── FormulaEngine ────────── BudgetListPage     │
│                          CalculationGraph          BudgetCreatePage   │
│                          AllocationEngine          BudgetDetailPage   │
│                          ValidationEngine          BudgetVAReport     │
│                          UndoRedoEngine                              │
├─────────────────────────────────────────────────────────────────────┤
│ forecastStore ────────── RollingForecastEngine ── ForecastListPage   │
│                          DriverCascadeEngine       ForecastBuilderPage│
│                          DriverLibrary             WhatIfPage         │
│                          SpreadEngine                                │
├─────────────────────────────────────────────────────────────────────┤
│ scenarioStore ────────── ScenarioEngine ───────── ScenarioListPage   │
│                          MonteCarloEngine          ScenarioBuilderPage│
│                          SensitivityEngine                           │
│                          WhatIfSandboxEngine                         │
├─────────────────────────────────────────────────────────────────────┤
│ varianceStore ────────── VarianceDecomposition ── VarianceDashboard  │
│                          AutoCommentaryEngine                        │
│                          AnomalyDetectionEngine                      │
├─────────────────────────────────────────────────────────────────────┤
│ glStore ──────────────── ImportEngine ─────────── GLUploadPage       │
│                          ExcelImportEngine         GLExplorerPage     │
│                          SmartImportMapper         GLTrialBalancePage │
│                          StreamImportEngine        GLJournalsPage     │
│                          DataQualityEngine         GLAccountAnalysis  │
│                          UndoRedoEngine            GLReportingPage    │
├─────────────────────────────────────────────────────────────────────┤
│ reportStore ──────────── ThreeStatementEngine ─── ProfitLossPage     │
│                          ReportBuilderEngine       BalanceSheetPage   │
│                          ExportEngine              CashFlowPage       │
│                          ProfessionalExportEngine  ThreeStatementPage │
│                          ReportBookEngine          BoardPackPage      │
│                          ReportSchedulerEngine     ReportsListPage    │
├─────────────────────────────────────────────────────────────────────┤
│ analyticsStore ───────── DataLineageEngine ────── AnalyticsPage      │
│                          BenchmarkingEngine        BenchmarkingPage   │
│                          GoalSeekEngine            GoalSeekPage       │
│                          AIEngine                  AIIntelligencePage │
├─────────────────────────────────────────────────────────────────────┤
│ cubeStore ────────────── CubeEngine ───────────── (used by all       │
│                          AdvancedOLAPEngine         grid pages)       │
│                          MDXEngine                                    │
│                          PivotTableEngine                             │
│                          CubeSecurityEngine                           │
├─────────────────────────────────────────────────────────────────────┤
│ entityStore ──────────── ConsolidationEngine ──── ConsolidationDash  │
│                          MultiCurrencyEngine       ICEliminationPage  │
│                          FXEngine                  OwnershipTreePage  │
│                          ICMatchingEngine          FXRatesPage        │
├─────────────────────────────────────────────────────────────────────┤
│ driverStore ──────────── DriverCascadeEngine ──── DriverPlanningPage │
│                          AssumptionEngine          DriverTreeView     │
├─────────────────────────────────────────────────────────────────────┤
│ collaborationStore ───── CellCommentEngine ────── CollaborationPage  │
│                          WorkflowEngine            ApprovalQueuePage  │
│                          SyncEngine                                  │
│                          DocumentEngine                              │
├─────────────────────────────────────────────────────────────────────┤
│ settingsStore ────────── FiscalCalendar ───────── SettingsPage       │
│                          TemplateEngine            UserManagementPage │
│                          EncryptionEngine          SecuritySettings   │
├─────────────────────────────────────────────────────────────────────┤
│ constructionStore ────── ConstructionEngine ───── ConstructionDash   │
│                                                  ProjectCostingPage   │
│                                                  EquipmentManagement │
├─────────────────────────────────────────────────────────────────────┤
│ energyStore ──────────── EnergyEngine ─────────── EnergyDashboard    │
│                          ESGEngine                 EnergyProduction   │
│                                                  EnergyRiskPage      │
│                                                  RenewableEnergyPage │
│                                                  EmissionsTrading    │
├─────────────────────────────────────────────────────────────────────┤
│ healthcareStore ──────── HealthcareEngine ─────── HealthcareDash     │
│                                                  PatientRevenuePage  │
│                                                  ClinicalTrialCost   │
├─────────────────────────────────────────────────────────────────────┤
│ insuranceStore ───────── InsuranceEngine ──────── InsuranceDashboard │
│                                                  UnderwritingPage    │
│                                                  ClaimsAnalytics     │
├─────────────────────────────────────────────────────────────────────┤
│ realEstateStore ──────── RealEstateEngine ─────── RealEstateDashboard│
│                                                  PropertyPortfolio   │
│                                                  FacilityManagement  │
│                                                  REITDashboard       │
│                                                  ValuationPage       │
└─────────────────────────────────────────────────────────────────────┘
```

### 23.2 Industry-Specific Wiring

```
SaaS:
  SaaSMetricsEngine → ARRDashboard, CohortAnalysisPage, ChurnDashboard
  Components: MRRBreakdown, ChurnWaterfall, SaaSCohortTable

Manufacturing:
  ManufacturingEngine → ProductionDashboardPage, COGSVariancePage, InventoryPage
  COGSVarianceEngine → COGSVariancePage
  InventoryEngine → InventoryPage
  Components: ProductionDashboard

Retail:
  RetailEngine → StoreDashboardPage, PromoAnalysisPage
  Components: StoreDashboard

Banking:
  BankingEngine → NIMDashboardPage, CapitalAdequacyPage, LoanLossPage

Healthcare:
  HealthcareEngine → HealthcareDashboardPage, PatientRevenuePage, ClinicalTrialCostPage

Energy:
  EnergyEngine → EnergyDashboardPage, EnergyProductionDashboard, EnergyRiskPage, RenewableEnergyPage, EmissionsTradingPage
  ESGEngine → CarbonDashboardPage, CSRDReportPage
```

---

## 24. File Counts & Metrics

| Category | Count |
|----------|-------|
| **Total TypeScript files** | 1,190 |
| **Engine source files** | 174 |
| **Page components** | 140+ |
| **UI components** | 103 |
| **Domain components** | 50+ |
| **Zustand stores** | 24 |
| **Custom hooks** | 30 |
| **Utility modules** | 36 |
| **Test files** | 473 |
| **Mock data files** | 19 |
| **Sector configurations** | 15 |
| **Languages** | 8 |
| **Web Workers** | 7 |
| **Route paths** | 80+ |
| **Dependencies** | 40+ |
| **Dev dependencies** | 15+ |

### Build Output
- **Bundle size:** ~293KB (92KB gzip)
- **Build tool:** Vite 7.3.2
- **Chunk splitting:** 6 vendor chunks + page chunks

---

## Appendix A: How to Run

```bash
# Development
npm run dev          # Starts Vite dev server on port 5173

# Build
npm run build        # Production build

# Test
npm run test         # Run all unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:e2e     # E2E tests (Playwright)

# Desktop (Tauri)
npm run tauri:dev    # Development with hot reload
npm run tauri:build  # Build native desktop app

# Lint & Format
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
```

## Appendix B: Key Architectural Decisions

1. **Offline-First:** All data persists to IndexedDB (web) or SQLite (desktop). No backend server required.
2. **Pure Engines:** All calculation engines are pure TypeScript classes with static methods. No side effects, highly testable.
3. **Store Separation:** 24 granular Zustand stores prevent unnecessary re-renders and enable independent persistence.
4. **Lazy Everything:** Pages, engines, and AI models are all lazy-loaded for fast initial load.
5. **Web Workers:** Heavy computations (consolidation, Monte Carlo, formulas) run in separate threads.
6. **Immer Drafts:** All state updates use Immer for clean, immutable-looking mutable code.
7. **Master Storage:** Single storage abstraction routes to IndexedDB or SQLite based on runtime environment.
8. **Sector System:** 15 industry configurations allow the same codebase to serve different financial domains.
9. **Plugin Architecture:** Extensible via plugins for custom formulas, templates, connectors, and widgets.
10. **RBAC:** Five-role permission system enforced at both UI and engine levels.

---

*Document generated from codebase analysis — 1,190 TypeScript files, 174 engines, 140+ pages, 24 stores, 150+ components.*
