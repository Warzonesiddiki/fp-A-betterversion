# FinPlan Pro — Part 5: Deep Gaps (45 items)

> **Source:** Deep technical audit
> **Date:** 2026-05-20

## CRITICAL (5)

### 1. Real-Time Co-Editing ❌ NEEDED
Two analysts editing same budget simultaneously needs:
- Operational Transform or CRDT layer (Automerge/Yjs)
- Presence awareness (colored cursors, cell borders)
- Cell-level locking (pessimistic) or merge (optimistic)
- Conflict resolution UI

### 2. Assumption Management ❌ NEEDED
- Track assumptions separately from calculations
- Version history for each assumption
- Impact analysis: "if growth changes from 8% to 10%, what happens?"
- Lock assumptions approved by board

**Status:** AssumptionEngine.ts being built by agent

### 3. Circular Reference Handling ✅ DONE
IterativeCalculationEngine.ts exists with convergence detection.

### 4. Freeze Panes in Grid ✅ BUILT
useFreezePanes.ts hook created.

### 5. Sign Convention Handling ✅ BUILT
SignConventionEngine.ts (151 lines).

## HIGH (20)

| # | Gap | Status |
|---|-----|--------|
| 6 | Entity-Level Locking | NEEDED |
| 7 | 3-Statement Building UX | NEEDED |
| 8 | Driver Library | NEEDED |
| 9 | Dimensional Modeling | NEEDED |
| 10 | Aggregate Tables | NEEDED |
| 11 | Find and Replace | BEING BUILT |
| 12 | Cell Protection | BEING BUILT |
| 13 | Group/Outline | NEEDED |
| 14 | Data Validation in Cells | NEEDED |
| 15 | XBRL Tagging | NEEDED |
| 16 | SOX Control Testing | NEEDED |
| 17 | External Data Feeds | NEEDED |
| 18 | Currency Precision | NEEDED |
| 19 | Functional vs Reporting Currency | NEEDED |
| 20 | Clipboard Intelligence | BEING BUILT |
| 21 | Multi-Select/Bulk Ops | BEING BUILT |
| 22 | Template Versioning | NEEDED |
| 23 | Fiscal Year Edge Cases | NEEDED |
| 24 | Health Check Dashboard | NEEDED |
| 25 | Export Safety Controls | NEEDED |

## MEDIUM (20)
Model branching, named ranges, auto-fill, sparklines in grids, period comparison, config import/export, environment separation, anomaly detection detail, benchmarking, report annotations, report version comparison, notification delivery chain, admin dashboard, etc.
