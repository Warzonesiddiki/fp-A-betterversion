import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGLStore, setGlCommitClient } from './glStore';
import { usePeriodCloseStore } from './periodCloseStore';
import { PeriodCloseStateMachine } from '@/engines/PeriodCloseStateMachine';
import { actAs } from '@/test/rbacFixtures';
import type { FiscalPeriod, GLEntry } from '@/types';
import type { GlCommitNamespace } from '@/sdk/gl/GlCommitNamespace';

const PERIOD: FiscalPeriod = {
  id: 'retail',
  year: 2026,
  periodNumber: 1,
  name: 'Retail P1',
  startDate: '2025-12-29',
  endDate: '2026-01-25',
  periodType: 'Monthly',
  isAdjustingPeriod: false,
  isClosed: false,
  closedAt: null,
  closedBy: null,
};
function journal(date = '2026-01-15'): GLEntry[] {
  return [
    {
      id: 'd',
      accountId: '1000',
      accountCode: '1000',
      accountName: 'Cash',
      debit: 100,
      credit: 0,
      netChange: 100,
      amount: 100,
    },
    {
      id: 'c',
      accountId: '4000',
      accountCode: '4000',
      accountName: 'Sales',
      debit: 0,
      credit: 100,
      netChange: -100,
      amount: -100,
    },
  ].map((r) => ({
    ...r,
    date,
    postDate: date,
    period: date.slice(0, 7),
    periodName: date.slice(0, 7),
    description: '',
    reference: '',
  }));
}
function lock(state: 'open' | 'soft-close' | 'hard-close' | 'locked' = 'locked') {
  const e = usePeriodCloseStore.getState().entries.retail!;
  usePeriodCloseStore.setState({ entries: { retail: { ...e, state } } });
}
const deleteEntry = vi.fn();
const createJournalBatch = vi.fn();
const listEntries = vi.fn();
const financialKeys = [
  'entries',
  'importHistory',
  'lastImportEntryIds',
  'entrySyncState',
  'entryVersions',
  'lastImportResult',
  'trialBalance',
  'accountAnalysis',
] as const;
function expectFinancialStateUnchanged(before: ReturnType<typeof useGLStore.getState>) {
  for (const key of financialKeys) expect(useGLStore.getState()[key], key).toBe(before[key]);
}

beforeEach(async () => {
  actAs('Admin');
  await vi.waitFor(() => expect(usePeriodCloseStore.persist.hasHydrated()).toBe(true));
  usePeriodCloseStore.setState({ entries: {}, checklists: {}, chain: [], initialized: false });
  usePeriodCloseStore.getState().initialize([PERIOD], 'US-GAAP', 'E1');
  useGLStore.setState({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    importHistory: [],
    lastImportEntryIds: [],
    entrySyncState: {},
    entryVersions: {},
    importStatus: 'idle',
    importError: null,
    lastImportResult: null,
  });
  deleteEntry.mockReset().mockResolvedValue({ status: 'committed' });
  createJournalBatch.mockReset().mockResolvedValue({ status: 'committed', value: [] });
  listEntries.mockReset().mockResolvedValue({ status: 'listed', entries: [] });
  setGlCommitClient({
    deleteEntry,
    createJournalBatch,
    listEntries,
  } as unknown as GlCommitNamespace);
});
afterEach(() => {
  vi.restoreAllMocks();
  setGlCommitClient(null);
});

describe('DEC-008 GL write guards', () => {
  it.each(['soft-close', 'hard-close', 'locked'] as const)(
    'rejects an import into %s atomically, including Admin',
    (state) => {
      lock(state);
      const before = useGLStore.getState();
      const history = before.getHistoryLength();
      const result = before.importGLData(journal(), 'GL.csv', { sourceRows: [11, 13] });
      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.rejections?.map((r) => r.row)).toEqual([11, 13]);
      expectFinancialStateUnchanged(before);
      expect(useGLStore.getState().getHistoryLength()).toBe(history);
    }
  );
  it('allows the same file after an authorized audited reopen', async () => {
    await usePeriodCloseStore.getState().transition('retail', 'soft-close', 'close');
    expect(useGLStore.getState().importGLData(journal(), 'GL.csv').success).toBe(false);
    const reopen = await usePeriodCloseStore
      .getState()
      .transition('retail', 'reopen', 'approved correction');
    expect(reopen.success).toBe(true);
    expect(useGLStore.getState().importGLData(journal(), 'GL.csv').success).toBe(true);
  });
  it('allows writes outside the actual closed fiscal range', () => {
    lock();
    expect(useGLStore.getState().importGLData(journal('2026-01-26'), 'GL.csv').success).toBe(true);
  });
  it('rejects while the period authority is not hydrated', () => {
    vi.spyOn(usePeriodCloseStore.persist, 'hasHydrated').mockReturnValue(false);
    const before = useGLStore.getState();
    const result = before.importGLData(journal(), 'GL.csv');
    expect(result.success).toBe(false);
    expect(result.rejections?.[0]?.row).toBe(0);
    expectFinancialStateUnchanged(before);
  });
  it.each(['addEntry', 'addEntries', 'setEntries'] as const)(
    'guards %s before capturing undo or mutating entries',
    (action) => {
      lock();
      const before = useGLStore.getState();
      const history = before.getHistoryLength();
      before[action](journal());
      expectFinancialStateUnchanged(before);
      expect(useGLStore.getState().getHistoryLength()).toBe(history);
      expect(useGLStore.getState().importError).toMatch(/audited reopen/);
    }
  );
  it('cannot move closed rows to an open date through wholesale replacement', () => {
    useGLStore.setState({ entries: journal() });
    lock();
    const before = useGLStore.getState();
    before.setEntries(journal('2026-01-26'));
    expectFinancialStateUnchanged(before);
  });
  it.each(['clearData', 'undoLastImport'] as const)(
    'blocks %s before any server tombstone or local mutation',
    async (action) => {
      useGLStore.setState({
        entries: journal(),
        lastImportEntryIds: ['d', 'c'],
        entrySyncState: { d: 'committed', c: 'committed' },
      });
      lock();
      const before = useGLStore.getState();
      const history = before.getHistoryLength();
      await before[action]();
      expect(deleteEntry).not.toHaveBeenCalled();
      expectFinancialStateUnchanged(before);
      expect(useGLStore.getState().getHistoryLength()).toBe(history);
    }
  );
  it('blocked undo does not consume history, and works after reopen', () => {
    useGLStore.getState().addEntries(journal());
    lock();
    const before = useGLStore.getState();
    const history = before.getHistoryLength();
    before.undo();
    expectFinancialStateUnchanged(before);
    expect(before.getHistoryLength()).toBe(history);
    lock('open');
    useGLStore.getState().undo();
    expect(useGLStore.getState().entries).toHaveLength(0);
  });
  it('blocked redo cannot reinsert closed-period rows or consume its snapshot', () => {
    useGLStore.setState({ entries: journal() });
    useGLStore.getState().setEntries([]); // snapshot contains rows
    useGLStore.getState().undo(); // snapshot is now also available for redo
    useGLStore.setState({ entries: [] });
    lock();
    const before = useGLStore.getState();
    before.redo();
    expectFinancialStateUnchanged(before);
    expect(before.canRedo()).toBe(true);
    lock('open');
    useGLStore.getState().redo();
    expect(useGLStore.getState().entries).toHaveLength(2);
  });
  it('does not publish closed-period drafts to the server', async () => {
    useGLStore.setState({ entries: journal() });
    lock();
    const before = useGLStore.getState();
    const result = await before.commitDraftsToServer();
    expect(result.committed).toBe(0);
    expect(result.failed).toBe(2);
    expect(createJournalBatch).not.toHaveBeenCalled();
    expectFinancialStateUnchanged(before);
  });
  it('does not hydrate server insertions into closed periods', async () => {
    lock();
    listEntries.mockResolvedValue({
      status: 'listed',
      entries: journal().map((r) => ({ ...r, version: 1 })),
    });
    const before = useGLStore.getState();
    expect((await before.hydrateCommittedFromServer()).hydrated).toBe(0);
    expectFinancialStateUnchanged(before);
  });
  it('rejects legacy close records without dates instead of guessing from period ID', () => {
    usePeriodCloseStore.setState({
      entries: {
        retail: { ...PeriodCloseStateMachine.createEntry('retail', 'E1'), state: 'locked' },
      },
      checklists: {},
    });
    expect(useGLStore.getState().importGLData(journal(), 'GL.csv').success).toBe(false);
    expect(useGLStore.getState().entries).toHaveLength(0);
  });
});
