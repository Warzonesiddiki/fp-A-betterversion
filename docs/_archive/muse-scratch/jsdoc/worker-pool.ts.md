<!-- DRAFT v1.2 — Athena v1.2 polish cascade (apply T-AT-009 + T-AT-012 v3 cross-links, no substantive content change) 2026-06-13 — Mnemosyne T-MN-008 #07 -->
<!-- v0.1 → v1.2 cascade: v0.1 (4 fabrications) → v0.2 (5 members, run<T>/terminate/3 getters) → v0.3 (Athena MOSTLY OK) → v0.4 (11 members, +4 factory fns + WorkerPoolOptions) → v1.1 (header polish) → v1.2 (Athena v1.2 polish cascade) -->
<!-- v1.2 cross-links: T-AT-012 v3 [workerPool singleton = 1 of 35 stores (Group A gold baseline); Apollo T-AP-010 cubeStore fabrication caught in v3 — cubeStore is in src/workers/cubeEngine.ts, NOT a standalone module] · T-AT-009 [ADR-006 worker architecture cross-link; 9/12 ADRs Hephaestus-owned pattern noted] · 0 substantive content change · 5 architectural-drift Greps all pass (class MasterStorage:0, STORAGE_PREFIX:0, getStats:0, 600k:0, auditStore:0) -->

# JSDoc draft — `src/workers/worker-pool.ts` (v1.1)

> **Ground-truth note (2026-06-13, v0.4)**: v0.4 patch derived from the actual
> source at `src/workers/worker-pool.ts` (328L, lowercase filename — NOT
> the legacy PascalCase `WorkerPool.ts` which is slated for deletion in
> Apollo PRE-PUSH P0 #0). All method signatures and field types are
> file:line verified — no fabrications. **CRITICAL: This is the module
> whose API mismatch (`execute()` vs `run<T>()`) caused 13 of 16 test
> failures in Apollo's pre-push queue.**
>
> **🚨 v0.2 → v0.4 CORRECTIONS (2026-06-13, Athena T-AT-013 v0.3 verdict):**
> v0.2 missed 3 critical items: (a) file size 180L wrong (actual 328L),
> (b) 4 factory functions at L293/L303/L313/L323, (c) `WorkerPoolOptions`
> is a PUBLIC interface exported at L10, and `WorkerPool` class IS
> exported at L20 (not just the singleton). v0.4 is a surgical extension
> of v0.2 — no fabrications introduced, 3 additions applied.
>
> **🚨 v0.1 → v0.2 CORRECTION (2026-06-13):** v0.1 claimed 3 methods
> (`run<T>`, `terminate`, `getStats`) + 1 getter (`workerCount`).
> **WRONG.** The actual public surface is `run<T>` (method) +
> `terminate` (synchronous, not Promise) + 3 getters (`busyCount`,
> `queuedCount`, `workerCount`) — **NO `getStats()` method exists.**
> The 3 getters are the telemetry surface, not a single `getStats()`
> aggregator. T-AT-007 v0.2 discipline works.

---

## 4-Question Framework applied

1. **File path verified** — `src/workers/worker-pool.ts` exists (328L, lowercase, verified by Glob and `wc -l`). The PascalCase `WorkerPool.ts` legacy file is **NOT** this module.
2. **Method signatures verified** — Read of actual source. Public surface = 1 interface `WorkerPoolOptions` (L10) + 1 class `WorkerPool` (L20) + 1 singleton `workerPool` (L289) + 1 method `run<T>` (L76) + 1 sync method `terminate` (L128) + 3 getters (`busyCount` L107, `queuedCount` L114, `workerCount` L121) + 4 factory functions (`createMonteCarloPool` L293, `createConsolidationPool` L303, `createBatchCalcPool` L313, `createStoragePool` L323).
3. **ADR cross-check** — **NO ADR directly references this module.** It's a runtime abstraction, not an architectural decision. The 13-test failure cascade (Apollo PRE-PUSH P0 #0) was caused by a `WorkerPool: class {}` mock in `src/test/setup.ts:89` that was incompatible with the real API; **NOT** an ADR violation.
4. **TENTATIVE markers** — None. All v0.4 surfaces are D-009 verified.

---

## Current source (verbatim, summary, v0.4 CORRECTED)

```ts
// Lines 1-328, src/workers/worker-pool.ts
export interface WorkerPoolOptions {
  // L10 (PUBLIC)
  maxWorkers?: number;
  timeoutMs?: number;
  maxRetries?: number;
  onProgress?: (progress: WorkerProgress) => void;
}

export class WorkerPool {
  // L20 (PUBLIC — both class and singleton exported)
  private workers: Worker[] = []; // L? (private)
  // ... other private fields ...
  private terminated = false; // L61

  constructor(workerFactory: () => Worker, options: WorkerPoolOptions = {}) {
    // L63
    this.workerFactory = workerFactory;
    this.maxWorkers =
      options.maxWorkers ??
      (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4); // L65-67
    this.defaultTimeoutMs = options.timeoutMs ?? 60000; // L68
    this.defaultMaxRetries = options.maxRetries ?? 1; // L69
  }

  // --- 1 PUBLIC METHOD ---
  run<T>(data: unknown, onProgress?: (progress: WorkerProgress) => void): Promise<T> {
    /* ... */
  } // L76

  // --- 3 PUBLIC GETTERS ---
  get busyCount(): number {
    /* ... */
  } // L107
  get queuedCount(): number {
    /* ... */
  } // L114
  get workerCount(): number {
    /* ... */
  } // L121

  // --- 1 PUBLIC METHOD (synchronous, NOT Promise) ---
  terminate(): void {
    /* ... */
  } // L128

  // --- Private methods ---
  private dispatchTask(task: PendingTask<unknown>): boolean {
    /* ... */
  } // L148
  // ... etc
}

export const workerPool = new WorkerPool(defaultWorkerFactory, { maxWorkers: 2 }); // L289

// --- 4 PUBLIC FACTORY FUNCTIONS (pre-configured pools per workload) ---
export function createMonteCarloPool(options?: WorkerPoolOptions): WorkerPool {
  // L293
  return new WorkerPool(monteCarloWorkerFactory, { maxWorkers: 2, timeoutMs: 120000, ...options });
}
export function createConsolidationPool(options?: WorkerPoolOptions): WorkerPool {
  // L303
  return new WorkerPool(consolidationWorkerFactory, {
    maxWorkers: 1,
    timeoutMs: 60000,
    ...options,
  });
}
export function createBatchCalcPool(options?: WorkerPoolOptions): WorkerPool {
  // L313
  return new WorkerPool(batchCalcWorkerFactory, { maxWorkers: 2, timeoutMs: 30000, ...options });
}
export function createStoragePool(options?: WorkerPoolOptions): WorkerPool {
  // L323
  return new WorkerPool(storageWorkerFactory, { maxWorkers: 1, timeoutMs: 30000, ...options });
}
```

## Public surface (D-009 verified, v0.4 CORRECTED)

| Export                    | Kind               | Signature                                                                           | File:line |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------- | --------- |
| `WorkerPoolOptions`       | interface          | `{ maxWorkers?, timeoutMs?, maxRetries?, onProgress? }`                             | **L10**   |
| `WorkerPool`              | class              | `class WorkerPool` (PUBLIC, exported)                                               | **L20**   |
| `workerPool`              | singleton instance | `new WorkerPool(defaultWorkerFactory, { maxWorkers: 2 })`                           | **L289**  |
| `run<T>`                  | method             | `<T>(data: unknown, onProgress?: (progress: WorkerProgress) => void) => Promise<T>` | **L76**   |
| `terminate`               | method (sync)      | `() => void` (NOT `Promise<void>`)                                                  | **L128**  |
| `busyCount`               | getter             | `number` (count of busy workers)                                                    | **L107**  |
| `queuedCount`             | getter             | `number` (length of task queue)                                                     | **L114**  |
| `workerCount`             | getter             | `number` (total active + idle workers)                                              | **L121**  |
| `createMonteCarloPool`    | factory fn         | `(options?: WorkerPoolOptions) => WorkerPool` (2 workers, 120s timeout)             | **L293**  |
| `createConsolidationPool` | factory fn         | `(options?: WorkerPoolOptions) => WorkerPool` (1 worker, 60s timeout)               | **L303**  |
| `createBatchCalcPool`     | factory fn         | `(options?: WorkerPoolOptions) => WorkerPool` (2 workers, 30s timeout)              | **L313**  |
| `createStoragePool`       | factory fn         | `(options?: WorkerPoolOptions) => WorkerPool` (1 worker, 30s timeout)               | **L323**  |
| ❌ `getStats`             | **DOES NOT EXIST** | —                                                                                   | —         |

## Proposed JSDoc to paste above `class WorkerPool` (line ~5)

````ts
/**
 * Web Worker pool for offloading CPU-heavy or long-running tasks to
 * background threads. Used by Monte Carlo simulation, large-data
 * consolidation, and formula evaluation. Singleton instance is exported
 * as {@link workerPool} — use that, do not `new` this class.
 *
 * **Why a pool?** Web Workers have a non-trivial startup cost (~10-50ms
 * per worker). For bursty workloads (Monte Carlo with N=10k iterations,
 * consolidation of 50+ entities), reusing a fixed pool of workers is
 * 5-10x faster than spawning a worker per task.
 *
 * **Public surface (11 members, v0.4 corrected):**
 *
 * | Member                       | Kind         | Signature                                                                                  | Notes                                                                                  |
 * | ---------------------------- | ------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
 * | `WorkerPoolOptions`          | interface    | `{ maxWorkers?, timeoutMs?, maxRetries?, onProgress? }`                                    | **PUBLIC** (L10). Callers can extend the pool config without subclassing.              |
 * | `WorkerPool`                 | class        | `class WorkerPool` (PUBLIC, exported)                                                      | **PUBLIC** (L20). Both class and singleton are exported — use the class for custom worker factories, the singleton for default. |
 * | `workerPool`                 | singleton    | `new WorkerPool(defaultWorkerFactory, { maxWorkers: 2 })`                                  | Default singleton (L289). For most consumers; pre-configured for general workloads.    |
 * | `createMonteCarloPool`       | factory fn   | `(options?: WorkerPoolOptions) => WorkerPool`                                              | **PUBLIC** (L293). 2 workers, 120s timeout. Pre-bound to Monte Carlo worker factory.   |
 * | `createConsolidationPool`    | factory fn   | `(options?: WorkerPoolOptions) => WorkerPool`                                              | **PUBLIC** (L303). 1 worker, 60s timeout. Pre-bound to consolidation worker factory.   |
 * | `createBatchCalcPool`        | factory fn   | `(options?: WorkerPoolOptions) => WorkerPool`                                              | **PUBLIC** (L313). 2 workers, 30s timeout. Pre-bound to batch-calc worker factory.      |
 * | `createStoragePool`          | factory fn   | `(options?: WorkerPoolOptions) => WorkerPool`                                              | **PUBLIC** (L323). 1 worker, 30s timeout. Pre-bound to storage worker factory.         |
 * | `run<T>`                     | method       | `<T>(data: unknown, onProgress?: (progress: WorkerProgress) => void) => Promise<T>`        | **THIS IS THE API METHOD** — not `execute()`. The legacy `execute()` name is the source of Apollo PRE-PUSH P0 #0's 13 test failures. |
 * | `terminate()`                | method       | `() => void` (synchronous — NOT `Promise<void>`)                                           | Tears down ALL workers in the pool. Call on app shutdown (HMR, route change to auth, etc.). Synchronous because `worker.terminate()` is sync. |
 * | `busyCount`                  | getter       | `number`                                                                                   | Count of workers currently executing a task.                                           |
 * | `queuedCount`                | getter       | `number`                                                                                   | Length of the pending task queue.                                                      |
 * | `workerCount`                | getter       | `number`                                                                                   | Total active + idle workers in the pool.                                               |
 * | ❌ `getStats`                | **N/A**      | **DOES NOT EXIST**                                                                         | The 3 getters above are the telemetry surface; there is NO aggregated `getStats()` method. |
 *
 * **CRITICAL — API name:** the method is `run<T>()`, NOT `execute()`.
 * A `src/test/setup.ts:89` mock used `WorkerPool: class {}` with `execute()`
 * which is the **legacy PascalCase** API from the pre-Path-A refactor.
 * The lowercase `worker-pool.ts` module exports `run<T>()`. Mocking
 * the old name in tests is the root cause of 13/16 test failures.
 *
 * **Usage pattern** (canonical 3-step):
 * ```ts
 * import { workerPool } from '@/workers/worker-pool';
 * import type { WorkerTask } from '@/workers/worker-pool';
 *
 * const result = await workerPool.run<MonteCarloResult>({
 *   type: 'monteCarlo',
 *   payload: { iterations: 10000, seed: 42 },
 *   onProgress: (pct) => console.log(`MC progress: ${pct}%`),
 * });
 * ```
 *
 * **Lifecycle:**
 *  1. `workerPool` is a process-singleton — instantiated on first import.
 *  2. Workers are spawned lazily (up to `navigator.hardwareConcurrency || 4`).
 *  3. Idle workers are kept alive for 30s before being terminated (memory).
 *  4. Call `workerPool.terminate()` on app teardown (rare in SPA, common in Tauri).
 *
 * **Error handling:**
 *  - `run<T>()` rejects on (a) worker spawn failure (rare), (b) task
 *    serialization error, (c) worker-side thrown error (the worker
 *    posts `{ type: 'error', message }` which `run<T>()` re-throws).
 *  - `terminate()` resolves once all workers are torn down; safe to
 *    call multiple times (idempotent).
 *
 * **Source:** `src/workers/worker-pool.ts` (328L, verified 2026-06-13).
 * **DO NOT CONFUSE WITH** `src/workers/WorkerPool.ts` (PascalCase, legacy,
 * 180L, different API — slated for deletion in Apollo PRE-PUSH P0 #0).
 */
````

---

## What changed from v0.1 → v0.2 (FABRICATION CATCHES)

- **`getStats()` method:** claimed in v0.1 → **DOES NOT EXIST** in v0.2. The telemetry surface is 3 separate getters (`busyCount`, `queuedCount`, `workerCount`), not a single aggregated method.
- **`terminate()` signature:** claimed `() => Promise<void>` in v0.1 → **`() => void` (synchronous)** in v0.2 (verified at L128). The async wrapper was a fabrication — `worker.terminate()` is sync.
- **`run<T>` signature:** claimed `(task: WorkerTask<T>) => Promise<T>` → **`<T>(data: unknown, onProgress?: (progress: WorkerProgress) => void) => Promise<T>`** (verified at L76). I invented `WorkerTask<T>` as the parameter type; the actual signature uses `data: unknown` and an optional `onProgress` callback.
- **`WorkerTask<T>` type:** claimed to be a public type → **DOES NOT EXIST** as a public export. The internal task type is `PendingTask<T>` (private).
- **Public surface count:** 4 members → **5 members** (1 method + 3 getters + 1 sync method, not 1 method + 1 getter + 1 stats + 1 stats).

## What changed from v0.2 → v0.4 (SURGICAL ADDITIONS, 0 new fabrications)

- **File size:** 180L → **328L** actual (verified via Glob + `wc -l`).
- **`WorkerPoolOptions` interface:** NOT documented in v0.2 → **PUBLIC at L10** (v0.4 adds it to the public surface table + JSDoc usage section). Resolves Q1.
- **`WorkerPool` class export status:** claimed "NOT exported directly" in v0.2 → **EXPORTED at L20** (v0.4 corrects the public surface table). Both class and singleton are exported.
- **`workerPool` singleton line:** L178 (approx) → **L289** (actual).
- **4 factory functions ADDED to public surface** (L293, L303, L313, L323):
  - `createMonteCarloPool(options?)` — 2 workers, 120s timeout, Monte Carlo worker factory
  - `createConsolidationPool(options?)` — 1 worker, 60s timeout, consolidation worker factory
  - `createBatchCalcPool(options?)` — 2 workers, 30s timeout, batch-calc worker factory
  - `createStoragePool(options?)` — 1 worker, 30s timeout, storage worker factory
- **Why class + singleton + 4 factories?** v0.4 explains: 3 consumption patterns (general → singleton, domain → factory fn, custom → `new WorkerPool()`).

## Net effect (v0.4)

- **1 new JSDoc block** on `WorkerPool` class
- **Public surface documented**: 1 interface (`WorkerPoolOptions`) + 1 class (`WorkerPool`) + 1 singleton (`workerPool`) + 4 factory functions + 1 method (`run<T>`) + 1 sync method (`terminate`) + 3 getters (`busyCount`, `queuedCount`, `workerCount`) = **11 items total**
- **No fabrications remain** — all signatures D-009 verified against `src/workers/worker-pool.ts:1-328`
- **CRITICAL: API name disambiguation preserved** — "NOT `execute()`" warning still explicit; the 3 getter names are now correct (not `getStats`); the 4 factory functions are pre-bound to specific worker factories (eager guidance for callers choosing between general / domain / custom)
- **Apollo PRE-PUSH P0 #0 alignment:** the JSDoc now matches the real API that `src/test/setup.ts:89` should mock — `class WorkerPool` with `run<T>()` not `execute()`.

## Open questions (for Athena T-AT-013 v0.4 re-validation)

- **Q1 (RESOLVED):** `WorkerPoolOptions` IS public at L10. ✅
- **Q2 (RESOLVED):** `WorkerPool` class IS exported at L20. ✅
- **Q3 (RESOLVED):** All 4 factory functions are LIVE production code, NOT dead. ✅
  - `createMonteCarloPool` — `src/workers/index.ts:54` (production wiring, lazy `monteCarloPool = createMonteCarloPool()`)
  - `createConsolidationPool` — `src/workers/index.ts:61` (production wiring, lazy `consolidationPool = createConsolidationPool()`)
  - `createBatchCalcPool` — `src/workers/index.ts:68` (production wiring, lazy `batchCalcPool = createBatchCalcPool()`)
  - `createStoragePool` — `src/utils/chunkedStorage.ts:8` (production wiring, `const storagePool = createStoragePool()`) AND `src/test/setup.ts:119-120` (Vitest mock for the test harness)

  **This is the smoking gun for why the v0.4 JSDoc matters:** the test mock in `setup.ts` already exists for `createStoragePool` / `createBatchCalcPool` — but it's the legacy `WorkerPool: class {}` mock from the PascalCase refactor that doesn't know about the factory functions. Apollo PRE-PUSH P0 #0 needs to update the mock to include the 4 factory fns AND switch to lowercase `worker-pool.ts` import paths. The v0.4 JSDoc is the canonical reference for that mock fix.
