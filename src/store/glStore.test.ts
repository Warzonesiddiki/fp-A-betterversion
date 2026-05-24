import { describe, it, expect, beforeEach } from 'vitest';
import { useGLStore } from './glStore';
import type { GLAccount } from '@/types';
import type { AccountType } from '@/types';

describe('glStore', () => {
  beforeEach(() => {
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

  const createAccount = (
    id: string,
    code: string,
    name: string,
    type: AccountType = 'Asset'
  ): GLAccount => ({
    id,
    code,
    name,
    type,
    category: 'Test Category',
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
  });

  const createEntry = (
    overrides: Partial<{
      id: string;
      accountId: string;
      accountCode: string;
      accountName: string;
      period: string;
      periodName: string;
      debit: number;
      credit: number;
      netChange: number;
      date: string;
      description: string;
      reference: string;
      amount: number;
    }> = {}
  ) => ({
    id: 'e1',
    accountId: 'acct-1',
    accountCode: '1010',
    accountName: 'Cash',
    period: '2024-01',
    periodName: 'January 2024',
    debit: 1000,
    credit: 0,
    netChange: 1000,
    date: '2024-01-15',
    description: 'Test entry',
    reference: 'REF-001',
    amount: 1000,
    ...overrides,
  });

  // --- Initial State ---

  it('should have correct initial state', () => {
    const s = useGLStore.getState();
    expect(s.entries).toEqual([]);
    expect(s.accounts).toEqual([]);
    expect(s.trialBalance).toEqual([]);
    expect(s.accountAnalysis).toBeNull();
    expect(s.dateFilter).toBeNull();
    expect(s.accountFilter).toEqual([]);
    expect(s.isLoading).toBe(false);
    expect(s.importProgress).toBe(0);
    expect(s.importStatus).toBe('idle');
    expect(s.importError).toBeNull();
    expect(s.lastImportResult).toBeNull();
    expect(s.importHistory).toEqual([]);
    expect(s.lastImportEntryIds).toEqual([]);
    expect(s.columnMapping).toHaveLength(6);
    expect(s.columnMapping[0].targetField).toBe('date');
  });

  // --- setAccounts ---

  it('should set accounts', () => {
    const accounts = [createAccount('a1', '1010', 'Cash')];
    useGLStore.getState().setAccounts(accounts);
    expect(useGLStore.getState().accounts).toEqual(accounts);
  });

  it('should replace accounts on subsequent calls', () => {
    const first = [createAccount('a1', '1010', 'Cash')];
    const second = [createAccount('a2', '2000', 'AP', 'Liability')];
    useGLStore.getState().setAccounts(first);
    useGLStore.getState().setAccounts(second);
    expect(useGLStore.getState().accounts).toEqual(second);
  });

  it('should set empty accounts array', () => {
    useGLStore.getState().setAccounts([]);
    expect(useGLStore.getState().accounts).toEqual([]);
  });

  // --- setEntries ---

  it('should set entries and reset trialBalance and accountAnalysis', () => {
    useGLStore.setState({
      trialBalance: [
        {
          accountId: 'a1',
          accountCode: '1010',
          accountName: 'Cash',
          accountType: 'Asset',
          beginningBalance: 0,
          debit: 1000,
          credit: 0,
          netChange: 1000,
          endingBalance: 1000,
        },
      ],
      accountAnalysis: {
        accountId: 'a1',
        accountCode: '1010',
        accountName: 'Cash',
        monthlyTotals: [],
        totalDebit: 1000,
        totalCredit: 0,
        averageBalance: 1000,
        transactionCount: 1,
      },
    });
    const entries = [createEntry()];
    useGLStore.getState().setEntries(entries);
    const state = useGLStore.getState();
    expect(state.entries).toEqual(entries);
    expect(state.trialBalance).toEqual([]);
    expect(state.accountAnalysis).toBeNull();
  });

  it('should set empty entries', () => {
    useGLStore.getState().setEntries([]);
    expect(useGLStore.getState().entries).toEqual([]);
  });

  // --- addEntry ---

  it('should add an entry with generated id', async () => {
    const id = `gl-${Date.now()}`;
    const entry = {
      id: 'e-new-1',
      accountId: 'acct-1',
      accountCode: '1010',
      accountName: 'Cash',
      period: '2024-01',
      periodName: 'January 2024',
      debit: 500,
      credit: 0,
      netChange: 500,
      amount: 500,
      date: '2024-01-15',
      description: 'Sale',
      reference: 'INV-001',
    };
    useGLStore.getState().addEntry(entry);
    const state = useGLStore.getState();
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].accountId).toBe('acct-1');
    expect(state.entries[0].debit).toBe(500);
    expect(state.entries[0].description).toBe('Sale');
  });

  it('should append entries on multiple addEntry calls', () => {
    useGLStore.getState().addEntry({
      id: 'e-new-1',
      accountId: 'acct-1',
      accountCode: '1010',
      accountName: 'Cash',
      period: '2024-01',
      periodName: 'January 2024',
      debit: 500,
      credit: 0,
      netChange: 500,
      amount: 500,
      date: '2024-01-15',
      description: 'Sale',
      reference: 'INV-001',
    });
    useGLStore.getState().addEntry({
      id: 'e-new-2',
      accountId: 'acct-2',
      accountCode: '2000',
      accountName: 'AP',
      period: '2024-01',
      periodName: 'January 2024',
      debit: 0,
      credit: 300,
      netChange: -300,
      amount: 300,
      date: '2024-01-16',
      description: 'Purchase',
      reference: 'PO-001',
    });
    expect(useGLStore.getState().entries).toHaveLength(2);
  });

  // --- generateTrialBalance ---

  it('should generate trial balance from entries and accounts', () => {
    const account = createAccount('acct-1', '1010', 'Cash');
    const entry = createEntry();
    useGLStore.setState({ accounts: [account], entries: [entry] });
    useGLStore.getState().generateTrialBalance();
    const { trialBalance, isLoading } = useGLStore.getState();
    expect(isLoading).toBe(false);
    expect(trialBalance).toHaveLength(1);
    expect(trialBalance[0].accountId).toBe('acct-1');
    expect(trialBalance[0].debit).toBe(1000);
    expect(trialBalance[0].credit).toBe(0);
    expect(trialBalance[0].netChange).toBe(1000);
    expect(trialBalance[0].endingBalance).toBe(1000);
  });

  it('should aggregate multiple entries per account in trial balance', () => {
    const account = createAccount('acct-1', '1010', 'Cash');
    const entries = [
      createEntry({ id: 'e1', debit: 1000, credit: 0, netChange: 1000 }),
      createEntry({ id: 'e2', debit: 500, credit: 0, netChange: 500 }),
    ];
    useGLStore.setState({ accounts: [account], entries });
    useGLStore.getState().generateTrialBalance();
    const { trialBalance } = useGLStore.getState();
    expect(trialBalance).toHaveLength(1);
    expect(trialBalance[0].debit).toBe(1500);
    expect(trialBalance[0].netChange).toBe(1500);
  });

  it('should generate empty trial balance with no entries', () => {
    useGLStore.getState().generateTrialBalance();
    const { trialBalance, isLoading } = useGLStore.getState();
    expect(trialBalance).toEqual([]);
    expect(isLoading).toBe(false);
  });

  it('should set isLoading during trial balance generation', () => {
    useGLStore.getState().generateTrialBalance();
    expect(useGLStore.getState().isLoading).toBe(false);
  });

  // --- analyzeAccount ---

  it('should analyze account with monthly totals', () => {
    const entries = [
      createEntry({
        id: 'e1',
        accountId: 'acct-1',
        accountCode: '1010',
        accountName: 'Cash',
        period: '2024-01',
        debit: 1000,
        credit: 0,
        netChange: 1000,
      }),
      createEntry({
        id: 'e2',
        accountId: 'acct-1',
        accountCode: '1010',
        accountName: 'Cash',
        period: '2024-02',
        debit: 500,
        credit: 200,
        netChange: 300,
      }),
    ];
    useGLStore.setState({ entries });
    useGLStore.getState().analyzeAccount('acct-1');
    const { accountAnalysis, isLoading } = useGLStore.getState();
    expect(isLoading).toBe(false);
    expect(accountAnalysis).not.toBeNull();
    expect(accountAnalysis!.accountId).toBe('acct-1');
    expect(accountAnalysis!.transactionCount).toBe(2);
    expect(accountAnalysis!.monthlyTotals).toHaveLength(2);
    expect(accountAnalysis!.totalDebit).toBe(1500);
    expect(accountAnalysis!.totalCredit).toBe(200);
  });

  it('should return empty analysis for non-matching account', () => {
    useGLStore.setState({ entries: [createEntry()] });
    useGLStore.getState().analyzeAccount('non-existent');
    const { accountAnalysis, isLoading } = useGLStore.getState();
    expect(isLoading).toBe(false);
    expect(accountAnalysis).not.toBeNull();
    expect(accountAnalysis!.transactionCount).toBe(0);
    expect(accountAnalysis!.monthlyTotals).toEqual([]);
  });

  // --- Filters ---

  it('should set date filter', () => {
    useGLStore.getState().filterByDate('2024-01-01', '2024-01-31');
    expect(useGLStore.getState().dateFilter).toEqual({ start: '2024-01-01', end: '2024-01-31' });
  });

  it('should set account filter', () => {
    useGLStore.getState().filterByAccount(['acct-1', 'acct-2']);
    expect(useGLStore.getState().accountFilter).toEqual(['acct-1', 'acct-2']);
  });

  it('should set account filter with empty array', () => {
    useGLStore.getState().filterByAccount([]);
    expect(useGLStore.getState().accountFilter).toEqual([]);
  });

  it('should clear both filters', () => {
    useGLStore.getState().filterByDate('2024-01-01', '2024-01-31');
    useGLStore.getState().filterByAccount(['acct-1']);
    useGLStore.getState().clearFilters();
    const state = useGLStore.getState();
    expect(state.dateFilter).toBeNull();
    expect(state.accountFilter).toEqual([]);
  });

  // --- clearData ---

  it('should clear entries, trial balance, account analysis, and filters', () => {
    useGLStore.setState({
      entries: [createEntry()],
      trialBalance: [
        {
          accountId: 'a1',
          accountCode: '1010',
          accountName: 'Cash',
          accountType: 'Asset',
          beginningBalance: 0,
          debit: 1000,
          credit: 0,
          netChange: 1000,
          endingBalance: 1000,
        },
      ],
      accountAnalysis: {
        accountId: 'a1',
        accountCode: '1010',
        accountName: 'Cash',
        monthlyTotals: [],
        totalDebit: 0,
        totalCredit: 0,
        averageBalance: 0,
        transactionCount: 0,
      },
      dateFilter: { start: '2024-01-01', end: '2024-01-31' },
      accountFilter: ['acct-1'],
    });
    useGLStore.getState().clearData();
    const state = useGLStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.trialBalance).toEqual([]);
    expect(state.accountAnalysis).toBeNull();
    expect(state.dateFilter).toBeNull();
    expect(state.accountFilter).toEqual([]);
  });

  // --- Import Progress ---

  it('should set import progress', () => {
    useGLStore.getState().setImportProgress(50);
    expect(useGLStore.getState().importProgress).toBe(50);
  });

  it('should clamp import progress to 0 minimum', () => {
    useGLStore.getState().setImportProgress(-10);
    expect(useGLStore.getState().importProgress).toBe(0);
  });

  it('should clamp import progress to 100 maximum', () => {
    useGLStore.getState().setImportProgress(150);
    expect(useGLStore.getState().importProgress).toBe(100);
  });

  // --- Import Status ---

  it('should set import status and clear error for non-error status', () => {
    useGLStore.setState({ importError: 'previous error' });
    useGLStore.getState().setImportStatus('complete');
    const state = useGLStore.getState();
    expect(state.importStatus).toBe('complete');
    expect(state.importError).toBeNull();
  });

  it('should set import status to error and preserve existing error', () => {
    useGLStore.setState({ importError: 'something went wrong' });
    useGLStore.getState().setImportStatus('error');
    expect(useGLStore.getState().importStatus).toBe('error');
    expect(useGLStore.getState().importError).toBe('something went wrong');
  });

  // --- Import Error ---

  it('should set import error and set status to error', () => {
    useGLStore.getState().setImportError('file format invalid');
    const state = useGLStore.getState();
    expect(state.importError).toBe('file format invalid');
    expect(state.importStatus).toBe('error');
  });

  it('should clear import error when set to null', () => {
    useGLStore.setState({ importError: 'previous error', importStatus: 'error' });
    useGLStore.getState().setImportError(null);
    const state = useGLStore.getState();
    expect(state.importError).toBeNull();
    expect(state.importStatus).toBe('error');
  });

  // --- recordImport ---

  it('should record import to history and set lastImportResult', () => {
    const result = {
      filename: 'ledger.csv',
      rowCount: 100,
      errorCount: 2,
      warningCount: 1,
      successCount: 98,
      status: 'partial' as const,
    };
    useGLStore.getState().recordImport(result);
    const state = useGLStore.getState();
    expect(state.importHistory).toHaveLength(1);
    expect(state.importHistory[0].filename).toBe('ledger.csv');
    expect(state.importHistory[0].rowCount).toBe(100);
    expect(state.importHistory[0].status).toBe('partial');
    expect(state.importHistory[0].id).toMatch(/^import-/);
    expect(state.importHistory[0].timestamp).toBeDefined();
    expect(state.lastImportResult).not.toBeNull();
    expect(state.lastImportResult!.filename).toBe('ledger.csv');
    expect(state.lastImportResult!.timestamp).toBeDefined();
    expect(state.importStatus).toBe('complete');
    expect(state.importProgress).toBe(100);
  });

  it('should prepend new imports to history', () => {
    useGLStore.getState().recordImport({
      filename: 'first.csv',
      rowCount: 10,
      errorCount: 0,
      warningCount: 0,
      successCount: 10,
      status: 'success',
    });
    useGLStore.getState().recordImport({
      filename: 'second.csv',
      rowCount: 20,
      errorCount: 1,
      warningCount: 0,
      successCount: 19,
      status: 'partial',
    });
    expect(useGLStore.getState().importHistory).toHaveLength(2);
    expect(useGLStore.getState().importHistory[0].filename).toBe('second.csv');
  });

  // --- undoLastImport ---

  it('should undo last import by removing entries', () => {
    useGLStore.setState({
      entries: [
        createEntry({ id: 'e1' }),
        createEntry({ id: 'e2', description: 'imported' }),
        createEntry({ id: 'e3', description: 'existing' }),
      ],
      lastImportEntryIds: ['e2'],
      lastImportResult: {
        filename: 'test.csv',
        rowCount: 1,
        errorCount: 0,
        warningCount: 0,
        successCount: 1,
        status: 'success',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    });
    useGLStore.getState().undoLastImport();
    const state = useGLStore.getState();
    expect(state.entries).toHaveLength(2);
    expect(state.entries.find((e) => e.id === 'e2')).toBeUndefined();
    expect(state.lastImportEntryIds).toEqual([]);
    expect(state.lastImportResult).toBeNull();
  });

  it('should undo last import with no entries removed when lastImportEntryIds empty', () => {
    useGLStore.setState({
      entries: [createEntry({ id: 'e1' })],
      lastImportEntryIds: [],
      lastImportResult: {
        filename: 'test.csv',
        rowCount: 1,
        errorCount: 0,
        warningCount: 0,
        successCount: 1,
        status: 'success',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    });
    useGLStore.getState().undoLastImport();
    const state = useGLStore.getState();
    expect(state.entries).toHaveLength(1);
    expect(state.lastImportResult).toBeNull();
  });

  // --- checkDuplicates ---

  it('should detect duplicate entries based on accountCode|date|amount key', () => {
    useGLStore.setState({ entries: [createEntry({ id: 'e1' })] });
    const incoming = [createEntry({ id: 'e2', description: 'duplicate' })];
    const result = useGLStore.getState().checkDuplicates(incoming);
    expect(result.duplicates).toBe(1);
    expect(result.newEntries).toHaveLength(0);
  });

  it('should treat entries with different amounts as non-duplicates', () => {
    useGLStore.setState({
      entries: [createEntry({ id: 'e1', debit: 1000, credit: 0, amount: 1000 })],
    });
    const incoming = [createEntry({ id: 'e2', debit: 2000, credit: 0, amount: 2000 })];
    const result = useGLStore.getState().checkDuplicates(incoming);
    expect(result.duplicates).toBe(0);
    expect(result.newEntries).toHaveLength(1);
  });

  it('should return all new entries when no existing entries', () => {
    const incoming = [
      createEntry(),
      createEntry({ id: 'e2', accountCode: '2000', description: 'second' }),
    ];
    const result = useGLStore.getState().checkDuplicates(incoming);
    expect(result.duplicates).toBe(0);
    expect(result.newEntries).toHaveLength(2);
  });

  it('should return empty results for empty input', () => {
    const result = useGLStore.getState().checkDuplicates([]);
    expect(result.duplicates).toBe(0);
    expect(result.newEntries).toEqual([]);
  });

  // --- updateColumnMapping ---

  it('should update column mapping', () => {
    const mapping = [{ sourceColumn: 'Date', targetField: 'date', isRequired: true }];
    useGLStore.getState().updateColumnMapping(mapping);
    expect(useGLStore.getState().columnMapping).toEqual(mapping);
  });

  it('should replace entire column mapping', () => {
    useGLStore.getState().updateColumnMapping([]);
    expect(useGLStore.getState().columnMapping).toEqual([]);
  });
});
