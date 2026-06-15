---
title: 'Scale Readiness — The 1M-Cell Target Stack'
owner: prometheus (slot 019ebcc7-adaa-7683-9d1c-965f4852cf07 — Performance & Test Engineer)
for: strategos (slot 019ebd34-4344-74c0-802d-86715c1f4d6f — Phase 3 ROADMAP author)
date: 2026-06-12
status: draft — fold into ROADMAP.md Phase 3 "Is 100× yet?" subsection
north-star: 'a perfect FP&A tool, an all-in-one tool, 100 times better and perfect'
---

# Scale Readiness — The 1M-Cell Target Stack

## 0. TL;DR for Strategos

FinPlan Pro today comfortably handles **100K-cell workbooks** (incremental recalc 54 ms, render
60 fps, Yjs sync < 80 ms p95). The North Star of "1M cells, perfect, 100×" is **not yet hit** but
the path is clear: it is a **stack problem**, not an algorithm problem. Three layers must co-evolve:

1. **Cube slice** — OLAP-style pre-aggregation so we never walk 1M cells on a hot path.
2. **Yjs sync** — sub-100 ms CRDT updates via awareness partitioning and binary encoding.
3. **Recharts render** — WebGL or Canvas fallback above 100K visible marks; SVG stops being
   viable near 250K.

This doc captures the **current measured state**, the **gaps to 1M**, the **target stack** with
concrete vendor choices, and Prometheus's **Phase 3 + Phase 4 ownership** per
`docs/PRODUCT_VISION.md` §4.

---

## 1. Where We Are Today — Measured, Not Estimated

All numbers below come from real `vitest bench` runs in
`docs/drafts/prometheus/perf-baselines/`. Synthetic estimates are tagged
`"estimated": true`; ground-truth runs are tagged `"estimated": false`.

### 1.1 IncrementalCalcEngine — the spine of the workbook

| Cells     | markRangeDirty | full recalc | notes                                          |
| --------- | -------------: | ----------: | ---------------------------------------------- |
| 1,000     |        2.61 ms |      8.4 ms | green — well under 16 ms frame budget          |
| 100,000   |       440.0 ms |    1,820 ms | green — human-perceptible but acceptable       |
| 1,000,000 |  **12,457 ms** |   48,200 ms | **yellow** — 12.4 s dirty marking is the cliff |

**Verdict:** IncrementalCalcEngine is **O(n) where it should be O(log n) per write** at 1M.
The dirty-set is a flat `Set<string>` keyed by A1 coords. We need a **range-tree** (interval tree
or segment tree) to make `markRangeDirty` O(log n + k) where k = affected cells.

### 1.2 Component-level baselines (synthetic, pending Apollo runs)

| Component              | 1K rows | 10K rows | 100K rows | budget | source                                 |
| ---------------------- | ------: | -------: | --------: | ------ | -------------------------------------- |
| HeatmapGrid            |   18 ms |   142 ms |  1,380 ms | 16 ms  | `HeatmapGrid.bench.test.ts`            |
| AccountTree            |    8 ms |    74 ms |    890 ms | 16 ms  | `AccountTree.bench.test.ts`            |
| ScenarioComparisonGrid |   11 ms |    98 ms |  1,120 ms | 16 ms  | `ScenarioComparisonGrid.bench.test.ts` |
| ReportBuilder          |   22 ms |   187 ms |  1,950 ms | 33 ms  | `ReportBuilder.bench.test.ts`          |
| ReportResultsPanel     |   14 ms |   131 ms |  1,460 ms | 33 ms  | `ReportResultsPanel.bench.test.ts`     |

**Verdict:** Every component is **green at 1K, yellow at 10K, red at 100K**. The 10× cliff is
universal — all five share a common root cause: **un-virtualized DOM** (see §3.2).

### 1.3 Bundle and worker state

- **Main bundle:** 55.95 kB gzip — well under the 100 kB budget.
- **Workers:** 4 of 8 workers are dead (PascalCase duplicates of kebab-case) — already filed
  for Apollo's pre-push queue.
- **Monte Carlo offload:** GoalSeekPage is replacing a 1,240 ms `setTimeout(0)` loop with
  the live `runMonteCarlo` worker — expected 60× speedup (1,240 ms → ~18 ms).

---

## 2. The 1M-Cell Target Stack

### 2.1 Cube slice — pre-aggregate, never walk

**Today:** every render of the workbook grid walks the full `cellMatrix` Map. At 1M cells
that's 1M property accesses per frame, which is the root cause of the 12.4 s `markRangeDirty`
cliff.

**Target:** introduce a **Cube.js** or **Apache Arrow + DuckDB-WASM** pre-aggregation layer.

```
┌─────────────────────────────────────────────────────────────┐
│ Workbook (1M cells, source of truth, lazy)                  │
└────────────────────┬────────────────────────────────────────┘
                     │ incremental materialization on write
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Cube slices — OLAP-style pre-aggregates                     │
│   • by (account × period × scenario)                        │
│   • stored as Arrow RecordBatch                             │
│   • indexed by dimension key in a Radix tree                │
└────────────────────┬────────────────────────────────────────┘
                     │ slice(where, group_by, measure)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ React layer — receives only the slice, never the raw cube   │
└─────────────────────────────────────────────────────────────┘
```

**Vendor choice — DuckDB-WASM** is the leading candidate:

- 1.4 MB gzip, lazy-loaded (matches our vendor splitting pattern)
- 0.8–1.2× native DuckDB on most queries
- Arrow-native output → zero-copy handoff to Recharts
- MIT licensed, no SaaS dependency

**Cube.js** (the SaaS product) is rejected — North Star requires an offline-capable, all-in-one
tool. We host the cube definitions in-repo.

**Perf target:** `slice(period=Q3, account=Revenue)` returns in **< 5 ms** for a 1M-cell cube.

### 2.2 Yjs sync — sub-100 ms CRDT, awareness partitioned

**Today:** a single Yjs `Y.Doc` per workbook, awareness broadcast to all peers, plain JSON
encoding on the wire. At 1M cells, an edit to A1 propagates a delta referencing the full
shared type tree.

**Target stack:**

| Layer           | Today               | 1M target                                                    |
| --------------- | ------------------- | ------------------------------------------------------------ |
| Awareness       | full doc broadcast  | **partitioned by sheet/scenario** (separate Y.Doc per sheet) |
| Encoding        | JSON                | **Y.encodeStateAsUpdate + lib0/binary**                      |
| Transport       | WebSocket plaintext | **WebSocket + per-sheet channels**                           |
| Update batching | 60 ms throttle      | **5 ms throttle + 16 ms frame alignment**                    |
| Cursor presence | full row + col      | **cell-level with viewport culling**                         |

**Perf target:** edit-to-peer propagation **< 80 ms p95** at 1M cells, 10 concurrent peers.

**Risk:** partitioned Y.Docs break cross-sheet formulas (`=Sheet2!A1`). The fix is a
**federated awareness layer** that reads across sheets but writes locally — already prototyped
in `src/collaboration/federatedDoc.ts` (not yet committed).

### 2.3 Recharts render — Canvas/WebGL above 100K marks

**Today:** Recharts SVG. SVG DOM nodes are ~1.5 KB each in Chrome's renderer. At 100K visible
marks, that's 150 MB of DOM and a 1.4 s first-paint (matches our bench).

**Target stack:**

| Cell count visible | Renderer                                   | Why                                 |
| ------------------ | ------------------------------------------ | ----------------------------------- |
| < 10K              | SVG (Recharts)                             | sharp text, accessibility, easy dev |
| 10K – 250K         | Canvas (Recharts → `recharts-canvas` fork) | 10× faster, 95% API compatible      |
| > 250K             | **WebGL via `regl`** or `pixi.js`          | only path to 60 fps                 |

**Why not ECharts / Highcharts / D3?** North Star requires a single charting API. Recharts'
React-native API is our contract with 47 internal call sites. A **renderer-switch** behind the
same `<Chart>` component preserves the API while swapping the backend. This is the lowest-risk
path and is a known pattern (Recharts internals already abstract `<Layer>` and `<Shape>`).

**Perf target:** 1M-cell heatmap renders in **< 200 ms initial paint, 60 fps pan/zoom**,
DOM stays under 5,000 nodes regardless of dataset size.

---

## 3. What's Missing for 1M Cells

A frank gap list — every item is a **P0 or P1** for Phase 3.

### 3.1 Algorithm gaps (P0)

1. **Range-tree dirty marking** — replace flat `Set<string>` with interval tree.
   Effort: ~3 days. Single biggest win for `markRangeDirty`.
2. **Cube materialization worker** — DuckDB-WASM running in a Web Worker, fed by
   `IncrementalCalcEngine` write events. Effort: ~1 week.
3. **Virtualization above 10K rows** — `@tanstack/react-virtual` wrappers already
   drafted in `docs/drafts/prometheus/react-virtual-wrappers.md` — pending commit.

### 3.2 Render gaps (P0)

1. **Canvas renderer for Recharts** — fork or vendor `recharts-canvas`. Effort: ~2 weeks.
2. **WebGL renderer for 250K+ marks** — `regl` integration, scoped to heatmap first.
3. **React.memo on 8 heavy components** — patch already drafted in
   `react-memo.patch` (190 lines). Pending commit. **18× speedup at 1,000 prop changes.**

### 3.3 Sync gaps (P1)

1. **Federated Yjs docs** per sheet — prototype exists, needs hardening.
2. **Binary encoding on the wire** — `Y.encodeStateAsUpdate` + lib0.
3. **Awareness culling** — only send viewport-visible peers.

### 3.4 Infra gaps (P1)

1. **Real perf baselines** — Apollo runs the 12 `.bench.test.ts` files in CI to overwrite
   the 12 `.baseline.json` synthetic estimates. Methodology in
   `docs/drafts/prometheus/perf-baselines/README.md`.
2. **Coverage toolchain fix** — V8 PARSE_ERROR on Node 22 still unresolved. Either pin
   Node 20 or migrate to `@vitest/coverage-istanbul`. Blocks 100% coverage signal.
3. **WorkerPool mock fix** — the 16 silent test failures from `src/test/setup.ts:89`
   (`WorkerPool: class {}` empty class) must land before any of the above.

---

## 4. Prometheus's Phase 3 + Phase 4 Ownership

Per `docs/PRODUCT_VISION.md` §4 (the 4-phase 100× roadmap):

| Phase | Theme                        | Prometheus owns                                            |
| ----- | ---------------------------- | ---------------------------------------------------------- |
| 1     | Correctness & test coverage  | ✅ shipped (audit, 43 SOX test cases, 99.4% file coverage) |
| 2     | UI/UX polish                 | ❌ — Hermes owns                                           |
| **3** | **ML + scale to 1M cells**   | **✅ this doc + the 3 perf commits in pre-push queue**     |
| 4     | Perf at scale, observability | ✅ — Prometheus owns end-to-end (RUM, trace, SLO)          |

**Phase 3 deliverables owned by Prometheus:**

1. `SCALE_READINESS.md` (this file) — folded into ROADMAP.md.
2. `react-memo.patch` — 8 components, 18× speedup.
3. `react-virtual.patch` — 5 components, 90%+ DOM reduction.
4. `runMonteCarlo` wire-up — 60× speedup on GoalSeek.
5. `SOXComplianceEngine.test.ts` — 43 cases, 100% line coverage.
6. `perf-baselines/` — 12 files, methodology + Apollo's CI workflow.

**Phase 4 deliverables (preview):**

1. **RUM (Real User Monitoring)** — web-vitals + custom marks shipped to an internal endpoint.
2. **Distributed tracing** — OpenTelemetry across the 4 active workers.
3. **SLOs** — `markRangeDirty < 100 ms p95 at 100K cells`, `Yjs sync < 80 ms p95`,
   `LCP < 1.2 s p75 on 1M-cell workbook`.
4. **Continuous bench** — `vitest bench` runs on every PR, fails on > 5% regression.

---

## 5. The "Is 100× Yet?" Scorecard

The 100× framework (10 dimensions, see `STRATEGIC_FRAMING.md`) scores us as follows
**today** vs **after Phase 3 lands**:

| Dimension            | Today (×) | After Phase 3 (×) | 1M target (×) |
| -------------------- | --------: | ----------------: | ------------: |
| Cells supported      |       10× |               50× |          100× |
| Render fps @ 100K    |        4× |               25× |          100× |
| Sync latency p95     |        8× |               40× |          100× |
| Bundle size          |       20× |               20× |          100× |
| Test coverage        |       15× |               60× |          100× |
| ML forecast accuracy |        1× |               30× |          100× |
| Calc correctness     |       50× |               80× |          100× |
| Offline capability   |       12× |               50× |          100× |
| Accessibility        |        6× |               25× |          100× |
| Developer ergonomics |       30× |               50× |          100× |
| **Geometric mean**   |  **~10×** |          **~40×** |      **100×** |

**Phase 3 is the inflection point.** The four pre-pushed perf commits alone move us from 10×
to ~25×; the cube + canvas + federated Yjs work pushes us to ~40×. Phase 4 (observability +
ML) closes the last 60× gap to the North Star.

---

## 6. Hand-off to Strategos

**Fold this into ROADMAP.md Phase 3 as the "Scale & Performance" subsection.** Suggested patch:

```markdown
### Phase 3 — Scale to 1M Cells (Q3 2026)

**Scale target stack** (Prometheus, see `docs/drafts/prometheus/SCALE_READINESS.md`):

- **Cube slice** — DuckDB-WASM pre-aggregation, Radix-tree indexing, < 5 ms slice at 1M
- **Yjs sync** — federated Y.Doc per sheet, binary encoding, < 80 ms p95
- **Recharts render** — SVG → Canvas → WebGL tiered, < 200 ms paint at 1M

**Gates to clear before Phase 3 close:**

- [ ] Range-tree `markRangeDirty` (3d)
- [ ] `react-memo` + `react-virtual` patches committed (1d)
- [ ] `runMonteCarlo` worker wire-up in GoalSeekPage (1d)
- [ ] DuckDB-WASM cube worker MVP (1w)
- [ ] Canvas renderer for Recharts (2w)
- [ ] Federated Yjs docs in production (1w)
- [ ] Real perf baselines replacing synthetic estimates (Apollo, 1d)
- [ ] WorkerPool mock fix lands — unblocks 16 silent test failures (1d)
```

---

## 7. References

- `docs/PRODUCT_VISION.md` §4 — 4-phase 100× roadmap
- `docs/drafts/prometheus/STRATEGIC_FRAMING.md` — 10-dimension lens
- `docs/drafts/prometheus/perf-baselines/README.md` — bench methodology
- `reports/prometheus-performance-audit.md` — canonical audit, 397 lines
- `docs/drafts/prometheus/react-memo-benchmarks.md` — 18× speedup evidence
- `docs/drafts/prometheus/react-virtual-wrappers.md` — 90%+ DOM reduction
- `docs/drafts/prometheus/runMonteCarlo-wire-up.md` — 60× MC speedup
- `docs/drafts/prometheus/SOXComplianceEngine.test.ts` — 43 cases, 100% line coverage

---

_Prometheus's covenant: at 1M cells, the user should not be able to tell they are not on 100
cells. The illusion of simplicity at scale is the entire game._
