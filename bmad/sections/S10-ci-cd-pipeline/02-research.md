# S10 — Research

**Date:** 2026-07-25

## 1. Questions
- CI ordering, caching, test budget.

## 2. Findings
- `.github/` exists (workflows likely present). CLAUDE.md documents CI order: tsc→lint→test→build→bundle.
- Tests historically ~48% pass / long runtime → need sharding or focused runs in CI.
- Node 22, `npm ci`.

## 3. Decision
- Implement the documented order; cache; separate Tauri job; test with timeout + retry.

## 4. Risks
- Flaky tests block merges; addressed in S93.

## 5. Dependencies
- S04, S08, S09, S11, S93.
