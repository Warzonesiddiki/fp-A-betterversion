import { describe, it, expect } from 'vitest';
import { CapExEngine } from './CapExEngine';
import type { AssetInput } from '@/types/sector-types';

describe('CapExEngine', () => {
  describe('calculateDepreciation', () => {
    const baseAsset: AssetInput = {
      id: 'asset-1',
      name: 'Machine',
      cost: 10000,
      salvageValue: 1000,
      usefulLife: 5,
      startDate: '2024-01-01',
      depreciationMethod: 'straight_line',
    };

    it('should calculate straight-line depreciation', () => {
      const result = CapExEngine.calculateDepreciation(baseAsset);
      expect(result).toHaveLength(5);
      expect(result![0]!.depreciationExpense).toBe(1800);
      expect(result![4]!.bookValue).toBe(1000);
    });

    it('should calculate double-declining depreciation', () => {
      const asset = { ...baseAsset, depreciationMethod: 'double_declining' as const };
      const result = CapExEngine.calculateDepreciation(asset);
      expect(result).toHaveLength(5);
      expect(result![0]!.depreciationExpense).toBe(4000);
      expect(result![4]!.bookValue).toBe(1000);
    });

    it('should calculate sum-of-years depreciation', () => {
      const asset = { ...baseAsset, depreciationMethod: 'sum_of_years' as const };
      const result = CapExEngine.calculateDepreciation(asset);
      expect(result).toHaveLength(5);
      expect(result![0]!.depreciationExpense).toBe(3000);
      expect(result![4]!.bookValue).toBe(1000);
    });

    it('should clamp book value to salvage value', () => {
      const asset: AssetInput = { ...baseAsset, cost: 2000, salvageValue: 500, usefulLife: 3 };
      const result = CapExEngine.calculateDepreciation(asset);
      result.forEach((s) => expect(s.bookValue).toBeGreaterThanOrEqual(500));
    });
  });

  describe('calculateNPV', () => {
    it('should calculate NPV correctly', () => {
      const result = CapExEngine.calculateNPV([-1000, 500, 400, 300], 0.1);
      expect(result).toBeCloseTo(9.56, 1);
    });

    it('should return zero for empty cash flows', () => {
      expect(CapExEngine.calculateNPV([], 0.1)).toBe(0);
    });

    it('should handle zero discount rate', () => {
      expect(CapExEngine.calculateNPV([-100, 50, 60], 0)).toBe(10);
    });
  });

  describe('calculateIRR', () => {
    it('should calculate IRR for standard cash flows', () => {
      const irr = CapExEngine.calculateIRR([-1000, 300, 400, 500, 200]);
      expect(irr).toBeGreaterThan(0.1);
      expect(irr).toBeLessThan(0.3);
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('should calculate exact payback period with fractional year', () => {
      const result = CapExEngine.calculatePaybackPeriod([-1000, 400, 400, 400]);
      expect(result).toBeGreaterThan(3);
      expect(result).toBeLessThan(4);
    });

    it('should return 0 if never pays back', () => {
      expect(CapExEngine.calculatePaybackPeriod([-1000, 100, 100])).toBe(0);
    });
  });

  describe('calculateROI', () => {
    it('should calculate positive ROI', () => {
      expect(CapExEngine.calculateROI(1500, 1000)).toBe(0.5);
    });

    it('should return 0 for zero or negative cost', () => {
      expect(CapExEngine.calculateROI(100, 0)).toBe(0);
      expect(CapExEngine.calculateROI(100, -10)).toBe(0);
    });

    it('should handle negative ROI', () => {
      expect(CapExEngine.calculateROI(500, 1000)).toBe(-0.5);
    });
  });
});
