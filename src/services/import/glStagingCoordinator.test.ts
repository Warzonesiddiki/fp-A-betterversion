import { describe, expect, it, vi } from 'vitest';
import { SmartImportMapper } from '@/engines/SmartImportMapper';
import { terminateAllWorkers } from '@/workers';
import { stageGLImport } from './glStagingCoordinator';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';

const config = {
  headers: ['Account', 'Date', 'Debit', 'Credit', 'Entity', 'Currency', 'Voucher'],
  sourceId: 'ERP-september',
  knownAccountCodes: ['1000', '4000'],
  knownEntityIds: ['P'],
  expectedCurrency: 'USD',
  dateOrder: 'MDY' as const,
};
const row = (credit = false, extra: Record<string, string> = {}) => ({
  Account: credit ? '4000' : '1000',
  Date: '2026-09-30',
  Debit: credit ? '' : '100.01',
  Credit: credit ? '100.01' : '',
  Entity: 'P',
  Currency: 'USD',
  Voucher: 'J1',
  ...extra,
});
function storage() {
  const values = new Map<string, unknown>();
  const port: StagingStoragePort = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, structuredClone(value));
    },
  };
  return { port, values };
}
const compute = async (input: Parameters<typeof SmartImportMapper.ingest>[0]) =>
  SmartImportMapper.ingest(input);
async function* chunks(...data: Record<string, string>[][]) {
  yield* data;
}
const hash = 'a'.repeat(64);

describe('GL staging coordinator — real ingest computation, injected storage boundary', () => {
  it('balances a voucher split across chunks and reopens exact rows through a new repository instance', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const result = await stageGLImport(
      { batchId: 'b1', fileHash: hash, config, chunks: chunks([row()], [row(true)]) },
      { repository, compute }
    );
    expect(result.status).toBe('ready');
    expect(result.acceptedCount).toBe(2);
    expect(result.controlTotals).toEqual({ debit: '100.01', credit: '100.01', imbalance: '0.00' });
    expect(result.unbalancedVouchers).toEqual([]);
    const restarted = createGLStagingRepository(port);
    expect(await restarted.readManifest('b1')).toEqual(result);
    expect((await restarted.readChunk('b1', 1))?.acceptedRows[0]?.sourceRow).toBe(3);
    expect((await restarted.readChunk('b1', 1))?.acceptedRows[0]?.credit).toBe('100.01');
  });
  it('blocks a balanced remainder when any chunk has quarantined rows, retaining raw typed reasons', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const bad = row(false, { Account: 'UNKNOWN', Date: 'bad', Debit: '$d:123.00' });
    const result = await stageGLImport(
      { batchId: 'b2', fileHash: hash, config, chunks: chunks([row(), row(true)], [bad]) },
      { repository, compute }
    );
    expect(result.status).toBe('blocked');
    expect(result.quarantinedCount).toBe(1);
    const saved = await repository.readChunk('b2', 1);
    expect(saved?.quarantinedRows[0]?.sourceRow).toBe(4);
    expect(saved?.quarantinedRows[0]?.raw).toEqual(bad);
    expect(saved?.quarantinedRows[0]?.reasons.map((r) => r.code)).toContain('INVALID_AMOUNT');
  });
  it('does not let opposite voucher imbalances cancel at whole-file level', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const result = await stageGLImport(
      {
        batchId: 'b3',
        fileHash: hash,
        config,
        chunks: chunks([row()], [row(true, { Voucher: 'J2' })]),
      },
      { repository, compute }
    );
    expect(result.controlTotals.imbalance).toBe('0.00');
    expect(result.status).toBe('blocked');
    expect(result.unbalancedVouchers.map((v) => v.imbalance)).toEqual(['100.01', '-100.01']);
  });
  it('rejects duplicate session IDs instead of overwriting an existing manifest or quarantine', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const input = { batchId: 'same', fileHash: hash, config, chunks: chunks([row(), row(true)]) };
    const first = await stageGLImport(input, { repository, compute });
    await expect(
      stageGLImport({ ...input, chunks: chunks([row()]) }, { repository, compute })
    ).rejects.toThrow(/already exists/);
    expect(await repository.readManifest('same')).toEqual(first);
  });
  it('never produces ready after a chunk persistence failure', async () => {
    const { port } = storage();
    const original = port.setItem;
    port.setItem = async (key, value) => {
      if (key.includes(':chunk:')) throw new Error('disk full');
      await original(key, value);
    };
    const repository = createGLStagingRepository(port);
    await expect(
      stageGLImport(
        { batchId: 'fail', fileHash: hash, config, chunks: chunks([row(), row(true)]) },
        { repository, compute }
      )
    ).rejects.toThrow('disk full');
    expect((await repository.readManifest('fail'))?.status).toBe('failed');
  });
  it('does not consume the next chunk until computation and storage acknowledge the current chunk', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const events: string[] = [];
    async function* source() {
      events.push('yield-1');
      yield [row()];
      events.push('yield-2');
      yield [row(true)];
    }
    const writeChunk = repository.writeChunk;
    const tracked = vi.spyOn(repository, 'writeChunk').mockImplementation(async (...args) => {
      events.push('write');
      await writeChunk(...args);
    });
    const result = await stageGLImport(
      { batchId: 'ordered', fileHash: hash, config, chunks: source() },
      {
        repository,
        compute: async (input) => {
          events.push('compute');
          return compute(input);
        },
      }
    );
    expect(result.status).toBe('ready');
    expect(events).toEqual(['yield-1', 'compute', 'write', 'yield-2', 'compute', 'write']);
    tracked.mockRestore();
  });
  it('keeps precision beyond Number safe integers across chunk boundaries', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const result = await stageGLImport(
      {
        batchId: 'exact',
        fileHash: hash,
        config,
        chunks: chunks(
          [row(false, { Debit: '9007199254740993.01' })],
          [row(true, { Credit: '9007199254740993.01' })]
        ),
      },
      { repository, compute }
    );
    expect(result.controlTotals.debit).toBe('9007199254740993.01');
    expect(result.status).toBe('ready');
  });
  it('marks an interrupted source as failed instead of ready and preserves previous chunks', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    async function* interrupted() {
      yield [row()];
      throw new Error('read failed');
    }
    await expect(
      stageGLImport(
        { batchId: 'interrupted', fileHash: hash, config, chunks: interrupted() },
        { repository, compute }
      )
    ).rejects.toThrow('read failed');
    expect((await repository.readManifest('interrupted'))?.status).toBe('failed');
    expect((await repository.readChunk('interrupted', 0))?.acceptedRows).toHaveLength(1);
  });
  it('blocks empty input and schema failures, including zero-chunk files', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const result = await stageGLImport(
      { batchId: 'empty', fileHash: hash, config: { ...config, headers: [] }, chunks: chunks() },
      { repository, compute }
    );
    expect(result.status).toBe('blocked');
    expect(result.schemaErrors.length).toBeGreaterThan(0);
  });
  it('marks cancellation failed before requesting another worker computation', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const controller = new AbortController();
    async function* source() {
      yield [row()];
      controller.abort();
      yield [row(true)];
    }
    const trackedCompute = vi.fn(compute);
    await expect(
      stageGLImport(
        { batchId: 'cancel', fileHash: hash, config, chunks: source(), signal: controller.signal },
        { repository, compute: trackedCompute }
      )
    ).rejects.toThrow(/cancelled/);
    expect(trackedCompute).toHaveBeenCalledTimes(1);
    expect((await repository.readManifest('cancel'))?.status).toBe('failed');
  });
  it('a rejected final acknowledgement is not reported as success', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const write = repository.writeManifest;
    vi.spyOn(repository, 'writeManifest').mockImplementation(async (m) => {
      if (m.status === 'ready') throw new Error('final disk failure');
      await write(m);
    });
    await expect(
      stageGLImport(
        { batchId: 'final-fail', fileHash: hash, config, chunks: chunks([row(), row(true)]) },
        { repository, compute }
      )
    ).rejects.toThrow('final disk failure');
    expect((await repository.readManifest('final-fail'))?.status).toBe('failed');
  });
  it('refuses same-realm concurrent writers even before the first manifest read finishes', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const input = { batchId: 'concurrent', fileHash: hash, config };
    const first = stageGLImport(
      { ...input, chunks: chunks([row(), row(true)]) },
      { repository, compute }
    );
    await expect(
      stageGLImport({ ...input, chunks: chunks([row()]) }, { repository, compute })
    ).rejects.toThrow(/already active/);
    expect((await first).status).toBe('ready');
  });
  it('rejects oversized chunks without computing or promoting them', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    const trackedCompute = vi.fn(compute);
    await expect(
      stageGLImport(
        {
          batchId: 'oversized',
          fileHash: hash,
          config,
          chunks: chunks(Array.from({ length: 2001 }, () => row())),
        },
        { repository, compute: trackedCompute }
      )
    ).rejects.toThrow(/length/);
    expect(trackedCompute).not.toHaveBeenCalled();
    expect((await repository.readManifest('oversized'))?.status).toBe('failed');
  });
  it('rejects malformed saved payloads instead of treating them as absent drafts', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    await port.setItem('gl-ingestion-stage:v1:corrupt:manifest', {
      version: 1,
      state: { payload: 'null' },
    });
    await expect(repository.readManifest('corrupt')).rejects.toThrow(/Invalid GL staging payload/);
    await expect(repository.readManifest('../bad')).rejects.toThrow(/batch ID/);
  });
  it('the default worker path fails explicitly when Worker is unavailable, without a main-thread ingest fallback', async () => {
    const { port } = storage();
    const repository = createGLStagingRepository(port);
    vi.stubGlobal('Worker', undefined);
    try {
      await expect(
        stageGLImport(
          { batchId: 'no-worker', fileHash: hash, config, chunks: chunks([row(), row(true)]) },
          { repository }
        )
      ).rejects.toThrow(/worker/i);
      expect((await repository.readManifest('no-worker'))?.status).toBe('failed');
      expect(await repository.readChunk('no-worker', 0)).toBeNull();
    } finally {
      terminateAllWorkers();
      vi.unstubAllGlobals();
    }
  });
});
