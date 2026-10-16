/** Sequential, acknowledged chunk staging. Does not promote rows into the financial ledger. */
import { nowMs } from '@/utils/clock';
import { addMoney, compareMoney, subtractMoney, toFixedMoneyString } from '@/utils/money';
import { runGLIngestionChunk } from '@/workers';
import { validateGLIngestionChunk } from '@/workers/glIngestionRequest';
import type {
  GLIngestChunkInput,
  GLIngestReason,
  GLIngestResult,
  QuarantinedGLRow,
  VoucherImbalance,
} from '@/types/glIngestion';
import {
  createGLStagingRepository,
  DEFAULT_STAGING_LOCK_TTL_MS,
  type GLStagingRepository,
  type GLStagingManifest,
} from './glStagingRepository';

export interface GLStagingChunkSlice {
  readonly rows: readonly Readonly<Record<string, string>>[];
  readonly rowNumbers?: readonly number[];
  readonly firstRowNumber?: number;
}

export type GLStagingChunkItem = readonly Readonly<Record<string, string>>[] | GLStagingChunkSlice;

export interface StageGLImportInput {
  readonly batchId: string;
  /** Digest of original file bytes supplied by tokenizer; not recomputed from parsed chunks. */
  readonly fileHash: string;
  readonly config: Omit<GLIngestChunkInput, 'rows'>;
  readonly chunks: AsyncIterable<GLStagingChunkItem>;
  readonly signal?: AbortSignal;
  readonly lockOwnerId?: string;
  readonly lockTtlMs?: number;
}

export interface StageGLImportDependencies {
  readonly repository?: GLStagingRepository;
  readonly compute?: (input: GLIngestChunkInput) => Promise<GLIngestResult>;
}

export type GLStagingSessionState =
  | 'ready'
  | 'blocked'
  | 'failed'
  | 'in_progress'
  | 'incomplete'
  | 'orphaned';

export interface DiscoveredGLStagingSession {
  readonly batchId: string;
  readonly sessionState: GLStagingSessionState;
  readonly manifest: GLStagingManifest | null;
  readonly isLocked: boolean;
}

export interface StagingRecoveryReport {
  readonly markedFailed: readonly string[];
  readonly cleanedOrphans: readonly string[];
  readonly discarded: readonly string[];
}

export interface QuarantineReviewOptions {
  readonly offset?: number;
  readonly limit?: number;
  readonly reasonCode?: GLIngestReason['code'];
}

export interface QuarantineReviewPage {
  readonly batchId: string;
  readonly status: GLStagingManifest['status'];
  readonly totalQuarantined: number;
  readonly matchingQuarantined: number;
  readonly offset: number;
  readonly limit: number;
  readonly rows: readonly QuarantinedGLRow[];
  readonly hasMore: boolean;
}

// Same-realm collision fence paired with persisted lease locks in glStagingRepository.
const active = new Set<string>();
let ownerSeq = 0;

function isChunkSlice(item: GLStagingChunkItem): item is GLStagingChunkSlice {
  return !Array.isArray(item) && typeof item === 'object' && item !== null && 'rows' in item;
}

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
  const ownerId = input.lockOwnerId ?? `coordinator-${++ownerSeq}-${nowMs()}`;
  const lockTtlMs = input.lockTtlMs ?? DEFAULT_STAGING_LOCK_TTL_MS;
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
  let lockAcquired = false;
  active.add(input.batchId);
  try {
    checkAbort();
    await repository.acquireLock(input.batchId, ownerId, nowMs(), lockTtlMs);
    lockAcquired = true;
    if (await repository.readManifest(input.batchId))
      throw new Error(
        'GL staging batch already exists. Use a new batch ID; existing evidence was not changed.'
      );
    await repository.writeManifest(manifest);
    started = true;
    for await (const chunkItem of input.chunks) {
      checkAbort();
      await repository.acquireLock(input.batchId, ownerId, nowMs(), lockTtlMs);
      const rows = isChunkSlice(chunkItem) ? chunkItem.rows : chunkItem;
      const rowNumbers = isChunkSlice(chunkItem) ? chunkItem.rowNumbers : undefined;
      const defaultFirstRow = config.firstRowNumber! + manifest.rowCount;
      const firstRowNumber = isChunkSlice(chunkItem)
        ? (chunkItem.firstRowNumber ?? rowNumbers?.[0] ?? defaultFirstRow)
        : defaultFirstRow;
      const request = validateGLIngestionChunk({
        ...config,
        rows,
        firstRowNumber,
        ...(rowNumbers !== undefined ? { rowNumbers } : {}),
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
        group.debit = toFixedMoneyString(addMoney(group.debit, row.debit));
        group.credit = toFixedMoneyString(addMoney(group.credit, row.credit));
        group.sourceRows.push(row.sourceRow);
        groups.set(key, group);
      }
      const debit = toFixedMoneyString(
        addMoney(manifest.controlTotals.debit, result.controlTotals.debit)
      );
      const credit = toFixedMoneyString(
        addMoney(manifest.controlTotals.credit, result.controlTotals.credit)
      );
      manifest = {
        ...manifest,
        chunkCount: manifest.chunkCount + 1,
        rowCount: manifest.rowCount + rows.length,
        acceptedCount: manifest.acceptedCount + result.acceptedRows.length,
        quarantinedCount: manifest.quarantinedCount + result.quarantinedRows.length,
        schemaErrors: [...schemaErrors],
        controlTotals: {
          debit,
          credit,
          imbalance: toFixedMoneyString(subtractMoney(debit, credit)),
        },
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
      .map((v) => ({ ...v, imbalance: toFixedMoneyString(subtractMoney(v.debit, v.credit)) }));
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
    if (lockAcquired) {
      await repository.releaseLock(input.batchId, ownerId);
    }
    active.delete(input.batchId);
  }
}

export async function discoverStagingSessions(
  dependencies: { readonly repository?: GLStagingRepository } = {}
): Promise<readonly DiscoveredGLStagingSession[]> {
  const repository = dependencies.repository ?? createGLStagingRepository();
  const batchIds = await repository.listBatchIds();
  const currentMs = nowMs();
  const sessions: DiscoveredGLStagingSession[] = [];
  for (const batchId of batchIds) {
    const [manifest, lock] = await Promise.all([
      repository.readManifest(batchId),
      repository.readLock(batchId),
    ]);
    const isLocked = active.has(batchId) || (lock !== null && lock.expiresAtMs > currentMs);
    if (!manifest) {
      sessions.push({
        batchId,
        sessionState: 'orphaned',
        manifest: null,
        isLocked,
      });
      continue;
    }
    const sessionState: GLStagingSessionState =
      manifest.status === 'staging' ? (isLocked ? 'in_progress' : 'incomplete') : manifest.status;
    sessions.push({
      batchId,
      sessionState,
      manifest,
      isLocked,
    });
  }
  return sessions;
}

export async function discardStagingBatch(
  batchId: string,
  dependencies: { readonly repository?: GLStagingRepository } = {}
): Promise<void> {
  if (active.has(batchId)) {
    throw new Error(`Cannot discard active GL staging batch "${batchId}".`);
  }
  const repository = dependencies.repository ?? createGLStagingRepository();
  const lock = await repository.readLock(batchId);
  if (lock && lock.expiresAtMs > nowMs()) {
    throw new Error(`Cannot discard locked GL staging batch "${batchId}".`);
  }
  await repository.removeBatch(batchId);
}

export async function recoverStagingSessions(
  options: {
    readonly repository?: GLStagingRepository;
    readonly discardFailed?: boolean;
    readonly discardBlocked?: boolean;
  } = {}
): Promise<StagingRecoveryReport> {
  const repository = options.repository ?? createGLStagingRepository();
  const sessions = await discoverStagingSessions({ repository });
  const markedFailed: string[] = [];
  const cleanedOrphans: string[] = [];
  const discarded: string[] = [];

  for (const session of sessions) {
    if (session.isLocked) continue;
    if (session.sessionState === 'orphaned') {
      await repository.removeBatch(session.batchId);
      cleanedOrphans.push(session.batchId);
      continue;
    }
    if (session.sessionState === 'incomplete' && session.manifest) {
      // Remove any uncommitted trailing chunk written after the last acknowledged manifest.
      await repository.removeChunksFrom(session.batchId, session.manifest.chunkCount);
      await repository.writeManifest({
        ...session.manifest,
        status: 'failed',
        failure: 'Staging session was interrupted before completion.',
      });
      markedFailed.push(session.batchId);
      if (options.discardFailed) {
        await repository.removeBatch(session.batchId);
        discarded.push(session.batchId);
      }
      continue;
    }
    if (session.sessionState === 'failed' && options.discardFailed) {
      await repository.removeBatch(session.batchId);
      discarded.push(session.batchId);
      continue;
    }
    if (session.sessionState === 'blocked' && options.discardBlocked) {
      await repository.removeBatch(session.batchId);
      discarded.push(session.batchId);
    }
  }

  return { markedFailed, cleanedOrphans, discarded };
}

export async function readStagingQuarantinePage(
  batchId: string,
  options: QuarantineReviewOptions = {},
  dependencies: { readonly repository?: GLStagingRepository } = {}
): Promise<QuarantineReviewPage> {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 100;
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error('Quarantine review offset must be a non-negative safe integer.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
    throw new Error('Quarantine review limit must be a safe integer between 1 and 500.');
  }
  const repository = dependencies.repository ?? createGLStagingRepository();
  const manifest = await repository.readManifest(batchId);
  if (!manifest) {
    throw new Error(`GL staging batch not found: ${batchId}`);
  }
  if (manifest.quarantinedCount === 0) {
    return {
      batchId,
      status: manifest.status,
      totalQuarantined: 0,
      matchingQuarantined: 0,
      offset,
      limit,
      rows: [],
      hasMore: false,
    };
  }

  const rows: QuarantinedGLRow[] = [];
  let seenMatching = 0;
  const filterCode = options.reasonCode;

  for (let chunkIndex = 0; chunkIndex < manifest.chunkCount; chunkIndex++) {
    if (!filterCode && rows.length >= limit) {
      break;
    }
    const chunk = await repository.readChunk(batchId, chunkIndex);
    if (!chunk) {
      throw new Error(`Missing staged chunk ${chunkIndex} for batch ${batchId}.`);
    }
    for (const qRow of chunk.quarantinedRows) {
      if (filterCode && !qRow.reasons.some((r) => r.code === filterCode)) {
        continue;
      }
      if (seenMatching >= offset && rows.length < limit) {
        rows.push(qRow);
      }
      seenMatching++;
    }
  }

  const matchingQuarantined = filterCode ? seenMatching : manifest.quarantinedCount;
  return {
    batchId,
    status: manifest.status,
    totalQuarantined: manifest.quarantinedCount,
    matchingQuarantined,
    offset,
    limit,
    rows,
    hasMore: offset + rows.length < matchingQuarantined,
  };
}
