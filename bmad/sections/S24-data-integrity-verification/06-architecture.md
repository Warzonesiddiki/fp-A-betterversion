# S24 — Architecture

**Date:** 2026-07-25

## 1. Context
Storage trust.

## 2. Components
- integrity util, version metadata in masterStorage.

## 3. Data Model
- `Snapshot { schemaVersion, checksum, payload }`.

## 4. Interfaces
- `verifyIntegrity(snapshot) → Result`.

## 5. Integration
- Used by S21/S23.

## 6. Testing
- Tamper test → warning; version test → migrate.
