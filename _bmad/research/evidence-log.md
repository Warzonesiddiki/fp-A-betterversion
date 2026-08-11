# Research Evidence Log — FinPlan Pro

> **Status:** NO PRIMARY CUSTOMER EVIDENCE — only owner-direction (E-001/E-002), secondary (E-003), and technical/environmental (E-004/E-005) entries exist. Primary research remains the only path to validation.
> **Privacy rule:** Use anonymized participant IDs. Do not place financial data, credentials, contracts, or PII in this file.

## Evidence standard

A finding is **validated** only when it appears across at least three relevant participants or is supported by a verified operational artifact. A single quote is a signal, not validation. Contradictory evidence remains visible.

| Evidence ID | Date | Cohort / anonymized participant | Context (entity/users/systems) | Observed workflow or verbatim evidence | Assumption IDs | Supports / contradicts | Confidence | Follow-up |
|---|---|---|---|---|---|---|---|---|
| E-001 | 2026-08-10 | Owner direction (not customer evidence) | Enterprise target; hybrid deployment; multi-stakeholder buyer; connected close/planning/reporting intent | Owner selected enterprise, hybrid, “all” buyer/workflow priority | A-02, A-03, A-13, A-14 | Supports direction; does **not** validate market demand | Strategic direction only | Recruit enterprise role-based primary research sample |
| E-002 | 2026-08-10 | Owner direction (not customer evidence) | Both primary participant access/notes and browser-capable visual QA environment will be provided | Owner selected “Both” unblocking paths | R-01, F-02 | Enables parallel evidence-track and visual-QA execution; no evidence received yet | Operational commitment only | Await participant material/access and browser-capable environment |
| E-003 | 2026-08-10 | Public secondary review triangulation | Recurring public signals: implementation/training burden, admin complexity, model performance and UX trade-offs | See `secondary-voice-triangulation-2026-08-10.md` | R-01/R-02, A-03 | Supports research questions only; does **not** validate FinPlan demand | Secondary / medium at best | Add implementation/model-safety prompts to R-02 |
| E-004 | 2026-08-10 | Technical verification (not customer evidence) | Merged main `f3834e2` + session branch `b99ca27` (F-03/F-04, governance hardening, v5 addon, CSRF fix) | Full suite **1,185 files / 13,349 tests: 13,348 passed, 1 skipped, 0 failures** (cleanest full run to date; the earlier 4 perf-budget timing flakes did not recur — they pass in isolation too, 79/79); `tsc --noEmit` 0 errors (root + server); full-src ESLint 0 warnings; security suite 51/51 (incl. new CSRF fail-closed test); a11y gate suite 448 tests passed; capability inventory deterministic; docs-truth passed; `npm audit --omit=dev` 0 vulnerabilities; governance scripts green (architecture guardrails, compliance evidence 22/22, hygiene, license, export, money, mock-data); docs-link strict clean; `git diff --check` clean. | A-05 (health only) | Supports foundation quality; does **not** validate market/buyer/deployment assumptions | Technical / high | Re-run perf-budget tests in isolation or on dedicated runners before treating budgets as violations |
| E-005 | 2026-08-10 | Environmental / CI infrastructure (not customer evidence) | GitHub Actions on this repository | Every workflow job (CI, tsc, lint, test-unit, build, deploy, cascade-hold, sentry-self-test) fails before any step runs on commits predating and including PR #53; annotation: "The job was not started because recent account payments have failed or your spending limit needs to be increased." Logs unretrievable because jobs never start. | none (R-07) | Explains CI red; no code regression | Environmental / high | Owner resolves GitHub billing; re-run workflows; then re-assess CI |

## Synthesis scorecard

| Assumption | Evidence count | Supporting | Contradicting | Current status | Decision |
|---|---:|---:|---:|---|---|
| A-01 Premium willingness to pay | 0 | 0 | 0 | UNVALIDATED | Do not claim price point |
| A-02 Local-first advantage | 0 | 0 | 0 | UNVALIDATED | Do not make deployment promise |
| A-03 Five-job wedge | 0 | 0 | 0 | UNVALIDATED | Do not retire alternative wedges |
| A-04 Hybrid control plane | 0 | 0 | 0 | UNVALIDATED | Architecture remains hypothesis |
| A-07 One connector + import | 0 | 0 | 0 | UNVALIDATED | Do not choose connector |
| A-13 Initial ICP | 0 | 0 | 0 | UNVALIDATED | Do not target vertical publicly |

## Required synthesis questions

1. Which painful job is repeated without prompting?
2. What evidence contradicts the close-to-decision wedge?
3. What workarounds, systems, and approval controls are actually used?
4. What would make a buyer switch or refuse to switch?
5. What deployment/control expectation is non-negotiable?
6. What must be removed from Release 1 because it is not tied to validated pain?
| E-006 | 2026-08-10 | Technical verification (security audit, not customer evidence) | src/utils/security.ts + tests | Math.random audit across src/ and server/src: all remaining uses are legitimate (Monte Carlo simulation RNG, spreadsheet RAND functions, seeded PRNGs, mock-data generators) EXCEPT the CSRF token fallback, which used Math.random when crypto.getRandomValues was absent. Fixed to fail closed (throw) with regression test; security suite 51/51. | A-05 (health only) | Supports foundation security posture; does **not** validate market/buyer/deployment assumptions | Technical / high | Re-run audit after security-adjacent changes |
| E-007 | 2026-08-10 | Technical verification (server, not customer evidence) | server/ suite + schema | Real-SQLite verification: built native better-sqlite3 (local headers workaround), fixed 7 suites the mock had masked — schema-guarantee ordering (connection.ts), canonical audit_trail (001 + reconciliation migration incl. index fixes), server columns (budgets.entity_id/deleted_at, forecasts/reports/scenarios entity_id+budget_id, gl_entries.created_by) with idempotent ALTER reconciliation, real production bug `closed_by = ${raw id}` interpolation → bound params, per-worker test DB isolation, FK-compliant test seeding. Server suite now **198 tests / 13 files pass on real SQLite** (native config incl. previously-excluded AuditService/accountLockout); lint 0 warnings; server tsc 0 errors. | A-05 (health only) | Supports foundation quality; does **not** validate market/buyer/deployment assumptions | Technical / high | Re-run after server changes |
| E-008 | 2026-08-10 | Technical verification (server, not customer evidence) | server/src/db + Tauri migration files | Regression coverage for the real-SQLite reconciliation: 6 new tests in `schemaReconciliation.test.ts` (legacy→canonical audit_trail rebuild preserving rows, canonical no-op, column additions, idempotency, already-present no-op, absent-table skip); `ensureServerColumns` hardened to skip absent tables. Tauri side verified clean (no Rust/SQL consumer of the legacy audit_trail shape). Server suites: **127/127 default, 204/204 native**. | A-05 (health only) | Supports foundation quality; does **not** validate market/buyer/deployment assumptions | Technical / high | Re-run after migration changes |
