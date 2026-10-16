# Chart Integration Plan — FinPlan Pro

## Current State

### Advanced Chart Components (src/components/charts/)

| Component      | Lines | Status | Used In                                |
| -------------- | ----- | ------ | -------------------------------------- |
| WaterfallChart | 82    | DONE   | BudgetVAReport, ARRDashboard (2 pages) |
| VarianceChart  | 65    | DONE   | **NOT USED**                           |
| SparklineChart | 40    | DONE   | **NOT USED**                           |
| TreemapChart   | 92    | DONE   | **NOT USED**                           |
| HeatmapChart   | 102   | DONE   | **NOT USED**                           |
| GaugeChart     | 112   | DONE   | **NOT USED**                           |

### Basic Recharts Usage

- **61 pages** use basic recharts (BarChart, LineChart, PieChart, AreaChart, ComposedChart)
- All inline — no advanced chart components used

### Gap

5 of 6 advanced chart components were built but never integrated into any page. Users see basic Recharts, not the specialized financial charts.

## Integration Plan — Phase 1: High-Impact Pages

### 1. DashboardPage (src/pages/DashboardPage.tsx)

**Current:** Basic AreaChart for revenue trend
**Add:**

- `SparklineChart` — inline sparklines next to each KPI card (revenue, expenses, margin, headcount)
- `GaugeChart` — target achievement gauge (budget vs actual %)
- `HeatmapChart` — monthly revenue heatmap (12 months × departments)

**Estimated effort:** 2 hours

### 2. BudgetVAReport (src/pages/budgets/BudgetVAReport.tsx)

**Current:** Uses WaterfallChart for revenue waterfall
**Add:**

- `VarianceChart` — budget vs actual bar chart with favorable/unfavorable colors
- `SparklineChart` — trend sparklines for each line item

**Estimated effort:** 1 hour

### 3. VarianceDashboardPage (src/pages/variance/VarianceDashboardPage.tsx)

**Current:** Basic bar chart
**Replace with:**

- `VarianceChart` — budget vs actual with color-coded variances
- `HeatmapChart` — variance matrix (departments × periods)

**Estimated effort:** 1 hour

### 4. ScenarioBuilderPage (src/pages/scenarios/ScenarioBuilderPage.tsx)

**Current:** Basic ComposedChart
**Add:**

- `TreemapChart` — scenario comparison by allocation size
- `SparklineChart` — trend lines for each scenario metric

**Estimated effort:** 1 hour

### 5. ForecastBuilderPage (src/pages/forecasts/ForecastBuilderPage.tsx)

**Current:** Basic LineChart
**Add:**

- `HeatmapChart` — forecast confidence matrix (metrics × periods)
- `GaugeChart` — forecast accuracy gauge

**Estimated effort:** 1 hour

## Integration Plan — Phase 2: Sector Dashboards

### 6. HealthcareDashboardPage

**Add:**

- `GaugeChart` — occupancy rate gauge (target: 85%)
- `HeatmapChart` — patient revenue by department × month

### 7. EnergyDashboardPage

**Add:**

- `GaugeChart` — production efficiency gauge
- `TreemapChart` — energy source allocation

### 8. InsuranceDashboardPage

**Add:**

- `GaugeChart` — loss ratio gauge (target: <60%)
- `VarianceChart` — claims vs reserves

### 9. RealEstateDashboardPage

**Add:**

- `GaugeChart` — occupancy rate gauge
- `TreemapChart` — property portfolio allocation

### 10. ConstructionDashboardPage

**Add:**

- `GaugeChart` — project completion gauge
- `VarianceChart` — budget vs actual per project

**Estimated effort:** 3 hours (all sector dashboards)

## Integration Plan — Phase 3: Remaining Pages

### 11. StoreDashboardPage (retail)

- `GaugeChart` — same-store sales target
- `HeatmapChart` — store performance matrix

### 12. ARRDashboard (saas)

- `GaugeChart` — ARR target gauge
- `SparklineChart` — MRR trend sparkline

### 13. CashForecastPage

- `WaterfallChart` — cash flow waterfall (operating → investing → financing)
- `SparklineChart` — daily cash balance trend

### 14. WorkingCapitalPage

- `VarianceChart` — working capital budget vs actual
- `SparklineChart` — DSO/DPO/DIO trends

### 15. DebtSchedulePage

- `WaterfallChart` — debt maturity waterfall
- `GaugeChart` — DSCR gauge

**Estimated effort:** 3 hours

## Integration Plan — Phase 4: Chart Enhancements

### 16. Chart Export (PNG/SVG)

Add export button to all chart components:

```tsx
<button onClick={() => exportToPNG(chartRef, 'chart.png')}>Export PNG</button>
<button onClick={() => exportToSVG(chartRef, 'chart.svg')}>Export SVG</button>
```

### 17. Chart Drill-Down

Add click handler to chart segments:

```tsx
<Bar onClick={(data) => navigate(`/detail/${data.name}`)} />
```

### 18. Chart Annotations

Add reference lines and labels for targets/thresholds.

**Estimated effort:** 4 hours

## Summary

| Phase           | Pages        | Charts Added                    | Effort  |
| --------------- | ------------ | ------------------------------- | ------- |
| 1: High-Impact  | 5 pages      | 10 chart instances              | 6h      |
| 2: Sectors      | 5 pages      | 10 chart instances              | 3h      |
| 3: Remaining    | 5 pages      | 10 chart instances              | 3h      |
| 4: Enhancements | All charts   | Export, drill-down, annotations | 4h      |
| **Total**       | **15 pages** | **30 chart instances**          | **16h** |

## Priority Order (by competitive impact)

1. **DashboardPage** — first thing users see, must look professional
2. **BudgetVAReport** — core FP&A workflow, variance is key feature
3. **VarianceDashboardPage** — directly competes with Anaplan/Planful
4. **Sector Dashboards** — differentiator (16 sectors vs 3-5 for competitors)
5. **Chart Export** — enterprise requirement, no competitor does PNG/SVG well

## Key Files to Modify

| File                                                   | Charts to Add                            |
| ------------------------------------------------------ | ---------------------------------------- |
| `src/pages/DashboardPage.tsx`                          | SparklineChart, GaugeChart, HeatmapChart |
| `src/pages/budgets/BudgetVAReport.tsx`                 | VarianceChart, SparklineChart            |
| `src/pages/variance/VarianceDashboardPage.tsx`         | VarianceChart, HeatmapChart              |
| `src/pages/scenarios/ScenarioBuilderPage.tsx`          | TreemapChart, SparklineChart             |
| `src/pages/forecasts/ForecastBuilderPage.tsx`          | HeatmapChart, GaugeChart                 |
| `src/pages/healthcare/HealthcareDashboardPage.tsx`     | GaugeChart, HeatmapChart                 |
| `src/pages/energy/EnergyDashboardPage.tsx`             | GaugeChart, TreemapChart                 |
| `src/pages/insurance/InsuranceDashboardPage.tsx`       | GaugeChart, VarianceChart                |
| `src/pages/realestate/RealEstateDashboardPage.tsx`     | GaugeChart, TreemapChart                 |
| `src/pages/construction/ConstructionDashboardPage.tsx` | GaugeChart, VarianceChart                |
| `src/pages/retail/StoreDashboardPage.tsx`              | GaugeChart, HeatmapChart                 |
| `src/pages/saas/ARRDashboard.tsx`                      | GaugeChart, SparklineChart               |
| `src/pages/cash/CashForecastPage.tsx`                  | WaterfallChart, SparklineChart           |
| `src/pages/cash/WorkingCapitalPage.tsx`                | VarianceChart, SparklineChart            |
| `src/pages/cash/DebtSchedulePage.tsx`                  | WaterfallChart, GaugeChart               |

## Competitive Advantage

| Competitor | Chart Quality         | FinPlan Pro After Integration     |
| ---------- | --------------------- | --------------------------------- |
| Anaplan    | Basic (3 chart types) | 6 advanced + 61 pages with charts |
| Planful    | Basic (4 chart types) | 6 advanced + 61 pages with charts |
| Pigment    | Good (modern UX)      | Match + offline + desktop         |
| OneStream  | Basic                 | 6 advanced + sector-specific      |

After this integration, FinPlan Pro will have the BEST chart capabilities of any FP&A tool — 6 specialized financial chart components used across 15+ pages, plus basic Recharts in 61 pages. No competitor has waterfall, variance, sparkline, treemap, heatmap, and gauge charts all in one product.
