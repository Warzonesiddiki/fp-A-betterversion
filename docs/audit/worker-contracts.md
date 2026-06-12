# Worker Boundary Contracts Audit

**Task:** T03123 | **Agent:** sentinel | **Date:** 2026-06-08

## Summary

Audited all 8 web workers in `src/workers/` for typed message boundaries, `any` elimination, error handling, and worker termination.

## Findings

### Worker Inventory

| Worker                 | File                      | Shared Types | `any` Free | `onerror` | Status |
| ---------------------- | ------------------------- | :----------: | :--------: | :-------: | ------ |
| monte-carlo            | `monte-carlo.worker.ts`   |      ✅      |     ✅     |    ⚠️     | PASS   |
| consolidation          | `consolidation.worker.ts` |      ✅      |     ✅     |    ⚠️     | PASS   |
| batch-calc             | `batch-calc.worker.ts`    |      ✅      |     ✅     |    ⚠️     | PASS   |
| storage                | `storage.worker.ts`       |      ✅      |   ❌→✅    |    ⚠️     | FIXED  |
| formula                | `formulaWorker.ts`        |      ❌      |     ✅     |    ⚠️     | LEGACY |
| scenario               | `scenarioWorker.ts`       |      ❌      |     ✅     |    ⚠️     | LEGACY |
| export                 | `exportWorker.ts`         |      ❌      |     ✅     |    ⚠️     | LEGACY |
| consolidation (legacy) | `consolidationWorker.ts`  |      ❌      |     ✅     |    ⚠️     | LEGACY |

### Pool Implementations

| Pool        | File             |       Error Handling        |    Termination    |
| ----------- | ---------------- | :-------------------------: | :---------------: |
| WorkerPool  | `WorkerPool.ts`  | ✅ onerror + onmessageerror | ✅ terminateAll() |
| worker-pool | `worker-pool.ts` | ✅ onerror + onmessageerror | ✅ terminateAll() |

### Critical Issues

#### 1. `any` Types — FIXED

- **File:** `storage.worker.ts`
- **Lines:** 11, 16
- **Before:** `payload: any` / `payload?: any`
- **After:** `payload: unknown` / `payload?: unknown`
- **Impact:** Eliminates last `any` in worker layer

#### 2. No `self.onerror` in Any Worker

All 8 workers rely solely on try/catch inside `onmessage`. None set `self.onerror` as a fallback for uncaught errors. The pool implementations (`WorkerPool.ts`, `worker-pool.ts`) do handle `onerror` and `onmessageerror` on the consumer side, providing partial coverage.

#### 3. Legacy Workers Not Using Shared Types

4 workers define their own message interfaces instead of using `WorkerMessage<T>`/`WorkerResponse<T>` from `types.ts`:

- `formulaWorker.ts`: `FormulaWorkerRequest` / `FormulaWorkerResponse`
- `scenarioWorker.ts`: inline message types
- `exportWorker.ts`: custom message types
- `consolidationWorker.ts`: custom types with `[key: string]: unknown` index signature

**Risk:** Low — these workers have no app-level consumers (only test imports). They are effectively dead code from a production standpoint.

### Pool Consumers

All worker instantiation goes through `WorkerPool.ts` or `worker-pool.ts`:

- 15 `new Worker(...)` calls found
- All in `WorkerPool.ts` (pool factory) and `worker-pool.ts` (pool factory)
- Both pools implement `onerror`, `onmessageerror`, and `terminateAll()`

## Fixes Applied

1. **`storage.worker.ts`:** Replaced `payload: any` with `payload: unknown` in both `StorageRequest` and `StorageResult` interfaces.

## Recommendations

1. **Add `self.onerror` to all workers** — provides defense-in-depth beyond try/catch
2. **Migrate legacy workers** to shared `WorkerMessage`/`WorkerResponse` types or mark as deprecated
3. **Remove dead code** — 4 legacy workers (`formulaWorker`, `scenarioWorker`, `exportWorker`, `consolidationWorker`) have no production consumers

## Verdict

**COMPLIANT** — 0 `any` types remain. All active workers use typed interfaces. Pool implementations handle errors and termination.
