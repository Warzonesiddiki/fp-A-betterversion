# SECTION 17 — TESTING STRATEGY

## 17.1 The testing pyramid (target shape)

```
                    ╱╲     E2E (Playwright)          ~150 specs
                   ╱  ╲    real browser, real flows
                  ╱────╲   Integration                ~600 specs
                 ╱      ╲  API + DB + engine wiring
                ╱────────╲ Unit                     ~4,000 specs
               ╱          ╲ engines, utils, hooks, components
              ╱────────────╲ Golden numbers          ~200 fixtures
             ╱______________╲ known-correct financial outputs
```

Current state: **1,228 test files, `tsc --noEmit` clean, `eslint --max-warnings 0` clean.**
That is a genuinely strong foundation and must not regress.

## 17.2 Coverage requirements (differentiated by risk)

| Area                         | Line  | Branch | Rationale                     |
| ---------------------------- | ----- | ------ | ----------------------------- |
| `src/utils/money.ts`         | 100%  | 100%   | The primitive. No exceptions. |
| `src/engines/**` (financial) | ≥ 95% | ≥ 90%  | Wrong numbers are Severity-0. |
| `server/src/routes/**`       | ≥ 90% | ≥ 85%  | Authority plane.              |
| Security/RLS paths           | 100%  | 100%   | A gap is a breach.            |
| `src/store/**`               | ≥ 85% | ≥ 75%  |                               |
| `src/components/**`          | ≥ 80% | ≥ 70%  |                               |
| Overall                      | ≥ 85% | ≥ 78%  | Ratchet — may only increase.  |

Coverage is a **ratchet**: the threshold is raised to the achieved value on every green
main build and never lowered.

## 17.3 Golden-number fixtures (the financial oracle)

A corpus of hand-verified financial scenarios with known-correct outputs:
three-statement models, multi-entity consolidations with eliminations and NCI, FX
translation cases per IAS 21, allocation cascades, depreciation schedules across all four
methods, revenue recognition (ASC 606 five-step, including multi-element arrangements),
lease accounting (IFRS 16 / ASC 842), and 4-4-5 / 53-week calendar boundary cases.

Each fixture states its source of truth (worked example, textbook, or auditor-reviewed
spreadsheet) and asserts to the cent. `npm run financial:oracles` runs them. **A golden
fixture may never be edited to make a failing test pass** — a diff in a golden number is
either a genuine bug or a deliberate, reviewed standard change with an ADR.

## 17.4 Property-based tests (financial invariants)

Generated across random inputs:

- Debits equal credits, always.
- Assets = Liabilities + Equity, always.
- Sum of allocated parts equals the allocated whole, exactly (no penny leaks).
- Consolidation of one entity equals that entity's standalone statements.
- FX round-trip at the same rate returns the original amount.
- Aggregation is associative and commutative over decimal money.
- A period's closing balance equals the next period's opening balance.

## 17.5 Mutation testing

Stryker on `src/utils/money.ts` and the financial engines. Target mutation score ≥ 80%
on money, ≥ 70% on engines. Surviving mutants on the money primitive are treated as
missing tests and fixed before feature work.

## 17.6 Non-functional test gates

Performance (budgets in 9.6, asserted in CI on a fixed dataset), accessibility (axe on
every route, zero violations), visual regression (Playwright screenshots on key surfaces),
load (k6 profile at target concurrency, Phase 2), chaos (kill the DB mid-import and assert
full rollback + reconciliation, Phase 2), and restore drills (Part XXVII — a backup is not
a backup until a restore has been rehearsed and timed).

## 17.7 Definition of Done (every feature, no exceptions)

```
□ Spec written and reviewed before code
□ Unit tests pass, coverage threshold met for the area
□ Integration tests pass
□ E2E test for the primary user journey
□ Golden-number fixture added if the feature touches money
□ Accessibility check passes (axe, keyboard-only walkthrough)
□ Performance budget met and measured
□ Error states designed, implemented, and coded in the error registry
□ Empty and loading states implemented
□ Audit events emitted for every state change
□ Lineage recorded for every derived value
□ RLS/permission checks in place and tested (including a negative test)
□ Documentation updated (user-facing + ADR if a decision was made)
□ Telemetry added (usage + failure)
□ tsc clean, eslint clean, no new TODOs without an issue link
```

## 17.8 CI gates (blocking)

`typecheck` → `lint` → `unit (sharded)` → `financial:oracles` → `architecture:guardrails`
→ `money:adoption` (ratchet) → `type-safety:ratchet` → `engines:verify` → `integration`
→ `e2e` → `a11y` → `perf-budget` → `license:check` → `docs:links` → `compliance:evidence`
→ `release:dry-run`.

**Constraint:** this sandbox cannot push `.github/workflows/**`. All CI changes are
delivered as numbered patches in `ci-patches/` for human `git apply` (see `ci-patches/0005-*.patch`,
currently pending).

---
