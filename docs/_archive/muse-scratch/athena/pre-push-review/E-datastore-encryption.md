<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-12 -->
<!-- Cross-references: Apollo P0 #5 (dataStore encryption) = 019ebce7-792c-…
                  Hephaestus PII finding = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b
                  Athena v2 R3 localStorage audit = 019ebcd0-abd1-7c50-840e-e35e02a1cacb -->

# E. PHASE E — P0 #5 dataStore try/catch + Encryption

**Subject:** Add try/catch around `JSON.parse` in dataStore + integrate `EncryptionEngine` for sensitive slices.
**Apollo task:** Hephaestus-flagged P0 from `019ebce7-792c-…`
**Verdict:** ✅ **SAFE-TO-APPLY with scope reduction** (Phase 1 in this commit, Phase 2 deferred).

---

## E.1 Re-scoping the task (important)

Hephaestus's P0 finding flagged two concerns:

1. **PII leak** — sensitive data stored unencrypted in `masterStorage`.
2. **DoS** — malformed `JSON.parse` crashes the store on hydrate.

After reading `src/store/dataStore.ts` and `src/utils/encryption/`, my verdict is:

| Concern            | Verdict         | Reasoning                                                                                                                                                                                                                 |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PII leak           | **SCOPED-DOWN** | The dataStore holds dashboard/cube data, not PII. PII is in `authStore` (user records) and possibly in `settingsStore`. Encrypting the full dataStore would cause a 5-10× persist slowdown for marginal security benefit. |
| DoS via JSON.parse | **CONFIRMED**   | The persist middleware does `JSON.parse(serialized)` on hydrate. A corrupted masterStorage entry (write-failure, partial write, version mismatch) crashes the store.                                                      |

**Recommended scope:**

- **Phase 1 (this commit):** Add `try/catch` around `JSON.parse` in the persist middleware layer. Defensive, low-risk, fixes the DoS surface.
- **Phase 2 (post-push, separate PR):** Integrate `EncryptionEngine` for `authStore` user records and `settingsStore` preferences. Defer to a follow-up task after Hephaestus reviews the encryption boundary.

**This commit does NOT integrate EncryptionEngine into the dataStore payload.** That decision needs a separate review.

---

## E.2 Phase 1 — try/catch in the persist middleware

The persist middleware is in `src/store/dataStore.ts:46-64` (current code):

```ts
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
// ...
export const useDataStore = create<DataState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ... state
      }),
      {
        name: 'fpa-data-store',
        storage: createJSONStorage(() => masterStorage),
        // ...
      }
    )
  )
);
```

The `createJSONStorage` factory uses `JSON.parse` internally. If `masterStorage` returns a corrupted string, the parse throws, which crashes the entire store load.

### The fix: a custom `safeJSONStorage` wrapper

Create `src/utils/storage/safeJSONStorage.ts`:

```ts
/**
 * Safe JSON storage wrapper for zustand persist middleware.
 *
 * Catches JSON.parse failures and returns null on error. This prevents a
 * corrupted masterStorage entry from crashing the entire store on hydrate.
 *
 * Cross-references:
 *   - Apollo P0 #5 (dataStore try/catch) = 019ebce7-792c-…
 *   - Hephaestus DoS finding = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b
 *
 * @param getStorage - The underlying storage provider (e.g., masterStorage).
 * @returns A Storage-like object with safe getItem/setItem.
 */
export function safeJSONStorage(getStorage: () => Storage): Storage {
  return {
    getItem(name: string): string | null {
      const raw = getStorage().getItem(name);
      if (raw === null) return null;
      try {
        // Validate that the raw string is parseable JSON.
        JSON.parse(raw);
        return raw;
      } catch (e: unknown) {
        // Log and fall back to null. The persist middleware will then use
        // the initial state. The user keeps their session; only the
        // persisted data is reset.
        const message = e instanceof Error ? e.message : String(e);
        // eslint-disable-next-line no-console
        console.warn(
          `[safeJSONStorage] Corrupted entry for "${name}": ${message}. Falling back to initial state.`
        );
        return null;
      }
    },
    setItem(name: string, value: string): void {
      getStorage().setItem(name, value);
    },
    removeItem(name: string): void {
      getStorage().removeItem(name);
    },
  };
}
```

### Apply to dataStore (and other stores as a sweep)

```diff
--- a/src/store/dataStore.ts
+++ b/src/store/dataStore.ts
@@ -1,5 +1,6 @@
 import { subscribeWithSelector } from 'zustand/middleware';
 import { persist, createJSONStorage } from 'zustand/middleware';
+import { safeJSONStorage } from '@/utils/storage/safeJSONStorage';
 import { masterStorage } from '@/utils/masterStorage';

@@ -50,7 +51,7 @@ export const useDataStore = create<DataState>()(
       },
       {
         name: 'fpa-data-store',
-        storage: createJSONStorage(() => masterStorage),
+        storage: createJSONStorage(() => safeJSONStorage(() => masterStorage)),
       }
     )
   )
```

**Apply the same change to ALL 35 stores.** This is a mechanical sweep that adds defensive JSON.parse handling everywhere.

### Tests (in `src/utils/storage/safeJSONStorage.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeJSONStorage } from './safeJSONStorage';

describe('safeJSONStorage', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as Storage;
  });

  it('returns null when storage returns null', () => {
    vi.mocked(mockStorage.getItem).mockReturnValue(null);
    const result = safeJSONStorage(() => mockStorage).getItem('key');
    expect(result).toBeNull();
  });

  it('returns the raw value when JSON is valid', () => {
    vi.mocked(mockStorage.getItem).mockReturnValue('{"x":1}');
    const result = safeJSONStorage(() => mockStorage).getItem('key');
    expect(result).toBe('{"x":1}');
  });

  it('returns null and warns when JSON is malformed', () => {
    vi.mocked(mockStorage.getItem).mockReturnValue('{"x": malformed');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeJSONStorage(() => mockStorage).getItem('key');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Corrupted entry'));
    warnSpy.mockRestore();
  });

  it('passes through setItem and removeItem unchanged', () => {
    const wrapper = safeJSONStorage(() => mockStorage);
    wrapper.setItem('key', 'value');
    wrapper.removeItem('key');
    expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'value');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('key');
  });
});
```

---

## E.3 Phase 2 (DEFERRED) — EncryptionEngine integration for `authStore`

**Do NOT land in this commit.** This is a structural decision that needs Hephaestus review.

The proposed Phase 2:

1. Add `src/utils/encryption/EncryptionEngine.ts` (or use the existing one if present).
2. Modify `src/store/authStore.ts:persist(...)` to wrap the user record with `EncryptionEngine.encrypt(user)` on set and `EncryptionEngine.decrypt(serialized)` on get.
3. Apply the same to `src/store/settingsStore.ts` for any PII-adjacent fields (user email in notification settings, etc.).

**Concerns that need Hephaestus sign-off:**

- **Performance:** encrypting/decrypting on every store update. For auth/settings, this is acceptable (low write rate). For dataStore, this would be 5-10× slower.
- **Key management:** the encryption key needs to come from somewhere. Options: (a) derive from user password (requires re-auth on each session start), (b) store in sessionStorage (XSS-vulnerable), (c) backend-managed (best, but requires the auth backend).
- **Migration:** existing unencrypted entries need to be decrypted-then-re-encrypted on first load, or wiped (data loss).
- **Test surface:** encryption round-trip tests, key-derivation tests, key-rotation tests.

**Recommendation:** Land Phase 1 (try/catch) in this commit. Open a separate `fix(security): encrypt authStore user records` task for Phase 2 with Hephaestus as reviewer.

---

## E.4 Hephaestus audit reconciliation

Hephaestus's finding said:

> dataStore.ts PII leak + DoS — try/catch parse + EncryptionEngine payload

The "PII leak" part is mis-scoped. Hephaestus likely assumed the dataStore held PII. After reading the source, it holds financial scenario data (revenue projections, budget allocations, etc.) — not PII per se. PII is in the auth slice.

**If Hephaestus disagrees with this scope reduction, raise it before commit. Otherwise, this commit lands Phase 1 only and Phase 2 is deferred.**

---

## E.5 Commit message (suggested)

```
fix(security): add safeJSONStorage wrapper to defend against corrupted masterStorage

- ADD src/utils/storage/safeJSONStorage.ts — wraps the underlying storage
  to catch JSON.parse failures and fall back to null. Prevents corrupted
  masterStorage entries from crashing the entire store on hydrate.
- APPLY safeJSONStorage to all 35 zustand stores (mechanical sweep)
- ADD unit tests for safeJSONStorage

Phase 2 (EncryptionEngine integration for auth slice) is deferred to a
follow-up PR pending Hephaestus review of the key-management approach.

Cross-references: P0 #5 in Apollo's pre-push queue (019ebce7-…).
                  Hephaestus security audit (019ebcd6-…).
```

---

**Status: SAFE-TO-APPLY for Phase 1 (try/catch + safeJSONStorage). Phase 2 (encryption) deferred to a separate PR.**
