# Backup and Restore

**Finding:** F-0010 · **Known-answer vector:** KAV-12
**Status:** implemented and proven by automated test as of 2026-07-29.

---

## 1. Why this document exists

The audited implementation was worse than absent. `BackupRestore` enumerated an
IndexedDB object store named `stores`, but **the application does not persist
there**: all 36 Zustand stores go through `masterStorage`, which writes sql.js
in the browser and Tauri SQLite on desktop.

The consequence, in plain terms: a user who opened Settings → Backup and clicked
**Export Backup** received a JSON file containing **none of their general
ledger, budgets, entities, forecasts or FX rates** — and the UI reported
success. Restoring that file was a silent no-op. For a local-first product where
the exported file is the only disaster-recovery artefact, this is the most
severe class of data-integrity defect: it fails exactly when it is needed, and
the user has no way to know until then.

The old test suite could not have caught it. It mocked IndexedDB and asserted
that `put()` was called with a particular shape, so it verified the mock rather
than the product.

---

## 2. What is backed up

Source of truth: `src/utils/persistedStores.ts`.

- **36 persisted stores** are registered (`PERSISTED_STORE_KEYS`), matching every
  `persist({ name })` call in `src/store`.
- **`auth-store` is deliberately excluded** (`BACKUP_EXCLUDED_KEYS`). Session
  state restored into another install would either resurrect a stale session or
  clobber the operator's own. A restore never changes who you are logged in as.
- Stores holding no data are omitted from the file rather than written as
  `null`, so an empty store cannot be mistaken for a store of nulls.

### The registry cannot silently drift

A hand-maintained list is only safe if something fails when a developer adds a
persisted store and forgets it — otherwise that store is quietly missing from
every user's backup forever. `src/utils/backupRestore.test.ts` scans `src/store`
for `name: '<key>'` in `persist()` calls and asserts set-equality with the
registry, in **both** directions. Adding a store without registering it fails
the build.

---

## 3. File format

`formatVersion: 2` (`BACKUP_FORMAT_VERSION`).

```jsonc
{
  "metadata": {
    "formatVersion": 2,
    "appVersion": "1.0.0",
    "exportedAt": "2026-07-29T12:00:00.000Z",
    "storeSizes": { "gl-store": 1284 }, // payload lengths, human sanity check
    "checksum": "<sha256 hex over canonical JSON of `data`>",
  },
  "data": {
    "gl-store": "<persisted value exactly as masterStorage returns it>",
  },
}
```

A version mismatch does not hard-fail; it restores best-effort and records a
warning, so a slightly older file is still recoverable in an emergency.

---

## 4. Integrity

- **SHA-256 over canonical JSON.** `canonicalJSON()` sorts object keys at every
  level, so two structurally identical backups always hash identically.
  Without canonicalisation a valid file could be rejected as corrupt purely
  because of key insertion order.
- **No weak fallback.** The previous code silently fell back to a 32-bit
  djb2-style hash when Web Crypto was unavailable — not collision-resistant and
  useless against tampering, while still reporting "integrity verified".
  `computeChecksum()` now throws rather than pretend.
- **Fail closed.** The checksum is verified **before any write**. A tampered or
  truncated file is rejected and the database is left untouched.

---

## 5. Restore semantics

`BackupRestore.restoreFromJSON(text)` never throws; it returns a
`RestoreResult`.

1. Parse — malformed JSON is reported, not thrown.
2. Validate the envelope (`metadata` + `data` + `checksum`).
3. Verify the checksum — **abort here on mismatch, writing nothing.**
4. Stage every store: excluded keys and unknown keys are skipped with warnings.
5. Write staged stores. A write failure (quota, encryption, backend) is recorded
   in `errors` and sets `success: false` — a partially restored database is
   never reported as a success.

Restore is **idempotent**: applying the same file twice yields the same state.

---

## 6. Proof (KAV-12)

`src/utils/backupRestore.test.ts` — **19 tests, all passing, ~2.6s.**
They run against the real `masterStorage` path, not a mock of it, so a backup
that misses application data fails the suite.

| Test                                            | Proves                                            |
| ----------------------------------------------- | ------------------------------------------------- |
| registry matches `persist()` calls              | no store can be silently unbacked-up              |
| **seed → backup → wipe → restore → deep-equal** | **KAV-12 core**                                   |
| monetary strings round trip                     | `'150000.00'` survives exactly                    |
| 5,000-row ledger round trip                     | no truncation at size                             |
| completes < 15s                                 | audit's timing requirement (actual: milliseconds) |
| restore twice                                   | idempotence                                       |
| checksum is order-independent                   | valid files are not falsely rejected              |
| checksum changes on any value change            | `100.00` vs `100.01` detected                     |
| tampered file rejected, **nothing written**     | fail-closed                                       |
| truncated file rejected                         | missing store detected                            |
| invalid JSON / missing envelope                 | malformed input reported                          |
| unknown store skipped with warning              | forward compatibility                             |
| `auth-store` never restored                     | session safety                                    |
| write failure surfaced                          | no silent partial restore                         |
| integrity report                                | populated vs empty stores                         |

Reproduce:

```bash
npx vitest run src/utils/backupRestore.test.ts
```

---

## 7. Operator procedure

**Create a backup**
Settings → Backup & Restore → _Export Backup_. Store the file outside the
machine holding the data. Verify `metadata.storeSizes` is non-empty.

**Restore**
Settings → Backup & Restore → _Import Backup_. Read the result panel: a restore
is successful only when `errors` is empty. On a checksum failure, nothing was
written — obtain an uncorrupted copy.

**Recommended cadence:** before every period close, before any migration, and
before upgrading the desktop app.

---

## 8. Known limitations

| Limitation                                   | Impact                                                                                                                                                  | Status                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Backups are **unencrypted JSON**             | A backup file contains plaintext financial data even though the live store is encrypted at rest. Store it on encrypted media.                           | Open — encrypting the export requires key management (F-0014 follow-up) |
| No automatic/scheduled backups               | Export is manual.                                                                                                                                       | Open                                                                    |
| Restore is staged, not transactional         | A crash mid-write can leave some stores restored and others not; `errors` reports which. The underlying key/value backend has no multi-key transaction. | Open                                                                    |
| No cross-version schema migration on restore | An older file restores best-effort with a warning; store migrations run separately.                                                                     | Accepted                                                                |
| `auth-store` is never restored               | By design; the operator re-authenticates.                                                                                                               | By design                                                               |
