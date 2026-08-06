/**
 * GAP-1 / F-0006 known-answer tests for the Real Estate exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 */
import { describe, expect, it } from 'vitest';
import {
  computeRealEstateMetrics,
  computeRealEstateRatioPct,
  computeDSCR,
  scaleRealEstateDriver,
  sumRealEstateAmounts,
} from './realEstateMetrics';

describe('realEstateMetrics — known answers (GAP-1)', () => {
  it('sums fractional real estate amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumRealEstateAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumRealEstateAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    expect(scaleRealEstateDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeRealEstateRatioPct(10, 0)).toBe(0);
    expect(computeDSCR(100, 0)).toBe(0);
  });

  it('full real estate metric model produces deterministic known answer', () => {
    const m = computeRealEstateMetrics({
      rentalRevenue: 4_500_000,
      otherRevenue: 500_000,
      propertyOperatingExpenses: 1_500_000,
      generalAdminExpenses: 500_000,
      totalRentableSqFt: 100_000,
      occupiedSqFt: 92_000,
      propertyValuation: 50_000_000,
      totalDebtService: 1_750_000,
      totalDebt: 30_000_000,
      capitalExpenditures: 300_000,
    });
    expect(m.totalRevenue).toBe(5_000_000);
    expect(m.noi).toBe(3_500_000);
    expect(m.ebitda).toBe(3_000_000);
    expect(m.ffo).toBe(2_700_000);
    expect(m.capRatePct).toBe(7);
    expect(m.occupancyRatePct).toBe(92);
    expect(m.dscr).toBe(2);
    expect(m.ltvPct).toBe(60);
    expect(m.noiMarginPct).toBe(70);
  });

  it('handles expense-over-revenue (negative NOI and margin) exactly', () => {
    const m = computeRealEstateMetrics({
      rentalRevenue: 500_000,
      otherRevenue: 0,
      propertyOperatingExpenses: 700_000,
      generalAdminExpenses: 100_000,
      totalRentableSqFt: 10_000,
      occupiedSqFt: 5_000,
      propertyValuation: 5_000_000,
      totalDebtService: 200_000,
      totalDebt: 3_000_000,
      capitalExpenditures: 50_000,
    });
    expect(m.noi).toBe(-200_000);
    expect(m.ebitda).toBe(-300_000);
    expect(m.noiMarginPct).toBe(-40);
  });
});
