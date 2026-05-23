# AGENT 3 (PAGES) — Detailed Execution Plan

YOUR MISSION: Replace 21 placeholder stub pages with real, interactive, beautiful financial dashboard content. Every page must look like it belongs in a world-class enterprise FP&A platform. An executive should be able to open any page and immediately understand their business.

YOU OWN: `src/pages/**/*.tsx` (content) — but ONLY the stub pages listed below
YOU NEVER TOUCH: `src/engines/*`, `src/store/*`, `src/components/ui/*` (use existing components only)

## TEMPLATE — Use this layout for EVERY page

```typescript
export default function EnergyDashboardPage() {
  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Energy Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor energy costs, carbon exposure, and renewable investments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker />
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Row — use existing KPIValue or Card components */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Energy Cost"
              value={totalCost}
              format="currency"
              trend={{ value: 5.2, direction: 'up' }}
            />
          </CardContent>
        </Card>
        {/* 3-4 more KPI cards */}
      </div>

      {/* 3. Main Chart — use Recharts components */}
      <Card>
        <CardHeader>
          <CardTitle>Energy Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="cost" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Detail Section — Table or breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Energy Type</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Cost</th>
                <th className="text-right py-2">Usage</th>
                <th className="text-right py-2">vs Budget</th>
              </tr>
            </thead>
            <tbody>
              {breakdownData.map(row => (
                <tr key={row.type} className="border-b last:border-0">
                  <td className="py-2">{row.type}</td>
                  <td className="text-right py-2">${row.cost.toLocaleString()}</td>
                  <td className="text-right py-2">{row.usage.toLocaleString()} kWh</td>
                  <td className="text-right py-2" style={{ color: row.variance > 0 ? 'red' : 'green' }}>
                    {row.variance > 0 ? '+' : ''}{row.variance}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
```

## IMPORTED COMPONENTS YOU CAN USE
From `src/components/ui/`:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Button` — with variant="outline" or variant="default"
- `Badge` — for status indicators
- `KPIValue` — for metric display (use: `label`, `value`, `format="currency|percent|number"`, `trend`)
- `Sparkline` — for mini trend charts
- `Select` — for dropdowns
- `Input` — for search/filter
- `Skeleton` — for loading states
- `PeriodPicker` — for date range selection
- `Toast` — for notifications
- `Breadcrumb` — for navigation

From `src/components/data/`:
- `DataTable` — for tabular data with sorting/filtering
- `FinancialTable` — for financial statements

From Recharts (import from 'recharts'):
- `ResponsiveContainer`, `AreaChart`, `BarChart`, `LineChart`, `PieChart`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `CartesianGrid`, `Area`, `Bar`, `Line`, `Pie`, `Cell`

## STUB PAGES TO REPLACE (read each one first, then rewrite)

### Domain 1: Energy (4 pages)
1. `src/pages/energy/EnergyDashboardPage.tsx` — Energy cost overview, consumption trends, carbon footprint, renewable mix
2. `src/pages/energy/RenewableEnergyPage.tsx` — Solar/wind/hydro generation, RECs, tax credits, ROI analysis
3. `src/pages/energy/EnergyRiskPage.tsx` — Price volatility, supply risk, hedging positions, scenario analysis
4. `src/pages/energy/EmissionsTradingPage.tsx` — Carbon credits, EU ETS compliance, offset portfolio, price forecasts

### Domain 2: Healthcare (4 pages)
5. `src/pages/healthcare/HealthcareDashboardPage.tsx` — Hospital financial health, revenue cycle, patient volume, cost per case
6. `src/pages/healthcare/PatientRevenuePage.tsx` — Payer mix, reimbursement rates, denial rates, net revenue by service
7. `src/pages/healthcare/ClinicalTrialCostPage.tsx` — Trial budgeting, patient accrual costs, site costs, phase-by-phase analysis
8. `src/pages/healthcare/ValueBasedCarePage.tsx` — Quality scores, shared savings, bundled payments, population health ROI

### Domain 3: Real Estate (4 pages)
9. `src/pages/realestate/RealEstateDashboardPage.tsx` — Portfolio metrics, occupancy rates, NOI, cap rates, lease expirations
10. `src/pages/realestate/PropertyPortfolioPage.tsx` — Property-by-property breakdown, valuations, debt metrics, renovation ROI
11. `src/pages/realestate/REITDashboardPage.tsx` — FFO, AFFO, dividend yield, NAV, portfolio diversification, debt ratios
12. `src/pages/realestate/FacilityManagementPage.tsx` — OpEx per sqft, maintenance costs, energy efficiency, space utilization

### Domain 4: Construction (3 pages)
13. `src/pages/construction/ConstructionDashboardPage.tsx` — Project pipeline, revenue backlog, margin analysis, resource utilization
14. `src/pages/construction/ProjectCostingPage.tsx` — Budget vs actual, change orders, cost codes, WIP analysis
15. `src/pages/construction/EquipmentManagementPage.tsx` — Fleet utilization, maintenance costs, equipment ROI, depreciation schedules

### Domain 5: Retail (3 pages)
16. `src/pages/retail/RetailDashboardPage.tsx` — Same-store sales, foot traffic, conversion rates, average transaction value
17. `src/pages/retail/InventoryPlanningPage.tsx` — Inventory turns, days on hand, stockout rates, DII analysis
18. `src/pages/retail/StorePerformancePage.tsx` — Per-store P&L, store clustering, square footage productivity, labor efficiency

### Domain 6: Insurance (3 pages)
19. `src/pages/insurance/InsuranceDashboardPage.tsx` — Combined ratio, premium growth, loss ratio, expense ratio, policy count
20. `src/pages/insurance/UnderwritingPage.tsx` — Loss pick analysis, rate adequacy, risk selection, portfolio mix
21. `src/pages/insurance/ClaimsAnalyticsPage.tsx` — Claim frequency/severity, reserve adequacy, claims processing time, fraud indicators

## CRITICAL RULES
1. EVERY page must include: header with KPIs → chart → detail table
2. Use inline mock data arrays — realistic values, realistic categories
3. Import PeriodPicker from `../../components/ui/PeriodPicker` (adjust path)
4. Do NOT import from engines or stores — use local mock data only
5. Run build after EVERY 3-4 pages, not after all 21

## QUALITY GATE
After every 3-4 pages:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
```
Build must pass before continuing.
