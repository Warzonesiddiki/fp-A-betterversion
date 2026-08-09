import { CHUNK_SIZE } from './storageConstants';
import { createStoragePool } from '../workers/worker-pool';
import {
  serializeForStorage,
  deserializeFromStorage,
  type SerializedPayload,
} from './storageSerialization';
import { createLogger } from './logger';

import type { StorageRequest, StorageResult } from '../workers/storage.worker';

const storagePool = createStoragePool();
const chunkedStorageLogger = createLogger('ChunkedStorage');

/**
 * Once worker construction has failed we stop attempting it: every subsequent
 * call would pay the same failure and log the same warning. Serialization then
 * runs inline, which is correct in every environment — just not off-thread.
 */
let workersUnavailable = false;

function isWorkerUnavailable(error: unknown): boolean {
  return error instanceof Error && error.name === 'WorkerUnavailableError';
}

/**
 * Run the serialization step in the storage worker, falling back to the
 * main thread when this environment cannot host workers.
 *
 * F-0025: previously a missing `Worker` global stranded the caller's promise
 * forever (WorkerPool queued a task nothing could drain), so every persistence
 * write hung and no data was ever saved. The pool now rejects; this wrapper
 * keeps the product WORKING by computing the same result inline rather than
 * turning an optimization failure into a data-loss failure.
 */
async function runInWorkerOrInline<T>(request: StorageRequest, inline: () => T): Promise<T> {
  if (workersUnavailable) return inline();

  try {
    return (await storagePool.run<StorageResult>(request)) as T;
  } catch (error) {
    if (!isWorkerUnavailable(error)) throw error;
    workersUnavailable = true;
    chunkedStorageLogger.warn(
      'Storage worker unavailable; serializing on the main thread. Large saves may block the UI.',
      { reason: error instanceof Error ? error.message : String(error) }
    );
    return inline();
  }
}

/** JSON-stringify + chunk a value, off-thread when possible. */
function runStringify(value: unknown): Promise<SerializedPayload> {
  return runInWorkerOrInline<SerializedPayload>(
    { type: 'stringify', payload: value, chunkSize: CHUNK_SIZE } as StorageRequest,
    () => serializeForStorage(value, CHUNK_SIZE)
  );
}

/** Rejoin chunks and JSON-parse them, off-thread when possible. */
async function runParse(chunks: string[]): Promise<unknown> {
  const result = await runInWorkerOrInline<{ payload?: unknown }>(
    { type: 'parse', payload: chunks } as StorageRequest,
    () => ({ payload: deserializeFromStorage(chunks) })
  );
  return result.payload;
}

/** Test seam: forget the cached "workers are unavailable" decision. */
export function __resetWorkerAvailabilityForTests(): void {
  workersUnavailable = false;
}

export interface StorageMetadata {
  _isChunked: boolean;
  chunkCount: number;
  totalSize: number;
  timestamp: number;
}

function isChunkedMetadata(value: unknown): value is StorageMetadata {
  return (
    !!value &&
    typeof value === 'object' &&
    '_isChunked' in (value as Record<string, unknown>) &&
    (value as StorageMetadata)._isChunked === true
  );
}

// ---------------------------------------------------------------------------
// Per-key serialization lock (DEFER-2026-003 fix, 2026-08-09)
// ---------------------------------------------------------------------------
// `setItem` performs a multi-step write (metadata first, then N chunk records).
// Without serialization, two concurrent writers on the same key interleave
// those steps and produce torn state (metadata from writer A, chunks from
// writer B), a concurrent reader can observe a half-written payload
// (read-tear), and `removeItem` racing `setItem` can delete the NEW metadata
// after the new chunks were written (resurrection + orphans).
//
// The lock is a promise-chain mutex keyed by (underlying storage instance,
// storage key). It serializes all operations for one key while leaving
// different keys fully parallel. Rejections never cascade: the chain promise
// always settles clean, so a failed write cannot poison later operations.
// This is in-process serialization only — cross-tab races require IndexedDB
// transactions (tracked in docs/security-deferrals.md DEFER-2026-003).
const keyChains = new WeakMap<RawStorage, Map<string, Promise<void>>>();

function withKeyLock<T>(storage: RawStorage, key: string, op: () => Promise<T>): Promise<T> {
  let chains = keyChains.get(storage);
  if (!chains) {
    chains = new Map();
    keyChains.set(storage, chains);
  }
  const previous = chains.get(key) ?? Promise.resolve();
  const run = previous.then(op, op);
  const chain = run.then(
    () => undefined,
    () => undefined
  );
  chains.set(key, chain);
  // Opportunistic cleanup so the chain map does not grow without bound.
  void chain.then(() => {
    if (chains.get(key) === chain) chains.delete(key);
  });
  return run;
}

/**
 * A raw key-value storage adapter. Values are arbitrary serializable data
 * (strings pass through, objects are JSON-serialized by the backends); this
 * is the runtime contract of the IndexedDB/SQLite/localStorage adapters,
 * which is wider than zustand's PersistStorage<StorageValue<S>> envelope.
 */
export interface RawStorage {
  getItem(name: string): Promise<unknown>;
  setItem(name: string, value: unknown): Promise<void>;
  removeItem(name: string): Promise<void>;
}

export function wrapChunkedStorage(storage: RawStorage): RawStorage {
  return {
    getItem: (name) =>
      withKeyLock(storage, name, async () => {
        const meta = await storage.getItem(name);

        if (isChunkedMetadata(meta)) {
          const { chunkCount } = meta;
          const chunkPromises = [];

          for (let i = 0; i < chunkCount; i++) {
            chunkPromises.push(storage.getItem(`${name}:chunk:${i}`));
          }

          const records = await Promise.all(chunkPromises);

          // setItem persists each slice as `{ value: chunk }`, so the raw records
          // must be unwrapped before joining. Passing them through as objects
          // produced the literal string "[object Object]" and made every store
          // larger than CHUNK_SIZE permanently unreadable — the write succeeded,
          // the read threw a JSON SyntaxError, and masterStorage reported the
          // store as empty. Missing slices are a corrupt backup, not "no data".
          const chunks = records.map((record, index) => {
            if (typeof record === 'string') return record;
            if (
              record &&
              typeof record === 'object' &&
              typeof (record as { value?: unknown }).value === 'string'
            ) {
              return (record as { value: string }).value;
            }
            throw new Error(
              `Chunked store "${name}" is corrupt: slice ${index} of ${chunkCount} is missing or malformed`
            );
          });

          return (await runParse(chunks)) as never;
        }

        return meta;
      }),

    setItem: (name, value) =>
      withKeyLock(storage, name, async () => {
        // Read the previous record BEFORE overwriting it so stale chunks from
        // the previous write can be removed exactly. (DEFER-2026-003 fix:
        // the old code blindly deleted only chunks 0..9, leaking chunks 10..N
        // whenever a key shrank from a >10-chunk write to a smaller record.)
        const previous = await storage.getItem(name);
        const previousChunkCount = isChunkedMetadata(previous) ? previous.chunkCount : 0;

        const result = await runStringify(value);

        if (result.chunks) {
          // Large payload - store in chunks
          const metadata: StorageMetadata = {
            _isChunked: true,
            chunkCount: result.chunks.length,
            totalSize: result.totalSize!,
            timestamp: Date.now(),
          };

          // Store metadata first
          await storage.setItem(name, metadata);

          // Store chunks in parallel
          await Promise.all(
            result.chunks.map((chunk: string, i: number) =>
              storage.setItem(`${name}:chunk:${i}`, { value: chunk })
            )
          );

          // Remove surplus chunks left behind by a larger previous write.
          for (let i = result.chunks.length; i < previousChunkCount; i++) {
            await storage.removeItem(`${name}:chunk:${i}`);
          }
        } else {
          // Small payload - store normally (pre-stringified to avoid jank in engine if it does stringify)
          if (result.payload === undefined) {
            throw new Error(`Serialization of "${name}" produced neither chunks nor a payload`);
          }
          await storage.setItem(name, result.payload as never);

          // Cleanup safety: remove every chunk of the previous chunked write.
          // The floor of 10 also sweeps orphans left by pre-fix builds that
          // could only leak chunks beyond index 9.
          const cleanupCount = Math.max(previousChunkCount, 10);
          for (let i = 0; i < cleanupCount; i++) {
            await storage.removeItem(`${name}:chunk:${i}`);
          }
        }
      }),

    removeItem: (name) =>
      withKeyLock(storage, name, async () => {
        const meta = await storage.getItem(name);
        await storage.removeItem(name);

        if (isChunkedMetadata(meta)) {
          const { chunkCount } = meta;
          for (let i = 0; i < chunkCount; i++) {
            await storage.removeItem(`${name}:chunk:${i}`);
          }
        }
      }),
  };
}
