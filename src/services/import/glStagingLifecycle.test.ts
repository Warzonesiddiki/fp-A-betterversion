import { afterEach, describe, expect, it } from 'vitest';
import { SmartImportMapper } from '@/engines/SmartImportMapper';
import { resetClock, setClock } from '@/utils/clock';
import { BackupRestore } from '@/utils/backupRestore';
import { masterStorage } from '@/utils/masterStorage';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import {
  stageGLImport,
  discoverStagingSessions,
  recoverStagingSessions,
  discardStagingBatch,
  readStagingQuarantinePage,
} from './glStagingCoordinator';

const config = {
  headers: ['Account', 'Date', 'Debit', 'Credit', 'Entity', 'Currency', 'Voucher'],
  sourceId: 'ERP-october',
  knownAccountCodes: ['1000', '4000'],
  knownEntityIds: ['P'],
  expectedCurrency: 'USD',
  dateOrder: 'MDY' as const,
};

const makeRow = (credit = false, extra: Record<string, string> = {}) => ({
  Account: credit ? '4000' : '1000',
  Date: '2026-10-15',
  Debit: credit ? '' : '250.55',
  Credit: credit ? '250.55' : '',
  Entity: 'P',
  Currency: 'USD',
  Voucher: 'V-100',
  ...extra,
});

function createMemoryPort() {
  const values = new Map<string, unknown>();
  const port: StagingStoragePort = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, structuredClone(value));
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
  return { port, values };
}

const compute = async (input: Parameters<typeof SmartImportMapper.ingest>[0]) =>
  SmartImportMapper.ingest(input);

async function* chunks(...data: Record<string, string>[][]) {
  yield* data;
}

const hash = 'b'.repeat(64);

describe('GL staging lifecycle — discovery, quarantine review, discard, recovery & locking', () => {
  afterEach(() => {
    resetClock();
  });

  it('discovers persisted sessions after restart and distinguishes ready, blocked, failed, incomplete, and orphaned states', async () => {
    setClock(() => new Date('2026-10-16T10:00:00.000Z'));
    const { port, values } = createMemoryPort();
    const repository = createGLStagingRepository(port);

    // 1. Ready session
    await stageGLImport(
      {
        batchId: 'batch-ready',
        fileHash: hash,
        config,
        chunks: chunks([makeRow(), makeRow(true)]),
      },
      { repository, compute }
    );

    // 2. Blocked session (quarantined row)
    await stageGLImport(
      {
        batchId: 'batch-blocked',
        fileHash: hash,
        config,
        chunks: chunks([makeRow(), makeRow(true, { Account: '9999' })]),
      },
      { repository, compute }
    );

    // 3. Failed session (source error)
    async function* failingSource() {
      yield [makeRow()];
      throw new Error('network reset');
    }
    await expect(
      stageGLImport(
        { batchId: 'batch-failed', fileHash: hash, config, chunks: failingSource() },
        { repository, compute }
      )
    ).rejects.toThrow('network reset');

    // 4. Incomplete session (simulating a crash/restart while status was 'staging' and lock expired)
    await repository.writeManifest({
      version: 1,
      batchId: 'batch-incomplete',
      fileHash: hash,
      sourceId: 'ERP-october',
      status: 'staging',
      chunkCount: 1,
      rowCount: 1,
      acceptedCount: 1,
      quarantinedCount: 0,
      schemaErrors: [],
      controlTotals: { debit: '250.55', credit: '0.00', imbalance: '250.55' },
      unbalancedVouchers: [],
    });

    // 5. Orphaned session (present in index, but manifest was lost)
    await repository.writeManifest({
      version: 1,
      batchId: 'batch-orphaned',
      fileHash: hash,
      sourceId: 'ERP-october',
      status: 'staging',
      chunkCount: 0,
      rowCount: 0,
      acceptedCount: 0,
      quarantinedCount: 0,
      schemaErrors: [],
      controlTotals: { debit: '0.00', credit: '0.00', imbalance: '0.00' },
      unbalancedVouchers: [],
    });
    values.delete('gl-ingestion-stage:v1:batch-orphaned:manifest');

    // Simulate restart with a fresh repository instance over the persisted port
    const restartedRepo = createGLStagingRepository(port);
    const sessions = await discoverStagingSessions({ repository: restartedRepo });

    expect(sessions.map((s) => ({ batchId: s.batchId, state: s.sessionState }))).toEqual([
      { batchId: 'batch-ready', state: 'ready' },
      { batchId: 'batch-blocked', state: 'blocked' },
      { batchId: 'batch-failed', state: 'failed' },
      { batchId: 'batch-incomplete', state: 'incomplete' },
      { batchId: 'batch-orphaned', state: 'orphaned' },
    ]);
  });

  it('reviews persisted quarantine in bounded pages without loading unread chunks', async () => {
    const { port } = createMemoryPort();
    const repository = createGLStagingRepository(port);

    const bad1 = makeRow(false, { Account: 'BAD1', Debit: '10.00' });
    const bad2 = makeRow(false, { Date: 'not-a-date', Debit: '20.00' });
    const bad3 = makeRow(false, { Account: 'BAD3', Debit: '30.00' });

    await stageGLImport(
      {
        batchId: 'q-review',
        fileHash: hash,
        config,
        chunks: chunks([makeRow(), bad1, bad2], [makeRow(true), bad3]),
      },
      { repository, compute }
    );

    const readChunks: number[] = [];
    const origReadChunk = repository.readChunk;
    repository.readChunk = async (id, idx) => {
      readChunks.push(idx);
      return origReadChunk(id, idx);
    };

    // Request only the first 2 quarantined rows (both live in chunk 0): chunk 1 must not be loaded
    const page1 = await readStagingQuarantinePage(
      'q-review',
      { offset: 0, limit: 2 },
      { repository }
    );
    expect(page1.totalQuarantined).toBe(3);
    expect(page1.matchingQuarantined).toBe(3);
    expect(page1.hasMore).toBe(true);
    expect(page1.rows.map((r) => r.sourceRow)).toEqual([3, 4]);
    expect(readChunks).toEqual([0]);

    // Request page 2 (offset 2, limit 2)
    readChunks.length = 0;
    const page2 = await readStagingQuarantinePage(
      'q-review',
      { offset: 2, limit: 2 },
      { repository }
    );
    expect(page2.hasMore).toBe(false);
    expect(page2.rows.map((r) => r.sourceRow)).toEqual([6]);

    // Filter by specific reason code across chunks
    const filtered = await readStagingQuarantinePage(
      'q-review',
      { offset: 0, limit: 10, reasonCode: 'INVALID_DATE' },
      { repository }
    );
    expect(filtered.matchingQuarantined).toBe(1);
    expect(filtered.rows.map((r) => r.sourceRow)).toEqual([4]);
  });

  it('discards a session including trailing uncommitted orphan chunks, and keeps batch indexed if chunk deletion fails mid-way', async () => {
    const { port, values } = createMemoryPort();
    const repository = createGLStagingRepository(port);

    await stageGLImport(
      {
        batchId: 'discard-me',
        fileHash: hash,
        config,
        chunks: chunks([makeRow()], [makeRow(true)]),
      },
      { repository, compute }
    );

    // Simulate an uncommitted trailing orphan chunk at index 2 (written before a manifest update failed)
    await repository.writeChunk(
      'discard-me',
      2,
      SmartImportMapper.ingest({ ...config, rows: [makeRow()] })
    );
    expect(values.has('gl-ingestion-stage:v1:discard-me:chunk:2')).toBe(true);

    // Simulate a failure while deleting chunk 1: batch must remain in the index so retry can finish
    let failChunk1 = true;
    const origRemove = port.removeItem!;
    port.removeItem = async (key) => {
      if (failChunk1 && key.endsWith(':chunk:1')) {
        throw new Error('transient I/O error');
      }
      await origRemove(key);
    };

    await expect(discardStagingBatch('discard-me', { repository })).rejects.toThrow(
      'transient I/O error'
    );
    expect(await repository.listBatchIds()).toContain('discard-me');

    // Retry succeeds and removes all chunks, manifest, lock, and index entry
    failChunk1 = false;
    await discardStagingBatch('discard-me', { repository });
    expect(await repository.listBatchIds()).not.toContain('discard-me');
    expect(await repository.readManifest('discard-me')).toBeNull();
    expect(await repository.readChunk('discard-me', 0)).toBeNull();
    expect(await repository.readChunk('discard-me', 1)).toBeNull();
    expect(await repository.readChunk('discard-me', 2)).toBeNull();
  });

  it('recovers interrupted staging sessions by marking them failed and removing trailing uncommitted chunks and orphan index entries', async () => {
    setClock(() => new Date('2026-10-16T12:00:00.000Z'));
    const { port, values } = createMemoryPort();
    const repository = createGLStagingRepository(port);

    // Batch with 1 acknowledged chunk and 1 uncommitted chunk at index 1, left in 'staging'
    await repository.writeManifest({
      version: 1,
      batchId: 'crashed-batch',
      fileHash: hash,
      sourceId: 'ERP-october',
      status: 'staging',
      chunkCount: 1,
      rowCount: 1,
      acceptedCount: 1,
      quarantinedCount: 0,
      schemaErrors: [],
      controlTotals: { debit: '250.55', credit: '0.00', imbalance: '250.55' },
      unbalancedVouchers: [],
    });
    await repository.writeChunk(
      'crashed-batch',
      0,
      SmartImportMapper.ingest({ ...config, rows: [makeRow()] })
    );
    await repository.writeChunk(
      'crashed-batch',
      1,
      SmartImportMapper.ingest({ ...config, rows: [makeRow(true)] })
    );

    // Orphan batch in index with no manifest and an orphan chunk 0
    await repository.writeChunk(
      'ghost-batch',
      0,
      SmartImportMapper.ingest({ ...config, rows: [makeRow()] })
    );
    values.delete('gl-ingestion-stage:v1:ghost-batch:manifest');

    const report = await recoverStagingSessions({ repository });
    expect(report.markedFailed).toEqual(['crashed-batch']);
    expect(report.cleanedOrphans).toEqual(['ghost-batch']);

    const crashedManifest = await repository.readManifest('crashed-batch');
    expect(crashedManifest?.status).toBe('failed');
    expect(crashedManifest?.failure).toMatch(/interrupted/i);
    // Acknowledged chunk 0 is preserved for inspection; uncommitted chunk 1 is removed
    expect(await repository.readChunk('crashed-batch', 0)).not.toBeNull();
    expect(await repository.readChunk('crashed-batch', 1)).toBeNull();

    // Ghost batch and its chunk are completely removed
    expect(await repository.listBatchIds()).toEqual(['crashed-batch']);
    expect(await repository.readChunk('ghost-batch', 0)).toBeNull();
  });

  it('enforces cross-window lease locks and allows takeover only after lease expiration and explicit discard', async () => {
    let currentMs = Date.parse('2026-10-16T14:00:00.000Z');
    setClock(() => new Date(currentMs));
    const { port } = createMemoryPort();
    const repository = createGLStagingRepository(port);

    // Simulate another window holding an active lease lock on 'shared-batch'
    await repository.acquireLock('shared-batch', 'window-A', currentMs, 60_000);

    await expect(
      stageGLImport(
        {
          batchId: 'shared-batch',
          fileHash: hash,
          config,
          chunks: chunks([makeRow(), makeRow(true)]),
        },
        { repository, compute }
      )
    ).rejects.toThrow(/locked/i);

    await expect(discardStagingBatch('shared-batch', { repository })).rejects.toThrow(
      /active|locked/i
    );

    // Advance clock past lease expiry (61 seconds later)
    currentMs += 61_000;
    await discardStagingBatch('shared-batch', { repository });

    const manifest = await stageGLImport(
      {
        batchId: 'shared-batch',
        fileHash: hash,
        config,
        chunks: chunks([makeRow(), makeRow(true)]),
      },
      { repository, compute }
    );
    expect(manifest.status).toBe('ready');
  });

  it('excludes ephemeral gl-ingestion-stage keys from BackupRestore.createBackupData', async () => {
    const repository = createGLStagingRepository();
    await stageGLImport(
      {
        batchId: 'backup-exclusion-test',
        fileHash: hash,
        config,
        chunks: chunks([makeRow(), makeRow(true)]),
      },
      { repository, compute }
    );
    try {
      expect(
        await masterStorage.getItem('gl-ingestion-stage:v1:backup-exclusion-test:manifest')
      ).not.toBeNull();
      const backup = await BackupRestore.createBackupData();
      const exportedKeys = Object.keys(backup.data);
      expect(exportedKeys.some((k) => k.startsWith('gl-ingestion-stage:'))).toBe(false);
    } finally {
      await discardStagingBatch('backup-exclusion-test', { repository });
    }
  });
});
