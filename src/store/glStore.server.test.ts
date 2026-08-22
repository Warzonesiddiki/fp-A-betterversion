import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGLStore, setGlCommitClient } from './glStore';
import type { GlCommitNamespace } from '@/sdk/gl/GlCommitNamespace';
import type { GlCommitResult, GlListResult } from '@/sdk/gl/GlCommitNamespace';
import { actAs } from '@/test/rbacFixtures';

function makeEntry(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    accountId: `acc-${id}`,
    accountCode: `1000-${id}`,
    accountName: `Account ${id}`,
    period: '2026-01',
    periodName: '2026-01',
    date: '2026-01-31',
    postDate: '2026-01-31',
    debit: 100,
    credit: 0,
    netChange: 100,
    amount: 100,
    description: '',
    reference: '',
    ...overrides,
  };
}

type CommitFn = ReturnType<GlCommitNamespace['createJournalBatch']>;

function fakeClient(
  impl: (input: {
    batch: unknown;
    idempotencyKey: string;
  }) => Promise<GlCommitResult<readonly { id: string; version: number }[]>>
): GlCommitNamespace {
  return {
    createJournalBatch: (input) =>
      impl(input as { batch: unknown; idempotencyKey: string }) as Promise<CommitFn>,
  } as unknown as GlCommitNamespace;
}

describe('glStore server-authoritative commit path (W0.8.6 spike)', () => {
  beforeEach(() => {
    actAs('Admin');
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
      entrySyncState: {},
      entryVersions: {},
      environmentId: 'dev',
    });
  });

  it('commits drafts and resolves them to server UUIDs + versions (G6)', async () => {
    const calls: { batch: unknown; idempotencyKey: string }[] = [];
    setGlCommitClient(
      fakeClient((input) => {
        calls.push(input);
        return Promise.resolve({
          status: 'committed',
          value: [
            { id: '0b9e6c1a-0001-4000-8000-000000000001', version: 1 },
            { id: '0b9e6c1a-0002-4000-8000-000000000002', version: 1 },
          ],
        });
      })
    );

    const { addEntries, commitDraftsToServer } = useGLStore.getState();
    addEntries([
      makeEntry('gl-1700000000-0'),
      makeEntry('gl-1700000000-1', { debit: 0, credit: 100, netChange: -100, amount: -100 }),
    ]);
    expect(useGLStore.getState().entrySyncState['gl-1700000000-0'] ?? 'draft').toBe('draft');

    const summary = await commitDraftsToServer();

    expect(summary).toEqual({ committed: 2, failed: 0, conflicts: [] });
    expect(calls).toHaveLength(1);
    // K27/K25: atomic batch carries an idempotency key and the env context.
    expect(calls[0]!.idempotencyKey).toContain('gl-dev-');
    expect((calls[0]!.batch as { environmentId: string }).environmentId).toBe('dev');

    const state = useGLStore.getState();
    // Server identity replaces the client-generated ids entirely.
    expect(state.entries.map((e) => e.id)).toEqual([
      '0b9e6c1a-0001-4000-8000-000000000001',
      '0b9e6c1a-0002-4000-8000-000000000002',
    ]);
    expect(state.entries.some((e) => e.id.startsWith('gl-'))).toBe(false);
    // Sync state and If-Match versions are keyed by SERVER id.
    expect(state.entrySyncState['0b9e6c1a-0001-4000-8000-000000000001']).toBe('committed');
    expect(state.entryVersions['0b9e6c1a-0001-4000-8000-000000000001']).toBe(1);
    expect(state.entrySyncState['gl-1700000000-0']).toBeUndefined();
    // Batch token remaps so undoLastImport targets the server rows.
    expect(state.lastImportEntryIds).toEqual([
      '0b9e6c1a-0001-4000-8000-000000000001',
      '0b9e6c1a-0002-4000-8000-000000000002',
    ]);

    // A second drain finds no drafts — retries cannot double-post.
    const retry = await commitDraftsToServer();
    expect(retry).toEqual({ committed: 0, failed: 0, conflicts: [] });
    expect(calls).toHaveLength(1);
  });

  it('fails closed when the server acknowledges a different arity than sent', async () => {
    setGlCommitClient(
      fakeClient(() =>
        Promise.resolve({
          status: 'committed',
          value: [{ id: 'srv-only-one', version: 1 }], // sent 2 lines
        })
      )
    );

    const { addEntries, commitDraftsToServer } = useGLStore.getState();
    addEntries([
      makeEntry('e1'),
      makeEntry('e2', { debit: 0, credit: 100, netChange: -100, amount: -100 }),
    ]);

    const summary = await commitDraftsToServer();

    // Identity is unknowable → nothing may be marked committed or remapped.
    expect(summary.committed).toBe(0);
    expect(summary.failed).toBe(2);
    expect(useGLStore.getState().importError).toContain('failed server commit');
    const state = useGLStore.getState();
    expect(state.entries.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(state.entrySyncState.e1).toBe('failed');
    expect(state.entryVersions).toEqual({});
  });

  it('marks entries failed on FP-0400 conflict without throwing (K27)', async () => {
    setGlCommitClient(
      fakeClient(() =>
        Promise.resolve({
          status: 'conflict',
          conflict: { code: 'FP-0400', message: 'stale revision', serverVersion: 7 },
        })
      )
    );

    const { addEntries, commitDraftsToServer } = useGLStore.getState();
    addEntries([
      makeEntry('e1'),
      makeEntry('e2', { debit: 0, credit: 100, netChange: -100, amount: -100 }),
    ]);

    const summary = await commitDraftsToServer();

    expect(summary.committed).toBe(0);
    expect(summary.failed).toBe(2);
    expect(summary.conflicts[0]?.code).toBe('FP-0400');
    expect(useGLStore.getState().entrySyncState.e1).toBe('failed');
  });

  it('rejects locally unbalanced journals before any network call (F-0004 pre-flight)', async () => {
    const commit = vi.fn();
    setGlCommitClient({ createJournalBatch: commit } as unknown as GlCommitNamespace);

    const { addEntries, commitDraftsToServer } = useGLStore.getState();
    addEntries([makeEntry('e1'), makeEntry('e2')]); // both debits — unbalanced

    const summary = await commitDraftsToServer();

    expect(commit).not.toHaveBeenCalled();
    expect(summary.failed).toBe(2);
    expect(summary.conflicts[0]?.code).toBe('FP-0002');
    expect(useGLStore.getState().importError).toContain('failed server commit');
  });

  it('no-op when there are no drafts', async () => {
    const commit = vi.fn();
    setGlCommitClient({ createJournalBatch: commit } as unknown as GlCommitNamespace);

    const summary = await useGLStore.getState().commitDraftsToServer();

    expect(summary).toEqual({ committed: 0, failed: 0, conflicts: [] });
    expect(commit).not.toHaveBeenCalled();
  });

  it('setEnvironmentId updates the commit context', () => {
    useGLStore.getState().setEnvironmentId('prod');
    expect(useGLStore.getState().environmentId).toBe('prod');
  });
});

type ListFn = ReturnType<GlCommitNamespace['listEntries']>;

/** Mirror of fakeClient for the read path (W0.8.6 boot hydrate). */
function fakeListClient(
  impl: (input: { environmentId: string }) => Promise<GlListResult>
): GlCommitNamespace {
  return {
    listEntries: (input) => impl(input as { environmentId: string }) as Promise<ListFn>,
  } as unknown as GlCommitNamespace;
}

describe('glStore boot hydrate — hydrateCommittedFromServer (W0.8.6 plan §5)', () => {
  beforeEach(() => {
    actAs('Admin');
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
      entrySyncState: {},
      entryVersions: {},
      environmentId: 'dev',
    });
  });

  it('preserves draft/failed/untracked locals on id collision (K25 retention, K27 no silent loss)', async () => {
    const calls: { environmentId: string }[] = [];
    setGlCommitClient(
      fakeListClient((input) => {
        calls.push(input);
        return Promise.resolve({
          status: 'listed',
          entries: [
            {
              id: 'srv-draft',
              version: 5,
              accountCode: '9999',
              postDate: '2026-02-01',
              debit: 777,
              credit: 0,
            },
            {
              id: 'srv-failed',
              version: 2,
              accountCode: '8888',
              postDate: '2026-02-01',
              debit: 55,
              credit: 0,
            },
            // No local syncState record → defaults to 'draft' → protected.
            {
              id: 'srv-untracked',
              version: 9,
              accountCode: '7777',
              postDate: '2026-02-01',
              debit: 1,
              credit: 0,
            },
          ],
        });
      })
    );

    const { addEntries } = useGLStore.getState();
    addEntries([makeEntry('srv-draft'), makeEntry('srv-failed'), makeEntry('srv-untracked')]);
    useGLStore.setState({ entrySyncState: { 'srv-draft': 'draft', 'srv-failed': 'failed' } });

    const beforeEntries = useGLStore.getState().entries;
    const summary = await useGLStore.getState().hydrateCommittedFromServer();

    expect(summary).toEqual({ hydrated: 0 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.environmentId).toBe('dev');

    const after = useGLStore.getState();
    expect(after.entries).toEqual(beforeEntries); // amounts untouched (no 777)
    expect(after.entryVersions).toEqual({}); // no version capture for protected rows
    expect(after.entrySyncState['srv-draft']).toBe('draft');
    expect(after.entrySyncState['srv-failed']).toBe('failed');
    expect(after.entrySyncState['srv-untracked']).toBeUndefined();
  });

  it('overwrites committed locals with server values + versions and adopts absent ids', async () => {
    setGlCommitClient(
      fakeListClient(({ environmentId }) => {
        expect(environmentId).toBe('prod');
        return Promise.resolve({
          status: 'listed',
          entries: [
            {
              id: 'srv-committed',
              version: 4,
              accountId: 'acc-upstream',
              accountCode: '1001',
              postDate: '2026-03-15',
              debit: 250.5,
              credit: 0,
              description: 'amended upstream',
              reference: 'REF-9',
            },
            {
              id: 'srv-new',
              version: 1,
              accountCode: '4000',
              postDate: '2026-03-20',
              debit: 0,
              credit: 90,
            },
          ],
        });
      })
    );

    useGLStore.getState().setEnvironmentId('prod');
    const { addEntries } = useGLStore.getState();
    addEntries([makeEntry('srv-committed', { description: 'stale local copy' })]);
    useGLStore.setState({
      entrySyncState: { 'srv-committed': 'committed' },
      entryVersions: { 'srv-committed': 2 },
    });

    const summary = await useGLStore.getState().hydrateCommittedFromServer();

    expect(summary).toEqual({ hydrated: 2 });

    const state = useGLStore.getState();
    const updated = state.entries.find((e) => e.id === 'srv-committed');
    expect(updated?.debit).toBe(250.5);
    expect(updated?.netChange).toBe(250.5);
    expect(updated?.description).toBe('amended upstream');
    expect(updated?.reference).toBe('REF-9');
    expect(updated?.date).toBe('2026-03-15');
    expect(updated?.period).toBe('2026-03'); // re-derived from the merged date
    expect(state.entrySyncState['srv-committed']).toBe('committed');
    expect(state.entryVersions['srv-committed']).toBe(4);

    // Absent id → adopted as a committed replica row.
    const adopted = state.entries.find((e) => e.id === 'srv-new');
    expect(adopted?.credit).toBe(90);
    expect(adopted?.amount).toBe(-90);
    expect(state.entrySyncState['srv-new']).toBe('committed');
    expect(state.entryVersions['srv-new']).toBe(1);

    // Hydration is not an import: it must not touch the import batch token
    // (still whatever addEntries recorded) nor adopt server ids into it.
    expect(state.lastImportEntryIds).toEqual(['srv-committed']);
  });

  it('empty server listing leaves the store completely untouched', async () => {
    setGlCommitClient(fakeListClient(() => Promise.resolve({ status: 'listed', entries: [] })));

    const { addEntries } = useGLStore.getState();
    addEntries([
      makeEntry('e1'),
      makeEntry('e2', { debit: 0, credit: 100, netChange: -100, amount: -100 }),
    ]);
    useGLStore.setState({
      entrySyncState: { e1: 'committed', e2: 'draft' },
      entryVersions: { e1: 2 },
    });

    const before = useGLStore.getState();
    const summary = await useGLStore.getState().hydrateCommittedFromServer();

    expect(summary).toEqual({ hydrated: 0 });
    const after = useGLStore.getState();
    expect(after.entries).toEqual(before.entries);
    expect(after.entrySyncState).toEqual(before.entrySyncState);
    expect(after.entryVersions).toEqual(before.entryVersions);
    expect(after.trialBalance).toEqual(before.trialBalance);
  });

  it('server failure surfaces as {hydrated:0} without mutating anything', async () => {
    setGlCommitClient(
      fakeListClient(() =>
        Promise.resolve({ status: 'error', message: 'network unreachable' } as GlListResult)
      )
    );

    const { addEntries } = useGLStore.getState();
    addEntries([makeEntry('e1')]);
    useGLStore.setState({ entrySyncState: { e1: 'committed' }, entryVersions: { e1: 2 } });

    const before = useGLStore.getState();
    const summary = await useGLStore.getState().hydrateCommittedFromServer();

    expect(summary).toEqual({ hydrated: 0 });
    expect(useGLStore.getState().entries).toEqual(before.entries);
    expect(useGLStore.getState().entryVersions).toEqual({ e1: 2 });
  });
});
