/**
 * FR-006 / NFR-002: invalid money is never presented as zero.
 *
 * `normalizeGLEntry` derives `debit`/`credit` through `toFiniteNumber(value, 0)`,
 * which maps any non-finite amount (NaN, Infinity, a non-number) to 0. That is
 * correct for genuinely absent optional fields, but not for a provided-but-invalid
 * amount: silently turning it into 0 discards money without a rejection reason.
 *
 * The import path is guarded — `importGLData` runs `validateEntries`, which fails
 * a row whose provided amount is not finite. The mutation paths were not:
 * `setEntries`, `addEntries` and `addEntry` normalised directly. These tests pin
 * the rejection for every unguarded path.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';
import { setClock, resetClock } from '@/utils/clock';
import type { GLEntry } from '@/types';

const FIXED_INSTANT = '2026-10-15T09:30:00.000Z';

function entry(overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: 'e-1',
    accountId: '1000',
    accountCode: '1000',
    accountName: 'Cash',
    postDate: '2026-09-30',
    date: '2026-09-30',
    period: '2026-09',
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  } as GLEntry;
}

describe('glStore amount integrity (FR-006)', () => {
  beforeEach(() => {
    setClock(FIXED_INSTANT);
    useAuthStore.setState({
      user: {
        id: 'amount-integrity-user',
        email: 'integrity@finplan.local',
        firstName: 'A',
        lastName: 'I',
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

  it('rejects setEntries when a provided debit is NaN instead of storing 0', () => {
    useGLStore.getState().setEntries([entry({ debit: Number.NaN, credit: 0 })]);
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/finite|invalid/i);
  });

  it('rejects setEntries when a provided credit is Infinity', () => {
    useGLStore.getState().setEntries([entry({ debit: 0, credit: Number.POSITIVE_INFINITY })]);
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/finite|invalid/i);
  });

  it('rejects addEntries when a provided debit is NaN', () => {
    useGLStore.getState().addEntries([entry({ debit: Number.NaN })]);
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/finite|invalid/i);
  });

  it('rejects addEntry when a provided amount is NaN', () => {
    useGLStore
      .getState()
      .addEntry(entry({ amount: Number.NaN, debit: undefined, credit: undefined }));
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importError).toMatch(/finite|invalid/i);
  });

  it('still accepts valid zero and positive amounts', () => {
    useGLStore.getState().setEntries([entry({ debit: 100, credit: 0 })]);
    const stored = useGLStore.getState().entries;
    expect(stored).toHaveLength(1);
    expect(stored[0]!.debit).toBe(100);
  });
});
