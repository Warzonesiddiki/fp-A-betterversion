# 3-Statement Financial Model — Integration Plan

## Current State

### Engine: DONE (1076 lines, 10 linking rules)

- `src/engines/ThreeStatementEngine.ts` — Full implementation
- `src/engines/ThreeStatementEngine.test.ts` — 707 lines of tests
- **10 linking rules:**
  1. Net Income → Retained Earnings
  2. Depreciation → Accumulated Depreciation → CF Operating
  3. Amortization → Intangible Assets → CF Operating
  4. CapEx → Fixed Assets
  5. Working Capital → CF Operating (AR, Inventory, AP, Accruals)
  6. Debt → CF Financing
  7. Equity → CF Financing
  8. Interest → CF Operating
  9. Tax → CF Operating
  10. Dividends → Retained Earnings

### Pages: EXIST but NOT WIRED to ThreeStatementEngine

- `src/pages/reports/ProfitLossPage.tsx` — Standalone P&L from glStore
- `src/pages/reports/BalanceSheetPage.tsx` — Standalone BS from glStore
- `src/pages/reports/CashFlowPage.tsx` — Standalone CF from glStore

### Gap: No integrated 3-statement dashboard

## Plan

### Step 1: Create ThreeStatementDashboardPage.tsx

**File:** `src/pages/reports/ThreeStatementDashboardPage.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Three-Statement Model              [Export] [Period] │
├──────────────────┬──────────────────┬────────────────┤
│  P&L Statement   │  Balance Sheet   │  Cash Flow     │
│  ────────────    │  ──────────────  │  ──────────    │
│  Revenue         │  Current Assets  │  Operating     │
│  COGS            │  Non-Current     │  Investing     │
│  Gross Profit    │  Current Liab    │  Financing     │
│  OpEx            │  Non-Current Liab│  Net Change    │
│  EBIT            │  Equity          │  Ending Cash   │
│  Tax             │  ────────────   │                │
│  Net Income      │  A = L + E ✓    │                │
├──────────────────┴──────────────────┴────────────────┤
│ Link Validation                                      │
│ ✅ Net Income → Retained Earnings                    │
│ ✅ Depreciation → Accumulated Depreciation           │
│ ⚠️ CapEx → Fixed Assets (discrepancy: $5,000)       │
│ ✅ Working Capital → Operations                      │
├──────────────────────────────────────────────────────┤
│ Retained Earnings Roll-Forward                       │
│ Beginning RE: $100,000                               │
│ + Net Income: $50,000                                │
│ - Dividends: $10,000                                 │
│ = Ending RE: $140,000                                │
└──────────────────────────────────────────────────────┘
```

**Features:**

- Three columns: P&L, Balance Sheet, Cash Flow
- Period selector (month/quarter/year)
- Link validation panel with status indicators
- Retained Earnings roll-forward
- Balance check (A = L + E)
- Export to PDF/Excel
- Drill-down to individual statements

### Step 2: Wire ThreeStatementEngine to glStore

- Transform glStore entries into ThreeStatementEngine input format
- Use account code prefixes (1=assets, 2=liabilities, 3=equity, 4=revenue, 5=COGS, 6=expenses, 7=interest, 8=tax)
- Auto-calculate beginning retained earnings from prior period

### Step 3: Add route

- Add `/reports/three-statement` route
- Link from ReportsListPage

### Step 4: Add tests

- Unit tests for glStore → ThreeStatementEngine transformation
- Integration test for full 3-statement flow
- Smoke test for dashboard page

## Files to Create

1. `src/pages/reports/ThreeStatementDashboardPage.tsx` (~300 lines)

## Files to Modify

1. `src/router.tsx` — Add route
2. `src/pages/reports/ReportsListPage.tsx` — Add link

## Estimated Effort: 4 hours

## Risks

- glStore entries may not have detailed enough account codes for full linking
- Beginning retained earnings calculation needs prior period data
- Cash flow classification (operating/investing/financing) may need refinement
