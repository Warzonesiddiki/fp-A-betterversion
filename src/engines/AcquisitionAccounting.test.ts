import { describe, it, expect } from 'vitest';
import {
  allocatePurchasePrice,
  testGoodwillImpairment,
  type PurchasePriceAllocationInput,
} from './AcquisitionAccounting';

/**
 * Phase 8 (row 10 remainder): purchase-price allocation and goodwill
 * impairment oracles — every figure hand-computed under ASC 805/350.
 *
 * Identities that must hold to the cent:
 *   consideration + NCI + previously-held interest
 *     = net identifiable assets at FV + goodwill - bargain-purchase gain
 * Goodwill is impairment-tested, never amortised.
 */

const DEAL: PurchasePriceAllocationInput = {
  considerationTransferred: 1000000,
  nonControllingInterestFairValue: 250000,
  previouslyHeldInterestFairValue: 0,
  identifiableAssets: [
    { name: 'Cash', fairValue: 100000 },
    { name: 'Receivables', fairValue: 150000 },
    { name: 'PP&E', fairValue: 400000 },
    { name: 'Identifiable intangibles', fairValue: 200000 },
  ],
  liabilitiesAssumed: [
    { name: 'Payables', fairValue: 80000 },
    { name: 'Debt assumed', fairValue: 120000 },
  ],
};

describe('allocatePurchasePrice (ASC 805)', () => {
  it('full goodwill: hand-computed and footing to the cent', () => {
    const r = allocatePurchasePrice(DEAL);
    expect(r.netIdentifiableAssets).toBe(650000); // 850,000 - 200,000
    expect(r.goodwill).toBe(600000); // 1,250,000 - 650,000
    expect(r.bargainPurchaseGain).toBe(0);
    expect(r.method).toBe('full');
    expect(r.attributedTotal).toBe(1250000);
  });

  it('partial goodwill (no NCI fair value): only the acquired share is recognised', () => {
    const r = allocatePurchasePrice({
      ...DEAL,
      nonControllingInterestFairValue: null,
      ownershipPct: 80,
    });
    // NCI at proportionate share: 20% x 650,000 = 130,000
    expect(r.nonControllingInterest).toBe(130000);
    expect(r.goodwill).toBe(480000); // 1,000,000 + 130,000 - 650,000
    expect(r.method).toBe('partial');
  });

  it('a bargain purchase is a gain, never negative goodwill', () => {
    const r = allocatePurchasePrice({ ...DEAL, considerationTransferred: 300000 });
    expect(r.goodwill).toBe(0);
    expect(r.bargainPurchaseGain).toBe(100000); // 650,000 - 550,000
    expect(r.attributedTotal).toBe(550000);
  });

  it('previously held interest counts toward the total (step acquisition)', () => {
    const r = allocatePurchasePrice({
      ...DEAL,
      considerationTransferred: 600000,
      previouslyHeldInterestFairValue: 400000,
    });
    expect(r.goodwill).toBe(600000); // 600k + 250k + 400k - 650k
  });

  it('rejects nonsense instead of allocating it', () => {
    expect(() => allocatePurchasePrice({ ...DEAL, considerationTransferred: -5 })).toThrow(
      /consideration/i
    );
    expect(() => allocatePurchasePrice({ ...DEAL, identifiableAssets: [] })).toThrow(
      /identifiable/i
    );
  });
});

describe('testGoodwillImpairment (ASC 350, ASU 2017-04)', () => {
  it('impairment is the carrying-over-fair-value excess, capped at goodwill', () => {
    const r = testGoodwillImpairment({
      reportingUnitCarryingAmount: 900000,
      reportingUnitFairValue: 750000,
      goodwillCarryingAmount: 600000,
    });
    expect(r.impairmentLoss).toBe(150000);
    expect(r.goodwillAfterImpairment).toBe(450000);
  });

  it('the cap binds: impairment never exceeds the goodwill balance', () => {
    const r = testGoodwillImpairment({
      reportingUnitCarryingAmount: 900000,
      reportingUnitFairValue: 100000,
      goodwillCarryingAmount: 600000,
    });
    expect(r.impairmentLoss).toBe(600000);
    expect(r.goodwillAfterImpairment).toBe(0);
  });

  it('no impairment when fair value covers the carrying amount', () => {
    const r = testGoodwillImpairment({
      reportingUnitCarryingAmount: 900000,
      reportingUnitFairValue: 950000,
      goodwillCarryingAmount: 600000,
    });
    expect(r.impairmentLoss).toBe(0);
    expect(r.goodwillAfterImpairment).toBe(600000);
  });
});
