# S11 — PRD

**Date:** 2026-07-25

## 1. Overview
Enforce bundle-size budgets.

## 2. FRs
- FR-1: `scripts/bundle-check.js` thresholds: main ≤150KB gz, total ≤2MB gz.
- FR-2: Add to CI (S10) and husky pre-push.
- FR-3: Audit `App.tsx` for static (non-lazy) route imports; fix.
- FR-4: Keep grid-vendor/excel-vendor/ai-vendor lazy.

## 3. Acceptance
- CI fails when bundle exceeds budget.

## 4. Out of Scope
- Perf benchmarking (→ S92).

## 5. Dependencies
- S07, S10.
