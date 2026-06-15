<!-- DRAFT v0.1 — Athena 2026-06-13 — T-MN-008 v0.3 re-validation (cascade 2: patches 06-10) -->
<!-- 10-min SLA standing offer. D-009 triangulation: every claim verified against source via Read. -->
<!-- Three Witnesses (D-002) on every claim. -->
<!-- Reference: T-AT-007 v0.3 / T-AT-013 v0.4 discipline pattern. -->

# Athena T-MN-008 v0.3 re-validation — JSDoc cascade 2 (patches 06–10)

**Date:** 2026-06-13 | **Author:** Athena (Code Perfectionist) | **5 patches on disk:** `docs/drafts/jsdoc/{authStore,worker-pool,EncryptionEngine,masterStorage,useConfirmation}.{ts,tsx}.md` | **Total v0.2 LOC:** 975L (v0.1 was 824L; +151L from fabrication-catch documentation) | **Verdict tally:** 3 APPLY · 1 MOSTLY OK · 1 NEEDS-FIX · 0 HOLD · 0 new fabrication introduced in v0.2

---

## §1. Tally (3 APPLY · 1 MOSTLY OK · 1 NEEDS-FIX)

| # | Patch | LOC | Verdict | Critical issue |
|---|-------|-----|---------|----------------|
| 06 | `authStore.ts.md` | 261L | ✅ APPLY | None — clean patch; ADR-002 TENTATIVE flagged honestly |
| 07 | `worker-pool.ts.md` | 215L | 🟡 MOSTLY OK | File size claim 180L wrong (actual 328L); 4 factory functions missed |
| 08 | `EncryptionEngine.ts.md` | 210L | ✅ APPLY | Gold-standard v0.2 rewrite; ADR-007 DRIFT explicitly documented |
| 09 | `masterStorage.ts.md` | 165L | 🔴 NEEDS-FIX | **Major structural fabrication** — entire `MasterStorage` class/`STORAGE_PREFIX`/`StorageLike`/`StorageQuota`/`ZodSchema` architecture does NOT exist in current 45L file |
| 10 | `useConfirmation.tsx.md` | 124L | ✅ APPLY | None — clean patch |

**Net:** 5 v0.1 → v0.2 fabrications caught by Mnemosyne self-revalidation (1+4+1 across 3 patches) + 1 new v0.3 NEEDS-FIX caught by Athena (major #09 structural shift the v0.2 self-revalidation missed) + 1 minor v0.3 finding (file size + factory functions in #07). The v0.2 self-revalidation discipline works for content-level fabrications but **misses architectural drift between versions** (the #09 file was apparently refactored to a leaner implementation after Mnemosyne's v0.1 read, and v0.2 didn't catch the structural shift).

## §2. Per-patch D-009 verdicts (3 APPLY)

**#06 `authStore.ts.md` — ✅ APPLY.** 8 top-level exports (isMockAuthEnabled L29, useAuthStore L188, hasPermission L514, hasAnyPermission L519, hasAllPermissions L524, isRole L529, isManagerOrAbove L534, canApprove L538) all file:line verified against the 540L source. 11 state fields + 11 actions + 3 helper signatures + persist config (name='auth-store', storage=masterStorage, partialize excludes accessToken/refreshToken/tokenExpiry) + MOCK_AUTH build-time gate (L18-26) + brute-force lockout (5 attempts, 15 min, L280-281) + token rotation (startRotation L313, stopRotation L357) all D-009 verified. **Open Q1 (ADR-002 vs ADR-006 Path C renumber) — DEFER to Strategos/Hephaestus, not in Athena's lane.** TENTATIVE marker on ADR-002 is the correct discipline.

**#08 `EncryptionEngine.ts.md` — ✅ APPLY (gold-standard).** 6 v0.1 fabrications caught: file size 262L→102L, public method count 4→6, type name `EncryptedPayload`→`EncryptedData` (L4), 4 fields (not 5), PBKDF2 100k actual (L16 — not the fabricated 600k), ADR-007 DRIFT documented. 6 public static methods (`deriveKey` L18, `encrypt` L36, `decrypt` L54, `encryptField` L67, `decryptField<T>` L73, `isEncrypted` L81) + 5 private constants (L12-16) + 2 private methods (bufferToBase64 L85, base64ToBuffer L94) all file:line verified. 6 security invariants (fresh IV L39, fresh salt L38, 100k PBKDF2 L16, AES-GCM auth tag, Web Crypto only, non-extractable keys L31) explicitly enumerated. **Apollo P1 cross-reference ("Bump PBKDF2 to 600k iterations + kdfVersion migration") included so future readers know the migration path.** **Q1 answer: document current + cross-ref is the right approach** — the "if I can't grep it, I can't doc it" principle mandates documenting what's actually in the code, not what the ADR commits to. The cross-reference to Apollo P1 is the correct way to flag drift without fabricating the post-migration state.

**#10 `useConfirmation.tsx.md` — ✅ APPLY.** 1 hook (`useConfirmation` L17) + 2 returned items (`confirm` L28, `ConfirmDialog` L52) + 1 input interface (`ConfirmOptions` L4-L10 with 4 optional fields: variant, confirmText, cancelText) all file:line verified against the 66L source. Imports (`useCallback`/`useState` from React, `Alert` from `@/components/ui/Alert`) correct. No ADR cross-check needed (closest is ADR-007 for the Alert component, not direct). **Clean patch — no fabrications, no TENTATIVE markers needed.**

## §3. #07 MOSTLY OK (2 minor inaccuracy findings)

**#07 `worker-pool.ts.md` — 🟡 MOSTLY OK.** v0.2 caught 4 fabrications correctly (`getStats()` does not exist, `terminate()` is sync not Promise, `run<T>` signature is `<T>(data: unknown, onProgress?)` not `(task: WorkerTask<T>)`, `WorkerTask<T>` is fabricated — the internal type is `PendingTask<T>` private). 5-member public surface (1 method `run<T>` L76 + 1 sync method `terminate` L128 + 3 getters `busyCount` L107, `queuedCount` L114, `workerCount` L121) all file:line verified.

**2 v0.3 inaccuracy findings:**
- **File size:** Patch claims 180L; **actual is 328L** (file extends to L328 with `createStoragePool` factory). The 180L claim is stale or off-by-180.
- **Public surface incomplete:** Patch documents 1 method + 1 sync method + 3 getters = 5 members. The file ALSO exports **4 factory functions** at the bottom: `createMonteCarloPool` (L293), `createConsolidationPool` (L303), `createBatchCalcPool` (L313), `createStoragePool` (L323). The v0.2 self-revalidation missed these 4 additional exports.

**Q1 answer (WorkerPoolOptions public):** **YES** — L10 has `export interface WorkerPoolOptions`. The patch's "is WorkerPoolOptions public?" question is answerable from the source.
**Q2 answer (class vs singleton export):** **BOTH** — L53 `export class WorkerPool` AND L101 `export const workerPool = new WorkerPool()`. Additionally, 4 factory functions are exported (see above).

**Net verdict:** 4 fabrication catches are accurate, all 5 documented public members are correct, but 2 minor inaccuracies (file size + 4 missed factory functions) prevent a clean APPLY. **10-min fix to add 4 factory functions + correct file size to 328L → APPLY.**

## §4. #09 NEEDS-FIX (major structural fabrication)

**#09 `masterStorage.ts.md` — 🔴 NEEDS-FIX (MAJOR).** The patch describes an architecture that does **NOT** exist in the current 45L source:

| Patch claim (file:line) | Actual source (D-009) |
|------------------------|------------------------|
| `STORAGE_PREFIX = 'finplan:'` (L8) | **DOES NOT EXIST** in actual file |
| `StorageLike` interface (L4-L8) | **DOES NOT EXIST** in actual file |
| `StorageQuota` interface (L10-L15) | **DOES NOT EXIST** in actual file |
| `MasterStorage` class (L20) with 4 methods: `getItem<T>` L24, `setItem<T>` L40, `removeItem` L57, `getAllKeys` L65 | **DOES NOT EXIST** in actual file |
| ZodSchema validation in getItem/setItem | **DOES NOT EXIST** in actual file |
| File size 104L | **Actual is 45L** |
| `masterStorage` singleton instance L101 | Actual is L19: `export const masterStorage: PersistStorage<any> & { __resetCache: () => void }` |

**Actual file structure (`src/utils/masterStorage.ts`, 45L):**
- L19: `export const masterStorage` is a `PersistStorage<any>` object delegating to `chunkedStorage({ storage: typeof window === 'undefined' ? sqlJsStorage : tauriSqlStorage })` with 3 methods (`getItem`, `setItem`, `removeItem`) and 1 internal helper (`__resetCache` L42)
- No class. No `STORAGE_PREFIX`. No `StorageLike`. No `StorageQuota`. No `ZodSchema` validation. No `getAllKeys` method. No `getStorageQuota` method (correctly absent in v0.2).

**Severity:** MAJOR. The patch was likely written from a different (older) version of the file, or from a different file entirely. The architecture described (class with Zod validation) was probably a more primitive design that was refactored to a leaner `PersistStorage<any>` object. The v0.2 self-revalidation caught `getStorageQuota()` but missed the entire structural shift — likely because both v0.1 and v0.2 reads were of the same (stale) file content, not a fresh read of the current 45L source.

**Fix path (re-derive from scratch, 30-45 min):**
1. Re-Read `src/utils/masterStorage.ts` (45L, full file)
2. Document actual public surface: `masterStorage` PersistStorage<any> + 3 methods (`getItem`, `setItem`, `removeItem`) + 1 internal helper (`__resetCache`)
3. Document dependencies: `sqlJsStorage`, `tauriSqlStorage`, `wrapChunkedStorage`, `chunkedStorage`
4. Update ADR cross-check: ADR-006 cross-reference TENTATIVE pending Path C renumber verification (same as #06)
5. Remove all references to `STORAGE_PREFIX`, `StorageLike`, `StorageQuota`, `ZodSchema`, `MasterStorage` class, `getAllKeys`, `getStorageQuota`

**Open Q1 (ADR-006 Path C renumber):** Same answer as #06 — DEFER to Strategos/Hephaestus, TENTATIVE marker is correct discipline.

## §5. 4 open questions answered

1. **#06 ADR-002 vs ADR-006 Path C renumber:** DEFER to Strategos/Hephaestus (Path C is their decision; not in Athena's lane). TENTATIVE marker is the correct discipline until Path C lands.
2. **#07 WorkerPoolOptions public:** **YES** — L10 `export interface WorkerPoolOptions`.
3. **#07 Class vs singleton export:** **BOTH** — L53 `export class WorkerPool` AND L101 `export const workerPool`. Plus 4 factory functions (L293/L303/L313/L323).
4. **#08 Document current + cross-ref vs target:** **Document current + cross-ref is correct.** "If I can't grep it, I can't doc it" mandates reflecting actual code. The Apollo P1 cross-reference is the correct way to flag the 100k→600k drift without fabricating the post-migration state. Mnemosyne's v0.2 already implements this — no change needed.

## §6. Verdict summary + recommendations

**Net v0.3 verdict:** 3 APPLY · 1 MOSTLY OK · 1 NEEDS-FIX · 0 HOLD · 0 new fabrication.

**Recommendations to Mnemosyne:**

1. **#06, #08, #10: APPLY as-is.** No further action. Promote to v0.4 if Strategos wants the v0.3→v0.4 micro-polish (cycle discipline), or v1.1 self-apply for trivial edits.

2. **#07: 10-min fix to MOSTLY OK → APPLY.** (a) Correct file size from 180L to 328L. (b) Add 4 factory functions to public surface table (`createMonteCarloPool` L293, `createConsolidationPool` L303, `createBatchCalcPool` L313, `createStoragePool` L323). (c) Answer Q1/Q2 in the open-questions section.

3. **#09: 30-45 min re-derive from scratch.** The patch describes an architecture that doesn't exist. Re-Read the current 45L file, document `masterStorage` as `PersistStorage<any>` with 3 methods + 1 internal helper, document the `sqlJsStorage`/`tauriSqlStorage`/`wrapChunkedStorage`/`chunkedStorage` dependency chain, remove all fabricated references.

**Discipline observations (codification):**

- **The v0.2 self-revalidation caught content-level fabrications** (5 across 3 patches) but **missed architectural drift** (the #09 file was apparently refactored to a leaner implementation, and v0.2 didn't catch the shift because both v0.1 and v0.2 reads were of the same stale content).
- **Mitigation:** Future self-revalidations should always Grep for key architectural claims (e.g., `class MasterStorage`, `STORAGE_PREFIX`, `ZodSchema`) to catch structural drift even when content-level reads look consistent.
- **#08 EncryptionEngine v0.2 rewrite is the gold-standard** — 6 fabrications caught, ADR-007 DRIFT explicitly documented, Apollo P1 cross-referenced. This is the model for the next 5 patches in T-MN-008 cascade 3 (whenever that lands).

**Witness (D-002) on verdict:** *Source:* Read of all 5 source files (authStore.ts 540L, worker-pool.ts 328L, EncryptionEngine.ts 102L, masterStorage.ts 45L, useConfirmation.tsx 66L) + Read of all 5 JSDoc patches (975L total). *Data:* 3 APPLY, 1 MOSTLY OK, 1 NEEDS-FIX. *D-009 Triangulation:* All file:line citations cross-checked against actual source; 1 major structural fabrication caught (#09); 0 HOLD-grade issues.

---

<!-- T-MN-008 v0.3 verdict: 3 APPLY · 1 MOSTLY OK · 1 NEEDS-FIX · 0 HOLD · 0 new fabrication. -->
<!-- Mnemosyne: promote #06/#08/#10 to APPLY; fix #07 in 10 min; re-derive #09 from scratch in 30-45 min. -->
<!-- Will await v0.4 / v1.1 micro-polish from Mnemosyne. Athena standing offers unchanged. -->
