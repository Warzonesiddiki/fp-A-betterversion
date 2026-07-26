# AGENT 2 (ENGINES) — Detailed Execution Plan

YOUR MISSION: Every financial engine must be mathematically proven correct through exhaustive tests. You are responsible for the numerical soul of this application. One wrong formula = bad business decisions.

YOU OWN: `src/engines/*`, `src/workers/*`
YOU NEVER TOUCH: `src/store/*`, `src/pages/*`, `src/components/*`, `src/hooks/*`

## STRATEGY
Do NOT write tests for ALL 19 engines at once. Work in batches of 4-5 engines, verify build + tests pass, then move to next batch.

## TEST PATTERN (COPY THIS EXACTLY)
```typescript
import { describe, it, expect } from 'vitest'
import { CapExEngine } from './CapExEngine'

describe('CapExEngine', () => {
  // Happy path
  it('should calculate straight-line depreciation correctly', () => {
    const result = CapExEngine.calculateDepreciation({
      cost: 100000,
      salvageValue: 10000,
      usefulLife: 5,
      method: 'straight-line'
    })
    // (100000 - 10000) / 5 = 18000 per year
    expect(result.yearlyDepreciation).toBe(18000)
    expect(result.years).toHaveLength(5)
  })

  // Edge cases
  it('should handle zero salvage value', () => {
    const result = CapExEngine.calculateDepreciation({
      cost: 50000,
      salvageValue: 0,
      usefulLife: 10,
      method: 'straight-line'
    })
    expect(result.yearlyDepreciation).toBe(5000)
  })

  it('should throw on zero useful life', () => {
    expect(() => CapExEngine.calculateDepreciation({
      cost: 1000,
      salvageValue: 0,
      usefulLife: 0,
      method: 'straight-line'
    })).toThrow()
  })
})
```

## BATCH 1: Asset & Depreciation Engines

### `src/engines/CapExEngine.ts` → `CapExEngine.test.ts`
Test: `calculateDepreciation()` with all methods (straight-line, DDB, SYD, units-of-production)
- Edge cases: zero cost, zero salvage, zero life, negative values, partial-year depreciation
- Test: `calculateIRR()` with known IRR values (use textbook examples)
- Edge cases: all negative cashflows, all positive cashflows, single period, NaN guard

### `src/engines/DepreciationEngine.ts` → `DepreciationEngine.test.ts`
Test: Asset depreciation schedules, accumulated depreciation, net book value
- Edge cases: fully depreciated asset, impaired asset, disposed asset mid-year

### `src/engines/LeaseEngine.ts` → `LeaseEngine.test.ts`
Test: IFRS 16 / ASC 842 lease calculations, right-of-use asset, lease liability amortization
- Edge cases: zero lease payment, variable lease payments, lease modifications, short-term lease exemption
- Test: `calculatePresentValue()` with known discount rates

### `src/engines/DebtEngine.ts` → `DebtEngine.test.ts`
Test: Debt scheduling, interest calculation (simple vs compounding), amortization schedules
- Edge cases: zero interest rate, negative principal, balloon payment, prepayment penalty

## BATCH 2: Workforce & OpEx Engines

### `src/engines/HeadcountPlanningEngine.ts` → `HeadcountPlanningEngine.test.ts`
Test: HC planning, hires calculation, attrition modeling, ramp-up time
- Edge cases: zero headcount, 100% attrition rate, fractional FTEs

### `src/engines/PayrollEngine.ts` → `PayrollEngine.test.ts`
Test: Payroll calculations, taxes, benefits, bonuses, overtime
- Edge cases: minimum wage caps, benefit thresholds, zero-hour employees

### `src/engines/WorkforceEngine.ts` → `WorkforceEngine.test.ts`
Test: Productivity modeling, utilization rates, capacity planning
- Edge cases: 0% utilization, 100%+ utilization (overcapacity), seasonal workforce

### `src/engines/OpExEngine.ts` → `OpExEngine.test.ts`
Test: Operating expense planning, fixed vs variable cost modeling, escalation rates
- Edge cases: zero escalation, negative escalation, zero base cost

## BATCH 3: Revenue & SaaS Engines

### `src/engines/RevenueEngine.ts` → `RevenueEngine.test.ts`
Test: Revenue forecasting, recurring revenue, one-time revenue, revenue recognition (ASC 606)
- Edge cases: zero revenue, negative growth rate, churn rate > 100%

### `src/engines/SaaSMetricsEngine.ts` → `SaaSMetricsEngine.test.ts`
Test: MRR/ARR calculation, churn rate, LTV, CAC, quick ratio, net dollar retention
- CRITICAL: Test zero-churn quick ratio (should handle Infinity gracefully, not return 0)
- Edge cases: zero customers, zero revenue, infinite LTV (zero churn)

### `src/engines/COGSVarianceEngine.ts` → `COGSVarianceEngine.test.ts`
Test: COGS variance analysis, material/ labor/ overhead variance decomposition
- Edge cases: zero standard cost, zero actual cost, negative variances

## BATCH 4: Financial & Period Engines

### `src/engines/CostAllocationEngine.ts` → `CostAllocationEngine.test.ts`
Test: Cost allocation by various drivers (headcount, revenue, square footage, etc.)
- Edge cases: zero driver value, 100% to one department, negative allocation

### `src/engines/DataLineageEngine.ts` → `DataLineageEngine.test.ts`
Test: Data provenance tracking, transformation chains, source verification
- Edge cases: circular references, missing source data, multiple transformations

### `src/engines/PeriodCloseEngine.ts` → `PeriodCloseEngine.test.ts`
Test: Month-end close checklists, approval workflows, close status tracking
- Edge cases: already closed period, re-opening a closed period, partial close

### `src/engines/FiscalCalendar.ts` → `FiscalCalendar.test.ts`
Test: Custom fiscal calendar generation (4-4-5, 4-5-4, 13-period), period mapping
- Edge cases: leap years, year boundary transitions, multi-year calendars, 53-week year

## BATCH 5: Utility & Export Engines

### `src/engines/ExportEngine.ts` → `ExportEngine.test.ts`
Test: PDF export, Excel export (now lazy-loaded), data formatting for export
- Edge cases: empty data, very large datasets, special characters in data
- NOTE: ExportToExcel is now async (lazy-loaded), test accordingly

### `src/engines/ExcelKeyboardEngine.ts` → `ExcelKeyboardEngine.test.ts`
Test: Keyboard navigation simulation, cell selection, formula entry
- Edge cases: out-of-bounds navigation, invalid cell references

### `src/engines/CustomFieldEngine.ts` → `CustomFieldEngine.test.ts`
Test: Custom field creation, validation, data type handling, formula custom fields
- Edge cases: duplicate field names, invalid field types, circular formula references

### `src/engines/FormulaEngine.ts` → EXPAND `FormulaEngine.test.ts`
Existing tests cover basic parsing. Add:
- Edge cases: deeply nested parentheses, very long formulas, division by zero in formula
- Complex formulas with multiple operators and functions

## QUALITY GATE
After EACH batch:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
npx vitest run 2>&1 | Select-Object -Last 10
```
Build + ALL 178+ tests must pass before starting next batch.
