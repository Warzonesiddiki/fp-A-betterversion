---
name: vite-bundle-deep-optimization
description: >
  Use when bundle is near limit or a new dependency pushes total over budget: split vendors, lazy routes, avoid barrels, measure before/after.
group: product-ui
---

# Vite bundle deep optimization

**Use when** `bundle-check` is >90% of limit or a feature adds weight.
**Skip when** change is <5KB gz and budget has headroom.

## Method

1. **Measure first**: `npm run build` + `node scripts/bundle-check.js` prints total raw/gzip, critical path, main chunk, top 10. Save output.
2. **Visualize**: `ANALYZE=true npm run build` → `bundle-report/stats.html` treemap. Large rectangles in unexpected places are opportunities.
3. **ManualChunks rules** (vite.config.ts):
   - Function form only (object form deprecated in Vite 8, breaks in Rolldown). One narrow rule per group.
   - Stable vendors isolated: react-vendor, chart-vendor, grid-community-vendor, excel-core-vendor, pdf-vendor, db-vendor, icon-vendor.
   - Do NOT use generic `/node_modules/` regex — it drags `vite/preload-helper` into lazy chunk and eagerly preloads heavy vendors (pdf 616KB case).
   - Sector pages: avoid grouping 19 dashboards into one `sector-pages` chunk (350KB raw). Let each be its own lazy chunk or split by domain — better cache, same total but smaller per-route.
4. **Route-level lazy**: every route in `src/App.tsx` is `lazy(() => import(...))` + Suspense. A visitor to `/dashboard` never downloads `/sector/*`.
5. **Avoid barrels**: `import { X } from '@/components/ui'` loads entire ui folder. Import directly: `import { Button } from '@/components/ui/Button'`. Barrel files force bundler to load whole graph.
6. **ESM + sideEffects**: ensure deps publish ESM (`module` field). `sideEffects: false` in package.json tells bundler unused exports can be dropped.
7. **Cherry-pick**: `import debounce from 'lodash-es/debounce'` not `from 'lodash'`. `date-fns` 16KB gz vs `moment` 231KB.
8. **Dynamic import for heavy widgets**: `const HeavyChart = lazy(() => import('./HeavyChart'))` inside sector page, not at top-level. Chart lib only loads when user opens that sector.
9. **Measure after**: build + bundle-check again. Total must not increase. Critical path must stay <750KB gz, main <150KB gz, lazy vendors <300KB gz each (G19).
10. **Document**: commit message includes before/after gzip numbers, what was removed, and what remains.

## In this repo

- Budget: 2080KB gzip total (DEC-024, measured 2061.71KB at Phases 0-14). Target 1950KB for headroom (N7).
- Current: 2064.16KB gzip = 99.2% of limit, 1 warning (excel 248KB, grid 206KB, pdf 179KB, chart 129KB, sector-pages 109KB).
- Gates: `npm run bundle-check` (fails over limit), `npm run build` must pass tsc + eslint first.
- Visualizer: `rollup-plugin-visualizer` with `ANALYZE=true`.
- Critical path measured from `dist/index.html` modulepreloads — lazy vendors must NOT be in critical path (MUST_BE_LAZY check).

## Red flags

- "It's only 40KB" without saying gzipped or raw.
- Generic `id.includes('node_modules')` manualChunk — causes preload helper regression.
- Whole icon set imported for 3 icons.
- Chart lib imported on login route.

**Proves itself with:** bundle-check output before and after, critical path, main chunk, top 10 list.
**Source:** adapted from vitejs/vite discussions #9440, shaxadd.medium.com optimizing vite bundle, mykolaaleksandrov.dev taming large chunks (MIT, CC), rewritten.
