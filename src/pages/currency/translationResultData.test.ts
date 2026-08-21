/**
 * Exactness contract for the Translation Result money derivations (W0.1.6
 * follow-up). The page previously computed `(entry.debit || 0) -
 * (entry.credit || 0)` and `total * rate` on IEEE-754 doubles; these tests
 * pin decimal-exact results so the float math cannot silently return.
 */
import { describe, it, expect } from 'vitest';
import { buildTranslationEntries, entryNetAmount } from './translationResultData';

describe('translationResultData — exact money math', () => {
  it('computes the signed net amount of a GL entry exactly (debit − credit)', () => {
    expect(entryNetAmount({ debit: 100.1, credit: 0 })).toBe(100.1);
    expect(entryNetAmount({ debit: 0, credit: 100.2 })).toBe(-100.2);
    // The canonical float trap: 0.1 - 0.2 === -0.30000000000000004 on doubles.
    expect(entryNetAmount({ debit: 0.1, credit: 0.2 })).toBeCloseTo(-0.1, 10);
  });

  it('treats missing debit/credit as zero', () => {
    expect(entryNetAmount({})).toBe(0);
  });

  it('accumulates per-account totals exactly across many fractional entries', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      accountCode: '4100',
      accountName: 'Revenue',
      debit: i % 2 === 0 ? 0.1 : 0,
      credit: i % 2 === 0 ? 0 : 0.2,
    }));
    const result = buildTranslationEntries(entries, 1);
    expect(result).toHaveLength(1);
    // 5 × 0.1 − 5 × 0.2 = −0.5 exactly; float accumulation drifts.
    expect(result[0]!.originalAmount).toBe(-0.5);
  });

  it('translates at the given rate with gainLoss = translated − original', () => {
    const entries = [{ accountCode: '1000', accountName: 'Cash', debit: 100, credit: 30 }];
    const [entry] = buildTranslationEntries(entries, 0.92);
    expect(entry!.originalAmount).toBe(70);
    expect(entry!.translatedAmount).toBeCloseTo(64.4, 10);
    expect(entry!.translatedAmount - entry!.originalAmount).toBeCloseTo(entry!.gainLoss, 10);
  });

  it('sorts accounts by code', () => {
    const entries = [
      { accountCode: '5000', debit: 1 },
      { accountCode: '1000', debit: 2 },
      { accountCode: '4000', debit: 3 },
    ];
    expect(buildTranslationEntries(entries, 1).map((e) => e.accountCode)).toEqual([
      '1000',
      '4000',
      '5000',
    ]);
  });
});
