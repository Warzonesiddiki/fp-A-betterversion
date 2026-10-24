import { describe, it, expect } from 'vitest';
import {
  parseFormulaReferences,
  evaluateFormula,
  safeEvaluate,
  columnLetterToIndex,
  columnIndexToLetter,
  detectCircularReferences,
} from './report-builder-formulas';
import type { ReportLayout, ReportRow, ReportCell } from './report-builder-types';

/**
 * GOVERNANCE EVIDENCE for cap:report.xlsx-formula
 *
 * The report-builder-formulas engine evaluates Excel-like formulas in report
 * layouts. The governance dimension here is SAFETY — formula evaluation must
 * be deterministic, reject non-finite results, detect missing cell references,
 * and detect circular references. If formulas evaluate incorrectly or unsafely,
 * the exported Excel report contains wrong numbers.
 *
 * Tested dimensions:
 * 1. Formula parsing (references extracted, deduplicated)
 * 2. Formula evaluation (correct results with cell values)
 * 3. Safe evaluation (no code injection, rejects non-finite)
 * 4. Missing cell reference detection (throws)
 * 5. Non-finite value detection (throws)
 * 6. Column letter/index conversion
 * 7. Circular reference detection
 * 8. Determinism
 */

describe('report-builder-formulas — GOVERNANCE (report.xlsx-formula)', () => {

  describe('1. Formula parsing', () => {

    it('parseFormulaReferences extracts cell references', () => {
      const refs = parseFormulaReferences('A1+B2+C3');
      expect(refs).toEqual(['A1', 'B2', 'C3']);
    });

    it('parseFormulaReferences deduplicates repeated references', () => {
      const refs = parseFormulaReferences('A1+A1+B2');
      expect(refs).toEqual(['A1', 'B2']);
    });

    it('parseFormulaReferences returns empty array for no references', () => {
      const refs = parseFormulaReferences('2+3');
      expect(refs).toEqual([]);
    });

    it('parseFormulaReferences handles multi-letter columns', () => {
      const refs = parseFormulaReferences('AA1+AB2+ZZ100');
      expect(refs).toEqual(['AA1', 'AB2', 'ZZ100']);
    });
  });

  describe('2. Formula evaluation', () => {

    it('evaluateFormula computes sum of cell values', () => {
      const result = evaluateFormula('A1+B2', { A1: 100, B2: 200 });
      expect(result).toBe(300);
    });

    it('evaluateFormula computes multiplication', () => {
      const result = evaluateFormula('A1*B2', { A1: 5, B2: 3 });
      expect(result).toBe(15);
    });

    it('evaluateFormula computes division', () => {
      const result = evaluateFormula('A1/B2', { A1: 100, B2: 4 });
      expect(result).toBe(25);
    });

    it('evaluateFormula computes subtraction', () => {
      const result = evaluateFormula('A1-B2', { A1: 100, B2: 30 });
      expect(result).toBe(70);
    });

    it('evaluateFormula handles complex expressions', () => {
      const result = evaluateFormula('(A1+B2)*C3', { A1: 1, B2: 2, C3: 3 });
      expect(result).toBe(9);
    });

    it('evaluateFormula handles percentage calculations', () => {
      const result = evaluateFormula('A1*0.15', { A1: 200 });
      expect(result).toBe(30);
    });
  });

  describe('3. Safe evaluation', () => {

    it('safeEvaluate evaluates simple expressions', () => {
      expect(safeEvaluate('2+3')).toBe(5);
      expect(safeEvaluate('10-4')).toBe(6);
      expect(safeEvaluate('2*3')).toBe(6);
      expect(safeEvaluate('8/2')).toBe(4);
    });

    it('safeEvaluate handles parentheses', () => {
      expect(safeEvaluate('(2+3)*4')).toBe(20);
      expect(safeEvaluate('2+(3*4)')).toBe(14);
    });

    it('safeEvaluate rejects non-finite results', () => {
      expect(() => safeEvaluate('1/0')).toThrow();
    });

    it('safeEvaluate does not execute code', () => {
      // The safe evaluator only handles arithmetic — no function calls
      expect(() => safeEvaluate('typeof window')).toThrow();
    });
  });

  describe('4. Missing cell reference detection', () => {

    it('evaluateFormula throws when cell reference is missing', () => {
      expect(() => evaluateFormula('A1+B2', { A1: 100 })).toThrow(
        'Missing value for cell reference: B2'
      );
    });

    it('evaluateFormula throws when multiple references are missing', () => {
      expect(() => evaluateFormula('A1+B2+C3', { A1: 100 })).toThrow(
        'Missing value for cell reference: B2'
      );
    });
  });

  describe('5. Non-finite value detection', () => {

    it('evaluateFormula throws when cell value is NaN', () => {
      expect(() => evaluateFormula('A1+B2', { A1: NaN, B2: 200 })).toThrow(
        'Non-finite value for cell reference: A1'
      );
    });

    it('evaluateFormula throws when cell value is Infinity', () => {
      expect(() => evaluateFormula('A1+B2', { A1: Infinity, B2: 200 })).toThrow(
        'Non-finite value for cell reference: A1'
      );
    });
  });

  describe('6. Column letter/index conversion', () => {

    it('columnLetterToIndex converts A to 0', () => {
      expect(columnLetterToIndex('A')).toBe(0);
    });

    it('columnLetterToIndex converts Z to 25', () => {
      expect(columnLetterToIndex('Z')).toBe(25);
    });

    it('columnLetterToIndex converts AA to 26', () => {
      expect(columnLetterToIndex('AA')).toBe(26);
    });

    it('columnIndexToLetter converts 0 to A', () => {
      expect(columnIndexToLetter(0)).toBe('A');
    });

    it('columnIndexToLetter converts 25 to Z', () => {
      expect(columnIndexToLetter(25)).toBe('Z');
    });

    it('columnIndexToLetter converts 26 to AA', () => {
      expect(columnIndexToLetter(26)).toBe('AA');
    });

    it('column letter/index round-trips', () => {
      for (const letter of ['A', 'Z', 'AA', 'AB', 'ZZ']) {
        expect(columnIndexToLetter(columnLetterToIndex(letter))).toBe(letter);
      }
    });
  });

  describe('7. Circular reference detection', () => {

    function makeLayout(cells: Array<{ id: string; type: 'formula' | 'metric'; expression?: string }>): ReportLayout {
      const rows: ReportRow[] = [{
        id: 'row1',
        type: 'data',
        cells: cells.map((c) => {
          const cell: ReportCell = {
            id: c.id,
            type: c.type,
            content: c.type === 'formula'
              ? { type: 'formula', content: { expression: c.expression!, format: 'currency', decimals: 2 } }
              : { type: 'metric', content: { key: c.id, format: 'currency', decimals: 2 } },
            style: {},
            colspan: 1,
            rowspan: 1,
            isVisible: true,
          };
          return cell;
        }),
        height: 20,
        isVisible: true,
        pageBreakBefore: false,
      }];
      return {
        rows,
        columns: [],
        columnWidths: {},
        defaultRowHeight: 20,
        frozenColumns: 0,
        frozenRows: 0,
        filters: [],
      };
    }

    it('detectCircularReferences detects A1→B1→A1 cycle', () => {
      const layout = makeLayout([
        { id: 'A1', type: 'formula', expression: 'B1' },
        { id: 'B1', type: 'formula', expression: 'A1' },
      ]);
      const result = detectCircularReferences(layout);

      const circular = result.filter(d => d.hasCircularRef);
      expect(circular.length).toBeGreaterThan(0);
    });

    it('detectCircularReferences returns no circular refs for acyclic layout', () => {
      const layout = makeLayout([
        { id: 'A1', type: 'metric' },
        { id: 'B1', type: 'formula', expression: 'A1' },
        { id: 'C1', type: 'formula', expression: 'A1+B1' },
      ]);
      const result = detectCircularReferences(layout);

      const circular = result.filter(d => d.hasCircularRef);
      expect(circular.length).toBe(0);
    });

    it('detectCircularReferences detects self-reference', () => {
      const layout = makeLayout([
        { id: 'A1', type: 'formula', expression: 'A1' },
      ]);
      const result = detectCircularReferences(layout);

      const circular = result.filter(d => d.hasCircularRef);
      expect(circular.length).toBeGreaterThan(0);
    });
  });

  describe('8. Determinism', () => {

    it('evaluateFormula produces identical results for identical inputs', () => {
      const r1 = evaluateFormula('A1+B2*C3', { A1: 10, B2: 2, C3: 3 });
      const r2 = evaluateFormula('A1+B2*C3', { A1: 10, B2: 2, C3: 3 });
      expect(r1).toBe(r2);
    });

    it('parseFormulaReferences produces identical results for identical inputs', () => {
      const r1 = parseFormulaReferences('A1+B2+A1');
      const r2 = parseFormulaReferences('A1+B2+A1');
      expect(r1).toEqual(r2);
    });
  });
});
