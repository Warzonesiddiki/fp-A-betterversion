# S26 — Architecture

**Date:** 2026-07-25

## 1. Context
Calculation core.

## 2. Components
- `src/engines/*`, `src/test/engineTestUtils.ts`, `docs/engines/CATALOG.md`.

## 3. Data Model
- `EngineResult<T> { value: T; warnings?: string[] }`.

## 4. Interfaces
- `(inputs) => EngineResult<T>`.

## 5. Integration
- Used by all feature sections (S27–S82).

## 6. Testing
- Harness example test passes.
