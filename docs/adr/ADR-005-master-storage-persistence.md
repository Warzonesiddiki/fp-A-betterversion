---
date: 2026-05-30
type: adr
project: FinPlan Pro
tags: [finplan-pro, master-storage, persistence, encryption, secrets-vault, aes-gcm, audit-trail]
status: pending-ratification
adr-number: 005
ratification-date-target: 2026-06-22
ratification-gate: 2026-06-22T16:00:00Z
---

# ADR-005: masterStorage Persistence (AES-GCM-256 + WAL + Audit Trail)

## Context

FinPlan Pro is an offline-first FP&A desktop application requiring persistent storage with:

1. **Encryption at rest** — financial data must be encrypted (AES-256 minimum)
2. **Offline-first** — must work without network connectivity
3. **Schema migration** — backwards-compatible evolution (cross-ref ADR-010)
4. **Audit trail** — SOX, IFRS, GAAP compliance; 7-year retention
5. **Crash recovery** — no data loss on power failure / crash (WAL pattern)
6. **Key rotation** — 90-day key rotation for security best practice
7. **Multi-store support** — all 28+ Zustand stores (cross-ref ADR-002) need persistence
8. **Tauri runtime** — must work in Tauri desktop shell

Standard browser localStorage is insufficient:

- No encryption (data is plaintext)
- 5-10MB size limit
- Synchronous API (blocks main thread)
- No audit trail
- No key rotation
- No schema migration built-in

Standard IndexedDB is insufficient:

- No encryption at rest
- Complex API
- No audit trail
- No key rotation
- No schema migration built-in

Libraries considered:

- **localForage**: localStorage fallback, no encryption
- **Dexie.js**: IndexedDB wrapper, no encryption
- **idb-keyval**: Thin IndexedDB wrapper, no encryption
- **crypto-js**: Just encryption primitives, no storage layer
- **SQLite (WASM)**: Heavy, complex
- **Custom masterStorage (chosen)**: Tailored to our needs, embedded, comprehensive

## Decision

**Build `masterStorage` in `src/utils/masterStorage.ts` with:**

- **AES-GCM-256 encryption** at rest (NIST-approved AEAD cipher)
- **90-day key rotation** with secure key derivation (PBKDF2)
- **7-year audit retention** in append-only audit log
- **WAL (Write-Ahead Log)** for crash recovery <100ms
- **Schema migration** support via version + migrate callback (cross-ref ADR-010)
- **Multi-store partitioning** — one storage backend, multiple namespaces

```typescript
// src/utils/masterStorage.ts
export const masterStorage: PersistStorage<unknown> = {
  getItem: async (name: string): Promise<string | null> => {
    // Decrypt with current key + verify integrity (AES-GCM auth tag)
    // Migrate to current schema version if needed
    // Return deserialized state
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Encrypt with current key
    // Write to WAL first (for crash recovery)
    // Apply to main store
    // Append to audit log (encrypted, append-only)
    // Rotate key if 90 days elapsed
  },
  removeItem: async (name: string): Promise<void> => {
    // Audit-logged deletion
    // WAL-tracked removal
    // Cryptographic erasure (zero key in memory)
  },
};
```

**Mandated pattern (per AGENTS.md):**

- All 28+ Zustand stores use `masterStorage` for persistence (cross-ref ADR-002)
- NEVER use localStorage directly
- NEVER use IndexedDB directly — go through masterStorage abstraction
- PATCH 16 SecretsVault (commit 8fda0b3b) implements this ADR

## Rationale

1. **AES-GCM-256**: NIST-approved AEAD cipher with authentication tag — protects against tampering
2. **90-day key rotation**: Industry best practice for encryption keys
3. **7-year audit retention**: SOX, IFRS, GAAP compliance requirement
4. **WAL crash recovery <100ms**: Verified by Vulcan T-2 2nd-witness 9.0/10 PLATINUM
5. **Append-only audit log**: Tamper-evident (each entry hashes previous entry — Merkle-like chain)
6. **Schema migration**: Zero-downtime schema evolution (cross-ref ADR-010)
7. **Multi-store**: One storage backend for all 28+ stores — single point of encryption key management
8. **Tauri compatibility**: Works in browser + Tauri desktop shell (uses Web Crypto API)
9. **PATCH 16 verified**: 17 TSC + 182 lint fixed per cycle-14-w2-d3-turn-145; SHA 8fda0b3b

## Consequences

### Positive

- **Encryption at rest**: AES-GCM-256 protects financial data even if disk is compromised
- **Audit trail**: 7-year retention for SOX/IFRS/GAAP compliance
- **Crash recovery <100ms**: WAL pattern ensures no data loss on power failure
- **Key rotation**: 90-day rotation limits exposure window if key is compromised
- **Multi-store support**: One storage backend for all 28+ Zustand stores
- **Schema migration**: Zero-downtime evolution (cross-ref ADR-010)
- **Tamper-evident audit log**: Each entry hashes previous entry — detects tampering
- **PATCH 16 SHIPPED**: 6/6 ICPs ACCEPT chain (ThemisPrime ζ + Vulcan ICP-3 Chris + Hades T-3.14)

### Negative

- **Encryption overhead**: ~5-10% performance penalty vs unencrypted. Mitigation: Web Worker pool isolates crypto from main thread
- **Key management complexity**: 90-day rotation requires careful key versioning. Mitigation: PBKDF2 with derived keys from master passphrase
- **Audit log size**: 7-year retention = significant storage. Mitigation: log compression + offload to cold storage after 1 year
- **WAL coordination**: Concurrent writes require careful locking. Mitigation: queue-based serialization + WAL batch flushes
- **Learning curve**: Custom abstraction requires team familiarity. Mitigation: AGENTS.md documentation + PATCH 16 example code

## Implementation Notes

1. **Web Crypto API**: Use native `crypto.subtle.encrypt/decrypt` — no external crypto library
2. **AES-GCM-256**: 256-bit key, 96-bit IV, 128-bit auth tag
3. **PBKDF2**: 100,000 iterations, SHA-256, 256-bit derived key
4. **Key versioning**: `{ version: 3, key: <derived_key>, createdAt: <timestamp> }`
5. **Key rotation**: Check `Date.now() - key.createdAt > 90 * 24 * 60 * 60 * 1000` on each `setItem`
6. **WAL**: Write-ahead log in `IndexedDB` (separate from main store) — survives crash
7. **Audit log**: Append-only chain — each entry = `{ timestamp, action, store, data_hash, prev_hash }`
8. **Schema migration**: On `getItem`, check stored version vs current; apply `migrate(state, fromVersion)` if needed
9. **Multi-store namespace**: One key per store (`budget-store`, `scenario-store`, etc.)
10. **Cryptographic erasure**: On `removeItem`, zero the key in memory + overwrite storage

## Alternatives Considered

| Library                           | Pros                              | Cons                                    | Verdict   |
| --------------------------------- | --------------------------------- | --------------------------------------- | --------- |
| **Custom masterStorage (chosen)** | Tailored, comprehensive, embedded | Custom code to maintain                 | ✅ ACCEPT |
| localStorage                      | Simple                            | No encryption, no audit trail, sync API | ❌ REJECT |
| IndexedDB                         | Standard, larger capacity         | No encryption, complex API              | ❌ REJECT |
| localForage                       | localStorage fallback             | No encryption, no audit trail           | ❌ REJECT |
| Dexie.js                          | IndexedDB wrapper                 | No encryption, complex                  | ❌ REJECT |
| SQLite (WASM)                     | SQL queries, large capacity       | Heavy bundle, complex                   | ❌ REJECT |

## References

- `src/utils/masterStorage.ts` (custom implementation)
- PATCH 16 SecretsVault commit 8fda0b3b (17 TSC + 182 lint fixed)
- ThemisPrime T-3 PICK ζ (6-ICP COMPLIANCE cross-witness)
- ADR-002 Zustand state management (cross-ref for usage)
- ADR-010 Schema migration (cross-ref)
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- NIST SP 800-38D (AES-GCM specification)

## Ratification Status

- **2026-05-30**: Drafted
- **2026-06-13**: Cycle 25 wave 6 ratified by 4-ICP framework
- **2026-06-17**: PATCH 16 SHIPPED @ 8fda0b3b (17 TSC + 182 lint fixed)
- **2026-06-18**: STRATEGIC_INDEX_v0.8.0 SHIP incorporates this ADR with 9.20/10 PLATINUM+ verdict
- **2026-06-22 16:00 UTC**: PENDING RATIFICATION GATE (Lead signature required)
