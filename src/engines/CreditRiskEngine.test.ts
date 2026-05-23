import { describe, it, expect } from 'vitest';
import { CreditRiskEngine } from './CreditRiskEngine';

describe('CreditRiskEngine', () => {
  describe('expectedLoss', () => {
    it('should calculate expected loss', () => {
      expect(CreditRiskEngine.expectedLoss(0.05, 0.4, 100000)).toBeCloseTo(2000, 0);
    });

    it('should return 0 for zero PD', () => {
      expect(CreditRiskEngine.expectedLoss(0, 0.4, 100000)).toBe(0);
    });

    it('should return 0 for zero LGD', () => {
      expect(CreditRiskEngine.expectedLoss(0.05, 0, 100000)).toBe(0);
    });

    it('should return 0 for zero EAD', () => {
      expect(CreditRiskEngine.expectedLoss(0.05, 0.4, 0)).toBe(0);
    });
  });

  describe('lossGivenDefault', () => {
    it('should calculate LGD from collateral', () => {
      expect(CreditRiskEngine.lossGivenDefault(60000, 100000)).toBeCloseTo(0.4, 4);
    });

    it('should return 0 when collateral covers exposure', () => {
      expect(CreditRiskEngine.lossGivenDefault(120000, 100000)).toBe(0);
    });

    it('should return 1 for zero collateral', () => {
      expect(CreditRiskEngine.lossGivenDefault(0, 100000)).toBe(1);
    });

    it('should return 0 for zero exposure', () => {
      expect(CreditRiskEngine.lossGivenDefault(50000, 0)).toBe(0);
    });
  });

  describe('exposureAtDefault', () => {
    it('should calculate EAD', () => {
      expect(CreditRiskEngine.exposureAtDefault(100000, 60000, 0.5)).toBe(80000);
    });

    it('should use drawn amount when fully drawn', () => {
      expect(CreditRiskEngine.exposureAtDefault(100000, 100000, 0.5)).toBe(100000);
    });

    it('should handle zero CCF', () => {
      expect(CreditRiskEngine.exposureAtDefault(100000, 60000, 0)).toBe(60000);
    });
  });
});
