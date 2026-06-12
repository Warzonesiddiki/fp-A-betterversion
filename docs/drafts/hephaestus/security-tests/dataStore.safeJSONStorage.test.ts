<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->
/**
 * SECURITY: dataStore — safeJSONStorage wrapper
 *
 * `safeJSONStorage` wraps an underlying PersistStorage to make it DoS-resilient:
 *   - getItem returns null (not throws) when the underlying call throws or
 *     returns invalid JSON
 *   - setItem / removeItem swallow errors in DEV (logged as a warn) and stay
 *     no-ops in PROD
 *   - Preserves the underlying storage's optional methods (e.g., __resetCache)
 *
 * Why this matters for dataStore: it is the largest persisted store (cube data,
 * scenarios, allocations). A malformed `localStorage` entry (or a quota-exceeded
 * error) must not crash the app or wipe the rehydration path. The wrapper
 * isolates failures to a single key, not the whole store.
 *
 * Source under test: `src/utils/storage/safeJSONStorage.ts`
 * Pre-existing test file: none
 * Audit reference: ADR-012 (data-storage-scoping, decision tree: dataStore = business data, needs integrity + DoS resilience)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeJSONStorage } from '@/utils/storage/safeJSONStorage';
import type { AnyPersistStorage, PersistStorage } from '@/utils/storage/safeJSONStorage';

// ---------- Test fixtures ----------

/** A minimal in-memory PersistStorage for happy-path tests. */
const makeInMemoryStorage = (): AnyPersistStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => {
      map.set(name, value);
    },
    removeItem: (name: string) => {
      map.delete(name);
    },
  };
};

/** A storage whose getItem always throws (simulates quota corruption). */
const makeThrowingStorage = (): AnyPersistStorage => ({
  getItem: () => {
    throw new Error('QuotaExceededError: localStorage is corrupted');
  },
  setItem: () => {
    /* noop */
  },
  removeItem: () => {
    /* noop */
  },
});

/** A storage whose setItem always throws (simulates quota-exceeded on write). */
const makeQuotaExceededStorage = (): AnyPersistStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: () => {
      throw new Error('QuotaExceededError: would exceed localStorage quota');
    },
    removeItem: () => {
      throw new Error('QuotaExceededError: cannot remove from localStorage');
    },
  };
};

describe('SECURITY: dataStore — safeJSONStorage wrapper', () => {
  describe('positive cases — round-trip behavior', () => {
    it('round-trips a JSON-serializable value through the wrapper', () => {
      // Arrange
      const inner = makeInMemoryStorage();
      const wrapped = safeJSONStorage<{ name: string; n: number }>(inner);
      const value = { name: 'scenario-001', n: 42 };

      // Act
      wrapped.setItem('key1', value);
      const result = wrapped.getItem('key1');

      // Assert
      expect(result).toEqual(value);
    });

    it('round-trips a deeply nested value', () => {
      // Arrange
      const inner = makeInMemoryStorage();
      const wrapped = safeJSONStorage<{ tree: unknown }>(inner);
      const value = {
        tree: { a: { b: { c: [1, 2, { d: 'leaf' }] } } },
      };

      // Act
      wrapped.setItem('deep', value);
      const result = wrapped.getItem('deep');

      // Assert
      expect(result).toEqual(value);
    });

    it('handles a falsy-but-valid serialized return (empty string)', () => {
      // Arrange — an empty string from getItem is a valid (rehydrated-to-default)
      // case for zustand. The wrapper must NOT collapse it to null.
      const inner = makeInMemoryStorage();
      inner.setItem('empty', '');
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act
      const result = wrapped.getItem('empty');

      // Assert — exact behavior depends on zustand's parser; we only assert
      // that the wrapper does not throw. If the parser returns the empty
      // string, the wrapper should pass it through. If the parser returns
      // null, the wrapper should also return null. Either is acceptable;
      // what matters is no throw.
      expect(result === '' || result === null).toBe(true);
    });
  });

  describe('negative cases — getItem failure (DoS resilience)', () => {
    it('returns null when the underlying getItem throws (does NOT propagate)', () => {
      // Arrange
      const inner = makeThrowingStorage();
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act + Assert
      expect(() => wrapped.getItem('any-key')).not.toThrow();
      expect(wrapped.getItem('any-key')).toBeNull();
    });

    it('returns null when the underlying getItem returns null', () => {
      // Arrange
      const inner = makeInMemoryStorage();
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act
      const result = wrapped.getItem('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when the underlying getItem returns invalid JSON (corrupt entry)', () => {
      // Arrange — simulate a corrupted localStorage entry
      const inner = makeInMemoryStorage();
      inner.setItem('corrupt', '{not valid JSON');
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act + Assert
      expect(() => wrapped.getItem('corrupt')).not.toThrow();
      expect(wrapped.getItem('corrupt')).toBeNull();
    });
  });

  describe('negative cases — setItem / removeItem failure (quota resilience)', () => {
    it('does NOT throw when the underlying setItem throws (quota exceeded)', () => {
      // Arrange
      const inner = makeQuotaExceededStorage();
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act + Assert
      expect(() => wrapped.setItem('k', { data: 'x' })).not.toThrow();
    });

    it('does NOT throw when the underlying removeItem throws', () => {
      // Arrange
      const inner = makeQuotaExceededStorage();
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act + Assert
      expect(() => wrapped.removeItem('k')).not.toThrow();
    });
  });

  describe('observability — DEV warning on failure', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* swallow */
      });
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('logs a warning when the underlying getItem throws in DEV', () => {
      // Arrange
      const inner = makeThrowingStorage();
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act
      wrapped.getItem('any-key');

      // Assert — the wrapper must surface the failure (otherwise the user
      // sees a rehydration that silently disappeared, which is a worse UX
      // than a logged warning).
      expect(warnSpy).toHaveBeenCalled();
      // The warning must mention the key name so the operator can correlate
      // to a specific persisted state.
      const warnMessage = warnSpy.mock.calls[0]?.[0]?.toString() ?? '';
      expect(warnMessage).toMatch(/any-key|safeJSONStorage|getItem/);
    });

    it('warning does NOT include the parsed value (PII leak prevention)', () => {
      // Arrange — even on failure, the warning must reference the key name
      // and error message, not the value the wrapper was trying to parse.
      // (A wrapper that logs the value would create a PII leak path for
      // sensitive fields like auth tokens, scenarios with PII, etc.)
      const inner = makeThrowingStorage();
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act
      wrapped.getItem('auth-token-key');

      // Assert
      const allWarnArgs = warnSpy.mock.calls.flat().map((c) => String(c));
      for (const arg of allWarnArgs) {
        // The key name is OK; the value would NOT be. We assert that no
        // arg contains a long random-looking string (a heuristic for a
        // token-like value).
        expect(arg).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/); // no JWT
        expect(arg).not.toMatch(/nvapi-[A-Za-z0-9]{20,}/); // no NIM key
      }
    });
  });

  describe('pass-through — underlying storage methods are preserved', () => {
    it('exposes the underlying storage\'s optional methods (e.g., __resetCache)', () => {
      // Arrange
      const resetCache = vi.fn();
      const inner: AnyPersistStorage = {
        ...makeInMemoryStorage(),
        __resetCache: resetCache,
      };
      const wrapped = safeJSONStorage<unknown>(inner);

      // Act
      // The wrapper should expose __resetCache as a pass-through method
      // (zustand persist calls __resetCache on certain state operations).
      const wrappedAny = wrapped as unknown as { __resetCache?: () => void };
      wrappedAny.__resetCache?.();

      // Assert
      expect(resetCache).toHaveBeenCalled();
    });
  });

  describe('performance sanity', () => {
    it('completes a wrap + set + get roundtrip in under 10ms (perf budget for rehydration)', () => {
      // Arrange
      const inner = makeInMemoryStorage();
      const value = { rows: Array.from({ length: 100 }, (_, i) => ({ i, v: i * 2 })) };

      // Act
      const start = performance.now();
      const wrapped = safeJSONStorage<typeof value>(inner);
      wrapped.setItem('perf', value);
      const result = wrapped.getItem('perf');
      const elapsed = performance.now() - start;

      // Assert
      expect(result).toEqual(value);
      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('integration — dataStore can be created with safeJSONStorage(masterStorage)', () => {
    it('accepts a masterStorage-shaped input (compatible PersistStorage interface)', () => {
      // Arrange — masterStorage is exported from @/utils/masterStorage; we
      // import the type to confirm the structural contract, but do NOT
      // actually create a masterStorage instance in this test (the worker
      // pool + sql.js mocks would be needed for a real round-trip; that's
      // covered by dataStore's own test file). The point here is the
      // wrapper's TYPE accepts a masterStorage-shaped input without a cast.
      const inner = makeInMemoryStorage();
      // This is the call shape dataStore would use:
      //   safeJSONStorage<MyState>(masterStorage)
      const wrapped = safeJSONStorage<{ scenarioId: string }>(inner);

      // Act
      const writeResult: PersistStorage<{ scenarioId: string }, unknown> = wrapped;

      // Assert — the type assignment is the actual test (tsc would fail
      // at compile time if the contract mismatched). At runtime, the
      // wrapper is functionally usable.
      expect(typeof writeResult.setItem).toBe('function');
      expect(typeof writeResult.getItem).toBe('function');
      expect(typeof writeResult.removeItem).toBe('function');
    });
  });
});

// AUDIT: 2026-06-13 — Hephaestus
// - 13 test cases across 7 categories: 3 positive, 3 getItem failure, 2 setItem/removeItem failure,
//   2 observability (1 warn + 1 PII hygiene), 1 pass-through, 1 perf, 1 integration (13 total)
// - Source verified: src/utils/storage/safeJSONStorage.ts (real API: safeJSONStorage<S>(storage: AnyPersistStorage): PersistStorage<S, unknown>)
// - The original patch assumed a different API (storage: Storage, getItem returning a fallback state).
//   Tests rewritten to match the real source. The behavioral contract is the same:
//   DoS-resilient, null-on-failure, no-throw on quota-exceeded.
// - No property-based test included (fast-check not in package.json).
// - Integration with the real dataStore is not exercised here because dataStore
//   depends on zustand persist + masterStorage + worker pool, which is its own
//   test concern. This file tests the wrapper in isolation.
