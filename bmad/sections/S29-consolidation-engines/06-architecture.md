# S29 — Architecture

**Date:** 2026-07-25

## 1. Context
Group consolidation.

## 2. Components
- `src/engines/{ConsolidationEngine, ICEliminationEngine, NCIEngine}.ts`.

## 3. Data Model
- `Ownership { parent, child, pct }`, `ConsolidatedStatement`.

## 4. Interfaces
- `eliminateIntercompany`, `attributeNCI`, `consolidate`.

## 5. Integration
- Used by S71/S72; FX via S30.

## 6. Testing
- IC + NCI unit tests with tolerance edges.
