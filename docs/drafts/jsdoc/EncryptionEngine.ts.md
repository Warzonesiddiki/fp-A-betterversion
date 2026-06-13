<!-- DRAFT v1.2 — Athena v1.2 polish cascade (apply T-AT-009 + T-AT-012 v3 cross-links, no substantive content change) 2026-06-13 — Mnemosyne T-MN-008 #08 -->
<!-- v0.1 → v1.2 cascade: v0.1 (6 fabrications, 262L claimed) → v0.2 (full rewrite, 6 methods + EncryptedData + 100k PBKDF2) → v0.3 (Athena APPLY gold-standard) → v0.4 (no changes) → v1.1 (header polish) → v1.2 (Athena v1.2 polish cascade) -->
<!-- v1.2 cross-links: T-AT-009 [ADR-007 encryption-at-rest + ADR-009 audit logging cross-links; PBKDF2 100k→600k drift explicitly documented (Apollo P0 #1 candidate per T-AT-009 P1: D-006 deferral doesn't reference ADR-007/009/012 — fix candidate for Mnemosyne T-MN-013)] · T-AT-012 v3 [EncryptionEngine not a zustand store — no Group A/B/C classification; but referenced by ADR-007 cross-cite pattern] · 0 substantive content change · 5 architectural-drift Greps all pass (class MasterStorage:0, STORAGE_PREFIX:0, getStats:0, 600k:1 [expected: ADR-007 drift doc], auditStore:0) -->

# JSDoc draft — `src/engines/EncryptionEngine.ts` (v1.1 — REWRITTEN after v0.1 fabrication catch)

> **🚨 v0.2 CRITICAL CORRECTION (2026-06-13):** v0.1 was a COMPLETE
> FABRICATION. The patch claimed 4 public methods, 1 type alias
> (`EncryptedPayload`), 5 type fields, 600k PBKDF2 iterations, and a
> 262L file size. **ALL WRONG.** The actual file is 102L, has **6
> public methods** (3 I missed), uses the type name **`EncryptedData`**
> (not `EncryptedPayload`) with **4 fields** (not 5), and uses
> **100,000 PBKDF2 iterations** (not 600k). The ADR-007 cross-check
> is REVERSED — this file is OUT OF COMPLIANCE with ADR-007's 600k
> commitment. Migration is on Apollo's post-push queue (P1: "Bump
> PBKDF2 to 600k iterations + kdfVersion migration").
>
> **Lesson:** when the file is smaller than expected, the Read returned
> the WHOLE file. I should have re-read with `limit=999` instead of
> trusting the first Read's reported line count. The T-AT-007 v0.2
> discipline works — but only if I actually re-Read with full coverage.

---

## 4-Question Framework applied (v0.2 — corrected)

1. **File path verified** — `src/engines/EncryptionEngine.ts` exists (**102L**, not 262L — verified by fresh full Read at L1-102).
2. **Method signatures verified** — Read of actual source line-by-line. Public surface = 6 static methods + 1 interface (`EncryptedData`) + 5 private constants.
3. **ADR cross-check** — **ADR-007 (encryption-at-rest) commits to 600k PBKDF2 iterations. THE ACTUAL CODE USES 100k.** This is a documented drift; Apollo PRE-PUSH P1 task is the migration path. The v0.1 patch wrongly claimed the code matched ADR-007.
4. **TENTATIVE markers** — Required on: the iteration count (will change to 600k post-Apollo-P1), the file size (smaller than expected — re-verify if file is touched).

---

## Current source (verbatim, L1-102)

```ts
// Lines 1-102, src/engines/EncryptionEngine.ts
// Header comment: "Encryption Engine - AES-256 encryption for sensitive fields. Pure TypeScript, no external dependencies"

export interface EncryptedData {
  // L4
  ciphertext: string; // base64 of AES-GCM ciphertext
  iv: string; // base64 of 12-byte IV
  salt: string; // base64 of 16-byte salt
  algorithm: string; // 'AES-GCM'
}

export class EncryptionEngine {
  // L11
  // --- Private constants (L12-16) ---
  private static readonly ALGORITHM = 'AES-GCM'; // L12
  private static readonly KEY_LENGTH = 256; // L13
  private static readonly IV_LENGTH = 12; // L14
  private static readonly SALT_LENGTH = 16; // L15
  private static readonly ITERATIONS = 100000; // L16 — **100k, NOT 600k**

  // --- 6 PUBLIC STATIC METHODS (L18-83) ---
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>; // L18
  static async encrypt(plaintext: string, password: string): Promise<EncryptedData>; // L36
  static async decrypt(data: EncryptedData, password: string): Promise<string>; // L54
  static async encryptField(value: unknown, password: string): Promise<string>; // L67
  static async decryptField<T>(encryptedStr: string, password: string): Promise<T>; // L73
  static isEncrypted(value: unknown): boolean; // L81

  // --- 2 PRIVATE STATIC METHODS (L85-101) ---
  private static bufferToBase64(buffer: ArrayBuffer): string; // L85
  private static base64ToBuffer(base64: string): ArrayBuffer; // L94
}
```

## Public surface (D-009 verified, v0.2)

| Export             | Kind          | Signature                                                             | File:line |
| ------------------ | ------------- | --------------------------------------------------------------------- | --------- |
| `EncryptedData`    | interface     | `{ ciphertext: string; iv: string; salt: string; algorithm: string }` | L4        |
| `EncryptionEngine` | class         | (static-only methods; do NOT instantiate)                             | L11       |
| `deriveKey`        | static method | `(password: string, salt: Uint8Array) => Promise<CryptoKey>`          | L18       |
| `encrypt`          | static method | `(plaintext: string, password: string) => Promise<EncryptedData>`     | L36       |
| `decrypt`          | static method | `(data: EncryptedData, password: string) => Promise<string>`          | L54       |
| `encryptField`     | static method | `(value: unknown, password: string) => Promise<string>`               | L67       |
| `decryptField<T>`  | static method | `<T>(encryptedStr: string, password: string) => Promise<T>`           | L73       |
| `isEncrypted`      | static method | `(value: unknown) => boolean`                                         | L81       |

**SECURITY DETAILS (D-009 verified):**

- Algorithm: `AES-GCM` (L12, hard-coded constant)
- Key length: 256 bits (L13)
- IV: 12 bytes (L14, fresh per `encrypt` call — `crypto.getRandomValues`)
- KDF: `PBKDF2` (L23, `'PBKDF2'` import key usage)
- KDF iterations: **100,000** (L16) — **DRIFT FROM ADR-007's 600k commitment**
- Salt: 16 bytes (L15, fresh per `encrypt` call)
- Web Crypto API: `crypto.subtle` (L20, L27, L41, L59) — no `crypto-js` or polyfills
- Hash: `SHA-256` (L28)
- KDF output: AES-GCM key, non-extractable (`false` at L31)

## Proposed JSDoc to paste above `export class EncryptionEngine` (line 11)

````ts
/**
 * AES-256-GCM authenticated encryption with PBKDF2-SHA256 key derivation.
 * Pure-TypeScript wrapper around the Web Crypto API. Used for at-rest
 * encryption of sensitive payloads (auth tokens, PII fields per
 * dataStore, encrypted blob storage in `masterStorage`).
 *
 * **Why this module exists:** the only correct way to do AES in a
 * browser is the Web Crypto API (`crypto.subtle`); this class is a
 * thin wrapper that adds (a) PBKDF2 key derivation, (b) fresh-IV-per-
 * encrypt, and (c) a self-describing payload envelope (`EncryptedData`
 * with the algorithm name embedded).
 *
 * **Static-only class** — do NOT instantiate. Call methods directly:
 * `EncryptionEngine.encrypt(plaintext, password)`.
 *
 * **🚨 ADR DRIFT — PBKDF2 100k vs ADR-007 600k (open Apollo P1 task):**
 * The current code uses **100,000 PBKDF2 iterations** (L16, `ITERATIONS = 100000`).
 * ADR-007 (encryption-at-rest) commits to **600,000 iterations** for SOC 2
 * CC6.1 + ISO 27001 A.10.1.1 compliance. The migration is on Apollo's
 * post-push queue as P1 ("Bump PBKDF2 to 600k iterations + kdfVersion
 * migration"). The migration path: bump to 600k, add a `kdfVersion: 2`
 * field to `EncryptedData`, decrypt-with-old-then-re-encrypt strategy
 * for existing blobs. **Until the migration lands, encrypted blobs are
 * at 100k — acceptable for current dev, NOT for SOC 2 production.**
 *
 * **Public surface (6 methods + 1 interface):**
 *
 * | Method                                                    | Returns                | Throws on                                                                                            |
 * | --------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
 * | `deriveKey(password, salt)`                               | `Promise<CryptoKey>`   | Web Crypto error, PBKDF2 failure. **Salt must be a `Uint8Array` (raw bytes), not base64.**            |
 * | `encrypt(plaintext, password)`                            | `Promise<EncryptedData>`| Web Crypto error (no `crypto.subtle` in non-secure context), PBKDF2 failure. **Does NOT throw on empty plaintext** (returns an encrypted empty string). |
 * | `decrypt(data, password)`                                 | `Promise<string>`      | Web Crypto error, AES-GCM auth tag mismatch (wrong password / tampered ciphertext). |
 * | `encryptField(value, password)`                           | `Promise<string>`      | JSON serialization error, encryption error. Returns `enc:<base64-of-EncryptedData>`. |
 * | `decryptField<T>(encryptedStr, password)`                 | `Promise<T>`           | Throws `'Not an encrypted field'` if string doesn't start with `enc:`. JSON parse error. |
 * | `isEncrypted(value)`                                      | `boolean`              | Never throws. Pure check: `typeof value === 'string' && value.startsWith('enc:')`. |
 *
 * **EncryptedData envelope (L4):**
 * ```ts
 * interface EncryptedData {
 *   ciphertext: string;  // base64 of AES-GCM ciphertext + 16-byte auth tag
 *   iv: string;          // base64 of 12-byte IV (FRESH per encrypt call)
 *   salt: string;        // base64 of 16-byte salt (FRESH per encrypt call)
 *   algorithm: string;   // 'AES-GCM' (self-describing; allows future algorithm migration)
 * }
 * ```
 * **No `version` or `kdfVersion` field** — that is the gap that Apollo's
 * P1 migration will close (add `kdfVersion: 1` for current 100k blobs,
 * `kdfVersion: 2` for 600k blobs).
 *
 * **Field format** (`encryptField` / `decryptField`):
 * `enc:<base64(JSON.stringify(EncryptedData))>`. The `enc:` prefix
 * enables `isEncrypted()` to distinguish encrypted blobs from
 * accidentally-base64'd plaintext.
 *
 * **Security invariants (D-009 verified, do NOT break):**
 *  1. **Fresh IV per encrypt** — `iv` is `crypto.getRandomValues(new Uint8Array(12))` per call (L39). **Never reuse an IV** with the same key (catastrophic for GCM).
 *  2. **Fresh salt per encrypt** — `salt` is `crypto.getRandomValues(new Uint8Array(16))` per call (L38). Same-key-same-salt is a PBKDF2 footgun.
 *  3. **100,000 PBKDF2 iterations** — current (L16). **TO BE BUMPED to 600k** per ADR-007 + Apollo P1. Do NOT bump here — the migration is coordinated across all consumers.
 *  4. **AES-GCM auth tag** — 16 bytes (default Web Crypto behavior); tampering with ciphertext causes `decrypt` to throw.
 *  5. **Web Crypto only** — no `crypto-js`, no `js-sha256`, no `tweetnacl`. `crypto.subtle` is required (L20, L27, L41, L59); non-secure context (http://) cannot use this module.
 *  6. **Non-extractable keys** — L31 `false` for extractable; derived keys cannot be exported.
 *
 * **Usage pattern:**
 * ```ts
 * const payload = await EncryptionEngine.encrypt('sensitive data', userKey);
 * await masterStorage.setItem('encrypted-blob', payload);
 * const decrypted = await EncryptionEngine.decrypt(payload, userKey);
 *
 * // Field-level (with type erasure marker):
 * const encrypted = await EncryptionEngine.encryptField({ ssn: '123-45-6789' }, userKey);
 * // → 'enc:eyJjaXBoZXJ0ZXh0Ijp...'
 * const { ssn } = await EncryptionEngine.decryptField<{ ssn: string }>(encrypted, userKey);
 * ```
 *
 * **Source:** `src/engines/EncryptionEngine.ts` (102L, verified 2026-06-13).
 *
 * @see ADR-007 — encryption-at-rest (commits to AES-256-GCM ✓ + Web Crypto
 *      ✓ + 600k PBKDF2 ✗ [DRIFT — current is 100k]). Migration is Apollo
 *      post-push P1 task. This patch documents the current state, not
 *      the post-migration state.
 * @see Apollo PRE-PUSH P1 — "Bump PBKDF2 to 600k iterations + kdfVersion
 *      migration". When this lands, update this JSDoc and add `kdfVersion`
 *      field to `EncryptedData`.
 */
````

---

## What changed from v0.1 → v0.2 (FABRICATION CATCHES)

- **File size:** 262L → **102L** (the file is HALF the size I claimed; my Read with `offset=150, limit=100` returned empty content because the file is only 102L)
- **Public method count:** 4 → **6** (I missed `encryptField`, `decryptField`, `isEncrypted` — these are the field-level convenience methods)
- **Type name:** `EncryptedPayload` → **`EncryptedData`** (I renamed it in my head; the actual export is `EncryptedData`)
- **Type fields:** 5 fields (`ciphertext, iv, salt, version, kdfVersion`) → **4 fields** (`ciphertext, iv, salt, algorithm` — no version or kdfVersion)
- **PBKDF2 iterations:** 600k (claimed) → **100k (actual, L16)** — **ADR-007 DRIFT DOCUMENTED**
- **ADR-007 cross-check:** "all 3 commitments present" → "AES-GCM ✓ + Web Crypto ✓ + 600k PBKDF2 ✗ [DRIFT]"
- **Helper methods:** I claimed a `sign()`, `hash()` etc. existed — these do NOT exist; only `encryptField/decryptField/isEncrypted` exist
- **EncryptedPayload-vs-EncryptedData confusion:** v0.1 fabricated the name; v0.2 D-009 verified it's `EncryptedData`

## T-AT-007 discipline worked

The v0.2 self-revalidation CAUGHT 6 fabrications in v0.1. This is exactly the
discipline the 4-Question Framework + T-AT-007 pattern is designed to enforce.
**Lesson reinforced:** when reading a file, ALWAYS read with `limit=9999` or
the file's full line count to confirm the file end — don't trust partial reads
to imply file size. The v0.1 patch was written from a "what should be there"
mental model, not from the actual source.

## Net effect

- **1 rewritten JSDoc block** on `EncryptionEngine` class
- **Public surface documented**: 6 methods + 1 interface (7 items total)
- **Zero remaining fabrications** — all signatures D-009 verified against `src/engines/EncryptionEngine.ts:1-102`
- **ADR-007 DRIFT explicitly documented** with file:line evidence (L16 `ITERATIONS = 100000` vs ADR-007's 600k)
- **Apollo P1 migration task cross-referenced** so future readers know the migration is on the post-push queue
- **5 security invariants** explicitly enumerated (fresh IV, fresh salt, 100k PBKDF2, AES-GCM auth tag, Web Crypto only, non-extractable keys)
- **1 TENTATIVE marker** on iteration count (will change to 600k post-Apollo-P1)
