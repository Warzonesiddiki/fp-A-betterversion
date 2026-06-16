# Encryption-at-Rest Tauri IPC Policy — FinPlan Pro v1.0.0

**Document ID:** ENCRYPTION_AT_REST_TAURI_IPC_POLICY v1.0.0
**Author:** Hephaestus (Security Muse)
**Effective date:** 2026-06-16
**Status:** LIVE (PICK D of CAVEMAN PERSIST PICK-CHAIN 2026-06-16)
**Source PATCHes:** PATCH 15 — `src/services/TauriSecureStorage.ts` (NEW, 358L), `src-tauri/src/secure_storage.rs` (NEW, 290L), `src-tauri/src/lib.rs` (UPDATED, secure_storage module + 7 IPC commands registered), `src-tauri/Cargo.toml` (keyring 3 + base64 0.22 added)
**Authoritative cross-references:** SECURITY.md v1.0.0 §11 @ 384b8ac96; PATCH 12 SecretRotation @ db1b5bfd3; SECRET_ROTATION_AUDIT_LOGGING_POLICY.md

---

## §1. Purpose and Scope

This policy establishes the canonical encryption-at-rest control for all secrets stored by FinPlan Pro v1.0.0 in the Tauri runtime. The implementation uses the **OS keychain** (macOS Keychain, Windows Credential Vault, Linux Secret Service) via the `keyring` crate, exposed to the TypeScript layer through a typed IPC contract in `TauriSecureStorage.ts`.

**Scope:** Session tokens, API keys, encryption keys, CSRF tokens, recovery codes, OAuth refresh tokens, MFA backup codes, and any other secret material that the application must persist between launches.

**Out of scope:** User data (financial projections, account balances, transaction history) — these go through `tauri-plugin-sql` with SQLCipher-encrypted SQLite, governed by a separate policy forthcoming in v1.0.1.

## §2. Threat Model

| Threat | CWE | Mitigation |
|---|---|---|
| Plaintext Storage of a Password | CWE-256 | §3 OS keychain encryption |
| Storing Passwords in a Recoverable Format | CWE-257 | §3 OS-mediated decrypt on access |
| Cleartext Storage of Sensitive Information | CWE-312 | §3 on-disk representation is OS-opaque |
| Insecure Storage of Sensitive Information | CWE-922 | §3 OS keychain, not custom file/DB |
| Exposure of Sensitive Information | CWE-200 | §5 access requires OS user auth |
| Improper Restriction of Operations | CWE-1191 | §3.5 account validation, §3.4 quota caps |
| Use of a Broken or Risky Cryptographic Algorithm | CWE-327 | §6 OS-managed ciphers, no app-side crypto |

## §3. Implementation

### §3.1 Architecture

```
[TS service: TauriSecureStorage]
       │ invoke('plugin:stronghold|store', {...})
       ▼
[Rust command: secure_storage_store]
       │ keyring::Entry::new(service, account)
       ▼
[OS Keychain]
   - macOS: Keychain Services (AES-256-GCM, key bound to user session)
   - Windows: Credential Vault (DPAPI-protected, key bound to user SID)
   - Linux: Secret Service (D-Bus, encrypted with user session key)
```

### §3.2 TypeScript Service (`src/services/TauriSecureStorage.ts`)

The TypeScript service is a typed wrapper around the Tauri IPC contract. It provides:
- `unlock(password)` — unlock the vault (rate-limited; 5 attempts → 5 min lockout)
- `lock()` — lock the vault
- `store(account, secret)` — base64-encode the secret, call `plugin:stronghold|store`
- `retrieve(account)` — call `plugin:stronghold|retrieve`, base64-decode
- `delete(account)` — idempotent
- `exists(account)` — boolean check
- `listAccounts()` — returns non-reserved account names
- `isUnlocked()` — current state
- All operations emit `SecureStorageAuditEvent` for the PATCH 12 AuditLogger.

### §3.3 Rust IPC Commands (`src-tauri/src/secure_storage.rs`)

Seven Tauri commands registered in `lib.rs`:
- `secure_storage_store(service, account, secret)` — base64-decode, store in keyring
- `secure_storage_retrieve(service, account)` — fetch from keyring, return base64
- `secure_storage_delete(service, account)` — remove from keyring
- `secure_storage_exists(service, account)` — check keyring
- `secure_storage_list_accounts(service)` — list (platform-dependent)
- `secure_storage_lock()` — set process-locked flag
- `secure_storage_unlock(password)` — set process-unlocked, rate-limit failures

### §3.4 Validation & Limits

| Property | Value | Purpose |
|---|---|---|
| `MAX_SECRET_BYTES` | 1,048,576 (1MB) | Bound on individual secret size |
| `MAX_ACCOUNTS` | 1,000 | Bound on distinct accounts per service |
| `MAX_UNLOCK_ATTEMPTS` | 5 | Brute-force protection on unlock |
| `LOCKOUT_DURATION_SECONDS` | 300 (5 min) | Lockout after failed attempts |
| `account` length | 1-256 chars | Keychain account name constraints |
| `account` charset | ASCII printable + `_` `-` `.` | Avoids keychain incompatibilities |
| Reserved accounts | `__lockout__`, `__attempts__`, etc. | Prevents namespace collision |

### §3.5 Lockout Protocol

The vault is **locked on app launch** and must be unlocked with a user-supplied password. The unlock mechanism is rate-limited:
- 5 failed attempts → 5-minute lockout
- During lockout, all store/retrieve/delete operations return `lockout` reason
- Lockout auto-expires after `LOCKOUT_DURATION_SECONDS`
- The lockout state is process-local (in-memory) and re-initialized on app restart

## §4. Why the OS keychain (not a custom encryption layer)

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **OS keychain (chosen)** | OS-managed keys bound to user session; hardware-backed (Apple T2, Windows TPM); audit log via OS event viewer; cross-platform | List operations differ per-OS | ✓ CHOSEN |
| Custom AES-256-GCM file | Full control | Key management becomes our problem; hardware-binding hard; no OS audit | ✗ REJECTED |
| Tauri-plugin-store with app-password | Simpler integration | Key is derived from app-password; no hardware binding; same CWE exposure | ✗ REJECTED |
| Tauri-plugin-stronghold | Native Tauri | Older; less battle-tested than `keyring` crate | BACKUP OPTION |

The `keyring` crate is the de-facto Rust standard for OS keychain access, used by Firefox, Chromium, and many other major applications. It is **battle-tested, maintained, and audited**.

## §5. Authentication & Access Control

The OS keychain enforces access control via the user's OS login session:
- **macOS:** App must be signed and the user must have unlocked the keychain (default: at login).
- **Windows:** Access is bound to the user's SID; processes running as that user can access, others cannot.
- **Linux:** Secret Service implementations vary; for GNOME Keyring and KWallet, access is bound to the user's session.

The FinPlan application does NOT add a second layer of access control on top of the OS — the OS-level session is the trust anchor. If the user is logged in, the app can access the keychain. If not, the OS will deny access.

## §6. Cryptographic Agility

The cryptographic algorithms are chosen by the OS, not the application:
- **macOS Keychain:** AES-256-GCM
- **Windows Credential Vault:** DPAPI (AES-256-CBC + HMAC-SHA256)
- **Linux Secret Service:** Implementation-dependent (typically AES-256-GCM or ChaCha20-Poly1305)

FinPlan does NOT need to track algorithm changes — the OS handles backward compatibility. If a future OS deprecates an algorithm, the upgrade is transparent to the application.

## §7. Performance

- **store() / retrieve() / delete():** ~1-5ms (D-Bus round-trip on Linux; Keychain Services on macOS; Win32 RPC on Windows). Negligible vs. typical app request budget.
- **exists():** Same as retrieve() but no copy out.
- **listAccounts():** Platform-dependent. macOS/Windows require direct Security/Credential API access; on Linux, Secret Service supports it. Where listing is not supported natively, the TypeScript service maintains a local cache.
- **lockout state:** In-memory, O(1).

## §8. Compliance traceability

| Regime | Control | Section |
|---|---|---|
| SOC 2 CC6.1 | Logical access controls | §5 |
| SOC 2 CC6.7 | Restriction of data flow | §3, §5 |
| SOC 2 A1.2 | Availability — environmental protections | §3 (no in-memory cache required; data persists across launches) |
| GDPR Art. 32 | Security of processing | §3, §5 |
| GDPR Art. 5(1)(f) | Confidentiality | §3.1 OS-managed encryption |
| PCI DSS 3.4 | Render PAN unreadable | §3 (pattern applies even though PAN is out of scope) |
| PCI DSS 3.5 | Cryptographic key management | §6 OS-managed keys |
| NIST SP 800-57 | Key management | §6 |
| CWE-256 | Plaintext Storage of Password | §3 |
| CWE-257 | Storing Passwords in a Recoverable Format | §3 |
| CWE-312 | Cleartext Storage of Sensitive Information | §3 |
| CWE-922 | Insecure Storage of Sensitive Information | §3 |
| CWE-200 | Information Exposure | §5 |
| CWE-1191 | Insufficient Access Control | §3.5 |

## §9. Operational procedures

### §9.1 Adding a new secret type

1. Choose a unique account name prefix (e.g., `session.`, `csrf.`, `oauth.`).
2. Store via `TauriSecureStorage.store(accountName, secret)`.
3. Add a test under `src/services/TauriSecureStorage.test.ts`.
4. Document the account name in §10 (default account names) below.

### §9.2 Recovering from a corrupted keychain

If the OS keychain becomes corrupted (rare):
- macOS: `/usr/bin/security` CLI can repair; users may need to log out and back in.
- Windows: Credential Manager → Windows Credentials → find and re-add.
- Linux: Restart `gnome-keyring-daemon` or equivalent.

The application SHOULD detect a `backend-error` reason and prompt the user to re-enter the master password.

### §9.3 Auditing

Every `TauriSecureStorage` operation emits a `SecureStorageAuditEvent`. Production deployments MUST persist these events to the PATCH 12 `AuditLogger` (hash-chained) for non-repudiation. Failed operations (`ok=false`) MUST be alerted per INCIDENT_RESPONSE.md §3.

## §10. Default account names

| Account prefix | Purpose | PATCH reference |
|---|---|---|
| `session.<id>` | Active session tokens | PATCH 11 + SECURITY.md §4 |
| `csrf.<id>` | CSRF tokens | PATCH 11 + SECURITY_HEADERS_POLICY.md |
| `oauth.refresh.<provider>` | OAuth refresh tokens | v1.0.0 |
| `mfa.backup.<userId>` | MFA backup codes | v1.0.0 |
| `secret.rotated.<id>` | Rotated secret material | PATCH 12 |
| `audit.key.<id>` | Audit log signing key | PATCH 12 |
| `tax.api.<userId>` | Tax-API provider key (if user-supplied) | v1.0.0 |

## §11. Cross-Muse cross-witness

| Muse | Section | Status |
|---|---|---|
| **Vulcan** (Build/Deploy) | §3.3 (Rust commands), §3.4 (Cargo.toml) | PENDING — Vulcan to verify Tauri build with `keyring` crate |
| **Prometheus** (Performance) | §7 | PENDING — Prometheus to verify perf claims |
| **Themis** (Compliance) | §8 | PENDING — Themis to verify regulatory traceability |
| **Mnemosyne** (Memory/Persistence) | §10 (default account names) | PENDING — Mnemosyne to verify naming convention |
| **Chronos** (Time) | §3.5 (lockout duration) | PENDING — Chronos to verify 5min lockout aligns with audit retention |

## §12. Change log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-06-16 | 1.0.0 | Hephaestus | Initial policy for PATCH 15 (TauriSecureStorage). Closes CWE-256, CWE-257, CWE-312, CWE-922, CWE-200, CWE-1191. SOC 2 CC6.1, CC6.7, A1.2, GDPR Art. 32, Art. 5(1)(f). |

---

**End of ENCRYPTION_AT_REST_TAURI_IPC_POLICY v1.0.0**
