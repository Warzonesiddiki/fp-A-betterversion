# S26 — PRD

**Date:** 2026-07-25

## 1. Overview
Engine conventions + shared test harness.

## 2. FRs
- FR-1: Document engine pattern (pure fn, typed input/output, no `any`).
- FR-2: `EngineResult<T>` type; shared harness in `src/test/engineTestUtils`.
- FR-3: `ENGINE_CATALOG.md` listing engines + owners.
- FR-4: Lint rule/check that engines import no React/DOM.

## 3. Acceptance
- New engine follows pattern; harness used in tests.

## 4. Out of Scope
- Fixing individual engines (→ S27–S33).

## 5. Dependencies
- S02, S93.
