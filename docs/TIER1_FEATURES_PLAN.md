# Tier 1 Features Build Plan

## Current State

| Feature               | Engine                               | UI Page                                                   | Status            |
| --------------------- | ------------------------------------ | --------------------------------------------------------- | ----------------- |
| Rolling Forecasts     | RollingForecastEngine.ts (369 lines) | NO PAGE                                                   | NEEDS UI          |
| Driver-Based Planning | DriverCascadeEngine.ts (555 lines)   | DriverPlanningPage.tsx (881 lines)                        | WIRED             |
| What-If Sliders       | WhatIfSandboxEngine.ts (445 lines)   | SandboxMode.tsx exists, no page                           | NEEDS PAGE        |
| Tax Reporting         | TaxEngine.ts (123 lines)             | TaxProvisionPage.tsx (123), TransferPricingPage.tsx (145) | WIRED             |
| Virtual Scrolling     | N/A                                  | DataTable.tsx (272 lines)                                 | NEEDS LIBRARY     |
| Zero-Based Budgeting  | NO ENGINE                            | N/A                                                       | NEEDS ENGINE + UI |
| ERP Connectors        | NO ENGINE                            | N/A                                                       | NEEDS FRAMEWORK   |

## Build Order

### 1. Rolling Forecast Page (4 hours)

**Priority:** HIGH — engine exists, no UI
**Dependencies:** RollingForecastEngine.ts, glStore, forecastStore

**Files to create:**

- `src/pages/forecasts/RollingForecastPage.tsx` — main page

**Components to build:**

- Period selector (monthly/quarterly)
- Rolling forecast chart (actual + forecast line)
- Assumption editor (drivers, growth rates)
- Forecast vs actual comparison table
- Auto-extend forecast periods

**Integration:**

- Wire to RollingForecastEngine
- Wire to forecastStore
- Use existing Recharts LineChart

### 2. What-If Sliders Page (3 hours)

**Priority:** HIGH — engine exists, SandboxMode component exists
**Dependencies:** WhatIfSandboxEngine.ts, SandboxMode.tsx, DriverSlider.tsx

**Files to create:**

- `src/pages/scenarios/WhatIfPage.tsx` — main page

**Components to use:**

- SandboxMode.tsx — sandbox toggle banner
- DriverSlider.tsx — Radix UI sliders (already built)
- ScenarioComparisonGrid.tsx — side-by-side comparison

**Integration:**

- Wire to WhatIfSandboxEngine
- Wire to scenarioStore
- Use existing SandboxMode + DriverSlider

### 3. Virtual Scrolling (2 hours)

**Priority:** MEDIUM — DataTable needs it for 100+ rows
**Dependencies:** @tanstack/react-virtual (needs install)

**Steps:**

1. Install `@tanstack/react-virtual`
2. Add `useVirtualizer` hook to DataTable.tsx
3. Auto-enable for 100+ rows
4. Keep existing DataTable API unchanged

### 4. Zero-Based Budgeting (4 hours)

**Priority:** MEDIUM — new engine needed
**Dependencies:** budgetStore, glStore

**Files to create:**

- `src/engines/ZeroBasedBudgetEngine.ts` — ZBB engine
- `src/pages/budgets/ZeroBasedBudgetPage.tsx` — ZBB page

**Engine methods:**

- createZBBBudget(period, departments) — start from zero
- addLineItem(budgetId, category, amount, justification)
- compareWithIncremental(zbbBudgetId, incrementalBudgetId)
- approveLineItem(itemId, approverId)

**UI:**

- Line item table with justification column
- Approval workflow per line item
- Comparison with incremental budget

### 5. ERP Connectors (16 hours)

**Priority:** HIGH — enterprise requirement
**Dependencies:** REST API framework

**Files to create:**

- `src/engines/ERPConnectorEngine.ts` — base connector framework
- `src/engines/connectors/QuickBooksConnector.ts`
- `src/engines/connectors/NetSuiteConnector.ts`
- `src/engines/connectors/SalesforceConnector.ts`
- `src/pages/data/ERPConnectionPage.tsx` — connection management

**Framework:**

- Abstract base class: ERPConnector
- Methods: authenticate(), fetchAccounts(), fetchTransactions(), sync()
- OAuth2 flow for each provider
- Rate limiting and retry logic
- Data mapping from ERP schema to FinPlan schema

## Dependencies Between Features

```
Rolling Forecast ──► forecastStore, glStore
What-If Sliders ──► WhatIfSandboxEngine, SandboxMode, DriverSlider
Virtual Scrolling ──► @tanstack/react-virtual
Zero-Based Budget ──► budgetStore (NEW ENGINE)
ERP Connectors ──► REST framework (NEW ENGINE)
```

## Total Effort: ~29 hours

## Test Strategy

Each feature needs:

- Engine unit tests (vitest)
- Page smoke tests (vitest + @testing-library/react)
- Build verification (`npm run build`)
