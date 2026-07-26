# S23 — Architecture

**Date:** 2026-07-25

## 1. Context
Data portability.

## 2. Components
- `src/pages/settings/BackupRestorePage.tsx`, snapshot util.

## 3. Data Model
- `BackupFile { version, stores: Record<string, unknown> }`.

## 4. Interfaces
- `exportAll()`, `importAll(file)`.

## 5. Integration
- Uses S21 storage; audits via S83.

## 6. Testing
- Round-trip on fixture; partial file rejected.
