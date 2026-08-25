# Key Escrow Recovery Policy — Scheme (a): One-Time Recovery Code

> **Status:** Implemented (as-built) · **Recorded:** 2026-08-25 · **Branch:** phase0/w02-tenancy
> **Scope:** root storage key (`K_root`) recovery for the offline-first encrypted store
> (`masterStorage`). OS-keychain mirroring is **deferred** (see §8).

## 1. Problem

`K_root` is derived from a per-install device key persisted at
`localStorage['finplan.storage-key.v1']` (see `src/utils/masterStorage.ts`,
"Key management"). Before this feature, a device key that was **missing or
corrupt** was _silently rotated to a fresh random key_ by
`resolveKeyMaterial()`. Every existing ciphertext on disk became permanently
undecryptable — silent data destruction with no recovery path.

## 2. Solution summary

A user-chosen **one-time recovery code** wraps the EXISTING device key
material. The wrapped record lives OUTSIDE the `K_root` envelope as raw JSON
(plain localStorage), self-integrity-checked, so it remains readable exactly
when `K_root` is not.

Recovery flow: `code → PBKDF2 → AES-GCM unwrap → keyId check → known-plaintext
check → repersist device key`. The production decrypt path is unchanged after
recovery.

## 3. Crypto parameters (LOCKED — never lower these for tests)

| Parameter           | Value                                                         |
| ------------------- | ------------------------------------------------------------- |
| Code alphabet       | Base32 RFC 4648 (`A–Z`, `2–7`)                                |
| Code length         | 20 chars (≈100 bits of entropy; byte % 32 is bias-free)       |
| Display grouping    | `XXXXX-XXXXX-XXXXX-XXXXX`                                     |
| KDF                 | PBKDF2-HMAC-SHA256                                            |
| Iterations          | 600,000                                                       |
| Salt                | 16 random bytes per enrollment                                |
| Wrap cipher         | AES-GCM-256                                                   |
| Wrap IV             | 12 random bytes, prepended inside `wrappedKeyB64`             |
| Wrapped payload     | raw 32-byte device key material                               |
| keyId               | first 8 bytes of SHA-256(device key material), hex (16 chars) |
| Check blob          | constant string sealed under the derived storage key          |
| Record checksum     | SHA-256 hex over canonical JSON of record minus the field     |
| Failed-attempt lock | 5 failures → 15-minute lockout (`lockedUntil`)                |

## 4. Record schema (`EscrowRecordV1`)

Stored raw at `localStorage['finplan.key-escrow.v1']`:

```jsonc
{
  "v": 1,
  "scheme": "FP-ESCROW-V1",
  "kdf": "PBKDF2-SHA256",
  "salt": "<b64 16B>",
  "iter": 600000,
  "wrappedKeyB64": "<b64 IV||ct>", // wrap IV rides as prefix
  "checkCt": "<b64>",
  "checkIv": "<b64 12B>",
  "keyId": "<16 hex chars>",
  "failedAttempts": 0,
  "lockedUntil": null,
  "recordChecksum": "<sha256 hex>",
}
```

## 5. Boot gate behavior (the ONE masterStorage behavior change)

In `resolveKeyMaterial()`:

| State                                       | Behavior                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| Device key present & valid                  | unchanged                                                                         |
| `MASTER_STORAGE_KEY` env set                | env path wins; escrow gate never evaluated                                        |
| Key missing/corrupt AND valid escrow record | **throw `StorageKeyUnavailableError('escrow-recovery-available')`** — no rotation |
| Key missing/corrupt, NO escrow record       | legacy behavior (rotate fresh / fail closed)                                      |

Reads propagate the typed error (not masked as `StorageDecryptionError`);
writes surface it as the `cause` of `StorageWriteError('encrypt')`. Both emit
on the storage error channel so UI can offer recovery instead of a reset.

## 6. Backup integration

- `BACKUP_FORMAT_VERSION`: **2 → 3**.
- v3 metadata optionally embeds `escrow: EscrowRecordV1` (raw read, never
  decrypted through masterStorage).
- v2 backups remain fully readable without warnings (backward compat).
- Restore **never auto-installs** an embedded escrow record (a hostile backup
  must not rebind this device's recovery target); presence yields an
  informational warning naming the `keyId`.
- Checksum continues to cover `data` only; escrow metadata does not shift it.

## 7. Threat model / honest limits

- Defends against: accidental device-key deletion/corruption, storage-layer
  key loss, orphaning of recoverable ciphertext by silent key rotation.
- Does NOT defend against: an attacker with full profile/disk access who also
  knows the recovery code (PBKDF2 cost is the only brake); an attacker who can
  rewrite the record wholesale (the checksum detects corruption, not a
  sophisticated re-wrap). Documented residual risk consistent with the
  existing device-key model in `docs/architecture/security.md`.
- The plaintext code is shown once, held only in memory during the confirm
  flow, and never persisted or logged. Dismissal requires correct re-typing;
  loss requires the regenerate flow (new code replaces the record).

## 8. Deferred / open items

1. **OS-keychain mirror** (Tauri desktop keychain for the device key) — deferred.
2. **Boot-gate UI wiring**: no global boot interceptor renders a dedicated
   recovery screen when `StorageKeyUnavailableError('escrow-recovery-available')`
   fires on startup. Current fallback surfaces: Backup & Restore settings card
   (enrollment/recovery/regenerate) and the wizard step. A full-screen boot
   gate remains open work.
3. **Migration prompt**: users enrolled under the old regime are not actively
   prompted to enroll; discovery is via settings/onboarding surfaces only.
4. Escrow record corruption falls back to legacy rotate-fresh semantics (by
   design; see `readEscrowRecord()`).

## 9. Test map

| Concern                           | File                                                |
| --------------------------------- | --------------------------------------------------- |
| Crypto core, code format, lockout | `src/utils/keyEscrow.test.ts`                       |
| Store flow state                  | `src/utils/keyEscrowStore.test.ts`                  |
| Boot gate + recovery loop         | `src/utils/masterStorage.escrow.test.ts`            |
| Backup v3 embed + v2 compat       | `src/utils/backupRestore.escrow.test.ts`            |
| Show-once / re-type / regenerate  | `src/components/settings/RecoveryCodeCard.test.tsx` |
| Wizard step placement/flow        | `src/pages/onboarding/SetupWizardPage.test.tsx`     |
| Settings page wiring              | `src/pages/settings/BackupRestorePage.test.tsx`     |
