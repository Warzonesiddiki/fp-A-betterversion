/**
 * Transactional exact-string GL promotion gate (DEC-010 Step 1).
 *
 * Promotes a `'ready'` staged batch into the exact-string ledger store without
 * coercing monetary strings (`debit`, `credit`) through IEEE-754 `number`.
 * Enforces under cross-window lease locks:
 *   1. Staging manifest eligibility (`status === 'ready'`).
 *   2. Full chunk re-verification (`schemaErrors`, `quarantinedRows`, exact
 *      control totals, and whole-file voucher balance).
 *   3. SHA-256 `fileHash` and `batchId` idempotency against promoted history.
 *   4. Closed-period write guard (`DEC-008` via `getGLPeriodWriteIssues`) at
 *      promotion time.
 *   5. Atomic index commit with rollback of partial keys on write failure.
 */
import { nowISO, nowMs } from '@/utils/clock';
import { masterStorage } from '@/utils/masterStorage';
import { addMoney, compareMoney, subtractMoney, toFixedMoneyString } from '@/utils/money';
import { usePeriodCloseStore } from '@/store/periodCloseStore';
import type { GLIngestResult } from '@/types/glIngestion';
import { getGLPeriodWriteIssues, type GLPeriodAuthority } from './glPeriodWriteGuard';
import {
  createGLStagingRepository,
  DEFAULT_STAGING_LOCK_TTL_MS,
  type GLStagingLock,
  type GLStagingRepository,
  type StagingStoragePort,
} from './glStagingRepository';

export const GL_PROMOTED_LEDGER_INDEX_KEY = 'gl-ledger-exact:v1:index';
export const GL_PROMOTED_LEDGER_LOCK_KEY = 'gl-ledger-exact:v1:lock';

export interface PromotedGLEntryProvenance {
  readonly batchId: string;
  readonly fileHash: string;
  readonly sourceId: string;
  readonly sourceRow: number;
  readonly promotedAt: string;
}

export interface PromotedGLEntry {
  readonly entryId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly postDate: string;
  readonly period: string;
  readonly debit: string;
  readonly credit: string;
  readonly entityId: string;
  readonly currency: string;
  readonly journalId: string;
  readonly description: string;
  readonly reference: string;
  readonly provenance: PromotedGLEntryProvenance;
}

export interface PromotedGLBatchManifest {
  readonly version: 1;
  readonly batchId: string;
  readonly fileHash: string;
  readonly sourceId: string;
  readonly promotedAt: string;
  readonly chunkCount: number;
  readonly entryCount: number;
  readonly controlTotals: GLIngestResult['controlTotals'];
  readonly periods: readonly string[];
  readonly entities: readonly string[];
  readonly currencies: readonly string[];
}

interface PromotedLedgerIndexPayload {
  readonly version: 1;
  readonly batchIds: readonly string[];
}

interface PromotedChunkEnvelope {
  readonly version: 1;
  readonly batchId: string;
  readonly chunkIndex: number;
  readonly entries: readonly PromotedGLEntry[];
}

export interface PromoteStagingBatchOptions {
  readonly storage?: StagingStoragePort;
  readonly repository?: GLStagingRepository;
  readonly periodAuthority?: GLPeriodAuthority;
  readonly periodHydrated?: boolean;
  readonly promotedAt?: string;
  readonly lockOwnerId?: string;
  readonly lockTtlMs?: number;
}

let promotionOwnerSeq = 0;

function defaultStoragePort(): StagingStoragePort {
  return {
    getItem: async (key) => masterStorage.getItem(key),
    setItem: async (key, value) => masterStorage.setItem(key, value),
    removeItem: async (key) => {
      await masterStorage.removeItem(key);
    },
  };
}

function validateBatchId(batchId: string): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(batchId)) {
    throw new Error('Invalid GL batch ID.');
  }
}

function promotedBatchPrefix(batchId: string): string {
  validateBatchId(batchId);
  return `gl-ledger-exact:v1:${batchId}`;
}

function promotedManifestKey(batchId: string): string {
  return `${promotedBatchPrefix(batchId)}:manifest`;
}

function promotedChunkKey(batchId: string, chunkIndex: number): string {
  return `${promotedBatchPrefix(batchId)}:chunk:${chunkIndex}`;
}

async function readJson<T>(storage: StagingStoragePort, key: string): Promise<T | null> {
  const raw = await storage.getItem(key);
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return JSON.parse(raw) as T;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const wrapped = (raw as { readonly __glStageJson?: unknown }).__glStageJson;
    if (typeof wrapped === 'string') return JSON.parse(wrapped) as T;
  }
  throw new Error(`Corrupt promoted GL ledger payload at ${key}.`);
}

async function writeJson(storage: StagingStoragePort, key: string, value: unknown): Promise<void> {
  await storage.setItem(key, { __glStageJson: JSON.stringify(value) });
}

async function removeKey(storage: StagingStoragePort, key: string): Promise<void> {
  if (storage.removeItem) {
    await storage.removeItem(key);
    return;
  }
  await storage.setItem(key, null);
}

async function acquireGlobalPromotionLock(
  storage: StagingStoragePort,
  ownerId: string,
  currentMs: number,
  ttlMs: number
): Promise<void> {
  const existing = await readJson<GLStagingLock>(storage, GL_PROMOTED_LEDGER_LOCK_KEY);
  if (existing && existing.ownerId !== ownerId && existing.expiresAtMs > currentMs) {
    throw new Error(
      `GL ledger promotion is currently locked by another session (${existing.ownerId}).`
    );
  }
  const lock: GLStagingLock = {
    version: 1,
    batchId: '__global_promotion__',
    ownerId,
    acquiredAtMs: currentMs,
    expiresAtMs: currentMs + ttlMs,
  };
  await writeJson(storage, GL_PROMOTED_LEDGER_LOCK_KEY, lock);
}

async function releaseGlobalPromotionLock(
  storage: StagingStoragePort,
  ownerId: string
): Promise<void> {
  const existing = await readJson<GLStagingLock>(storage, GL_PROMOTED_LEDGER_LOCK_KEY);
  if (!existing || existing.ownerId !== ownerId) return;
  if (storage.removeItem) {
    await storage.removeItem(GL_PROMOTED_LEDGER_LOCK_KEY);
    return;
  }
  await writeJson(storage, GL_PROMOTED_LEDGER_LOCK_KEY, {
    ...existing,
    expiresAtMs: 0,
  });
}

async function readPromotedIndex(storage: StagingStoragePort): Promise<readonly string[]> {
  const payload = await readJson<PromotedLedgerIndexPayload>(storage, GL_PROMOTED_LEDGER_INDEX_KEY);
  if (!payload) return [];
  if (payload.version !== 1 || !Array.isArray(payload.batchIds)) {
    throw new Error('Corrupt GL promoted ledger index.');
  }
  return payload.batchIds;
}

export async function listPromotedLedgerBatches(
  options: { readonly storage?: StagingStoragePort } = {}
): Promise<readonly PromotedGLBatchManifest[]> {
  const storage = options.storage ?? defaultStoragePort();
  const batchIds = await readPromotedIndex(storage);
  const manifests: PromotedGLBatchManifest[] = [];
  for (const batchId of batchIds) {
    const manifest = await readPromotedLedgerBatch(batchId, { storage });
    if (manifest) {
      manifests.push(manifest);
    }
  }
  return manifests;
}

export async function readPromotedLedgerBatch(
  batchId: string,
  options: { readonly storage?: StagingStoragePort } = {}
): Promise<PromotedGLBatchManifest | null> {
  const storage = options.storage ?? defaultStoragePort();
  const manifest = await readJson<PromotedGLBatchManifest>(storage, promotedManifestKey(batchId));
  if (!manifest) return null;
  if (manifest.version !== 1 || manifest.batchId !== batchId) {
    throw new Error(`Promoted GL batch manifest mismatch for "${batchId}".`);
  }
  return manifest;
}

export async function readPromotedLedgerEntries(
  batchId: string,
  options: { readonly storage?: StagingStoragePort } = {}
): Promise<readonly PromotedGLEntry[]> {
  const storage = options.storage ?? defaultStoragePort();
  const manifest = await readPromotedLedgerBatch(batchId, { storage });
  if (!manifest) {
    throw new Error(`Promoted GL batch not found: ${batchId}`);
  }
  const entries: PromotedGLEntry[] = [];
  for (let i = 0; i < manifest.chunkCount; i++) {
    const chunk = await readJson<PromotedChunkEnvelope>(storage, promotedChunkKey(batchId, i));
    if (!chunk || chunk.version !== 1 || chunk.batchId !== batchId || chunk.chunkIndex !== i) {
      throw new Error(`Missing or corrupt promoted GL chunk ${i} for batch "${batchId}".`);
    }
    entries.push(...chunk.entries);
  }
  return entries;
}

export async function promoteStagingBatch(
  batchId: string,
  options: PromoteStagingBatchOptions = {}
): Promise<PromotedGLBatchManifest> {
  validateBatchId(batchId);
  const storage = options.storage ?? defaultStoragePort();
  const repository = options.repository ?? createGLStagingRepository(storage);
  const currentMs = nowMs();
  const ownerId = options.lockOwnerId ?? `promote-${++promotionOwnerSeq}-${currentMs}`;
  const lockTtlMs = options.lockTtlMs ?? DEFAULT_STAGING_LOCK_TTL_MS;
  const promotedAt = options.promotedAt ?? nowISO();

  let batchLockAcquired = false;
  let globalLockAcquired = false;
  let writtenChunks = 0;
  let manifestWritten = false;

  try {
    await repository.acquireLock(batchId, ownerId, currentMs, lockTtlMs);
    batchLockAcquired = true;
    await acquireGlobalPromotionLock(storage, ownerId, currentMs, lockTtlMs);
    globalLockAcquired = true;

    const stageManifest = await repository.readManifest(batchId);
    if (!stageManifest) {
      throw new Error(`GL staging batch not found: ${batchId}`);
    }
    if (stageManifest.status === 'promoted') {
      throw new Error(`GL staging batch "${batchId}" was already promoted.`);
    }
    if (stageManifest.status !== 'ready') {
      throw new Error(
        `Cannot promote GL staging batch "${batchId}": status is "${stageManifest.status}", expected "ready".`
      );
    }
    if (stageManifest.chunkCount <= 0 || stageManifest.acceptedCount <= 0) {
      throw new Error(`Cannot promote empty GL staging batch "${batchId}".`);
    }

    const existingBatches = await listPromotedLedgerBatches({ storage });
    if (existingBatches.some((b) => b.batchId === batchId)) {
      throw new Error(`GL staging batch "${batchId}" was already promoted.`);
    }
    const duplicateFileBatch = existingBatches.find((b) => b.fileHash === stageManifest.fileHash);
    if (duplicateFileBatch) {
      throw new Error(
        `Duplicate GL import rejected: fileHash ${stageManifest.fileHash} was already promoted in batch "${duplicateFileBatch.batchId}".`
      );
    }

    // Re-verify all staged chunks and recompute whole-file control totals & voucher balance
    const chunks: GLIngestResult[] = [];
    for (let i = 0; i < stageManifest.chunkCount; i++) {
      const chunk = await repository.readChunk(batchId, i);
      if (!chunk) {
        throw new Error(`Missing staged chunk ${i} for batch "${batchId}".`);
      }
      chunks.push(chunk);
    }

    let totalDebit = '0.00';
    let totalCredit = '0.00';
    let acceptedCount = 0;
    const voucherTotals = new Map<string, { debit: string; credit: string }>();
    const periods = new Set<string>();
    const entities = new Set<string>();
    const currencies = new Set<string>();
    const periodGuardInputs: { postDate: string; period: string; entityId: string }[] = [];

    for (const chunk of chunks) {
      if (chunk.schemaErrors.length > 0 || chunk.quarantinedRows.length > 0) {
        throw new Error(
          `Cannot promote batch "${batchId}": staged chunk contains schema errors or quarantined rows.`
        );
      }
      for (const row of chunk.acceptedRows) {
        acceptedCount++;
        totalDebit = toFixedMoneyString(addMoney(totalDebit, row.debit));
        totalCredit = toFixedMoneyString(addMoney(totalCredit, row.credit));
        const voucherKey = JSON.stringify([row.entityId, row.currency, row.journalId]);
        const group = voucherTotals.get(voucherKey) ?? { debit: '0.00', credit: '0.00' };
        group.debit = toFixedMoneyString(addMoney(group.debit, row.debit));
        group.credit = toFixedMoneyString(addMoney(group.credit, row.credit));
        voucherTotals.set(voucherKey, group);

        const period = row.postDate.slice(0, 7);
        periods.add(period);
        entities.add(row.entityId);
        currencies.add(row.currency);
        periodGuardInputs.push({
          postDate: row.postDate,
          period,
          entityId: row.entityId,
        });
      }
    }

    const imbalance = toFixedMoneyString(subtractMoney(totalDebit, totalCredit));
    if (
      acceptedCount !== stageManifest.acceptedCount ||
      compareMoney(totalDebit, stageManifest.controlTotals.debit) !== 0 ||
      compareMoney(totalCredit, stageManifest.controlTotals.credit) !== 0 ||
      compareMoney(imbalance, '0.00') !== 0
    ) {
      throw new Error(
        `Staged chunk verification failed for batch "${batchId}": recomputed totals do not match manifest.`
      );
    }

    for (const group of voucherTotals.values()) {
      if (compareMoney(group.debit, group.credit) !== 0) {
        throw new Error(
          `Staged chunk verification failed for batch "${batchId}": unbalanced voucher detected.`
        );
      }
    }

    // DEC-008 closed-period check at promotion time
    const closeStoreState = usePeriodCloseStore.getState();
    const periodAuthority: GLPeriodAuthority = options.periodAuthority ?? {
      entries: closeStoreState.entries,
      checklists: closeStoreState.checklists,
    };
    const periodHydrated = options.periodHydrated ?? usePeriodCloseStore.persist.hasHydrated();
    const periodIssues = getGLPeriodWriteIssues(periodGuardInputs, periodAuthority, periodHydrated);
    if (periodIssues.length > 0) {
      throw new Error(periodIssues[0]!.reason);
    }

    // Write promoted exact-string chunks and manifest transactionally
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]!;
      const promotedEntries: PromotedGLEntry[] = chunk.acceptedRows.map((row, rowIndex) => ({
        entryId: `${batchId}:${chunkIndex}:${rowIndex}:${row.sourceRow}`,
        accountCode: row.accountCode,
        accountName: row.accountName,
        postDate: row.postDate,
        period: row.postDate.slice(0, 7),
        debit: row.debit,
        credit: row.credit,
        entityId: row.entityId,
        currency: row.currency,
        journalId: row.journalId,
        description: row.description,
        reference: row.reference,
        provenance: {
          batchId,
          fileHash: stageManifest.fileHash,
          sourceId: row.sourceId,
          sourceRow: row.sourceRow,
          promotedAt,
        },
      }));
      const envelope: PromotedChunkEnvelope = {
        version: 1,
        batchId,
        chunkIndex,
        entries: promotedEntries,
      };
      await writeJson(storage, promotedChunkKey(batchId, chunkIndex), envelope);
      writtenChunks++;
    }

    const promotedManifest: PromotedGLBatchManifest = {
      version: 1,
      batchId,
      fileHash: stageManifest.fileHash,
      sourceId: stageManifest.sourceId,
      promotedAt,
      chunkCount: chunks.length,
      entryCount: acceptedCount,
      controlTotals: {
        debit: totalDebit,
        credit: totalCredit,
        imbalance: '0.00',
      },
      periods: [...periods].sort(),
      entities: [...entities].sort(),
      currencies: [...currencies].sort(),
    };

    await writeJson(storage, promotedManifestKey(batchId), promotedManifest);
    manifestWritten = true;

    const currentIndex = await readPromotedIndex(storage);
    const nextIndex: PromotedLedgerIndexPayload = {
      version: 1,
      batchIds: [...currentIndex, batchId],
    };
    await writeJson(storage, GL_PROMOTED_LEDGER_INDEX_KEY, nextIndex);

    await repository.writeManifest({
      ...stageManifest,
      status: 'promoted',
      promotedAt,
    });

    return promotedManifest;
  } catch (error) {
    // Roll back any unindexed promoted-ledger keys written during this failed attempt
    for (let i = 0; i < writtenChunks; i++) {
      try {
        await removeKey(storage, promotedChunkKey(batchId, i));
      } catch {
        // Keep original promotion error
      }
    }
    if (manifestWritten) {
      try {
        await removeKey(storage, promotedManifestKey(batchId));
      } catch {
        // Keep original promotion error
      }
    }
    throw error;
  } finally {
    if (globalLockAcquired) {
      try {
        await releaseGlobalPromotionLock(storage, ownerId);
      } catch {
        // Preserve main outcome
      }
    }
    if (batchLockAcquired) {
      try {
        await repository.releaseLock(batchId, ownerId);
      } catch {
        // Preserve main outcome
      }
    }
  }
}
