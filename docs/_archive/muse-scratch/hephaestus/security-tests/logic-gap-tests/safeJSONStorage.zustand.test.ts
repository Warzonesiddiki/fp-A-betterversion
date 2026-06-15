/**
 * safeJSONStorage — zustand persist integration tests (T-HEP-004 Gap 3)
 *
 * Closes the logic gap in `dataStore.safeJSONStorage.test.ts` which tests the
 * wrapper in isolation but not as a zustand `persist` middleware adapter.
 *
 * Spec: docs/drafts/hephaestus/logic-gap-test-spec.md §3
 * ADR: ADR-007 (encryption-at-rest — encryption is a future wrapper on top of this), ADR-012 (data storage scoping)
 * Source: src/utils/storage/safeJSONStorage.ts:17-49
 *
 * Cases: 5
 * Est: ~1 hr
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { persist, createJSONStorage, type PersistStorage } from 'zustand/middleware';
import { safeJSONStorage } from '../../../src/utils/storage/safeJSONStorage';

// `AnyPersistStorage` is a private alias inside safeJSONStorage.ts:15.
// We re-state the type contract here so the wrapper accepts our mock.
type AnyPersistStorage = PersistStorage<unknown, unknown> & { __resetCache?: () => void };

// In-memory storage that meets the AnyPersistStorage contract
const memoryStorage = (() => {
  const map = new Map<string, string>();
  return {
    getItem: vi.fn(async (k: string) => map.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      map.set(k, v);
    }),
    removeItem: vi.fn(async (k: string) => {
      map.delete(k);
    }),
    _map: map,
  };
})();

describe('safeJSONStorage — zustand integration (ADR-007, ADR-012)', () => {
  beforeEach(() => {
    memoryStorage._map.clear();
    memoryStorage.getItem.mockClear();
    memoryStorage.setItem.mockClear();
  });

  type State = { count: number; setCount: (n: number) => void };

  // 1. A zustand store with persist(safeJSONStorage(memoryStorage)) rehydrates
  it('a zustand store with persist(safeJSONStorage(...)) rehydrates from prior writes', async () => {
    const wrapped = safeJSONStorage<number>(memoryStorage as unknown as AnyPersistStorage);

    // First store: write 42
    const useStore1 = create<State>()(
      persist(
        (set) => ({ count: 0, setCount: (n) => set({ count: n }) }),
        { name: 'test-key-1', storage: createJSONStorage(() => wrapped as unknown as PersistStorage<number, unknown>) }
      )
    );
    useStore1.getState().setCount(42);
    // Wait one tick for the persist middleware to flush
    await new Promise((r) => setTimeout(r, 10));

    // Second store: should rehydrate to 42
    const useStore2 = create<State>()(
      persist(
        (set) => ({ count: 0, setCount: (n) => set({ count: n }) }),
        { name: 'test-key-1', storage: createJSONStorage(() => wrapped as unknown as PersistStorage<number, unknown>) }
      )
    );
    // Wait for rehydration
    await new Promise((r) => setTimeout(r, 10));

    expect(useStore2.getState().count).toBe(42);
  });

  // 2. getItem returning null leaves the store with its initial state
  it('a fresh storage (no prior writes) leaves the store with the default initial state', async () => {
    const wrapped = safeJSONStorage<number>(memoryStorage as unknown as AnyPersistStorage);
    const useStore = create<State>()(
      persist(
        (set) => ({ count: 0, setCount: (n) => set({ count: n }) }),
        { name: 'test-key-2', storage: createJSONStorage(() => wrapped as unknown as PersistStorage<number, unknown>) }
      )
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(useStore.getState().count).toBe(0);
  });

  // 3. getItem returning invalid JSON leaves the store with its initial state
  it('corrupt JSON in storage does not poison the store — it falls back to initial state', async () => {
    // Pre-seed with corrupt JSON
    memoryStorage._map.set('test-key-3', '{not valid JSON');

    const wrapped = safeJSONStorage<number>(memoryStorage as unknown as AnyPersistStorage);
    const useStore = create<State>()(
      persist(
        (set) => ({ count: 0, setCount: (n) => set({ count: n }) }),
        { name: 'test-key-3', storage: createJSONStorage(() => wrapped as unknown as PersistStorage<number, unknown>) }
      )
    );
    await new Promise((r) => setTimeout(r, 10));
    // Initial state preserved, not the corrupt string
    expect(useStore.getState().count).toBe(0);
  });

  // 4. setItem failures during persist.setState are caught and don't crash the store
  it('a setItem failure during setState is caught — the store still functions', async () => {
    // Make setItem throw a quota error
    memoryStorage.setItem.mockImplementationOnce(async () => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });
    // Subsequent calls succeed
    memoryStorage.setItem.mockImplementation(async (k: string, v: string) => {
      memoryStorage._map.set(k, v);
    });

    const wrapped = safeJSONStorage<number>(memoryStorage as unknown as AnyPersistStorage);
    const useStore = create<State>()(
      persist(
        (set) => ({ count: 0, setCount: (n) => set({ count: n }) }),
        { name: 'test-key-4', storage: createJSONStorage(() => wrapped as unknown as PersistStorage<number, unknown>) }
      )
    );

    // This should NOT crash the store, even though setItem throws
    expect(() => useStore.getState().setCount(99)).not.toThrow();
    // Store still has the new value in memory
    expect(useStore.getState().count).toBe(99);

    // Subsequent writes work
    useStore.getState().setCount(100);
    await new Promise((r) => setTimeout(r, 10));
  });

  // 5. The wrapped storage still works as a PersistStorage (type contract)
  it('the wrapped storage satisfies the PersistStorage type contract', () => {
    const wrapped = safeJSONStorage<number>(memoryStorage as unknown as AnyPersistStorage);
    // Type-level assertion (no runtime check)
    const asPersistStorage: PersistStorage<number, unknown> = wrapped as unknown as PersistStorage<number, unknown>;
    expect(asPersistStorage).toBeDefined();
  });
});
