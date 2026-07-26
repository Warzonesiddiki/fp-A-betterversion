# S59 — Architecture

**Date:** 2026-07-25

## 1. Context
Report composition.

## 2. Components
- `src/pages/reports/ReportDesignerPage.tsx`, block registry.

## 3. Data Model
- `ReportLayout { blocks: Block[] }`.

## 4. Interfaces
- `saveLayout`, `loadLayout`.

## 5. Integration
- Uses S56–S58 blocks; persists S60.

## 6. Testing
- Save/load round-trip; keyboard path.
