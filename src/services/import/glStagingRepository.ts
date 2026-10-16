/** Temporary staging on the existing encrypted masterStorage backend, not a second ledger. */
import { masterStorage } from '@/utils/masterStorage';
import type { GLIngestResult, VoucherImbalance } from '@/types/glIngestion';

export const GL_STAGING_INDEX_KEY = 'gl-ingestion-stage:v1:index';
export const DEFAULT_STAGING_LOCK_TTL_MS = 5 * 60 * 1000;

export interface GLStagingManifest {
  readonly version: 1;
  readonly batchId: string;
  readonly fileHash: string;
  readonly sourceId: string;
  readonly status: 'staging' | 'ready' | 'blocked' | 'failed';
  readonly chunkCount: number;
  readonly rowCount: number;
  readonly acceptedCount: number;
  readonly quarantinedCount: number;
  readonly schemaErrors: readonly string[];
  readonly controlTotals: GLIngestResult['controlTotals'];
  readonly unbalancedVouchers: readonly VoucherImbalance[];
  readonly failure?: string;
}

export interface GLStagingLock {
  readonly version: 1;
  readonly batchId: string;
  readonly ownerId: string;
  readonly acquiredAtMs: number;
  readonly expiresAtMs: number;
}

interface GLStagingIndexPayload {
  readonly version: 1;
  readonly batchIds: readonly string[];
}

export interface StagingStoragePort {
  getItem(key: string): Promise<unknown>;
  setItem(key: string, value: unknown): Promise<void>;
  removeItem?(key: string): Promise<void>;
}

export interface GLStagingRepository {
  readManifest(batchId: string): Promise<GLStagingManifest | null>;
  writeManifest(manifest: GLStagingManifest): Promise<void>;
  readChunk(batchId: string, index: number): Promise<GLIngestResult | null>;
  writeChunk(batchId: string, index: number, chunk: GLIngestResult): Promise<void>;
  listBatchIds(): Promise<readonly string[]>;
  removeChunksFrom(batchId: string, startIndex: number, knownUpperBound?: number): Promise<void>;
  removeBatch(batchId: string): Promise<void>;
  readLock(batchId: string): Promise<GLStagingLock | null>;
  acquireLock(
    batchId: string,
    ownerId: string,
    currentMs: number,
    ttlMs?: number
  ): Promise<GLStagingLock>;
  releaseLock(batchId: string, ownerId: string): Promise<void>;
}

function validateBatchId(batchId: string): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(batchId)) throw new Error('Invalid GL staging batch ID.');
}

function prefix(batchId: string) {
  validateBatchId(batchId);
  return `gl-ingestion-stage:v1:${batchId}`;
}

function chunkKey(batchId: string, index: number) {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error('Invalid GL staging chunk index.');
  return `${prefix(batchId)}:chunk:${index}`;
}

function lockKey(batchId: string) {
  return `${prefix(batchId)}:lock`;
}

/**
 * Opaque JSON payload prevents money-tag decoding of untrusted raw quarantine
 * strings (e.g. "$d:123"). masterStorage still encrypts/chunks the envelope.
 * Staging keys are ephemeral pre-promotion artefacts and are excluded from
 * BackupRestore.createBackupData() and the relational ledger schema.
 */
export function createGLStagingRepository(
  storage: StagingStoragePort = {
    getItem: async (key) => masterStorage.getItem(key),
    setItem: async (key, value) => masterStorage.setItem(key, value),
    removeItem: async (key) => {
      await masterStorage.removeItem(key);
    },
  }
): GLStagingRepository {
  async function read<T>(key: string): Promise<T | null> {
    const saved = await storage.getItem(key);
    if (saved === null || saved === undefined) return null;
    if (
      typeof saved !== 'object' ||
      saved === null ||
      !('version' in saved) ||
      saved.version !== 1 ||
      !('state' in saved) ||
      typeof saved.state !== 'object' ||
      saved.state === null ||
      !('payload' in saved.state) ||
      typeof saved.state.payload !== 'string'
    ) {
      throw new Error(`Invalid GL staging storage envelope: ${key}`);
    }
    const value: unknown = JSON.parse(saved.state.payload);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Invalid GL staging payload: ${key}`);
    }
    return value as T;
  }

  async function write(key: string, value: unknown) {
    await storage.setItem(key, { version: 1, state: { payload: JSON.stringify(value) } });
  }

  async function remove(key: string) {
    if (!storage.removeItem) {
      throw new Error('StagingStoragePort.removeItem is required for staging cleanup operations.');
    }
    await storage.removeItem(key);
  }

  async function listBatchIds(): Promise<readonly string[]> {
    const index = await read<GLStagingIndexPayload>(GL_STAGING_INDEX_KEY);
    if (!index) return [];
    if (
      index.version !== 1 ||
      !Array.isArray(index.batchIds) ||
      index.batchIds.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))
    ) {
      throw new Error(`Invalid GL staging index payload: ${GL_STAGING_INDEX_KEY}`);
    }
    return [...index.batchIds];
  }

  async function ensureIndexed(batchId: string): Promise<void> {
    validateBatchId(batchId);
    const current = await listBatchIds();
    if (current.includes(batchId)) return;
    await write(GL_STAGING_INDEX_KEY, {
      version: 1,
      batchIds: [...current, batchId],
    } satisfies GLStagingIndexPayload);
  }

  async function removeFromIndex(batchId: string): Promise<void> {
    const current = await listBatchIds();
    if (!current.includes(batchId)) return;
    const next = current.filter((id) => id !== batchId);
    await write(GL_STAGING_INDEX_KEY, {
      version: 1,
      batchIds: next,
    } satisfies GLStagingIndexPayload);
  }

  async function readManifest(id: string): Promise<GLStagingManifest | null> {
    return read<GLStagingManifest>(`${prefix(id)}:manifest`);
  }

  async function removeChunksFrom(
    batchId: string,
    startIndex: number,
    knownUpperBound = startIndex
  ): Promise<void> {
    validateBatchId(batchId);
    if (!Number.isSafeInteger(startIndex) || startIndex < 0) {
      throw new Error('Invalid GL staging chunk index.');
    }
    const upper = Math.max(startIndex, knownUpperBound);
    for (let idx = startIndex; idx <= upper; idx++) {
      await remove(chunkKey(batchId, idx));
    }
    let probe = upper + 1;
    while ((await storage.getItem(chunkKey(batchId, probe))) !== null) {
      await remove(chunkKey(batchId, probe));
      probe++;
    }
  }

  return {
    readManifest,
    writeManifest: async (manifest) => {
      await ensureIndexed(manifest.batchId);
      await write(`${prefix(manifest.batchId)}:manifest`, manifest);
    },
    readChunk: async (id, index) => read<GLIngestResult>(chunkKey(id, index)),
    writeChunk: async (id, index, chunk) => {
      await ensureIndexed(id);
      await write(chunkKey(id, index), chunk);
    },
    listBatchIds,
    removeChunksFrom,
    removeBatch: async (batchId) => {
      validateBatchId(batchId);
      let knownUpperBound = 0;
      try {
        const manifest = await readManifest(batchId);
        if (manifest) knownUpperBound = manifest.chunkCount;
      } catch {
        // Corrupt manifest still gets deleted after chunk cleanup.
      }
      // Delete chunks first, then manifest/lock, and remove from index LAST so
      // a mid-delete failure leaves the batch discoverable for retry.
      await removeChunksFrom(batchId, 0, knownUpperBound);
      await remove(`${prefix(batchId)}:manifest`);
      await remove(lockKey(batchId));
      await removeFromIndex(batchId);
    },
    readLock: async (batchId) => read<GLStagingLock>(lockKey(batchId)),
    acquireLock: async (
      batchId,
      ownerId,
      currentMs,
      ttlMs = DEFAULT_STAGING_LOCK_TTL_MS
    ): Promise<GLStagingLock> => {
      validateBatchId(batchId);
      if (!ownerId.trim()) throw new Error('Lock ownerId is required.');
      if (!Number.isSafeInteger(currentMs) || !Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
        throw new Error('Lock timestamps must be positive safe integers.');
      }
      const existing = await read<GLStagingLock>(lockKey(batchId));
      if (existing && existing.ownerId !== ownerId && existing.expiresAtMs > currentMs) {
        throw new Error(`GL staging batch "${batchId}" is locked by another active session.`);
      }
      const lock: GLStagingLock = {
        version: 1,
        batchId,
        ownerId,
        acquiredAtMs: existing?.ownerId === ownerId ? existing.acquiredAtMs : currentMs,
        expiresAtMs: currentMs + ttlMs,
      };
      await write(lockKey(batchId), lock);
      return lock;
    },
    releaseLock: async (batchId, ownerId) => {
      validateBatchId(batchId);
      try {
        const existing = await read<GLStagingLock>(lockKey(batchId));
        if (existing && existing.ownerId === ownerId) {
          if (storage.removeItem) {
            await remove(lockKey(batchId));
          } else {
            await write(lockKey(batchId), { ...existing, expiresAtMs: 0 });
          }
        }
      } catch {
        // Best-effort lock release; expiry still bounds stale locks.
      }
    },
  };
}
