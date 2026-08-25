# FinPlan Pro — Complete Project Specification

> **Purpose:** This document is SO detailed that someone could replicate the entire project from it.
> **Generated:** 2026-05-20
> **Build Status:** PASS (Vite)
> **Test Status:** 5990+ tests pass

---

## 1. Project Overview

### What is FinPlan Pro?

FinPlan Pro is an **offline-first desktop FP&A (Financial Planning & Analysis)** application built with Tauri 2. It is a comprehensive financial planning tool that includes budgeting, forecasting, scenario planning, financial reporting, multi-entity consolidation, and 129 specialized financial engines.

### Tech Stack

| Technology   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| React        | 19.x    | UI framework            |
| TypeScript   | 5.9.x   | Type safety             |
| Vite         | 7.x     | Build tool + dev server |
| Zustand      | 5.x     | State management        |
| Immer        | 10.x    | Immutable state updates |
| AG Grid      | 35.x    | Data grids              |
| Recharts     | 2.x     | Charts                  |
| Tailwind CSS | 4.x     | Styling                 |
| Tauri        | 2.x     | Desktop shell           |
| Vitest       | 3.x     | Testing                 |
| Radix UI     | various | UI primitives           |
| Lucide React | latest  | Icons                   |

### Unique Advantages (No Competitor Has These)

1. **Offline-first** — Tauri + IndexedDB, no cloud dependency
2. **Desktop app** — Native speed, file system access
3. **One-time price** — $0 vs $20K-$100K+/yr for competitors
4. **129 engines** — 4.6x more than Anaplan (#1 competitor)
5. **Plugin system** — Extensible architecture
6. **WCAG 2.1 AA** — Full accessibility compliance
7. **16 sectors** — Industry-specific configurations
8. **Keyboard shortcuts** — Full keyboard navigation
9. **ESG reporting** — Built-in environmental/social/governance

---

## 2. Architecture

### Directory Structure

```
src/
├── App.tsx                    # Main app with router
├── main.tsx                   # Entry point
├── index.css                  # Global styles
├── vite-env.d.ts              # Vite type declarations
├── components/                # Reusable components
│   ├── auth/                  # Auth components (ProtectedRoute)
│   ├── charts/                # 8 chart components
│   ├── data/                  # Data components (ColumnMapper, ImportPreview, DataTable)
│   ├── layout/                # Layout components (Sidebar, Header)
│   └── ui/                    # UI primitives (Button, Card, Input, Modal, etc.)
├── config/                    # Configuration
│   ├── sectors/               # 16 sector configs
│   ├── templates/             # Template definitions
│   └── keyboardShortcuts.ts   # Keyboard shortcut config
├── engines/                   # 129 business logic engines
│   ├── formula-functions/     # 7 formula modules (245+ functions)
│   └── *.ts                   # Individual engines
├── hooks/                     # 27 custom React hooks
├── pages/                     # 140 page components
│   ├── auth/                  # Login, Register, ForgotPassword, Onboarding
│   ├── budgets/               # Budget CRUD, VA Report
│   ├── forecasts/             # Forecast, Rolling, WhatIf, Driver
│   ├── scenarios/             # Scenario builder/list
│   ├── reports/               # P&L, BS, CF, 3-Statement, Board Pack
│   ├── consolidation/         # Multi-entity, IC elimination
│   ├── currency/              # FX rates, hedging
│   ├── sector/                # 8 sector dashboards
│   └── ... (30+ domains)
├── plugins/                   # Plugin system (8 files)
├── services/                  # API services
├── store/                     # 22 Zustand stores
├── test/                      # Test utilities
├── types/                     # TypeScript type definitions
├── utils/                     # 41 utility functions
└── workers/                   # Web Workers
```

### State Management Pattern

All stores follow the canonical Zustand pattern:

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useStore = create<State>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // state
        items: [],
        // actions
        addItem: (item) =>
          set((state) => {
            state.items.push(item);
          }),
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

### Engine Pattern

Engines are pure functions with static methods:

```typescript
export class SomeEngine {
  static calculate(input: InputType): ResultType {
    // pure calculation, no side effects
    return { value: result, error: undefined };
  }
}
```

---

## 3. Complete Engine List (129 engines)

### Financial Engines

| Engine                         | Lines | Purpose                                |
| ------------------------------ | ----- | -------------------------------------- |
| FormulaEngine.ts               | 488   | Formula parser + evaluator             |
| FormulaFunctionRegistry.ts     | 321   | Registry for 245+ functions            |
| ThreeStatementEngine.ts        | 1076  | P&L + BS + CF with auto-linking        |
| ConsolidationEngine.ts         | 966   | Multi-entity consolidation (ASC 810)   |
| FXEngine.ts                    | ~400  | Currency exchange, ASC 830 translation |
| MultiCurrencyEngine.ts         | ~300  | Multi-currency support                 |
| BudgetCollectionEngine.ts      | ~200  | Budget collection workflow             |
| RollingForecastEngine.ts       | 198   | Rolling forecast calculations          |
| ScenarioEngine.ts              | ~300  | Scenario planning                      |
| WhatIfSandboxEngine.ts         | 232   | What-if analysis                       |
| SensitivityEngine.ts           | ~200  | Sensitivity analysis                   |
| MonteCarloEngine.ts            | 232   | Monte Carlo simulation                 |
| DriverCascadeEngine.ts         | 265   | Driver-based planning                  |
| VarianceDecompositionEngine.ts | ~200  | Price/volume/mix variance              |
| AllocationEngine.ts            | ~200  | Cost allocation                        |
| CapExEngine.ts                 | ~200  | Capital expenditure                    |
| DebtScheduleEngine.ts          | ~200  | Debt scheduling                        |
| CashEngine.ts                  | ~200  | Cash management                        |
| CashFlowWaterfallEngine.ts     | ~200  | Cash flow waterfall                    |
| WorkingCapitalEngine.ts        | ~200  | Working capital analysis               |
| LeaseEngine.ts                 | ~200  | Lease accounting (ASC 842)             |
| RevRecEngine.ts                | ~200  | Revenue recognition (ASC 606)          |
| InventoryEngine.ts             | ~200  | Inventory management                   |
| LoanAmortizationEngine.ts      | ~200  | Loan amortization                      |
| BondPricingEngine.ts           | ~200  | Bond pricing                           |
| YieldCurveEngine.ts            | ~200  | Yield curve analysis                   |
| OptionPricingEngine.ts         | ~200  | Option pricing (Black-Scholes)         |
| FinancialInstrumentsEngine.ts  | ~200  | Financial instruments                  |
| BreakEvenEngine.ts             | ~200  | Break-even analysis                    |
| GoalSeekEngine.ts              | ~200  | Goal seek/solver                       |
| SolverEngine.ts                | ~200  | Optimization solver                    |

### Sector Engines

| Engine                 | Lines | Purpose                       |
| ---------------------- | ----- | ----------------------------- |
| BankingEngine.ts       | ~200  | Banking-specific calculations |
| HealthcareEngine.ts    | ~200  | Healthcare metrics            |
| EnergyEngine.ts        | ~200  | Energy sector calculations    |
| InsuranceEngine.ts     | ~200  | Insurance metrics             |
| RealEstateEngine.ts    | ~200  | Real estate calculations      |
| ConstructionEngine.ts  | ~200  | Construction metrics          |
| ManufacturingEngine.ts | ~200  | Manufacturing KPIs            |
| RetailEngine.ts        | ~200  | Retail metrics                |
| SaaSMetricsEngine.ts   | ~200  | SaaS metrics (ARR, NRR, etc.) |
| ESGEngine.ts           | ~200  | ESG reporting                 |
| TaxEngine.ts           | ~200  | Tax calculations              |
| WorkforceEngine.ts     | ~200  | Workforce planning            |

### Data & Import Engines

| Engine                      | Lines | Purpose                        |
| --------------------------- | ----- | ------------------------------ |
| ImportEngine.ts             | 574   | CSV/JSON/Excel import          |
| ExcelImportEngine.ts        | 412   | Excel-specific import          |
| ExportEngine.ts             | ~300  | Export to PDF/Excel/CSV        |
| ProfessionalExportEngine.ts | ~300  | Professional export formatting |
| ExportTemplateEngine.ts     | ~200  | Export templates               |
| MigrationEngine.ts          | ~300  | Data migration                 |
| CubeEngine.ts               | ~300  | OLAP cube engine               |
| CubeMigrationEngine.ts      | ~200  | Cube migration                 |
| CubePartitioner.ts          | ~200  | Cube partitioning              |
| CubeSecurityEngine.ts       | ~200  | Cube security                  |
| CubeEnginePersistence.ts    | ~200  | Cube persistence               |
| AdvancedOLAPEngine.ts       | ~200  | Advanced OLAP operations       |
| MDXEngine.ts                | ~200  | MDX query engine               |
| PivotTableEngine.ts         | ~200  | Pivot table engine             |
| AggregationDesigner.ts      | ~200  | Aggregation design             |
| DataCatalogEngine.ts        | ~200  | Data catalog                   |
| DataLineageEngine.ts        | ~200  | Data lineage tracking          |
| DataQualityEngine.ts        | ~200  | Data quality checks            |
| DataClassificationEngine.ts | ~200  | Data classification            |
| DataGovernanceEngine.ts     | ~200  | Data governance                |
| DataRetentionEngine.ts      | ~200  | Data retention policies        |
| DataMaskingEngine.ts        | ~200  | Data masking                   |
| ETLPipelineEngine.ts        | ~200  | ETL pipeline                   |

### Report & Dashboard Engines

| Engine                      | Lines | Purpose                 |
| --------------------------- | ----- | ----------------------- |
| ReportBuilderEngine.ts      | ~300  | Report builder          |
| ReportBookEngine.ts         | ~300  | Report book compilation |
| ReportSchedulerEngine.ts    | ~200  | Report scheduling       |
| ReportSchedulingEngine.ts   | ~200  | Report scheduling logic |
| ReportDistributionEngine.ts | ~200  | Report distribution     |
| ReportVersionEngine.ts      | ~200  | Report versioning       |
| ReportCacheEngine.ts        | ~200  | Report caching          |
| DashboardBuilderEngine.ts   | ~300  | Dashboard builder       |
| report-builder-export.ts    | ~200  | Report export           |
| report-builder-formulas.ts  | ~200  | Report formulas         |
| report-builder-templates.ts | ~200  | Report templates        |
| report-builder-types.ts     | ~100  | Report types            |

### Compliance & Security Engines

| Engine                  | Lines | Purpose                   |
| ----------------------- | ----- | ------------------------- |
| ComplianceEngine.ts     | ~300  | SOX compliance            |
| AuditEngine.ts          | ~300  | Audit trail               |
| AuditLogEngine.ts       | ~200  | Audit logging             |
| CellAuditTrailEngine.ts | ~200  | Cell-level audit          |
| SOXComplianceEngine.ts  | ~200  | SOX-specific compliance   |
| RBACEngine.ts           | ~200  | Role-based access control |
| EncryptionEngine.ts     | ~200  | Data encryption           |
| ValidationEngine.ts     | ~200  | Data validation           |

### AI & Analytics Engines

| Engine                    | Lines | Purpose                  |
| ------------------------- | ----- | ------------------------ |
| AIEngine.ts               | ~300  | AI-powered insights      |
| NLQEngine.ts              | 540   | Natural language queries |
| AnomalyDetectionEngine.ts | 232   | Anomaly detection        |

### Workflow Engines

| Engine                     | Lines | Purpose                 |
| -------------------------- | ----- | ----------------------- |
| WorkflowEngine.ts          | ~200  | Workflow orchestration  |
| WorkflowBuilderEngine.ts   | ~200  | Workflow builder        |
| WorkflowActionEngine.ts    | ~200  | Workflow actions        |
| WorkflowSchedulerEngine.ts | ~200  | Workflow scheduling     |
| WorkflowTriggerEngine.ts   | ~200  | Workflow triggers       |
| WorkflowTemplateEngine.ts  | ~200  | Workflow templates      |
| VisualWorkflowEngine.ts    | ~200  | Visual workflow builder |

### Utility Engines

| Engine                          | Lines | Purpose                  |
| ------------------------------- | ----- | ------------------------ |
| AutoSaveEngine.ts               | ~200  | Auto-save functionality  |
| CrashRecoveryEngine.ts          | ~200  | Crash recovery           |
| SessionEngine.ts                | ~200  | Session management       |
| WindowStateManager.ts           | ~200  | Window state persistence |
| RecentFilesEngine.ts            | ~200  | Recent files tracking    |
| FinPlanFileEngine.ts            | ~200  | File format handling     |
| DocumentEngine.ts               | ~200  | Document management      |
| VersionControlEngine.ts         | ~200  | Version control          |
| UndoRedoEngine.ts               | ~200  | Undo/redo                |
| ConditionalFormattingEngine.ts  | ~200  | Conditional formatting   |
| CustomFieldEngine.ts            | ~200  | Custom fields            |
| CellCommentEngine.ts            | ~200  | Cell comments            |
| ExcelKeyboardEngine.ts          | ~200  | Excel keyboard shortcuts |
| ExcelKeyboardShortcuts.ts       | ~200  | Excel shortcuts config   |
| PluginEngine.ts                 | ~200  | Plugin management        |
| FiscalCalendar.ts               | ~200  | Fiscal calendar          |
| MasterDataEngine.ts             | ~200  | Master data management   |
| IncrementalCalcEngine.ts        | ~200  | Incremental calculation  |
| IterativeCalculationEngine.ts   | ~200  | Iterative calculation    |
| ICMatchingEngine.ts             | ~200  | Intercompany matching    |
| ForecastReconciliationEngine.ts | ~200  | Forecast reconciliation  |
| PeriodCloseEngine.ts            | ~200  | Period close             |
| SafeMathParser.ts               | ~200  | Safe math parsing        |
| QueryCache.ts                   | ~200  | Query caching            |
| WaterfallBridgeEngine.ts        | ~200  | Waterfall bridge         |
| DrillThroughEngine.ts           | ~200  | Drill-through            |

### Formula Functions (7 modules, 245+ functions)

| Module         | Functions | Purpose                           |
| -------------- | --------- | --------------------------------- |
| financial.ts   | 30+       | EBITDA, NPV, IRR, PMT, etc.       |
| statistical.ts | 20+       | SUM, AVERAGE, STDEV, CORREL, etc. |
| math.ts        | 20+       | ROUND, POWER, SQRT, etc.          |
| lookup.ts      | 17        | VLOOKUP, INDEX, MATCH, etc.       |
| text.ts        | 20+       | TEXT, CONCAT, LEFT, RIGHT, etc.   |
| logical.ts     | 15+       | IF, AND, OR, SWITCH, etc.         |
| helpers.ts     | utilities | Shared utilities                  |

---

## 4. Complete Store List (22 stores)

| Store              | Key State                                 | Key Actions                                 | Persistence |
| ------------------ | ----------------------------------------- | ------------------------------------------- | ----------- |
| authStore          | user, isAuthenticated, tokenExpiry        | login, logout, register, refreshToken       | Yes         |
| budgetStore        | budgets, activeBudgetId                   | createBudget, updateBudget, deleteBudget    | Yes         |
| forecastStore      | forecasts, activeForecastId               | createForecast, updateForecast              | Yes         |
| scenarioStore      | scenarios, activeScenarioId               | createScenario, compareScenarios            | Yes         |
| glStore            | entries, accounts                         | addEntry, updateEntry, generateTrialBalance | No          |
| entityStore        | entities, activeEntityId                  | addEntity, updateEntity, setActiveEntity    | Yes         |
| reportStore        | reports, scheduledReports                 | createReport, scheduleReport                | Yes         |
| dataStore          | importJobs, glAccounts                    | addImportJob, updateJobStatus               | No          |
| collaborationStore | comments, tasks, activityLog              | addComment, addTask, addActivity            | No          |
| notificationStore  | notifications                             | addNotification, dismissNotification        | Yes         |
| settingsStore      | theme, locale, currency                   | updateSettings                              | Yes         |
| uiStore            | sidebarOpen, activeModal, globalDateRange | toggleSidebar, setActiveModal               | Yes         |
| analyticsStore     | dashboards, widgets                       | addDashboard, updateWidget                  | Yes         |
| driverStore        | drivers, cascadeRules                     | addDriver, updateCascade                    | Yes         |
| varianceStore      | variances                                 | addVariance, updateVariance                 | Yes         |
| cubeStore          | cubes, dimensions                         | addCube, updateDimension                    | No          |
| tourStore          | tours, activeTourId                       | startTour, completeTour                     | Yes         |
| constructionStore  | projects, equipment                       | addProject, updateEquipment                 | No          |
| energyStore        | production, reserves                      | addProduction, updateReserves               | No          |
| healthcareStore    | patients, trials                          | addPatient, updateTrial                     | No          |
| insuranceStore     | claims, policies                          | addClaim, updatePolicy                      | No          |
| realEstateStore    | properties, valuations                    | addProperty, updateValuation                | No          |

---

## 5. Complete Page List (140 pages)

### Auth Pages (4)

- LoginPage.tsx — Login form with authStore integration
- RegisterPage.tsx — Registration form
- ForgotPasswordPage.tsx — Password reset
- OnboardingWizard.tsx — Multi-step onboarding

### Budget Pages (4)

- BudgetCreatePage.tsx — Create budget (incremental or zero-based)
- BudgetListPage.tsx — List all budgets with filtering
- BudgetDetailPage.tsx — Budget detail view
- BudgetVAReport.tsx — Budget vs actual variance report

### Forecast Pages (5)

- ForecastListPage.tsx — List all forecasts
- ForecastBuilderPage.tsx — Build forecasts
- RollingForecastPage.tsx — 12-month rolling forecast
- WhatIfPage.tsx — What-if analysis with sliders
- DriverPlanningPage.tsx — Driver-based planning

### Scenario Pages (2)

- ScenarioListPage.tsx — List all scenarios
- ScenarioBuilderPage.tsx — Build and compare scenarios

### Report Pages (11)

- ReportsListPage.tsx — List all reports
- ReportTemplateLibraryPage.tsx — Report templates
- ReportScheduler.tsx — Schedule reports
- ReportBookBuilder.tsx — Build report books
- ProfitLossPage.tsx — Income statement
- BalanceSheetPage.tsx — Balance sheet
- CashFlowPage.tsx — Cash flow statement
- ThreeStatementDashboardPage.tsx — Integrated 3-statement view
- BudgetVsActualPage.tsx — Budget vs actual report
- BoardPackPage.tsx — Board pack generation
- FinancialStatementTemplates.tsx — Statement templates

### Consolidation Pages (3)

- ConsolidationDashboard.tsx — Multi-entity consolidation
- ICEliminationPage.tsx — Intercompany elimination
- OwnershipTreePage.tsx — Ownership structure

### Currency Pages (3)

- FXRatesPage.tsx — Exchange rate management
- HedgeManagementPage.tsx — Hedge positions
- TranslationResultPage.tsx — Currency translation results

### Data Pages (10)

- DataImportPage.tsx — Import data (Excel/CSV/JSON)
- ChartOfAccountsPage.tsx — Chart of accounts CRUD
- GLExplorerPage.tsx — GL entry browser
- GLAccountAnalysisPage.tsx — Account analysis
- GLJournalsPage.tsx — Journal entries
- GLTrialBalancePage.tsx — Trial balance
- GLReportingPage.tsx — GL reporting
- GLUploadPage.tsx — GL data upload
- MigrationPage.tsx — Data migration wizard
- VersionDiffPage.tsx — Version comparison

### Sector Pages (9)

- SectorPage.tsx — Main sector page
- BankingDashboardPage.tsx
- ConstructionDashboardPage.tsx
- EmissionsTradingPage.tsx
- EnergyDashboardPage.tsx
- EquipmentManagementPage.tsx
- HealthcareDashboardPage.tsx
- InsuranceDashboardPage.tsx
- RealEstateDashboardPage.tsx

### Industry-Specific Pages (30+)

- Banking: BankingDashboard, NIMDashboard, CapitalAdequacy, LoanLoss
- Healthcare: HealthcareDashboard, PatientRevenue, ClinicalTrialCost, ValueBasedCare
- Energy: EnergyDashboard, EnergyProduction, EmissionsTrading, EnergyRisk, RenewableEnergy
- Insurance: InsuranceDashboard, ClaimsAnalytics, Underwriting
- Real Estate: RealEstateDashboard, REITDashboard, PropertyPortfolio, Valuation, FacilityManagement
- Construction: ConstructionDashboard, ProjectCosting, EquipmentManagement
- Manufacturing: ProductionDashboard, Inventory, COGSVariance
- Retail: RetailDashboard, StoreDashboard, StorePerformance, InventoryPlanning, InventoryDashboard, PromoAnalysis
- SaaS: ARRDashboard, ChurnDashboard, ChurnAnalysis, CohortAnalysis
- Revenue: RevRecDashboard, DeferredSchedule
- Bonds: BondPortfolio, YieldCurve
- Lease: LeaseDashboard, LeaseDetail
- CapEx: CapExDashboard, DepreciationForecast
- Cash: CashForecast, WorkingCapital, DebtSchedule
- Credit: CreditRisk
- Tax: TaxProvision, TransferPricing
- Treasury: FXExposure, Investment
- Workforce: HeadcountPlan, CompModeling, PayrollForecast
- ESG: CarbonDashboard, CSRDReport
- Variance: VarianceDashboard
- Analytics: AnalyticsPage, BenchmarkingPage, GoalSeekPage
- AI: AIIntelligencePage
- Audit: AuditTrailPage, SOXCompliancePage
- Collaboration: CollaborationPage, ApprovalQueuePage
- Templates: TemplateGalleryPage, TemplatePreviewPage
- Charts: ChartShowcasePage
- Settings: SettingsPage, UserManagementPage, SecuritySettingsPage, IntegrationSettingsPage, BackupRestorePage, ConnectorSettingsPage
- Other: DashboardPage, HelpPage, ProfilePage, NotFoundPage, SetupWizardPage, EducationPage, GovernmentPage, LogisticsPage, TelecomPage

---

## 6. Complete Component List

### UI Components (src/components/ui/)

- Button, Card, CardContent, CardHeader, CardTitle
- Input, Textarea, Select, Checkbox, Radio
- Modal, Dialog, AlertDialog, Sheet, Drawer
- Tabs, TabList, TabTrigger, TabContent
- Tooltip, Popover, DropdownMenu
- Skeleton, Spinner, Progress
- Badge, Avatar, Separator
- DataTable, KPICard, KPIValue
- CommandPalette, ShortcutHelpModal
- PeriodPicker, DatePicker
- ErrorBoundary, AsyncErrorBoundary, PageErrorBoundary
- FocusTrap, LiveRegion, SkipToContent, VisuallyHidden
- GenerativeDashboard

### Chart Components (src/components/charts/)

- WaterfallChart — Revenue/expense waterfall
- VarianceChart — Budget vs actual comparison
- SparklineChart — Inline mini charts
- TreemapChart — Portfolio allocation
- HeatmapChart — Correlation matrix
- GaugeChart — KPI gauge/target
- ChartExportButton — SVG/PNG export
- index.ts — Barrel export

### Data Components (src/components/data/)

- ColumnMapper — Auto-detect column mappings
- ImportPreview — Preview before import

### Auth Components (src/components/auth/)

- ProtectedRoute — Role-based route protection

### Layout Components (src/components/layout/)

- Sidebar — Navigation sidebar
- Header — Top header bar

---

## 7. Plugin System (8 files)

| File                   | Lines | Purpose                         |
| ---------------------- | ----- | ------------------------------- |
| types.ts               | 323   | Type definitions                |
| PluginRegistry.ts      | 248   | Register/discover/query plugins |
| PluginLoader.ts        | 196   | Load plugin modules             |
| PluginAPI.ts           | 333   | API surface (10 sub-APIs)       |
| PluginManager.ts       | 171   | High-level orchestrator         |
| index.ts               | 51    | Barrel export                   |
| PluginRegistry.test.ts | 263   | Tests                           |

### Plugin Lifecycle

1. **Install** — Register plugin manifest
2. **Activate** — Load plugin module, initialize
3. **Deactivate** — Cleanup, remove listeners
4. **Uninstall** — Remove plugin completely

### Plugin Capabilities

- Custom formula functions
- Custom chart types
- Custom export formats
- Custom data sources
- Custom dashboard widgets

---

## 8. Security

### tokenRotation.ts (236 lines)

- Auto-refresh 5 minutes before expiry
- Visibility change handler (refresh on tab focus)
- 401 interceptor (auto-retry with new token)
- Memory-only access token (never persisted)
- httpOnly cookie pattern for refresh token

### securityHeaders.ts (55 lines)

- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Tauri-compatible exports

### encryption.ts (68 lines)

- AES-256-GCM via Web Crypto API (SubtleCrypto)
- generateKey, exportKey, importKey
- encrypt, decrypt (Base64 encoding)
- encryptObject, decryptObject

---

## 9. Accessibility

### Components

- FocusTrap — Focus management for modals
- LiveRegion — Screen reader announcements
- SkipToContent — Skip navigation link
- VisuallyHidden — Hidden but accessible content

### Hooks

- useReducedMotion — Detect prefers-reduced-motion
- useAnnounce — Screen reader announcements
- useErrorHandler — Error boundary integration
- useFocusRestore — Focus restoration after modal close

### WCAG 2.1 AA Compliance

- All interactive elements keyboard accessible
- Focus indicators with 3:1 contrast ratio
- Form inputs have associated labels
- Error messages programmatically associated
- Color not sole information carrier
- ARIA landmarks on all pages

---

## 10. Testing

### Setup

- Framework: Vitest 3.x
- Pool: threads (shared heap)
- Max workers: 4
- Heap limit: 16GB (--max-old-space-size=16000)
- Environment: jsdom
- Setup file: src/test/setup.ts

### Test Utilities

- accessibilityTestUtils.ts — A11y test helpers
- engineTestUtils.ts — Engine test helpers

### E2E Tests

- tests/e2e/smoke-test.sh — 9 flows using agent-browser
- Screenshots in tests/e2e/screenshots/

---

## 11. Build & Deploy

### vite.config.ts

- Path alias: @/ → src/
- Test config: threads pool, 4 workers

### package.json Scripts

- `npm run dev` — Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run test` — Run tests (16GB heap)
- `npm run lint` — ESLint
- `npm run format` — Prettier

### Tauri

- src-tauri/ directory
- Native desktop shell
- File system access
- System tray
- Auto-update support

---

## 12. Key Patterns

### Formula Pattern

```typescript
// Static method, pure function, never throws
static SUM(...args: number[]): number {
  return args.reduce((a, b) => a + b, 0);
}
```

### Store Pattern

```typescript
// subscribeWithSelector + persist + immer
const useStore = create<State>()(
  subscribeWithSelector(persist(immer((set) => ({...})), {...}))
);
```

### Page Pattern

```typescript
// Wire to store, add loading/empty states
export default function SomePage() {
  const { data, isLoading } = useSomeStore();
  if (isLoading) return <Skeleton />;
  if (!data?.length) return <EmptyState />;
  return <DataTable data={data} columns={columns} />;
}
```

### Chart Pattern

```typescript
// Responsive, accessible, exportable
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#3B82F6" />
  </BarChart>
</ResponsiveContainer>
```

---

_This document was generated from the actual codebase. Every engine, store, page, and component listed here exists in the source code._
