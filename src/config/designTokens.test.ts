import { describe, it, expect } from 'vitest';
import { designTokens } from './designTokens';

describe('designTokens config', () => {
  it('defines the primary brand palette with ten shades', () => {
    const primary = designTokens.colors.primary as Record<string, string>;
    expect(Object.keys(primary)).toHaveLength(10);
    for (const [shade, value] of Object.entries(primary)) {
      expect(Number(shade)).toBeGreaterThanOrEqual(50);
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('defines financial semantic colors for positive/negative states', () => {
    const fin = designTokens.colors.financial;
    expect(fin.positive).toMatch(/^#/);
    expect(fin.negative).toMatch(/^#/);
    expect(fin.neutral).toMatch(/^#/);
    expect(fin.warning).toMatch(/^#/);
    expect(fin.highlight).toMatch(/^#/);
    expect(fin.positive).not.toBe(fin.negative);
  });

  it('provides a chart palette of unique colors', () => {
    const charts = designTokens.colors.charts;
    expect(charts.length).toBeGreaterThanOrEqual(8);
    expect(new Set(charts).size).toBe(charts.length);
    for (const c of charts) expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('covers all sectors with a brand color each', () => {
    const sector = designTokens.sector as Record<string, string>;
    const keys = Object.keys(sector);
    expect(keys.length).toBeGreaterThanOrEqual(12);
    for (const [key, value] of Object.entries(sector)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('semantic tones include info/success/warning/danger/neutral with fg/bg/border', () => {
    const semantic = designTokens.semantic as Record<string, Record<string, string>>;
    for (const tone of ['info', 'success', 'warning', 'danger', 'neutral']) {
      expect(semantic[tone]).toBeDefined();
      expect(semantic[tone]!.fg).toMatch(/^#/);
      expect(semantic[tone]!.bg).toMatch(/^#/);
      expect(semantic[tone]!.border).toMatch(/^#/);
    }
  });

  it('exposes typography, spacing, density, radius, elevation, z-index and motion scales', () => {
    expect(designTokens.typography.sans).toBeTruthy();
    expect(designTokens.typography.mono).toBeTruthy();
    expect(designTokens.typography.tabularFigures).toBeTruthy();
    expect(designTokens.spacing.cell).toBeTruthy();
    expect(designTokens.spacing.scale).toBeTruthy();
    expect(designTokens.density.standard).toBeTruthy();
    expect(designTokens.density.compact).toBeTruthy();
    expect(designTokens.density.comfortable).toBeTruthy();
    expect(designTokens.radius.md).toBeTruthy();
    expect(designTokens.radius.full).toBeTruthy();
    expect(Object.keys(designTokens.elevation).length).toBeGreaterThanOrEqual(5);
    expect(designTokens.zIndex.modal).toBeGreaterThan(designTokens.zIndex.base);
    expect(designTokens.motion.fast).toBeTruthy();
    expect(designTokens.motion.easeInOut).toBeTruthy();
    expect(designTokens.breakpoints.md).toBeTruthy();
  });

  it('exposes focus-ring, chart palette and shadow token groups', () => {
    expect(designTokens.focusRing.width).toBeTruthy();
    expect(designTokens.focusRing.color).toMatch(/^#/);
    expect(designTokens.chartPalette.categorical.length).toBeGreaterThan(0);
    expect(designTokens.chartPalette.sequential.length).toBeGreaterThan(0);
    expect(designTokens.chartPalette.diverging.length).toBeGreaterThan(0);
    expect(designTokens.shadows.card).toBeTruthy();
    expect(designTokens.shadows.modal).toBeTruthy();
  });
});
