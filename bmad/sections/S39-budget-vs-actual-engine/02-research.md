# S39 — Research

**Date:** 2026-07-25

## 1. Questions
- BVA engine status?

## 2. Findings
- `BudgetVAReport.tsx` page exists (410 lines). `src/engines` likely has variance helpers.
- Uses S27 `variance`.

## 3. Decision
- Centralize BVA computation; ensure favorable-direction correctness.

## 4. Risks
- Account-type-driven favorability.

## 5. Dependencies
- S27, S34, S12.
