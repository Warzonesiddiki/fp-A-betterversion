# S08 — Brainstorming: TypeScript Strict Gates

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- "Zero compromise" ⇒ the compiler must be clean. `tsc --noEmit` = 0 errors, always.

## 2. SCAMPER
- **Confirm:** strict + noUncheckedIndexedAccess (already in tsconfig).
- **Modify:** treat warnings as errors in CI.
- **Eliminate:** `any` (use `unknown`).

## 3. Ideation
- Snapshots conflict (0 vs 2266 errors) → target 0, enforce in CI pre-merge.

## 4. Selected Directions
1. Enforce `tsc --noEmit` 0 errors as a hard gate (pre-push + CI).
2. Add a typed "gradual strict" cleanup plan for legacy `any`.

## 5. Open Questions
- Effort to reach 0 from current state (unknown until S04 install lands + measure).
