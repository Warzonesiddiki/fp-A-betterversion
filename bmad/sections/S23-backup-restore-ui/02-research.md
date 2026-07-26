# S23 — Research

**Date:** 2026-07-25

## 1. Questions
- Backup page status?

## 2. Findings
- `src/pages/settings/BackupRestorePage.tsx` exists (lazy).
- Tasklist 1.2.3 (Global Backup/Restore UI) unchecked.

## 3. Decision
- Build full export/import with validation; 100% restore test.

## 4. Risks
- Partial restore leaves inconsistent state → transactional load.

## 5. Dependencies
- S21.
