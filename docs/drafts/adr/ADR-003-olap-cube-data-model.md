<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# ADR-003: OLAP cube as the primary data model

> _Status: Accepted · Date: 2026-06-12 · Author: Mnemosyne (Documentation & Architecture) · Cycle: FinPlan Pro Perfection Cycle 2026-06-12_
>
> **Draft note:** This is the canonical 5-ADR set triaged from the Mnemosyne audit. Apollo will move this file to `docs/adr/ADR-003-olap-cube-data-model.md` when staging.

---

## Context and Problem Statement

FinPlan Pro is an FP&A platform. Every page is some form of financial analysis: budget vs actual, P&L, balance sheet, cash flow, scenario comparison, variance analysis, driver tree, KPI dashboard. Underneath all of these is the same fundamental operation: **slice and dice a multi-dimensional numeric dataset by time, entity, account, product, customer, and scenario.**

We need a single **primary data model** that:

1. Models time-series multi-dimensional data (revenue by region by month, headcount by department by quarter)
2. Supports fast aggregation along any dimension hierarchy (roll-up, drill-down)
3. Supports multi-currency, multi-scenario, multi-version (actuals vs. budget vs. forecast)
4. Can be sliced, diced, pivoted, and rendered as tables, charts, and grids
5. Is the lingua franca for all 202 engines (so they share vocabulary, not each re-invent data shapes)
6. Persists to the user's filesystem via the cubeStore

We considered four options: tabular (DataFrame-style), event-sourced log, relational (SQLite-in-browser), and OLAP cube.

---

## Decision Drivers

- **Multi-dimensionality.** Time × Entity × Account × Scenario × Measure is 5+ axes; tabular pivots get unwieldy.
- **Aggregation speed.** A budget page renders 100+ cells. Naive re-aggregation per render is too slow.
- **Vocabulary unity.** 202 engines must share types: `Dimension`, `Member`, `Measure`, `Cell`. Without a common data model, each engine invents its own.
- **Hierarchy support.** Time: Year > Quarter > Month. Entity: Group > Region > Country > Cost Center. Account: Category > Subcategory > Account.
- **FP&A user mental model.** CFOs and FP&A analysts _think_ in cubes. The data model should match their mental model.
- **Serialization.** The cube must be persistable (with class instances excluded — see [ADR-002](/docs/adr/ADR-002-zustand-state-management.md)).

---

## Considered Options

1. **OLAP cube** (chosen)
2. Tabular (DataFrame)
3. Event-sourced log
4. Relational (SQLite in browser via sql.js)
5. Wide-table (one column per dimension member)

---

## Decision Outcome

**Chosen option: "OLAP cube"** — because the FP&A mental model is multi-dimensional, the 202 engines share this vocabulary, and the cube's `slice`/`dice`/`drillDown`/`rollUp` operations map 1:1 to the user-facing UI operations.

### The cube data model

```typescript
// src/engines/CubeEngine.ts
import { Dimension, Member, Measure, Cell, Cube } from '@/types/cube';

const time = new Dimension('time', [
  new Member('2024-Q1', { parent: '2024' }),
  new Member('2024-Q2', { parent: '2024' }),
  // ...
]);

const entity = new Dimension('entity', [
  new Member('group-na', { children: ['us', 'ca', 'mx'] }),
  new Member('us', { parent: 'group-na' }),
  // ...
]);

const measures = {
  revenue: new Measure('revenue', { unit: 'USD', aggregator: 'sum' }),
  cogs: new Measure('cogs', { unit: 'USD', aggregator: 'sum' }),
  headcount: new Measure('headcount', { unit: 'count', aggregator: 'sum' }),
};

const cube = new Cube({
  dimensions: [time, entity /* ... */],
  measures,
  cells: new Map(), // key = tuple of member IDs, value = measures
});

// Slice: revenue for 2024, NA region, all products
const revenue2024NA = cube.slice({ time: '2024', entity: 'group-na' }).measure('revenue');

// Drill-down: 2024 → Q1, Q2, Q3, Q4
const quarterlyRevenue = cube.drillDown({ time: '2024' }).measure('revenue');
```

### Anatomy of a cube

| Concept        | Definition                                                 | Example                                            |
| -------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| **Dimension**  | A categorical axis with a hierarchy                        | Time: Year > Quarter > Month                       |
| **Member**     | A node in a dimension's hierarchy                          | `'2024'`, `'2024-Q1'`, `'us'`, `'group-na'`        |
| **Measure**    | A numeric value with an aggregator                         | `revenue` (sum), `headcount` (sum), `margin` (avg) |
| **Cell**       | The intersection of one member per dimension × one measure | `revenue[2024, us, na, all-products] = $4.2M`      |
| **Slice**      | A 2D projection where one dimension is fixed               | "Revenue by month, fixed to US"                    |
| **Dice**       | A sub-cube where multiple dimensions are filtered          | "Revenue in 2024 for NA, in product lines A and B" |
| **Drill-down** | Move from parent to children in a hierarchy                | 2024 → Q1, Q2, Q3, Q4                              |
| **Roll-up**    | Move from children to parent in a hierarchy                | Q1+Q2+Q3+Q4 → 2024                                 |

### How 202 engines use the cube

The cube is the _primary_ data model — but not the only one. Engines layer on top:

- **AllocationEngine** reads from a cube, writes back to a cube
- **MonteCarloEngine** produces N scenario cubes (one per simulation run)
- **ConsolidationEngine** consolidates multiple entity cubes into a group cube (with IC elimination)
- **FXTranslationEngine** translates cube measures from local currency to presentation currency
- **DriverCascadeEngine** propagates a driver change through a driver-tree cube
- **VarianceEngine** produces a variance cube (actual vs. budget) by element-wise subtraction
- **ScenarioEngine** produces a scenario cube by applying overrides to a base cube
- **ProfitLossEngine** produces a P&L cube sliced by period
- **CapExEngine** reads capex projects and produces a depreciation cube
- **BreakEvenEngine** reads cost and revenue cubes to produce a break-even analysis

Every one of these 202 engines has the same `Cube` input shape and produces a `Cube` output shape. This is the **vocabulary unity** that made the engine layer tractable to build.

---

## Consequences

### Positive

- **Mental model match.** FP&A users _think_ in cubes. The data model matches their language.
- **Vocabulary unity.** 202 engines share types — `Dimension`, `Member`, `Measure`, `Cell`. No translation layer.
- **Multi-dimensional queries are first-class.** `slice`, `dice`, `drillDown`, `rollUp` are O(1) operations on a `Map<CellKey, CellValue>`.
- **Cross-engine composition.** `monteCarlo.consolidate(fx.translate(cube))` reads naturally.
- **Hierarchy support is built-in.** Time: Year > Quarter > Month. Account: Category > Subcategory.

### Negative

- **Sparsity.** Real-world financial cubes are sparse: a 5-year monthly × 50-account × 10-entity × 4-scenario cube has 120,000 cells but only 8% are populated. We use a `Map<CellKey, CellValue>` instead of a dense array.
- **Class instance persistence.** The cube is a class instance inside the cubeStore; `partialize` must exclude it (see [ADR-002](/docs/adr/ADR-002-zustand-state-management.md) for the partialize pattern).
- **Memory pressure.** A large cube (millions of cells) can hit the browser heap. We use Web Workers for cube construction and persistence (see ADR-007, ADR-010).
- **Single-source-of-truth rigidity.** If a future engine needs a non-cube shape (e.g. document store for notes), it must coexist with the cube as a separate store, not replace it.

### Neutral

- **Learning curve.** New contributors must learn cube operations before they can write a single engine. `docs/ONBOARDING.md` covers this in the 30-min path.
- **Type complexity.** `Dimension<TKey>`, `Member<TKey>`, `Measure<TUnit>`, `Cell<TKey, TValue>` — generic types add a layer of indirection.

---

## Pros and Cons of the Options

### Option 1: OLAP cube (chosen)

- ✅ Mental model match
- ✅ Vocabulary unity across 202 engines
- ✅ Fast multi-dimensional queries
- ❌ Sparsity requires care
- ❌ Single-source-of-truth rigidity

### Option 2: Tabular (DataFrame)

- ✅ Familiar to data scientists (pandas, dplyr)
- ✅ Generic algorithms
- ❌ Multi-dimensional pivots get unwieldy past 3 dimensions
- ❌ 202 engines would each invent their own column conventions

### Option 3: Event-sourced log

- ✅ Complete audit trail for free
- ✅ Time-travel debugging
- ❌ Aggregation requires full replay — too slow for 100+ cell renders
- ❌ Schema evolution is hard (every event shape is a contract)

### Option 4: Relational (SQLite in browser)

- ✅ SQL is a mature query language
- ✅ Joins and aggregations are first-class
- ❌ Schema migrations are heavyweight
- ❌ SQL syntax is not the FP&A mental model

### Option 5: Wide-table (one column per dimension member)

- ✅ Easy to render as a spreadsheet
- ❌ Cardinality explosion (50 accounts × 60 months = 3,000 columns)
- ❌ New dimensions require schema changes

---

## References

- **`src/engines/CubeEngine.ts`** — the centerpiece engine
- **`src/store/cubeStore.ts`** — wraps the cube, exposes via `getState().engine` (partialize-excluded)
- **`src/engines/`** — 201 sibling engines all read/write cubes
- **`docs/GLOSSARY.md`** — [Cube (OLAP)](#) term definition
- **ADR-002** — cubeStore persistence pattern (partialize + class instance)
- **ADR-004** — Decimal.js for currency measures in cubes
- **ADR-006** — schema migration for cube versions
- **ADR-007** — Web Workers for cube construction (memory pressure)
- **ADR-010** — Web Workers for cube aggregation
- **Hephaestus audit 2026-06-12** — `CubeEngine.ts:51-72` Kahan summation needed for floating-point drift on aggregated sums; this ADR's currency measure layer wraps Decimal.js (see ADR-004)
- **Athena v2 audit** — class instance serialization; cube is the canonical example
- **Prometheus audit** — bundle size; cube construction is a candidate for code-splitting (the cube store is in the main bundle; construction is lazy)
- **Mnemosyne audit 2026-06-12** — 202 engines, 35 stores, JSDoc on CubeEngine is missing (highest-value JSDoc target)

---

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-12 -->
