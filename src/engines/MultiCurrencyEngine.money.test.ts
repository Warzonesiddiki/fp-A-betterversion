/**
 * GAP-1 (F-0006) known-answer tests for MultiCurrencyEngine's money migration.
 *
 * ASC 830 translation and remeasurement produce reported balance-sheet and P&L
 * figures. Each case is a FIXED input -> EXACT expected decimal asserted with
 * `toBe` (Object.is); the pre-migration float literal is recorded inline where
 * it differed.
 */
import { describe, it, expect } from 'vitest';
import { MultiCurrencyEngine } from './MultiCurrencyEngine';

describe('MultiCurrencyEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('translate', () => {
    it('converts a cent amount exactly (float gave 1100.1100000000001)', () => {
      expect(MultiCurrencyEngine.translate(1000.1, 'EUR', 'USD', 1.1)).toBe(1100.11);
    });

    it('does NOT force 2dp — sub-unit precision survives for non-USD minor units', () => {
      // translate() is a general conversion primitive, and not every currency
      // has 2 minor units (JPY 0, KWD 3). Rounding to cents here would return 1
      // instead of 0.999 and bake a USD assumption into downstream figures.
      expect(MultiCurrencyEngine.translate(3, 'USD', 'GBP', 0.333)).toBe(0.999);
    });

    it('is an identity when the currencies match', () => {
      expect(MultiCurrencyEngine.translate(1000.1, 'USD', 'USD', 999)).toBe(1000.1);
    });

    it('returns 0 for a zero rate', () => {
      expect(MultiCurrencyEngine.translate(1000.1, 'EUR', 'USD', 0)).toBe(0);
    });

    it('rejects a negative rate loudly', () => {
      expect(() => MultiCurrencyEngine.translate(100, 'EUR', 'USD', -1)).toThrow(
        /rate cannot be negative/
      );
    });
  });

  describe('calculateTranslationGainLoss', () => {
    it('computes the FX gain exactly (float gave 49.99999999999982)', () => {
      // The rate DELTA is taken in exact decimals: 1.15 - 1.10 = 0.05 exactly.
      expect(MultiCurrencyEngine.calculateTranslationGainLoss(1000, 1.1, 1.15)).toBe(50);
    });

    it('computes an FX loss exactly', () => {
      expect(MultiCurrencyEngine.calculateTranslationGainLoss(1000, 1.15, 1.1)).toBe(-50);
    });

    it('returns 0 when the rate is unchanged', () => {
      expect(MultiCurrencyEngine.calculateTranslationGainLoss(1000.1, 1.1, 1.1)).toBe(0);
    });

    it('returns 0 for a zero opening rate rather than a spurious gain', () => {
      expect(MultiCurrencyEngine.calculateTranslationGainLoss(1000, 0, 1.2)).toBe(0);
    });
  });

  describe('getWeightedAverageRate', () => {
    it('averages rates exactly', () => {
      const rate = (r: number) =>
        ({ rate: r }) as unknown as Parameters<
          typeof MultiCurrencyEngine.getWeightedAverageRate
        >[0][number];
      // Float: (1.1 + 1.2 + 1.3) / 3 === 1.2000000000000002 in some orderings.
      expect(MultiCurrencyEngine.getWeightedAverageRate([rate(1.1), rate(1.2), rate(1.3)])).toBe(
        1.2
      );
    });

    it('returns 0 for an empty rate set instead of NaN', () => {
      expect(MultiCurrencyEngine.getWeightedAverageRate([])).toBe(0);
    });
  });

  describe('convertIncomeStatement', () => {
    it('translates revenue and expenses at the average rate exactly', () => {
      const r = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.25);
      expect(r.revenueUSD).toBe(12000);
      expect(r.expensesUSD).toBe(7200);
    });

    it('computes the translation gain exactly (float gave 200.00000000000017)', () => {
      const r = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.25);
      expect(r.translationGainLoss).toBe(200);
    });

    it('computes the translation loss exactly (float gave -200.00000000000017)', () => {
      const r = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.15);
      expect(r.translationGainLoss).toBe(-200);
    });

    it('handles cent-level revenue without drift', () => {
      const r = MultiCurrencyEngine.convertIncomeStatement(1000.1, 0, 1.1, 1.1);
      expect(r.revenueUSD).toBe(1100.11);
      expect(r.translationGainLoss).toBe(0);
    });
  });

  describe('translateBalanceSheet (ASC 830 current rate method)', () => {
    const items = [
      { name: 'Cash', type: 'asset' as const, localAmount: 1000.1 },
      { name: 'Loan', type: 'liability' as const, localAmount: -500.05 },
      { name: 'Share capital', type: 'equity' as const, localAmount: 250.02 },
    ];

    it('computes the CTA adjustment exactly (float gave 50.00500000000011)', () => {
      const [cash] = MultiCurrencyEngine.translateBalanceSheet(items, 1.25, 1.22, 1.2);
      // 1000.10 x 1.25 - 1000.10 x 1.20 = 50.005 -> 50.01 half-up
      expect(cash!.translatedAmount).toBe(1250.13);
      expect(cash!.ctaAdjustment).toBe(50.01);
    });

    it('assigns no CTA to equity (held at historical rate)', () => {
      const rows = MultiCurrencyEngine.translateBalanceSheet(items, 1.25, 1.22, 1.2);
      const equity = rows.find((r) => r.type === 'equity')!;
      expect(equity.ctaAdjustment).toBe(0);
      expect(equity.translatedAmount).toBe(300.02);
    });

    it('produces zero CTA when every rate is identical', () => {
      const rows = MultiCurrencyEngine.translateBalanceSheet(items, 1.2, 1.2, 1.2);
      for (const r of rows) expect(r.ctaAdjustment).toBe(0);
    });
  });

  describe('calculateTotalCTA', () => {
    it('sums CTA adjustments exactly (float gave 0.30000000000000004)', () => {
      expect(
        MultiCurrencyEngine.calculateTotalCTA([
          { ctaAdjustment: 0.1 },
          { ctaAdjustment: 0.1 },
          { ctaAdjustment: 0.1 },
        ])
      ).toBe(0.3);
    });

    it('nets offsetting adjustments to exactly zero', () => {
      expect(
        MultiCurrencyEngine.calculateTotalCTA([{ ctaAdjustment: 0.1 }, { ctaAdjustment: -0.1 }])
      ).toBe(0);
    });
  });

  describe('remeasure', () => {
    it('remeasures monetary items at the closing rate with an exact gain', () => {
      const [row] = MultiCurrencyEngine.remeasure(
        [{ name: 'Receivable', monetary: true, localAmount: 1000 }],
        1.15,
        1.1
      );
      expect(row!.functionalAmount).toBe(1150);
      // 1000 x (1.15 - 1.10) = 50 exactly (float: 49.99999999999982)
      expect(row!.gainLoss).toBe(50);
    });

    it('holds non-monetary items at historical rate with no gain', () => {
      const [row] = MultiCurrencyEngine.remeasure(
        [{ name: 'Equipment', monetary: false, localAmount: 1000.1 }],
        1.15,
        1.1
      );
      expect(row!.functionalAmount).toBe(1100.11);
      expect(row!.gainLoss).toBe(0);
    });
  });
});
