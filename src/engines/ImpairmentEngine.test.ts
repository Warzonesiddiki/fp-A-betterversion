/**
 * Tests for ImpairmentEngine
 * Covers: testImpairment, testBatchImpairment, calculateRecoverableAmount
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ImpairmentEngine } from './ImpairmentEngine';

describe('ImpairmentEngine', () => {
  beforeEach(() => {
    ImpairmentEngine.reset();
  });

  describe('testImpairment', () => {
    it('should detect impairment when carrying exceeds recoverable', () => {
      const result = ImpairmentEngine.testImpairment({
        id: 'ASSET-001',
        name: 'Machine A',
        carryingAmount: 500000,
        recoverableAmount: 400000,
        usefulLife: 10,
        accumulatedDepreciation: 100000,
      });
      expect(result.isImpaired).toBe(true);
      expect(result.impairmentLoss).toBe(100000);
    });

    it('should not detect impairment when carrying below recoverable', () => {
      const result = ImpairmentEngine.testImpairment({
        id: 'ASSET-002',
        name: 'Machine B',
        carryingAmount: 300000,
        recoverableAmount: 350000,
        usefulLife: 10,
        accumulatedDepreciation: 50000,
      });
      expect(result.isImpaired).toBe(false);
      expect(result.impairmentLoss).toBe(0);
    });

    it('should not detect impairment when equal', () => {
      const result = ImpairmentEngine.testImpairment({
        id: 'ASSET-003',
        name: 'Machine C',
        carryingAmount: 200000,
        recoverableAmount: 200000,
        usefulLife: 10,
        accumulatedDepreciation: 40000,
      });
      expect(result.isImpaired).toBe(false);
    });

    it('should record impairment in history', () => {
      ImpairmentEngine.testImpairment({
        id: 'ASSET-001',
        name: 'Machine A',
        carryingAmount: 500000,
        recoverableAmount: 400000,
        usefulLife: 10,
        accumulatedDepreciation: 100000,
      });
      const history = ImpairmentEngine.getImpairmentHistory('ASSET-001');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('testBatchImpairment', () => {
    it('should test multiple assets', () => {
      const assets = [
        {
          id: 'A1',
          name: 'Asset 1',
          carryingAmount: 500000,
          recoverableAmount: 400000,
          usefulLife: 10,
          accumulatedDepreciation: 100000,
        },
        {
          id: 'A2',
          name: 'Asset 2',
          carryingAmount: 300000,
          recoverableAmount: 350000,
          usefulLife: 10,
          accumulatedDepreciation: 50000,
        },
      ];
      const results = ImpairmentEngine.testBatchImpairment(assets);
      expect(results).toHaveLength(2);
      expect(results![0]!.isImpaired).toBe(true);
      expect(results![1]!.isImpaired).toBe(false);
    });

    it('should handle empty array', () => {
      const results = ImpairmentEngine.testBatchImpairment([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('calculateRecoverableAmount', () => {
    it('should use higher of fair value less costs and value in use', () => {
      const result = ImpairmentEngine.calculateRecoverableAmount(350000, 380000);
      expect(result).toBe(380000);
    });

    it('should use value in use when higher', () => {
      const result = ImpairmentEngine.calculateRecoverableAmount(300000, 250000);
      expect(result).toBe(300000);
    });
  });

  describe('reset', () => {
    it('should clear all history', () => {
      ImpairmentEngine.testImpairment({
        id: 'A1',
        name: 'Test',
        carryingAmount: 500000,
        recoverableAmount: 400000,
        usefulLife: 10,
        accumulatedDepreciation: 100000,
      });
      ImpairmentEngine.reset();
      expect(ImpairmentEngine.getImpairmentHistory('A1')).toHaveLength(0);
    });
  });
});
