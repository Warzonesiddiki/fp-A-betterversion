---
date: 2026-05-19
type: feature-doc
project: FinPlan Pro
tags: [finplan-pro, formula, engine, excel-compatible]
status: complete
---

# Formula Engine

## Overview
245+ functions across 7 modules (5309 lines). Excel-compatible. Registry pattern with category modules. The [[plugin-system]] can extend this with custom formula functions. Results are visualized via [[charts]] components.

## Architecture

```
FormulaEngine.ts (524 lines) — Parser + evaluator + circular ref detection
  ├── FormulaFunctionRegistry.ts (321 lines) — Central registry, 6 category delegates
  └── formula-functions/
      ├── financial.ts (1358 lines, 55 exports) — PMT, FV, PV, NPV, IRR, XNPV, XIRR, SLN, DB, SYD, DDB, etc.
      ├── statistical.ts (1153 lines, 52 exports) — MEDIAN, STDEV, VAR, PERCENTILE, CORREL, NORMDIST, TTEST, etc.
      ├── math.ts (1280 lines, 43 exports) — SUM, AVERAGE, MIN, MAX, ROUND, SUMIF, SUMIFS, COUNTIF, etc.
      ├── text.ts (652 lines, 32 exports) — LEN, CONCATENATE, LEFT, RIGHT, MID, DATE, YEAR, MONTH, DAY, etc.
      ├── lookup.ts (292 lines, 20 exports) — VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP, OFFSET, INDIRECT
      ├── logical.ts (367 lines, 29 exports) — IF, IFS, AND, OR, NOT, SWITCH, IFERROR, IFNA, ISBLANK, etc.
      └── helpers.ts (207 lines, 14 exports) — Shared utilities, type definitions
```

## Key Design Decisions
- **Static methods**: Stateless, deterministic, testable
- **Registry pattern**: `FormulaFunctionRegistry.get("SUM")` → function implementation
- **Result objects**: `{success, value, error}` — never throw
- **DAG evaluation**: Dependency-sorted execution with circular reference detection
- **IEEE 754**: Floating point precision handled at display layer

## Circular Reference Support
- `analyzeForCircularReferences()` — Detects cycle groups
- `recalculateWithIterativeCalc()` — Iterative solver with configurable max iterations
- Uses `IterativeCalculationEngine` for convergence

## Test Coverage
- FormulaEngine.test.ts — Parser, evaluator, range handling
- Category module tests — Individual function tests
- 6256 total project tests pass
- Formula audit tracked by [[compliance]] engine
