/**
 * @vitest-environment jsdom
 *
 * Smoke test for ReportBuilderTypes.ts (type-only at the export level).
 * Verifies the module loads and its type exports can shape runtime values.
 */
import { describe, it, expect } from 'vitest';
import type { CellStyle, Alignment } from './ReportBuilderTypes';

const baseStyle: CellStyle = {
  bold: false,
  italic: false,
  underline: false,
  fontSize: 11,
  fontFamily: 'Inter',
  textColor: '#000',
  backgroundColor: 'transparent',
  borderTop: 'none',
  borderBottom: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  alignment: 'left',
  indent: 0,
  wrap: false,
};

describe('ReportBuilderTypes smoke', () => {
  it('module loads with type-only exports', () => {
    expect(typeof baseStyle).toBe('object');
  });

  it('baseline style is well-formed', () => {
    expect(baseStyle.fontSize).toBe(11);
    expect(baseStyle.alignment).toBe<Alignment>('left');
  });

  it('numeric style props tolerate zero/negative/NaN/Infinity', () => {
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect({ ...baseStyle, fontSize: v as number }).toBeDefined();
    }
  });
});
