import { describe, it, expect } from 'vitest';
import { HealthcareEngine, type GLEntry } from './HealthcareEngine';

// Helper to create GLEntry with sector-types shape
function gl(accountCode: string, amount: number, overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: `gl-${accountCode}-${Math.random().toString(36).slice(2, 6)}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    amount,
    currency: 'USD',
    date: '2026-01-15',
    entityId: 'entity-1',
    ...overrides,
  };
}

describe('HealthcareEngine', () => {
  describe('calculatePatientRevenue', () => {
    it('should calculate gross charges from 40xx accounts', () => {
      const entries = [gl('4001', 500000), gl('4002', 300000), gl('4099', 200000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.grossCharges).toBe(1000000);
    });

    it('should calculate contractual adjustments from 41xx accounts (absolute value)', () => {
      const entries = [gl('4101', -150000), gl('4102', -50000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.contractuals).toBe(200000);
    });

    it('should calculate bad debt from 42xx accounts', () => {
      const entries = [gl('4201', 25000), gl('4202', 15000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.badDebt).toBe(40000);
    });

    it('should calculate net revenue as gross charges minus contractuals', () => {
      const entries = [gl('4001', 1000000), gl('4101', -200000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.netRevenue).toBe(800000);
    });

    it('should calculate cash collected from 11xx accounts', () => {
      const entries = [gl('1101', 600000), gl('1102', 200000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.cashCollected).toBe(800000);
    });

    it('should calculate collection rate as cash collected / net revenue', () => {
      const entries = [
        gl('4001', 1000000),
        gl('4101', -200000), // net = 800000
        gl('1101', 640000), // cash = 640000 → rate = 80%
      ];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.collectionRate).toBe(80);
    });

    it('should return 0 collection rate when net revenue is zero', () => {
      const entries = [gl('4001', 0), gl('1101', 100000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.collectionRate).toBe(0);
    });

    it('should calculate days in A/R from 12xx accounts', () => {
      const entries = [
        gl('4001', 900000), // gross = 900k
        gl('4101', -100000), // net = 800k
        gl('1201', 400000), // A/R = 400k
      ];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      // dailyRevenue = 800000 / 30 ≈ 26666.67
      // daysInAR = 400000 / 26666.67 ≈ 15
      expect(result.daysInAR).toBeCloseTo(15, 0);
    });

    it('should return 0 days in A/R when net revenue is zero', () => {
      const entries = [gl('1201', 400000)];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.daysInAR).toBe(0);
    });

    it('should handle empty entries', () => {
      const result = HealthcareEngine.calculatePatientRevenue([]);
      expect(result.grossCharges).toBe(0);
      expect(result.contractuals).toBe(0);
      expect(result.netRevenue).toBe(0);
      expect(result.cashCollected).toBe(0);
      expect(result.badDebt).toBe(0);
      expect(result.collectionRate).toBe(0);
      expect(result.daysInAR).toBe(0);
    });

    it('should exclude non-matching account codes', () => {
      const entries = [
        gl('4001', 500000), // matches 40xx
        gl('9999', 999999), // does not match
        gl('3001', 100000), // does not match
      ];
      const result = HealthcareEngine.calculatePatientRevenue(entries);
      expect(result.grossCharges).toBe(500000);
    });
  });

  describe('getPayerMix', () => {
    it('should return payer breakdown by account code suffix', () => {
      const entries = [
        gl('4001', 500000), // Medicare (suffix 01)
        gl('4002', 300000), // Commercial (suffix 02)
        gl('4003', 150000), // Medicaid (suffix 03)
        gl('4004', 50000), // Self-Pay (suffix 04)
      ];
      const result = HealthcareEngine.getPayerMix(entries);
      expect(result).toHaveLength(4);
      expect(result.find((p) => p.name === 'Medicare')?.value).toBe(500000);
      expect(result.find((p) => p.name === 'Commercial')?.value).toBe(300000);
      expect(result.find((p) => p.name === 'Medicaid')?.value).toBe(150000);
      expect(result.find((p) => p.name === 'Self-Pay')?.value).toBe(50000);
    });

    it('should filter out payers with zero value', () => {
      const entries = [
        gl('4001', 500000), // Medicare only
      ];
      const result = HealthcareEngine.getPayerMix(entries);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Medicare');
    });

    it('should include color property for each payer', () => {
      const entries = [gl('4001', 100000)];
      const result = HealthcareEngine.getPayerMix(entries);
      expect(result[0].color).toBeDefined();
      expect(typeof result[0].color).toBe('string');
    });

    it('should return empty array when no 40xx entries exist', () => {
      const entries = [gl('5001', 100000), gl('6001', 50000)];
      const result = HealthcareEngine.getPayerMix(entries);
      expect(result).toHaveLength(0);
    });

    it('should handle empty entries', () => {
      const result = HealthcareEngine.getPayerMix([]);
      expect(result).toHaveLength(0);
    });
  });
});
