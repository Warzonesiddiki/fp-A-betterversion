import { describe, it, expect } from 'vitest';
import { derivePromoAnalysis, type PromotionInput } from './promoAnalysisData';

/**
 * Known-answer tests for promotion analysis.
 *
 *   A: spend 40,000, revenue 300,000, baseline 200,000, margin 30%
 *      incremental 100,000 -> margin 30,000 -> ROI (30,000-40,000)/40,000 = -25%
 *      lift 100,000/200,000 = 50%
 *   B: spend 20,000, revenue 90,000,  baseline 100,000 (no margin recorded)
 *      incremental -10,000 -> lift -10% -> revenue-basis ROI -150%
 */
const A: PromotionInput = {
  id: 'P-A',
  name: 'Spring Push',
  type: 'Percentage',
  discountPercent: 20,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  cost: 40000,
  revenue: 300000,
  baselineRevenue: 200000,
  grossMarginPercent: 30,
  status: 'completed',
};

const B: PromotionInput = {
  id: 'P-B',
  name: 'Clearance',
  type: 'BOGO',
  discountPercent: 50,
  startDate: '2026-04-01',
  endDate: '2026-04-15',
  cost: 20000,
  revenue: 90000,
  baselineRevenue: 100000,
  status: 'completed',
};

describe('derivePromoAnalysis — no fixtures', () => {
  it('returns null when the user has recorded no campaign', () => {
    expect(derivePromoAnalysis([])).toBeNull();
  });

  it('never emits the old fixture campaigns', () => {
    const json = JSON.stringify(derivePromoAnalysis([A, B]));
    for (const invented of ['Summer Sale', 'Back to School', 'Holiday Bundle']) {
      expect(json).not.toContain(invented);
    }
  });
});

describe('derivePromoAnalysis — per promotion', () => {
  it('derives lift and margin-based return when a margin is recorded', () => {
    const row = derivePromoAnalysis([A])!.promotions[0]!;
    expect(row.incrementalRevenue).toBe(100000);
    expect(row.liftPercent).toBe(50);
    // 30% margin on 100,000 incremental = 30,000, less 40,000 spend = -10,000.
    expect(row.roiPercent).toBe(-25);
    expect(row.roiBasis).toBe('gross-margin');
  });

  it('falls back to a revenue basis and says so when no margin is recorded', () => {
    const row = derivePromoAnalysis([B])!.promotions[0]!;
    expect(row.roiBasis).toBe('incremental-revenue');
    // (-10,000 - 20,000) / 20,000 = -150%
    expect(row.roiPercent).toBe(-150);
  });

  it('keeps a negative lift negative', () => {
    // The old table hardcoded a leading '+', rendering "+-10%".
    expect(derivePromoAnalysis([B])!.promotions[0]!.liftPercent).toBe(-10);
  });

  it('emits null rather than zero when there is no baseline or no spend', () => {
    const noBaseline: PromotionInput = { ...A, baselineRevenue: 0, cost: 0 };
    const row = derivePromoAnalysis([noBaseline])!.promotions[0]!;
    expect(row.liftPercent).toBeNull();
    expect(row.roiPercent).toBeNull();
  });
});

describe('derivePromoAnalysis — portfolio', () => {
  it('totals spend, revenue and baseline', () => {
    const a = derivePromoAnalysis([A, B])!;
    expect(a.totalCost).toBe(60000);
    expect(a.totalRevenue).toBe(390000);
    expect(a.totalBaseline).toBe(300000);
    expect(a.incrementalRevenue).toBe(90000);
    expect(a.liftPercent).toBe(30);
  });

  it('refuses to blend margin and revenue bases across a mixed set', () => {
    const a = derivePromoAnalysis([A, B])!;
    expect(a.roiBasis).toBe('incremental-revenue');
    expect(a.marginCoverage).toBe(1);
    // (90,000 - 60,000) / 60,000 = 50% on a revenue basis.
    expect(a.roiPercent).toBe(50);
    expect(a.unavailable.map((u) => u.label)).toContain('Return on promotion spend as profit');
  });

  it('uses the margin basis only when every campaign records one', () => {
    const bWithMargin: PromotionInput = { ...B, grossMarginPercent: 40 };
    const a = derivePromoAnalysis([A, bWithMargin])!;
    expect(a.roiBasis).toBe('gross-margin');
    expect(a.marginCoverage).toBe(2);
    // 30% of 100,000 = 30,000; 40% of -10,000 = -4,000; total 26,000 less
    // 60,000 spend = -34,000 over 60,000 = -56.67%.
    expect(a.roiPercent).toBe(-56.67);
    expect(a.unavailable.map((u) => u.label)).not.toContain('Return on promotion spend as profit');
  });

  it('groups revenue by promotion type', () => {
    expect(derivePromoAnalysis([A, B])!.revenueByType).toEqual([
      { name: 'Percentage', value: 300000 },
      { name: 'BOGO', value: 90000 },
    ]);
  });

  it('always discloses that the ledger cannot attribute revenue to a campaign', () => {
    expect(derivePromoAnalysis([A])!.unavailable.map((u) => u.label)).toContain(
      'Attribution of ledger revenue to a campaign'
    );
  });

  it('uses decimal arithmetic — no IEEE-754 drift', () => {
    const pennies: PromotionInput = { ...A, cost: 0.1, revenue: 0.3, baselineRevenue: 0.1 };
    const a = derivePromoAnalysis([pennies])!;
    expect(a.incrementalRevenue).toBe(0.2);
  });
});
