import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGLStore, setGlCommitClient } from './glStore';
import type { GlCommitNamespace } from '@/sdk/gl/GlCommitNamespace';
import type { GlCommitResult } from '@/sdk/gl/GlCommitNamespace';
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
