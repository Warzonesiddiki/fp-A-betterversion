/**
 * GAP-1 / F-0006 known-answer tests for the SaaS exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 *
 * Falsifiability: these assertions fail under naive float math (e.g. the
 * 0.1 + 0.2 case and driver half-up rounding) and under old placeholder logic.
 */
import { describe, expect, it } from 'vitest';
import {
  computeSaaSMetrics,
  computeSaaSRatioPct,
  computeMagicNumber,
  computeLTVToCAC,
  scaleSaaSDriver,
  sumSaaSAmounts,
} from './saasMetrics';

describe('saasMetrics — known answers (GAP-1)', () => {
  it('sums fractional SaaS amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumSaaSAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumSaaSAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    // 0.335 × 3 = 1.005 → rounds half-up to 1.01
    expect(scaleSaaSDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeSaaSRatioPct(10, 0)).toBe(0);
    expect(computeMagicNumber(100_000, 0)).toBe(0);
    expect(computeLTVToCAC(100, 80, 0, 500)).toBe(0);
  });

  it('full SaaS metric model produces deterministic known answer', () => {
    const m = computeSaaSMetrics({
      mrr: 100_000,
      newARR: 240_000,
      cogs: 200_000,
      operatingExpenses: 600_000,
      salesMarketingExpense: 200_000,
      customerCount: 500,
      lostCustomers: 25,
      expansionARR: 120_000,
      contractionARR: 30_000,
      cac: 4_000,
    });
    expect(m.arr).toBe(1_200_000);
    expect(m.grossProfit).toBe(1_000_000);
    expect(m.ebitda).toBe(400_000);
    expect(m.grossMarginPct).toBe(83.33);
    expect(m.operatingMarginPct).toBe(33.33);
    expect(m.churnRatePct).toBe(5);
    expect(m.netRetentionPct).toBe(107.5);
    expect(m.magicNumber).toBe(1.2);
    expect(m.arpu).toBe(200);
  });

  it('handles expense-over-revenue (negative EBITDA and margin) exactly', () => {
    const m = computeSaaSMetrics({
      mrr: 10_000,
      newARR: 20_000,
      cogs: 30_000,
      operatingExpenses: 120_000,
      salesMarketingExpense: 50_000,
      customerCount: 100,
      lostCustomers: 10,
      expansionARR: 5_000,
      contractionARR: 10_000,
      cac: 2_500,
    });
    expect(m.arr).toBe(120_000);
    expect(m.ebitda).toBe(-30_000);
    expect(m.operatingMarginPct).toBe(-25);
  });
});
