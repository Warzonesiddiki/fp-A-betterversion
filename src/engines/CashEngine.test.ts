import { describe, it, expect } from 'vitest';
import { CashEngine } from './CashEngine';

describe('CashEngine', () => {
  describe('forecast13Week', () => {
    it('should forecast cash with inflows and outflows', () => {
      const result = CashEngine.forecast13Week(
        10000,
        [{ week: 'W1', amount: 5000 }],
        [{ week: 'W1', amount: 3000 }]
      );
      expect(result).toHaveLength(1);
      expect(result[0].openingBalance).toBe(10000);
      expect(result[0].netCashFlow).toBe(2000);
      expect(result[0].closingBalance).toBe(12000);
    });

    it('should handle multiple weeks', () => {
      const result = CashEngine.forecast13Week(
        5000,
        [
          { week: 'W1', amount: 2000 },
          { week: 'W2', amount: 3000 },
        ],
        [{ week: 'W1', amount: 1000 }]
      );
      expect(result).toHaveLength(2);
      expect(result[1].openingBalance).toBe(6000);
    });

    it('should flag balance below minimum target', () => {
      const result = CashEngine.forecast13Week(100, [], [{ week: 'W1', amount: 200 }], 50);
      expect(result[0].isBelowTarget).toBe(true);
    });

    it('should handle empty inflows and outflows', () => {
      const result = CashEngine.forecast13Week(5000, [], []);
      expect(result).toEqual([]);
    });
  });

  describe('calculateDSO', () => {
    it('should calculate days sales outstanding', () => {
      expect(CashEngine.calculateDSO(50000, 200000, 365)).toBeCloseTo(91.25, 1);
    });

    it('should return 0 for zero revenue', () => {
      expect(CashEngine.calculateDSO(50000, 0, 365)).toBe(0);
    });
  });

  describe('calculateDPO', () => {
    it('should calculate days payable outstanding', () => {
      expect(CashEngine.calculateDPO(30000, 150000, 365)).toBeCloseTo(73, 0);
    });

    it('should return 0 for zero COGS', () => {
      expect(CashEngine.calculateDPO(30000, 0, 365)).toBe(0);
    });
  });

  describe('calculateDIO', () => {
    it('should calculate days inventory outstanding', () => {
      expect(CashEngine.calculateDIO(20000, 100000, 365)).toBeCloseTo(73, 0);
    });

    it('should return 0 for zero COGS', () => {
      expect(CashEngine.calculateDIO(20000, 0, 365)).toBe(0);
    });
  });

  describe('calculateCCC', () => {
    it('should calculate cash conversion cycle', () => {
      expect(CashEngine.calculateCCC(45, 30, 60)).toBe(15);
    });

    it('should handle negative result', () => {
      expect(CashEngine.calculateCCC(30, 20, 60)).toBe(-10);
    });
  });
});
