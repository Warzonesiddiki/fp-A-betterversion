# S30 — PRD

**Date:** 2026-07-25

## 1. Overview
FX translation engines.

## 2. FRs
- FR-1: `translate(amount, rate, method)` for average/closing/historical.
- FR-2: `computeCTA(...)` → cumulative translation adjustment to equity.
- FR-3: Rate lookup from S73 table with period.

## 3. Acceptance
- Known rates → correct translated amounts + CTA.

## 4. Out of Scope
- UI (→ S73/S74).

## 5. Dependencies
- S29, S73.
