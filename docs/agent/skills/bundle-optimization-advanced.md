---
name: bundle-optimization-advanced
description: Use when bundle is near limit and needs advanced optimization. Covers vendor splitting, lazy loading, tree-shaking, custom components, and EXPERIMENTAL route retirement.
group: product-ui
---

# Bundle Optimization Advanced

**Use it when:** the bundle is near the size limit, or a new dependency pushes total over budget.

## Current evidence rule

Do not copy the October 2026 bundle sizes below or elsewhere in this library as current. Run `npm run build` and `npm run bundle-check` on the tree under review; distinguish enforced thresholds from measured output.

## Proven Methods

1. **Vendor chunking** — `manualChunks` in vite.config.ts splits react, excel, grid, pdf, chart into separate cacheable chunks.

2. **Lazy load routes** — `React.lazy` + `Suspense` for page-level components.

3. **Tree-shaking** — import granularly from libraries (e.g. recharts `LineChart` not the barrel).

4. **Custom chart components** — replace heavy library components with custom SVG/div implementations.

5. **Remove or stub optional dependencies only after proving they are unused on supported paths.** A bundle reduction that breaks behavior, security, or exports is not an optimization.

6. **Retire EXPERIMENTAL routes** — RETIRED requires a DEC id + commit (DEC-006). Never delete SUPPORTED routes.

## What This Prevents

- Deleting breadth to make numbers look better (DEC-006)
- Weakening the bundle gate without a recorded decision
- Shipping un-split bundles that block the browser

## Related

- `performance-and-bundle` — the general skill
- `vite-bundle-deep-optimization` — advanced Vite techniques
- `gates-and-ratchets` — how bundle-check works
