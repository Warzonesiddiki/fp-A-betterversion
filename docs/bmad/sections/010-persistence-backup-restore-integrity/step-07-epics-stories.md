# Step 07 — epics-stories

Section 010 hardens the backup/restore foundation with awaited exports, checksum-backed imports, and a visible local storage integrity check.

## Acceptance Evidence

- Backup export awaits IndexedDB reads.
- Import verifies checksum when present.
- Integrity check reports store/backups/metadata counts.
- Backup/restore page exposes integrity check UI.
- Tests and gates pass.
