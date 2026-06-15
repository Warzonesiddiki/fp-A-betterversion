# FinPlan Pro — Performance Benchmarks (G17)

> **Owner:** Prometheus (slot `019ecbef-aee8-7ec0-aafb-63176f4a956b`)
> **Tasks:** G10 (35 stores canonical) + G17 (perf benchmarks) + G6 (≥80% coverage)
> **Reference:** `.openhands/baseline-p1-g10-g17.log`

## Targets

| Gate  | Test                       | Threshold                       | Script                   |
| ----- | -------------------------- | ------------------------------- | ------------------------ |
| G17.1 | AG Grid 100K rows          | 30 fps scroll (≤ 33.3 ms/frame) | `grid-bench.mjs`         |
| G17.2 | Monte Carlo 10K iterations | ≤ 30,000 ms                     | `monte-carlo-bench.mjs`  |
| G17.3 | 500-row PDF report         | ≤ 3,000 ms                      | `pdf-bench.mjs`          |
| G10   | 35/35 stores canonical     | All pass                        | `../../audit-stores.cjs` |

## Running

```bash
# Individual benchmark
node scripts/perf/grid-bench.mjs
node scripts/perf/monte-carlo-bench.mjs
node scripts/perf/pdf-bench.mjs

# All three, with combined audit log
node scripts/perf/run-all.mjs

# Generate full P1 (G10 + G17) baseline
node scripts/perf/emit-baseline.cjs
# → .openhands/baseline-p1-g10-g17.log
```

## Last verified results

```
╔════════════════════════════════════════════════════════════╗
║  G17.1 grid-bench      →  4/4  checks  →  ✅ PASS         ║
║  G17.2 monte-carlo     →  3/3  checks  →  ✅ PASS         ║
║  G17.3 pdf-bench       →  3/3  checks  →  ✅ PASS         ║
║  G10 audit (35 stores) →  35/35 canonical → ✅ PASS       ║
╚════════════════════════════════════════════════════════════╝
```

## Methodology notes

- **grid-bench** measures the _JavaScript_ portion of AG Grid performance
  (data prep, cell formatting, scroll frame, sort, memory). A real
  30 fps scroll also requires a browser DOM, which is covered in
  Phase 6 Puppeteer benches (separate suite, owned by Apollo).
- **monte-carlo-bench** re-implements the exact algorithm from
  `src/workers/monte-carlo.worker.ts` (`runMonteCarlo` + `sampleDistribution`
  - `computeStatistics`) and also spawns a real `worker_threads` worker
    to measure thread overhead.
- **pdf-bench** uses the same `jsPDF` 4.x API as `src/engines/ExportEngine.ts`
  with the same rect + text drawing primitives (no `jspdf-autotable` plugin
  in the project's deps, so manual layout — which is also what the project
  uses in production).

## 4-ICP compliance

- **D-002 3-witness rule** — each script independently asserts pass/fail
  with multiple Y/N columns in the audit table; the combined
  `run-all.mjs` is a third independent witness.
- **D-007 real file:line cites** — see baseline log; all 35 stores
  verified at `src/store/*.ts` with canonical pattern.
- **D-009 deterministic** — `mulberry32(seed=42|7)` PRNG used in all
  three benchmarks for reproducible numbers.
- **D-011/D-012 4-ICP** — every commit on this task carries the
  3-witness header in the body.
