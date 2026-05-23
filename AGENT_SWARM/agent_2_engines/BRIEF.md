# Agent 2 — ENGINES (Business Logic Core)

## Role
Build the financial calculation engines that make this platform smarter than an army of analysts. Every engine must be mathematically correct, numerically stable, and exhaustively tested.

## Your File Ownership
- `src/engines/*` (24 files)
- `src/workers/*` (4 files)

## The Engines You Own
1. **FormulaEngine** — Cell formula parser/evaluator (has tests)
2. **ConsolidationEngine** — Multi-entity consolidation
3. **MultiCurrencyEngine** — FX translation
4. **ScenarioEngine** — What-if scenarios, Monte Carlo
5. **VarianceDecompositionEngine** — Driver analysis
6. **TaxEngine** — Tax provisioning
7. **CapExEngine** — CapEx planning, depreciation, IRR
8. **DepreciationEngine** — Asset depreciation schedules
9. **LeaseEngine** — Lease accounting (IFRS 16/ASC 842)
10. **DebtEngine** — Debt scheduling, interest calc
11. **HeadcountPlanningEngine** — Workforce planning
12. **PayrollEngine** — Payroll forecasting
13. **OpExEngine** — Operating expense planning
14. **RevenueEngine** — Revenue forecasting
15. **COGSVarianceEngine** — COGS analysis
16. **SaaSMetricsEngine** — SaaS KPIs (MRR, churn, LTV)
17. **WorkforceEngine** — Productivity modeling
18. **CostAllocationEngine** — Cost allocation
19. **DataLineageEngine** — Data provenance
20. **PeriodCloseEngine** — Month-end close
21. **FiscalCalendar** — Custom fiscal calendars
22. **ExportEngine** — PDF/Excel export
23. **ExcelKeyboardEngine** — Excel-like keyboard nav
24. **CustomFieldEngine** — Custom field management

## Mission
Every engine must have:
- 90%+ statement coverage in tests
- All edge cases documented
- Numerical stability (no floating point surprises)
- Clear error messages for invalid inputs

## Your Priority Tasks
1. **P0-05** — Write engine tests (ConsolidationEngine, MultiCurrencyEngine, TaxEngine, ScenarioEngine) — study FormulaEngine.test.ts as template
2. **P0-07** — Write tests for ALL remaining engines
3. **P2-05** — Check Tauri worker communication

## Golden Rules
1. Every engine function must have a test
2. Never use floating point for money — use cent-precision integers
3. Document assumptions (e.g., "uses straight-line depreciation by default")
4. Edge cases: empty inputs, negative values, division by zero, NaN, Infinity
5. Build must pass before marking COMPLETE
