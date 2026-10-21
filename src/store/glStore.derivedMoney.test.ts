/**
 * Q5 / DEC-053 stage 3 — derived money is `Money`.
 *
 * `TrialBalanceRow` and `AccountAnalysis` are the first values in the product
 * that ADOPT the `Money` type. They are safe to convert first because they are
 * DERIVED, not stored: `glStore.partialize` omits `trialBalance` and
 * `accountAnalysis`, and `glTrialBalanceStore.partialize` keeps only paging and
 * sort, so no persisted shape changes and no migration exists to run.
 *
 * What this file pins:
 *
 *   1. EXACTNESS — a thousand one-cent rows aggregate to exactly 1,000 minor
 *      units; the old `number` path drifted.
 *   2. REFUSAL — an amount the ledger cannot represent (a sub-cent row
 *      persisted before DEC-048's write gate) is named and the view is left
 *      EMPTY. The old behaviour rounded it at the output boundary, silently
 *      discarding money (FR-006).
 *   3. CURRENCY — a single-currency account carries that currency; a
 *      mixed-currency account carries none rather than a fabricated one, and
 *      the sum is not silently reported as if it were FX-converted.
 *   4. DISPLAY — one formatter renders `Money`, so a display site needs no
 *      adapter of its own (stage 6's leverage).
 *   5. SORT — a grid sorted by a money column orders by AMOUNT; without the
 *      comparator fix every row would compare equal as "[object Object]".
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGLStore } from './glStore';
import { glTrialBalanceSelectors, useGLTrialBalanceStore } from './glTrialBalanceStore';
import { useAuthStore } from './authStore';
import { InvalidMoneyError, type Money } from '@/utils/money';
import type { GLEntry } from '@/types';

const PERMISSIONS = ['import:create', 'import:read', 'import:update', 'import:delete', 'ui:update'];

function entry(overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: 'e-1',
    accountId: 'acct-1',
    accountCode: '1010',
    accountName: 'Cash',
    period: '2024-01',
    periodName: 'Jan 2024',
    date: '2024-01-01',
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

function row(overrides: Partial<GLEntry> = {}): GLEntry {
  return entry(overrides);
}

function zero(): Money {
  return { minor: 0 };
}

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'derived-money-user',
      email: 'derived-money@finplan.local',
      firstName: 'D',
      lastName: 'M',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: '2026-10-21T09:30:00.000Z',
      mfaEnabled: false,
      permissions: PERMISSIONS,
    },
    isAuthenticated: true,
  });
  useGLStore.setState({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    importStatus: 'idle',
    importError: null,
  });
  useGLTrialBalanceStore.setState({ rows: [], filteredRows: [], sortConfig: null });
});

describe('trial balance is exact Money (Q5 stage 3)', () => {
  it('sums a thousand one-cent rows to exactly 1,000 minor units', () => {
    // The float path this replaces: 0.01 added 999 times accumulates error, so
    // the displayed total disagreed with the rows it was summed from.
    const entries = Array.from({ length: 1000 }, (_, index) =>
      row({ id: `e-${index}`, debit: 0.01, credit: 0 })
    );
    useGLStore.setState({ entries });
    useGLStore.getState().generateTrialBalance();

    const derived = useGLStore.getState().trialBalance;
    expect(derived).toHaveLength(1);
    expect(derived[0]!.debit).toEqual({ minor: 1000 });
    expect(derived[0]!.netChange).toEqual({ minor: 1000 });
    expect(derived[0]!.endingBalance).toEqual({ minor: 1000 });
    // Not "close to": exact integer equality.
    expect(derived[0]!.debit.minor).toBe(1000);
  });

  it('does not drift where the old number path did (0.1 + 0.2 + 0.3)', () => {
    useGLStore.setState({
      entries: [
        row({ id: 'e-1', debit: 0.1, credit: 0 }),
        row({ id: 'e-2', debit: 0.2, credit: 0 }),
        row({ id: 'e-3', debit: 0.3, credit: 0 }),
      ],
    });
    useGLStore.getState().generateTrialBalance();

    // float sum: 0.6000000000000001
    expect(useGLStore.getState().trialBalance[0]!.debit).toEqual({ minor: 60 });
  });

  it('nets debits and credits in minor units across accounts', () => {
    useGLStore.setState({
      entries: [
        row({ id: 'e-1', accountId: 'a1', accountCode: '1000', debit: 250.5, credit: 0 }),
        row({ id: 'e-2', accountId: 'a2', accountCode: '4000', debit: 0, credit: 250.5 }),
      ],
    });
    useGLStore.getState().generateTrialBalance();

    const derived = useGLStore.getState().trialBalance;
    expect(derived.map((r) => r.accountCode)).toEqual(['1000', '4000']);
    expect(derived[0]!.netChange).toEqual({ minor: 25050 });
    expect(derived[1]!.netChange).toEqual({ minor: -25050 });
    expect(derived[0]!.netChange.minor + derived[1]!.netChange.minor).toBe(0);
  });
});

describe('trial balance refuses an amount the ledger cannot represent (DEC-048/053)', () => {
  it('leaves the view empty and names the reason instead of rounding money away', () => {
    // `setState` is the only way such a row can exist now: every write action
    // refuses sub-cent precision. A build before that gate could persist one.
    useGLStore.setState({ entries: [row({ debit: 0.004, credit: 0 })] });
    useGLStore.getState().generateTrialBalance();

    // Was: a row showing 0.00 debit — the money vanished at the rounding step.
    expect(useGLStore.getState().trialBalance).toEqual([]);
    expect(useGLStore.getState().importStatus).toBe('error');
    expect(useGLStore.getState().importError).toMatch(/Trial balance not built/);
    // DEC-054: the refusal NAMES the row and the exact value, so it is
    // actionable without knowing which rule was broken.
    expect(useGLStore.getState().importError).toMatch(/Entry e-1: debit 0\.004/);
    expect(useGLStore.getState().importError).toMatch(/2 decimal places/);
    // …and the row is still there, unrounded. It is quarantined, not deleted.
    expect(useGLStore.getState().entries[0]!.debit).toBe(0.004);
  });

  it('refuses a non-finite amount instead of quietly counting it as zero', () => {
    // Stage 3 first asserted the opposite — that `toFiniteNumber` coerced NaN
    // to 0 and the view still built. That was a silent misstatement: a row the
    // ledger cannot read became a row worth nothing, and the trial balance
    // looked complete. DEC-054's audit classifies it and the view is refused.
    useGLStore.setState({ entries: [row({ debit: Number.NaN, credit: 0 })] });
    useGLStore.getState().generateTrialBalance();

    expect(useGLStore.getState().trialBalance).toEqual([]);
    expect(useGLStore.getState().importError).toMatch(/Entry e-1: debit NaN/);
    // Tolerating NaN is still the documented behaviour of the *input* path, so
    // this is the derived-view gate doing the work, not the entry gate.
    expect(useGLStore.getState().importStatus).toBe('error');
  });
});

describe('ledgerScaleAudit — the stage-4 precondition (DEC-054)', () => {
  it('is pure: it classifies without touching state', () => {
    useGLStore.setState({ entries: [row({ id: 'ok' }), row({ id: 'bad', debit: 0.004 })] });
    const before = useGLStore.getState().entries;

    const audit = useGLStore.getState().ledgerScaleAudit();

    expect(audit.representable.map((r) => r.id)).toEqual(['ok']);
    expect(audit.quarantined.map((q) => q.rowId)).toEqual(['bad']);
    // Nothing was moved, rounded, or removed.
    expect(useGLStore.getState().entries).toBe(before);
    expect(useGLStore.getState().entries[1]!.debit).toBe(0.004);
  });

  it('reports a clean ledger as fully representable', () => {
    useGLStore.setState({ entries: [row({ id: 'a', debit: 10 }), row({ id: 'b', debit: 20 })] });
    const audit = useGLStore.getState().ledgerScaleAudit();
    expect(audit.representable).toHaveLength(2);
    expect(audit.quarantined).toHaveLength(0);
  });
});

describe('currency on derived rows', () => {
  it('carries the currency when every contributing entry agrees', () => {
    useGLStore.setState({
      entries: [
        row({ id: 'e-1', debit: 10, credit: 0, currency: 'USD' }),
        row({ id: 'e-2', debit: 5, credit: 0, currency: 'USD' }),
      ],
    });
    useGLStore.getState().generateTrialBalance();

    expect(useGLStore.getState().trialBalance[0]!.debit).toEqual({ minor: 1500, currency: 'USD' });
  });

  it('omits the currency for a mixed-currency account rather than inventing one', () => {
    // FX semantics are DEC-051's open question. Until it is answered the row
    // must not claim a currency it does not have — and this test records that
    // mixed accounts are still summed WITHOUT conversion, which stage 5 owns.
    useGLStore.setState({
      entries: [
        row({ id: 'e-1', debit: 10, credit: 0, currency: 'USD' }),
        row({ id: 'e-2', debit: 5, credit: 0, currency: 'EUR' }),
      ],
    });
    useGLStore.getState().generateTrialBalance();

    const derived = useGLStore.getState().trialBalance[0]!;
    expect(derived.debit.minor).toBe(1500);
    expect(derived.debit.currency).toBeUndefined();
  });

  it('keeps a currency-less account currency-less (absence is not "unknown")', () => {
    useGLStore.setState({ entries: [row({ debit: 10, credit: 0 })] });
    useGLStore.getState().generateTrialBalance();
    expect(useGLStore.getState().trialBalance[0]!.debit).toEqual({ minor: 1000 });
  });
});

describe('account analysis is exact Money (Q5 stage 3)', () => {
  it('aggregates monthly totals as minor units and quantises the average once', () => {
    useGLStore.setState({
      entries: [
        row({ id: 'e-1', period: '2024-01', debit: 0.1, credit: 0 }),
        row({ id: 'e-2', period: '2024-01', debit: 0.2, credit: 0 }),
        row({ id: 'e-3', period: '2024-02', debit: 0.3, credit: 0.1 }),
      ],
    });
    useGLStore.getState().analyzeAccount('acct-1');

    const analysis = useGLStore.getState().accountAnalysis;
    expect(analysis!.monthlyTotals.map((m) => m.debit)).toEqual([{ minor: 30 }, { minor: 30 }]);
    expect(analysis!.monthlyTotals.map((m) => m.net)).toEqual([{ minor: 30 }, { minor: 20 }]);
    expect(analysis!.totalDebit).toEqual({ minor: 60 });
    expect(analysis!.totalCredit).toEqual({ minor: 10 });
    // (0.60 - 0.10) / 2 = 0.25 exactly — no 0.24999999999999997.
    expect(analysis!.averageBalance).toEqual({ minor: 25 });
    expect(analysis!.transactionCount).toBe(3);
  });

  it('returns exact zeroes, not nulls, for an account with no entries', () => {
    useGLStore.setState({ entries: [row({ accountId: 'other' })] });
    useGLStore.getState().analyzeAccount('acct-1');

    const analysis = useGLStore.getState().accountAnalysis;
    expect(analysis!.totalDebit).toEqual(zero());
    expect(analysis!.averageBalance).toEqual(zero());
    expect(analysis!.monthlyTotals).toEqual([]);
  });

  it('refuses a sub-cent row in the analysis too', () => {
    useGLStore.setState({ entries: [row({ debit: 1.005, credit: 0 })] });
    useGLStore.getState().analyzeAccount('acct-1');

    expect(useGLStore.getState().accountAnalysis).toBeNull();
    expect(useGLStore.getState().importError).toMatch(/Account analysis not built/);
    // The refusal is the money primitive's, unchanged (DEC-048).
    expect(() => useGLStore.getState().analyzeAccount('acct-1')).not.toThrow(
      InvalidMoneyError as unknown as Error
    );
  });
});

describe('the trial-balance grid sorts money columns by amount', () => {
  it('orders by minor units rather than by "[object Object]"', () => {
    useGLTrialBalanceStore.getState().setRows([
      { ...balanceRow('a', 500), debit: { minor: 50000 } },
      { ...balanceRow('b', 50), debit: { minor: 5000 } },
      { ...balanceRow('c', 5000), debit: { minor: 500000 } },
    ]);
    useGLTrialBalanceStore.getState().setSort('debit', 'asc');

    expect(useGLTrialBalanceStore.getState().filteredRows.map((r) => r.accountCode)).toEqual([
      'b',
      'a',
      'c',
    ]);

    useGLTrialBalanceStore.getState().setSort('debit', 'desc');
    expect(useGLTrialBalanceStore.getState().filteredRows.map((r) => r.accountCode)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('totals the footer in exact minor units', () => {
    useGLTrialBalanceStore.getState().setRows([
      { ...balanceRow('a', 0.1), debit: { minor: 10 } },
      { ...balanceRow('b', 0.2), debit: { minor: 20 } },
    ]);
    // float total would be 0.30000000000000004
    expect(glTrialBalanceSelectors.totalDebits(useGLTrialBalanceStore.getState())).toBe(0.3);
  });
});

function balanceRow(accountCode: string, netChange: number) {
  return {
    accountId: accountCode,
    accountCode,
    accountName: `Account ${accountCode}`,
    accountType: 'Asset' as const,
    beginningBalance: { minor: 0 },
    debit: { minor: Math.round(netChange * 100) },
    credit: { minor: 0 },
    netChange: { minor: Math.round(netChange * 100) },
    endingBalance: { minor: Math.round(netChange * 100) },
  };
}
