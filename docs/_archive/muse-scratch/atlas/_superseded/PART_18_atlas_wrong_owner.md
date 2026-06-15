# Part 18 — Performance Architecture & Optimization Patterns

**Status:** DRAFT v0.1
**Owner:** Atlas
**Last updated:** 2026-06-15
**Cross-refs:** Part 3 (Tech Architecture), Part 12 (Stores/DB), Part 53 (IndexedDB), Part 68 (Web Workers), Part 69 (PWA/Offline), Part 70 (Real-Time Calc), Part 109 (CI/CD), Part 116 (Performance Budgets)
**Inputs from audits:** PERFORMANCE_BENCHMARKS.md (8-dim ACTUAL vs TARGET) — main bundle ≤150 KB gz; total JS ≤2 MB gz; cold start ≤2.5 s; Monte Carlo ≤5 s for 10k runs; AG Grid 10k rows render ≤300 ms; calc engine throughput ≥50k cells/s; memory ≤250 MB; worker pool utilization ≥70%. Baseline v4: 1043 tests pass, build green, TSC 2266 errors to be cleared.

---

## Summary

This Part specifies the **performance contract** for FinPlan Pro: the budgets, measurement methodology, runtime architecture (workers, scheduling, memoization), and regression-prevention rules that keep the app fast on a 4-year-old mid-range laptop. The app is a Tauri v2 desktop + PWA hybrid whose heaviest workloads are (1) a 10,000-row AG Grid recalculation, (2) a 10,000-trial Monte Carlo simulation, and (3) full-doc re-evaluation of the calc engine. All three MUST run off the main thread in dedicated Web Workers orchestrated by a shared `WorkerPool` (see Part 68). Bundle size, cold start, memory, and per-feature budgets are **enforced in CI** by the bundle-size gate (Part 3 §9) and a synthetic perf suite in `tests/perf/`. Any regression > 10% blocks merge.

---

## Sections

### 1. Performance budgets (canonical targets)

These are the **non-negotiable** numbers. They are checked on every PR via the perf workflow (see Part 109 §6).

| Dimension                             | Target                         | Measurement                       | Failure action |
| ------------------------------------- | ------------------------------ | --------------------------------- | -------------- |
| Main bundle (largest single gz JS)    | ≤ **150 KB**                   | `scripts/bundle-check.js`         | build fail     |
| Total JS (sum of all gz JS)           | ≤ **2 MB**                     | `scripts/bundle-check.js`         | build fail     |
| Total CSS gz                          | ≤ 60 KB                        | `scripts/bundle-check.js`         | build fail     |
| Largest vendor chunk gz               | ≤ 600 KB                       | `scripts/bundle-check.js`         | build fail     |
| Cold start (Tauri, warm cache)        | ≤ **2.5 s**                    | Playwright + `performance.timing` | PR fail        |
| Cold start (PWA, 3G Fast)             | ≤ 4.0 s                        | Lighthouse CI                     | PR fail        |
| Time-to-interactive (TTI)             | ≤ 3.0 s desktop / 5.0 s mobile | Lighthouse CI                     | warn           |
| AG Grid 10k rows first paint          | ≤ 300 ms                       | `tests/perf/grid.bench.ts`        | PR fail        |
| AG Grid 10k rows recalc               | ≤ 500 ms                       | same                              | PR fail        |
| Calc engine throughput                | ≥ **50,000 cells/s**           | `tests/perf/calc.bench.ts`        | PR fail        |
| Monte Carlo 10k trials, 1k cells      | ≤ **5 s**                      | `tests/perf/montecarlo.bench.ts`  | PR fail        |
| Memory (idle, after 10min use)        | ≤ **250 MB**                   | `tests/perf/mem.bench.ts`         | warn           |
| Worker pool utilization               | ≥ 70% under load               | `tests/perf/pool.bench.ts`        | warn           |
| FPS during scroll (10k rows)          | ≥ 55 fps                       | `tests/perf/scroll.bench.ts`      | PR fail        |
| Frame budget (calc-triggered renders) | ≤ 16 ms / 60 fps               | DevTools perf                     | warn           |

### 2. Measurement methodology

**Local dev**

- `pnpm dev` opens DevTools → Performance tab. Capture a 10s trace on the heaviest page. Verify no frame > 50 ms and no task > 50 ms.
- `pnpm test:perf` runs the Vitest-perf suite in headless Chromium (Playwright); outputs `coverage/perf-report.json` with regression delta vs. `main` branch baseline.

**CI**

- `.github/workflows/perf.yml` (see Part 109 §6) runs on every PR, compares against the last green main commit. **Fails** if any budget regresses > 10%.
- Perf results are uploaded as a workflow artifact (`perf-report-{{sha}}.json`).
- A weekly scheduled run posts a graph to the team dashboard (Grafana Cloud or equivalent).

**Tauri vs. PWA**

- Two separate budgets: Tauri gets the **2.5 s** cold start; PWA gets **4.0 s** (network).
- Bundle budgets are identical — both ship the same JS, only the loader differs.

### 3. Bundle-splitting rules (per Part 3 §4.5)

The `manualChunks` map is the contract. Any change to it must be justified in the PR description with a before/after chart.

| Chunk            | Contains                        | Why                                           |
| ---------------- | ------------------------------- | --------------------------------------------- |
| `react-vendor`   | react, react-dom, react-router  | Stable, low churn → long-term caching         |
| `ag-grid`        | ag-grid-community + theme       | Large (~250 KB gz), rarely changes            |
| `charts`         | recharts, d3-\*                 | Lazy-loadable on dashboard route              |
| `forms`          | react-hook-form, zod, resolvers | Lazy-loadable on form routes                  |
| `db`             | dexie, dexie-react-hooks        | Always loaded; small (~15 KB gz)              |
| `crypto`         | libsodium-wrappers              | Lazy-loadable on auth/restore flows           |
| `sentry`         | @sentry/react, @sentry/browser  | Always loaded; small (~30 KB gz)              |
| `workbox`        | workbox-window, register        | Always loaded; tiny (~5 KB gz)                |
| `feature-<name>` | per-feature bundle              | Generated from `src/features/<name>/index.ts` |

**Rule:** a feature chunk MUST NOT be loaded eagerly unless the user is authenticated AND on a route that uses it. Implement via `React.lazy(() => import('@/features/<name>'))`.

### 4. Code-splitting & lazy-load surface

| Route group             | Strategy                     | Trigger                         |
| ----------------------- | ---------------------------- | ------------------------------- |
| `/login`, `/onboarding` | Static import                | Always needed                   |
| `/app/dashboard`        | Static import                | Default landing                 |
| `/app/budget/*`         | React.lazy                   | On route enter                  |
| `/app/forecast/*`       | React.lazy                   | On route enter                  |
| `/app/scenarios/*`      | React.lazy                   | On route enter                  |
| `/app/reports/*`        | React.lazy                   | On route enter                  |
| `/app/admin/*`          | React.lazy                   | On route enter, admin role only |
| `/app/settings/*`       | React.lazy                   | On route enter                  |
| Monaco editor           | Dynamic import on first open | ~2 MB on disk, ~150 KB gz       |
| Chart builder           | Dynamic import on first open | ~80 KB gz                       |
| Pivot editor            | Dynamic import on first open | ~60 KB gz                       |

Suspense fallback MUST be a skeleton (per Part 92 — UX), never a blank screen. Skeletons have a **max 200 ms** perceived delay; beyond that, show a spinner with a "Still loading…" message.

### 5. Web Worker architecture (perf-relevant rules)

See Part 68 for the full spec. The perf-critical rules:

- **Pool sizing**: `navigator.hardwareConcurrency - 1`, clamped to `[2, 8]`. The main thread always has at least 1 core.
- **Worker types**: dedicated only. Shared workers are forbidden (atomicity is harder to reason about and we don't need cross-tab sync in v1).
- **Communication**: Comlink; messages are small (≤ 1 MB per call). Large payloads (>1 MB) are transferred via `Transferable` (`ArrayBuffer`, `MessagePort`, `OffscreenCanvas`).
- **Backpressure**: the pool has a max-pending-queue of `cores * 4`. New work beyond that is rejected with a typed `BackpressureError`; the UI MUST handle this gracefully (e.g., queue locally and retry with a "queue position" indicator).
- **Cancellation**: every long-running task accepts an `AbortSignal` (via Comlink `releaseProxy()`). The UI MUST cancel on route change, tab close, or "Cancel" button.
- **Determinism for Monte Carlo**: seed the PRNG (`xoshiro128**`) on the worker side; the seed is round-tripped so results are reproducible.

### 6. Calculation engine performance

See Part 70 for the full calc spec. Perf-critical rules:

- **Single source of truth**: the calc graph is a DAG of pure functions (no I/O). Inputs are deps-tracked cells; outputs are memoized.
- **Recompute strategy**: topological order; cells with no dirty inputs are skipped; dirty sub-trees recompute in parallel chunks of 500 cells.
- **Throughput target**: ≥ **50,000 cells/s** on a 4-core, 8 GB laptop. Achieved by:
  - Pre-allocating cell arrays in `Float64Array` (avoid GC churn)
  - Caching formula ASTs in a `Map<string, AST>`
  - Using a custom Pratt parser (no eval) — see Part 70 §4
- **Time-slicing**: if a recompute exceeds 16 ms, it yields to the main thread via `scheduler.yield()` (or `setTimeout(0)` fallback) and resumes on the next frame.
- **Web Worker offload**: for any document with > 5,000 cells, the entire calc engine moves to a worker. The main thread only handles display.

### 7. React rendering perf rules

- **No inline objects/arrays/JSX in props** of memoized components. Enforced by `eslint-plugin-react/jsx-no-constructed-context-values` (error).
- **Memoize expensive children** with `React.memo` and a custom `areEqual` for grids/charts.
- **Selector pattern** for Zustand: each component subscribes via a 1-arg selector returning a primitive or stable reference. `useStore(s => s.foo.bar)` is allowed only if `bar` is a stable reference (memoized in the store).
- **No `useEffect` for data loading** — use TanStack Query (or SWR). Server state and local state are separated.
- **Virtualization**: every list > 100 rows MUST use a virtualizer (`@tanstack/react-virtual` for HTML, AG Grid for tabular). No exceptions.
- **Throttle/debounce**: search input 150 ms debounce; window resize 100 ms debounce; scroll handler `requestAnimationFrame`-guarded.
- **`useTransition`** for any non-urgent state update (filtering, sorting, view-switching). Mark with a visible "Updating…" indicator if transition takes > 300 ms.
- **Image optimization**: `srcset`, `loading="lazy"`, AVIF with WebP fallback. All assets go through `scripts/optimize-assets.mjs`.

### 8. AG Grid performance rules (10k rows)

- **Row model**: ClientSide. No server-side row model in v1.
- **Modules**: only `ag-grid-community` + `ag-grid-react`. No enterprise in v1 (would add ~500 KB gz).
- **Column defs**: memoized via `useMemo` keyed on column-id set. Never recreated per render.
- **Cell renderers**: only function components; no class components. Heavy renderers (chart cells) are dynamically imported.
- **Row data**: replaced via `applyTransactionAsync` (not `setRowData`) when in a hot loop.
- **Filter/sort**: AG Grid's built-in (no custom server-side filter). Sort comparator must be pure.
- **Recalc**: AG Grid `processCellForExport` and `valueFormatter` are read-only. They MUST NOT call back into the calc engine.

### 9. Recharts performance rules

- **Recharts v2.13+** has known render hot paths. Rules:
  - Memoize `<Line>`, `<Bar>`, `<Area>` components.
  - Avoid `<ResponsiveContainer>` in deeply nested layouts — measure first, refactor to fixed dimensions if RTT is a problem.
  - Never pass arrays larger than 1,000 points to Recharts; downsample with LTTB (`downsample-lttb`) before render.
  - For dashboards with > 5 charts, use a custom canvas-based renderer (Chart.js or Visx canvas) — flagged as a v2 follow-up.

### 10. Memory & GC rules

- **No large object retention in component state**. Long-lived data lives in Zustand or Dexie.
- **Subscriptions** (AG Grid, ResizeObserver, IntersectionObserver, EventSource) MUST be cleaned up in the effect's cleanup return. Enforced by `eslint-plugin-react-hooks/exhaustive-deps` (error).
- **Workers** are explicitly `terminate()`d when their owning feature unmounts. Pool drain is part of `beforeunload`.
- **Dexie**: any table with > 50,000 rows uses an in-memory cache with LRU eviction (`lru-cache`).
- **No `JSON.parse` on strings > 1 MB on the main thread** — offload to worker.

### 11. Cold start budget breakdown (Tauri, 2.5 s target)

| Phase                                               | Budget                                     |
| --------------------------------------------------- | ------------------------------------------ |
| OS process launch (Rust)                            | 300 ms                                     |
| Tauri window create + webview init                  | 400 ms                                     |
| HTML parse + CSS apply                              | 100 ms                                     |
| Vite bundle download (already on disk for Tauri)    | 0 ms                                       |
| JS parse + eval (main chunk 150 KB gz ≈ 350 KB raw) | 200 ms                                     |
| React hydration (root shell only)                   | 150 ms                                     |
| Sentry init                                         | 50 ms (deferred via `requestIdleCallback`) |
| Service worker register (Tauri: no-op)              | 0 ms                                       |
| Dexie open + schema upgrade                         | 150 ms                                     |
| Auth check + redirect                               | 100 ms                                     |
| First contentful paint (skeleton visible)           | ≤ 1,200 ms                                 |
| TTI (skeleton replaced by real content)             | ≤ 2,500 ms                                 |

If any phase exceeds its budget, the build is **flagged** in CI with a flame-graph artifact.

### 12. Regression-prevention automation

- **`tests/perf/`** contains Vitest + Playwright benchmarks that emit machine-readable JSON. CI compares to baseline.
- **`scripts/budget-tracker.mjs`** runs nightly, pushes numbers to Grafana, alerts on >5% drift.
- **PR template** requires a perf-impact checkbox and a screenshot/trace if "yes".
- **Bundle analyzer**: `pnpm build:analyze` opens `dist/report.html` (rollup-plugin-visualizer) for human review.

### 13. Open Questions / Gaps

1. **Worker pool sizing on Apple Silicon**: `navigator.hardwareConcurrency` returns performance-core count only; efficiency cores are invisible. Need a heuristic for the M-series.
2. **AG Grid Enterprise** in v2 — would unlock pivoting, master/detail. Cost: ~500 KB gz + license. Re-evaluate after GA.
3. **WASM calc engine** — current JS engine hits 50k cells/s on commodity hardware; a Rust→WASM port could push to ~500k cells/s. Out of v1 scope.
4. **Cold start on Windows** — currently untested. Tauri startup on Windows can be 1.5× slower than macOS. Need real-device benchmarks.
5. **Lighthouse mobile** — desktop is the v1 priority; PWA mobile is best-effort.

### 14. Sign-off

**Status:** TENTATIVE — pending Prometheus final benchmark numbers, Strategos synthesis, and Vite 8 upgrade impact analysis.
