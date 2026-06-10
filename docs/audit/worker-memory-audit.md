# Worker Memory Audit — T02518

**Date:** 2026-06-08
**Agent:** atlas
**Scope:** `src/workers/batch-calc.worker.ts`, `worker-pool.ts`, `index.ts`

## Summary

**Leaks found: 0 critical, 2 minor recommendations**

The batch-calc worker and WorkerPool implementation are well-structured with no memory leaks.

---

## Files Audited

| File | Lines | Verdict |
|------|-------|---------|
| `src/workers/batch-calc.worker.ts` | 313 | ✅ Clean |
| `src/workers/worker-pool.ts` | 328 | ✅ Clean |
| `src/workers/index.ts` | 197 | ✅ Clean |
| `src/workers/types.ts` | 192 | ✅ Clean |

---

## Detailed Analysis

### Worker Side (`batch-calc.worker.ts`)

| Check | Status | Detail |
|-------|--------|--------|
| Event listeners not removed | ✅ Pass | Uses `self.onmessage` (single handler), no listener accumulation |
| Large arrays not freed | ✅ Pass | All Maps/Sets/arrays are local to `runBatchCalc()`, GC'd after return |
| Closures holding references | ✅ Pass | All closures are short-lived, no retained references |
| `Function` constructor leak | ✅ Pass | Creates new function per call, but local scope allows GC |
| Worker self-close | ⚠️ N/A | Worker doesn't call `self.close()` — by design, pool manages lifecycle |

### Pool Side (`worker-pool.ts`)

| Check | Status | Detail |
|-------|--------|--------|
| Message listener cleanup | ✅ Pass | `messageHandler` removed on completion, timeout, and error |
| Error listener cleanup | ✅ Pass | `errorHandler` removed on completion, timeout, and error |
| Timeout cleanup | ✅ Pass | `clearTimeout` called in all exit paths |
| Worker termination on timeout | ✅ Pass | Worker terminated and removed from pool on timeout |
| `terminate()` method | ✅ Pass | Terminates all workers, clears timers, rejects queued tasks |
| No listener accumulation | ✅ Pass | Each task adds/removes its own listeners cleanly |

### Parent Side (`index.ts`)

| Check | Status | Detail |
|-------|--------|--------|
| `terminateAllWorkers()` exported | ✅ Pass | Properly terminates and nullifies all pools |
| Singleton pool pattern | ✅ Pass | Lazy init, no duplicate pools |
| `terminateAllWorkers` called | ⚠️ Advisory | Not invoked in app code — only in tests |

---

## Recommendations

### 1. Call `terminateAllWorkers()` on app shutdown (advisory)

For the Tauri desktop shell, workers should be terminated when the window closes to free OS threads.

**Suggested location:** `src/main.tsx` or Tauri `onCloseRequested` handler.

```ts
// In App.tsx or main.tsx
useEffect(() => {
  return () => { terminateAllWorkers(); };
}, []);
```

### 2. Transferable objects for large result sets (advisory)

For spreadsheets with 100k+ cells, the `updatedValues` record sent via `postMessage` uses structured clone. Could be optimized with `ArrayBuffer` transfer, but current data sizes are within acceptable limits.

---

## Conclusion

No memory leaks. The worker lifecycle management is correct. Event listeners are properly cleaned up in all code paths (success, error, timeout). The pool terminates workers on timeout and provides a `terminate()` method for shutdown.

**Status:** PASS — No fixes required.
