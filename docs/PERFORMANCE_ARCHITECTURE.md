# FinPlan Pro — Performance Architecture (17 items)

> **Source:** Performance hardening blueprint
> **Date:** 2026-05-20

## BUILT ✅

| # | Item | File | Lines |
|---|------|------|-------|
| 1 | Engine Registry (lazy loading) | src/engines/EngineRegistry.ts | 199 |
| 2 | Calculation Queue (priority scheduler) | src/engines/CalculationQueue.ts | 241 |
| 5 | Calculation Result Cache (LRU) | Built into CalculationQueue.ts | — |
| 8 | Memory Monitor + Cold Eviction | src/utils/memoryMonitor.ts | 139 |
| 10 | Store Persistence Debouncing | src/utils/persistenceDebouncer.ts | 84 |
| 16 | Error Boundary Network | src/components/errors/ (3 files) | ~200 |

## NEEDED ❌

| # | Item | Priority | Effort |
|---|------|----------|--------|
| 3 | IndexedDB Bulk Operations | HIGH | 4h |
| 4 | Formula Engine WASM (Rust sidecar) | MEDIUM | 16h |
| 6 | Route-Based Code Splitting | HIGH | 4h |
| 7 | AG Grid SSRM Integration | HIGH | 6h |
| 9 | Tauri Rust Sidecar for File I/O | MEDIUM | 8h |
| 11 | Offscreen/Worker Canvas for Charts | LOW | 6h |
| 12 | Streaming Architecture for Import/Export | MEDIUM | 6h |
| 13 | React Component Memoization Strategy | HIGH | 4h |
| 14 | Service Worker Strategy | MEDIUM | 4h |
| 15 | Startup Time Budget & Telemetry | MEDIUM | 4h |
| 17 | FinPlan Kernel Pattern | HIGH | 8h |

## 90-Day Performance Roadmap

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1-2 | Engine Registry + Lazy Loading | 5 engines at startup, rest on-demand |
| 3-4 | IndexedDB Bulk Layer | 10K rows in <1s |
| 5-6 | Worker Pool + Calculation Queue | UI never freezes |
| 7-8 | Formula WASM (or prep) | 100K cells in <50ms |
| 9-10 | AG Grid SSRM | 100K rows smooth |
| 11-12 | Memory Monitor + Store Optimization | <512MB for 8hr sessions |

## The One Rule That Matters Most

**No engine may import React. No store may import a charting library. No page may import another page's internals.**

This enforces:
- Engines are pure (testable, cacheable, runnable in workers)
- Stores are data-only (serializable, syncable)
- Pages are isolated (code-splittable, independently deployable)
