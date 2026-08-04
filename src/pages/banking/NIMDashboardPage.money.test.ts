/**
 * GAP-1 (F-0006) known-answer tests for NIMDashboardPage component totals.
 */

import { describe, expect, it } from 'vitest';
import { computeNIMComponents, type NIMCategory } from './NIMDashboardPage';

type Entry = { accountCode: string; amount: number };
const CRE: NIMCategory = { prefix: '131', name: 'Commercial Real Estate' };
const RES: NIMCategory = { prefix: '132', name: 'Residential Mortgage' };
const CATS: NIMCategory[] = [CRE, RES];

function e(code: string, amount: number): Entry {
  return { accountCode: code, amount };
}

// Per-source rule: income account = '41' + prefix.substring(1)
// '131' → '4131'; '132' → '4132'
const INC_CRE = '4131';
const INC_RES = '4132';

describe('NIMDashboardPage NIM components — money known answers (GAP-1)', () => {
  it('empty entries → empty list (control)', () => {
    expect(computeNIMComponents([], CATS)).toEqual([]);
  });

  it('assets-only entries with zero income → zero rows filtered out (matches original behavior)', () => {
    const rows = computeNIMComponents([e('131', 0.1), e('131', 0.1), e('131', 0.1)], CATS);
    expect(rows).toEqual([]);
  });

  it('income exactly sums: 100.10 + 200.20 = 300.30 for CRE income', () => {
    const rows = computeNIMComponents(
      [e('131', 1000), e(INC_CRE, 100.1), e(INC_CRE, 200.2)],
      [CRE]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.income).toBe(300.3);
    expect(rows[0]!.source).toBe('Commercial Real Estate');
  });

  it('three 0.335 income entries → 1.01 half-up (old: 1.00)', () => {
    const rows = computeNIMComponents(
      [e('131', 1000), e(INC_CRE, 0.335), e(INC_CRE, 0.335), e(INC_CRE, 0.335)],
      [CRE]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.income).toBe(1.01);
  });

  it('per-category splits aggregate exactly across prefixes', () => {
    const rows = computeNIMComponents(
      [e('131', 1000), e('132', 2000), e(INC_CRE, 60.06), e(INC_RES, 80.08)],
      CATS
    );
    expect(rows).toHaveLength(2);
    const cre = rows.find((r) => r.source === CRE.name)!;
    const res = rows.find((r) => r.source === RES.name)!;
    expect(cre.income).toBe(60.06);
    expect(res.income).toBe(80.08);
  });
});
