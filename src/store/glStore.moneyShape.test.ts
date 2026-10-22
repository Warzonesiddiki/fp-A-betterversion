/**
 * Q5 stage 4 preparation — a `Money` read as a number must not become 0.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Stage 4 changes `GLEntry.debit/credit/netChange/amount` to `Money`. Before
 * doing that, the store's numeric reads were measured and they do not fail
 * loudly: `toFiniteNumber(value: unknown, fallback = 0)` returned its FALLBACK
 * for anything that is not a number, and a `Money` is an OBJECT. So a
 * compiler-clean flip would have produced:
 *
 *   - `normalizeGLEntry` → every row's debit, credit, netChange and amount 0,
 *     because `typeof money !== 'number'` (measured: the guard is `unknown`-typed,
 *     so `tsc` stays green and says nothing);
 *   - `generateTrialBalance` → `asMoney(toFiniteNumber(entry.debit))` → `{minor: 0}`;
 *   - `validateEntries` → every journal "balances" at 0 = 0;
 *   - `ledgerAmountIssue` → EVERY `Money` write REFUSED ("must be a finite
 *     number"), so the store would reject legitimate rows instead of zeroing
 *     them. Both outcomes are wrong and neither is a compile error.
 *
 * A green build that zeroes the ledger is the exact failure class this repo has
 * already shipped once (the `NaN` → 0 coercion fixed in DEC-054). So the reads
 * cross through `amountFrom` — explicit, exact, Money-aware — and the admission
 * rule admits a `Money` on the same terms as a number.
 *
 * What is pinned here:
 *   1. `amountFrom` — Money exact, number unchanged, junk falls back, never throws.
 *   2. WRITE — a `Money`-shaped row is ADMITTED (was: refused) and normalized to
 *      the right amount (was: 0).
 *   3. READ — the derived view and the double-entry gate see the real amount.
 *   4. REGRESSION — everything the admission rule refused before is still refused.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGLStore } from './glStore';
import { useAuthStore } from './authStore';
import { amountFrom, asMoney, type Money } from '@/utils/money';
import type { GLEntry } from '@/types';

const PERMISSIONS = ['import:create', 'import:read', 'import:update', 'import:delete', 'ui:update'];

/** A row as stage 4 will type it: money fields are `Money`. */
function moneyRow(overrides: Record<string, unknown> = {}): GLEntry {
  return {
    id: 'e-1',
    accountId: 'acct-1',
    accountCode: '1010',
    accountName: 'Cash',
    period: '2024-01',
    periodName: 'Jan 2024',
    date: '2024-01-01',
    debit: { minor: 0 },
    credit: { minor: 0 },
    netChange: { minor: 0 },
    amount: { minor: 0 },
    description: '',
    reference: '',
    ...overrides,
  } as unknown as GLEntry;
}

/** Read a money field that is still typed `number` in this build. */
function amountOf(entry: GLEntry, field: 'debit' | 'credit' | 'netChange' | 'amount'): number {
  return entry[field] as unknown as number;
}

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'money-shape-user',
      email: 'money-shape@finplan.local',
      firstName: 'M',
      lastName: 'S',
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
});

describe('amountFrom — the boundary crossing (Q5 stage 4 prep)', () => {
  it('reads a Money as its exact whole-currency-unit number', () => {
    expect(amountFrom(asMoney(100))).toBe(100);
    expect(amountFrom({ minor: 12345 })).toBe(123.45);
    expect(amountFrom({ minor: -12345 })).toBe(-123.45);
    expect(amountFrom({ minor: 0 })).toBe(0);
  });

  it('leaves a plain number exactly as it found it', () => {
    expect(amountFrom(0.1)).toBe(0.1);
    expect(amountFrom(-250.5)).toBe(-250.5);
    expect(amountFrom(0)).toBe(0);
  });

  it('falls back for everything a tolerant numeric read used to swallow', () => {
    // Same tolerance the ledger's legacy columns rely on, but a Money is no
    // longer part of "everything else".
    expect(amountFrom(undefined)).toBe(0);
    expect(amountFrom(null)).toBe(0);
    expect(amountFrom(Number.NaN)).toBe(0);
    expect(amountFrom(Number.POSITIVE_INFINITY)).toBe(0);
    expect(amountFrom('100')).toBe(0);
    expect(amountFrom({})).toBe(0);
    expect(amountFrom({ minor: 0.5 })).toBe(0);
    expect(amountFrom(undefined, 7)).toBe(7);
  });
});

describe('a Money-shaped ledger row survives the store (Q5 stage 4 prep)', () => {
  it('is ADMITTED, not refused as "must be a finite number"', () => {
    useGLStore
      .getState()
      .setEntries([
        moneyRow({ debit: { minor: 10000 }, credit: { minor: 0 }, amount: { minor: 10000 } }),
      ]);

    // The pre-fix admission rule tested `typeof value !== 'number'` and refused
    // every Money with "debit must be a finite number".
    expect(useGLStore.getState().importStatus).not.toBe('error');
    expect(useGLStore.getState().importError).toBeNull();
    expect(useGLStore.getState().entries).toHaveLength(1);
  });

  it('is normalized to the real amount, not zeroed', () => {
    useGLStore
      .getState()
      .setEntries([
        moneyRow({ debit: { minor: 10000 }, credit: { minor: 0 }, amount: { minor: 10000 } }),
      ]);

    const stored = useGLStore.getState().entries[0]!;
    // Pre-fix: every one of these was 0, because `typeof money !== 'number'`
    // returned the fallback. A zeroed ledger with a green typecheck.
    expect(amountOf(stored, 'debit')).toBe(100);
    expect(amountOf(stored, 'credit')).toBe(0);
    expect(amountOf(stored, 'netChange')).toBe(100);
    expect(amountOf(stored, 'amount')).toBe(100);
  });

  it('keeps a credit-side row negative in netChange', () => {
    useGLStore
      .getState()
      .setEntries([
        moneyRow({ debit: { minor: 0 }, credit: { minor: 25050 }, amount: { minor: -25050 } }),
      ]);

    const stored = useGLStore.getState().entries[0]!;
    expect(amountOf(stored, 'debit')).toBe(0);
    expect(amountOf(stored, 'credit')).toBe(250.5);
    expect(amountOf(stored, 'netChange')).toBe(-250.5);
  });

  it('derives the same trial balance a number row of the same value derives', () => {
    useGLStore
      .getState()
      .setEntries([
        moneyRow({ id: 'a', accountId: 'a1', accountCode: '1000', debit: { minor: 25050 } }),
        moneyRow({ id: 'b', accountId: 'a2', accountCode: '4000', credit: { minor: 25050 } }),
      ]);
    useGLStore.setState({ importStatus: 'idle', importError: null });
    useGLStore.getState().generateTrialBalance();

    const derived = useGLStore.getState().trialBalance;
    expect(derived.map((r) => r.accountCode)).toEqual(['1000', '4000']);
    expect(derived[0]!.debit).toEqual({ minor: 25050 });
    expect(derived[1]!.credit).toEqual({ minor: 25050 });
    expect(derived[0]!.netChange).toEqual({ minor: 25050 });
    expect(derived[1]!.netChange).toEqual({ minor: -25050 });
    // Balanced ledger: the two sides cancel exactly in minor units.
    expect(derived[0]!.netChange.minor + derived[1]!.netChange.minor).toBe(0);
  });

  it('passes the double-entry gate with real amounts instead of 0 = 0', () => {
    const result = useGLStore
      .getState()
      .validateEntries([
        moneyRow({ id: 'a', journalId: 'J1', debit: { minor: 10000 }, credit: { minor: 0 } }),
        moneyRow({ id: 'b', journalId: 'J1', debit: { minor: 0 }, credit: { minor: 10000 } }),
      ]);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validCount).toBe(2);
  });

  it('still catches an unbalanced journal built from Money rows', () => {
    // The gate must fail on the VALUES, not merely agree that 0 equals 0.
    const result = useGLStore
      .getState()
      .validateEntries([
        moneyRow({ id: 'a', journalId: 'J2', debit: { minor: 10000 }, credit: { minor: 0 } }),
        moneyRow({ id: 'b', journalId: 'J2', debit: { minor: 0 }, credit: { minor: 9999 } }),
      ]);

    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/do not equal credits/);
  });
});

describe('the admission rule still refuses what it refused before', () => {
  const refused = (overrides: Record<string, unknown>) => {
    useGLStore.getState().setEntries([moneyRow(overrides)]);
    return useGLStore.getState().importError;
  };

  beforeEach(() => {
    useGLStore.setState({ importStatus: 'idle', importError: null });
  });

  it('refuses a sub-cent number', () => {
    expect(refused({ debit: 0.004 })).toMatch(/sub-cent precision/);
  });

  it('refuses a non-finite number', () => {
    expect(refused({ debit: Number.NaN })).toMatch(/must be a finite non-negative number/);
  });

  it('refuses a numeric string (the persisted shapes before DEC-048)', () => {
    expect(refused({ debit: '100' })).toMatch(/must be a finite non-negative number/);
  });

  it('refuses a negative debit', () => {
    expect(refused({ debit: -1 })).toMatch(/must be a finite non-negative number/);
  });

  it('refuses a negative Money debit on the same rule', () => {
    expect(refused({ debit: { minor: -100 } })).toMatch(/must be a finite non-negative number/);
  });

  it('names a Money-shaped value that is not representable', () => {
    expect(refused({ debit: { minor: 0.5 } })).toMatch(/minor units must be a safe integer/);
  });

  it('still admits an absent amount (absent is not zero)', () => {
    useGLStore.getState().setEntries([moneyRow({ debit: undefined })]);
    expect(useGLStore.getState().importError).toBeNull();
  });
});

describe('Money and number inputs agree', () => {
  it('produces the identical trial balance for equal values', () => {
    const money = (minor: number): Money => ({ minor });
    useGLStore
      .getState()
      .setEntries([
        moneyRow({ id: 'a', accountId: 'a1', accountCode: '1000', debit: money(125050) }),
        moneyRow({ id: 'b', accountId: 'a2', accountCode: '4000', credit: money(125050) }),
      ]);
    useGLStore.setState({ importStatus: 'idle', importError: null });
    useGLStore.getState().generateTrialBalance();
    const fromMoney = useGLStore.getState().trialBalance;

    useGLStore.setState({ entries: [], trialBalance: [] });
    useGLStore
      .getState()
      .setEntries([
        moneyRow({ id: 'a', accountId: 'a1', accountCode: '1000', debit: 1250.5 }),
        moneyRow({ id: 'b', accountId: 'a2', accountCode: '4000', credit: 1250.5 }),
      ]);
    useGLStore.getState().generateTrialBalance();
    const fromNumbers = useGLStore.getState().trialBalance;

    expect(fromMoney).toEqual(fromNumbers);
  });
});
