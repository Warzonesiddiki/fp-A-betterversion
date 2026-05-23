/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  parseFormulaReferences,
  evaluateFormula,
  safeEvaluate,
  columnLetterToIndex,
  columnIndexToLetter,
  buildBindingKey,
  buildMetricKey,
  detectCircularReferences,
  calculateColumnSum,
  identifySectionRanges,
} from './report-builder-formulas';

describe('Report Builder Formulas', () => {
  describe('parseFormulaReferences', () => {
    it('parses cell references from formula', () => {
      const refs = parseFormulaReferences('A1+B2+C3');
      expect(refs).toContain('A1');
      expect(refs).toContain('B2');
      expect(refs).toContain('C3');
    });

    it('deduplicates references', () => {
      const refs = parseFormulaReferences('A1+A1+B1');
      expect(refs.filter((r) => r === 'A1')).toHaveLength(1);
    });

    it('handles empty formula', () => {
      const refs = parseFormulaReferences('');
      expect(refs).toHaveLength(0);
    });

    it('handles formula with no references', () => {
      const refs = parseFormulaReferences('1+2+3');
      expect(refs).toHaveLength(0);
    });
  });

  describe('evaluateFormula', () => {
    it('evaluates simple addition', () => {
      const result = evaluateFormula('A1+B1', { A1: 10, B1: 20 });
      expect(result).toBe(30);
    });

    it('evaluates multiplication', () => {
      const result = evaluateFormula('A1*B1', { A1: 5, B1: 10 });
      expect(result).toBe(50);
    });

    it('throws on missing cell reference', () => {
      expect(() => evaluateFormula('A1+B1', { A1: 10 })).toThrow(
        'Missing value for cell reference: B1'
      );
    });

    it('throws on non-finite value', () => {
      expect(() => evaluateFormula('A1+B1', { A1: 10, B1: NaN })).toThrow('Non-finite value');
    });
  });

  describe('safeEvaluate', () => {
    it('evaluates arithmetic expression', () => {
      expect(safeEvaluate('10 + 20 * 2')).toBe(50);
    });

    it('evaluates division', () => {
      expect(safeEvaluate('100 / 4')).toBe(25);
    });

    it('handles parentheses', () => {
      expect(safeEvaluate('(10 + 20) * 2')).toBe(60);
    });
  });

  describe('columnLetterToIndex', () => {
    it('converts A to 0', () => {
      expect(columnLetterToIndex('A')).toBe(0);
    });

    it('converts Z to 25', () => {
      expect(columnLetterToIndex('Z')).toBe(25);
    });

    it('converts AA to 26', () => {
      expect(columnLetterToIndex('AA')).toBe(26);
    });
  });

  describe('columnIndexToLetter', () => {
    it('converts 0 to A', () => {
      expect(columnIndexToLetter(0)).toBe('A');
    });

    it('converts 25 to Z', () => {
      expect(columnIndexToLetter(25)).toBe('Z');
    });

    it('converts 26 to AA', () => {
      expect(columnIndexToLetter(26)).toBe('AA');
    });
  });

  describe('buildBindingKey', () => {
    it('builds key from binding', () => {
      const key = buildBindingKey({ entity: 'ent1', period: '2026-01', account: 'acc1' });
      expect(key).toBe('ent1|2026-01|acc1');
    });
  });

  describe('buildMetricKey', () => {
    it('builds key from metric content', () => {
      const key = buildMetricKey({
        coords: 'A1',
        measure: 'revenue',
        format: 'currency',
        decimals: 0,
        showSign: false,
      });
      expect(key).toContain('revenue');
    });
  });
});
