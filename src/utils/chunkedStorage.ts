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
    getItem: async (name) => {
      const meta = await storage.getItem(name);

      if (
        meta &&
        typeof meta === 'object' &&
        '_isChunked' in meta &&
        (meta as StorageMetadata)._isChunked
      ) {
        const { chunkCount } = meta as unknown as StorageMetadata;
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
    },

    setItem: async (name, value) => {
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
      } else {
        // Small payload - store normally (pre-stringified to avoid jank in engine if it does stringify)
        if (result.payload === undefined) {
          throw new Error(`Serialization of "${name}" produced neither chunks nor a payload`);
        }
        await storage.setItem(name, result.payload as never);

        // Cleanup safety (limit to 10 chunks as mentioned before)
        for (let i = 0; i < 10; i++) {
          await storage.removeItem(`${name}:chunk:${i}`);
        }
      }
    },

    removeItem: async (name) => {
      const meta = await storage.getItem(name);
      await storage.removeItem(name);

      if (
        meta &&
        typeof meta === 'object' &&
        '_isChunked' in meta &&
        (meta as StorageMetadata)._isChunked
      ) {
        const { chunkCount } = meta as unknown as StorageMetadata;
        for (let i = 0; i < chunkCount; i++) {
          await storage.removeItem(`${name}:chunk:${i}`);
        }
      }
    },
  };
}
