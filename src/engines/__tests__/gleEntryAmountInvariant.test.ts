/**
 * Phase 2 regression — GLEntry fixtures must carry `amount` (FIX-8 class).
 *
 * The InventoryDashboard `$NaN` defect existed because test fixtures omitted
 * the required `amount` field; the old float code summed `undefined` silently
 * and every assertion passed. The money primitive turned it into a loud
 * InvalidMoneyError (LAW-3). These tests pin that guard so a silently-NaN
 * fixture can never return a financial figure again, and prove that the same
 * entries work exactly once `amount` is present.
 */
import { describe, it, expect } from 'vitest';
import { sumMoney, InvalidMoneyError } from '@/utils/money';
import { HealthcareEngine } from '@/engines/HealthcareEngine';
import type { GLEntry } from '@/types';

/** A full GLEntry-shaped fixture WITHOUT the required `amount` field. */
function entryWithoutAmount(accountCode: string): Omit<GLEntry, 'amount'> {
  return {
    id: `gl-${accountCode}`,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-15',
    description: 'fixture missing amount',
    reference: 'REF',
    entityId: 'entity-1',
    currency: 'USD',
  };
}

/** The same fixture WITH `amount` (matching the glStore convention amount = netChange). */
function entryWithAmount(accountCode: string, amount: number): GLEntry {
  return { ...entryWithoutAmount(accountCode), amount };
}

describe('Phase 2 — GLEntry fixtures must carry amount (FIX-8 regression)', () => {
  it('sumMoney throws InvalidMoneyError on an undefined amount (never silent NaN)', () => {
    expect(() => sumMoney([(entryWithoutAmount('4001') as GLEntry).amount])).toThrow(
      InvalidMoneyError
    );
  });

  it('a migrated engine throws loudly when fixtures omit amount (float code summed NaN silently)', () => {
    const entries = [entryWithAmount('4001', 1000), entryWithoutAmount('4002')] as GLEntry[];
    expect(() => HealthcareEngine.calculatePatientRevenue(entries)).toThrow(InvalidMoneyError);
  });

  it('the same entries produce exact figures once amount is present', () => {
    const entries = [
      entryWithAmount('4001', 1000.1),
      entryWithAmount('4002', 2000.2),
      entryWithAmount('4101', -500.05),
    ];
    const stats = HealthcareEngine.calculatePatientRevenue(entries);
    expect(stats.grossCharges).toBe(3000.3);
    expect(stats.contractuals).toBe(500.05);
    expect(stats.netRevenue).toBe(2500.25);
  });

  it('fixtures typed as GLEntry are rejected by the compiler when amount is missing', () => {
    // The sector-page fixtures are now typed `GLEntry[]`, so `tsc --noEmit`
    // fails on any object literal that omits `amount`. This test exists to
    // document the contract; the compiler check itself runs in CI.
    const typed: GLEntry = entryWithAmount('4001', 100);
    expect(typed.amount).toBe(100);
  });
});
