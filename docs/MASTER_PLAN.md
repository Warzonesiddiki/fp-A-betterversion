# FinPlan Pro — Master Build Plan (25-Competitor Analysis)

## Vision

Build the #1 FP&A desktop app that defeats all 25 competitors by 1000x through unique advantages (offline, desktop, one-time price, 232 engines) and matching their best features.

## Current State

- **Build:** PASS
- **Engines:** 232 (4.6x Anaplan)
- **Sectors:** 16 (3x Anaplan)
- **Formula Functions:** 245+ (7 modules)
- **Pages:** 133
- **Stores:** 40 (all with subscribeWithSelector)
- **Charts:** 6 (created but mostly unwired)
- **Plugin System:** Complete (7 files, 1585 lines)
- **Completion:** 78% vs 15-part prompt spec

## Phase 1: Competitive Parity (27 hours)

### 1.1 NLQ — Natural Language Queries (4h)

**Why:** 5 competitors have it. 1000x impact.
**What:** Type "show Q3 revenue by region" → auto-chart
**Components:**

- `src/engines/NLQEngine.ts` — query parser, intent classifier, entity extractor
- `src/components/ui/NLQInput.tsx` — search bar with autocomplete
- `src/components/ui/NLQResult.tsx` — auto-rendered chart/table/KPI
- `src/components/ui/ChatPanel.tsx` — conversational interface
  **Dependencies:** AIEngine, FormulaEngine, chart components
  **Files:** 4 new, 2 modified

### 1.2 3-Statement Financial Model (4h)

**Why:** 20/25 competitors have it. Core FP&A.
**What:** Integrated P&L + Balance Sheet + Cash Flow with auto-linking
**Components:**

- `src/engines/ThreeStatementEngine.ts` — linking engine
- `src/pages/reports/ThreeStatementPage.tsx` — side-by-side view
- `src/components/reports/StatementLinker.tsx` — visual linking
  **Dependencies:** Existing financial engines
  **Files:** 2 new, 1 modified

### 1.3 Chart Integration (4h)

**Why:** 6 charts created but only 1 used. HIGH visual impact.
**What:** Wire charts throughout the app
**Changes:**

- DashboardPage: SparklineChart + GaugeChart
- BudgetVAReport: VarianceChart
- ScenarioListPage: TreemapChart
- ForecastPage: HeatmapChart
- Sector Pages: GaugeChart for KPIs
  **Files:** 0 new, 8 modified

### 1.4 Template Library (8h)

**Why:** 22/25 competitors have it. Speeds onboarding.
**What:** Pre-built templates for budgets, forecasts, reports
**Components:**

- `src/engines/TemplateEngine.ts` — load, instantiate, customize
- `src/config/templates/` — 16 industry templates
- `src/pages/templates/TemplateGalleryPage.tsx` — browse/select
- `src/components/templates/TemplatePreview.tsx` — preview
  **Dependencies:** Sector configs, budget/forecast engines
  **Files:** 20 new, 2 modified

### 1.5 Rolling/Driver/WhatIf UI (7h)

**Why:** Engines exist, UI missing. Quick wins.
**What:** Wire existing engines to UI
**Changes:**

- RollingForecastPage → wire to RollingForecastEngine
- DriverPlanningPage → wire to DriverCascadeEngine
- WhatIfPage → create slider UI + wire to WhatIfSandboxEngine
  **Files:** 1 new, 2 modified

### 1.6 Virtual Scrolling (2h)

**Why:** Enterprise scale. Pigment handles 500M+ cells.
**What:** @tanstack/react-virtual for DataTable
**Changes:**

- DataTable component → add virtual scrolling for 100+ rows
  **Files:** 0 new, 1 modified

### 1.7 NLQ Chat Interface (4h)

**Why:** Modern UX expectation. Vena, Cube, Mosaic have it.
**What:** Chat-based financial queries
**Components:**

- `src/components/ui/ChatPanel.tsx` — chat interface
- `src/components/ui/ChatMessage.tsx` — message bubble
- `src/components/ui/ChatChart.tsx` — inline chart in chat
  **Dependencies:** NLQEngine
  **Files:** 3 new, 1 modified

## Phase 2: Enterprise Features (16 hours)

### 2.1 Zero-Based Budgeting (4h)

**Why:** Anaplan, OneStream, Oracle EPM have it.
**What:** Build budget from zero each period
**Changes:**

- BudgetEngine → add ZBB mode
- BudgetCreatePage → add ZBB toggle
  **Files:** 0 new, 2 modified

### 2.2 ERP Connectors (16h)

**Why:** ALL 25 competitors have this. Enterprise requirement.
**What:** REST API framework + QuickBooks/NetSuite adapters
**Components:**

- `src/engines/ConnectorEngine.ts` — generic REST connector
- `src/connectors/QuickBooksConnector.ts`
- `src/connectors/NetSuiteConnector.ts`
- `src/connectors/SalesforceConnector.ts`
- `src/pages/settings/ConnectorSettingsPage.tsx`
  **Files:** 5 new, 1 modified

## Phase 3: Polish & Scale (8 hours)

### 3.1 Template Customization (2h)

- Modify templates before applying
- Save custom templates

### 3.2 Chart Export (2h)

- PNG/SVG export for all charts
- One-click export to PDF

### 3.3 Chart Drill-down (2h)

- Click chart → detailed view
- Zoom, pan, filter

### 3.4 Performance Optimization (2h)

- Lazy loading for heavy pages
- Memoization for expensive calculations
- Bundle size optimization

## Build Order (Priority)

| #   | Feature                  | Effort | Impact | Dependencies      |
| --- | ------------------------ | ------ | ------ | ----------------- |
| 1   | NLQ                      | 4h     | 1000x  | AIEngine          |
| 2   | 3-Statement              | 4h     | HIGH   | Financial engines |
| 3   | Chart Integration        | 4h     | HIGH   | Chart components  |
| 4   | Virtual Scrolling        | 2h     | MEDIUM | DataTable         |
| 5   | Rolling/Driver/WhatIf UI | 7h     | MEDIUM | Existing engines  |
| 6   | Template Library         | 8h     | MEDIUM | Sector configs    |
| 7   | NLQ Chat Interface       | 4h     | HIGH   | NLQEngine         |
| 8   | Zero-Based Budgeting     | 4h     | MEDIUM | BudgetEngine      |
| 9   | ERP Connectors           | 16h    | HIGH   | New framework     |
| 10  | Polish & Scale           | 8h     | MEDIUM | All above         |

**Total: ~65 hours**
**To dominate: ~27 hours (Phase 1)**

## Unique Advantages (Keep Safe)

These moats are things competitors CAN'T copy:

1. Offline-first (Tauri + IndexedDB)
2. Desktop app (native speed)
3. One-time price ($0 vs $50K+/yr)
4. 232 engines (4.6x Anaplan)
5. Plugin system (extensible)
6. WCAG 2.1 AA (accessibility)
7. 16 sectors (3x Anaplan)
8. Keyboard shortcuts (full system)
9. ESG reporting (built-in)

## Success Metrics

- [ ] NLQ works for 90% of common queries
- [ ] 3-statement model links automatically
- [ ] All 6 charts used in at least 3 pages each
- [ ] 16 industry templates available
- [ ] Virtual scrolling for 1000+ row tables
- [ ] Zero-based budgeting mode works
- [ ] QuickBooks connector functional
- [ ] Build passes, tests pass
