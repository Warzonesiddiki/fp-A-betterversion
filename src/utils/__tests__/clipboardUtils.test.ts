import { describe, it, expect } from 'vitest';
import { ClipboardUtils } from '../clipboardUtils';

describe('ClipboardUtils', () => {
  describe('parseClipboardText', () => {
    it('parses TSV text', () => {
      const result = ClipboardUtils.parseClipboardText('a\tb\tc\nd\te\tf');
      expect(result.rows).toHaveLength(2);
      expect(result.colCount).toBe(3);
      expect(result.rows[0]).toEqual(['a', 'b', 'c']);
    });

    it('handles empty lines', () => {
      const result = ClipboardUtils.parseClipboardText('a\tb\n\nc\td');
      expect(result.rows).toHaveLength(2);
    });

    it('handles varying column counts', () => {
      const result = ClipboardUtils.parseClipboardText('a\tb\nc');
      expect(result.colCount).toBe(2);
    });
  });

  describe('parseCSV', () => {
    it('parses basic CSV', () => {
      const result = ClipboardUtils.parseCSV('a,b,c\nd,e,f');
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['a', 'b', 'c']);
    });

    it('handles quoted values', () => {
      const result = ClipboardUtils.parseCSV('"hello, world",test');
      expect(result.rows[0][0]).toBe('hello, world');
    });

    it('handles empty input', () => {
      const result = ClipboardUtils.parseCSV('');
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('formatForExcel', () => {
    it('formats data as TSV', () => {
      const result = ClipboardUtils.formatForExcel([
        ['a', 'b'],
        ['c', 'd'],
      ]);
      expect(result).toBe('a\tb\nc\td');
    });

    it('escapes tabs and quotes', () => {
      const result = ClipboardUtils.formatForExcel([['a\tb', 'c"d']]);
      expect(result).toContain('"a\tb"');
      expect(result).toContain('"c""d"');
    });

    it('handles null values', () => {
      const result = ClipboardUtils.formatForExcel([[null, undefined]]);
      expect(result).toBe('\t');
    });
  });

  describe('validatePasteDimensions', () => {
    it('returns valid when dimensions fit', () => {
      const result = ClipboardUtils.validatePasteDimensions(2, 3, 5, 5);
      expect(result.valid).toBe(true);
    });

    it('returns warning when source exceeds target', () => {
      const result = ClipboardUtils.validatePasteDimensions(10, 3, 5, 5);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('10 rows');
    });
  });

  describe('fitToGrid', () => {
    it('fits data to target dimensions', () => {
      const result = ClipboardUtils.fitToGrid([['a', 'b']], 3, 4);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(4);
      expect(result[0][0]).toBe('a');
      expect(result[2][0]).toBe('');
    });
  });

  describe('detectFinancialData', () => {
    it('detects financial values', () => {
      const result = ClipboardUtils.detectFinancialData([
        ['$100', '$200', '$300'],
        ['text', 'more'],
      ]);
      expect(result).toBe(true);
    });

    it('returns false for non-financial data', () => {
      const result = ClipboardUtils.detectFinancialData([['hello', 'world']]);
      expect(result).toBe(false);
    });
  });

  describe('parseFinancialValues', () => {
    it('parses financial strings to numbers', () => {
      const result = ClipboardUtils.parseFinancialValues([['$1,000', '($500)']]);
      expect(result[0][0]).toBe(1000);
      expect(result[0][1]).toBe(-500);
    });

    it('handles empty values', () => {
      const result = ClipboardUtils.parseFinancialValues([['abc']]);
      expect(result[0][0]).toBe(0);
    });
  });
});
