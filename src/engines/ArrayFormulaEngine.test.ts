import { describe, it, expect } from 'vitest';
import { ArrayFormulaEngine } from './ArrayFormulaEngine';

describe('ArrayFormulaEngine', () => {
  describe('evaluate', () => {
    it('evaluates basic array formula', () => {
      const data = [
        [1, 2],
        [3, 4],
      ];
      const result = ArrayFormulaEngine.evaluate('SUM', data, 2, 2);
      expect(result.values).toBeDefined();
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
    });

    it('handles empty data', () => {
      const result = ArrayFormulaEngine.evaluate('SUM', [], 0, 0);
      expect(result.values).toBeDefined();
    });
  });

  describe('mmult', () => {
    it('multiplies matrices', () => {
      const data = [
        [1, 2],
        [3, 4],
      ];
      const result = ArrayFormulaEngine.evaluate('MMULT', data, 2, 2);
      expect(result.values).toBeDefined();
    });
  });

  describe('transpose', () => {
    it('transposes matrix', () => {
      const data = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const result = ArrayFormulaEngine.evaluate('TRANSPOSE', data, 3, 2);
      expect(result.rows).toBe(3);
      expect(result.cols).toBe(2);
    });
  });
});
