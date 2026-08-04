/**
 * GAP-1 (F-0006) known-answer tests for LoanLossPage money helpers.
 *
 * sumEntriesAmount and computeLoanSegments were raw float reduces over
 * GL entry amounts; replaced with sumMoney + roundTo for exact-decimal
 * CECL segment aggregates (balance, reserve). NPL is a percentage ratio
 * and is intentionally NOT on the money primitive (percentage metric).
 */

import { describe, expect, it } from 'vitest';
import { computeLoanSegments, sumEntriesAmount } from './LoanLossPage';

type Entry = { accountCode: string; amount: number };

const CRE = { prefix: '131', name: 'Commercial Real Estate', color: '#3b82f6' };
const RES = { prefix: '132', name: 'Residential Mortgage', color: '#10b981' };
const CONS = { prefix: '133', name: 'Consumer Loans', color: '#f59e0b' };
const SBA = { prefix: '134', name: 'Small Business (SBA)', color: '#ef4444' };
const CATEGORIES = [CRE, RES, CONS, SBA] as const;

function e(code: string, amount: number): Entry {
  return { accountCode: code, amount };
}

describe('LoanLossPage money helpers — known answers (GAP-1)', () => {
  it('sumEntriesAmount on empty list → 0 (control)', () => {
    expect(sumEntriesAmount([])).toBe(0);
  });

  it('sumEntriesAmount: three 0.1 entries → 0.3 exactly (old: 0.30000000000000004)', () => {
    expect(sumEntriesAmount([e('131', 0.1), e('131', 0.1), e('131', 0.1)])).toBe(0.3);
  });

  it('sumEntriesAmount: three 0.335 entries → 1.01 half-up', () => {
    expect(sumEntriesAmount([e('131', 0.335), e('131', 0.335), e('131', 0.335)])).toBe(1.01);
  });

  it('computeLoanSegments splits balance/reserve per category exactly', () => {
    // Commercial Real Estate: three 0.1 debits → 0.3; reserve code 2151 = -0.05
    // Residential Mortgage: 500.25 + 499.75 = 1000.00; reserve code 2152 = -12.50
    // Consumer: 0 balance → filtered out
    // SBA: 99.99; no reserve entry → 0
    const entries: Entry[] = [
      e('131', 0.1),
      e('131', 0.1),
      e('131', 0.1),
      e('2151', -0.05),
      e('132', 500.25),
      e('132', 499.75),
      e('2152', -12.5),
      e('134', 99.99),
    ];
    const segs = computeLoanSegments(entries, CATEGORIES);
    expect(segs).toHaveLength(3);

    const cre = segs.find((s) => s.type === CRE.name)!;
    const res = segs.find((s) => s.type === RES.name)!;
    const sba = segs.find((s) => s.type === SBA.name)!;

    expect(cre.balance).toBe(0.3);
    expect(cre.reserve).toBe(0.05);
    expect(res.balance).toBe(1000);
    expect(res.reserve).toBe(12.5);
    expect(sba.balance).toBe(99.99);
    expect(sba.reserve).toBe(0);
  });

  it('computeLoanSegments NPL is a percentage ratio (non-money; sanity-check only)', () => {
    // CRE balance 1000; NPL memo balance 25 → npl = 2.5%
    // NPL is a ratio, not a currency amount — must stay as plain JS number.
    const entries: Entry[] = [e('131', 1000), e('921', -25)];
    const segs = computeLoanSegments(entries, [CRE]);
    expect(segs).toHaveLength(1);
    expect(segs[0]!.balance).toBe(1000);
    expect(segs[0]!.reserve).toBe(0);
    expect(segs[0]!.npl).toBeCloseTo(2.5, 10);
  });
});
