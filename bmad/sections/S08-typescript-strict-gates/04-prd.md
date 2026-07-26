# S08 — PRD

**Date:** 2026-07-25

## 1. Overview
Enforce zero TypeScript errors as a hard, automated gate.

## 2. FRs
- FR-1: `tsconfig.json` stays strict + noUncheckedIndexedAccess.
- FR-2: `npm run typecheck` = `tsc --noEmit`; must exit 0.
- FR-3: CI + husky pre-push run typecheck; block on failure.
- FR-4: Measure baseline post-S04; track in `reports/ts-baseline.md`.

## 3. Acceptance
- Fresh checkout → `npm run typecheck` = 0 errors (after remediation work).

## 4. Out of Scope
- The remediation itself (done incrementally in feature sections + S93).

## 5. Dependencies
- S04, S10.
