import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';

describe('Phase 1 GL Smoke', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'test-import-user',
        email: 'test-import-user@finplan.local',
        firstName: 'Test',
        lastName: 'Importer',
        avatarUrl: null,
        role: 'Admin',
        departmentId: 'finance',
        departmentName: 'Finance',
        entityId: 'entity-001',
        status: 'Active',
        lastLoginAt: new Date().toISOString(),
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
      importStatus: 'idle',
      importProgress: 0,
      lastImportEntryIds: [],
    });
  });

  it('validateEntries works', () => {
    const store = useGLStore.getState();
    const res = store.validateEntries([{ accountCode: '4000', date: '2026-01-01', debit: 100 }]);
    expect(res.isValid).toBe(true);
  });

  it('importGLData imports cleanly and normalizes financial fields', () => {
    const store = useGLStore.getState();
    const result = store.importGLData(
      [{ accountCode: '4100', date: '2026-01-15', debit: 500, credit: 0 }],
      'test.csv'
    );

    const imported = useGLStore.getState().entries[0];
    expect(result.success).toBe(true);
    expect(imported).toMatchObject({
      accountId: '4100',
      accountCode: '4100',
      accountName: '4100',
      period: '2026-01',
      debit: 500,
      credit: 0,
      netChange: 500,
      amount: 500,
    });
  });

  it('trial balance derives net change from debits and credits, not stale source netChange', () => {
    const store = useGLStore.getState();
    store.importGLData(
      [
        {
          accountCode: '1000',
          date: '2026-01-15',
          debit: 250,
          credit: 0,
          netChange: 999999,
        },
        {
          accountCode: '2000',
          date: '2026-01-15',
          debit: 0,
          credit: 250,
          netChange: 999999,
        },
      ],
      'balanced.csv'
    );

    store.generateTrialBalance();

    const rows = useGLStore.getState().trialBalance;
    expect(rows.find((row) => row.accountCode === '1000')?.netChange).toBe(250);
    expect(rows.find((row) => row.accountCode === '2000')?.netChange).toBe(-250);
    expect(rows.reduce((sum, row) => sum + row.debit, 0)).toBe(250);
    expect(rows.reduce((sum, row) => sum + row.credit, 0)).toBe(250);
  });
});
