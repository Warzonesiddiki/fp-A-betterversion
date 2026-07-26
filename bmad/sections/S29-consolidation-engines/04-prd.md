# S29 — PRD

**Date:** 2026-07-25

## 1. Overview
Consolidation calculation engines.

## 2. FRs
- FR-1: `eliminateIntercompany(transactions, tolerance=0.01)` → adjusted set.
- FR-2: `attributeNCI(entity, ownership)` → NCI share.
- FR-3: `consolidate(entities, statements)` → group P&L/BS.
- FR-4: Ownership tree roll-up.

## 3. Acceptance
- Known IC pair → eliminated within tolerance; NCI correct.

## 4. Out of Scope
- UI (→ S71/S72).

## 5. Dependencies
- S12, S27, S70.
