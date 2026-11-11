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
   - Sector pages currently have a `sector-pages` manual chunk rule. Do not split or re-group by prescription: test route loading, caching, total gzip, and critical path before changing it.
4. **Route-level lazy**: inspect the actual route and emitted chunks; do not infer that a route avoids downloads solely from a lazy import. Verify the critical path and runtime behavior.
5. **Inspect barrel imports** in the treemap. They can inhibit tree-shaking depending on exports and side effects; prefer a direct import only when the build proves it reduces unwanted code.
6. **ESM and side effects**: inspect package exports and documented side effects. Never mark a package or project `sideEffects: false` unless that contract is true; a false declaration can remove required initialization.
7. **Cherry-pick** only when the package supports it and current bundle analysis shows a gain. Do not repeat generic package-size comparisons as project measurements.
8. **Dynamic import for heavy widgets**: `const HeavyChart = lazy(() => import('./HeavyChart'))` inside sector page, not at top-level. Chart lib only loads when user opens that sector.
9. **Measure after**: build + bundle-check again. Total must not increase. Critical path must stay <750KB gz, main <150KB gz, lazy vendors <300KB gz each (G19).
10. **Document**: report before/after gzip numbers from the same current build, what changed, and what remains unverified.

## In this repo

- Enforced limits are maintained in `scripts/bundle-check.js` (main 150 KB gzip, total 2,080 KB, named lazy vendors 300 KB each, critical path 750 KB). Do not copy historical size percentages as current; run a fresh build and `npm run bundle-check`.
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
