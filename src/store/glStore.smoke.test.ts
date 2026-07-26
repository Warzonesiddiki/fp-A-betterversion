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

  it('importGLData imports cleanly', () => {
    const store = useGLStore.getState();
    const result = store.importGLData(
      [{ accountCode: '4100', date: '2026-01-15', debit: 500, credit: 0 }],
      'test.csv'
    );

    expect(result.success).toBe(true);
    expect(useGLStore.getState().entries.length).toBeGreaterThan(0);
  });
});
