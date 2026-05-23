---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, testing, coverage, regression]
status: current
---

# Test Coverage — 2026-05-19

## Current Status

- **Test Files:** 418 total
- **Pass:** 397 files (95.0%)
- **Fail:** 21 files
- **Tests:** 5968 pass, 29 fail, 1 skip

## Regression Cause

Store pattern standardization (adding `subscribeWithSelector` wrapper) broke smoke tests that expected specific store API shapes. [[auth-rbac]] changes (adding RBAC) broke ProtectedRoute tests. New persist keys broke storageConstants tests. See [[ADR-004-test-fixing-strategy]] for resolution approach.

## Failing Test Categories

1. **Smoke tests (20+ files)** — expect specific empty state text that changed
2. **ProtectedRoute tests (5)** — auth interface changed
3. **storageConstants tests (3)** — persist keys changed
4. **HelpPage tests (2)** — content expanded
5. **SectorPage tests (3)** — KPIs added, empty state changed

## Fixes Applied

- `cd2f5fbd` — ProtectedRoute, AuditEngine, storageConstants tests fixed
- Test-fixer agent working on remaining 29 failures

## Engine Tests Added

- [[fx-engine]] test — currency conversion, ASC 830 translation
- [[compliance]] test — SOX compliance, segregation of duties
- AuditEngine test — audit logging, query, export

## Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| Stores | 90% | ~85% |
| Engines | 95% | ~80% |
| Components | 80% | ~75% |
| Pages | 80% | ~70% |
