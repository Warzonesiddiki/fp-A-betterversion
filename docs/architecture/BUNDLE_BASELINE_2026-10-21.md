# Bundle baseline — 2026-10-21 (N7)

Measured at HEAD `bbbd6b16`, after `npm run build` (tsc → eslint → vite build) and
`node scripts/bundle-check.js`. N7 explicitly says not to trust the recorded
2,061.71 KB, so this is a fresh measurement.

## Gate result

| Gate                             | Measured                                                                 | Limit              | Status                           |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------ | -------------------------------- |
| Total JS gzip                    | **2,061.24 KB**                                                          | 2,080 KB (DEC-024) | PASS, 99.1 % — warning at ≥ 90 % |
| Main chunk (`index`)             | 69.73 KB gzip                                                            | 150 KB (G3)        | PASS                             |
| Critical path (9 modulepreloads) | 425.13 KB gzip                                                           | —                  | PASS                             |
| Lazy vendor in critical path     | none                                                                     | none               | PASS                             |
| G19 per-vendor                   | excel 248.23 · grid 206.35 · pdf 179.11 · chart 129.3 · grid-react 14.28 | 300 KB each        | PASS                             |

The recorded 2,061.71 KB holds within 0.5 KB; the build is reproducible.

## Largest chunks (gate's own gzip figures)

| Chunk                   | gzip      |
| ----------------------- | --------- |
| `excel-core-vendor`     | 248.23 KB |
| `grid-community-vendor` | 206.35 KB |
| `pdf-vendor`            | 179.11 KB |
| `chart-vendor`          | 129.30 KB |
| `sector-pages`          | 107.89 KB |
| `index`                 | 69.73 KB  |
| `react-vendor`          | 54.44 KB  |
| `PluginMarketplacePage` | 46.92 KB  |
| `ReportDesignerPage`    | 46.92 KB  |
| `ui-primitives`         | 34.77 KB  |

## Composition (sourcemap pass)

A second build with `--sourcemap` was written to a scratch `outDir`, analysed, and
deleted. Its gzip numbers use default zlib settings and are **not** comparable to
the gate's; only the shares below are meaningful.

| Group         | Chunks | Share of JS bytes |
| ------------- | ------ | ----------------- |
| Vendor        | 8      | 41.5 %            |
| App + engines | 400    | 56.8 %            |
| Workers       | 5      | 1.8 %             |

- **130 chunks are under 1 KB gzip** (88 of them engine-only).
- **Module duplication is almost absent**: only five modules appear in more than
  one chunk (`workers/validateRequest` ×5, `utils/money` ×3, `SmartImportMapper`
  ×2, `parseFinancialAmount` ×2, `parseImportDate` ×2). There is no duplicate
  vendor to merge.

## Experiment A — route-level split of the sector pages (REJECTED)

`manualChunks` merges all 19 lazy sector dashboards into one `sector-pages` chunk,
so opening `/sector/retail` downloads every other sector too. Replacing that rule
with a `sector-shared` group let each `lazy(() => import(...))` become its own
chunk, as the router already intended.

| Metric                          | Before               | After                 | Verdict                           |
| ------------------------------- | -------------------- | --------------------- | --------------------------------- |
| Total JS gzip                   | 2,061.24 KB          | **2,084.01 KB**       | **FAILS the 2,080 gate (+22.77)** |
| Chunks emitted                  | 415                  | 456                   | —                                 |
| Critical path                   | 425.13 KB / 9 chunks | 412.67 KB / 22 chunks | improved                          |
| Per-route payload (`/sector/*`) | 107.89 KB            | ~15 KB                | improved                          |

**Reverted.** The single `sector-pages` chunk is load-bearing for the budget:
nineteen separate dynamic entries duplicate the shared sector helpers between
them, and the duplication costs more than the per-route win returns. Trading the
enforced total metric for an out-of-scope route's payload would be raising the
ceiling to fit a feature, which DEC-024 forbids.

## What this means for N7

**There is no remaining config-only reduction.** The bytes are in two places:

1. **Vendors — 41.5 %.** exceljs (248 KB), ag-grid (206 KB), jsPDF (179 KB) and
   recharts (129 KB). Every one is already lazy and inside its G19 budget.
2. **Engines — 170 engine-only chunks totalling ~268 KB.** These exist because
   `engineManifest.generated.ts` gives every engine a real dynamic import, which
   is what fixed N-0013 ("99 engines reachable only through a barrel that nothing
   imported"). 88 of those chunks are under 1 KB gzip; the wrapper and import
   plumbing cost more than several engines do.

Reducing either requires a **scope decision**, not a build tweak:

- replace `exceljs` with a lighter writer (unmeasured; affects every export path);
- retire the 82 orphan engines from the manifest (re-opens N-0013 deliberately);
- merge sub-1KB chunks into one group (needs an "orphan vs wired" classification
  at config time, otherwise any page importing one engine loads a quarter of a
  megabyte of unrelated engines);
- or accept 2,061 KB as the v1 budget and stop treating N7 as open work.

Recorded as DEC-049. N7's close condition ("measured drop") is **not** met, so N7
stays open pending that choice.
