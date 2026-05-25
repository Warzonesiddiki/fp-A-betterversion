# FinPlan Pro — Complete Project Blueprint

> **Version:** 2.0 | **Date:** 2026-05-24 | **Status:** Active Development
> **Purpose:** This document is the single source of truth. Any developer or AI agent reading ONLY this file can understand, build, and continue the project.

---

## 1. What We Are Building

**FinPlan Pro** is an enterprise-grade, offline-first Financial Planning & Analysis (FP&A) desktop application. It replaces expensive SaaS FP&A tools (Anaplan, Adaptive Insights, Vena, Planful, etc.) with a one-time-purchase desktop app.

### Mission
Replace 1,000+ FP&A analysts with software across ALL global sectors. Be 1000x better than 25 competitors.

### 9 Unique Moats
1. **Offline-first** — Tauri + IndexedDB, no internet required
2. **Desktop app** — native speed, no browser overhead
3. **One-time price** — $0 vs $50K+/yr SaaS
4. **174 engines** — 3.5x more than Anaplan (50)
5. **Plugin system** — extensible via sandboxed plugins
6. **WCAG 2.1 AA** — full accessibility compliance
7. **16 sectors** — agriculture, banking, construction, education, energy, government, healthcare, hospitality, insurance, logistics, manufacturing, real estate, retail, technology, telecom, workforce
8. **Keyboard shortcuts** — complete shortcut system with command palette (Ctrl+K)
9. **ESG reporting** — built-in environmental/social/governance metrics

### Target Users
CFOs, FP&A analysts, budget managers, department heads, financial controllers at mid-market companies (50-5000 employees).

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 19.2.6 | UI library |
| **Language** | TypeScript | 5.9.3 (strict) | Type safety |
| **Bundler** | Vite | 7.3.2 | Dev server + build |
| **Styling** | Tailwind CSS | 4.1.17 | Utility-first CSS |
| **UI Primitives** | Radix UI | 12 packages | Accessible components |
| **State** | Zustand | 5.0.13 | Global state management |
| **State Middleware** | Immer | 10.1.1 | Immutable updates |
| **Grid** | AG Grid Community | 35.3.0 | Financial data grids |
| **Charts** | Recharts | 3.8.1 | Financial charts |
| **Animation** | Framer Motion | 12.38.0 | UI transitions |
| **Forms** | React Hook Form | 7.76.0 | Form handling |
| **Validation** | Zod | 4.4.3 | Schema validation |
| **Data Fetching** | TanStack Query | 5.100.10 | Server state |
| **Virtualization** | TanStack Virtual | 3.13.24 | Large list rendering |
| **HTTP** | Axios | 1.16.0 | API client |
| **Desktop** | Tauri | 2.x | Native shell (Rust) |
| **AI/ML** | @huggingface/transformers | 4.2.0 | Local AI models |
| **PDF** | jsPDF | 4.2.1 | PDF export |
| **Excel** | ExcelJS | 3.4.0 | Excel import/export |
| **i18n** | i18next | 26.2.0 | Internationalization |
| **Icons** | Lucide React | 0.513.0 | Icon library |
| **Testing** | Vitest | 4.1.6 | Unit testing |
| **E2E** | Playwright | 1.60.0 | End-to-end testing |
| **Linting** | ESLint | 9.39.4 | Code quality |
| **Formatting** | Prettier | 3.5.3 | Code formatting |
| **Node** | Node.js | 26.2.0 | Runtime |

### Key Dependencies (57 total)
- 12 Radix UI packages (@radix-ui/react-*)
- 5 Tauri packages (@tauri-apps/*)
- d3 for advanced visualizations
- exceljs for Excel operations
- date-fns for date handling
- lodash-es for utilities
- uuid for ID generation

---

## 3. Architecture

### Data Flow
```
External Data (Excel/CSV/API)
  → Import Engines (src/engines/)
    → Zustand Stores (src/store/)
      → Calculation Engines (src/engines/) — pure functions
        → UI Layer (Pages/Components) & Export Engine
```

### Directory Structure
```
fp&A/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # All routes (lazy-loaded)
│   ├── components/
│   │   ├── ui/               # 80+ atomic UI primitives
│   │   ├── admin/            # Admin panel components
│   │   ├── ai/               # AI/copilot components
│   │   ├── analytics/        # Analytics charts & viz
│   │   ├── auth/             # Auth components (ProtectedRoute)
│   │   ├── budgets/          # Budget grid & forms
│   │   ├── charts/           # 8 advanced chart types
│   │   ├── collaboration/    # Comments, presence
│   │   ├── construction/     # Construction sector
│   │   ├── dashboard/        # KPI cards, activity feed
│   │   ├── data/             # Import/export UI
│   │   ├── errors/           # Error boundaries
│   │   ├── esg/              # ESG reporting
│   │   ├── finance/          # Finance components
│   │   ├── generative/       # Generative AI dashboards
│   │   ├── insurance/        # Insurance sector
│   │   ├── layout/           # App layout, sidebar
│   │   ├── manufacturing/    # Manufacturing sector
│   │   ├── migration/        # Data migration wizard
│   │   ├── realestate/       # Real estate sector
│   │   ├── reports/          # Report builders
│   │   ├── retail/           # Retail sector
│   │   ├── saas/             # SaaS sector
│   │   ├── scenarios/        # Scenario planning
│   │   ├── settings/         # Settings pages
│   │   ├── treasury/         # Treasury management
│   │   ├── variance/         # Variance analysis
│   │   └── workforce/        # Workforce planning
│   ├── store/                # 32 Zustand stores
│   ├── engines/              # 174 calculation engines
│   ├── pages/                # 75 route pages
│   ├── hooks/                # 33 custom hooks
│   ├── workers/              # 6 web workers
│   ├── services/             # API, WebSocket, collaboration
│   ├── plugins/              # Plugin system (8 files)
│   ├── utils/                # 60+ utility modules
│   ├── config/               # Design tokens, shortcuts
│   ├── types/                # TypeScript definitions
│   ├── templates/            # Report/budget templates
│   ├── test/                 # Test setup, mocks, utils
│   ├── i18n/                 # Internationalization
│   └── assets/               # Static assets
├── src-tauri/                # Tauri desktop shell (Rust)
├── docs/                     # Documentation
├── .claude/                  # Claude Code config
│   ├── rules/                # 10 rule files
│   ├── skills/               # Custom skills
│   └── agents/               # Agent definitions
└── .obsidian/brain/          # Project memory vault
```

---

## 4. State Management — All 32 Stores

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `authStore` | Authentication, JWT, RBAC | Yes (masterStorage) |
| `budgetStore` | Budgets, line items, workflow | Yes |
| `glStore` | General ledger entries, accounts | Yes |
| `dataStore` | Import/export state | No |
| `forecastStore` | Forecasts, drivers | Yes |
| `scenarioStore` | Scenarios, comparisons | Yes |
| `varianceStore` | Variance analysis | No |
| `reportStore` | Report definitions | Yes |
| `collaborationStore` | Comments, tasks, approvals | Yes |
| `notificationStore` | Notifications | No |
| `settingsStore` | User preferences, sector | Yes |
| `analyticsStore` | Analytics state | No |
| `capexStore` | Capital expenditure | Yes |
| `entityStore` | Multi-entity management | Yes |
| `fxRateStore` | Exchange rates | Yes |
| `cubeStore` | OLAP cube state | No |
| `driverStore` | Forecast drivers | Yes |
| `uiStore` | UI state (sidebar, theme) | Yes |
| `tourStore` | Onboarding tour | Yes |
| `esgStore` | ESG metrics | Yes |
| Sector stores (12) | `constructionStore`, `educationStore`, `energyStore`, `governmentStore`, `healthcareStore`, `insuranceStore`, `logisticsStore`, `realEstateStore`, `retailStore`, `telecomStore`, `workforceStore` | Yes |

### Store Pattern (Required)
```typescript
export const useSomeStore = create<SomeState>()(
  subscribeWithSelector(     // outermost
    persist(                 // for persistent data
      immer((set, get) => ({ // innermost
        // state + actions
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

---

## 5. Calculation Engines — 174 Engines

### Financial Core
- `AllocationEngine`, `AllocationRuleEngine` — cost allocation
- `AnomalyDetectionEngine`, `AnomalyExplainer` — anomaly detection with AI
- `AuditEngine`, `AuditLogEngine` — compliance auditing
- `AutoCommentaryEngine` — AI-generated commentary
- `BudgetCollectionEngine` — budget aggregation
- `COGSVarianceEngine` — cost of goods variance
- `CalculationGraph`, `CalculationQueue` — dependency graph
- `CapExEngine` — capital expenditure
- `CashEngine`, `CashFlowWaterfallEngine` — cash management
- `ComplianceEngine` — SOX compliance, SOD checks
- `ConsolidationEngine`, `ConsolidationAdjustmentsEngine` — multi-entity consolidation (ASC 810)
- `CreditRiskEngine` — credit risk modeling
- `CustomFieldEngine` — user-defined fields
- `DashboardBuilderEngine` — dynamic dashboards
- `DataQualityEngine`, `DataGovernanceEngine`, `DataClassificationEngine` — data governance
- `DataLineageEngine`, `DataCatalogEngine`, `DataMaskingEngine`, `DataRetentionEngine` — data management
- `DebtScheduleEngine` — debt modeling
- `DepreciationEngine` — asset depreciation
- `DrillThroughEngine` — drill-down analysis

### Formula & Calculation
- `ArrayFormulaEngine` — array formulas
- `AssumptionEngine` — planning assumptions
- `FormulaEngine` — Excel-compatible formulas (245+ functions)
- `FormulaFunctionRegistry` — function registry
- `AggregateTableEngine`, `AggregationDesigner` — data aggregation

### Import/Export
- `AdvancedExcelEngine` — advanced Excel operations
- `AdvancedPDFEngine` — PDF generation
- `ExcelImportEngine` — Excel/CSV import
- `ExportEngine` — multi-format export

### AI/ML
- `AICopilotEngine` — natural language queries
- `AIEngine` — local AI with HuggingFace transformers
- `NLQEngine` — natural language query (540 lines, first offline NLQ in FP&A)

### Sector-Specific
- `BankingEngine`, `BondPricingEngine`, `BreakEvenEngine`
- `ConstructionEngine`
- `InsuranceEngine`

### Infrastructure
- `AutoSaveEngine`, `CrashRecoveryEngine` — reliability
- `BatchOperationEngine` — bulk operations
- `CellAuditTrailEngine`, `CellCommentEngine`, `CellProtectionEngine`, `CellValidationEngine` — cell-level features
- `ChartAnnotationEngine`, `ConditionalFormattingEngine` — visualization
- `ConnectorEngine` — external API connectors
- `CubeEngine`, `CubeEnginePersistence`, `CubeMigrationEngine`, `CubePartitioner`, `CubeSecurityEngine` — OLAP
- `DimensionalModelingEngine` — dimensional models
- `DocumentEngine` — document generation
- `InventoryEngine` — inventory management
- `MigrationEngine` — data migration
- `MultiBookEngine` — multi-book accounting
- `NIMEngine` — NVIDIA NIM integration
- `PluginEngine` — plugin execution
- `ProfessionalExportEngine` — enterprise export
- `ReconciliationEngine` — bank reconciliation
- `ReportEngine`, `ReportTemplateEngine` — reporting
- `RollingForecastEngine`, `ScenarioEngine`, `SensitivityEngine` — forecasting
- `SectorEngine` — sector-specific logic
- `TemplateEngine` — templates (23 templates, 16 industries)
- `ThreeStatementEngine` — P&L+BS+CF integration (1076 lines)
- `VarianceEngine` — variance analysis
- `WaterfallEngine` — waterfall charts

---

## 6. Custom Hooks — 33 Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state & actions |
| `useAutoSave` | Auto-save with debounce |
| `useCopilotSidebar` | AI copilot sidebar toggle |
| `useCurrency` | Currency formatting & conversion |
| `useDebounce` | Value debouncing |
| `useDensity` | Grid density setting |
| `useDirtyState` | Track unsaved changes |
| `useErrorHandler` | Error handling utilities |
| `useExport` | Export to PDF/Excel/CSV |
| `useFirstRun` | First-run detection |
| `useFocusManagement` | A11y focus management |
| `useFocusRestore` | Focus restoration after modal |
| `useFreezePanes` | Excel-like freeze panes |
| `useIndexedDB` | IndexedDB operations |
| `useIntersectionObserver` | Visibility detection |
| `useKeyboardShortcuts` | Keyboard shortcut system |
| `useOffline` | Online/offline detection |
| `usePeriods` | Fiscal period management |
| `usePersistence` | Storage persistence |
| `usePresence` | Collaboration presence |
| `useReducedMotion` | A11y motion preference |
| `useRenderCount` | Debug render counting |
| `useSector` | Sector config access |
| `useTauriGlobalShortcuts` | Tauri global shortcuts |
| `useTauriMenu` | Tauri native menu |
| `useThrottle` | Value throttling |
| `useTour` | Onboarding tour |
| `useURLState` | URL query state sync |
| `useUndoRedo` | Undo/redo functionality |
| `useUndoableAction` | Undoable action wrapper |
| `useWebSocket` | WebSocket connection |

---

## 7. Web Workers — 6 Workers

| Worker | Purpose |
|--------|---------|
| `batch-calc.worker` | Batch financial calculations |
| `consolidation.worker` | Multi-entity consolidation |
| `consolidationWorker` | Consolidation logic |
| `exportWorker` | Export generation |
| `formulaWorker` | Formula evaluation |
| `monte-carlo.worker` | Monte Carlo simulation |
| `scenarioWorker` | Scenario calculations |
| `WorkerPool` | Worker pool manager |

---

## 8. Plugin System

| File | Purpose |
|------|---------|
| `PluginRegistry` | Plugin registration |
| `PluginManager` | Plugin lifecycle |
| `PluginLoader` | Dynamic plugin loading |
| `PluginSandbox` | Sandboxed execution |
| `PluginMarketplace` | Plugin marketplace |
| `PluginAPI` | Plugin API surface |
| `types.ts` | Plugin type definitions |
| `index.ts` | Barrel export |

---

## 9. Services

| Service | Purpose |
|---------|---------|
| `api.ts` | REST API client |
| `nim.ts` | NVIDIA NIM AI integration |
| `BenchmarkService` | Performance benchmarking |
| `ChangeBroadcaster` | Change event broadcasting |
| `PresenceService` | Collaboration presence |
| `RealtimeCollaborationManager` | Real-time collaboration |
| `WebSocketManager` | WebSocket management |
| `api-integration/` | External API connectors (QuickBooks, Xero, REST) |

---

## 10. Build & Deploy

### Commands
```bash
npm run dev              # Vite dev server on :5173 (strictPort)
npm run build            # Production build
npm run lint             # ESLint with --fix
npm run format           # Prettier --write
npm run test             # Vitest single run (80GB heap)
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright (tests/ dir, chromium only)
npx vitest run src/path/to/file.test.ts   # Single test file
npx tsc --noEmit         # Type check
npm run tauri:dev        # Tauri dev (native window)
npm run tauri:build      # Tauri production build
```

### CI Order
`tsc --noEmit → lint → test → build → bundle size check`

### Bundle Limits
- Main chunk: < 150KB gzip
- Total JS: < 2MB gzip

### Vite Manual Chunks
- `react-vendor` — React + ReactDOM
- `chart-vendor` — Recharts + D3
- `grid-vendor` — AG Grid
- `form-vendor` — React Hook Form + Zod
- `state-vendor` — Zustand + Immer
- `ai-vendor` — @huggingface/transformers (23.5MB, lazy-loaded)
- `excel-vendor` — ExcelJS
- `animation-vendor` — Framer Motion
- `radix-vendor` — Radix UI

### PWA
- Service worker via vite-plugin-pwa (workbox, autoUpdate)
- Precaches 156 entries

### Tauri Desktop
- Window: 1400x900, min 1024x600, centered, resizable
- Plugins: dialog, fs, shell, sql, global-shortcut, notification
- Bundle: NSIS for Windows 11

---

## 11. Testing

### Unit Tests (Vitest)
- 728 test files colocated with source
- Setup: `src/test/setup.ts` (auto-cleanup via @testing-library/jest-dom/vitest)
- Render helper: `import { render } from '@/test/testUtils'` — wraps in BrowserRouter
- Store tests: reset state in `beforeEach` via `useStore.setState({...})`
- Config: threads pool, 4 max workers, 80GB heap
- Tauri mock: `@tauri-apps/plugin-global-shortcut` aliased to `src/test/__mocks__/tauri-shortcut.ts`

### E2E Tests (Playwright)
- Directory: `tests/`
- Browser: Chromium only
- Timeout: 60s
- Auto-starts dev server

### Last Known Test Results (2026-05-19)
- 6,256 pass, 1 skip (99.88%)

---

## 12. Accessibility (WCAG 2.1 AA)

### Implemented
- Error boundaries: `ErrorBoundary`, `PageErrorBoundary`, `AsyncErrorBoundary`, `EngineErrorBoundary`, `GridErrorBoundary`, `PluginErrorBoundary`
- Focus management: `useFocusManagement`, `useFocusRestore`, `FocusTrap`
- Screen reader: `LiveRegion`, `useAnnounce`, `SkipToContent`
- Keyboard navigation: Full shortcut system, CommandPalette (Ctrl+K)
- Dark mode: 57 components with dark: variants
- Color contrast: Variance colors (green #16A34A, red #DC2626)
- Reduced motion: `useReducedMotion`
- Grid accessibility: `role="grid"` with `aria-rowcount` and `aria-colcount`

### Known Gaps
- Dashboard icon buttons lack aria-label
- LoginPage help button non-functional
- Some form labels not associated with controls (~146 ESLint warnings)

---

## 13. Security

### Implemented
- JWT-based auth with access token in memory (not localStorage)
- RBAC: Admin, Manager, Analyst, Dept Head, Viewer
- CSP headers in index.html
- Input validation with Zod
- Data sanitization utility (src/utils/security.ts)
- ExcelJS replacing vulnerable xlsx package
- .gitignore correctly excludes .env files
- Encryption utility (src/utils/encryption.ts)

### Critical Issues (as of 2026-05-24)
1. **xlsx package** — High severity vulnerabilities (Prototype Pollution + ReDoS). No fix available. Must remove and use ExcelJS exclusively.
2. **NVIDIA NIM API keys** — VITE_ prefix means they're bundled into client JS. Should go through backend proxy.
3. **CSP** — `script-src 'unsafe-inline' 'unsafe-eval'` needed for dev but XSS-enabling in prod.
4. **Weak JWT secret** — `finplan-dev-secret-change-in-production` in .env

---

## 14. Current Codebase Metrics (Verified 2026-05-24)

| Metric | Count |
|--------|-------|
| TS/TSX files | 1,557 |
| TS source files (.ts) | ~850 |
| TSX files (.tsx) | ~707 |
| Test files | 728 |
| Stores (source) | 32 |
| Engines (source) | 174 |
| Pages | 75 |
| Hooks | 33 |
| Workers | 12 |
| Services | ~15 |
| Plugin files | 8 |
| Config files | 2 |
| Type files | 6 |
| Utility files | 60+ |
| UI components | 80+ |
| Domain component dirs | 29 |
| Sector configs | 16 |

---

## 15. Git State (2026-05-24)

### Commits
- Total: 2 (`Initial commit` + `v1`)
- Unpushed: 1 (`v1` ahead of `origin/main`)

### Uncommitted Changes
- **1,506 files** changed (1,237 modified + 269 untracked)
- **9,577 insertions, 4,597 deletions** in tracked files
- ALL Phase 1-4 work sitting uncommitted

### Branches
| Branch | Status |
|--------|--------|
| `main` (current) | Primary branch |
| `master` | Legacy scaffold |
| `feature/auth-fix` | Local, stale |
| `feature/excel-import` | Local, stale |
| `feature/formula-engine` | Local, stale |
| `feature/skills-acquisition` | Local, stale |
| `feature/store-fix` | Local, stale |
| `feature/stub-pages` | Local, stale |

### Build Status
- **TypeScript:** 0 errors (DependencyGraph.tsx fixed this session)
- **Build:** PASS (verified 2026-05-24)
- **Tests:** Running (last known: 6,256 pass, 99.88%)
- **ESLint:** 49 errors, 1,241 warnings

---

## 16. Multi-Agent History

| Agent | Date | Work Done | Commits |
|-------|------|-----------|---------|
| **OpenCode** | 2026-05-19 | Heaviest session: plugin system (1585 lines), 6 charts, keyboard shortcuts, migration wizard, accessibility, FX engine, compliance, audit, 16 sector KPIs, onboarding. 30+ agents in batches of 5. | 125+ |
| **Gemini CLI** | 2026-05-16 to 2026-05-24 | Phase 4 (A1-A4): Performance, QA, product flow, security. Expanded engines 156→348, stores 32→64, added NLQ, template, 3-statement engines. | Left uncommitted |
| **Claude (this session)** | 2026-05-24 | Analysis, pattern recovery, DependencyGraph.tsx fix, blueprint creation | 0 (pending) |

### Working Pattern (Recovered from Obsidian)
- **5-agent parallel** — allocation: Builder, Wirer, Fixer, Auditor, Documenter
- **Each agent:** read → build → test → commit
- **Main thread:** monitor, merge, resolve conflicts
- **Memory:** 80GB NODE heap, threads pool, 5 agents max
- **Incremental commits** after each agent batch
- **Obsidian brain** for cross-session memory

---

## 17. Internationalization

- i18next configured with browser language detection
- Translation files in `src/i18n/`
- All UI strings should be wrapped in `t()` function
- Support for multiple locales (currency formatting, date formatting)

---

## 18. Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build config, manual chunks, PWA, test config |
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `eslint.config.js` | ESLint flat config |
| `tailwind.config.ts` | Tailwind CSS config |
| `index.html` | CSP headers, PWA manifest |
| `src-tauri/tauri.conf.json` | Tauri desktop config |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore rules |
| `src/test/setup.ts` | Test setup |
| `src/config/designTokens.ts` | Design tokens |
| `src/config/keyboardShortcuts.ts` | Keyboard shortcut definitions |

---

## 19. Path Aliases

`@/` → `src/` (configured in vite.config.ts and tsconfig.json)

```typescript
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
```

---

## 20. Conventions

- **Named exports only** — no default exports
- **Component props** — explicit `{Component}Props` interface
- **No inline styles** — Tailwind only
- **No fetch in components** — use services/ or store actions
- **File size limits**: 300 lines (components), 500 lines (engines/stores)
- **Financial numbers**: raw `number`, formatted only at display layer
- **Percentages**: stored as decimals (0.15 = 15%)
- **Variance colors**: favorable = green (#16A34A), unfavorable = red (#DC2626)
- **No `any`** — use `unknown` for untrusted input

---

## 21. Legacy Plans Archive

The following plans are now **LEGACY** — preserved for reference but superseded by this blueprint:

| File | Date | Reason |
|------|------|--------|
| `MASTER_PLAN.md` | Pre-2026-05-24 | 50-phase plan, stale error counts (claimed 1,021 TS errors, actual: 0) |
| `ROADMAP.md` | Pre-2026-05-24 | 18-phase roadmap, phases 1-16 done |
| `PHASE_4_PLAN.md` | Pre-2026-05-24 | Phase 4 plan, A1-A4 done |
| `PHASE_5_PLAN.md` | Pre-2026-05-24 | Enterprise scalability, drafted not started |
| `PHASES_16_35_MASTER_PLAN.md` | Pre-2026-05-24 | Extended roadmap |
| `PHASE_16_35_ROADMAP.md` | Pre-2026-05-24 | Extended roadmap |
| `PLAN.md` | Pre-2026-05-24 | Original plan |
| `PROGRESS.md` | Pre-2026-05-24 | Build progress (202 items) |
| `GEMINI.md` | Pre-2026-05-24 | Gemini CLI context |
| `AGENT_SWARM.md` | Pre-2026-05-24 | Agent swarm config |
| `COMPETITIVE_ROADMAP.md` | Pre-2026-05-24 | Competitive analysis |
| `FINPLAN_PRO_COMPLETE_ARCHITECTURE.md` | Pre-2026-05-24 | Architecture doc |
| `FRONTEND_BLUEPRINT.md` | Pre-2026-05-24 | Frontend blueprint |

**Why legacy:** These documents contain stale data, incorrect counts, and outdated status. This blueprint supersedes all of them.

---

*This document is the single source of truth for FinPlan Pro. When in doubt, refer here.*
