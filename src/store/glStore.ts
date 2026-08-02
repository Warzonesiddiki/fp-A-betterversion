import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  GLAccount,
  GLEntry,
  TrialBalanceRow,
  AccountAnalysis,
  GLState,
  ImportResult,
} from '@/types';
import { masterStorage } from '../utils/masterStorage';
import { toCents, fromCents, formatMoney } from '../utils/money';
import { UndoRedoEngine } from '@/engines/UndoRedoEngine';
import { useCubeStore } from './cubeStore';
import { useUIStore } from './uiStore';
import { enforce, Permissions } from '../utils/rbacEnforcer';

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

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeGLEntry(
  entry: Partial<GLEntry>,
  index: number,
  fallbackIdPrefix = 'gl'
): GLEntry {
  const sourceAmount = toFiniteNumber(entry.amount, 0);
  const debit = Math.max(
    0,
    entry.debit !== undefined ? toFiniteNumber(entry.debit) : Math.max(sourceAmount, 0)
  );
  const credit = Math.max(
    0,
    entry.credit !== undefined ? toFiniteNumber(entry.credit) : Math.max(-sourceAmount, 0)
  );
  const netChange = debit - credit;
  const date = String(entry.date || entry.postDate || '');
  const period = String(entry.period || date.slice(0, 7) || 'unknown');
  const accountCode = String(entry.accountCode || entry.accountId || '').trim();
  const accountId = String(entry.accountId || accountCode).trim();
  const accountName = String(entry.accountName || accountCode).trim();

  return {
    ...entry,
    id: String(entry.id || `${fallbackIdPrefix}-${index}`),
    accountId,
    accountCode,
    accountName,
    period,
    periodName: String(entry.periodName || period),
    debit,
    credit,
    netChange,
    amount: netChange,
    date,
    description: String(entry.description || ''),
    reference: String(entry.reference || ''),
  };
}

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
        undo: enforce(Permissions.UI_UPDATE, 'undo', () => {
          const snapshot = undoEngine.undo();
          if (snapshot !== null) {
            set({
              entries: snapshot.entries,
              accounts: snapshot.accounts,
              trialBalance: snapshot.trialBalance,
              accountAnalysis: snapshot.accountAnalysis,
            });
          }
        }),

        redo: enforce(Permissions.UI_UPDATE, 'redo', () => {
          const snapshot = undoEngine.redo();
          if (snapshot !== null) {
            set({
              entries: snapshot.entries,
              accounts: snapshot.accounts,
              trialBalance: snapshot.trialBalance,
              accountAnalysis: snapshot.accountAnalysis,
            });
          }
        }),

        canUndo: () => undoEngine.canUndo(),
        canRedo: () => undoEngine.canRedo(),
        getHistoryLength: () => undoEngine.getHistoryLength(),

        // --- Mutation Actions (with undo capture) ---

        setEntries: enforce(Permissions.IMPORT_CREATE, 'setEntries', (entries) => {
          captureGLSnapshot(get);
          const normalizedEntries = entries.map((entry, index) =>
            normalizeGLEntry(entry, index, 'gl-set')
          );
          const ids = normalizedEntries.map((e) => e.id);
          set((state) => {
            state.entries = normalizedEntries;
            state.trialBalance = [];
            state.accountAnalysis = null;
            state.lastImportEntryIds = ids;
            state.importStatus = 'complete';
            state.importProgress = 100;
            state.importError = null;
          });
          useUIStore.getState().addToast({
            type: 'success',
            title: 'GL Entries Set',
            message: `Successfully loaded ${normalizedEntries.length} general ledger entries`,
          });
        }),

        addEntries: enforce(Permissions.IMPORT_CREATE, 'addEntries', (newEntries: GLEntry[]) => {
          captureGLSnapshot(get);
          const normalizedEntries = newEntries.map((entry, index) =>
            normalizeGLEntry(entry, index, `gl-add-${Date.now()}`)
          );
          const ids = normalizedEntries.map((e) => e.id);
          set((state) => {
            state.entries.push(...normalizedEntries);
            state.lastImportEntryIds = ids;
            state.importStatus = 'complete';
            state.importProgress = 100;
          });
        }),

        /** High-level robust import action used by the GL Upload wizard */
        importGLData: enforce(
          Permissions.IMPORT_CREATE,
          'importGLData',
          (rawEntries: Partial<GLEntry>[], filename?: string) => {
            const validation = get().validateEntries(rawEntries);
            if (!validation.isValid) {
              set({ importError: validation.errors.slice(0, 5).join('; '), importStatus: 'error' });
              return { success: false, imported: 0, errors: validation.errors.length };
            }

            const { duplicates, newEntries } = get().checkDuplicates(rawEntries as GLEntry[]);

            if (newEntries.length === 0) {
              set({ importError: 'All rows were duplicates.', importStatus: 'error' });
              return { success: false, imported: 0, errors: duplicates };
            }

            captureGLSnapshot(get);
            const timestamp = Date.now();
            const finalEntries = newEntries.map((entry, index) =>
              normalizeGLEntry(
                {
                  ...entry,
                  id: entry.id || `gl-${timestamp}-${index}`,
                },
                index,
                `gl-${timestamp}`
              )
            );

            const ids = finalEntries.map((e) => e.id);

            set((state) => {
              state.entries.push(...finalEntries);
              state.lastImportEntryIds = ids;
              state.importStatus = 'complete';
              state.importProgress = 100;
              state.importError = null;
              state.trialBalance = [];
              state.accountAnalysis = null;
            });

            const result: ImportResult = {
              filename: filename || 'unknown',
              rowCount: rawEntries.length,
              successCount: finalEntries.length,
              errorCount: validation.errors.length + duplicates,
              warningCount: duplicates,
              status: duplicates > 0 ? 'partial' : 'success',
            };

            get().recordImport(result);

            return {
              success: true,
              imported: finalEntries.length,
              duplicates,
              errors: validation.errors.length,
            };
          }
        ),

        addEntry: enforce(Permissions.IMPORT_CREATE, 'addEntry', (entry) => {
          captureGLSnapshot(get);
          const entries = (Array.isArray(entry) ? entry : [entry]).map((item, index) =>
            normalizeGLEntry(item, index, `gl-entry-${Date.now()}`)
          );
          set((state) => {
            state.entries.push(...entries);
            state.lastImportEntryIds = entries.map((e) => e.id);
            state.importStatus = 'complete';
            state.importProgress = 100;
          });
          useUIStore.getState().addToast({
            type: 'success',
            title: 'Entries Added',
            message: `Successfully added ${entries.length} new entries to general ledger`,
          });
        }),

        setAccounts: enforce(Permissions.IMPORT_UPDATE, 'setAccounts', (accounts) => {
          captureGLSnapshot(get);
          set({ accounts });
        }),

        generateTrialBalance: () => {
          set({ isLoading: true });
          const { entries, accounts } = get();
          const accountMap = new Map<string, GLAccount>();
          for (const account of accounts) {
            accountMap.set(account.id, account);
            accountMap.set(account.code, account);
          }

          const balanceMap = new Map<string, TrialBalanceRow>();
          for (const entry of entries) {
            const key = entry.accountId || entry.accountCode;
            const account = accountMap.get(key) ?? accountMap.get(entry.accountCode);
            const existing = balanceMap.get(key) ?? {
              accountId: key,
              accountCode: entry.accountCode,
              accountName: entry.accountName,
              accountType: account?.type ?? 'Unknown',
              beginningBalance: 0,
              debit: 0,
              credit: 0,
              netChange: 0,
              endingBalance: 0,
            };
            const debit = toFiniteNumber(entry.debit);
            const credit = toFiniteNumber(entry.credit);
            const netChange = debit - credit;
            existing.debit += debit;
            existing.credit += credit;
            existing.netChange += netChange;
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
          const filtered = entries.filter(
            (e) => e.accountId === accountId || e.accountCode === accountId
          );

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

        filterByDate: enforce(Permissions.UI_UPDATE, 'filterByDate', (start, end) => {
          set({ dateFilter: { start, end } });
        }),

        filterByAccount: enforce(Permissions.UI_UPDATE, 'filterByAccount', (accountIds) => {
          set({ accountFilter: accountIds });
        }),

        clearFilters: enforce(Permissions.UI_UPDATE, 'clearFilters', () => {
          set({ dateFilter: null, accountFilter: [] });
        }),

        updateColumnMapping: enforce(
          Permissions.IMPORT_UPDATE,
          'updateColumnMapping',
          (mapping) => {
            set({ columnMapping: mapping });
          }
        ),

        clearData: enforce(Permissions.IMPORT_DELETE, 'clearData', () => {
          captureGLSnapshot(get);
          set({
            entries: [],
            trialBalance: [],
            accountAnalysis: null,
            dateFilter: null,
            accountFilter: [],
          });
          useUIStore.getState().addToast({
            type: 'info',
            title: 'GL Data Cleared',
            message: 'General ledger data has been reset',
          });
        }),

        setImportProgress: enforce(Permissions.UI_UPDATE, 'setImportProgress', (progress) =>
          set({ importProgress: Math.max(0, Math.min(100, progress)) })
        ),

        setImportStatus: enforce(Permissions.UI_UPDATE, 'setImportStatus', (status) =>
          set({
            importStatus: status,
            importError: status === 'error' ? get().importError : null,
          })
        ),

        setImportError: enforce(Permissions.UI_UPDATE, 'setImportError', (error) =>
          set({ importError: error, importStatus: 'error' })
        ),

        recordImport: enforce(Permissions.IMPORT_CREATE, 'recordImport', (result) =>
          set((state) => {
            state.importHistory.unshift({
              id: `import-${Date.now()}`,
              ...result,
              timestamp: new Date().toISOString(),
            });
            state.lastImportResult = { ...result, timestamp: new Date().toISOString() };
            state.importStatus = 'complete';
            state.importProgress = 100;

            useUIStore.getState().addToast({
              type: result.status === 'success' ? 'success' : 'warning',
              title: 'Import Completed',
              message: `Processed ${result.rowCount} rows. Success: ${result.successCount}, Errors: ${result.errorCount}`,
            });
          })
        ),

        undoLastImport: enforce(Permissions.IMPORT_DELETE, 'undoLastImport', () =>
          set((state) => {
            const count = state.lastImportEntryIds.length;
            if (count === 0) {
              state.lastImportResult = null;
              state.importStatus = 'idle';
              state.importProgress = 0;
              return;
            }

            const ids = new Set(state.lastImportEntryIds);
            state.entries = state.entries.filter((e) => !ids.has(e.id));
            state.lastImportEntryIds = [];
            state.lastImportResult = null;
            state.importStatus = 'idle';
            state.importProgress = 0;
            state.trialBalance = [];
            state.accountAnalysis = null;

            useUIStore.getState().addToast({
              type: 'info',
              title: 'Import Undone',
              message: `Successfully removed ${count} entries from the last import`,
            });
          })
        ),

        checkDuplicates: (entries) => {
          const state = get();
          const existingKeys = new Set(
            state.entries.map(
              (e) => `${e.accountCode}|${e.postDate || e.date}|${e.amount ?? e.debit - e.credit}`
            )
          );
          const duplicates: GLEntry[] = [];
          const newEntries: GLEntry[] = [];

          entries.forEach((e) => {
            const key = `${e.accountCode}|${e.postDate || e.date}|${e.amount ?? e.debit - e.credit}`;
            if (existingKeys.has(key)) {
              duplicates.push(e);
            } else {
              newEntries.push(e);
            }
          });

          return { duplicates: duplicates.length, newEntries };
        },

        validateEntries: (entries: Partial<GLEntry>[]) => {
          const errors: string[] = [];
          // F-0005: invalidity is tracked per ROW. A row with 3 errors is one
          // invalid row, not three (the old code subtracted the error count).
          const invalidRows = new Set<number>();
          entries.forEach((e, idx) => {
            const row = idx + 1;
            const debitProvided = e.debit !== undefined;
            const creditProvided = e.credit !== undefined;
            const amountProvided = e.amount !== undefined;
            const debit = toFiniteNumber(e.debit, Number.NaN);
            const credit = toFiniteNumber(e.credit, Number.NaN);
            const amount = toFiniteNumber(e.amount, Number.NaN);

            const fail = (msg: string) => {
              errors.push(`Row ${row}: ${msg}`);
              invalidRows.add(idx);
            };

            if (!e.accountCode && !e.accountId) fail('missing accountCode');
            if (!e.date && !e.postDate) fail('missing date/postDate');
            if (!debitProvided && !creditProvided && !amountProvided) {
              fail('missing debit, credit, or amount');
            }
            if (debitProvided && (!Number.isFinite(debit) || debit < 0)) {
              fail('debit must be a non-negative number');
            }
            if (creditProvided && (!Number.isFinite(credit) || credit < 0)) {
              fail('credit must be a non-negative number');
            }
            if (amountProvided && !Number.isFinite(amount)) {
              fail('amount must be a finite number');
            }
          });

          // F-0004: double-entry invariant. Debits MUST equal credits exactly
          // (integer cents, zero tolerance) per journal batch. Entries are
          // grouped by journalId; entries without one form a single import
          // batch. Amount-only rows contribute via the same normalization the
          // importer applies (positive amount → debit, negative → credit).
          // Rows already invalid above are excluded from the totals.
          const groups = new Map<
            string,
            { debitCents: number; creditCents: number; rows: number[] }
          >();
          entries.forEach((e, idx) => {
            if (invalidRows.has(idx)) return;
            const groupKey = e.journalId ?? '__import_batch__';
            let group = groups.get(groupKey);
            if (!group) {
              group = { debitCents: 0, creditCents: 0, rows: [] };
              groups.set(groupKey, group);
            }
            const amount = e.amount !== undefined ? toFiniteNumber(e.amount) : undefined;
            const effectiveDebit =
              e.debit !== undefined
                ? toFiniteNumber(e.debit)
                : amount !== undefined
                  ? Math.max(amount, 0)
                  : 0;
            const effectiveCredit =
              e.credit !== undefined
                ? toFiniteNumber(e.credit)
                : amount !== undefined
                  ? Math.max(-(amount ?? 0), 0)
                  : 0;
            // Exact cents via the canonical money primitive (F-0006).
            group.debitCents += toCents(effectiveDebit);
            group.creditCents += toCents(effectiveCredit);
            group.rows.push(idx + 1);
          });

          for (const [journalId, group] of groups) {
            const imbalanceCents = group.debitCents - group.creditCents;
            if (imbalanceCents !== 0) {
              const label =
                journalId === '__import_batch__' ? 'Import batch' : `Journal '${journalId}'`;
              const imbalance = formatMoney(fromCents(Math.abs(imbalanceCents)));
              errors.push(
                `${label}: debits (${formatMoney(fromCents(group.debitCents))}) do not equal credits ` +
                  `(${formatMoney(fromCents(group.creditCents))}); imbalance ${imbalance} ` +
                  `(rows ${group.rows.join(', ')})`
              );
              for (const row of group.rows) invalidRows.add(row - 1);
            }
          }

          return {
            isValid: errors.length === 0,
            errors,
            validCount: entries.length - invalidRows.size,
          };
        },

        // --- CubeEngine integration ---

        syncToCube: enforce(Permissions.CUBE_WRITE, 'syncToCube', () => {
          const { entries, accounts } = get();
          const cubeStore = useCubeStore.getState();
          if (!cubeStore.isInitialized) {
            useUIStore.getState().addToast({
              type: 'error',
              title: 'Sync Failed',
              message: 'Cube store is not initialized',
            });
            return;
          }

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
            const amount = toFiniteNumber(e.debit) - toFiniteNumber(e.credit);

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
              cell: { coords, measure: 'netChange', value: amount, dataType: 'input' },
            });
            cubeCells.push({
              cube: 'GL_Actuals',
              cell: { coords, measure: 'amount', value: amount, dataType: 'input' },
            });
          }
          cubeStore.bulkWriteCells(cubeCells);

          useUIStore.getState().addToast({
            type: 'success',
            title: 'Cube Sync Complete',
            message: `Successfully synced ${entries.length} entries to OLAP cube`,
          });
        }),

        syncFromCube: enforce(Permissions.CUBE_READ, 'syncFromCube', () => {
          const cubeStore = useCubeStore.getState();
          if (!cubeStore.isInitialized) {
            useUIStore.getState().addToast({
              type: 'error',
              title: 'Sync Failed',
              message: 'Cube store is not initialized',
            });
            return;
          }

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

          useUIStore.getState().addToast({
            type: 'success',
            title: 'Cube Data Retrieved',
            message: `Successfully retrieved ${balance.length} rows from OLAP cube`,
          });
        }),

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
        version: 1,
        migrate: (state: unknown) => state,
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
