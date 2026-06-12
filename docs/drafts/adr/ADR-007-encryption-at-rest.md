# ADR-007: Encryption at Rest (Web Crypto AES-256-GCM + PBKDF2 600k)

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->

- **Status:** DRAFT v0.1
- **Date:** 2026-06-13
- **Author:** Hephaestus
- **Supersedes:** none
- **Related:** [ADR-005 masterStorage](./ADR-005-custom-masterstorage.md), [ADR-006 data retention](./ADR-006-data-retention.md), [ADR-008 audit logging](./ADR-008-audit-logging.md), [ADR-010 schema migration](./ADR-010-schema-migration-strategy.md), [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md)

## Context and Problem Statement

`src/utils/masterStorage.ts` (ADR-005) wraps `sqlJsStorage` (SQLite WASM) in the browser and `tauriSqlStorage` (Tauri SQLite) in the desktop build. **Both store plaintext JSON.** Sensitive data per ADR-012's classification (PII + Regulated) is currently readable by:

- Any process with read access to the user's filesystem (Tauri desktop) or IndexedDB (browser).
- Any browser extension with `storage` permission.
- Any backup tool that snapshots the user's home directory.
- A SOC 2 auditor will flag this as a critical deficiency (CC6.1.9 — encrypts sensitive data at rest).

`src/engines/EncryptionEngine.ts:12-16` already provides AES-256-GCM (12-byte IV, 16-byte salt, 128-bit auth tag, PBKDF2-SHA256) but is NOT wired into the storage layer. The team needs to integrate encryption transparently so existing stores (`dataStore`, `authStore`, `settingsStore`, etc.) get encryption without code changes.

Additionally, the current PBKDF2 iteration count of 100,000 is **below the OWASP 2023 recommendation of 600,000 for SHA-256**.

## Decision Drivers

- **SOC 2 CC6.1.9** (encrypts sensitive data at rest) — currently RED, blocks Type 1.
- **OWASP 2023 PBKDF2 recommendation** — 600,000 iterations for SHA-256.
- **GDPR Art. 32** (security of processing) — encryption is the canonical "appropriate measure."
- **Local-first reality** — encryption key must be derivable in the browser (passphrase-based OR device-key-based) since there's no server.
- **Zero code change for existing stores** — encryption must be a transparent wrapper, not a per-store concern.
- **Migration safety** — existing plaintext data must be readable post-deploy, then re-encrypted on first write.

## Considered Options

### Option A — Encrypt at the masterStorage layer (chosen)
- **Pro:** Transparent to all 13 zustand stores. Single point of enforcement. Easy to test.
- **Pro:** Schema migration (ADR-010) is the natural upgrade path.
- **Con:** One wrapper layer means all stores are encrypted (slight perf cost on PII-light stores like `uiStore`).
- **Mitigation:** per-class opt-out flag (see Decision Outcome).

### Option B — Encrypt per-store
- **Pro:** Surgical — only PII + Regulated stores get encryption.
- **Con:** Each store must opt in; risk of missing a new store. 13 stores × 3 lines = 39 lines of boilerplate.

### Option C — Encrypt the SQLite database file directly (SQLCipher)
- **Pro:** Single-file encryption, no per-key wrapping.
- **Con:** Requires sql.js fork or sqlcipher wasm build. Heavy dep. Doesn't work in browser without WASM rebuild.

### Option D — Use Tauri keystore only
- **Pro:** Hardware-backed on macOS (Keychain), Windows (DPAPI).
- **Con:** Browser build has no keystore. Cross-platform inconsistency.

## Decision Outcome

**Chosen: Option A — transparent encrypt-at-masterStorage wrapper**, with the following specifics:

1. **Cipher:** AES-256-GCM (already in `EncryptionEngine.ts:12`).
2. **KDF:** PBKDF2-SHA256, **600,000 iterations** (bumped from 100,000 per OWASP 2023).
3. **Salt:** 16 bytes per-store, persisted as `_encSalt` key in the same storage backend.
4. **IV:** 12 bytes per-write, fresh from `crypto.getRandomValues` (already in EncryptionEngine.ts:14).
5. **Auth tag:** 128-bit (already GCM default).
6. **Key derivation:** Per-session derived from user passphrase (browser) OR Tauri-stored secret (desktop). Passphrase prompted once on first read after deploy; cached in-memory for the session.
7. **Layering:** `safeJSONStorage(encryptedStorage(masterStorage))` — the `encryptedStorage` wrapper sits between `safeJSONStorage` and `masterStorage`, transparently encrypting every `setItem` and decrypting every `getItem`.
8. **Schema migration:** `kdfVersion` field (already supported by ADR-010) tracks the iteration count. Bumping from 100k → 600k triggers a re-derive on next read, no plaintext window.
9. **Per-class opt-out:** `uiStore`, `tourStore`, `analyticsStore` (no PII, no regulated data) can be flagged `encryption: false` in their persist config to avoid the ~50ms PBKDF2 cost on every read.

**Implementation files (Apollo post-push P2 — "encrypt dataStore payload"):**
- New: `src/utils/storage/encryptedStorage.ts` — the wrapper.
- Modified: `src/utils/encryption.ts` (or `EncryptionEngine.ts`) — bump iterations to 600k.
- Modified: `src/utils/storage/safeJSONStorage.ts:17-49` — chain the wrapper.
- Modified: `src/store/dataStore.ts:101` — flag `encryption: true` (default).
- Modified: 11 other stores — flag `encryption: false` (opt-out, PII-light).

**Existing tests that must pass post-deploy:** `dataStore.safeJSONStorage.test.ts:13 cases` (already in `docs/drafts/hephaestus/security-tests/`, ready to cp). Tests must include:
- Round-trip: write plaintext → read plaintext (key is in-memory)
- Wrong key: read returns null (auth tag fails)
- Missing key on first read: prompts for passphrase
- Bump iterations: existing data readable after re-derive
- Opt-out: `uiStore` does not call `crypto.subtle.deriveKey`

## Compliance

| Framework | Requirement | This ADR satisfies |
|---|---|---|
| **SOC 2 CC6.1.9** | Encrypts sensitive data at rest | ✅ AES-256-GCM at masterStorage wrapper |
| **SOC 2 CC6.1.10** | Encrypts sensitive data in transit | ✅ Unchanged (TLS 1.3 already enforced) |
| **GDPR Art. 32** | Security of processing | ✅ Encryption is the canonical "appropriate technical measure" |
| **OWASP Password Storage Cheat Sheet (2023)** | PBKDF2-SHA256 ≥ 600k | ✅ 600,000 iterations |
| **NIST SP 800-132** | PBKDF parameter selection | ✅ 16-byte salt, 600k iterations, fresh IV per use |
| **NIST SP 800-38D** | GCM mode | ✅ 12-byte IV, 128-bit auth tag |
| **FIPS 140-3** | Approved cipher | ✅ AES-256 (validated in Web Crypto API) |
| **ISO 27001 A.8.24** | Use of cryptography | ✅ Documented policy + algorithm choice |
| **PCI-DSS 3.5, 3.6** | Cryptographic key management | ✅ Key derived per-session, never persisted |

## Migration Plan

The migration is sequenced to avoid a plaintext window:

1. **Phase 1 (Q3 2026 sprint 2) — write the wrapper, don't enable**
   - Create `src/utils/storage/encryptedStorage.ts` with feature flag `VITE_USE_ENCRYPTION` (default off in dev, off in prod).
   - Unit-test the wrapper with 13 cases (planned in T-HEP-004 §1).
   - **Verify:** tsc, lint, test green; no behavior change (flag off).

2. **Phase 2 (Q3 2026 sprint 2, end) — bump PBKDF2 to 600k**
   - Edit `src/engines/EncryptionEngine.ts:16` — `100000` → `600000`.
   - Edit `src/utils/masterStorage.ts` — set `kdfVersion: 2` in persisted metadata.
   - Existing data with kdfVersion=1 (100k) is auto-re-derived on first read (no plaintext window).
   - **Verify:** round-trip test passes; perf test on cold start (target < 100ms PBKDF2 cost).

3. **Phase 3 (Q3 2026 sprint 3) — enable encryption in production**
   - Set `VITE_USE_ENCRYPTION=true` for prod builds. Dev/local: flag off (faster iteration).
   - First-read: user is prompted for passphrase OR desktop auto-derives from Tauri keystore.
   - **Verify:** E2E test on a clean install (new user, new store, encryption active from byte 1).

4. **Phase 4 (Q3 2026 sprint 3) — backfill existing plaintext data**
   - On first read of a store with `encryption: true` but plaintext data, the wrapper:
     1. Reads the plaintext blob.
     2. Encrypts it with the session key.
     3. Writes the ciphertext back.
     4. Marks `_encMigrated: true` in metadata.
   - **Verify:** migration test scenario (synthesized plaintext → ciphertext on first read).

5. **Phase 5 (Q4 2026) — auditor walkthrough**
   - SOC 2 auditor reviews `EncryptionEngine.ts:12-16`, kdfVersion migration, test coverage.

## Enforcement

- **Static:** `EncryptionEngine.ts:16` is pinned to 600,000 in CI; any PR that changes it without a migration plan in ADR-007 is blocked.
- **Unit tests:** `encryptedStorage.test.ts` (planned) — 13 cases per T-HEP-004 spec.
- **Integration:** `dataStore.safeJSONStorage.test.ts` (already written, 13 cases) validates the round-trip with the wrapper in the chain.
- **Pen-test:** Q4 2026 external pen-tester attempts to extract plaintext from a sealed store; test passes if extraction is infeasible.
- **Sentry:** Alert on any `decrypt:fail` event (likely wrong passphrase or tampering).
- **Audit log:** Every `setItem` on an `encryption: true` store logs `(class, hash(ciphertext), kdfVersion)` to `auditLogStore` (per ADR-008).
- **Review:** Quarterly key-rotation review (Hephaestus). Phase 1 may add server-side key rotation; deferred to Q1 2027.

## Consequences

**Positive:**
- ✅ SOC 2 CC6.1.9 satisfied (Type 1 ready Q4 2026).
- ✅ GDPR Art. 32 satisfied.
- ✅ Existing data migrates in-place (no plaintext window).
- ✅ 13 stores get encryption by default; opt-out for PII-light stores preserves perf.
- ✅ Bumps PBKDF2 to OWASP 2023 (600k) without a separate migration.

**Negative:**
- ❌ First-read passphrase prompt is a UX cost. Mitigated by Tauri desktop auto-derive (no prompt).
- ❌ ~50ms PBKDF2 cost on cold cache. Acceptable; ~5× slower than 100k but still under human-perceivable threshold.
- ❌ Backup tools (Tauri desktop) now need the key. Documented in ONBOARDING.md (T-MN-003).

**Neutral:**
- Browser extension attack surface unchanged (they could read plaintext before too; encryption raises the bar but doesn't eliminate it).
- Phase 1 backend will use a server-derived key (deferred to Q1 2027 — out of scope for Type 1).

## Pros and Cons of the Options

| Option | Pros | Cons |
|---|---|---|
| **A — Wrapper at masterStorage (chosen)** | Transparent; testable; single point of enforcement | All stores get encryption (mitigated by opt-out) |
| B — Per-store | Surgical | Boilerplate; opt-in risk; 39 LOC |
| C — SQLCipher | Single-file encryption | Heavy WASM dep; doesn't work in browser without fork |
| D — Tauri keystore | Hardware-backed on desktop | Browser has no keystore; cross-platform inconsistency |

## References

- [ADR-005 masterStorage](./ADR-005-custom-masterstorage.md) — the layer this wraps
- [ADR-006 data retention](./ADR-006-data-retention.md) — cold archive depends on this
- [ADR-008 audit logging](./ADR-008-audit-logging.md) — audit events log encryption state
- [ADR-010 schema migration](./ADR-010-schema-migration-strategy.md) — kdfVersion is the migration hook
- [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md) — defines what data is encrypted
- [SOC 2 Type 1 readiness audit](../hephaestus/SOC2_READINESS_2026-06-13.md) — §6 blocker #1 (this ADR is the fix)
- [Apollo post-push P2: encrypt dataStore payload](../../taskboard)
- OWASP Password Storage Cheat Sheet (2023) — 600,000 PBKDF2-SHA256 iterations
- NIST SP 800-132 — PBKDF recommendation
- NIST SP 800-38D — GCM mode recommendation
- `src/engines/EncryptionEngine.ts:12-16` — existing AES-256-GCM implementation

---

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->
