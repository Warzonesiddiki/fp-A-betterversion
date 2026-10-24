---
name: bundle-optimization-advanced
description: Use when bundle is near limit and needs advanced optimization. Covers vendor splitting, lazy loading, tree-shaking, custom components, and EXPERIMENTAL route retirement.
group: product-ui
---

# Bundle Optimization Advanced

**Use it when:** the bundle is near the size limit, or a new dependency pushes total over budget.

## Current State (2026-10-23)

- **Total JS:** 95.7% of limit (warns at 1872KB / 2.0MB)
- **Vendor chunks:** excel-core 248KB, grid 206KB, pdf 134KB, chart 121KB
- **All G19 vendor checks PASS**

## Proven Methods

1. **Vendor chunking** — `manualChunks` in vite.config.ts splits react, excel, grid, pdf, chart into separate cacheable chunks.

2. **Lazy load routes** — `React.lazy` + `Suspense` for page-level components.

3. **Tree-shaking** — import granularly from libraries (e.g. recharts `LineChart` not the barrel).

4. **Custom chart components** — replace heavy library components with custom SVG/div implementations.

5. **Stub optional deps** — alias unused optional dependencies to stubs (html2canvas, dompurify, canvg).

6. **Retire EXPERIMENTAL routes** — RETIRED requires a DEC id + commit (DEC-006). Never delete SUPPORTED routes.

## What This Prevents

- Deleting breadth to make numbers look better (DEC-006)
- Weakening the bundle gate without a recorded decision
- Shipping un-split bundles that block the browser

## Related

- `performance-and-bundle` — the general skill
- `vite-bundle-deep-optimization` — advanced Vite techniques
- `gates-and-ratchets` — how bundle-check works
