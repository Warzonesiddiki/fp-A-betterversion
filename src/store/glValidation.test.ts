import { describe, it, expect, beforeEach } from 'vitest';
import { useGLStore } from './glStore';
import { useAuthStore } from './authStore';
import type { GLEntry } from '@/types';

function authenticateImporter() {
  useAuthStore.setState({
    user: {
      id: 'gl-validation-test-user',
      email: 'gl-validation-test@finplan.local',
      firstName: 'GL',
      lastName: 'Validator',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: ['import:create', 'import:read', 'import:update', 'import:delete'],
    },
    isAuthenticated: true,
  });
}

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

/**
 * F-0004 / F-0005: GL double-entry enforcement and row-based validCount.
 *
 * F-0004: the old validator checked field shapes only; an unbalanced journal
 * (debits ≠ credits) passed validation and was stored.
 * F-0005: validCount subtracted the ERROR count from the row count, so one
 * row with 3 errors reduced validCount by 3.
 */

const row = (overrides: Partial<GLEntry>): Partial<GLEntry> => ({
  accountCode: '1000',
  date: '2026-01-15',
  ...overrides,
});

describe('glStore.validateEntries — F-0004 double-entry invariant', () => {
  it('KAV-03: rejects a one-cent imbalanced journal with the exact imbalance', () => {
    const result = useGLStore
      .getState()
      .validateEntries([
        row({ accountCode: '1000', debit: 1000.0, credit: 0 }),
        row({ accountCode: '4000', debit: 0, credit: 999.99 }),
      ]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('imbalance 0.01'))).toBe(true);
    expect(result.errors.some((e) => e.includes('1,000.00') && e.includes('999.99'))).toBe(true);
  });

  it('accepts a balanced pair', () => {
    const result = useGLStore
      .getState()
      .validateEntries([
        row({ accountCode: '1000', debit: 1000, credit: 0 }),
        row({ accountCode: '4000', debit: 0, credit: 1000 }),
      ]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validCount).toBe(2);
  });

  it('groups by journalId: a balanced journal + an unbalanced journal fail only the unbalanced one', () => {
    const result = useGLStore
      .getState()
      .validateEntries([
        row({ journalId: 'J1', accountCode: '1000', debit: 500, credit: 0 }),
        row({ journalId: 'J1', accountCode: '4000', debit: 0, credit: 500 }),
        row({ journalId: 'J2', accountCode: '1000', debit: 300, credit: 0 }),
        row({ journalId: 'J2', accountCode: '4000', debit: 0, credit: 250 }),
      ]);
    expect(result.isValid).toBe(false);
    const j2Error = result.errors.find((e) => e.includes("Journal 'J2'"));
    expect(j2Error).toBeDefined();
    expect(j2Error).toContain('imbalance 50.00');
    // J1 rows remain valid; J2 rows are invalid → 2 of 4 valid.
    expect(result.validCount).toBe(2);
  });

  it('uses integer-cent sums: three 0.33 debits vs 0.99 credit balances', () => {
    const result = useGLStore
      .getState()
      .validateEntries([
        row({ accountCode: '1000', debit: 0.33 }),
        row({ accountCode: '1001', debit: 0.33 }),
        row({ accountCode: '1002', debit: 0.33 }),
        row({ accountCode: '4000', credit: 0.99 }),
      ]);
    // 33+33+33 = 99 cents exactly; naive float sum would drift.
    expect(result.isValid).toBe(true);
  });

  it('amount-style rows balance via importer normalization (positive → debit, negative → credit)', () => {
    const result = useGLStore
      .getState()
      .validateEntries([
        row({ accountCode: '1000', amount: 750 }),
        row({ accountCode: '4000', amount: -750 }),
      ]);
    expect(result.isValid).toBe(true);
  });

  it('unbalanced import cannot be stored via importGLData (authorized user)', () => {
    authenticateImporter();
    const store = useGLStore.getState();
    const before = store.entries.length;
    const outcome = store.importGLData(
      [
        row({ accountCode: '1000', debit: 100, credit: 0 }),
        row({ accountCode: '4000', debit: 0, credit: 99 }),
      ],
      'unbalanced.csv'
    );
    expect(outcome.success).toBe(false);
    expect(useGLStore.getState().entries.length).toBe(before);
    expect(useGLStore.getState().importStatus).toBe('error');
    expect(useGLStore.getState().importError).toContain('imbalance');
  });

  it('negative authorization: importGLData without a user is denied by RBAC', () => {
    expect(() =>
      useGLStore
        .getState()
        .importGLData(
          [
            row({ accountCode: '1000', debit: 100, credit: 0 }),
            row({ accountCode: '4000', debit: 0, credit: 100 }),
          ],
          'denied.csv'
        )
    ).toThrow(/Permission denied/);
  });
});

describe('glStore.validateEntries — F-0005 row-based validCount', () => {
  it('KAV-04: 5 entries with 1 row producing 3 errors → validCount is 4, not 2', () => {
    const result = useGLStore.getState().validateEntries([
      row({ accountCode: '1000', debit: 100 }),
      row({ accountCode: '4000', credit: 100 }),
      row({ debit: Number.NaN }), // 3 errors: no account, no date(NaN debit) → still ONE row
      row({ accountCode: '1002', debit: 50 }),
      row({ accountCode: '4001', credit: 50 }),
    ]);
    // Rows 3 is one invalid row regardless of how many errors it produced.
    expect(result.validCount).toBe(4);
  });

  it('a fully invalid batch reports validCount 0', () => {
    const result = useGLStore.getState().validateEntries([{}, {}]);
    expect(result.isValid).toBe(false);
    expect(result.validCount).toBe(0);
  });

  it('empty input is trivially valid with validCount 0 (zero rows, zero imbalance)', () => {
    const result = useGLStore.getState().validateEntries([]);
    expect(result.isValid).toBe(true);
    expect(result.validCount).toBe(0);
  });
});
