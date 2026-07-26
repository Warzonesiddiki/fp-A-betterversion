# S26 — Brainstorming: Engine Foundation

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Every calculation is a **pure, typed, tested** function. No UI, no I/O.

## 2. SCAMPER
- **Confirm:** 186 engine files exist in `src/engines`.
- **Add:** shared test harness + `EngineResult` types; Decimal (S02) for money.
- **Modify:** catalog engines; enforce conventions.

## 3. Ideation
- `src/test/engineTestUtils` (expectCloseTo) already exists → standardize.

## 4. Selected Directions
1. Define engine conventions + harness; audit existing engines for purity/typing.
2. (Code exists; this section governs + completes.)

## 5. Open Questions
- Decimal rollout across 186 engines? (new code first, S27/S28.)
