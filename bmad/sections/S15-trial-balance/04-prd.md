# S15 — PRD

**Date:** 2026-07-25

## 1. Overview
Auto-calculated Trial Balance with balance indicator.

## 2. FRs
- FR-1: Compute TB from `glStore` entries grouped by account for selected period.
- FR-2: Show "Balanced ✓" or "Off by $X" with debits/credits totals.
- FR-3: Period selector (month/quarter/YTD).
- FR-4: Export TB to CSV/PDF.

## 3. Acceptance
- With balanced data → "Balanced"; with $10 off → "Off by $10.00".

## 4. Out of Scope
- Journals (→ S16).

## 5. Dependencies
- S12, S14.
