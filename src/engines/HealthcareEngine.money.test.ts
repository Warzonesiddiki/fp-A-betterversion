/**
 * GAP-1 (F-0006) known-answer tests for HealthcareEngine's money migration.
 *
 * Patient-revenue figures (gross charges, contractuals, net revenue, cash
 * collected, bad debt, payor mix) drive the HealthcareDashboard and
 * PatientRevenue pages. Each case is a FIXED input -> EXACT expected decimal
 * asserted with `toBe` (Object.is); the pre-migration float literal is
 * recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { HealthcareEngine } from './HealthcareEngine';
import type { GLEntry } from '@/types';

function entry(accountCode: string, amount: number, id: string): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit: amount,
    credit: 0,
    netChange: amount,
    date: '2026-01-15',
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId: 'entity-1',
    currency: 'USD',
  };
}

describe('HealthcareEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('calculatePatientRevenue', () => {
    it('sums gross charges exactly (float gave 0.30000000000000004)', () => {
      const result = HealthcareEngine.calculatePatientRevenue([
        entry('4001', 0.1, 'g1'),
        entry('4002', 0.2, 'g2'),
      ]);
      expect(result.grossCharges).toBe(0.3);
    });

    it('computes net revenue exactly (float gave 0.19999999999999998)', () => {
      const result = HealthcareEngine.calculatePatientRevenue([
        entry('4001', 0.1, 'g1'),
        entry('4002', 0.2, 'g2'),
        entry('4101', -0.1, 'c1'),
      ]);
      // gross 0.3 - contractual 0.1
      expect(result.netRevenue).toBe(0.2);
    });

    it('sums bad debt exactly (float gave 0.6000000000000001)', () => {
      const result = HealthcareEngine.calculatePatientRevenue([
        entry('4201', 0.1, 'b1'),
        entry('4202', 0.2, 'b2'),
        entry('4203', 0.3, 'b3'),
      ]);
      expect(result.badDebt).toBe(0.6);
    });

    it('computes collection rate on exact decimals (float gave 33.333333333333336)', () => {
      const result = HealthcareEngine.calculatePatientRevenue([
        entry('4001', 3, 'g1'),
        entry('1101', 1, 'c1'),
      ]);
      expect(result.collectionRate).toBe(33.3333333333);
    });

    it('returns exact days in A/R (float gave 15.000000000000002)', () => {
      const result = HealthcareEngine.calculatePatientRevenue([
        entry('4001', 900000, 'g1'),
        entry('4101', -100000, 'c1'), // net = 800000
        entry('1201', 400000, 'ar1'), // A/R = 400000
      ]);
      // (400000 / (800000 / 30)) = 15 days exactly in decimal
      expect(result.daysInAR).toBe(15);
    });

    it('returns zero collection rate when net revenue is zero', () => {
      const result = HealthcareEngine.calculatePatientRevenue([
        entry('4001', 0, 'g1'),
        entry('1101', 100, 'c1'),
      ]);
      expect(result.collectionRate).toBe(0);
    });

    it('returns zero days in A/R when net revenue is zero', () => {
      const result = HealthcareEngine.calculatePatientRevenue([entry('1201', 400000, 'ar1')]);
      expect(result.daysInAR).toBe(0);
    });

    it('handles empty entries without NaN or drift', () => {
      const result = HealthcareEngine.calculatePatientRevenue([]);
      expect(result.grossCharges).toBe(0);
      expect(result.contractuals).toBe(0);
      expect(result.netRevenue).toBe(0);
      expect(result.cashCollected).toBe(0);
      expect(result.badDebt).toBe(0);
      expect(result.collectionRate).toBe(0);
      expect(result.daysInAR).toBe(0);
    });
  });

  describe('getPayerMix', () => {
    it('sums payor revenue exactly (float gave 0.30000000000000004)', () => {
      const result = HealthcareEngine.getPayerMix([
        entry('4001', 0.1, 'm1'),
        entry('4001', 0.2, 'm2'),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]!.value).toBe(0.3);
    });

    it('keeps exact sums per payor across mixed codes', () => {
      const result = HealthcareEngine.getPayerMix([
        entry('4001', 1000.1, 'm1'),
        entry('4002', 2000.2, 'c1'),
      ]);
      expect(result).toHaveLength(2);
      expect(result.find((p) => p.name === 'Medicare')?.value).toBe(1000.1);
      expect(result.find((p) => p.name === 'Commercial')?.value).toBe(2000.2);
    });

    it('filters zero-value payors', () => {
      const result = HealthcareEngine.getPayerMix([entry('4001', 0, 'm1')]);
      expect(result).toHaveLength(0);
    });
  });
});
