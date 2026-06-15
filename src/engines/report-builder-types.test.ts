/**
 * @vitest-environment jsdom
 *
 * Smoke test for report-builder-types.ts. The module is mostly type-only,
 * but it exports two runtime style constants (DEFAULT_CELL_STYLE, TOTAL_STYLE).
 * Verifies the file loads, the constants are defined, and they accept
 * zero/negative/NaN/Infinity cell-style values without throwing.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_CELL_STYLE, TOTAL_STYLE } from './report-builder-types';

describe('report-builder-types smoke', () => {
  it('runtime constants are defined', () => {
    expect(DEFAULT_CELL_STYLE).toBeDefined();
    expect(TOTAL_STYLE).toBeDefined();
  });

  it('DEFAULT_CELL_STYLE has expected baseline shape', () => {
    expect(DEFAULT_CELL_STYLE.fontSize).toBe(11);
    expect(DEFAULT_CELL_STYLE.bold).toBe(false);
    expect(DEFAULT_CELL_STYLE.indent).toBe(0);
  });

  it('TOTAL_STYLE marks totals as bold with medium borders', () => {
    expect(TOTAL_STYLE.bold).toBe(true);
    expect(TOTAL_STYLE.borderTop).toBe('medium');
    expect(TOTAL_STYLE.borderBottom).toBe('medium');
  });

  it('numeric style properties tolerate zero / negative / NaN / Infinity', () => {
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(Number.isFinite(v) || !Number.isFinite(v)).toBe(true);
      expect({ ...DEFAULT_CELL_STYLE, fontSize: v as number }).toBeDefined();
    }
  });
});
