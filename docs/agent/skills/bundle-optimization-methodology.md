---
name: bundle-optimization-methodology
description: Use when bundle size is near limit or needs reduction. Proven methods: vendor chunking, lazy loading, tree-shaking, custom chart components, stub optional deps.
group: product-ui
---

# Bundle Optimization Methodology

**Use it when:** the bundle is near the size limit, or a new dependency pushes total over budget.

## Proven methods (measured on this project)

1. **Vendor chunking** — `manualChunks` in vite.config.ts splits react, excel, grid, pdf, chart into separate cacheable chunks. Do NOT use a generic `/node_modules/` regex that drags preload-helper into pdf-vendor.

2. **Lazy load routes** — `React.lazy` + `Suspense` for page-level components. Each route becomes its own chunk.

3. **Tree-shaking** — import granularly from libraries (e.g. recharts `LineChart` not the barrel). Avoid barrel imports.

4. **Custom chart components** — replace heavy library components with custom SVG/div implementations. Measured savings: Treemap 99KB gz → custom flex layout, Sankey → custom div flow, Sparkline → custom SVG polyline.

5. **Stub optional deps** — alias unused optional dependencies to stubs. Measured: html2canvas stub (44.7KB gz), dompurify stub (11.24KB gz), canvg stub.

6. **Retire EXPERIMENTAL routes** — RETIRED requires a DEC id + commit (DEC-006). Never delete SUPPORTED routes to fit budget. Re-introduce when scope allows.

## What this prevents

- Deleting breadth to make numbers look better (DEC-006)
- Weakening the bundle gate without a recorded decision
- Shipping un-split bundles that block the browser

## Related

- `performance-and-bundle` — the general skill
- `vite-bundle-deep-optimization` — advanced Vite techniques
- `gates-and-ratchets` — how bundle-check works
