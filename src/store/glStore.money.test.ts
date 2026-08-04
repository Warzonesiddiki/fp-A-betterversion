/**
 * GAP-1 (F-0006) known-answer tests for glStore's money migration.
 *
 * `generateTrialBalance` (per-account debit/credit/netChange/endingBalance
 * aggregation) and `analyzeAccount` (monthly totals, totals, average
 * balance) operate on GLEntry debit/credit amounts (currency) — previously
 * raw `+=`, `-`, `/` over IEEE-754 doubles. Record counts stay non-money.
 * Each fixed input asserts the exact cent result with `toBe`; the
 * pre-migration IEEE-754 output is recorded inline.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';
import type { GLEntry } from '@/types';

function createEntry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: 'entry-id',
    accountId: 'acct-1',
    accountCode: '1010',
    accountName: 'Cash',
    period: '2024-01',
    periodName: 'Jan 2024',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2024-01-01',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

describe('glStore — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'gl-money-test-user',
        email: 'gl-money-test-user@finplan.local',
        firstName: 'GL',
        lastName: 'Tester',
        avatarUrl: null,
        role: 'Admin',
        departmentId: 'finance',
        entityId: 'entity-001',
        status: 'Active',
        lastLoginAt: new Date().toISOString(),
        mfaEnabled: false,
        permissions: [
          'import:read',
          'import:create',
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
      dateFilter: null,
      accountFilter: [],
      isLoading: false,
      importProgress: 0,
      importStatus: 'idle',
      importError: null,
      lastImportResult: null,
      importHistory: [],
      lastImportEntryIds: [],
    });
  });

  it('aggregates trial-balance debits exactly (old float: 0.30000000000000004)', () => {
    useGLStore.setState({
      entries: [
        createEntry({ id: 'e1', debit: 0.1, credit: 0 }),
        createEntry({ id: 'e2', debit: 0.2, credit: 0 }),
      ],
    });
    useGLStore.getState().generateTrialBalance();

    const row = useGLStore.getState().trialBalance[0];
    expect(row?.debit).toBe(0.3);
    expect(row?.credit).toBe(0);
    expect(row?.netChange).toBe(0.3);
    expect(row?.endingBalance).toBe(0.3);
  });

  it('subtracts credits in the trial balance exactly (old float: 0.09999999999999998)', () => {
    useGLStore.setState({
      entries: [
        createEntry({ id: 'e1', debit: 0.3, credit: 0 }),
        createEntry({ id: 'e2', debit: 0, credit: 0.2 }),
      ],
    });
    useGLStore.getState().generateTrialBalance();

    const row = useGLStore.getState().trialBalance[0];
    expect(row?.debit).toBe(0.3);
    expect(row?.credit).toBe(0.2);
    expect(row?.netChange).toBe(0.1);
    expect(row?.endingBalance).toBe(0.1);
  });

  it('sums monthly analysis totals exactly (old float: 0.6000000000000001 / 0.5000000000000001 / 0.25000000000000006)', () => {
    useGLStore.setState({
      entries: [
        createEntry({ id: 'e1', period: '2024-01', debit: 0.1, credit: 0 }),
        createEntry({ id: 'e2', period: '2024-01', debit: 0.2, credit: 0 }),
        createEntry({ id: 'e3', period: '2024-02', debit: 0.3, credit: 0.1 }),
      ],
    });
    useGLStore.getState().analyzeAccount('acct-1');

    const analysis = useGLStore.getState().accountAnalysis;
    expect(analysis?.monthlyTotals[0]?.debit).toBe(0.3);
    expect(analysis?.monthlyTotals[0]?.net).toBe(0.3);
    expect(analysis?.monthlyTotals[1]?.net).toBe(0.2);
    expect(analysis?.totalDebit).toBe(0.6);
    expect(analysis?.totalCredit).toBe(0.1);
    expect(analysis?.averageBalance).toBe(0.25);
  });

  it('rounds imported half-cent debits with declared half-up (old float: 1.005)', () => {
    useGLStore.setState({
      entries: [createEntry({ id: 'e1', debit: 1.005, credit: 0 })],
    });
    useGLStore.getState().analyzeAccount('acct-1');

    const analysis = useGLStore.getState().accountAnalysis;
    expect(analysis?.monthlyTotals[0]?.debit).toBe(1.01);
    expect(analysis?.totalDebit).toBe(1.01);
  });

  it('returns exact zero aggregates for a non-matching account', () => {
    useGLStore.setState({ entries: [createEntry({ accountId: 'other' })] });
    useGLStore.getState().analyzeAccount('acct-1');

    const analysis = useGLStore.getState().accountAnalysis;
    expect(analysis?.totalDebit).toBe(0);
    expect(analysis?.totalCredit).toBe(0);
    expect(analysis?.averageBalance).toBe(0);
    expect(analysis?.monthlyTotals).toEqual([]);
    expect(analysis?.transactionCount).toBe(0);
  });

  it('normalizes netChange with exact decimal subtraction (old float: 0.19999999999999998)', () => {
    useGLStore.getState().setEntries([
      createEntry({
        id: 'e1',
        accountId: 'acct-1',
        debit: 0.3,
        credit: 0.1,
        amount: undefined as unknown as number,
      }),
    ]);

    const entry = useGLStore.getState().entries[0];
    expect(entry?.netChange).toBe(0.2);
    expect(entry?.amount).toBe(0.2);
  });

  it('detects duplicates via the exact debit-minus-credit fallback key (old float: 0 duplicates)', () => {
    // A stored entry with amount 0.2 and a re-imported entry with no amount
    // (debit 0.3 − credit 0.1) are the same journal entry. The old float
    // fallback key was '…|0.19999999999999998' ≠ '…|0.2', so the duplicate
    // went UNDETECTED. Exact decimal: both keys are '…|0.2'.
    useGLStore.setState({
      entries: [
        createEntry({ id: 'e1', accountId: 'acct-1', amount: 0.2, debit: 0.3, credit: 0.1 }),
      ],
    });

    const result = useGLStore.getState().checkDuplicates([
      createEntry({
        id: 'e2',
        accountId: 'acct-1',
        amount: undefined as unknown as number,
        debit: 0.3,
        credit: 0.1,
      }),
    ]);

    expect(result.duplicates).toBe(1);
    expect(result.newEntries).toHaveLength(0);
  });
});
