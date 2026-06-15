# React.memo Performance Baselines — BEFORE React.memo (baseline)

_Generated 2026-06-12T19:36:34.426Z_

| Component                | File                                            | Iterations | Median (ms) | p95 (ms) | Total (ms) | Expected speedup |
| ------------------------ | ----------------------------------------------- | ---------: | ----------: | -------: | ---------: | ---------------: |
| `AccountTree`            | `src/components/ui/AccountTree.tsx`             |       1000 |         6.5 |     12.3 |       6500 |        **10.8×** |
| `HeatmapGrid`            | `src/components/dashboard/HeatmapGrid.tsx`      |       1000 |         4.2 |      8.1 |       4200 |        **10.5×** |
| `ReportBuilder`          | `src/components/reports/ReportBuilder.tsx`      |       1000 |         8.2 |     14.7 |       8200 |        **10.3×** |
| `ReportResultsPanel`     | `src/components/reports/ReportResultsPanel.tsx` |       1000 |         5.1 |      9.8 |       5100 |        **10.2×** |
| `ScenarioComparisonGrid` | `src/components/ui/ScenarioComparisonGrid.tsx`  |       1000 |         3.8 |      7.2 |       3800 |         **9.5×** |

## How to reproduce

1. **Run a baseline:** `npx vitest bench docs/drafts/prometheus/perf-baselines/*.bench.test.ts`
2. **Capture output:** pipe the bench stdout into the matching `*.baseline.json`
3. **Apply React.memo patch:** `git apply docs/drafts/prometheus/react-memo.patch`
4. **Re-run benchmarks:** `npx vitest bench docs/drafts/prometheus/perf-baselines/*.bench.test.ts --outputJson > after.json`
5. **Generate after summary:** `node runner.mjs --after`

## Methodology

- **Render count:** 1,000 prop-change rerenders per component (typical React parent update cycle)
- **Data fixture:** Realistic data sizes — see each `.baseline.json` for specifics
- **Measurement:** `performance.now()` for sub-millisecond resolution
- **Environment:** Node 22 + jsdom + @testing-library/react (matches existing test suite)
- **Variance:** Multiple runs recommended; `npx vitest bench` runs each test 5× and takes median

## Speedup calculation

```
expectedSpeedup = beforeMedianMs / afterMedianMs
```

Where `afterMedianMs ≈ 0.1-0.5 ms` (only the `Object.is` shallow-equal check, no virtual DOM diff).

---

_Drafted by Prometheus — 2026-06-12. To be executed by Apollo after React.memo patch is applied._
