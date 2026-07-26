# S20 — Architecture

**Date:** 2026-07-25

## 1. Context
Legacy GL onboarding.

## 2. Components
- `src/pages/data/MigrationWizard.tsx`, mapping engine, S12 store.

## 3. Data Model
- `SourcePreset`, `CoAMapping`.

## 4. Interfaces
- `applyPreset(rows, preset, coaMap) → GLEntry[]`.

## 5. Integration
- Uses S13 parser + S12 import.

## 6. Testing
- Preset fixture → correct mapped entries.
