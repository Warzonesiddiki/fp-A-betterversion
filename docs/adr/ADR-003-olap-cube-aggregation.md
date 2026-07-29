---
date: 2026-05-25
type: adr
project: FinPlan Pro
tags: [finplan-pro, olap, cube, aggregation, rollup, drilldown, monte-carlo]
status: pending-ratification
adr-number: 003
ratification-date-target: 2026-06-22
ratification-gate: 2026-06-22T16:00:00Z
---

# ADR-003: OLAP Cube Aggregation Engine (4-Dimensional)

## Context

FinPlan Pro's 180+ pure calculation engines need OLAP-style aggregation for financial planning and analysis:

1. **Multi-dimensional analysis** — time × entity × scenario × metric
2. **Rollup operations** — quarter from months, year from quarters, total from entities
3. **Drill-down** — year → quarter → month → day; entity total → department → cost center → account
4. **Slice & dice** — filter on any dimension combination
5. **Pivot** — re-orient dimensions for different views
6. **Performance** — sub-500ms p95 on 10K row datasets
7. **Monte Carlo integration** — uncertainty quantification via 10K+ trial runs

Standard OLAP libraries were considered:

- **Apache Druid**: Heavy infrastructure dependency, not embedded
- **ClickHouse**: External service, requires deployment
- **Cube.js**: External service, complex setup
- **Pivottable.js**: UI-only, no engine layer
- **Custom OLAP cube (chosen)**: Tailored to our 4-dimensional financial cube, embedded, fast

## Decision

**Build a custom OLAP cube engine in `src/engines/olap/` as a 4-dimensional cube: time × entity × scenario × metric.**

```typescript
// src/engines/olap/OLAPCube.ts
export type CubeDimension = 'time' | 'entity' | 'scenario' | 'metric';
export type CubeCell = {
  [K in CubeDimension]: string | number;
} & { value: number };

export class OLAPCube {
  rollup(dimension: CubeDimension): CubeCell[];
  drillDown(dimension: CubeDimension, fromLevel: string): CubeCell[];
  slice(filters: Partial<Record<CubeDimension, string | number>>): CubeCell[];
  dice(filters: Array<Partial<Record<CubeDimension, string | number>>>): CubeCell[];
  pivot(fromDim: CubeDimension, toDim: CubeDimension): CubeCell[][];
  monteCarlo(trials: number, confidenceLevel: number): MonteCarloResult;
}
```

**Integration with 180+ engines:**

- All engines output to standard `CubeCell[]` shape
- Aggregation functions: sum, avg, count, min, max, stddev, var
- Web Worker pool + SharedArrayBuffer for performance (cross-ref T-PR-082)
- Decimal.js precision throughout (cross-ref ADR-004)

## Rationale

1. **Embedded**: No external infrastructure dependency — runs in browser + Tauri + offline mode
2. **TypeScript-first**: Full type safety with our 4-dimensional cube schema
3. **Performance**: Web Worker pool + SharedArrayBuffer + adaptive backpressure → sub-500ms p95 on 10K rows
4. **Decimal.js precision**: All values stored as Decimal.js, computed as Decimal.js — no float drift (cross-ref ADR-004)
5. **Monte Carlo integration**: Native `monteCarlo(trials, confidenceLevel)` method with antithetic variates for variance reduction
6. **Testability**: Pure functions + 4-dimensional schema = property-based testing via fast-check (cross-ref Athena T-3.14)
7. **Sector config validation**: 17 sectors × 15 metrics = 255 GREEN cells per Vesta v0.4 SECTOR_CONFIG @ 0782b121
8. **AG Grid + Recharts integration**: Cube output → AG Grid rows + Recharts series directly

## Consequences

### Positive

- **Single OLAP abstraction** — all 180+ engines output to standard `CubeCell[]`
- **Performance**: 50-user concurrent load + Monte Carlo 10K×5 = 50K trials p95 ≤500ms (verified per Vulcan T-2 T-PR-082 v0.5 1st witness 283L)
- **Decimal.js precision**: 255 GREEN cells per Vesta v0.4 — `$0.1 + $0.2 = $0.30` exact
- **Web Worker pool**: 4-worker pool + SharedArrayBuffer + adaptive backpressure
- **Monte Carlo**: Antithetic variates for variance reduction (T-PR-082 spec)
- **Property-based testing**: fast-check invariants on rollup/drill-down (cross-ref Athena T-3.14)
- **Mutation testing**: Stryker catches bugs in cube logic (cross-ref Athena T-3.13)

### Negative

- **Custom code** — we own the engine; bugs are our problem. Mitigation: 100% coverage on core operations + property-based testing
- **4 dimensions hard-coded** — adding a 5th dimension requires schema migration. Mitigation: cross-ref ADR-010 schema migration strategy
- **Memory pressure** — 10K rows × 4 dimensions × Monte Carlo = significant memory. Mitigation: streaming aggregations + Web Worker isolation
- **No SQL-like queries** — limited to the 4 OLAP operations. Mitigation: most FP&A use cases map to rollup/drill-down/slice/dice cleanly

## Implementation Notes

1. **Schema**: 4 dimensions — `time` (year/quarter/month/day) × `entity` (org/dept/cost-center/account) × `scenario` (baseline/best/worst/MC-trial) × `metric` (revenue/cost/EBITDA/cashflow/...)
2. **Cell type**: `{ time, entity, scenario, metric, value: Decimal }`
3. **Rollup**: time dimension → sum across child periods; quarter = sum(months); year = sum(quarters)
4. **Drill-down**: inverse of rollup — year → 4 quarters → 12 months → 365 days
5. **Slice**: filter on ONE dimension, return sub-cube
6. **Dice**: filter on MULTIPLE dimensions, return sub-cube
7. **Pivot**: re-orient dimensions — from time×entity to entity×time (transpose)
8. **Monte Carlo**: 10K+ trials × antithetic variates = 5K unique trials + 5K mirrored = full distribution
9. **Web Worker**: all aggregations run in Web Worker pool (4 workers) for sub-500ms p95
10. **Decimal.js**: all arithmetic via `Decimal.add`, `Decimal.mul`, etc. — no native floats

## Alternatives Considered

| Library                       | Pros                                 | Cons                                  | Verdict   |
| ----------------------------- | ------------------------------------ | ------------------------------------- | --------- |
| **Custom OLAP cube (chosen)** | Embedded, TS-first, tailored to FP&A | Custom code to maintain               | ✅ ACCEPT |
| Apache Druid                  | Battle-tested, scales to billions    | Heavy infra, not embedded             | ❌ REJECT |
| ClickHouse                    | Column-oriented, fast                | External service, requires deploy     | ❌ REJECT |
| Cube.js                       | Modern, REST API                     | External service, complex setup       | ❌ REJECT |
| Pivottable.js                 | UI-focused, simple                   | No engine layer                       | ❌ REJECT |
| Lodash aggregations           | Already in stack                     | Not multi-dimensional, no Monte Carlo | ❌ REJECT |

## References

- `src/engines/olap/OLAPCube.ts` (180+ engines)
- `scripts/perf/T-PR-082_LOAD_TEST_v0.5_pre-stage.md` (326L, perf spec)
- `docs/CAVEMAN_PERSIST/CYCLE_25_TURN_186_PLUS_VULCAN_T2_TPR082_v0_5_1ST_WITNESS_v0_1.md` (283L, perf validation)
- Vesta `SECTOR_CONFIG v0.4` (17×15=255 GREEN @ 0782b121)
- ADR-004 Decimal.js (cross-ref for precision)
- `docs/strategic/STRATEGIC_INDEX_v0_8.md` §3.5 (5 P0 ADRs dimension)

## Ratification Status

- **2026-05-25**: Drafted
- **2026-06-13**: Cycle 25 wave 6 ratified by 4-ICP framework
- **2026-06-18**: STRATEGIC_INDEX_v0.8.0 SHIP incorporates this ADR with 9.20/10 PLATINUM+ verdict
- **2026-06-22 16:00 UTC**: PENDING RATIFICATION GATE (Lead signature required)
