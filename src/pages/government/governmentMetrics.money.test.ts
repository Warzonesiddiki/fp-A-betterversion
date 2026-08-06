/**
 * GAP-1 / F-0006 known-answer tests for the Government exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 *
 * Falsifiability: fails under naive float math (fractional disbursements,
 * 0.335×3 driver scale) and under old placeholder KPI logic.
 */
import { describe, expect, it } from 'vitest';
import {
  computeAvgCycleDays,
  computeCostPerCitizen,
  computeGovernmentMetrics,
  computeProcurementMetrics,
  computeRatioPct,
  modelGrantDisbursement,
  scaleByDriver,
  sumDisbursements,
} from './governmentMetrics';

describe('governmentMetrics — known answers (GAP-1)', () => {
  it('sums fractional grant disbursements exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumDisbursements([0.1, 0.2])).toBe(0.3);
    expect(sumDisbursements([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (budget driver scale)', () => {
    expect(scaleByDriver(0.335, 200)).toBe(1.01);
  });

  it('computes cost per citizen exactly', () => {
    expect(computeCostPerCitizen(1_800_000, 4000)).toBe(450);
    expect(computeCostPerCitizen(0.3, 2)).toBe(0.15);
  });

  it('returns 0 cost per citizen for zero citizens (undefined ratio)', () => {
    expect(computeCostPerCitizen(1000, 0)).toBe(0);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeRatioPct(10, 0)).toBe(0);
  });

  it('full metric model produces deterministic known answer', () => {
    const m = computeGovernmentMetrics({
      budgetAppropriated: 10_000_000,
      actualSpend: 9_500_000,
      grantAllocated: 2_000_000,
      grantDisbursed: 1_800_000,
      citizensServed: 1_250_000,
      totalExpenses: 9_500_000,
      revenueCollected: 8_200_000,
      revenueForecast: 9_000_000,
    });
    expect(m.budgetUtilizationPct).toBe(95);
    expect(m.grantDisbursementRatePct).toBe(90);
    expect(m.costPerCitizen).toBe(7.6);
    expect(m.revenueCollectionGapPct).toBe(8.89);
    expect(m.unutilizedBudget).toBe(500_000);
  });

  it('handles revenue shortfall (negative collection gap) exactly', () => {
    const m = computeGovernmentMetrics({
      budgetAppropriated: 1_000_000,
      actualSpend: 1_200_000,
      grantAllocated: 500_000,
      grantDisbursed: 500_000,
      citizensServed: 100_000,
      totalExpenses: 1_200_000,
      revenueCollected: 900_000,
      revenueForecast: 800_000,
    });
    expect(m.revenueCollectionGapPct).toBe(-12.5);
    expect(m.unutilizedBudget).toBe(-200_000);
  });

  it('modelGrantDisbursement is an exact percentage share', () => {
    expect(modelGrantDisbursement(2_000_000, 90)).toBe(1_800_000);
    expect(modelGrantDisbursement(0.1, 50)).toBe(0.05);
  });
});

describe('procurementMetrics — known answers (GAP-1)', () => {
  it('computes average cycle days exactly', () => {
    expect(computeAvgCycleDays(1350, 30)).toBe(45);
    expect(computeAvgCycleDays(0.3, 2)).toBe(0.2); // 0.15 rounded to 1 dp half-up
  });

  it('returns 0 avg cycle days for zero contracts', () => {
    expect(computeAvgCycleDays(1000, 0)).toBe(0);
  });

  it('full procurement model produces deterministic known answer', () => {
    const m = computeProcurementMetrics({
      contractValue: 5_000_000,
      competitivelyTenderedValue: 4_250_000,
      compliantAudits: 48,
      totalAudits: 50,
      cycleDaysSum: 1350,
      contractCount: 30,
      baselineSpend: 6_000_000,
      realizedSpend: 5_700_000,
    });
    expect(m.competitiveTenderPct).toBe(85);
    expect(m.complianceScorePct).toBe(96);
    expect(m.avgCycleDays).toBe(45);
    expect(m.negotiatedSavings).toBe(300_000);
    expect(m.savingsRatePct).toBe(5);
  });

  it('handles no negotiated savings exactly (zero savings rate)', () => {
    const m = computeProcurementMetrics({
      contractValue: 1_000_000,
      competitivelyTenderedValue: 500_000,
      compliantAudits: 10,
      totalAudits: 20,
      cycleDaysSum: 600,
      contractCount: 20,
      baselineSpend: 1_000_000,
      realizedSpend: 1_000_000,
    });
    expect(m.negotiatedSavings).toBe(0);
    expect(m.savingsRatePct).toBe(0);
  });
});
