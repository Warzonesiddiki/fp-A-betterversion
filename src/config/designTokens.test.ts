import { describe, it, expect } from 'vitest';
import { designTokens } from './designTokens';

/**
 * `designTokens` is deliberately narrow: it holds the density scale and nothing
 * else. Everything visual (colour, radius, spacing, elevation, motion) lives in
 * `src/index.css` so there is exactly one palette. The previous version of this
 * file asserted the shape of thirteen token groups that no component imported,
 * and those groups had silently drifted out of agreement with the stylesheet.
 *
 * The tests below therefore guard two things: the density values AG Grid reads
 * at runtime, and the absence of a second palette creeping back in.
 */
describe('designTokens config', () => {
  it('defines the three density modes with the metrics AG Grid needs', () => {
    expect(Object.keys(designTokens.density)).toEqual(['compact', 'standard', 'comfortable']);

    for (const mode of ['compact', 'standard', 'comfortable'] as const) {
      const metrics = designTokens.density[mode];
      expect(typeof metrics.rowHeight).toBe('number');
      expect(typeof metrics.headerHeight).toBe('number');
      expect(metrics.fontSize).toMatch(/^\d+px$/);
      expect(metrics.cellPadding).toMatch(/^\d+px \d+px$/);
    }
  });

  it('orders the density modes so each step is roomier than the last', () => {
    const { compact, standard, comfortable } = designTokens.density;

    expect(compact.rowHeight).toBeLessThan(standard.rowHeight);
    expect(standard.rowHeight).toBeLessThan(comfortable.rowHeight);
    expect(compact.headerHeight).toBeLessThanOrEqual(standard.headerHeight);
    expect(standard.headerHeight).toBeLessThanOrEqual(comfortable.headerHeight);
  });

  it('keeps row heights tall enough for a 44px touch target at comfortable', () => {
    // Comfortable is the accessibility-friendly mode; WCAG 2.5.5 asks for 44px.
    expect(designTokens.density.comfortable.rowHeight).toBeGreaterThanOrEqual(44);
  });

  it('carries no palette of its own — index.css is the only source of colour', () => {
    // Regression guard. A second, drifting palette lived here for a long time
    // (radius xs 2px vs the stylesheet's 4px, negative #dc2626 vs #f43f5e).
    // Anything colour-, radius- or spacing-shaped belongs in index.css.
    expect(Object.keys(designTokens)).toEqual(['density']);

    const serialised = JSON.stringify(designTokens);
    expect(serialised).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(serialised).not.toMatch(/rgba?\(/i);
  });
});
