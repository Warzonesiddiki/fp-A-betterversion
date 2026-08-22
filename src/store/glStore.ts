// @money-ast-allow Reason: Integer-cent subtraction: debitCents - creditCents where both values are integers from toCents(), not floating-point money
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
import {
  addMoney,
  divideMoney,
  formatMoney,
  fromCents,
  roundTo,
  subtractMoney,
  sumMoney,
  toCents,
  toDecimal,
} from '../utils/money';
import { UndoRedoEngine } from '@/engines/UndoRedoEngine';
import { FpaClient } from '@/sdk/FpaClient';
import { GlCommitNamespace } from '@/sdk/gl/GlCommitNamespace';
import type { GlJournalBatch, GlCommitResult, GlListedEntry } from '@/sdk/gl/GlCommitNamespace';
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
  /** W0.8.6: sync identity travels with the rows — an undo past a server
   * commit must restore the exact id→syncState/version mapping, or a
   * committed row would come back looking like a draft under its old
   * client-side id (identity corruption on financial records). */
  entrySyncState: GLState['entrySyncState'];
  entryVersions: GLState['entryVersions'];
}

/** Trial-balance accumulator holding Decimal currency values (F-0006). */
interface TrialRowAccum {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: TrialBalanceRow['accountType'];
  beginningBalance: ReturnType<typeof toDecimal>;
  debit: ReturnType<typeof toDecimal>;
  credit: ReturnType<typeof toDecimal>;
  netChange: ReturnType<typeof toDecimal>;
  endingBalance: ReturnType<typeof toDecimal>;
}

/** Account-analysis month accumulator holding Decimal currency values (F-0006). */
interface MonthGroupAccum {
  debit: ReturnType<typeof addMoney>;
  credit: ReturnType<typeof addMoney>;
  count: number;
}

const undoEngine = new UndoRedoEngine<GLSnapshot>(100);

// ── W0.8.6: server commit channel (K25) ─────────────────────────────────────
// Injectable for tests; defaults to a client over the default base URL.
// The namespace never mutates the store — outcomes are applied explicitly.
let glCommitClient: GlCommitNamespace = new GlCommitNamespace(
  new FpaClient({ auth: { type: 'bearer', token: '' } })
);

/** Test/infra hook: replace the server-commit transport. */
export function setGlCommitClient(client: GlCommitNamespace): void {
  glCommitClient = client;
}

function toJournalBatch(entries: GLEntry[], environmentId: string): GlJournalBatch {
  const journalId =
    entries.find((e) => e.journalId)?.journalId ??
    `batch-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    journalId,
    environmentId,
    lines: entries.map((e) => ({
      accountId: e.accountId || e.accountCode,
      entityId: e.entityId,
      postDate: e.postDate || e.date,
      debit: e.debit,
      credit: e.credit,
      description: e.description,
      reference: e.reference,
    })),
  };
}

async function applyCommitResult(
  result: GlCommitResult<readonly { id: string; version: number }[]> | GlCommitResult<void>,
  drafts: readonly GLEntry[],
  set: (fn: (state: GLState) => void) => void
): Promise<{ committed: boolean; conflictCode?: string; message?: string }> {
  const markFailed = () => {
    set((state) => {
      for (const e of drafts) state.entrySyncState[e.id] = 'failed';
    });
  };
  if (result.status === 'committed') {
    // Discriminated union over two generics: only the entries-typed member
    // carries a usable value array.
    const serverEntries: readonly { id: string; version: number }[] = Array.isArray(
      (result as { value?: unknown }).value
    )
      ? (result as { value: readonly { id: string; version: number }[] }).value
      : [];
    // G6 UUID resolver (P0): the server is the identity authority. Its bulk
    // response lists {id, version} in request-line order (fresh insert loop
    // and idempotent replay alike), so a same-arity response resolves each
    // draft to its authoritative row. Client-generated ids (`gl-*`,
    // `draft:*`) are replaced by server UUIDs and versions are captured for
    // If-Match. A different arity means we CANNOT know the mapping — fail
    // closed rather than guess identities on financial records.
    if (serverEntries.length !== drafts.length) {
      markFailed();
      return {
        committed: false,
        message: `commit result arity mismatch: sent ${drafts.length}, server acknowledged ${serverEntries.length}`,
      };
    }
    const idRemap = new Map<string, string>();
    set((state) => {
      for (let i = 0; i < drafts.length; i++) {
        const draft = drafts[i];
        const committedRow = serverEntries[i];
        if (!draft || !committedRow) continue;
        const oldId = draft.id;
        const entry = state.entries.find((e) => e.id === oldId);
        if (!entry) continue;
        delete state.entrySyncState[oldId];
        delete state.entryVersions[oldId];
        // Immer draft: runtime re-key of a readonly-tagged identity field.
        (entry as { id: string }).id = committedRow.id;
        idRemap.set(oldId, committedRow.id);
        state.entrySyncState[committedRow.id] = 'committed';
        state.entryVersions[committedRow.id] = committedRow.version;
      }
      state.lastImportEntryIds = state.lastImportEntryIds.map((id) => idRemap.get(id) ?? id);
    });
    return { committed: true };
  }
  if (result.status === 'conflict') {
    markFailed();
    return {
      committed: false,
      conflictCode: result.conflict.code,
      message: result.conflict.message,
    };
  }
  markFailed();
  return { committed: false, message: result.status === 'error' ? result.message : undefined };
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * W0.8.6 boot hydrate: overlay one server-listed row onto a committed local
 * entry. Server-provided fields win; fields the listing does not carry keep
 * their local values (accountName, journalId, entityId, …). period/periodName
 * are re-derived from the merged date so the row stays internally consistent
 * after normalizeGLEntry recomputes netChange/amount.
 */
function mergeListedEntry(local: GLEntry, row: GlListedEntry): Partial<GLEntry> {
  const date = row.postDate ?? row.date ?? local.postDate ?? local.date;
  const month = date ? date.slice(0, 7) : '';
  return {
    ...local,
    id: row.id,
    accountId: row.accountId ?? local.accountId,
    accountCode: row.accountCode ?? local.accountCode,
    postDate: date,
    date,
    debit: row.debit,
    credit: row.credit,
    period: month,
    periodName: month,
    ...(row.description !== undefined ? { description: row.description } : {}),
    ...(row.reference !== undefined ? { reference: row.reference } : {}),
  };
}

/** W0.8.6 boot hydrate: shape a locally-absent server row for adoption. */
function listedToGLEntry(row: GlListedEntry): Partial<GLEntry> {
  const date = row.postDate ?? row.date ?? '';
  const month = date ? date.slice(0, 7) : '';
  return {
    id: row.id,
    accountId: row.accountId ?? '',
    accountCode: row.accountCode ?? row.accountId ?? '',
    postDate: date,
    date,
    debit: row.debit,
    credit: row.credit,
    period: month,
    periodName: month,
    description: row.description ?? '',
    reference: row.reference ?? '',
  };
}

/** One server-side compensating delete that did not succeed (W0.8.6 §4). */
interface GlTombstoneFailure {
  readonly id: string;
  readonly message: string;
}

/**
 * W0.8.6 §4 (plan): compensating server tombstones. Only COMMITTED rows ever
 * reached the server, so draft/pending/failed ids are skipped entirely.
 * `already_deleted` counts as success (K25 tombstone replay semantics). Never
 * throws — failures come back as {id, message} so callers can summarize them
 * into `importError` WITHOUT blocking the local intent (local wins; the
 * server reconciles via tombstones-on-replay).
 */
async function tombstoneCommittedEntries(
  ids: readonly string[],
  entrySyncState: GLState['entrySyncState'],
  environmentId: string
): Promise<GlTombstoneFailure[]> {
  const failures: GlTombstoneFailure[] = [];
  for (const id of ids) {
    if ((entrySyncState[id] ?? 'draft') !== 'committed') continue;
    const result = await glCommitClient.deleteEntry({ entryId: id, environmentId });
    if (result.status === 'committed' || result.status === 'already_deleted') continue;
    const message =
      result.status === 'conflict'
        ? `${result.conflict.code}: ${result.conflict.message}`
        : (result.message ?? 'unknown server delete failure');
    failures.push({ id, message });
  }
  return failures;
}

function summarizeTombstoneFailures(failures: readonly GlTombstoneFailure[]): string {
  return (
    `${failures.length} committed entr(ies) failed server tombstone ` +
    `(local removal applied; server reconciles via tombstones-on-replay): ` +
    failures.map((f) => `${f.id} (${f.message})`).join('; ')
  );
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
  // Net change = debit − credit is currency: exact decimal, cent-rounded
  // (F-0006) — the stored amount feeds every downstream GL aggregation.
  const netChange = roundTo(subtractMoney(debit, credit));
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
    entrySyncState: state.entrySyncState,
    entryVersions: state.entryVersions,
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
        entrySyncState: {},
        entryVersions: {},
        environmentId: 'dev',

        // --- W0.8.6 server-authoritative commit path (K25) ---
        setEnvironmentId: enforce(Permissions.UI_UPDATE, 'setEnvironmentId', (environmentId) =>
          set({ environmentId })
        ),

        commitDraftsToServer: enforce(
          Permissions.IMPORT_CREATE,
          'commitDraftsToServer',
          async () => {
            const { entries, entrySyncState, environmentId, validateEntries } = get();
            const drafts = entries.filter((e) => (entrySyncState[e.id] ?? 'draft') === 'draft');
            const conflicts: { code: string; message: string }[] = [];
            let committed = 0;
            let failed = 0;

            if (drafts.length === 0) return { committed, failed, conflicts };

            set((state) => {
              for (const e of drafts) state.entrySyncState[e.id] = 'pending';
            });

            // Group drafts by journal so each balanced journal commits atomically.
            const groups = new Map<string, GLEntry[]>();
            for (const entry of drafts) {
              const key = entry.journalId ?? '__import_batch__';
              const group = groups.get(key);
              if (group) group.push(entry);
              else groups.set(key, [entry]);
            }

            for (const group of groups.values()) {
              const validation = validateEntries(group);
              if (!validation.isValid) {
                failed += group.length;
                await applyCommitResult(
                  { status: 'error', message: validation.errors[0] ?? 'validation failed' },
                  group,
                  set
                );
                conflicts.push({
                  code: 'FP-0002',
                  message: validation.errors.slice(0, 3).join('; '),
                });
                continue;
              }

              const result = await glCommitClient.createJournalBatch({
                batch: toJournalBatch(group, environmentId),
                idempotencyKey: `gl-${environmentId}-${group[0]?.journalId ?? Date.now()}`,
              });
              const outcome = await applyCommitResult(result, group, set);
              if (outcome.committed) {
                committed += group.length;
              } else {
                failed += group.length;
                if (outcome.conflictCode) {
                  conflicts.push({ code: outcome.conflictCode, message: outcome.message ?? '' });
                }
              }
            }

            if (failed > 0) {
              set({ importError: `${failed} draft entr(ies) failed server commit` });
            }
            return { committed, failed, conflicts };
          }
        ),

        // --- W0.8.6 boot hydrate (plan §5): converge the replica ---
        hydrateCommittedFromServer: enforce(
          Permissions.IMPORT_CREATE,
          'hydrateCommittedFromServer',
          async () => {
            const { environmentId } = get();
            const result = await glCommitClient.listEntries({ environmentId });
            if (result.status !== 'listed') return { hydrated: 0 };

            // Classify BEFORE mutating (K25/K27): decide every row's fate
            // against a stable pre-image, then apply in one pass. A server row
            // wins only over an ALREADY-COMMITTED local or a locally-absent
            // id; draft/pending/failed locals are skipped entirely — retention
            // beats erasure and nothing is silently lost. Missing syncState on
            // an existing row defaults to 'draft' (the same default
            // commitDraftsToServer uses), so legacy untracked rows are
            // protected too.
            const before = get();
            const updates: { index: number; next: GLEntry; version?: number }[] = [];
            const inserts: { entry: GLEntry; version?: number }[] = [];
            const seen = new Set<string>();
            for (const row of result.entries) {
              if (seen.has(row.id)) continue;
              seen.add(row.id);
              const index = before.entries.findIndex((e) => e.id === row.id);
              if (index >= 0) {
                if ((before.entrySyncState[row.id] ?? 'draft') !== 'committed') continue;
                const local = before.entries[index];
                if (!local) continue;
                updates.push({
                  index,
                  next: normalizeGLEntry(mergeListedEntry(local, row), index, 'gl-srv'),
                  version: row.version,
                });
              } else {
                inserts.push({
                  entry: normalizeGLEntry(listedToGLEntry(row), 0, 'gl-srv'),
                  version: row.version,
                });
              }
            }

            if (updates.length === 0 && inserts.length === 0) return { hydrated: 0 };

            set((state) => {
              for (const u of updates) {
                state.entries[u.index] = u.next;
                state.entrySyncState[u.next.id] = 'committed';
                // Version capture only when the listing provided one — never
                // invent or overwrite a version we were not given.
                if (u.version !== undefined) state.entryVersions[u.next.id] = u.version;
              }
              for (const i of inserts) {
                state.entries.push(i.entry);
                state.entrySyncState[i.entry.id] = 'committed';
                if (i.version !== undefined) state.entryVersions[i.entry.id] = i.version;
              }
              // Derived aggregates no longer reflect the converged rows.
              state.trialBalance = [];
              state.accountAnalysis = null;
            });
            return { hydrated: updates.length + inserts.length };
          }
        ),

        // --- Undo/Redo Actions ---
        undo: enforce(Permissions.UI_UPDATE, 'undo', () => {
          const snapshot = undoEngine.undo();
          if (snapshot !== null) {
            set({
              entries: snapshot.entries,
              accounts: snapshot.accounts,
              trialBalance: snapshot.trialBalance,
              accountAnalysis: snapshot.accountAnalysis,
              entrySyncState: snapshot.entrySyncState,
              entryVersions: snapshot.entryVersions,
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
              entrySyncState: snapshot.entrySyncState,
              entryVersions: snapshot.entryVersions,
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

          const balanceMap = new Map<string, TrialRowAccum>();
          for (const entry of entries) {
            const key = entry.accountId || entry.accountCode;
            const account = accountMap.get(key) ?? accountMap.get(entry.accountCode);
            const existing = balanceMap.get(key) ?? {
              accountId: key,
              accountCode: entry.accountCode,
              accountName: entry.accountName,
              accountType: account?.type ?? 'Unknown',
              beginningBalance: toDecimal(0),
              debit: toDecimal(0),
              credit: toDecimal(0),
              netChange: toDecimal(0),
              endingBalance: toDecimal(0),
            };
            // GL debit/credit amounts are currency: exact decimal
            // accumulation, cent-rounded once at the output boundary (F-0006).
            const debit = toDecimal(toFiniteNumber(entry.debit));
            const credit = toDecimal(toFiniteNumber(entry.credit));
            const netChange = subtractMoney(debit, credit);
            existing.debit = addMoney(existing.debit, debit);
            existing.credit = addMoney(existing.credit, credit);
            existing.netChange = addMoney(existing.netChange, netChange);
            existing.endingBalance = addMoney(existing.beginningBalance, existing.netChange);
            balanceMap.set(key, existing);
          }

          const balance: TrialBalanceRow[] = Array.from(balanceMap.values())
            .map((row) => ({
              accountId: row.accountId,
              accountCode: row.accountCode,
              accountName: row.accountName,
              accountType: row.accountType,
              beginningBalance: roundTo(row.beginningBalance),
              debit: roundTo(row.debit),
              credit: roundTo(row.credit),
              netChange: roundTo(row.netChange),
              endingBalance: roundTo(row.endingBalance),
            }))
            .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

          set({ trialBalance: balance, isLoading: false });
        },

        analyzeAccount: (accountId) => {
          set({ isLoading: true });
          const { entries } = get();
          const filtered = entries.filter(
            (e) => e.accountId === accountId || e.accountCode === accountId
          );

          const monthGroups = new Map<string, MonthGroupAccum>();
          for (const entry of filtered) {
            const month = entry.period;
            const g = monthGroups.get(month) ?? {
              debit: toDecimal(0),
              credit: toDecimal(0),
              count: 0,
            };
            g.debit = addMoney(g.debit, toFiniteNumber(entry.debit));
            g.credit = addMoney(g.credit, toFiniteNumber(entry.credit));
            g.count += 1;
            monthGroups.set(month, g);
          }

          const monthlyTotals = Array.from(monthGroups.entries())
            .map(([month, g]) => ({
              month,
              debit: roundTo(g.debit),
              credit: roundTo(g.credit),
              net: roundTo(subtractMoney(g.debit, g.credit)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

          const totalDebitDec = sumMoney(monthlyTotals.map((m) => m.debit));
          const totalCreditDec = sumMoney(monthlyTotals.map((m) => m.credit));
          const totalDebit = roundTo(totalDebitDec);
          const totalCredit = roundTo(totalCreditDec);

          set({
            accountAnalysis: {
              accountId,
              accountCode: filtered[0]?.accountCode ?? '',
              accountName: filtered[0]?.accountName ?? '',
              monthlyTotals,
              totalDebit,
              totalCredit,
              averageBalance:
                monthlyTotals.length > 0
                  ? roundTo(
                      divideMoney(
                        subtractMoney(totalDebitDec, totalCreditDec),
                        monthlyTotals.length
                      )
                    )
                  : 0,
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

        clearData: enforce(Permissions.IMPORT_DELETE, 'clearData', async () => {
          captureGLSnapshot(get);
          // W0.8.6 §4: every COMMITTED row gets a compensating server
          // tombstone before the local wipe; drafts never reached the server
          // and simply vanish locally. A wipe with zero committed rows never
          // awaits, so purely local clears stay synchronous.
          const { entries, entrySyncState, environmentId } = get();
          const committedIds = entries
            .filter((e) => (entrySyncState[e.id] ?? 'draft') === 'committed')
            .map((e) => e.id);
          const failures =
            committedIds.length > 0
              ? await tombstoneCommittedEntries(committedIds, entrySyncState, environmentId)
              : [];

          set({
            entries: [],
            trialBalance: [],
            accountAnalysis: null,
            dateFilter: null,
            accountFilter: [],
            entrySyncState: {},
          });
          useUIStore.getState().addToast({
            type: 'info',
            title: 'GL Data Cleared',
            message: 'General ledger data has been reset',
          });

          // Local intent always wins: tombstone failures are surfaced for
          // reconciliation, never thrown past the action.
          if (failures.length > 0) {
            set({ importError: summarizeTombstoneFailures(failures) });
          }
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

        undoLastImport: enforce(Permissions.IMPORT_DELETE, 'undoLastImport', async () => {
          // W0.8.6 §4: compensating server tombstones FIRST — committed rows
          // of the batch are deleted server-side (already_deleted tolerated),
          // then the existing local undo runs. Drafts/pending/failed rows
          // never reached the server and are skipped. A batch with zero
          // committed ids never awaits, so purely local undos stay
          // synchronous.
          const { lastImportEntryIds, entrySyncState, environmentId } = get();
          const committedIds = lastImportEntryIds.filter(
            (id) => (entrySyncState[id] ?? 'draft') === 'committed'
          );
          const failures =
            committedIds.length > 0
              ? await tombstoneCommittedEntries(committedIds, entrySyncState, environmentId)
              : [];

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
            for (const id of ids) delete state.entrySyncState[id];
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
          });

          // Local intent always wins: tombstone failures land in importError
          // for reconciliation instead of blocking the undo.
          if (failures.length > 0) {
            set({ importError: summarizeTombstoneFailures(failures) });
          }
        }),

        checkDuplicates: (entries) => {
          const state = get();
          // The amount fallback (debit − credit) is currency: exact decimal
          // so the dedupe key matches the normalized stored amount (F-0006).
          const entryKey = (
            e: Pick<GLEntry, 'accountCode' | 'postDate' | 'date' | 'amount' | 'debit' | 'credit'>
          ) =>
            `${e.accountCode}|${e.postDate || e.date}|${e.amount ?? roundTo(subtractMoney(e.debit, e.credit))}`;
          const existingKeys = new Set(state.entries.map(entryKey));
          const duplicates: GLEntry[] = [];
          const newEntries: GLEntry[] = [];

          entries.forEach((e) => {
            const key = entryKey(e);
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
          entrySyncState: state.entrySyncState,
          entryVersions: state.entryVersions,
          environmentId: state.environmentId,
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
