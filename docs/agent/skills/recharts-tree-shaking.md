---
name: recharts-tree-shaking
description: >
  Use when chart bundle is large or adding a new chart: granular imports, avoid barrel, dynamic import heavy charts, measure treemap.
group: product-ui
---

# Recharts tree-shaking

**Use when** a fresh bundle report shows a chart-related chunk approaching its enforced limit, or a new chart/widget is proposed.
**Skip when** change is data-only, not chart type.

## Method

1. **Granular imports**: `import { LineChart, Line } from 'recharts'` pulls less than `import * as Recharts`. Prefer named imports from ESM entry.
2. **Avoid barrel**: `src/components/charts/index.ts` that re-exports all charts forces bundler to load whole recharts even if you use one. Import directly.
3. **Dynamic import heavy charts**: `const TreemapChart = lazy(() => import('@/components/charts/TreemapChart'))` — chart lib only loads when route that needs it is visited. Critical path stays clean.
4. **Measure**: `ANALYZE=true npm run build` and inspect the generated treemap when available; report exact current raw/gzip output. Historical LineChart/Treemap numbers are examples only, not expected savings.
5. **SideEffects**: ensure package has `sideEffects: false` or bundler can't drop unused exports.
6. **Alternative**: evaluate another chart library only against current usage, license, accessibility, functionality, and a measured before/after build; do not use old third-party size comparisons as evidence.

## In this repo

- Current `vite.config.ts` assigns Recharts to `chart-vendor` and sector-page modules to `sector-pages`; this is chunking configuration, not proof of current sizes or lazy-load behavior.
- Run `npm run build` and `npm run bundle-check` for fresh measurements; the bundle gate applies the named lazy-vendor limit from its script.
- Tests mock recharts to avoid layout engine: `vi.mock('recharts', () => ({ ResponsiveContainer: ... }))`.

## Red flags

- `import { Something } from 'recharts'` inside login route.
- Barrel file `charts/index.ts` exporting all.
- Whole recharts imported for one sparkline.

**Proves itself with:** bundle-check chart-vendor size, sector-pages size, visualizer treemap.
**Source:** adapted from github.com/recharts/recharts/issues/7018 bundle size treemap, jamesrossjr.com bundle optimization, pkgpulse.com recharts vs chart.js (MIT, rewritten).
