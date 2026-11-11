# Data Integrity Architecture

**Status:** short reference summary, rechecked 2026-11-11. It is not a guarantee
and not a substitute for [`backup-restore.md`](backup-restore.md),
[`security.md`](security.md) or [`PERSISTENCE_MAP.md`](PERSISTENCE_MAP.md).

## Overview

FinPlan Pro aims for durable, verifiable local persistence with explicit failure
surfaces rather than silent fallbacks. Several mechanisms below are implemented
and tested; several common assumptions are **not** true of the current code and
are called out so this page does not overstate integrity.

## Key mechanisms (with their actual boundaries)

- **Storage writes.** Application state persists through `masterStorage`
  (`src/utils/masterStorage.ts`) into sql.js in the browser and Tauri SQLite on
  desktop. Store migrations and schema checks are asserted separately by
  `npm run docs:verify`'s persistence-map and schema-equality scripts.
  Writes are fail-loud: quota, serialization, encryption and backend failures
  raise `StorageWriteError` rather than reporting success.
- **Atomicity is limited, not global.** This page previously claimed ACID
  transactions across "GL postings, journal imports, budget cascading". The
  code does not provide that guarantee: values above 1MB are split into chunks
  whose writes are **not atomic**, and a crash mid-write leaves a store that is
  detected as corrupt but not automatically repaired
  (`docs/architecture/security.md` §3). Restore is likewise staged rather than
  transactional (`docs/architecture/backup-restore.md` §8). Per-store SQLite
  statements can be transactional; cross-store atomicity is **NOT IMPLEMENTED**.
- **Backup and restore integrity.** Backup files carry a SHA-256 checksum over
  canonical JSON, verified **before any write**; a mismatch aborts with nothing
  written, and the old 32-bit fallback hash was removed. This is the KAV-12
  known-answer vector, proven by `src/utils/backupRestore.test.ts` (23 tests
  passing on 2026-11-11). The archive is plain JSON, **not** an encrypted
  "KAV-12 format": exported backups are unencrypted even though the live store
  is encrypted at rest. See [`backup-restore.md`](backup-restore.md) §4 and §8.
- **Audit trails.** The client-side chain in `src/store/auditTrailStore.ts` is
  SHA-256 hash-chained and can detect mutation, deletion, reordering and
  truncation — but it is **unkeyed**, so a local attacker with write access can
  recompute a consistent chain. A keyed HMAC-SHA256 chain exists only in the
  optional server (`server/src/routes/audit.ts`), and the frontend has no
  `/api/audit` caller. Do not describe client audit history as tamper-proof
  against the local user. See [`security.md`](security.md) §5.
