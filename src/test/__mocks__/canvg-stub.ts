// =============================================================================
// CANVG STUB (bundle-gate fix)
// =============================================================================
// `jspdf` declares canvg as an OPTIONAL dependency used only by its
// `doc.svg()` / SVG-to-PDF path. Because the import inside jspdf is a dynamic
// `import("canvg")`, the bundler eagerly resolves it and pulls in canvg@3 plus
// the entire core-js polyfill library — a ~47 KB (gzip) vendor chunk that no
// application code path ever triggers.
//
// This alias maps `canvg` to an explicit stub so:
//   1. The bytes never enter any chunk (verified by scripts/bundle-check.js).
//   2. If someone ever calls doc.svg(...), they get a loud, actionable error
//      instead of silent breakage — with instructions on how to restore the
//      capability lazily if it becomes a real requirement.
//
// The Vitest config reuses this same alias via vite-config's resolve, so tests
// see identical behavior to production builds.
// =============================================================================

/**
 * jsPDF calls this as `canvg.Canvg.from(ctx, svg)` (or default export) inside
 * its svgToPdf implementation. No app code reaches that path today; throw an
 * explicit unsupported error rather than pretending to work.
 */
const CanvgStub = {
  from(): never {
    throw new Error(
      'SVG embedding in PDF export is disabled: the canvg dependency was removed to meet the bundle-size gate. ' +
        'If you need doc.svg(), restore canvg behind a lazy dynamic import.'
    );
  },
  fromString(): never {
    throw new Error(
      'SVG embedding in PDF export is disabled: the canvg dependency was removed to meet the bundle-size gate. ' +
        'If you need doc.svg(), restore canvg behind a lazy dynamic import.'
    );
  },
};

export default CanvgStub;
export { CanvgStub as Canvg };
