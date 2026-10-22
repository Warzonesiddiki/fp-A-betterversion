---
name: performance-and-bundle
description: >
  Use when adding a dependency, a page, a chart or a big table: the bundle has a
  hard budget and finance users scroll 100k rows.
group: product-ui
---

# Performance and bundle

**Use when** the change adds weight or renders a lot of rows.

## Rules

1. **Budget first.** This repo's gzip budget is 2,080 KB and it is nearly full
   (2,063.79 KB as of 2026-10-22). A new library needs a size answer, not a
   feeling.
2. **Route-level code splitting** for anything heavy; the critical path is
   measured separately from the main chunk.
3. **Virtualise long lists.** Rendering 10k rows to show 30 is a bug with a nice
   UI.
4. **Measure before optimising.** `React.memo` on a cheap component is noise; a
   selector returning a new object is the usual real cost.
5. **Keep the hot path allocation-free**: no per-row `formatMoney` on the same
   value, no sort inside render, no `.find` inside `.map` over 5k rows.
6. **Workers** for heavy compute; do not block the main thread with a 200k-row
   aggregation.

## In this repo

- `npm run build` then `node scripts/bundle-check.js` prints raw/gzip, the
  critical path and the main chunk, and fails over budget.
- The bundle is at 99.2 % of budget: the next feature must remove weight or
  justify it explicitly with an owner-visible note.
- Benchmarks exist (`npm run test:bench`); a regression claim needs one.

## Red flags

- "It's only 40 KB" (that is 40 KB of budget, gzipped or not — say which).
- A whole icon set imported for three icons.
- A chart library imported on the login route.

**Proves itself with:** `bundle-check` output before and after.
**Source:** original.
