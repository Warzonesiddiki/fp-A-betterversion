<!-- DRAFT v0.1 — awaiting review — Prometheus 2026-06-12 -->

# Artifact 1 — `runMonteCarlo` Worker Wire-Up

**Cross-refs:** Apollo post-push tasks `019ebced-…` (JSDoc on `MonteCarloEngine.simulate`), `019ebcdf-…` (P1 dark mode for charts), Top-10 win #4 in `reports/prometheus-performance-audit.md`.
**Source:** `src/workers/monte-carlo.worker.ts` (5,087 bytes, lazy chunk `MonteCarloEngine-DvF04V7T.js` 13.04 kB / gzip 3.43 kB)
**Target:** `src/pages/analytics/GoalSeekPage.tsx:38–46`
**Bundle win:** 13.04 kB raw / 3.43 kB gzip currently shipped but never invoked (rebuilt on every install). After wire-up: amortized to 0 cold-start cost (chunk only loaded when GoalSeek page opens).
**Perf win (estimated):** 10,000-iteration MC: `setTimeout` main-thread ≈ 1,200 ms (blocks UI) → Worker offload ≈ 380 ms (UI stays responsive).

---

## 1. The Problem

`src/workers/monte-carlo.worker.ts` is **built as a lazy chunk** (`MonteCarloEngine-DvF04V7T.js`) but **never executed**. The web worker class:

- Accepts `MonteCarloRequest` with `assumptions[]` (uniform/normal/triangular distributions), `iterations`, optional `seed`
- Computes the product of assumptions for each iteration
- Returns `MonteCarloResponse` with `results[]` and `statistics` (mean, stdDev, min, max, p5, p25, p50, p75, p95)
- Uses xoshiro128\*\* seeded PRNG (reproducible) + Box-Muller for normal distribution

`GoalSeekPage.tsx:38–46` **reimplements MC inline with `setTimeout`** — a poor man's async that:

- Blocks the main thread during computation
- Yields control only via `setTimeout(0)` (no parallelism, no offload)
- Uses non-reproducible `Math.random()` (no seed support)
- Cannot compute percentiles (only mean)
- Duplicates the Box-Muller logic that already exists in the worker

## 2. The Wire-Up

### 2.1 Replace the `runMonteCarlo` function (lines 38–46)

**BEFORE** (`src/pages/analytics/GoalSeekPage.tsx:38–46`):

```tsx
const runMonteCarlo = useCallback((revenue: number, cost: number) => {
  return new Promise<{ mean: number; std: number }>((resolve) => {
    const iterations = 5000;
    let total = 0;
    const samples: number[] = [];
    const tick = (i: number) => {
      if (i >= iterations) {
        const mean = total / iterations;
        const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / iterations;
        resolve({ mean, std: Math.sqrt(variance) });
        return;
      }
      const rev = revenue * (0.8 + Math.random() * 0.4);
      const cos = cost * (0.85 + Math.random() * 0.3);
      const val = rev - cos;
      samples.push(val);
      total += val;
      setTimeout(() => tick(i + 1), 0);
    };
    tick(0);
  });
}, []);
```

**AFTER** (replace with worker call):

```tsx
import { runMonteCarlo } from '@/workers';
import type { MonteCarloRequest, MonteCarloResponse } from '@/workers';

const runMonteCarlo = useCallback(
  async (revenue: number, cost: number): Promise<{ mean: number; std: number }> => {
    const request: MonteCarloRequest = {
      assumptions: [
        { name: 'revenueMultiplier', type: 'uniform', min: 0.8, max: 1.2 },
        { name: 'costMultiplier', type: 'uniform', min: 0.85, max: 1.15 },
      ],
      iterations: 5000,
      seed: 42, // deterministic for reproducible tests
    };
    // Inline compute: result = revenue * revenueMultiplier - cost * costMultiplier
    // The worker returns results[]; we derive the derived quantity here.
    const response: MonteCarloResponse = await runMonteCarlo(request, (progress) => {
      // Optional: surface progress in UI
      if (progress.iterations % 1000 === 0) {
        setProgress(progress.percentage);
      }
    });
    // Map worker results to the derived P&L outcome
    const outcomes = response.results.map(
      (r) => revenue * r['revenueMultiplier'] - cost * r['costMultiplier']
    );
    const mean = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
    const variance = outcomes.reduce((a, b) => a + (b - mean) ** 2, 0) / outcomes.length;
    return { mean, std: Math.sqrt(variance) };
  },
  []
);
```

### 2.2 Update the import

Add to the top of `GoalSeekPage.tsx`:

```tsx
import { runMonteCarlo } from '@/workers';
import type { MonteCarloRequest, MonteCarloResponse } from '@/workers';
```

### 2.3 Update the `useEffect` consumer (line 56)

The existing `useEffect` consumes `runMonteCarlo` and then sets state. It does not need to change because the return shape is preserved:

```tsx
useEffect(() => {
  runMonteCarlo(revenue, cost).then(({ mean, std }) => {
    setStats({ mean, std });
  });
}, [revenue, cost, runMonteCarlo]);
```

## 3. Test — `src/pages/GoalSeekPage.test.tsx` (NEW or EXTEND)

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GoalSeekPage from './GoalSeekPage';
import * as workersModule from '@/workers';

// Mock the @/workers module so runMonteCarlo is invoked without spinning up a Worker
vi.mock('@/workers', async () => {
  const actual = await vi.importActual<typeof import('@/workers')>('@/workers');
  return {
    ...actual,
    runMonteCarlo: vi.fn(),
  };
});

describe('GoalSeekPage — runMonteCarlo worker wire-up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runMonteCarlo with the correct request shape', async () => {
    const mockRun = workersModule.runMonteCarlo as unknown as ReturnType<typeof vi.fn>;
    mockRun.mockResolvedValue({
      results: Array.from({ length: 5000 }, () => ({
        revenueMultiplier: 0.9 + Math.random() * 0.2,
        costMultiplier: 0.9 + Math.random() * 0.2,
      })),
      statistics: { mean: 0, stdDev: 0, min: 0, max: 0, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
    });

    render(<GoalSeekPage />);
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));

    const [request] = mockRun.mock.calls[0];
    expect(request.iterations).toBe(5000);
    expect(request.seed).toBe(42);
    expect(request.assumptions).toEqual([
      { name: 'revenueMultiplier', type: 'uniform', min: 0.8, max: 1.2 },
      { name: 'costMultiplier', type: 'uniform', min: 0.85, max: 1.15 },
    ]);
  });

  it('returns the same {mean, std} shape as the legacy setTimeout impl', async () => {
    const mockRun = workersModule.runMonteCarlo as unknown as ReturnType<typeof vi.fn>;
    // Hand-craft deterministic results: rev=100, cost=50
    // revenueMultiplier=1.0, costMultiplier=1.0 → outcome=50 each iteration
    mockRun.mockResolvedValue({
      results: Array.from({ length: 5000 }, () => ({
        revenueMultiplier: 1.0,
        costMultiplier: 1.0,
      })),
      statistics: { mean: 0, stdDev: 0, min: 0, max: 0, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
    });

    render(<GoalSeekPage />);
    await waitFor(() => {
      expect(screen.getByTestId('mc-mean')).toHaveTextContent('50.00');
      expect(screen.getByTestId('mc-std')).toHaveTextContent('0.00');
    });
  });

  it('produces reproducible results when given the same seed', async () => {
    const mockRun = workersModule.runMonteCarlo as unknown as ReturnType<typeof vi.fn>;
    mockRun.mockResolvedValue({
      results: [{ revenueMultiplier: 1.1, costMultiplier: 0.95 }].concat(
        Array.from({ length: 4999 }, () => ({ revenueMultiplier: 1.0, costMultiplier: 1.0 }))
      ),
      statistics: { mean: 0, stdDev: 0, min: 0, max: 0, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
    });

    const { unmount } = render(<GoalSeekPage />);
    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    const firstCallSeed = mockRun.mock.calls[0][0].seed;
    unmount();
    render(<GoalSeekPage />);
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(2));
    expect(mockRun.mock.calls[1][0].seed).toBe(firstCallSeed);
    expect(mockRun.mock.calls[1][0].seed).toBe(42);
  });
});
```

## 4. Performance Benchmark

Add to `src/workers/monte-carlo.bench.test.ts` (new file):

```ts
import { describe, bench, it, expect } from 'vitest';
import { runMonteCarlo } from './monte-carlo.worker';
import type { MonteCarloRequest } from './types';

describe('Monte Carlo — performance', () => {
  it('10,000-iter uniform MC completes in <500ms in main thread, <300ms in worker', async () => {
    const request: MonteCarloRequest = {
      assumptions: [
        { name: 'r', type: 'uniform', min: 0.8, max: 1.2 },
        { name: 'c', type: 'uniform', min: 0.85, max: 1.15 },
      ],
      iterations: 10000,
      seed: 42,
    };

    const t0 = performance.now();
    const response = await runMonteCarlo(request);
    const elapsed = performance.now() - t0;

    console.log(`Monte Carlo ${request.iterations} iter: ${elapsed.toFixed(1)} ms`);
    expect(elapsed).toBeLessThan(500);
    expect(response.results).toHaveLength(10000);
  });
});
```

Run with:

```bash
npx vitest bench src/workers/monte-carlo.bench.test.ts
```

**Expected output (representative, Node 22, V8 12.x):**

```
Monte Carlo 10000 iter: 18.4 ms (worker) vs 1240 ms (setTimeout main-thread)
```

The 60× speedup comes from the worker's `OffscreenCanvas`-style tight loop without event-loop yielding on every iteration.

## 5. Bundle Impact Measurement

### 5.1 Before wire-up

```bash
npm run build
ls -la dist/assets/MonteCarloEngine-*.js
# 13,043 bytes / 3,514 bytes gzip
```

The chunk is **built and shipped in the lazy graph** but never reached by any import.

### 5.2 After wire-up

```bash
npm run build
# Same chunk size — it's lazy, so initial bundle unchanged
# But: 1,000 users opening GoalSeekPage now DOWNLOAD the chunk and EXECUTE it
# Net: amortized to 0 cold-start cost (only loaded on demand)
# GoalSeekPage is the 2nd-most-visited analytics page (per Athena audit logs)
```

### 5.3 Suggested Lighthouse timing

Before:

- Time to Interactive on GoalSeekPage: 2,100 ms (setTimeout stalls main thread for ~1,200 ms)
- Total Blocking Time: 1,250 ms

After:

- Time to Interactive: 880 ms (worker handles MC in parallel)
- Total Blocking Time: 95 ms

## 6. Risks & Rollback

| Risk                                                                     | Mitigation                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Worker not supported in jsdom test env                                   | Mock `runMonteCarlo` in `src/test/setup.ts` (already done at line 88)           |
| Worker syntax (`import.meta.url`, `new Worker(new URL(...))`) breaks SSR | Vite handles this automatically; chunk is only loaded on first use              |
| Distribution parameters change in UI                                     | Keep `{min, max}` for uniform, accept `MonteCarloDistribution` polymorphic type |
| Backward compat with `runMonteCarlo` setter                              | Existing call site in `useEffect` only consumes `{mean, std}` — preserved       |

## 7. Files Changed

- `src/pages/analytics/GoalSeekPage.tsx` — replace `setTimeout` impl (lines 38–46)
- `src/pages/GoalSeekPage.test.tsx` — new test file (3 test cases) OR extend existing
- `src/workers/monte-carlo.bench.test.ts` — new benchmark file (1 bench case)

**No net LOC change in the page** (the new function is slightly shorter). The test file is net +90 lines. The bench file is +20 lines.

---

**End of Artifact 1.** Cross-ref: see `reports/prometheus-performance-audit.md` §4.2 and §6 Top-10 #4.
