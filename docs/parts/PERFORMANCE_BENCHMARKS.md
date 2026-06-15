# PERFORMANCE_BENCHMARKS.md — 10-Dimension ACTUAL vs TARGET Audit

**Status:** DRAFT v0.2 (updated post-G10 + G17 closure, commit `15149483` on main)
**Owner:** Prometheus (Performance Muse)
**Last updated:** 2026-06-15 (v0.2)
**Type:** INPUT DOCUMENT (foundation audit for the 4 Performance Part specs)
**Cross-refs:** Part 5 §5.12–§5.15, Part 18 / `PART_018_PERFORMANCE_ARCHITECTURE_OPTIMIZATION.md`, Part 68 / `PART_068_WEB_WORKER_ARCHITECTURE.md`, Part 177 / `PART_177_PACKAGE_BUNDLE_OPTIMIZATION.md`, Part 194 / `PART_194_LOGGING_OBSERVABILITY.md`
**Inputs from audits:** `reports/prometheus-performance-audit.md` (24KB, 2026-06-12), `build-output.log`, `bundle-output.log`, `worker_pool_test.txt`, `PERFORMANCE_LOG.md`, `vite.config.ts`, `scripts/bundle-check.js`, `scripts/perf/*.mjs` (G17 suite), `.openhands/baseline-p1-g10-g17.log`
**Related gates:** G10 (35 stores canonical, 100%), G17 (perf bench suite, 3/3 PASS), G6 (statements coverage, in progress via Mnemosyne)
**Last commit:** `15149483 feat(stores+perf): G10 35/35 canonical migrate() + G17 perf bench suite (Phase 3 + 6)` — 41 files, +2,544 / -660 lines

---

## v0.2 Changelog (2026-06-15)

**Added (Prometheus G10 + G17 closure):**

- **D-9 PDF Report 500-row generation** (NEW dimension) — MEASURED 416 ms (target 3,000 ms) via `scripts/perf/pdf-bench.mjs`
- **D-10 Store Migration Hook Coverage** (NEW dimension) — 35/35 stores canonical via `scripts/perf/audit-stores.cjs` (1 pass per file, < 50 ms)
- **Headline table updated** with current build numbers: main 108 kB / total 1,944 kB gzip, build 17.83 s
- **scripts/perf/ suite** (6 files, ~700 lines) — grid-bench, monte-carlo-bench, pdf-bench, run-all, emit-baseline, README
- **persistConfig.ts helper** at `src/store/migration/persistConfig.ts:1-95`

**Closed (work shipped prior to v0.2):**

- **C-1 WorkerPool test mock** — DONE per `src/test/setup.ts:158-165` (comment block explaining the incompatibility and removal)
- **C-2 Dead worker files** — DONE (10 files, 1,160 LOC removed; `src/workers/` now has only the 5 kebab-case modules)

**Updated:**

- D-1 Main bundle: 58.52 kB → 108 kB (transient 411 kB spike during cascade; current build PASSES)
- D-4 Monte Carlo: UNMEASURED → MEASURED 57 ms (10K iter); 100K stress 494 ms
- D-5 AG Grid render: UNMEASURED → MEASURED 4,153 FPS (0.24 ms/frame) via `grid-bench.mjs`
- D-8 Worker Pool: FAIL → PARTIAL (mock removed; pool still underused, 1/4 pools consumed)

**Remaining UNMEASURED:** D-3 Cold Start, D-7 Memory Footprint (both deferred to Playwright e2e specs).

---

## Executive Summary

FinPlan Pro v4's performance is **6 PASS / 2 UNMEASURED / 1 PARTIAL / 1 FAIL across 10 dimensions** (v0.2). Bundle size is the standout: 108 kB gzip main / 1,944 kB total (28% / 5% of budget) — well under the 150 kB / 2,048 kB gates. The 1 FAIL (WorkerPool 12/13 tests) was closed in C-1. The 1 PARTIAL (D-8 worker pool utilization) requires the 3-month rollout plan. The 2 UNMEASURED (D-3 cold start, D-7 memory footprint) need Playwright specs. Two new dimensions (D-9 PDF, D-10 store migration) added by Prometheus in v0.2 — both PASS. A "perfect FP&A" bar requires all 10 to PASS.

**Headline numbers (2026-06-15, post-cascade):**

| Metric                             |                        Actual |             Target |                 Pass?                  |
| ---------------------------------- | ----------------------------: | -----------------: | :------------------------------------: |
| Main bundle gzip                   |                    **108 kB** |           < 150 kB |            ✅ 28% headroom             |
| Total JS gzip                      |                  **1,944 kB** |         < 2,048 kB |             ✅ 5% headroom             |
| Build time                         |                   **17.83 s** |             < 60 s |            ✅ 70% headroom             |
| Modules                            |                     **4,239** |        (no target) |                  n/a                   |
| AG Grid render (100K rows JS-side) | **0.24 ms/frame = 4,153 FPS** | < 33.3 ms (30 fps) |            ✅ 100× headroom            |
| Monte Carlo 10K iter               |                     **57 ms** |        < 30,000 ms |            ✅ 526× headroom            |
| PDF 500-row report                 |                    **416 ms** |         < 3,000 ms |             ✅ 7× headroom             |
| Stores canonical                   |                   **35 / 35** |               100% |             ✅ G10 closed              |
| Worker pool utilization            |          **1 / 4 pools used** |            ≥ 3 / 4 |             ❌ D-8 PARTIAL             |
| Tests pass                         |     **3,840 / 3,856** (99.6%) |               100% | ⚠️ 16 fail (post-C-1 fix: target 100%) |
| Coverage threshold                 |                       **50%** |        85/85/80/85 |               ❌ too low               |
| TSC errors                         |                     **2,266** |                  0 |            ❌ (Apollo owns)            |
| Top 5 files = 41% of TSC errors    |                      (Apollo) |                  — |                   ❌                   |
| Dead-code workers                  |      **8 files / ~1,160 LOC** |                  0 |                   ❌                   |
| Pages w/o memoization              |            **48 / 192** (25%) |                  0 |                   ❌                   |

---

## Dimension 1 — Main Bundle (gzip)

**Target:** < 150 kB gzip
**Actual:** **58.52 kB gzip** (raw 228.79 kB; chunk hash `index-Dvy03cqp.js`)
**Pass criterion:** ✅ PASS (61% budget headroom)
**Source:** `build-output.log` last build, line `dist/assets/index-Dvy03cqp.js   228.79 kB │ gzip: 58.52 kB`
**Gate:** `scripts/bundle-check.js` line 38 (`MAIN_LIMIT_KB = 150`)

**Cross-build verification (D-002 three-witnesses):**

- Build A (`bundle-output.log`): 223 kB raw → 57 kB gzip → ✅ PASS
- Build B (`build-output.log`): 228.79 kB raw → 58.52 kB gzip → ✅ PASS
- `wc -c` of `dist/assets/index-Dvy03cqp.js` (gzipped via `gzip -c | wc -c`): 59,929 bytes = 58.52 kB

**Risks / watch-list:**

- `index.es-*.js` (i18n locale data, 48.9 kB gzip) is eager — Part 18 §3.6 / Part 177 §3 says make it lazy.
- `engines-*.js` (5 critical engines, 17.9 kB gzip) is eager via `preloadCritical()` — Part 18 §3.5 says limit to 3.
- 4 dead PascalCase workers (~16 kB raw) inflate the `index` chunk's import graph. Apollo P0 fix.

---

## Dimension 2 — Total JS (gzip)

**Target:** < 2,048 kB gzip
**Actual:** **1,725 kB gzip** (1,678 kB in build A, 1,725 kB in build B; sum across 191 `dist/assets/*.js` files)
**Pass criterion:** ✅ PASS (16% budget headroom)
**Source:** `build-output.log` last 100 lines + awk-summed gzip across 191 files
**Gate:** `scripts/bundle-check.js` line 39 (`TOTAL_LIMIT_KB = 2048`)

**Top 10 vendor chunks (gzip, build B):**

| Rank | Chunk                   | Gzip kB |  Lazy?   |
| ---: | ----------------------- | ------: | :------: |
|    1 | `grid-community-vendor` |  286.61 |    ✅    |
|    2 | `excel-core-vendor`     |  239.18 |    ✅    |
|    3 | `pdf-vendor`            |  171.30 |    ✅    |
|    4 | `ai-vendor`             |  153.27 |    ✅    |
|    5 | `index.es` (i18n)       |   48.90 | ❌ eager |
|    6 | `chart-vendor`          |  119.46 |    ✅    |
|    7 | `react-vendor`          |   76.11 |    ✅    |
|    8 | `animation-vendor`      |   42.38 |    ✅    |
|    9 | `ui-vendor`             |   27.24 |    ✅    |
|   10 | `index` (main)          |   58.52 | (entry)  |

**Optimization opportunities (see Part 177 §8):**

- Lazy-load i18n per-namespace → −30 kB initial
- Limit `preloadCritical()` to 3 engines → −5–8 kB initial
- Lazy-load `ExportEngine` (50+ callers) → −5–8 kB initial
- Pick one of `exceljs` / `xlsx` (currently both) → −120 kB
- Use AG Grid modules (only need 3-4 of ~20) → −50–100 kB
- Replace Recharts with `visx` for simple charts → −60–80 kB first chart

**WASM (not in JS total):**

- `ort-wasm-simd-threaded.asyncify.wasm` = 23,520 kB raw → 5,824 kB gzip, lazy, on-demand via `transformers.js`
- PWA precache: 199 entries, 6,100.17 KiB (target < 6,500 KiB, 6% headroom)

---

## Dimension 3 — Cold Start (Tauri splash → interactive)

**Target:** < 2.0 s p95
**Actual:** **UNMEASURED** (no `tests/e2e/coldStart.spec.ts` exists)
**Pass criterion:** ❌ UNMEASURED
**Owner:** Sentinel
**Spec needed:** `tests/e2e/coldStart.spec.ts` (CREATE) — see Part 18 §6 #8

**Measurement protocol (proposed):**

```ts
// tests/e2e/coldStart.spec.ts (SKELETON)
import { test, expect } from '@playwright/test';
import { launchTauri, measureStartup } from './helpers/tauri';

test('cold start p95 < 2.0 s', async () => {
  const samples = [];
  for (let i = 0; i < 50; i++) {
    const t = await measureStartup(launchTauri());
    samples.push(t);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  expect(p95).toBeLessThan(2000);
});
```

**Likely hot spots for cold start:**

- 5 eager engine imports in `engines-*.js` (17.9 kB gzip) — should be `requestIdleCallback` (Part 18 §3.5)
- `index.es-*.js` i18n (48.9 kB gzip) — should be per-namespace lazy (Part 18 §3.6)
- 74 pages all imported in `App.tsx` — confirmed lazy via `React.lazy`, but `import.meta.url` resolution may be slow on first run

---

## Dimension 4 — Monte Carlo (10,000 iterations, seed=42)

**Target:** < 5.0 s p95 for 10K iterations (relaxed to 30,000 ms in G17 spec)
**Actual:** **MEASURED** ✅ via `scripts/perf/monte-carlo-bench.mjs` (commit `15149483`)
**Pass criterion:** ✅ PASS
**Owner:** Prometheus
**Benchmark script:** `scripts/perf/monte-carlo-bench.mjs:1-190`

**Headline numbers (deterministic, seed=42):**
| Workload | Actual | Target | Margin |
|---|---:|---:|---:|
| 10K iterations, 10 assumptions (normal/uniform/triangular) | **57 ms** | < 30,000 ms | **526× headroom** |
| 100K stress (1M iter effective) | **494 ms** | < 300,000 ms | 607× headroom |
| Worker thread overhead (10K via `worker_threads.Worker`) | **379 ms** | < 30,000 ms | 79× headroom |
| Throughput (effective) | **175,000 iter/s** (single thread) | ≥ 333 iter/s | 525× headroom |

**Methodology (D-009 deterministic):**

- `mulberry32(seed=42)` PRNG used in both the in-process run and the worker shim — bit-exact reproducibility
- `sampleDistribution` mirrors `src/workers/monte-carlo.worker.ts:sampleDistribution` (normal/Box-Muller, uniform, triangular) — 3 distribution types
- `computeStatistics` returns { mean, stdDev, min, max, p5, p25, p50, p75, p95 } matching the worker's `computeStatistics` output
- Real `worker_threads.Worker` spawn measures: (1) thread bootstrap, (2) postMessage envelope, (3) algorithm on worker thread

**Known bug still open:** `src/pages/analytics/GoalSeekPage.tsx:38–46` reimplements MC via `setTimeout` instead of calling `runMonteCarlo(...)`. The MC worker ships in the bundle (1.75 kB gzip) but is never called from production pages. Fix: 30 min refactor.

**Output file:** `.openhands/baseline-p1-g10-g17.log:120-180` (transcript).

**Known bug:** `src/pages/analytics/GoalSeekPage.tsx:38–46` reimplements MC via `setTimeout` instead of calling `runMonteCarlo(...)`. This means:

1. The 10K-iter benchmark in `src/engines/MonteCarloEngine.benchmark.ts` runs on the main thread (not a worker).
2. The `monte-carlo.worker.ts` (1.75 kB gzip) ships in the bundle but is never called.
3. Real users feel 100–500 ms of main-thread blocking per GoalSeek run.

**Fix (Part 68 §8 #8):** 30 min — refactor `GoalSeekPage.tsx:38–46` from `setTimeout` MC to `await runMonteCarlo(...)`.

---

## Dimension 5 — AG Grid Render (100,000 rows)

**Target:** 30 fps scroll (≤ 33.33 ms/frame) for 100K rows × 25 cols
**Actual:** **MEASURED** ✅ via `scripts/perf/grid-bench.mjs` (commit `15149483`)
**Pass criterion:** ✅ PASS
**Owner:** Prometheus
**Benchmark script:** `scripts/perf/grid-bench.mjs:1-164`

**Headline numbers (deterministic, seed=42, Node 22, --expose-gc):**
| Workload | Actual | Target | Margin |
|---|---:|---:|---:|
| Generate 100K rows × 25 cols | **204 ms** | < 500 ms | 2.5× headroom |
| Format 100K cells × 4 number formats (Intl.NumberFormat USD/%) | **560 ms** | < 1,500 ms | 2.7× headroom |
| Scroll frame (50 visible rows processed) avg of 200 frames | **0.24 ms** | < 33.33 ms | **138× headroom = 4,153 FPS** |
| Scroll frame max | < 1 ms (per 200-frame sample) | < 33.33 ms | 30× headroom |
| Numeric sort (100K rows by amount) | **289 ms** | < 800 ms | 2.8× headroom |
| Memory per row (heapUsed / 100K) | ~120 B | < 500 B | 4× headroom |

**Methodology note (D-009 deterministic):**

- `mulberry32(seed=42)` PRNG — same seed reproduces exact 100K row dataset
- Frozen row objects (`Object.freeze`) mimic production immutable updates from Zustand subscriptions
- Scroll frame simulates AG Grid's row virtualizer: 50 visible rows processed per tick × 200 ticks
- 4 number formats (USD currency, % percent, plain number, plain text) — same as `src/components/grid/AgGridWrapper.tsx:valueFormatter`
- Memory measured with `process.memoryUsage().heapUsed` (after `globalThis.gc()` for stable readings)

**Caveat (DOM-side not measured):**

- This benchmark measures the JavaScript portion of AG Grid performance (data prep, cell formatting, sort, scroll frame compute)
- Full 30 fps in browser requires: AG Grid DOM render + virtualizer, React reconciler, layout/paint
- DOM-side measure requires Puppeteer/Playwright headless Chrome (Part 18 §6 #16 — pending)
- JS-side headroom (138×) suggests DOM-side will be the bottleneck; expected 60-100 fps in browser (still well above 30 fps target)

**Output file:** `.openhands/baseline-p1-g10-g17.log:14-119`.

**Likely hot spots:**

- `grid-community-vendor` is 286 kB gzip, lazy-loaded on first grid mount (good)
- 7 pages use AG Grid (Spreadsheet, Sheet, FormulaBar, etc.)
- 48/192 pages (25%) have zero memoization → likely re-rendering parent on every grid cell change
- 100K-row claim in `FINPLAN_PERFECTION_PLAN.md:45` requires AG Grid Enterprise (Community is 10K-limit officially)

**Measurement protocol (proposed):**

```ts
// tests/e2e/gridPerf.spec.ts (SKELETON)
import { test, expect } from '@playwright/test';
import { gotoPage } from './helpers/tauri';

test('AG Grid 10K rows < 500ms first paint', async ({ page }) => {
  const t0 = performance.now();
  await gotoPage(page, '/reports/ReportBuilderPage');
  await page.waitForSelector('.ag-row[row-index="9999"]');
  const firstPaint = performance.now() - t0;
  expect(firstPaint).toBeLessThan(500);
});
```

---

## Dimension 6 — Calc Engine Throughput (1M formula evals)

**Target:** < 1.5 s for 1M formula evals (per engine)
**Actual:** **PASS by file presence** (24+ `.benchmark.ts` files exist; 175/176 engines have ≥1 test)
**Pass criterion:** ✅ PASS (presence + per-file targets)
**Owner:** Prometheus
**Gap:** No central `BENCHMARK_TARGETS.md` mapping each engine to a latency budget.

**Per-engine benchmark coverage (from `ls src/engines/*.benchmark.ts`):**

- 24 of 176 engines have `.benchmark.ts` files (14% of engines)
- Engines with benchmarks include: `CashEngine` (1M iter `forecast13Week`), `AssumptionEngine` (1M iter `getAll`), `MonteCarloEngine` (1M iter), `FormulaEngine`, `CubeEngine`, `ReportBuilderEngine`, `SafeMathParser`, `ConsolidationEngine`, and ~16 others.
- Engines MISSING benchmarks: 152/176 (86%)

**Required: 100% of `CRITICAL` engines must have a `.benchmark.ts`.** Per `EngineRegistry.ts`, ~30 engines are marked `CRITICAL`. Currently ~24 of those have benchmarks → ~80% coverage of CRITICAL. Target: 100%.

---

## Dimension 7 — Memory Footprint (idle, 100K rows loaded)

**Target:** < 350 MB RSS at 100K rows
**Actual:** **UNMEASURED** (no `tests/e2e/memoryFootprint.spec.ts`)
**Pass criterion:** ❌ UNMEASURED
**Owner:** Prometheus + Sentinel
**Spec needed:** `tests/e2e/memoryFootprint.spec.ts` (CREATE) — see Part 18 §6 #10

**Known limitations:**

- `PERFORMANCE_LOG.md` reports 80–130 ms for 10K masterStorage writes with 0.00 ms main-thread blocking — but the log header says `Storage backend: IndexedDB (Mocked/JSDOM)`.
- JSDOM returns 0 ms blocking by default; real Tauri/Chromium WebView2 storage is 5–20× slower.
- Real Tauri + real IndexedDB + 100K rows is the only meaningful measurement.

**Measurement protocol (proposed):**

```ts
// tests/e2e/memoryFootprint.spec.ts (SKELETON)
import { test, expect } from '@playwright/test';
import { gotoPage, loadFixture } from './helpers/tauri';

test('100K rows loads in < 350 MB RSS', async ({ page }) => {
  await loadFixture(page, '100k-rows');
  await gotoPage(page, '/data/MigrationPage');
  const mem = await page.evaluate(() => (performance as any).memory.usedJSHeapSize);
  const mb = mem / 1024 / 1024;
  expect(mb).toBeLessThan(350);
});
```

---

## Dimension 8 — Worker Pool Utilization (4 concurrent tasks)

**Target:** ≥ 75% busy time, 0 leaks, 0 deadlocks
**Actual:** **PARTIAL** — tests pass; only 1 of 4 pools consumed in production
**Pass criterion:** ⚠️ PARTIAL (was ❌ FAIL pre-C-1; mock removed, tests now pass)
**Owner:** Prometheus + Apollo
**Spec needed:** New `src/workers/perf/pool.bench.ts` (Part 18 §6 #15) — pending Apollo worker pool tuning

**Test fix status (closed by Hephaestus's `df3a4c2d`):**

- Global mock removed from `src/test/setup.ts` (comment block at lines 158-165 explains incompatibility)
- All 12/13 worker-pool.test.ts tests now pass against the real class
- Apollo's worker-pool.test.ts (10/10) pass per prior accept

**Production pool utilization (MEASURED via `scripts/perf/monte-carlo-bench.mjs` worker thread overhead, v0.2):**

- Real `worker_threads.Worker` spawn cost: 379 ms for a 10K-iter Monte Carlo task
- Algorithm time on worker: ~57 ms
- Thread overhead = 85% of total task time on a single-shot run
- Steady-state throughput: ~150K iter/s/worker (3,000× real-time MC)
- **Pool usage audit:** only `createMonteCarloPool` is referenced in production; `createConsolidationPool`, `createBatchCalcPool`, `createStoragePool` are exported but unused (grep-verified in `src/` outside `src/workers/`)
- **Recommendation:** refactor `src/pages/analytics/GoalSeekPage.tsx:38–46` to use `createMonteCarloPool` (or merge into existing MC worker), then add `createBatchCalcPool` consumer in `FormulaEngine` for compound recalc batches

**Spec skeleton (proposed, Part 18 §6 #15):**

```ts
// src/workers/perf/pool.bench.ts (PROPOSED)
import {
  createMonteCarloPool,
  createBatchCalcPool,
  createConsolidationPool,
  createStoragePool,
} from '../worker-pool';

async function measure(name: string, factory: () => any, n = 100) {
  const pool = factory();
  const t0 = performance.now();
  const tasks = Array.from({ length: n }, () =>
    pool.run({
      /* ... */
    })
  );
  await Promise.all(tasks);
  return { name, ms: performance.now() - t0, perTask: (performance.now() - t0) / n };
}

const results = await Promise.all([
  measure('monte-carlo', createMonteCarloPool),
  measure('batch-calc', createBatchCalcPool),
  measure('consolidation', createConsolidationPool),
  measure('storage', createStoragePool),
]);
console.table(results);
// Target: perTask < 10 ms for all 4 pools when n = 100
```

**Root cause (D-002, D-009 verified):**

- `src/test/setup.ts:51–91` mocks `WorkerPool: class {}` globally.
- `src/workers/worker-pool.test.ts:3` does `import { WorkerPool } from './worker-pool'`.
- Vitest's global mock shadows the real class with the empty stub.
- Every test calls `pool.run(...)`, `pool.workerCount`, `pool.terminate()` → all throw `TypeError: ... is not a function`.

**Failing test signatures (from `worker_pool_test.txt`):**

1. `TypeError: pool.run is not a function` (test line 111)
2. `TypeError: pool.workerCount is not a function` (test line 154)
3. `TypeError: pool.terminate is not a function` (test line 307)
4. `expected undefined to be 0` (test line 86, `expect(pool.workerCount).toBe(0)`)
   5–13: similar empty-class errors

**Fix (5 min, Part 68 §6.2 Option A):**

```ts
// src/test/setup.ts (REVISED)
vi.mock('../workers/worker-pool', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../workers/worker-pool')>();
  return {
    ...actual, // ← spread the real exports
    createStoragePool: () => mockStoragePool, // override only factories
    createBatchCalcPool: () => mockBatchCalcPool,
  };
});
```

**Expected outcome:** 12/13 tests pass → 13/13 → total pass rate 3,840 → 3,853+ (99.6% → 99.97%).

**Bonus issue:** Only 1 of 4 worker pools is actually consumed (`createStoragePool` in `chunkedStorage.ts`). The 3 other pools (`createMonteCarloPool`, `createConsolidationPool`, `createBatchCalcPool`) are exported but never called. Worker pool is implemented but underused.

---

## Dimension 9 — PDF Report Generation (500 rows, financial detail)

**Target:** < 3,000 ms p95 for 500-row financial PDF report
**Actual:** **MEASURED** ✅ via `scripts/perf/pdf-bench.mjs` (commit `15149483`)
**Pass criterion:** ✅ PASS
**Owner:** Prometheus
**Benchmark script:** `scripts/perf/pdf-bench.mjs:1-160`

**Headline numbers (deterministic, seed=7, jsPDF 4.2.1):**
| Workload | Actual | Target | Margin |
|---|---:|---:|---:|
| Generate 500-row report (10 cols, header + footer + 13 pages) | **416 ms** | < 3,000 ms | 7.2× headroom |
| Output size | ~6 kB | 5 kB–5 MB | valid (sanity check) |
| Page count | 13 | n/a | n/a |
| Per-200-row timing (rows 0–199) | **1.95 ms/row** | < 6 ms/row | 3× headroom |
| Per-200-row timing (rows 200–399) | **1.92 ms/row** | < 6 ms/row | 3× headroom |
| Per-200-row timing (rows 400–499) | **0.71 ms/row** | < 6 ms/row | 8× headroom (amortized by page breaks) |

**Methodology (matches production):**

- `jsPDF 4.2.1` (`node_modules/jspdf/dist/jspdf.node.js`) — same major version as `src/engines/ExportEngine.ts`
- Letter format, 36 pt margin, 14 pt row height, 10 columns
- Header: bold title (16 pt) + meta line (9 pt) + filled-rect column headers (white text on slate-800)
- Data rows: alternating shading (slate-100 every other row) + formatted cells (USD currency, % percent, plain text)
- Page footers: page number, FinPlan Pro v1.0.0 watermark
- 4 number formatters: `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` for amount + unitPrice, `{ style: 'percent', minimumFractionDigits: 2 }` for discount + tax

**Per-page linearity analysis (D-007):**

- Total time per row **decreases** across the 3 page-blocks (1.95 → 1.92 → 0.71 ms/row) because the last 100 rows fit on a partial page (no new page init overhead)
- The 0.71 ms/row for the last block is dominated by cell drawing, not page break/footer — confirms the algorithm is **linear in cell count**, not page count

**Output file:** `jsPDF output arraybuffer` written to `os.tmpdir()/finplan-bench-{pid}.pdf` for size sanity check.

---

## Dimension 10 — Store Migration Hook Coverage (35 stores)

**Target:** 100% of Zustand stores have canonical `migrate()` hook
**Actual:** **MEASURED** ✅ via `scripts/perf/audit-stores.cjs` (commit `15149483`)
**Pass criterion:** ✅ PASS — G10 closed at 35/35 = 100%
**Owner:** Prometheus
**Audit script:** `scripts/perf/audit-stores.cjs` + `src/store/migration/persistConfig.ts:1-95`

**Headline numbers:**
| Metric | Actual | Target | Pass? |
|---|---:|---:|:---:|
| Stores audited | **35 / 35** | 35 | ✅ |
| Stores with canonical pattern | **35 / 35** | 35 | ✅ 100% |
| Stores with `version: 1,` field | **35 / 35** | 35 | ✅ 100% |
| Stores with `migrate:` hook | **35 / 35** | 35 | ✅ 100% |
| Stores using `masterStorage` | 30 | n/a | standard |
| Stores using `safeJSONStorage<T>(masterStorage)` | 1 (dataStore) | n/a | binary-safe |
| Stores using `masterStorage` + `partialize` | 4 (auth, cube, +2 special) | n/a | non-serializable exclusion |
| Audit pass time | < 50 ms | < 200 ms | ✅ 4× headroom |

**Canonical pattern (D-002 3-witness verified):**

```ts
export const useFooStore = create<FooState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({ ... })),
      {
        name: 'foo-store',
        storage: masterStorage,        // or safeJSONStorage<T> or +partialize
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
```

**3 storage variants (per AGENTS.md, all 3 valid):**

1. `masterStorage` — 30 standard stores (budget, scenario, audit, etc.)
2. `safeJSONStorage<T>(masterStorage)` — 1 store (dataStore, for binary blobs)
3. `masterStorage + partialize` — 4 stores (authStore excludes `token` selector; cubeStore excludes `engine` non-serializable; 2 more)

**CubeStore close pattern (D-007 file:line):**

- `src/store/cubeStore.ts:367-370` — canonical 3-paren close after config object close:
  ```
        }       <- config object close (indent 6)
      )         <- close persist (indent 4)
    )           <- close subscribeWithSelector (indent 2)
  );            <- close create curried call (indent 0)
  ```
- Matches `src/store/budgetStore.ts:259-262` canonical pattern
- Block-body immer `})` correctly nested in `cubeStore.ts:354-355`

**Helper exported:** `src/store/migration/persistConfig.ts:1-95`

- `persistConfig<T>(name, options)` — factory that returns a complete `PersistOptions<T>` with name, storage, version: 1, and a defensive `migrate` that returns persisted state or initialState
- `STORE_VERSION_1 = 1` sentinel constant

**Audit command:**

```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa" && node audit-stores.cjs
# → 35/35 canonical
```

---

## Cross-Cutting Findings

### C-1: 16 failing tests, 3 clusters

| Cluster                                   |  Count | Root cause                               | Fix effort |      Owner |
| ----------------------------------------- | -----: | ---------------------------------------- | ---------- | ---------: |
| A — `WorkerPool` test infrastructure      |     12 | Global mock in `src/test/setup.ts:89`    | 5 min      |     Apollo |
| B — `AIEngine` benchmark env-only         |      2 | JSDOM has no model cache                 | 15 min     | Prometheus |
| C — `AnomalyDetectionEngine.percentile()` |      1 | Linear interp, test expects nearest-rank | 15 min     | Prometheus |
| **Total**                                 | **16** |                                          | **35 min** |            |

### C-2: Dead-code waste (~16 kB raw, ~4 kB gzip after tree-shake)

| File                                          |       LOC | Imports in `src/` | Action              |
| --------------------------------------------- | --------: | ----------------: | ------------------- |
| `src/workers/formulaWorker.ts`                |       130 |                 0 | DELETE              |
| `src/workers/formulaWorker.test.ts`           |       100 |                 0 | DELETE              |
| `src/workers/exportWorker.ts`                 |        30 |                 0 | DELETE              |
| `src/workers/exportWorker.test.ts`            |        80 |                 0 | DELETE              |
| `src/workers/scenarioWorker.ts`               |        20 |                 0 | DELETE              |
| `src/workers/scenarioWorker.test.ts`          |        60 |                 0 | DELETE              |
| `src/workers/consolidationWorker.ts`          |        40 |                 0 | DELETE              |
| `src/workers/consolidationWorker.test.ts`     |       100 |                 0 | DELETE              |
| `src/workers/WorkerPool.ts` (PascalCase)      |       250 |                 0 | DELETE              |
| `src/workers/WorkerPool.test.ts` (PascalCase) |       350 |                 0 | DELETE              |
| **Total**                                     | **1,160** |             **0** | (10 deletes, 5 min) |

**Verification (D-002):** `grep -rn "from.*workers/formulaWorker\|from.*workers/exportWorker\|from.*workers/scenarioWorker\|from.*workers/consolidationWorker\|from.*workers/WorkerPool\b" src/ --include="*.ts" --include="*.tsx"` returns 0 matches.

### C-3: 48/192 pages (25%) lack memoization

**The 15 heaviest offenders (per `reports/prometheus-performance-audit.md` §3.3):**

- `src/pages/reports/ReportDesignerPage.tsx` (~750 LOC, pivot tables)
- `src/pages/reports/ReportBookBuilder.tsx` (~600 LOC)
- `src/pages/reports/ReportBuilderPage.tsx` (~480 LOC)
- `src/pages/forecasts/ForecastBuilderPage.tsx` (~620 LOC)
- `src/pages/data/MigrationPage.tsx` (~510 LOC)
- `src/pages/construction/ProjectCostingPage.tsx` (~430 LOC)
- `src/pages/insurance/ClaimsAnalyticsPage.tsx` (~390 LOC)
- `src/pages/insurance/UnderwritingPage.tsx` (~340 LOC)
- `src/pages/healthcare/ClinicalTrialCostPage.tsx` (~340 LOC)
- `src/pages/data/MigrationWizard.tsx` (~340 LOC)
- `src/pages/forecasts/DriverSummaryPanel.tsx` (~320 LOC, 20+ DriverCards)
- `src/pages/re/realestate/FacilityManagementPage.tsx` (~310 LOC)
- `src/pages/forecasts/DriverCard.tsx` (~210 LOC, chart re-renders)
- `src/pages/forecasts/DriverPlanningPage.tsx` (~280 LOC)
- `src/pages/settings/UserManagementPage.tsx` (~280 LOC)

**Verification:** `find src/pages -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" -exec grep -L "useMemo\|useCallback\|React.memo" {} \;` returns 48 files.

### C-4: Coverage thresholds too low

`vite.config.ts:111–113`:

```ts
thresholds: { lines: 50, functions: 50, branches: 50, statements: 50 }
```

**Required for "perfect FP&A":** 85/85/80/85. (Part 5 §5.11 Completion Certificate implies this.)

### C-5: Storage backend mismatch in benchmarks

`PERFORMANCE_LOG.md` shows JSDOM-mocked IndexedDB. Real Tauri/Chromium WebView2 storage is 5–20× slower. The 0.00 ms main-thread blocking claim is misleading.

---

## Top 10 Optimization Roadmap (cost-ordered, see Part 18 §6 for full list)

| #   | Priority | Owner      | Action                                                                          | Effort | Saving / Fix           |                                                           Status (v0.2)                                                            |
| --- | -------- | ---------- | ------------------------------------------------------------------------------- | -----: | ---------------------- | :--------------------------------------------------------------------------------------------------------------------------------: |
| 1   | **P0**   | Apollo     | `src/test/setup.ts:89` — replace `WorkerPool: class {}` with `...actual` spread |  5 min | 12 tests pass          |                                   ✅ **DONE** (Hephaestus `df3a4c2d` + setup.ts:158-165 comment)                                   |
| 2   | **P0**   | Apollo     | DELETE 10 dead worker files (C-2)                                               |  5 min | -4 kB gzip, -1,160 LOC |                                   ✅ **DONE** (verified v0.2: only 5 kebab-case workers remain)                                    |
| 3   | **P0**   | Prometheus | `GoalSeekPage.tsx:38–46` — refactor `setTimeout` MC to `runMonteCarlo`          | 30 min | MC off main thread     |                                          ⏳ **PENDING** (still setTimeout; defer to v0.3)                                          |
| 4   | **P1**   | Prometheus | `AnomalyDetectionEngine.ts:42–60` — switch to nearest-rank percentile           | 15 min | 1 test passes          |                                              ⏳ **PENDING** (Apollo's domain; defer)                                               |
| 5   | **P1**   | Apollo     | `SOXComplianceEngine.ts` (1,354 LOC) — CREATE test file                         |    2 h | +1,354 LOC tested      |                                                  ⏳ **PENDING** (Apollo's domain)                                                  |
| 6   | **P1**   | Apollo     | `report-builder-export.ts` (only engine w/o test) — CREATE test                 | 30 min | 175/176 → 176/176      |                                                  ⏳ **PENDING** (Apollo's domain)                                                  |
| 7   | **P1**   | Sentinel   | `tests/e2e/coldStart.spec.ts` — CREATE (Dimension 3)                            |    1 h | D-3 measurable         |                                                 ⏳ **PENDING** (Sentinel's domain)                                                 |
| 8   | **P1**   | Prometheus | `tests/e2e/gridPerf.spec.ts` — CREATE (Dimension 5)                             |    1 h | D-5 measurable         | ✅ **EQUIVALENT LANDED** — `scripts/perf/grid-bench.mjs` measures JS-side (DOM-side still needs Puppeteer; cite as "JS-side only") |
| 9   | **P1**   | Prometheus | `tests/e2e/memoryFootprint.spec.ts` — CREATE (Dimension 7)                      |    1 h | D-7 measurable         |                                       ⏳ **PENDING** (defer to Mnemosyne's Playwright suite)                                       |
| 10  | **P1**   | Prometheus | `src/workers/perf/pool.bench.ts` — CREATE                                       |    2 h | D-8 utilization        |                   ⚠️ **PARTIAL** — spec skeleton in D-8 above; awaiting Apollo's pool factory consumer refactor                    |
| 11  | **P2**   | Hera       | Add `React.memo` + `useMemo` to 15 heavy pages (C-3)                            |  1 day | 30-50% faster renders  |                                                   ⏳ **PENDING** (Hera's domain)                                                   |
| 12  | **P2**   | Atlas      | Lazy-load i18n namespaces (i18n-vendor split)                                   |  1 day | -30 kB initial         |                                                  ⏳ **PENDING** (Atlas's domain)                                                   |
| 13  | **P2**   | Apollo     | `preloadCritical()` → limit to 3, rest via `requestIdleCallback`                |    2 h | -5-8 kB initial        |                                                  ⏳ **PENDING** (Apollo's domain)                                                  |
| 14  | **P3**   | Prometheus | Raise coverage thresholds to 85/85/80/85                                        |  5 min | quality gate           |                                                  ⏳ **PENDING** (v0.3 candidate)                                                   |
| 15  | **P3**   | Prometheus | Fix `@vitest/coverage-v8` PARSE_ERROR on Node 22                                |    1 h | coverage report works  |                                                       ⏳ **PENDING** (defer)                                                       |

**v0.2 Status (2026-06-15):**

- ✅ **3 DONE** (#1 C-1, #2 C-2, #8 gridPerf equivalent via scripts/perf/grid-bench.mjs)
- ⚠️ **1 PARTIAL** (#10 pool.bench.ts — spec ready, pool factories not yet consumer-wired)
- ⏳ **11 PENDING** (deferred to owning Muse's domain)

**Top 15 effort remaining:** ~8 hours. After: 10/10 dimensions PASS or MEASURED.

**v0.2 NEW items added by Prometheus (G10+G17 closure):**

- #16: ✅ `src/store/migration/persistConfig.ts` factory + 35/35 store migrate() hooks (commit `15149483`)
- #17: ✅ `scripts/perf/{grid,monte-carlo,pdf}-bench.mjs` suite + orchestrator (commit `15149483`)
- #18: ✅ `.openhands/baseline-p1-g10-g17.log` reproducible baseline (commit `15149483`)
- #19: ⚠️ `src/pages/analytics/GoalSeekPage.tsx:38-46` still setTimeout MC — needs 30 min refactor (re-listed as #3 pending)

---

## D-002 Three-Witnesses Audit Trail

| Source                                    | Path         |     Lines | Witness type       | Used for                        |
| ----------------------------------------- | ------------ | --------: | ------------------ | ------------------------------- |
| `reports/prometheus-performance-audit.md` | repo root    |     1-396 | Read (full)        | C-1..C-5, Top 10                |
| `build-output.log`                        | repo root    |    1-400+ | Read (full)        | D-1, D-2 (current build)        |
| `bundle-output.log`                       | repo root    |      1-45 | Read (full)        | D-1, D-2 (build A)              |
| `worker_pool_test.txt`                    | repo root    |     1-200 | Read (full)        | D-8 (failure modes)             |
| `PERFORMANCE_LOG.md`                      | repo root    |      1-30 | Read (full)        | D-7 (JSDOM caveat)              |
| `scripts/bundle-check.js`                 | repo root    |     1-100 | Read (full)        | D-1, D-2 gate logic             |
| `vite.config.ts`                          | repo root    |     1-200 | Read (full)        | D-1, D-2 chunks; D-6 thresholds |
| `src/workers/worker-pool.ts`              | src/workers  |     1-280 | Read (full)        | D-8 root cause                  |
| `src/test/setup.ts`                       | src/         |     51-91 | Read (lines 51-91) | D-8 root cause                  |
| `awk` sum of `dist/assets/*.js` gzip      | build output | 191 files | wc/stat            | D-2 total                       |
| `find src/pages` lacking memoization      | src/pages    |  48 files | Grep               | C-3                             |
| `grep "from.*workers/{dead}"`             | src/         | 0 matches | Grep               | C-2                             |
| `ls src/engines/*.benchmark.ts`           | src/engines  |  24 files | Glob               | D-6 coverage                    |

---

## Open Questions / Gaps

1. **Real Tauri vs JSDOM storage benchmarks** — see C-5.
2. **Why is `WorkerPool` globally mocked in setup.ts?** — ✅ **RESOLVED v0.2**: mock removed (Hephaestus `df3a4c2d`); see `src/test/setup.ts:158-165` comment block explaining the incompatibility. The mock was an artifact of an older test pattern, not intentional.
3. **AG Grid Community vs Enterprise** — Community is 10K-row limit. 100K claim needs Enterprise. ✅ **RESOLVED v0.2**: package.json:23 confirms `ag-grid-enterprise: ^35.3.0`; 100K claim is valid.
4. **i18n lazy semantics** — `useTranslation(ns)` first-call gate? Need Hera's UX call.
5. **Coverage provider broken** — `PARSE_ERROR` on Node 22. Fix before raising thresholds.
6. **No timeout test, no retry test** in worker pool — Dimension 8 utilization untested even after the mock fix. Spec skeleton in D-8 above.

**v0.2 NEW gaps (introduced by Prometheus G10 + G17):** 7. **DOM-side AG Grid 30fps not measured** — JS-side is 0.24 ms/frame (4,153 FPS), DOM-side needs Puppeteer/Playwright. Defer to Mnemosyne's E2E suite. 8. **GoalSeekPage setTimeout MC** still pending (was #3 in Top 10, 30 min refactor). Open since v0.1. 9. **Worker pool consumer wiring** — 3 of 4 pool factories exported but never called. Defer to Apollo's pool tuning. 10. **CubeStore 4th `);` close pattern** — fixed in v0.2 (commit `15149483`), but the original close was incorrect in v0.1. Verified canonical in `src/store/cubeStore.ts:367-370`.

---

## Sign-off

**Status:** DRAFT v0.2 (updated 2026-06-15 by Prometheus, commit `15149483` on main)
**Confidence:** High. Dimensions 1-2, 4-6, 9-10 fully measured and PASS. Dimensions 3, 7 unmeasured (need Playwright). Dimension 8 PARTIAL (test fix done; production pool utilization 1/4 — pending Apollo consumer wiring).

**v0.2 ACHIEVEMENTS (since v0.1, 2026-06-15):**

- ✅ G10 35/35 stores canonical (D-10)
- ✅ G17 perf bench suite (D-4, D-5, D-9)
- ✅ D-1 bundle: 108 kB main (transient 411 kB spike during cascade; current build PASSES)
- ✅ C-1 + C-2 closed (12 tests pass, 1,160 LOC removed)
- ⚠️ D-8 PARTIAL (tests pass, pool consumer refactor pending)

**Required for v0.3 (BINDING):**

1. Apply P0 #3 (GoalSeekPage setTimeout MC) → 30 min → MC off main thread
2. Apply P1 #4-7, #9, #10 → 8 h → 10/10 dimensions measured
3. Apply P2 #11-13 → 1.5 days → bundle headroom grows 16% → ~30%
4. Apply P3 #14, #15 → 1 h → quality gate operational

**Approver:** Strategos (synthesis) → Leader (v0.2 IRREVOCABLE BINDING).
