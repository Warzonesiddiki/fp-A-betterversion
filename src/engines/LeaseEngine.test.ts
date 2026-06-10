import { describe, it, expect } from 'vitest';
import { LeaseEngine, type LeaseContract } from './LeaseEngine';

describe('LeaseEngine', () => {
  const baseLease: LeaseContract = {
    id: 'lease-1',
    assetDescription: 'Office Space',
    commencementDate: '2024-01-01',
    leaseTerm: 12,
    leasePayments: Array(12).fill(5000),
    discountRate: 0.05,
  };

  describe('calculateROUAsset', () => {
    it('should produce correct number of periods', () => {
      const result = LeaseEngine.calculateROUAsset(baseLease);
      expect(result).toHaveLength(12);
    });

    it('should start with correct opening balance', () => {
      const result = LeaseEngine.calculateROUAsset(baseLease);
      expect(result![0]!.openingBalance).toBeGreaterThan(0);
      expect(result![0]!.openingBalance).toBeLessThan(60000);
    });

    it('should end with zero closing balance', () => {
      const result = LeaseEngine.calculateROUAsset(baseLease);
      expect(result![11]!.closingBalance).toBeCloseTo(0, 10);
    });

    it('should have consistent depreciation across periods', () => {
      const result = LeaseEngine.calculateROUAsset(baseLease);
      const depExpenses = result.map((r) => r.depreciation);
      depExpenses.forEach((d) => expect(d).toBeCloseTo(depExpenses[0]!, 8));
    });
  });

  describe('calculateLeaseLiability', () => {
    it('should produce correct number of periods', () => {
      const result = LeaseEngine.calculateLeaseLiability(baseLease);
      expect(result).toHaveLength(12);
    });

    it('should decrease liability over time', () => {
      const result = LeaseEngine.calculateLeaseLiability(baseLease);
      expect(result![0]!.closingBalance).toBeGreaterThan(result![11]!.closingBalance);
    });

    it('should end near zero', () => {
      const result = LeaseEngine.calculateLeaseLiability(baseLease);
      expect(result![11]!.closingBalance).toBeCloseTo(0, 10);
    });

    it('should handle varying payments', () => {
      const lease = { ...baseLease, leasePayments: [6000, 5000, 4000, ...Array(9).fill(5000)] };
      const result = LeaseEngine.calculateLeaseLiability(lease);
      expect(result).toHaveLength(12);
      expect(result![0]!.payment).toBe(6000);
    });

    it('should calculate interest correctly', () => {
      const result = LeaseEngine.calculateLeaseLiability(baseLease);
      const monthlyRate = Math.pow(1 + 0.05, 1 / 12) - 1;
      const expectedInterest = result![0]!.openingBalance * monthlyRate;
      expect(result![0]!.interest).toBeCloseTo(expectedInterest, 6);
    });

    it('should have payment = interest + reduction', () => {
      const result = LeaseEngine.calculateLeaseLiability(baseLease);
      for (const period of result) {
        expect(period.payment).toBeCloseTo(period.interest + period.reduction, 6);
      }
    });
  });

  describe('testImpairment', () => {
    it('should detect no impairment when undiscounted CF covers balance', () => {
      const asset = {
        period: 'Month 1',
        openingBalance: 50000,
        depreciation: 1000,
        closingBalance: 49000,
      };
      const result = LeaseEngine.testImpairment(asset, 45000, 50000);
      expect(result.impaired).toBe(false);
      expect(result.impairmentLoss).toBe(0);
    });

    it('should detect impairment when fair value is lower', () => {
      const asset = {
        period: 'Month 1',
        openingBalance: 50000,
        depreciation: 1000,
        closingBalance: 49000,
      };
      const result = LeaseEngine.testImpairment(asset, 30000, 40000);
      expect(result.impaired).toBe(true);
      expect(result.impairmentLoss).toBe(19000);
    });

    it('should return no impairment when fair value exceeds balance', () => {
      const asset = {
        period: 'Month 1',
        openingBalance: 50000,
        depreciation: 1000,
        closingBalance: 49000,
      };
      const result = LeaseEngine.testImpairment(asset, 55000, 40000);
      expect(result.impaired).toBe(false);
      expect(result.impairmentLoss).toBe(0);
    });
  });

  describe('classifyLease', () => {
    it('should classify as finance when transfer of ownership', () => {
      const lease = { ...baseLease, transferOfOwnership: true };
      expect(LeaseEngine.classifyLease(lease)).toBe('finance');
    });

    it('should classify as finance when purchase option is reasonably certain', () => {
      const lease = {
        ...baseLease,
        purchaseOption: { exercisePrice: 10000, reasonablyCertain: true },
      };
      expect(LeaseEngine.classifyLease(lease)).toBe('finance');
    });

    it('should classify as finance when lease term >= 75% of economic life', () => {
      expect(LeaseEngine.classifyLease(baseLease, undefined, 15)).toBe('finance');
    });

    it('should classify as finance when PV >= 90% of fair value', () => {
      expect(LeaseEngine.classifyLease(baseLease, 50000)).toBe('finance');
    });

    it('should classify as operating when no finance criteria met', () => {
      expect(LeaseEngine.classifyLease(baseLease, 100000, 120)).toBe('operating');
    });
  });

  describe('isShortTermLease', () => {
    it('should identify short-term lease (<=12 months, no purchase option)', () => {
      expect(LeaseEngine.isShortTermLease(baseLease)).toBe(true);
    });

    it('should not identify as short-term when term > 12 months', () => {
      const lease = { ...baseLease, leaseTerm: 24 };
      expect(LeaseEngine.isShortTermLease(lease)).toBe(false);
    });

    it('should not identify as short-term when purchase option exists', () => {
      const lease = {
        ...baseLease,
        purchaseOption: { exercisePrice: 5000, reasonablyCertain: false },
      };
      expect(LeaseEngine.isShortTermLease(lease)).toBe(false);
    });
  });

  describe('isLowValueAsset', () => {
    it('should identify low-value asset (<=5000)', () => {
      expect(LeaseEngine.isLowValueAsset(baseLease, 4000)).toBe(true);
    });

    it('should not identify as low-value when > 5000', () => {
      expect(LeaseEngine.isLowValueAsset(baseLease, 10000)).toBe(false);
    });
  });

  describe('modifyLease', () => {
    it('should modify payments', () => {
      const modified = LeaseEngine.modifyLease(baseLease, { newPayments: Array(12).fill(6000) });
      expect(modified.leasePayments[0]!).toBe(6000);
      expect(modified.leaseTerm).toBe(12);
    });

    it('should modify discount rate', () => {
      const modified = LeaseEngine.modifyLease(baseLease, { newDiscountRate: 0.06 });
      expect(modified.discountRate).toBe(0.06);
    });

    it('should extend term and add payments', () => {
      const modified = LeaseEngine.modifyLease(baseLease, { additionalTerm: 6 });
      expect(modified.leaseTerm).toBe(18);
      expect(modified.leasePayments).toHaveLength(18);
    });

    it('should preserve original lease when no modifications', () => {
      const modified = LeaseEngine.modifyLease(baseLease, {});
      expect(modified.leaseTerm).toBe(baseLease.leaseTerm);
      expect(modified.leasePayments).toEqual(baseLease.leasePayments);
      expect(modified.discountRate).toBe(baseLease.discountRate);
    });
  });

  describe('extendLease', () => {
    it('should extend lease by additional months', () => {
      const extended = LeaseEngine.extendLease(baseLease, 6);
      expect(extended.leaseTerm).toBe(18);
      expect(extended.leasePayments).toHaveLength(18);
    });

    it('should use last payment amount for new months', () => {
      const extended = LeaseEngine.extendLease(baseLease, 3);
      expect(extended.leasePayments[12]!).toBe(5000);
      expect(extended.leasePayments[13]!).toBe(5000);
      expect(extended.leasePayments[14]!).toBe(5000);
    });
  });

  describe('terminateLease', () => {
    it('should calculate remaining liability at termination', () => {
      const result = LeaseEngine.terminateLease(baseLease, 6);
      expect(result.remainingLiability).toBeGreaterThan(0);
    });

    it('should calculate ROU asset removal at termination', () => {
      const result = LeaseEngine.terminateLease(baseLease, 6);
      expect(result.rouAssetRemoval).toBeGreaterThan(0);
    });

    it('should include termination fee in gain/loss calculation', () => {
      const withFee = LeaseEngine.terminateLease(baseLease, 6, 1000);
      const withoutFee = LeaseEngine.terminateLease(baseLease, 6, 0);
      expect(withFee.gainOrLoss).toBe(withoutFee.gainOrLoss + 1000);
    });

    it('should return zero for period beyond lease term', () => {
      const result = LeaseEngine.terminateLease(baseLease, 100);
      expect(result.remainingLiability).toBeCloseTo(0, 6);
      expect(result.rouAssetRemoval).toBeCloseTo(0, 6);
    });
  });

  describe('generateDisclosure', () => {
    it('should generate disclosure with all required fields', () => {
      const disclosure = LeaseEngine.generateDisclosure(baseLease);
      expect(disclosure).toHaveProperty('leaseType');
      expect(disclosure).toHaveProperty('rightOfUseAsset');
      expect(disclosure).toHaveProperty('leaseLiability');
      expect(disclosure).toHaveProperty('totalLeasePayments');
      expect(disclosure).toHaveProperty('weightedAverageDiscountRate');
      expect(disclosure).toHaveProperty('remainingTerm');
      expect(disclosure).toHaveProperty('isShortTerm');
      expect(disclosure).toHaveProperty('isLowValue');
    });

    it('should calculate total lease payments correctly', () => {
      const disclosure = LeaseEngine.generateDisclosure(baseLease);
      expect(disclosure.totalLeasePayments).toBe(60000);
    });

    it('should report correct remaining term', () => {
      const disclosure = LeaseEngine.generateDisclosure(baseLease);
      expect(disclosure.remainingTerm).toBe(12);
    });

    it('should report correct discount rate', () => {
      const disclosure = LeaseEngine.generateDisclosure(baseLease);
      expect(disclosure.weightedAverageDiscountRate).toBe(0.05);
    });

    it('should identify short-term leases', () => {
      const disclosure = LeaseEngine.generateDisclosure(baseLease);
      expect(disclosure.isShortTerm).toBe(true);
    });

    it('should use explicit classification when set', () => {
      const lease = { ...baseLease, classification: 'finance' as const };
      const disclosure = LeaseEngine.generateDisclosure(lease);
      expect(disclosure.leaseType).toBe('finance');
    });
  });
});
