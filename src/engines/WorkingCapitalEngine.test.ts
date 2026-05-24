/**
 * Tests for WorkingCapitalEngine
 * Covers: calculate, optimize
 */
import { describe, it, expect } from 'vitest';
import { WorkingCapitalEngine } from './WorkingCapitalEngine';

describe('WorkingCapitalEngine', () => {
  const mockInput = {
    revenue: 1200000,
    cogs: 600000,
    accountsReceivable: 200000,
    inventory: 150000,
    accountsPayable: 50000,
    currentAssets: 500000,
    currentLiabilities: 300000,
    cash: 100000,
    periodDays: 365,
  };

  describe('calculate', () => {
    it('should calculate working capital metrics', () => {
      const result = WorkingCapitalEngine.calculate(mockInput);
      expect(result.dso).toBeDefined();
      expect(result.dpo).toBeDefined();
      expect(result.dio).toBeDefined();
      expect(result.cashConversionCycle).toBeDefined();
      expect(result.workingCapital).toBeDefined();
      expect(result.currentRatio).toBeDefined();
      expect(result.quickRatio).toBeDefined();
    });

    it('should calculate DSO correctly', () => {
      const result = WorkingCapitalEngine.calculate(mockInput);
      // DSO = (AR / Revenue) * 365
      expect(result.dso).toBeCloseTo((200000 / 1200000) * 365, 1);
    });

    it('should calculate DPO correctly', () => {
      const result = WorkingCapitalEngine.calculate(mockInput);
      // DPO = (AP / COGS) * 365
      expect(result.dpo).toBeCloseTo((180000 / 600000) * 365, 1);
    });

    it('should calculate DIO correctly', () => {
      const result = WorkingCapitalEngine.calculate(mockInput);
      // DIO = (Inventory / COGS) * 365
      expect(result.dio).toBeCloseTo((150000 / 600000) * 365, 1);
    });

    it('should calculate cash conversion cycle', () => {
      const result = WorkingCapitalEngine.calculate(mockInput);
      // CCC = DSO + DIO - DPO
      expect(result.cashConversionCycle).toBeCloseTo(result.dso + result.dio - result.dpo, 1);
    });

    it('should handle zero revenue', () => {
      const zeroInput = { ...mockInput, revenue: 0 };
      const result = WorkingCapitalEngine.calculate(zeroInput);
      expect(result.dso).toBe(0);
    });

    it('should handle zero cogs', () => {
      const zeroInput = { ...mockInput, cogs: 0 };
      const result = WorkingCapitalEngine.calculate(zeroInput);
      expect(result.dio).toBe(0);
    });
  });

  describe('optimize', () => {
    it('should provide optimization recommendations', () => {
      const result = WorkingCapitalEngine.optimize(mockInput, 30, 45, 60);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.cashFreed).toBeDefined();
    });

    it('should include DSO improvement suggestion', () => {
      const result = WorkingCapitalEngine.optimize(mockInput, 30, 45, 60);
      const dsoRec = result.recommendations.find((r) => r.metric === 'DSO');
      expect(dsoRec).toBeDefined();
      expect(dsoRec?.current).toBeGreaterThan(0);
    });

    it('should include DPO improvement suggestion', () => {
      const result = WorkingCapitalEngine.optimize(mockInput, 30, 45, 60);
      const dpoRec = result.recommendations.find((r) => r.metric === 'DPO');
      expect(dpoRec).toBeDefined();
    });
  });
});
