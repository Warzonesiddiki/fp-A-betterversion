# S08 — Architecture

**Date:** 2026-07-25

## 1. Context
Type safety gate.

## 2. Components
- `tsconfig.json`, `tsconfig.node.json`, `npm run typecheck`, CI step.

## 3. Data Model
- N/A.

## 4. Interfaces
- typecheck → exit code.

## 5. Integration
- Precedes lint/test/build in CI (S10).

## 6. Testing
- `tsc --noEmit` = 0.
