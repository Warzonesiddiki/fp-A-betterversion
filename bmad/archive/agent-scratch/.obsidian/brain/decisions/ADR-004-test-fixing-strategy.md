---
date: 2026-05-19
type: adr
project: FinPlan Pro
tags: [finplan-pro, testing, regression, strategy]
status: accepted
---

# ADR-004: Test Fixing Strategy

## Context

Store pattern changes (adding subscribeWithSelector) and [[auth-rbac]] changes (adding RBAC) caused 82 test failures across 30 test files. Need strategy for handling test regressions from infrastructure changes.

## Decision

Fix tests to match implementation, not the other way around.

## Rationale

1. Tests should verify behavior, not implementation details
2. Store middleware changes are infrastructure improvements
3. Auth RBAC changes are feature additions
4. Smoke tests checking specific text should be resilient

## Implementation

1. **Smoke tests**: Update expected text to match current UI
2. **Store tests**: Account for subscribeWithSelector wrapper
3. **Auth tests**: Update for new RBAC interface
4. **Component tests**: Update mock data with new required fields

## Consequences

- Tests may break when adding middleware (acceptable)
- Smoke tests need periodic refresh (expected)
- Auth tests need updating when adding roles (expected)
- Engine tests should be written alongside engine code (preferred)

## Anti-Pattern

- Never revert infrastructure improvements to fix tests
- Never skip failing tests without tracking
- Never let test failures block feature commits (fix in parallel)
