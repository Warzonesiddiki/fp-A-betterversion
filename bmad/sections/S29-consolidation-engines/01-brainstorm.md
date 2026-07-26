# S29 — Brainstorming: Consolidation Engines

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Consolidation must eliminate inter-company balances and attribute NCI correctly.

## 2. SCAMPER
- **Confirm:** consolidation engines exist (35+ per README).
- **Add:** IC elimination with 1% tolerance; NCI attribution.
- **Modify:** entity ownership tree input.

## 3. Ideation
- `eliminateIntercompany(txns, tolerance)`, `attributeNCI(...)`.

## 4. Selected Directions
1. Consolidation engines: IC elim + NCI + ownership roll-up.
2. (Code exists; complete + test → S71/S72 UI.)

## 5. Open Questions
- Partial ownership <100%? (yes → NCI.)
