# Testing Strategy

## Overview

FinPlan Pro adheres to a zero-compromise testing methodology with over 900 test files.

## Layers

- **Unit Tests**: Pure logic, engines, and store verification via Vitest.
- **Property-Based Tests**: Mathematical and accounting invariant verification (KAV-09, KAV-10).
- **Integration & Security Tests**: Server authorization, rate limiting, account lockout, and audit integrity tests.
- **Regression Gates**: Pre-push hooks and CI gates blocking regressions.
