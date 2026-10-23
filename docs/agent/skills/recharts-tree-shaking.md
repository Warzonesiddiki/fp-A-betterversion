---
name: recharts-tree-shaking
description: >
  Use when chart bundle is large or adding a new chart: granular imports, avoid barrel, dynamic import heavy charts, measure treemap.
group: product-ui
---

# Recharts tree-shaking

**Use when** chart-vendor >270KB gz, sector-pages >100KB gz, or adding Treemap/Heatmap/Sparkline.
**Skip when** change is data-only, not chart type.

## Method

1. **Granular imports**: `import { LineChart, Line } from 'recharts'` pulls less than `import * as Recharts`. Prefer named imports from ESM entry.
2. **Avoid barrel**: `src/components/charts/index.ts` that re-exports all charts forces bundler to load whole recharts even if you use one. Import directly.
3. **Dynamic import heavy charts**: `const TreemapChart = lazy(() => import('@/components/charts/TreemapChart'))` — chart lib only loads when route that needs it is visited. Critical path stays clean.
4. **Measure**: `ANALYZE=true npm run build` → `bundle-report/stats.html` → BundleSizeTreemap example shows tree-shaken total 9.5KB min+gz for single LineChart vs 924KB raw for Treemap (99KB gz). Large rectangles = opportunity.
5. **SideEffects**: ensure package has `sideEffects: false` or bundler can't drop unused exports.
6. **Alternative**: if bundle still large, consider Chart.js manual registration (208KB vs 265KB auto, -21% = -57KB) or visx (30-50KB for specific modules) — but requires DEC if swapping lib.

## In this repo

- Recharts used in 79 places, chart-vendor 466KB raw / 129KB gz.
- Sector pages use TreemapChart, HeatmapChart, Sparkline — currently bundled via sector-pages manualChunk (350KB raw).
- Gate: bundle-check G19 chart-vendor <300KB gz.
- Tests mock recharts to avoid layout engine: `vi.mock('recharts', () => ({ ResponsiveContainer: ... }))`.

## Red flags

- `import { Something } from 'recharts'` inside login route.
- Barrel file `charts/index.ts` exporting all.
- Whole recharts imported for one sparkline.

**Proves itself with:** bundle-check chart-vendor size, sector-pages size, visualizer treemap.
**Source:** adapted from github.com/recharts/recharts/issues/7018 bundle size treemap, jamesrossjr.com bundle optimization, pkgpulse.com recharts vs chart.js (MIT, rewritten).
