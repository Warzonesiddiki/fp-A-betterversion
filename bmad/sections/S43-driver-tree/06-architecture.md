# S43 — Architecture

**Date:** 2026-07-25

## 1. Context
Driver planning core.

## 2. Components
- `src/engines/DriverTreeEngine.ts`, types.

## 3. Data Model
- `Driver { id, name, formula, inputs: id[], affects: accountCode[] }`.

## 4. Interfaces
- `evaluateTree(tree)`, `detectCycle(tree)`.

## 5. Integration
- Uses S32; feeds S45/S48.

## 6. Testing
- Cycle detection + evaluation tests.
