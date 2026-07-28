import { describe, it, expect, beforeEach } from 'vitest';
import { useGLStore } from './glStore';
import { useCubeStore, getEngine, resetEngine } from './cubeStore';
import { useAuthStore } from './authStore';
import type { GLEntry } from '@/types';

// F-0026: authenticate an explicit user with exactly the permissions the
// guarded actions require, instead of running as '(no user)'.
function authenticateCubeUser() {
  useAuthStore.setState({
    user: {
      id: 'cube-test-user',
      email: 'cube-test@finplan.local',
      firstName: 'Cube',
      lastName: 'Tester',
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
        'import:update',
        'import:delete',
        'ui:update',
        'cube:write',
        'cube:read',
      ],
    },
    isAuthenticated: true,
  });
}

function makeEntry(overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 9)}`,
    accountId: 'acc-1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'January 2026',
    debit: 500,
    credit: 0,
    netChange: 500,
    amount: 500,
    date: '2026-01-15',
    postDate: '2026-01-15',
    description: 'Test entry',
    reference: 'REF-001',
    entityId: 'ent1',
    ...overrides,
  };
}

describe('glStore ↔ CubeEngine integration', () => {
  beforeEach(() => {
    resetEngine();
    authenticateCubeUser();
    useCubeStore.setState({
      engine: getEngine(),
      isInitialized: false,
      cellCount: 0,
      historyCount: 0,
      snapshots: [],
    });
    useGLStore.setState({
      entries: [],
      accounts: [],
      trialBalance: [],
      accountAnalysis: null,
      lastImportEntryIds: [],
    });
  });

  describe('addEntry → cube sync', () => {
    it('should write entries to CubeEngine when synced', () => {
      useCubeStore.getState().initialize();
      const entry = makeEntry();
      useGLStore.getState().addEntry(entry);
      useGLStore.getState().syncToCube();

      const cubeStore = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      const debitCell = cubeStore.readCell('GL_Actuals', coords, 'debit');
      expect(debitCell).toBeDefined();
      expect(debitCell!.value).toBe(500);
    });

    it('should write multiple entries as array', () => {
      useCubeStore.getState().initialize();
      const entries = [
        makeEntry({ id: 'e1', accountCode: '1000', debit: 100, credit: 0, netChange: 100 }),
        makeEntry({ id: 'e2', accountCode: '2000', debit: 0, credit: 200, netChange: -200 }),
      ];
      useGLStore.getState().addEntry(entries);
      useGLStore.getState().syncToCube();

      expect(useGLStore.getState().entries).toHaveLength(2);
      expect(useCubeStore.getState().cellCount).toBeGreaterThan(0);
    });

    it('should not throw when CubeEngine is not initialized', () => {
      expect(() => {
        useGLStore.getState().addEntry(makeEntry());
      }).not.toThrow();
    });

    it('should preserve glStore entries array', () => {
      useCubeStore.getState().initialize();
      useGLStore.getState().addEntry(makeEntry({ id: 'e1' }));
      useGLStore.getState().addEntry(makeEntry({ id: 'e2' }));
      expect(useGLStore.getState().entries).toHaveLength(2);
    });
  });

  describe('setAccounts → cube dimension sync', () => {
    it('should register accounts as cube dimension members', () => {
      useCubeStore.getState().initialize();
      useGLStore.getState().setAccounts([
        {
          id: 'acc-1',
          code: '1000',
          name: 'Cash',
          type: 'Asset',
          category: 'Assets',
          subCategory: 'Current',
          parentId: null,
          level: 0,
          sortOrder: 0,
          isActive: true,
          entityId: 'ent1',
          departmentId: null,
          isCalculated: false,
          formula: null,
          children: [],
        },
      ]);
      useGLStore.getState().syncToCube();

      const members = useCubeStore.getState().getMembers('Account');
      expect(members.some((m) => m.code === '1000')).toBe(true);
    });

    it('should not throw when CubeEngine is not initialized', () => {
      expect(() => {
        useGLStore.getState().setAccounts([]);
      }).not.toThrow();
    });
  });

  describe('generateTrialBalance', () => {
    it('should compute trial balance from entries', () => {
      useGLStore.getState().setAccounts([
        {
          id: 'acc-1',
          code: '1000',
          name: 'Cash',
          type: 'Asset',
          category: 'Assets',
          subCategory: 'Current',
          parentId: null,
          level: 0,
          sortOrder: 0,
          isActive: true,
          entityId: 'ent1',
          departmentId: null,
          isCalculated: false,
          formula: null,
          children: [],
        },
      ]);
      useGLStore.getState().addEntry(makeEntry({ debit: 500, credit: 0, netChange: 500 }));
      useGLStore.getState().addEntry(makeEntry({ debit: 0, credit: 200, netChange: -200 }));

      useGLStore.getState().generateTrialBalance();
      const tb = useGLStore.getState().trialBalance;
      expect(tb).toHaveLength(1);
      expect(tb![0]!.debit).toBe(500);
      expect(tb![0]!.credit).toBe(200);
      expect(tb![0]!.netChange).toBe(300);
    });
  });

  describe('analyzeAccount', () => {
    it('should compute monthly totals for an account', () => {
      useGLStore
        .getState()
        .addEntry(makeEntry({ accountId: 'acc-1', period: '2026-01', debit: 100, credit: 0 }));
      useGLStore
        .getState()
        .addEntry(makeEntry({ accountId: 'acc-1', period: '2026-02', debit: 200, credit: 0 }));
      useGLStore
        .getState()
        .addEntry(makeEntry({ accountId: 'acc-2', period: '2026-01', debit: 999, credit: 0 }));

      useGLStore.getState().analyzeAccount('acc-1');
      const analysis = useGLStore.getState().accountAnalysis;
      expect(analysis).toBeDefined();
      expect(analysis!.accountId).toBe('acc-1');
      expect(analysis!.monthlyTotals).toHaveLength(2);
      expect(analysis!.totalDebit).toBe(300);
    });
  });

  describe('syncToCube', () => {
    it('should sync all entries to CubeEngine', () => {
      useCubeStore.getState().initialize();
      useGLStore.getState().setAccounts([
        {
          id: 'acc-1',
          code: '1000',
          name: 'Cash',
          type: 'Asset',
          category: 'Assets',
          subCategory: 'Current',
          parentId: null,
          level: 0,
          sortOrder: 0,
          isActive: true,
          entityId: 'ent1',
          departmentId: null,
          isCalculated: false,
          formula: null,
          children: [],
        },
      ]);
      useGLStore.getState().addEntry(makeEntry({ id: 'e1' }));
      useGLStore
        .getState()
        .addEntry(makeEntry({ id: 'e2', debit: 300, credit: 0, netChange: 300 }));

      // Clear cube and re-sync
      useCubeStore.getState().clearAll();
      useCubeStore.getState().initialize();
      useGLStore.getState().syncToCube();

      expect(useCubeStore.getState().cellCount).toBeGreaterThan(0);
    });

    it('should not throw when CubeEngine is not initialized', () => {
      expect(() => {
        useGLStore.getState().syncToCube();
      }).not.toThrow();
    });
  });

  describe('syncFromCube', () => {
    it('should update trialBalance from cube query', () => {
      useCubeStore.getState().initialize();
      // Write directly to cube
      useCubeStore.getState().writeCell(
        'GL_Actuals',
        {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        777,
        'input'
      );

      useGLStore.getState().syncFromCube();
      const tb = useGLStore.getState().trialBalance;
      expect(tb.length).toBeGreaterThan(0);
    });

    it('should not throw when CubeEngine is not initialized', () => {
      expect(() => {
        useGLStore.getState().syncFromCube();
      }).not.toThrow();
    });
  });

  describe('getCubeState', () => {
    it('should return cube state when initialized', () => {
      useCubeStore.getState().initialize();
      const state = useGLStore.getState().getCubeState();
      expect(state.isInitialized).toBe(true);
      expect(state.cellCount).toBe(0);
      expect(state.historyCount).toBe(0);
    });

    it('should return cube state when not initialized', () => {
      const state = useGLStore.getState().getCubeState();
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('existing glStore actions still work', () => {
    it('setEntries should update entries', () => {
      const entries = [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })];
      useGLStore.getState().setEntries(entries);
      expect(useGLStore.getState().entries).toHaveLength(2);
    });

    it('clearData should reset entries and trialBalance', () => {
      useGLStore.getState().addEntry(makeEntry());
      useGLStore.getState().clearData();
      expect(useGLStore.getState().entries).toHaveLength(0);
      expect(useGLStore.getState().trialBalance).toHaveLength(0);
    });

    it('checkDuplicates should detect duplicates', () => {
      const entry = makeEntry({
        accountCode: '1000',
        postDate: '2026-01-15',
        debit: 500,
        credit: 0,
      });
      useGLStore.getState().addEntry(entry);

      const result = useGLStore
        .getState()
        .checkDuplicates([
          makeEntry({ accountCode: '1000', postDate: '2026-01-15', debit: 500, credit: 0 }),
          makeEntry({ accountCode: '2000', postDate: '2026-01-15', debit: 100, credit: 0 }),
        ]);
      expect(result.duplicates).toBe(1);
      expect(result.newEntries).toHaveLength(1);
    });

    it('undoLastImport should remove last imported entries', () => {
      const entries = [makeEntry({ id: 'imp1' }), makeEntry({ id: 'imp2' })];
      useGLStore.getState().addEntry(entries);
      expect(useGLStore.getState().entries).toHaveLength(2);

      useGLStore.getState().undoLastImport();
      expect(useGLStore.getState().entries).toHaveLength(0);
    });
  });
});
