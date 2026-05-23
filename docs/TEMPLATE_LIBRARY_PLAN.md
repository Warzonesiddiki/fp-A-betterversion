# FinPlan Pro — Template Library Plan

## Executive Summary

22/25 FP&A competitors offer pre-built templates. FinPlan Pro has zero. This plan designs a template system covering 16 industry sectors with budget, forecast, and report templates — totaling **128 templates**.

---

## 1. Template Engine Architecture

### 1.1 Core Components

```
src/templates/
├── engine/
│   ├── TemplateEngine.ts          # Load, instantiate, validate templates
│   ├── TemplateRegistry.ts        # Register all templates by category
│   └── TemplateSerializer.ts      # Export/import templates as JSON
├── types.ts                       # Template type definitions
├── budget/                        # Budget templates (16 sectors)
├── forecast/                      # Forecast templates (5 types)
├── report/                        # Report templates (6 types)
└── gallery/                       # Template gallery UI components
    ├── TemplateGalleryPage.tsx
    ├── TemplatePreviewCard.tsx
    ├── TemplateCustomizer.tsx
    └── TemplateCategoryFilter.tsx
```

### 1.2 Template Type Definitions

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'budget' | 'forecast' | 'report';
  sector: string;                    // 'technology' | 'manufacturing' | ... | 'general'
  difficulty: 'starter' | 'standard' | 'advanced';
  tags: string[];
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  previewImage?: string;             // Base64 or URL
  config: TemplateConfig;
}

interface BudgetTemplate extends Template {
  category: 'budget';
  config: {
    accounts: TemplateAccount[];     // Pre-configured GL accounts
    lineItems: TemplateLineItem[];   // Budget line items with formulas
    drivers: TemplateDriver[];       // Budget drivers
    assumptions: TemplateAssumption[];
    periods: number;                 // 12 months, 4 quarters, etc.
    currency: string;
  };
}

interface ForecastTemplate extends Template {
  category: 'forecast';
  config: {
    forecastType: 'rolling' | 'driver-based' | 'scenario' | 'monte-carlo';
    periods: number;
    drivers: TemplateDriver[];
    scenarios: TemplateScenario[];
    formulas: Record<string, string>;
  };
}

interface ReportTemplate extends Template {
  category: 'report';
  config: {
    reportType: 'income-statement' | 'balance-sheet' | 'cash-flow' | 'variance' | 'dashboard' | 'board-pack';
    sections: ReportSection[];
    charts: ChartConfig[];
    kpis: string[];                  // KPI IDs from sector config
    formatting: ReportFormatting;
  };
}
```

---

## 2. Budget Templates (16 × 3 = 48 templates)

Each sector gets 3 budget templates: **Starter**, **Standard**, **Advanced**.

### 2.1 Technology / SaaS

| Template | Description | Line Items |
|----------|-------------|------------|
| SaaS Starter Budget | Basic ARR/MRR budget for seed-stage startups | Revenue (MRR×12), COGS (hosting+support), OpEx (eng/s&m/g&a), Headcount |
| SaaS Standard Budget | Series A-C budget with unit economics | + LTV/CAC, Magic Number, Rule of 40, department budgets |
| SaaS Advanced Budget | Enterprise SaaS with multi-product, multi-geo | + Revenue by segment, geo expansion, product P&Ls, cohort analysis |

### 2.2 Banking / Financial Services

| Template | Description | Line Items |
|----------|-------------|------------|
| Banking Starter | Community bank budget | NII, Non-II, Provision, Non-IE, Capital |
| Banking Standard | Regional bank with ALM | + NIM, CET1, NPL, LDR, efficiency ratio |
| Banking Advanced | Large bank with trading/investment banking | + Trading revenue, IB fees, CECL, stress testing |

### 2.3 Manufacturing

| Template | Description | Line Items |
|----------|-------------|------------|
| Manufacturing Starter | Basic production budget | Revenue, COGS (materials+labor+overhead), inventory |
| Manufacturing Standard | Multi-product with BOM | + Bill of materials, capacity planning, yield rates |
| Manufacturing Advanced | Multi-plant with lean metrics | + OEE, scrap rate, cycle time, supply chain |

### 2.4–2.16 (Remaining 13 Sectors)

Each follows same Starter/Standard/Advanced pattern with sector-specific accounts:

- **Retail**: Store sales, e-commerce, inventory turns, GMROI
- **Healthcare**: Patient revenue, payer mix, occupancy, case mix
- **Energy**: Production volume, lifting cost, reserve life, BOE
- **Real Estate**: NOI, cap rate, occupancy, DSCR, LTV
- **Construction**: WIP, overbilling, job cost, change orders
- **Insurance**: Loss ratio, combined ratio, retention, expense ratio
- **Telecom**: ARPU, churn, subscriber growth, network capex
- **Logistics**: Revenue per shipment, fleet utilization, cost per mile
- **Hospitality**: RevPAR, ADR, occupancy rate, GOPPAR
- **Government**: Fund accounting, appropriations, encumbrances
- **Education**: Enrollment, tuition revenue, research grants, endowment
- **Agriculture**: Crop yield, commodity prices, land value, equipment

---

## 3. Forecast Templates (5 × 3 = 15 templates)

| Template | Description | Engine |
|----------|-------------|--------|
| Rolling Forecast Starter | 12-month rolling with manual inputs | RollingForecastEngine |
| Rolling Forecast Standard | 18-month rolling with auto-seeding | + BudgetStore integration |
| Rolling Forecast Advanced | Multi-year rolling with scenarios | + ScenarioEngine |
| Driver-Based Starter | 3-5 drivers linked to P&L | DriverCascadeEngine |
| Driver-Based Standard | 10+ drivers with cascading rules | + FormulaEngine |
| Driver-Based Advanced | Full driver model with sensitivity | + SensitivityEngine |
| Scenario Planning Starter | Base/Best/Worst cases | ScenarioEngine |
| Scenario Planning Standard | 5+ scenarios with probability weighting | + MonteCarloEngine |
| Scenario Planning Advanced | Monte Carlo with 1000+ simulations | + AnomalyDetectionEngine |
| What-If Starter | Single-variable what-if | WhatIfSandboxEngine |
| What-If Standard | Multi-variable with sliders | + SensitivityEngine |
| What-If Advanced | Cross-impact analysis | + MonteCarloEngine |
| Zero-Based Budget | Build from zero each period | Custom |
| Incremental Budget | Prior year +/- % | BudgetStore |
| Activity-Based Budget | Cost per activity driver | DriverCascadeEngine |

---

## 4. Report Templates (6 × 3 = 18 templates)

### 4.1 Financial Statements

| Template | Description | Sections |
|----------|-------------|----------|
| Income Statement | Standard P&L | Revenue, COGS, Gross Profit, OpEx, EBITDA, Net Income |
| Balance Sheet | Standard BS | Assets (CA + NCA), Liabilities (CL + NCL), Equity |
| Cash Flow Statement | Standard CF | Operating, Investing, Financing, Net Change |

### 4.2 Management Reports

| Template | Description | Sections |
|----------|-------------|----------|
| Variance Report | Budget vs Actual | Revenue variance, Expense variance, Volume/Price/Mix |
| Dashboard Report | KPI overview | Sector KPIs, trend charts, variance indicators |
| Board Pack | Executive summary | 3-statement summary, KPIs, commentary, outlook |

### 4.3 Specialized Reports

| Template | Description | Sections |
|----------|-------------|----------|
| SaaS Metrics Report | ARR/MRR/NRR/LTV/CAC | Cohort analysis, unit economics, growth metrics |
| Consolidation Report | Multi-entity | IC eliminations, currency translation, minority interest |
| Compliance Report | SOX/audit trail | Controls, exceptions, remediation |
| ESG Report | Environmental/Social/Governance | Carbon, diversity, governance metrics |
| FX Exposure Report | Currency risk | Exposure by currency, hedging positions, P&L impact |
| Workforce Report | Headcount & comp | FTEs, cost per FTE, turnover, productivity |

---

## 5. Template Gallery UI

### 5.1 Template Gallery Page

```
src/pages/templates/TemplateGalleryPage.tsx
```

**Layout:**
- Header: "Template Library" with search bar
- Category tabs: Budget | Forecast | Report | All
- Sector filter: Dropdown with 16 sectors + "All"
- Difficulty filter: Starter | Standard | Advanced
- Grid of TemplatePreviewCard components

### 5.2 Template Preview Card

```
src/templates/gallery/TemplatePreviewCard.tsx
```

**Props:**
- template: Template
- onSelect: (template: Template) => void
- onPreview: (template: Template) => void

**Card content:**
- Preview thumbnail (wireframe of the template)
- Template name + description
- Sector badge + difficulty badge
- "Use Template" button
- "Preview" button

### 5.3 Template Customizer

```
src/templates/gallery/TemplateCustomizer.tsx
```

**Steps:**
1. Select template
2. Choose sector (pre-selected based on template)
3. Set fiscal year and currency
4. Customize accounts (add/remove/reorder)
5. Set assumptions (growth rates, headcount plans)
6. Preview generated budget/forecast/report
7. Create

### 5.4 Template Category Filter

```
src/templates/gallery/TemplateCategoryFilter.tsx
```

**Filters:**
- Category: Budget / Forecast / Report
- Sector: 16 sectors + General
- Difficulty: Starter / Standard / Advanced
- Tags: SaaS, Multi-entity, Compliance, etc.

---

## 6. Template Customization Flow

```
User clicks "Use Template"
    ↓
TemplateCustomizer opens
    ↓
Step 1: Select Sector (pre-filled)
    ↓
Step 2: Set Basic Info (name, year, currency)
    ↓
Step 3: Customize Accounts (add/remove/edit)
    ↓
Step 4: Set Assumptions (growth %, headcount, etc.)
    ↓
Step 5: Preview (see generated budget/forecast/report)
    ↓
Step 6: Confirm & Create
    ↓
Budget/Forecast/Report created in store
    ↓
Navigate to created item
```

---

## 7. Template Sharing

### 7.1 Export

- Export template as JSON file
- Include all config, accounts, formulas, assumptions
- File extension: `.fp-template`

### 7.2 Import

- Import `.fp-template` files
- Validate schema before import
- Merge with existing templates (deduplicate by ID)

### 7.3 Template Marketplace (Future)

- Community templates
- Rating system
- Featured templates
- Sector-specific collections

---

## 8. Implementation Plan

### Phase 1: Core Engine (8 hours)

| Task | Hours | Files |
|------|-------|-------|
| Template types | 1 | src/templates/types.ts |
| TemplateEngine | 2 | src/templates/engine/TemplateEngine.ts |
| TemplateRegistry | 1 | src/templates/engine/TemplateRegistry.ts |
| TemplateSerializer | 1 | src/templates/engine/TemplateSerializer.ts |
| Template store | 2 | src/store/templateStore.ts |
| Unit tests | 1 | src/templates/**/*.test.ts |

### Phase 2: Budget Templates (12 hours)

| Task | Hours | Files |
|------|-------|-------|
| Technology templates (3) | 2 | src/templates/budget/technology.ts |
| Banking templates (3) | 1.5 | src/templates/budget/banking.ts |
| Manufacturing templates (3) | 1.5 | src/templates/budget/manufacturing.ts |
| Remaining 13 sectors (39) | 6 | src/templates/budget/*.ts |
| Budget template tests | 1 | src/templates/budget/*.test.ts |

### Phase 3: Forecast Templates (6 hours)

| Task | Hours | Files |
|------|-------|-------|
| Rolling forecast templates (3) | 1 | src/templates/forecast/rolling.ts |
| Driver-based templates (3) | 1 | src/templates/forecast/driver-based.ts |
| Scenario templates (3) | 1 | src/templates/forecast/scenario.ts |
| What-if templates (3) | 1 | src/templates/forecast/what-if.ts |
| ZBB/Incremental/ABC (3) | 1 | src/templates/forecast/budget-methods.ts |
| Forecast template tests | 1 | src/templates/forecast/*.test.ts |

### Phase 4: Report Templates (6 hours)

| Task | Hours | Files |
|------|-------|-------|
| Financial statement templates (3) | 1.5 | src/templates/report/financial-statements.ts |
| Management report templates (3) | 1.5 | src/templates/report/management.ts |
| Specialized report templates (6) | 2 | src/templates/report/specialized.ts |
| Report template tests | 1 | src/templates/report/*.test.ts |

### Phase 5: Gallery UI (8 hours)

| Task | Hours | Files |
|------|-------|-------|
| TemplateGalleryPage | 2 | src/pages/templates/TemplateGalleryPage.tsx |
| TemplatePreviewCard | 1.5 | src/templates/gallery/TemplatePreviewCard.tsx |
| TemplateCustomizer | 2 | src/templates/gallery/TemplateCustomizer.tsx |
| TemplateCategoryFilter | 1 | src/templates/gallery/TemplateCategoryFilter.tsx |
| Wire to router | 0.5 | src/router.tsx |
| UI tests | 1 | src/templates/gallery/*.test.ts |

### Phase 6: Integration (4 hours)

| Task | Hours | Files |
|------|-------|-------|
| Wire to BudgetCreatePage | 1 | src/pages/budgets/BudgetCreatePage.tsx |
| Wire to ReportTemplateLibraryPage | 1 | src/pages/reports/ReportTemplateLibraryPage.tsx |
| Export/Import functionality | 1 | src/templates/engine/TemplateSerializer.ts |
| Integration tests | 1 | src/templates/**/*.test.ts |

---

## 9. Template Count Summary

| Category | Sectors | Per Sector | Total |
|----------|---------|------------|-------|
| Budget | 16 | 3 | 48 |
| Forecast | 5 types | 3 | 15 |
| Report | 6 types | 3 | 18 |
| General | 1 | varies | ~47 |
| **TOTAL** | | | **128** |

---

## 10. Total Effort: 44 hours

| Phase | Hours | Priority |
|-------|-------|----------|
| Core Engine | 8 | P0 |
| Budget Templates | 12 | P0 |
| Forecast Templates | 6 | P1 |
| Report Templates | 6 | P1 |
| Gallery UI | 8 | P0 |
| Integration | 4 | P1 |

---

## 11. Competitive Advantage

| Feature | FinPlan Pro | Anaplan | Planful | Vena |
|---------|-------------|---------|---------|------|
| Template count | 128 | ~50 | ~30 | ~40 |
| Sector coverage | 16 | 5 | 4 | 2 |
| Offline templates | ✅ | ❌ | ❌ | ❌ |
| Custom templates | ✅ | ✅ | ✅ | ✅ |
| Export/Import | ✅ | ❌ | ❌ | ❌ |
| One-time price | ✅ | $50K+/yr | $25K+/yr | $20K+/yr |

---

## 12. Key Design Decisions

1. **Sector-first**: Templates organized by sector, not by type
2. **Starter/Standard/Advanced**: Three tiers for each template category
3. **Engine integration**: Templates use existing engines (FormulaEngine, DriverCascadeEngine, etc.)
4. **Offline-first**: Templates stored locally, no cloud dependency
5. **Extensible**: Plugin system can add custom templates
6. **Exportable**: Templates can be shared as `.fp-template` files
