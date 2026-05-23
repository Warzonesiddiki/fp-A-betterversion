import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  GLAccount,
  GLEntry,
  TrialBalanceRow,
  AccountAnalysis,
  ColumnMapping,
  GLState,
  ImportResult,
} from '@/types';
import { masterStorage } from '../utils/masterStorage';
import { UndoRedoEngine } from '@/engines/UndoRedoEngine';
import { useCubeStore } from './cubeStore';
import { invalidateStoreCache } from '@/utils/storeCache';

function extractTimeCode(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Time:${year}-Q${quarter}-M${String(month).padStart(2, '0')}`;
}

interface GLSnapshot {
  entries: GLEntry[];
  accounts: GLAccount[];
  trialBalance: TrialBalanceRow[];
  accountAnalysis: AccountAnalysis | null;
}

const undoEngine = new UndoRedoEngine<GLSnapshot>(100);

function captureGLSnapshot(get: () => ReturnType<typeof useGLStore.getState>) {
  const state = get();
  undoEngine.push({
    entries: state.entries,
    accounts: state.accounts,
    trialBalance: state.trialBalance,
    accountAnalysis: state.accountAnalysis,
  });
}

export const useGLStore = create<GLState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        entries: [],
        accounts: [],
        trialBalance: [],
        accountAnalysis: null,
        columnMapping: [
          { sourceColumn: '', targetField: 'date', isRequired: true },
          { sourceColumn: '', targetField: 'accountCode', isRequired: true },
          { sourceColumn: '', targetField: 'debit', isRequired: false },
          { sourceColumn: '', targetField: 'credit', isRequired: false },
          { sourceColumn: '', targetField: 'description', isRequired: false },
          { sourceColumn: '', targetField: 'reference', isRequired: false },
        ],
        dateFilter: null,
        accountFilter: [],
        isLoading: false,
        importProgress: 0,
        importStatus: 'idle',
        importError: null,
        lastImportResult: null,
        importHistory: [],
        lastImportEntryIds: [],

        // --- Undo/Redo Actions ---
        undo: () => {
          const snapshot = undoEngine.undo();
          if (snapshot !== null) {
            set({
              entries: snapshot.entries,
              accounts: snapshot.accounts,
              trialBalance: snapshot.trialBalance,
              accountAnalysis: snapshot.accountAnalysis,
            });
          }
        },

        redo: () => {
          const snapshot = undoEngine.redo();
          if (snapshot !== null) {
            set({
              entries: snapshot.entries,
              accounts: snapshot.accounts,
              trialBalance: snapshot.trialBalance,
              accountAnalysis: snapshot.accountAnalysis,
            });
          }
        },

        canUndo: () => undoEngine.canUndo(),
        canRedo: () => undoEngine.canRedo(),
        getHistoryLength: () => undoEngine.getHistoryLength(),

        // --- Mutation Actions (with undo capture) ---

        setEntries: (entries) => {
          captureGLSnapshot(get);
          const ids = entries.map((e) => e.id);
          set({
            entries,
            trialBalance: [],
            accountAnalysis: null,
            lastImportEntryIds: ids,
          });
        },

        addEntry: (entry) => {
          captureGLSnapshot(get);
          const entries = Array.isArray(entry) ? entry : [entry];
          set((state) => {
            state.entries.push(...entries);
            state.lastImportEntryIds = entries.map((e) => e.id);
          });
        },

        setAccounts: (accounts) => {
          captureGLSnapshot(get);
          set({ accounts });
        },

        generateTrialBalance: () => {
          set({ isLoading: true });
          const { entries, accounts } = get();
          const accountMap = new Map(accounts.map((a) => [a.id, a]));

          const balanceMap = new Map<string, TrialBalanceRow>();
          for (const entry of entries) {
            const key = entry.accountId;
            const existing = balanceMap.get(key) ?? {
              accountId: entry.accountId,
              accountCode: entry.accountCode,
              accountName: entry.accountName,
              accountType: accountMap.get(entry.accountId)?.type ?? 'Unknown',
              beginningBalance: 0,
              debit: 0,
              credit: 0,
              netChange: 0,
              endingBalance: 0,
            };
            existing.debit += entry.debit;
            existing.credit += entry.credit;
            existing.netChange += entry.netChange;
            existing.endingBalance = existing.beginningBalance + existing.netChange;
            balanceMap.set(key, existing);
          }

          const balance = Array.from(balanceMap.values()).sort((a, b) =>
            a.accountCode.localeCompare(b.accountCode)
          );

          set({ trialBalance: balance, isLoading: false });
        },

        analyzeAccount: (accountId) => {
          set({ isLoading: true });
          const { entries } = get();
          const filtered = entries.filter((e) => e.accountId === accountId);

          const monthGroups = new Map<string, { debit: number; credit: number; count: number }>();
          for (const entry of filtered) {
            const month = entry.period;
            const g = monthGroups.get(month) ?? { debit: 0, credit: 0, count: 0 };
            g.debit += entry.debit;
            g.credit += entry.credit;
            g.count += 1;
            monthGroups.set(month, g);
          }

          const monthlyTotals = Array.from(monthGroups.entries())
            .map(([month, g]) => ({
              month,
              debit: g.debit,
              credit: g.credit,
              net: g.debit - g.credit,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

          const totalDebit = monthlyTotals.reduce((s, m) => s + m.debit, 0);
          const totalCredit = monthlyTotals.reduce((s, m) => s + m.credit, 0);

          set({
            accountAnalysis: {
              accountId,
              accountCode: filtered[0]?.accountCode ?? '',
              accountName: filtered[0]?.accountName ?? '',
              monthlyTotals,
              totalDebit,
              totalCredit,
              averageBalance:
                monthlyTotals.length > 0 ? (totalDebit - totalCredit) / monthlyTotals.length : 0,
              transactionCount: filtered.length,
            },
            isLoading: false,
          });
        },

        filterByDate: (start, end) => {
          set({ dateFilter: { start, end } });
        },

        filterByAccount: (accountIds) => {
          set({ accountFilter: accountIds });
        },

        clearFilters: () => {
          set({ dateFilter: null, accountFilter: [] });
        },

        updateColumnMapping: (mapping) => {
          set({ columnMapping: mapping });
        },

        clearData: () => {
          captureGLSnapshot(get);
          set({
            entries: [],
            trialBalance: [],
            accountAnalysis: null,
            dateFilter: null,
            accountFilter: [],
          });
        },

        setImportProgress: (progress) =>
          set({ importProgress: Math.max(0, Math.min(100, progress)) }),

        setImportStatus: (status) =>
          set({
            importStatus: status,
            importError: status === 'error' ? get().importError : null,
          }),

        setImportError: (error) => set({ importError: error, importStatus: 'error' }),

        recordImport: (result) =>
          set((state) => {
            state.importHistory.unshift({
              id: `import-${Date.now()}`,
              ...result,
              timestamp: new Date().toISOString(),
            });
            state.lastImportResult = { ...result, timestamp: new Date().toISOString() };
            state.importStatus = 'complete';
            state.importProgress = 100;
          }),

        undoLastImport: () =>
          set((state) => {
            const ids = new Set(state.lastImportEntryIds);
            state.entries = state.entries.filter((e) => !ids.has(e.id));
            state.lastImportEntryIds = [];
            state.lastImportResult = null;
          }),

        checkDuplicates: (entries) => {
          const state = get();
          const keys = new Set(
            state.entries.map(
              (e) => `${e.accountCode}|${e.postDate || e.date}|${e.amount || e.debit - e.credit}`
            )
          );
          const dups = entries.filter((e) =>
            keys.has(`${e.accountCode}|${e.postDate || e.date}|${e.amount || e.debit - e.credit}`)
          );
          const newEntries = entries.filter(
            (e) =>
              !keys.has(
                `${e.accountCode}|${e.postDate || e.date}|${e.amount || e.debit - e.credit}`
              )
          );
          return { duplicates: dups.length, newEntries };
        },

        // --- CubeEngine integration ---

        syncToCube: () => {
          const { entries, accounts } = get();
          const cubeStore = useCubeStore.getState();
          if (!cubeStore.isInitialized) return;

          for (const account of accounts) {
            try {
              cubeStore.addMember('Account', {
                code: account.code,
                name: account.name,
                hierarchy: 'reporting',
                level: account.level,
                isLeaf: account.children.length === 0,
                isActive: account.isActive,
                attributes: {
                  type: account.type,
                  category: account.category,
                  subCategory: account.subCategory,
                },
                sortOrder: account.sortOrder,
              });
            } catch {
              // Member may already exist
            }
          }

          const cubeCells: { cube: string; cell: import('@/types/cube-types').CubeCell }[] = [];
          for (const e of entries) {
            const timeCode = extractTimeCode(e.postDate || e.date);
            const entityId = e.entityId || 'default_entity';
            const accountCode = `Account:${e.accountCode}`;
            const coords: Record<string, string> = {
              Account: accountCode,
              Entity: `Entity:${entityId}`,
              Time: timeCode,
              Scenario: 'Scenario:Actual',
              Currency: 'Currency:USD',
            };
            const amount = e.amount ?? e.debit - e.credit;

            cubeCells.push({
              cube: 'GL_Actuals',
              cell: { coords, measure: 'debit', value: e.debit, dataType: 'input' },
            });
            cubeCells.push({
              cube: 'GL_Actuals',
              cell: { coords, measure: 'credit', value: e.credit, dataType: 'input' },
            });
            cubeCells.push({
              cube: 'GL_Actuals',
              cell: { coords, measure: 'netChange', value: e.netChange, dataType: 'input' },
            });
            cubeCells.push({
              cube: 'GL_Actuals',
              cell: { coords, measure: 'amount', value: amount, dataType: 'input' },
            });
          }
          cubeStore.bulkWriteCells(cubeCells);
        },

        syncFromCube: () => {
          const cubeStore = useCubeStore.getState();
          if (!cubeStore.isInitialized) return;

          const result = cubeStore.query({
            cube: 'GL_Actuals',
            rows: ['Account'],
            columns: ['Time'],
            filters: [{ dimension: 'Scenario', memberIds: ['Scenario:Actual'] }],
            measures: ['debit', 'credit', 'netChange', 'amount'],
            aggregation: 'sum',
            includeGrandTotal: true,
          });

          const balance: TrialBalanceRow[] = result.rows.map((row) => {
            const debit = typeof row.values[0] === 'number' ? row.values[0] : 0;
            const credit = typeof row.values[1] === 'number' ? row.values[1] : 0;
            const netChange = typeof row.values[2] === 'number' ? row.values[2] : 0;
            const accountCode = row.label.split('|')[0]?.replace('Account:', '') ?? '';
            return {
              accountId: accountCode,
              accountCode,
              accountName: '',
              accountType: 'Unknown' as const,
              beginningBalance: 0,
              debit,
              credit,
              netChange,
              endingBalance: netChange,
            };
          });

          set({ trialBalance: balance });
        },

        getCubeState: () => {
          const cubeStore = useCubeStore.getState();
          return {
            isInitialized: cubeStore.isInitialized,
            cellCount: cubeStore.cellCount,
            historyCount: cubeStore.historyCount,
            snapshotCount: cubeStore.snapshots.length,
          };
        },
      })),
      {
        name: 'gl-store',
        storage: masterStorage,
        partialize: (state) => ({
          entries: state.entries,
          importHistory: state.importHistory,
          columnMapping: state.columnMapping,
        }),
      }
    )
  )
);

// Memoized selectors to prevent unnecessary re-renders
export const glSelectors = {
  entries: (state: GLState) => state.entries,
  accounts: (state: GLState) => state.accounts,
  trialBalance: (state: GLState) => state.trialBalance,
  accountAnalysis: (state: GLState) => state.accountAnalysis,
  columnMapping: (state: GLState) => state.columnMapping,
  dateFilter: (state: GLState) => state.dateFilter,
  accountFilter: (state: GLState) => state.accountFilter,
  isLoading: (state: GLState) => state.isLoading,
  importProgress: (state: GLState) => state.importProgress,
  importStatus: (state: GLState) => state.importStatus,
  importError: (state: GLState) => state.importError,
  lastImportResult: (state: GLState) => state.lastImportResult,
  importHistory: (state: GLState) => state.importHistory,
  // Derived selectors
  entryCount: (state: GLState) => state.entries.length,
  accountCount: (state: GLState) => state.accounts.length,
  hasData: (state: GLState) => state.entries.length > 0,
  hasTrialBalance: (state: GLState) => state.trialBalance.length > 0,
  activeAccounts: (state: GLState) => state.accounts.filter((a) => a.isActive),
  importHistoryCount: (state: GLState) => state.importHistory.length,
};
