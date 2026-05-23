import { describe, it, expect } from 'vitest';
import { InventoryEngine } from './InventoryEngine';

describe('InventoryEngine', () => {
  describe('calculateTurnover', () => {
    it('should calculate inventory turnover', () => {
      expect(InventoryEngine.calculateTurnover(500000, 100000)).toBe(5);
    });

    it('should return 0 for zero average inventory', () => {
      expect(InventoryEngine.calculateTurnover(500000, 0)).toBe(0);
    });
  });

  describe('calculateDSI', () => {
    it('should calculate days sales in inventory', () => {
      expect(InventoryEngine.calculateDSI(100000, 500000, 365)).toBeCloseTo(73, 0);
    });

    it('should return 0 for zero COGS', () => {
      expect(InventoryEngine.calculateDSI(100000, 0, 365)).toBe(0);
    });
  });

  describe('calculateGMROI', () => {
    it('should calculate gross margin return on investment', () => {
      expect(InventoryEngine.calculateGMROI(200000, 100000)).toBe(2);
    });

    it('should return 0 for zero average inventory cost', () => {
      expect(InventoryEngine.calculateGMROI(200000, 0)).toBe(0);
    });
  });

  describe('calculateEOQ', () => {
    it('should calculate economic order quantity', () => {
      const eoq = InventoryEngine.calculateEOQ(10000, 100, 5, 0);
      expect(eoq).toBeCloseTo(632.46, 0);
    });

    it('should return 0 for zero holding cost', () => {
      expect(InventoryEngine.calculateEOQ(10000, 100, 0, 0)).toBe(0);
    });
  });

  describe('calculateSafetyStock', () => {
    it('should calculate safety stock for 95% service level', () => {
      const stock = InventoryEngine.calculateSafetyStock(4, 50, 1.65);
      expect(stock).toBe(165);
    });

    it('should handle zero lead time', () => {
      expect(InventoryEngine.calculateSafetyStock(0, 50, 1.65)).toBe(0);
    });
  });
});
