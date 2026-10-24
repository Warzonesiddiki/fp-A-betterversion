import { describe, it, expect } from 'vitest';
import { LeaseEngine } from './LeaseEngine';
import type { LeaseContract } from './LeaseEngine';

/**
 * GOVERNANCE EVIDENCE for cap:treasury.lease-engine
 *
 * The LeaseEngine computes ASC 842 / IFRS 16 lease accounting including
 * ROU asset amortization, lease liability schedules, lease classification,
 * and lease modifications. The governance dimension here is ACCOUNTING
 * ACCURACY — lease figures flow to the balance sheet (ROU asset, lease
 * liability) and income statement (interest expense, amortization). All
 * amounts use the decimal.js money primitive.
 *
 * Tested dimensions:
 * 1. ROU asset calculation
 * 2. Lease liability calculation
 * 3. Lease classification
 * 4. Short-term and low-value lease checks
 * 5. Lease modification (extend/terminate)
 * 6. Disclosure generation
 * 7. Determinism
 */

function makeLease(overrides: Partial<LeaseContract> = {}): LeaseContract {
  return {
    id: 'lease-1',
    assetDescription: 'Office space',
    commencementDate: '2026-01-01',
    leaseTerm: 12,
    leasePayments: [
      10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    ],
    discountRate: 0.05,
    ...overrides,
  };
}

describe('LeaseEngine — GOVERNANCE (treasury.lease-engine)', () => {
  describe('1. ROU asset calculation', () => {
    it('calculateROUAsset produces schedule with correct number of periods', () => {
      const lease = makeLease({ leaseTerm: 12 });
      const schedule = LeaseEngine.calculateROUAsset(lease);
      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBe(12);
    });

    it('ROU asset schedule has correct structure', () => {
      const lease = makeLease({ leaseTerm: 3 });
      const schedule = LeaseEngine.calculateROUAsset(lease);
      const entry = schedule[0]!;
      expect(entry.period).toBeDefined();
      expect(entry.openingBalance).toBeGreaterThanOrEqual(0);
      expect(entry.depreciation).toBeDefined();
      expect(entry.closingBalance).toBeDefined();
    });

    it('ROU asset closing balance does not go negative', () => {
      const lease = makeLease({ leaseTerm: 12 });
      const schedule = LeaseEngine.calculateROUAsset(lease);
      for (const entry of schedule) {
        expect(entry.closingBalance).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('2. Lease liability calculation', () => {
    it('calculateLeaseLiability produces schedule with correct number of periods', () => {
      const lease = makeLease({ leaseTerm: 12 });
      const schedule = LeaseEngine.calculateLeaseLiability(lease);
      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBe(12);
    });

    it('Lease liability schedule has correct structure', () => {
      const lease = makeLease({ leaseTerm: 3 });
      const schedule = LeaseEngine.calculateLeaseLiability(lease);
      const entry = schedule[0]!;
      expect(entry.period).toBeDefined();
      expect(entry.openingBalance).toBeDefined();
      expect(entry.payment).toBeDefined();
      expect(entry.interest).toBeDefined();
      expect(entry.reduction).toBeDefined();
      expect(entry.closingBalance).toBeDefined();
    });

    it('Lease liability closing balance decreases over time', () => {
      const lease = makeLease({ leaseTerm: 12 });
      const schedule = LeaseEngine.calculateLeaseLiability(lease);
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i]!.closingBalance).toBeLessThanOrEqual(schedule[i - 1]!.closingBalance);
      }
    });
  });

  describe('3. Lease classification', () => {
    it('classifyLease returns finance or operating', () => {
      const lease = makeLease();
      const classification = LeaseEngine.classifyLease(lease);
      expect(['finance', 'operating']).toContain(classification);
    });

    it('classifyLease returns finance for transfer of ownership', () => {
      const lease = makeLease({ transferOfOwnership: true });
      const classification = LeaseEngine.classifyLease(lease);
      expect(classification).toBe('finance');
    });
  });

  describe('4. Short-term and low-value lease checks', () => {
    it('isShortTermLease returns true for short-term leases', () => {
      const lease = makeLease({ isShortTerm: true, leaseTerm: 1 });
      expect(LeaseEngine.isShortTermLease(lease)).toBe(true);
    });

    it('isShortTermLease returns false for leases over 12 months', () => {
      const lease = makeLease({ leaseTerm: 24 });
      expect(LeaseEngine.isShortTermLease(lease)).toBe(false);
    });

    it('isLowValueAsset returns true for low-value assets', () => {
      const lease = makeLease();
      expect(LeaseEngine.isLowValueAsset(lease, 5000)).toBe(true);
    });

    it('isLowValueAsset returns false for high-value assets', () => {
      const lease = makeLease();
      expect(LeaseEngine.isLowValueAsset(lease, 1000000)).toBe(false);
    });
  });

  describe('5. Lease modification', () => {
    it('extendLease adds months to lease term', () => {
      const lease = makeLease({ leaseTerm: 12 });
      const extended = LeaseEngine.extendLease(lease, 6);
      expect(extended.leaseTerm).toBe(18);
    });

    it('terminateLease returns remaining liability and gain/loss', () => {
      const lease = makeLease({ leaseTerm: 12 });
      const result = LeaseEngine.terminateLease(lease, 6, 1000);
      expect(result).toBeDefined();
      expect(result.remainingLiability).toBeDefined();
      expect(result.rouAssetRemoval).toBeDefined();
      expect(result.gainOrLoss).toBeDefined();
    });
  });

  describe('6. Disclosure generation', () => {
    it('generateDisclosure produces disclosure object', () => {
      const lease = makeLease();
      const disclosure = LeaseEngine.generateDisclosure(lease);
      expect(disclosure).toBeDefined();
    });
  });

  describe('7. Determinism', () => {
    it('calculateROUAsset is deterministic', () => {
      const lease = makeLease();
      const r1 = LeaseEngine.calculateROUAsset(lease);
      const r2 = LeaseEngine.calculateROUAsset(lease);
      expect(r1).toEqual(r2);
    });

    it('calculateLeaseLiability is deterministic', () => {
      const lease = makeLease();
      const r1 = LeaseEngine.calculateLeaseLiability(lease);
      const r2 = LeaseEngine.calculateLeaseLiability(lease);
      expect(r1).toEqual(r2);
    });

    it('classifyLease is deterministic', () => {
      const lease = makeLease();
      expect(LeaseEngine.classifyLease(lease)).toBe(LeaseEngine.classifyLease(lease));
    });
  });
});
