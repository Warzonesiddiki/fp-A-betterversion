/** Sequential, acknowledged chunk staging. Does not promote rows into the financial ledger. */
import { addMoney, compareMoney, subtractMoney } from '@/utils/money';
import { runGLIngestionChunk } from '@/workers';
import { validateGLIngestionChunk } from '@/workers/glIngestionRequest';
import type { GLIngestChunkInput, GLIngestResult, VoucherImbalance } from '@/types/glIngestion';
import {
  createGLStagingRepository,
  type GLStagingRepository,
  type GLStagingManifest,
} from './glStagingRepository';

interface StageGLImportInput {
  readonly batchId: string;
  /** Digest of original file bytes supplied by tokenizer; not recomputed from parsed chunks. */
  readonly fileHash: string;
  readonly config: Omit<GLIngestChunkInput, 'rows'>;
  readonly chunks: AsyncIterable<readonly Readonly<Record<string, string>>[]>;
  readonly signal?: AbortSignal;
}
interface StageGLImportDependencies {
  readonly repository?: GLStagingRepository;
  readonly compute?: (input: GLIngestChunkInput) => Promise<GLIngestResult>;
}
// Same-realm collision fence only; cross-window/native transaction locking is pending.
const active = new Set<string>();

export async function stageGLImport(
  input: StageGLImportInput,
  dependencies: StageGLImportDependencies = {}
): Promise<GLStagingManifest> {
  if (!/^[a-f0-9]{64}$/.test(input.fileHash))
    throw new Error('A lowercase SHA-256 file digest is required.');
  if (active.has(input.batchId)) throw new Error('GL staging batch is already active.');
  const config = validateGLIngestionChunk({ ...input.config, rows: [] });
  const repository = dependencies.repository ?? createGLStagingRepository();
  const compute = dependencies.compute ?? runGLIngestionChunk;
  const checkAbort = () => {
    if (input.signal?.aborted) throw new Error('GL staging cancelled.');
  };
  const schemaErrors = new Set<string>();
  const groups = new Map<
    string,
    {
      entityId: string;
      currency: string;
      journalId: string;
      debit: string;
      credit: string;
      sourceRows: number[];
    }
  >();
  let manifest: GLStagingManifest = {
    version: 1,
    batchId: input.batchId,
    fileHash: input.fileHash,
    sourceId: config.sourceId,
    status: 'staging',
    chunkCount: 0,
    rowCount: 0,
    acceptedCount: 0,
    quarantinedCount: 0,
    schemaErrors: [],
    controlTotals: { debit: '0.00', credit: '0.00', imbalance: '0.00' },
    unbalancedVouchers: [],
  };
  let started = false;
  active.add(input.batchId);
  try {
    checkAbort();
    if (await repository.readManifest(input.batchId))
      throw new Error(
        'GL staging batch already exists. Use a new batch ID; existing evidence was not changed.'
      );
    await repository.writeManifest(manifest);
    started = true;
    for await (const rows of input.chunks) {
      checkAbort();
      const request = validateGLIngestionChunk({
        ...config,
        rows,
        firstRowNumber: config.firstRowNumber! + manifest.rowCount,
      });
      const result = await compute(request);
      checkAbort();
      // Backpressure: persistence must acknowledge this chunk before asking the
      // source for another one. No accumulated accepted/raw row array in memory.
      await repository.writeChunk(input.batchId, manifest.chunkCount, result);
      for (const error of result.schemaErrors) schemaErrors.add(error);
      for (const row of result.acceptedRows) {
        const key = JSON.stringify([row.entityId, row.currency, row.journalId]);
        const group = groups.get(key) ?? {
          entityId: row.entityId,
          currency: row.currency,
          journalId: row.journalId,
          debit: '0.00',
          credit: '0.00',
          sourceRows: [],
        };
        group.debit = addMoney(group.debit, row.debit).toFixed(2);
        group.credit = addMoney(group.credit, row.credit).toFixed(2);
        group.sourceRows.push(row.sourceRow);
        groups.set(key, group);
      }
      const debit = addMoney(manifest.controlTotals.debit, result.controlTotals.debit).toFixed(2);
      const credit = addMoney(manifest.controlTotals.credit, result.controlTotals.credit).toFixed(
        2
      );
      manifest = {
        ...manifest,
        chunkCount: manifest.chunkCount + 1,
        rowCount: manifest.rowCount + rows.length,
        acceptedCount: manifest.acceptedCount + result.acceptedRows.length,
        quarantinedCount: manifest.quarantinedCount + result.quarantinedRows.length,
        schemaErrors: [...schemaErrors],
        controlTotals: { debit, credit, imbalance: subtractMoney(debit, credit).toFixed(2) },
      };
      await repository.writeManifest(manifest);
    }
    if (manifest.chunkCount === 0) {
      const empty = await compute({ ...config, rows: [] });
      for (const error of empty.schemaErrors) schemaErrors.add(error);
    }
    checkAbort();
    const unbalancedVouchers: VoucherImbalance[] = [...groups.values()]
      .filter((v) => compareMoney(v.debit, v.credit) !== 0)
      .map((v) => ({ ...v, imbalance: subtractMoney(v.debit, v.credit).toFixed(2) }));
    const ready =
      manifest.acceptedCount > 0 &&
      manifest.quarantinedCount === 0 &&
      schemaErrors.size === 0 &&
      unbalancedVouchers.length === 0 &&
      compareMoney(manifest.controlTotals.imbalance, '0') === 0;
    manifest = {
      ...manifest,
      status: ready ? 'ready' : 'blocked',
      schemaErrors: [...schemaErrors],
      unbalancedVouchers,
    };
    // This acknowledgement is mandatory. 'ready' means staged, not posted, and
    // no row of this batch has entered the legacy number-valued GL store.
    await repository.writeManifest(manifest);
    return manifest;
  } catch (error) {
    if (started) {
      try {
        await repository.writeManifest({
          ...manifest,
          status: 'failed',
          failure: error instanceof Error ? error.message : String(error),
        });
      } catch {
        /* Preserve the original error. An earlier staging manifest is not ready. */
      }
    }
    throw error;
  } finally {
    active.delete(input.batchId);
  }
}
