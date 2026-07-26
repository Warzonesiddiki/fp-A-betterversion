# S39 — PRD

**Date:** 2026-07-25

## 1. Overview
Budget vs Actual variance engine.

## 2. FRs
- FR-1: `computeBVA(budget, actualGL, period)` → per-account {actual, budget, variance, favorable}.
- FR-2: Rollup by department/account type.
- FR-3: Uses S27 `variance` with higherIsBetter per type.

## 3. Acceptance
- Known budget+actual → correct variance + favorability.

## 4. Out of Scope
- UI (→ S65).

## 5. Dependencies
- S27, S34, S12.
