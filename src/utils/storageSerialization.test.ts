/**
 * F-0025 — the main-thread serialization fallback must be byte-identical to the
 * storage worker, and persistence must keep working where workers cannot exist.
 *
 * The fallback exists because a missing `Worker` global previously made every
 * masterStorage write hang forever. A fallback that produced a DIFFERENT layout
 * from the worker would be worse than the hang: data written on one path would
 * be unreadable on the other. These tests pin equivalence against the worker's
 * own algorithm and prove the round trip.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeForStorage,
  deserializeFromStorage,
  type SerializedPayload,
} from './storageSerialization';
import { wrapChunkedStorage, __resetWorkerAvailabilityForTests } from './chunkedStorage';
import { CHUNK_SIZE } from './storageConstants';

/**
 * Independent re-implementation of src/workers/storage.worker.ts. Kept separate
 * on purpose: comparing the fallback against itself would prove nothing.
 */
function workerAlgorithm(value: unknown, chunkSize: number): SerializedPayload {
  const json = JSON.stringify(value);
  if (json.length <= chunkSize) return { payload: json };
  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += chunkSize) chunks.push(json.slice(i, i + chunkSize));
  return { chunks, totalSize: json.length };
}

interface StorageMetadataShape {
  _isChunked: boolean;
  chunkCount: number;
  totalSize: number;
}

/** Minimal in-memory PersistStorage double. */
function createMemoryStorage() {
  const map = new Map<string, unknown>();
  return {
    map,
    storage: {
      getItem: async (name: string) => (map.has(name) ? (map.get(name) as never) : null),
      setItem: async (name: string, value: unknown) => {
        map.set(name, value);
      },
      removeItem: async (name: string) => {
        map.delete(name);
      },
    },
  };
}

describe('storage serialization fallback', () => {
  beforeEach(() => {
    __resetWorkerAvailabilityForTests();
  });

  describe('equivalence with the worker algorithm', () => {
    const cases: ReadonlyArray<{ name: string; value: unknown; chunkSize: number }> = [
      { name: 'small object', value: { a: 1, b: 'two' }, chunkSize: CHUNK_SIZE },
      { name: 'empty object', value: {}, chunkSize: CHUNK_SIZE },
      {
        name: 'array of rows',
        value: Array.from({ length: 50 }, (_, i) => ({ i })),
        chunkSize: CHUNK_SIZE,
      },
      { name: 'exactly at chunk boundary', value: 'x'.repeat(98), chunkSize: 100 },
      { name: 'one char over boundary', value: 'x'.repeat(99), chunkSize: 100 },
      { name: 'multi-chunk payload', value: { blob: 'y'.repeat(1000) }, chunkSize: 100 },
      { name: 'unicode payload', value: { s: '€✓🧮'.repeat(200) }, chunkSize: 128 },
      {
        name: 'nested structure',
        value: { a: { b: { c: [1, 2, { d: null }] } } },
        chunkSize: CHUNK_SIZE,
      },
    ];

    for (const testCase of cases) {
      it(`matches the worker for ${testCase.name}`, () => {
        const fallback = serializeForStorage(testCase.value, testCase.chunkSize);
        const worker = workerAlgorithm(testCase.value, testCase.chunkSize);
        expect(fallback).toEqual(worker);
      });
    }
  });

  describe('round trip', () => {
    it('restores a single-chunk value exactly', () => {
      const value = { entries: [{ account: '1000', amount: '1234.56' }] };
      const serialized = serializeForStorage(value, CHUNK_SIZE);
      expect(serialized.chunks).toBeUndefined();
      expect(deserializeFromStorage(serialized.payload!)).toEqual(value);
    });

    it('restores a multi-chunk value exactly', () => {
      const value = { rows: Array.from({ length: 500 }, (_, i) => ({ i, note: 'n'.repeat(20) })) };
      const serialized = serializeForStorage(value, 512);
      expect(serialized.chunks!.length).toBeGreaterThan(1);
      expect(serialized.chunks!.join('').length).toBe(serialized.totalSize);
      expect(deserializeFromStorage(serialized.chunks!)).toEqual(value);
    });

    it('preserves numeric precision of string-encoded money', () => {
      const value = { total: '10000000.07', parts: ['3333333.35', '3333333.36', '3333333.36'] };
      const serialized = serializeForStorage(value, CHUNK_SIZE);
      expect(deserializeFromStorage(serialized.payload!)).toEqual(value);
    });
  });

  describe('chunked storage keeps persisting when workers are unavailable', () => {
    // jsdom has no `Worker` global, so wrapChunkedStorage exercises the real
    // fallback path here — this is the exact condition that used to hang.
    it('writes and reads back a small value', async () => {
      const { storage } = createMemoryStorage();
      const wrapped = wrapChunkedStorage(storage as never);
      const value = { state: { budgets: [{ id: 'b1', total: '100.00' }] }, version: 1 };

      await wrapped.setItem('budget-store', value as never);
      expect(await wrapped.getItem('budget-store')).toEqual(JSON.stringify(value));
    });

    it('writes and reads back a value larger than one chunk', async () => {
      const { storage, map } = createMemoryStorage();
      const wrapped = wrapChunkedStorage(storage as never);
      const big = { rows: Array.from({ length: 90000 }, (_, i) => ({ i, v: 'payload' })) };

      await wrapped.setItem('gl-store', big as never);

      const meta = map.get('gl-store') as { _isChunked: boolean; chunkCount: number };
      expect(meta._isChunked).toBe(true);
      expect(meta.chunkCount).toBeGreaterThan(1);
      expect(await wrapped.getItem('gl-store')).toEqual(big);
    });

    it('round-trips a chunked store through the real record shape', async () => {
      // Regression: setItem writes each slice as `{ value: chunk }` but getItem
      // joined the RECORDS, producing "[object Object]" and a JSON SyntaxError.
      // Every store above CHUNK_SIZE was therefore write-only — the data was
      // persisted and could never be read back.
      const { storage, map } = createMemoryStorage();
      const wrapped = wrapChunkedStorage(storage as never);
      const ledger = {
        state: {
          entries: Array.from({ length: 30000 }, (_, i) => ({
            id: `e-${i}`,
            account: '4000',
            debit: '100.00',
            credit: '0.00',
            memo: 'chunk boundary probe',
          })),
        },
        version: 1,
      };

      await wrapped.setItem('gl-entries', ledger as never);

      const meta = map.get('gl-entries') as StorageMetadataShape;
      expect(meta._isChunked, 'fixture must exceed one chunk to be meaningful').toBe(true);
      expect(map.get('gl-entries:chunk:0')).toHaveProperty('value');
      expect(await wrapped.getItem('gl-entries')).toEqual(ledger);
    });

    it('reports corruption instead of silently returning an empty store', async () => {
      const { storage, map } = createMemoryStorage();
      const wrapped = wrapChunkedStorage(storage as never);
      const value = { rows: Array.from({ length: 90000 }, (_, i) => ({ i, v: 'payload' })) };

      await wrapped.setItem('corrupt-store', value as never);
      const meta = map.get('corrupt-store') as StorageMetadataShape;
      expect(meta.chunkCount).toBeGreaterThan(1);

      // Simulate a lost slice (partial write, evicted row, truncated backup).
      map.delete(`corrupt-store:chunk:${meta.chunkCount - 1}`);

      await expect(wrapped.getItem('corrupt-store')).rejects.toThrow(/corrupt/i);
    });

    it('completes promptly rather than hanging', async () => {
      const { storage } = createMemoryStorage();
      const wrapped = wrapChunkedStorage(storage as never);
      const started = Date.now();
      await wrapped.setItem('timing-probe', { a: 1 } as never);
      expect(Date.now() - started).toBeLessThan(5000);
    });
  });
});
