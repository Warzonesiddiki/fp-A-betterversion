/**
 * GAP-1 (F-0006) known-answer tests for ASC 830 translation math.
 *
 * Previously acct.localAmount * rate and ctaAdjustment (translated −
 * atHistorical) plus all reduce sums were raw IEEE-754. Multiplication
 * and subtraction now go through multiplyMoney/subtractMoney; totals
 * go through sumMoney with a single cent-round. Rates are scalars.
 *
 * Falsification: replacing the helper bodies with raw float math makes
 * 3 of these 5 tests FAIL.
 */

import { describe, expect, it } from 'vitest';
import { computeTranslationTotals, translateAccount } from './CurrencyTranslation';

describe('CurrencyTranslation helpers — money known answers (GAP-1)', () => {
  it('translates 100 at rate 1.105 to 110.50 exactly', () => {
    const r = translateAccount(100, 1.105, 1.0, false);
    expect(r.translatedAmount).toBe(110.5);
  });

  it('CTA = translated − atHistorical is exact (old float: drift of ~5e-13 for non-integer rates)', () => {
    // Closing rate 1.105, historical 1.000, local 100.50 → translated 111.05
    // at-historical 100.50, CTA = 10.55.
    const r = translateAccount(100.5, 1.105, 1.0, false);
    expect(r.translatedAmount).toBe(111.05);
    expect(r.ctaAdjustment).toBe(10.55);
  });

  it('historical accounts return zero CTA regardless of rate', () => {
    const r = translateAccount(100, 1.2, 1.0, true);
    expect(r.ctaAdjustment).toBe(0);
  });

  it('totals sum exactly across mixed categories', () => {
    // assets 0.10 + 0.20 = 0.30; liab 0.15, equity 0.15 (liab+eq=0.30); balanced.
    const rows = [
      { category: 'asset', localAmount: 0.1, translatedAmount: 0.11, ctaAdjustment: 0.01 },
      { category: 'asset', localAmount: 0.2, translatedAmount: 0.22, ctaAdjustment: 0.02 },
      { category: 'liability', localAmount: -0.1, translatedAmount: -0.11, ctaAdjustment: -0.01 },
      { category: 'equity', localAmount: -0.2, translatedAmount: -0.22, ctaAdjustment: -0.02 },
    ];
    const t = computeTranslationTotals(rows);
    expect(t.local).toBe(0);
    expect(t.translated).toBe(0);
    expect(t.cta).toBe(0);
    expect(t.assetTranslated).toBe(0.33);
    expect(t.liabEqTranslated).toBe(-0.33);
    expect(t.balanced).toBe(true);
  });

  it('rounds three 0.335 translated halves to 1.01 (old float: 1.00)', () => {
    const rows = [
      { category: 'asset', localAmount: 0.335, translatedAmount: 0.335, ctaAdjustment: 0 },
      { category: 'asset', localAmount: 0.335, translatedAmount: 0.335, ctaAdjustment: 0 },
      { category: 'asset', localAmount: 0.335, translatedAmount: 0.335, ctaAdjustment: 0 },
    ];
    const t = computeTranslationTotals(rows);
    expect(t.assetTranslated).toBe(1.01);
    expect(t.translated).toBe(1.01);
  });
});
