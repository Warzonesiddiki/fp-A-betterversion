/**
 * Phase 2 (F-P2-01): importing a GL file derives the account master.
 *
 * Before this, `glStore.accounts` stayed empty for real imports, so the
 * trial balance showed account type "Unknown" for every row and statement
 * classification could only guess from code prefixes. Import now derives
 * one account per new account code, typed by the canonical Phase 2
 * classifier's prefix convention. Codes no convention classifies get NO
 * account — inventing a type would be fabrication; their trial-balance
 * rows stay "Unknown" and statements report them as unclassified.
 * Existing (owner-maintained) accounts are never overwritten.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';
import { setClock, resetClock } from '@/utils/clock';
import type { GLEntry, GLAccount } from '@/types';

const FIXED_INSTANT = '2026-10-15T09:30:00.000Z';

function row(overrides: Partial<GLEntry>): Partial<GLEntry> {
  return {
    accountCode: '1000',
    accountName: 'Cash',
    postDate: '2026-09-30',
    date: '2026-09-30',
    debit: 0,
    credit: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

/** Balanced journal spanning a classifiable and an unclassifiable code. */
const JOURNAL: Partial<GLEntry>[] = [
  row({ accountCode: '6010', accountName: 'Rent', debit: 300, reference: 'J-1' }),
  row({ accountCode: '9010', accountName: 'Suspense', debit: 100, reference: 'J-1' }),
  row({ accountCode: '1010', accountName: 'Bank', credit: 400, reference: 'J-1' }),
];

describe('glStore import — account master derivation (Phase 2)', () => {
  beforeEach(() => {
    setClock(FIXED_INSTANT);
    useAuthStore.setState({
      user: {
        id: 'acct-test-user',
        email: 'acct@finplan.local',
        firstName: 'A',
        lastName: 'T',
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

  afterEach(() => {
    resetClock();
  });

  it('derives typed accounts for classifiable codes; unclassifiable codes get none', () => {
    const result = useGLStore.getState().importGLData(JOURNAL, 'gl.csv', {
      fileHash: 'b'.repeat(64),
    });
    expect(result.success).toBe(true);

    const accounts = useGLStore.getState().accounts;
    const byCode = new Map(accounts.map((a) => [a.code, a]));
    expect(byCode.get('6010')?.type).toBe('OpEx');
    expect(byCode.get('6010')?.name).toBe('Rent');
    expect(byCode.get('1010')?.type).toBe('Asset');
    expect(byCode.has('9010')).toBe(false);
  });

  it('trial balance rows carry the derived types; unclassifiable stays Unknown', () => {
    useGLStore.getState().importGLData(JOURNAL, 'gl.csv', { fileHash: 'b'.repeat(64) });
    useGLStore.getState().generateTrialBalance();
    const tb = useGLStore.getState().trialBalance;
    expect(tb.find((r) => r.accountCode === '6010')?.accountType).toBe('OpEx');
    expect(tb.find((r) => r.accountCode === '9010')?.accountType).toBe('Unknown');
  });

  it('never overwrites an existing owner-maintained account', () => {
    const owner: GLAccount = {
      id: '6010',
      code: '6010',
      name: 'Owner-named rent',
      type: 'Asset',
      category: 'Owner',
      subCategory: '',
      parentId: null,
      level: 0,
      sortOrder: 0,
      isActive: true,
      entityId: 'entity-001',
      departmentId: null,
      isCalculated: false,
      formula: null,
      children: [],
    };
    useGLStore.setState({ accounts: [owner] });
    useGLStore.getState().importGLData(JOURNAL, 'gl.csv', { fileHash: 'b'.repeat(64) });
    const accounts = useGLStore.getState().accounts;
    expect(accounts.filter((a) => a.code === '6010')).toHaveLength(1);
    expect(accounts.find((a) => a.code === '6010')?.name).toBe('Owner-named rent');
    expect(accounts.find((a) => a.code === '6010')?.type).toBe('Asset');
  });

  it('a second import of new codes extends the master without duplicating', () => {
    useGLStore.getState().importGLData(JOURNAL, 'gl.csv', { fileHash: 'b'.repeat(64) });
    useGLStore
      .getState()
      .importGLData(
        [
          row({ accountCode: '6010', accountName: 'Rent', debit: 50, reference: 'J-2' }),
          row({ accountCode: '4010', accountName: 'Sales', credit: 50, reference: 'J-2' }),
        ],
        'gl2.csv',
        { fileHash: 'c'.repeat(64) }
      );
    const codes = useGLStore.getState().accounts.map((a) => a.code);
    expect(codes.filter((c) => c === '6010')).toHaveLength(1);
    expect(useGLStore.getState().accounts.find((a) => a.code === '4010')?.type).toBe('Revenue');
  });
});
