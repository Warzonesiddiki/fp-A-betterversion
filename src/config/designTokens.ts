/**
 * Design tokens — the grid/table density scale.
 *
 * This file used to carry thirteen token groups (brand colours, semantic tones,
 * a 16-sector palette, typography, spacing, radius, elevation, z-index, motion,
 * breakpoints, focus ring, chart palette, shadows). None of them were ever
 * imported by a component: the only consumers were this module's own type
 * aliases and its shape test. Meanwhile the values that *do* drive the product
 * live in `src/index.css` as custom properties, and the two had drifted apart —
 * radius `xs` was 2px here and 4px there, `sm` 4px vs 6px, and the negative
 * financial colour was #dc2626 here against #f43f5e in the stylesheet.
 *
 * Two palettes that disagree are worse than one, so the dead groups are gone.
 * `src/index.css` is the single source of truth for colour, radius, spacing,
 * elevation and motion; the `@theme inline` bridge there exposes them to
 * Tailwind and `src/theme/tokenBridge.contract.test.ts` pins that mapping.
 *
 * Density stays in TypeScript because it is genuinely read at runtime: AG Grid
 * needs numeric `rowHeight`/`headerHeight`, which CSS custom properties cannot
 * supply to a JS API. The `[data-density]` blocks in `index.css` mirror these
 * numbers for the CSS side, and `useDensity.test.ts` asserts the two stay in
 * step. Add new tokens to the stylesheet, not here, unless JavaScript must read
 * the value.
 */

export const designTokens = {
  density: {
    compact: {
      rowHeight: 28,
      headerHeight: 32,
      fontSize: '12px',
      cellPadding: '2px 6px',
    },
    standard: {
      rowHeight: 36,
      headerHeight: 40,
      fontSize: '13px',
      cellPadding: '4px 8px',
    },
    comfortable: {
      rowHeight: 48,
      headerHeight: 48,
      fontSize: '14px',
      cellPadding: '8px 12px',
    },
  },
} as const;

export type Density = keyof typeof designTokens.density;
