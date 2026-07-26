# Section 010 — Persistence, Backup, Restore, Integrity

**Status:** COMPLETE: 100% READY

## Objective

Make backup/restore more trustworthy by adding a reusable backup-data creation path, awaited export flow, checksum verification, and a user-visible integrity check.

## Implementation Evidence

- `BackupRestore.createBackupData()` added.
- `BackupRestore.exportBackup()` now awaits IndexedDB reads and returns the generated backup payload.
- `BackupRestore.checkIntegrity()` added.
- `BackupRestorePage` now exposes an integrity-check workflow.
- Tests cover import failures, valid import, and integrity counts.

## Follow-ups

- Desktop SQLite migration proof remains Section 011.
- Broader settings/top-toolbar placement and E2E backup restore remain later sections.
