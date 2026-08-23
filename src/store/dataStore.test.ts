import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from './dataStore';
import { useAuthStore } from './authStore';
import { PermissionError } from '@/utils/rbacEnforcer';
import type { GLAccount, ImportJob, ImportStatus } from '@/types';
import type { AccountType } from '@/types';

describe('dataStore', () => {
  beforeEach(() => {
    // W6-P0-14: mutating actions are permission-guarded; happy paths run as an
    // Admin-scope user holding exactly the store's enforced permissions.
    authenticateDataUser(['import:create', 'import:update', 'import:delete']);
    useDataStore.setState({
      accounts: [],
      importJobs: [],
      selectedAccountId: null,
      lastImportDate: null,
    });
  });

  const createAccount = (
    id: string,
    code: string,
    name: string,
    overrides: Partial<GLAccount> = {}
  ): GLAccount => ({
    id,
    code,
    name,
    type: 'Asset' as AccountType,
    category: 'Current Assets',
    subCategory: name,
    parentId: null,
    level: 1,
    sortOrder: 1,
    isActive: true,
    entityId: 'ent-1',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
    ...overrides,
  });

  // --- Initial State ---

  it('should have correct initial state', () => {
    const s = useDataStore.getState();
    expect(s.accounts).toEqual([]);
    expect(s.importJobs).toEqual([]);
    expect(s.selectedAccountId).toBeNull();
    expect(s.lastImportDate).toBeNull();
  });

  // --- setAccounts ---

  it('should set accounts', () => {
    const accounts = [createAccount('a1', '1010', 'Cash')];
    useDataStore.getState().setAccounts(accounts);
    expect(useDataStore.getState().accounts).toEqual(accounts);
  });

  it('should replace existing accounts', () => {
    useDataStore.getState().setAccounts([createAccount('a1', '1010', 'Cash')]);
    useDataStore.getState().setAccounts([createAccount('a2', '2000', 'AP')]);
    expect(useDataStore.getState().accounts).toHaveLength(1);
    expect(useDataStore!.getState().accounts[0]!.code).toBe('2000');
  });

  // --- addAccount ---

  it('should add account with generated id and empty children', () => {
    const input = {
      code: '3000',
      name: 'Equity',
      type: 'Equity' as AccountType,
      category: 'Equity',
      subCategory: 'Common Stock',
      parentId: null,
      level: 1,
      sortOrder: 3,
      isActive: true,
      entityId: 'ent-1',
      departmentId: null,
      isCalculated: false,
      formula: null,
    };
    useDataStore.getState().addAccount(input);
    const state = useDataStore.getState();
    expect(state.accounts).toHaveLength(1);
    expect(state!.accounts[0]!.id).toMatch(/^acct-/);
    expect(state!.accounts[0]!.code).toBe('3000');
    expect(state!.accounts[0]!.children).toEqual([]);
  });

  it('should add multiple accounts', () => {
    useDataStore.getState().addAccount({
      code: '1010',
      name: 'Cash',
      type: 'Asset',
      category: 'Current Assets',
      subCategory: 'Cash',
      parentId: null,
      level: 1,
      sortOrder: 1,
      isActive: true,
      entityId: 'ent-1',
      departmentId: null,
      isCalculated: false,
      formula: null,
    });
    useDataStore.getState().addAccount({
      code: '2000',
      name: 'AP',
      type: 'Liability',
      category: 'Current Liabilities',
      subCategory: 'AP',
      parentId: null,
      level: 1,
      sortOrder: 5,
      isActive: true,
      entityId: 'ent-1',
      departmentId: null,
      isCalculated: false,
      formula: null,
    });
    expect(useDataStore.getState().accounts).toHaveLength(2);
  });

  // --- updateAccount ---

  it('should update existing account by id', () => {
    useDataStore.setState({ accounts: [createAccount('a1', '1010', 'Cash')] });
    useDataStore.getState().updateAccount('a1', { name: 'Cash & Equivalents', isActive: false });
    const state = useDataStore.getState();
    expect(state!.accounts[0]!.name).toBe('Cash & Equivalents');
    expect(state!.accounts[0]!.isActive).toBe(false);
  });

  it('should not throw when updating non-existent account', () => {
    useDataStore.setState({ accounts: [createAccount('a1', '1010', 'Cash')] });
    expect(() =>
      useDataStore.getState().updateAccount('non-existent', { name: 'Ghost' })
    ).not.toThrow();
    expect(useDataStore!.getState().accounts[0]!.name).toBe('Cash');
  });

  it('should update nested child account', () => {
    const child = { ...createAccount('a2', '1011', 'Petty Cash'), parentId: 'a1' };
    const parent = { ...createAccount('a1', '1010', 'Cash'), children: [child] };
    useDataStore.setState({ accounts: [parent] });
    useDataStore.getState().updateAccount('a2', { name: 'Petty Cash Fund' });
    expect(useDataStore!.getState().accounts[0]!.children[0]!.name).toBe('Petty Cash Fund');
  });

  // --- deleteAccount ---

  it('should delete account by id', () => {
    useDataStore.setState({
      accounts: [
        createAccount('a1', '1010', 'Cash'),
        createAccount('a2', '2000', 'AP', { type: 'Liability' as AccountType }),
      ],
    });
    useDataStore.getState().deleteAccount('a1');
    expect(useDataStore.getState().accounts).toHaveLength(1);
    expect(useDataStore!.getState().accounts[0]!.id).toBe('a2');
  });

  it('should clear selectedAccountId when deleting selected account', () => {
    useDataStore.setState({
      accounts: [createAccount('a1', '1010', 'Cash')],
      selectedAccountId: 'a1',
    });
    useDataStore.getState().deleteAccount('a1');
    const state = useDataStore.getState();
    expect(state.accounts).toEqual([]);
    expect(state.selectedAccountId).toBeNull();
  });

  it('should preserve selectedAccountId when deleting non-selected account', () => {
    useDataStore.setState({
      accounts: [
        createAccount('a1', '1010', 'Cash'),
        createAccount('a2', '2000', 'AP', { type: 'Liability' as AccountType }),
      ],
      selectedAccountId: 'a1',
    });
    useDataStore.getState().deleteAccount('a2');
    expect(useDataStore.getState().selectedAccountId).toBe('a1');
  });

  it('should remove nested child account', () => {
    const child = { ...createAccount('a2', '1011', 'Petty Cash'), parentId: 'a1' };
    const parent = { ...createAccount('a1', '1010', 'Cash'), children: [child] };
    useDataStore.setState({ accounts: [parent] });
    useDataStore.getState().deleteAccount('a2');
    expect(useDataStore!.getState().accounts[0]!.children).toHaveLength(0);
  });

  it('should not throw when deleting non-existent account', () => {
    useDataStore.setState({ accounts: [createAccount('a1', '1010', 'Cash')] });
    expect(() => useDataStore.getState().deleteAccount('non-existent')).not.toThrow();
    expect(useDataStore.getState().accounts).toHaveLength(1);
  });

  // --- toggleAccountActive ---

  it('should toggle isActive from true to false', () => {
    useDataStore.setState({ accounts: [createAccount('a1', '1010', 'Cash', { isActive: true })] });
    useDataStore.getState().toggleAccountActive('a1');
    expect(useDataStore!.getState().accounts[0]!.isActive).toBe(false);
  });

  it('should toggle isActive from false to true', () => {
    useDataStore.setState({ accounts: [createAccount('a1', '1010', 'Cash', { isActive: false })] });
    useDataStore.getState().toggleAccountActive('a1');
    expect(useDataStore!.getState().accounts[0]!.isActive).toBe(true);
  });

  it('should toggle nested child account', () => {
    const child = {
      ...createAccount('a2', '1011', 'Petty Cash', { isActive: false }),
      parentId: 'a1',
    };
    const parent = { ...createAccount('a1', '1010', 'Cash'), children: [child] };
    useDataStore.setState({ accounts: [parent] });
    useDataStore.getState().toggleAccountActive('a2');
    expect(useDataStore!.getState().accounts[0]!.children[0]!.isActive).toBe(true);
  });

  it('should not throw when toggling non-existent account', () => {
    expect(() => useDataStore.getState().toggleAccountActive('non-existent')).not.toThrow();
  });

  // --- addImportJob ---

  it('should add import job with generated id and pending status', () => {
    const jobInput = {
      filename: 'accounts.csv',
      fileType: 'csv',
      rowCount: 100,
      successCount: 0,
      errorCount: 0,
      completedAt: null,
      startedBy: 'usr-001',
      startedByName: 'John',
    };
    const id = useDataStore.getState().addImportJob(jobInput);
    expect(id).toMatch(/^import-/);
    const state = useDataStore.getState();
    expect(state.importJobs).toHaveLength(1);
    expect(state!.importJobs[0]!.id).toBe(id);
    expect(state!.importJobs[0]!.status).toBe('Pending');
    expect(state!.importJobs[0]!.filename).toBe('accounts.csv');
    expect(state!.importJobs[0]!.startedAt).toBeDefined();
  });

  it('should prepend new import jobs', () => {
    useDataStore.getState().addImportJob({
      filename: 'first.csv',
      fileType: 'csv',
      rowCount: 10,
      successCount: 10,
      errorCount: 0,
      completedAt: null,
      startedBy: 'usr-001',
      startedByName: 'John',
    });
    useDataStore.getState().addImportJob({
      filename: 'second.csv',
      fileType: 'csv',
      rowCount: 20,
      successCount: 20,
      errorCount: 0,
      completedAt: null,
      startedBy: 'usr-001',
      startedByName: 'John',
    });
    expect(useDataStore.getState().importJobs).toHaveLength(2);
    expect(useDataStore!.getState().importJobs[0]!.filename).toBe('second.csv');
  });

  // --- updateImportStatus ---

  it('should update import job status to Completed and set timestamp', () => {
    useDataStore.setState({
      importJobs: [
        {
          id: 'import-1',
          filename: 'test.csv',
          fileType: 'csv',
          status: 'Processing' as ImportStatus,
          rowCount: 100,
          successCount: 0,
          errorCount: 0,
          startedAt: '2024-01-01T00:00:00.000Z',
          completedAt: null,
          startedBy: 'usr-001',
          startedByName: 'John',
        },
      ] as ImportJob[],
    });
    useDataStore.getState().updateImportStatus('import-1', 'Completed');
    const state = useDataStore.getState();
    expect(state!.importJobs[0]!.status).toBe('Completed');
    expect(state!.importJobs[0]!.completedAt).toBeDefined();
    expect(state.lastImportDate).toBeDefined();
  });

  it('should update import job status to Failed with error', () => {
    useDataStore.setState({
      importJobs: [
        {
          id: 'import-1',
          filename: 'test.csv',
          fileType: 'csv',
          status: 'Processing' as ImportStatus,
          rowCount: 100,
          successCount: 0,
          errorCount: 0,
          startedAt: '2024-01-01T00:00:00.000Z',
          completedAt: null,
          startedBy: 'usr-001',
          startedByName: 'John',
        },
      ] as ImportJob[],
    });
    useDataStore.getState().updateImportStatus('import-1', 'Failed', 'Invalid file format');
    const state = useDataStore.getState();
    expect(state!.importJobs[0]!.status).toBe('Failed');
    expect(state!.importJobs[0]!.error).toBe('Invalid file format');
    expect(state.lastImportDate).toBeNull();
  });

  it('should not fail when updating non-existent job', () => {
    expect(() =>
      useDataStore.getState().updateImportStatus('non-existent', 'Completed')
    ).not.toThrow();
  });

  // --- setSelectedAccount ---

  it('should set selected account id', () => {
    useDataStore.getState().setSelectedAccount('acct-1');
    expect(useDataStore.getState().selectedAccountId).toBe('acct-1');
  });

  it('should clear selected account id with null', () => {
    useDataStore.setState({ selectedAccountId: 'acct-1' });
    useDataStore.getState().setSelectedAccount(null);
    expect(useDataStore.getState().selectedAccountId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// W6-P0-14 — RBAC enforcement on GL account mutations.
// The existing happy-path tests above run as an authenticated Admin-scope
// user (fixture below); this block proves the negative half: without the
// matching permission, every mutating action throws PermissionError and
// leaves state untouched.
// ---------------------------------------------------------------------------

function authenticateDataUser(permissions: readonly string[]): void {
  useAuthStore.setState({
    user: {
      id: 'data-test-user',
      email: 'data-test@finplan.local',
      firstName: 'Data',
      lastName: 'Tester',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: [...permissions],
    },
    isAuthenticated: true,
  });
}

describe('dataStore RBAC (W6-P0-14)', () => {
  const account = (id: string, overrides: Partial<GLAccount> = {}): GLAccount => ({
    id,
    code: '1010',
    name: 'Cash',
    type: 'Asset' as AccountType,
    category: 'Current Assets',
    subCategory: 'Cash',
    parentId: null,
    level: 1,
    sortOrder: 1,
    isActive: true,
    entityId: 'ent-1',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
    ...overrides,
  });

  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    useDataStore.setState({
      accounts: [account('a1')],
      importJobs: [],
      selectedAccountId: null,
      lastImportDate: null,
    });
  });

  it('deleting a GL account without permission throws PermissionError (no user)', () => {
    expect(() => useDataStore.getState().deleteAccount('a1')).toThrow(PermissionError);
    // State untouched by the denied call:
    expect(useDataStore.getState().accounts).toHaveLength(1);
  });

  it('Viewer role cannot toggle accounts (import:update not held)', () => {
    authenticateDataUser(['gl:read', 'import:read']);
    expect(() => useDataStore.getState().toggleAccountActive('a1')).toThrow(PermissionError);
    expect(useDataStore.getState().accounts[0]!.isActive).toBe(true);
  });

  it('addAccount/updateAccount/setAccounts require import permissions', () => {
    authenticateDataUser(['budget:create']);
    expect(() =>
      useDataStore.getState().addAccount({
        code: '3000',
        name: 'Equity',
        type: 'Equity',
        category: 'Equity',
        subCategory: 'Common Stock',
        parentId: null,
        level: 1,
        sortOrder: 3,
        isActive: true,
        entityId: 'ent-1',
        departmentId: null,
        isCalculated: false,
        formula: null,
      })
    ).toThrow(PermissionError);
    expect(() => useDataStore.getState().updateAccount('a1', { name: 'X' })).toThrow(
      PermissionError
    );
    expect(() => useDataStore.getState().setAccounts([])).toThrow(PermissionError);
    expect(() => useDataStore.getState().addImportJob({} as ImportJob)).toThrow(PermissionError);
  });

  it('granted import permissions allow the full mutation set', () => {
    authenticateDataUser(['import:create', 'import:update', 'import:delete']);
    const s = useDataStore.getState();
    s.addImportJob({
      filename: 't.csv',
      fileType: 'csv',
      rowCount: 1,
      successCount: 0,
      errorCount: 0,
      completedAt: null,
      startedBy: 'u',
      startedByName: 'U',
    });
    expect(() => s.setAccounts([account('a2')])).not.toThrow();
    expect(() => s.addAccount(account('a3'))).not.toThrow();
    expect(() => s.updateAccount('a2', { name: 'Renamed' })).not.toThrow();
    expect(() => s.toggleAccountActive('a2')).not.toThrow();
    expect(() => s.deleteAccount('a2')).not.toThrow();
    // addAccount assigns its own acct-* id:
    const ids = useDataStore.getState().accounts.map((a) => a.id);
    expect(ids).toHaveLength(1);
    expect(ids[0]).toMatch(/^acct-/);
  });

  it('selection stays unguarded (read-only/selective action)', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    expect(() => useDataStore.getState().setSelectedAccount('a1')).not.toThrow();
    expect(useDataStore.getState().selectedAccountId).toBe('a1');
  });
});
