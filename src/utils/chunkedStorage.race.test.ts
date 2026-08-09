import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapChunkedStorage, type StorageMetadata, type RawStorage } from './chunkedStorage';
import { serializeForStorage } from './storageSerialization';
import { CHUNK_SIZE } from './storageConstants';

/**
 * DEFER-2026-003 regression suite — concurrency races in wrapChunkedStorage.
 *
 * Prior to the fix, four race windows existed:
 *   1. setItem + setItem on one key  → torn writes (metadata/chunks from
 *      different writers interleaved).
 *   2. setItem + getItem on one key  → read-tear (half-written payload).
 *   3. removeItem + setItem          → resurrection (new metadata deleted
 *      after the new chunks were written) + orphaned chunks.
 *   4. chunked → small transition    → chunks beyond index 9 leaked forever.
 *
 * The fix serializes getItem/setItem/removeItem per (storage instance, key)
 * via a promise-chain mutex and removes stale chunks exactly. These tests
 * widen the race window with a slow mock storage and assert the invariants.
 */

// Small chunk size so ordinary-sized fixtures exercise the chunked paths.
vi.mock('./storageConstants', () => ({
  CHUNK_SIZE: 64,
}));

// Mock the worker pool with the REAL serialization contract so chunked paths
// behave exactly as in production (chunks when JSON > CHUNK_SIZE).
vi.mock('../workers/worker-pool', async () => {
  const actual =
    await vi.importActual<typeof import('./storageSerialization')>('./storageSerialization');
  return {
    createStoragePool: () => ({
      run: vi.fn(async (request: { type: string; payload: unknown; chunkSize?: number }) => {
        if (request.type === 'stringify') {
          return actual.serializeForStorage(request.payload, request.chunkSize ?? 64);
        }
        if (request.type === 'parse') {
          return { payload: actual.deserializeFromStorage(request.payload as string | string[]) };
        }
        return { payload: request.payload };
      }),
    }),
  };
});

interface SlowStorage extends RawStorage {
  store: Map<string, unknown>;
}

/** Storage adapter that pays a small delay on every op to widen race windows. */
function createSlowStorage(delayMs = 1): SlowStorage {
  const store = new Map<string, unknown>();
  const delay = () => new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  return {
    store,
    getItem: vi.fn(async (name: string) => {
      await delay();
      return store.get(name) ?? null;
    }),
    setItem: vi.fn(async (name: string, value: unknown) => {
      await delay();
      store.set(name, value);
    }),
    removeItem: vi.fn(async (name: string) => {
      await delay();
      store.delete(name);
    }),
  };
}

/** A value whose JSON exceeds CHUNK_SIZE by a wide margin. */
function bigValue(tag: string, chunkMultiple: number): Record<string, unknown> {
  const pad = 'x'.repeat(CHUNK_SIZE * chunkMultiple);
  return { tag, pad };
}

/** Chunk count the real serializer would produce for this value. */
function chunkCountOf(value: unknown): number {
  const result = serializeForStorage(value, CHUNK_SIZE);
  return result.chunks?.length ?? 0;
}

function chunkKeysOf(storage: SlowStorage, name: string): string[] {
  return [...storage.store.keys()].filter((k) => k.startsWith(`${name}:chunk:`));
}

describe('wrapChunkedStorage — DEFER-2026-003 race regression', () => {
  let raw: SlowStorage;

  beforeEach(() => {
    raw = createSlowStorage();
  });

  it('concurrent setItem calls never produce torn writes (metadata matches chunks)', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const name = 'torn-write';

    const seed = bigValue('seed', 12);
    const valueA = bigValue('A', 12);
    const valueB = bigValue('B', 14);
    expect(chunkCountOf(seed)).toBeGreaterThan(10);

    // Seed a chunked record so both writers race over an existing key.
    await wrapped.setItem(name, seed);

    await Promise.all([wrapped.setItem(name, valueA), wrapped.setItem(name, valueB)]);

    const meta = raw.store.get(name) as StorageMetadata;
    expect(meta._isChunked).toBe(true);

    // Invariant: persisted chunk records equal metadata.chunkCount exactly.
    expect(chunkKeysOf(raw, name)).toHaveLength(meta.chunkCount);

    // Invariant: the reassembled record is EXACTLY one of the two written
    // values — never a mix of chunks from different writers.
    const read = (await wrapped.getItem(name)) as Record<string, unknown>;
    const tag = read.tag;
    expect(['A', 'B']).toContain(tag);
    expect(read).toEqual(tag === 'A' ? valueA : valueB);
  });

  it('reads racing a writer return a complete value, never a torn payload', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const name = 'read-tear';

    const valueA = bigValue('A', 12);
    const valueB = bigValue('B', 12);
    await wrapped.setItem(name, valueA);

    // Start a writer and hammer it with concurrent readers.
    const writer = wrapped.setItem(name, valueB);
    const reads = await Promise.all(
      Array.from({ length: 8 }, () => wrapped.getItem(name) as Promise<Record<string, unknown>>)
    );
    await writer;

    for (const read of reads) {
      expect(read).not.toBeNull();
      const tag = read.tag;
      // Every observation is one of the two complete values — never corrupt.
      expect(['A', 'B']).toContain(tag);
      expect(read).toEqual(tag === 'A' ? valueA : valueB);
    }
  });

  it('removeItem followed by setItem does not resurrect-delete the new record', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const name = 'resurrection';

    await wrapped.setItem(name, bigValue('old', 12));

    // remove first, then set — serialized in call order, so the final state
    // must be the new value with a consistent chunk set.
    const newValue = bigValue('new', 12);
    await Promise.all([wrapped.removeItem(name), wrapped.setItem(name, newValue)]);

    const read = (await wrapped.getItem(name)) as Record<string, unknown>;
    expect(read).not.toBeNull();
    expect(read).toEqual(newValue);

    const meta = raw.store.get(name) as StorageMetadata;
    expect(chunkKeysOf(raw, name)).toHaveLength(meta.chunkCount);

    // Reverse order: set then remove → the key is fully gone.
    await Promise.all([wrapped.setItem(name, bigValue('x', 12)), wrapped.removeItem(name)]);
    expect(await wrapped.getItem(name)).toBeNull();
    expect(chunkKeysOf(raw, name)).toHaveLength(0);
  });

  it('shrinking from a chunked write to a small payload leaves no orphaned chunks', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const name = 'orphan-leak';

    const huge = bigValue('huge', 12);
    const hugeChunks = chunkCountOf(huge);
    expect(hugeChunks).toBeGreaterThan(10); // exceeds the old hardcoded 10-cap

    await wrapped.setItem(name, huge);
    expect(chunkKeysOf(raw, name)).toHaveLength(hugeChunks);

    // Transition to a non-chunked (small) record. The wrapped adapter stores
    // the pre-stringified JSON payload, so a non-chunked read returns that
    // string verbatim (zustand/parse layers above do the JSON.parse).
    await wrapped.setItem(name, { tiny: true });

    expect(chunkKeysOf(raw, name)).toHaveLength(0);
    expect(await wrapped.getItem(name)).toBe(JSON.stringify({ tiny: true }));
  });

  it('shrinking between two chunked writes removes surplus old chunks', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const name = 'surplus';

    const big = bigValue('big', 14);
    const small = bigValue('small', 4);
    const bigChunks = chunkCountOf(big);
    const smallChunks = chunkCountOf(small);
    expect(bigChunks).toBeGreaterThan(smallChunks);

    await wrapped.setItem(name, big);
    expect(chunkKeysOf(raw, name)).toHaveLength(bigChunks);

    await wrapped.setItem(name, small);

    const meta = raw.store.get(name) as StorageMetadata;
    expect(meta.chunkCount).toBe(smallChunks);
    expect(chunkKeysOf(raw, name)).toHaveLength(smallChunks);
    expect(await wrapped.getItem(name)).toEqual(small);
  });

  it('different keys are not serialized against each other (lock is per-key)', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const k1 = bigValue('one', 8);
    const k2 = bigValue('two', 8);

    await Promise.all([
      wrapped.setItem('k1', k1),
      wrapped.setItem('k2', k2),
      wrapped.setItem('k3', { small: true }),
    ]);

    expect(await wrapped.getItem('k1')).toEqual(k1);
    expect(await wrapped.getItem('k2')).toEqual(k2);
    expect(await wrapped.getItem('k3')).toBe(JSON.stringify({ small: true }));
  });

  it('a failing write does not poison the lock for later operations', async () => {
    const wrapped = wrapChunkedStorage(raw);
    const name = 'poison';

    // First write succeeds and establishes the key.
    await wrapped.setItem(name, { v: 1 });

    // Force exactly one underlying-storage failure mid-write.
    const originalSet = raw.setItem;
    let failNext = true;
    raw.setItem = vi.fn(async (k: string, v: unknown) => {
      if (failNext) {
        failNext = false;
        throw new Error('simulated storage failure');
      }
      return originalSet(k, v);
    });

    await expect(wrapped.setItem(name, { v: 2 })).rejects.toThrow('simulated storage failure');

    // The lock must still service subsequent operations on the same key.
    await expect(wrapped.setItem(name, { v: 3 })).resolves.toBeUndefined();
    expect(await wrapped.getItem(name)).toBe(JSON.stringify({ v: 3 }));
  });
});
