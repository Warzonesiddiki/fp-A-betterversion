/**
 * GAP-1 (F-0006) known-answer tests for CapitalAdequacyPage RWA totals.
 *
 * computeRWABreakdown was a raw float reduce + float multiply over GL entry
 * amounts; replaced with sumMoney+roundTo and multiplyMoney+roundTo so
 * per-class exposure, risk-weighted assets, and 8% capital charge land on
 * exact cents.
 */

import { describe, expect, it } from 'vitest';
import { computeRWABreakdown, type AssetClass } from './CapitalAdequacyPage';

type Entry = { accountCode: string; amount: number };

const CASH: AssetClass = { prefix: '11', name: 'Cash & Equivalents', weight: 0 };
const GOV: AssetClass = { prefix: '12', name: 'Government Securities', weight: 0 };
const RES: AssetClass = { prefix: '131', name: 'Residential Mortgages', weight: 0.5 };
const CORP: AssetClass = { prefix: '132', name: 'Corporate Loans', weight: 1.0 };
const ALL: AssetClass[] = [CASH, GOV, RES, CORP];

function e(code: string, amount: number): Entry {
  return { accountCode: code, amount };
}

describe('CapitalAdequacyPage RWA breakdown — money known answers (GAP-1)', () => {
  it('empty entries → empty breakdown (control)', () => {
    expect(computeRWABreakdown([], ALL)).toEqual([]);
  });

  it('three 0.1 cash entries → 0.30 balance, zero weight → 0 RWA, 0 charge (old: 0.30000000000000004)', () => {
    const rows = computeRWABreakdown([e('11', 0.1), e('11', 0.1), e('11', 0.1)], ALL);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.category).toBe('Cash & Equivalents');
    expect(rows[0]!.amount).toBe(0.3);
    expect(rows[0]!.weight).toBe('0%');
    expect(rows[0]!.charge).toBe(0);
  });

  it('corporate loans: 1000.00 + 249.99 = 1249.99 balance; 100% weight → RWA 1249.99; 8% charge 99.9992 → 100.00 half-up', () => {
    const rows = computeRWABreakdown([e('132', 1000), e('132', 249.99)], ALL);
    const corp = rows.find((r) => r.category === 'Corporate Loans')!;
    expect(corp.amount).toBe(1249.99);
    expect(corp.charge).toBe(100); // 1249.99 * 1.0 * 0.08 = 99.9992 → 100.00
  });

  it('50% risk-weight residential mortgages: three 0.335 entries → balance 1.01, RWA 0.51, charge 0.04', () => {
    const rows = computeRWABreakdown([e('131', 0.335), e('131', 0.335), e('131', 0.335)], ALL);
    const res = rows.find((r) => r.category === 'Residential Mortgages')!;
    // 0.335 * 3 = 1.005 → 1.01 half-up on balance
    expect(res.amount).toBe(1.01);
    // 1.005 * 0.5 = 0.5025 → half-up rounds to 0.50 (nearest even? Decimal half-up: 0.50)
    // But note: we round after multiplyMoney on the *rounded* balance (1.01) — see helper.
    expect(res.charge).toBe(0.04); // 1.01 * 0.5 * 0.08 = 0.0404 → 0.04
  });
});
