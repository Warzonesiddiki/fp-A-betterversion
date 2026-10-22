/**
 * Ledger money admission (FR-006 · audit P1-11 phase 1).
 *
 * Measured defect (2026-10-21, before this rule): `normalizeGLEntry` stored
 * `debit`/`credit` verbatim while `netChange` — and every aggregate the store
 * derives — was quantised to whole cents. Three consequences, all measured:
 *
 *   1. `debit: 0.004, credit: 0` was stored as 0.004 but netted to 0.00, so the
 *      row carried money its own net could not see.
 *   2. `debit: 0.1 + 0.2` was stored as 0.30000000000000004 while the analysis
 *      view reported 0.30 — a raw read and a printed report disagreed.
 *   3. `validateEntries` reported `{ debit: 0.004, credit: 0 }` as VALID
 *      (`isValid: true`, zero errors), because the double-entry gate compares
 *      rounded cents (0 == 0). A row carrying money passed the balance gate as
 *      balanced.
 *
 * The rule under test: a ledger amount is a finite, non-negative (for
 * `debit`/`credit`) number carrying at most `LEDGER_SCALE` decimal places.
 * Sub-cent precision is REFUSED with a reason — never rounded away, because
 * silently discarding money is exactly what FR-006 forbids.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';
import { setClock, resetClock } from '@/utils/clock';
import { toCents, amountFrom } from '@/utils/money';
import type { GLEntry } from '@/types';

const FIXED_INSTANT = '2026-10-21T09:30:00.000Z';

function entry(overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: 'e-1',
    accountId: '1000',
    accountCode: '1000',
    accountName: 'Cash',
    postDate: '2026-09-30',
    date: '2026-09-30',
    period: '2026-09',
    periodName: '2026-09',
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  } as GLEntry;
}

describe('glStore ledger money admission (FR-006 · P1-11 phase 1)', () => {
  beforeEach(() => {
    setClock(FIXED_INSTANT);
    useAuthStore.setState({
      user: {
        id: 'ledger-scale-user',
        email: 'scale@finplan.local',
        firstName: 'L',
        lastName: 'S',
        avatarUrl: null,
        role: 'Admin',
        departmentId: 'finance',
        departmentName: 'Finance',
        entityId: 'entity-001',
        status: 'Active',
        lastLoginAt: FIXED_INSTANT,
        mfaEnabled: false,
        permissions: [
          'import:create',
          'import:read',
          'import:update',
          'import:delete',
          'ui:update',
        ],
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
      lastImportResult: null,
      importHistory: [],
      lastImportEntryIds: [],
      entrySyncState: {},
      entryVersions: {},
    });
  });
  afterEach(() => resetClock());

  it('refuses a sub-cent debit instead of storing money its own net cannot see', () => {
    useGLStore.getState().setEntries([entry({ debit: 0.004, credit: 0 })]);

    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/sub-cent precision/);
    expect(useGLStore.getState().importError).toMatch(/0\.004/);
  });

  it('refuses a float artefact (0.1 + 0.2) rather than storing 0.30000000000000004', () => {
    useGLStore.getState().addEntry(entry({ debit: 0.1 + 0.2, credit: 0 }));

    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/sub-cent precision/);
  });

  it('refuses a three-decimal credit on addEntries', () => {
    useGLStore.getState().addEntries([entry({ debit: 0, credit: 0.335 })]);

    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/credit has sub-cent precision/);
  });

  it('refuses a sub-cent provided amount on addEntry', () => {
    useGLStore.getState().addEntry(entry({ debit: 1, credit: 0, amount: 1.005 }));

    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/amount has sub-cent precision/);
  });

  it('validateEntries fails the row the double-entry gate could not see', () => {
    // Before: isValid === true, zero errors — 0.004 rounds to 0 cents, so the
    // row looked balanced while carrying a fraction of a cent.
    const result = useGLStore
      .getState()
      .validateEntries([{ accountCode: '1000', date: '2026-09-30', debit: 0.004, credit: 0 }]);

    expect(result.isValid).toBe(false);
    expect(result.validCount).toBe(0);
    expect(result.errors.join(' ')).toMatch(/sub-cent precision/);
  });

  it('validateEntries keeps accepting whole-cent and zero amounts', () => {
    const result = useGLStore.getState().validateEntries([
      { accountCode: '1000', date: '2026-09-30', debit: 0, credit: 0 },
      { accountCode: '1000', date: '2026-09-30', debit: 1234567.89, credit: 1234567.89 },
      { accountCode: '1000', date: '2026-09-30', debit: 0.01, credit: 0.01 },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
    expect(result.validCount).toBe(3);
  });

  it('stores accepted amounts exactly at ledger scale', () => {
    useGLStore.getState().setEntries([entry({ debit: 1284.5, credit: 0.25 })]);

    const stored = useGLStore.getState().entries[0]!;
    expect(amountFrom(stored.debit)).toBe(1284.5);
    expect(amountFrom(stored.credit)).toBe(0.25);
  });

  it('holds the accounting identity in cents on every accepted row', () => {
    // debit − credit in float is 0.19999999999999998; the identity is only
    // meaningful in whole minor units, which is the point of P1-11.
    useGLStore.getState().setEntries([entry({ debit: 0.3, credit: 0.1 })]);

    const stored = useGLStore.getState().entries[0]!;
    expect(toCents(stored.amount)).toBe(toCents(stored.debit) - toCents(stored.credit));
    expect(stored.amount).toBe(stored.netChange);
    expect(toCents(stored.netChange)).toBe(20);
  });

  it('keeps the earlier FR-006 finite-value rejections unchanged', () => {
    useGLStore.getState().setEntries([entry({ debit: Number.NaN, credit: 0 })]);
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/finite/);

    useGLStore.setState({ importError: null });
    useGLStore.getState().addEntries([entry({ debit: 0, credit: Number.POSITIVE_INFINITY })]);
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/finite/);
  });
});
