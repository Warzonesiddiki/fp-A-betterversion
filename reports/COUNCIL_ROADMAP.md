# Omega Council — Roadmap Decision

**Goal:** all-in-one FP&A, zero flaw, user never needs another tool.
**Decided by:** the five-persona council, from **measured** current status (not aspiration).
**Date:** 2026-07-31.

---

## 1. Current status (measured)

| Dimension | Measured | Source |
| --- | --- | --- |
| Quality gates | **All green** — tsc, eslint `--max-warnings 0`, build, full suite | prior batches |
| Money primitive adoption | 24 / 355 financial modules · 84 `toFixed` sites | `npm run money:adoption` |
| **Engine reachability** | **72 / 183 reachable (39%)** — 111 unreachable | `scripts/engine-reachability.mjs` |
| ↳ orphan but **tested** | **109** — real, verified logic with no product surface | (wire candidates) |
| ↳ orphan, **untested** | 2 — likely dead | (delete/investigate) |
| Pages / stores / routes | 196 / 37 / 250 | filesystem |

Omega infrastructure landed: invariant primitive, feature-flags, worker chaos suite, event-sourced ledger (batches 001–004).

## 2. The pivot (Architect)

The council had been migrating engines to the money primitive (RevRec, Loan, Depreciation). That is genuine "zero flaw" work — **but three of those engines aren't reachable by any user**. Polishing a capability nobody can open has **zero leverage** on "never need another tool." The measured blocker is **reachability, not precision**: 109 tested engines are stranded behind no UI.

**Decision:** invert priority. Make stranded capabilities reachable first; continue money-migration only on engines that are (or become) reachable.

## 3. Prioritized roadmap (council verdict)

| Priority | Workstream | Why it serves the goal | Persona notes |
| --- | --- | --- | --- |
| **P0** | **Reachability program** — surface the 109 tested orphan engines via coherent product surfaces; remove the 2 dead ones. | Directly closes "I have to use another tool." Highest measured leverage. | Architect: dedupe overlapping engines (5 cube, multiple PDF/Excel) before building 109 pages. Release: feature-flag every newly surfaced engine (canary, §8). |
| **P1** | **Money migration — reachable-first.** Continue N-0009 but only on engines with a surface, so the precision benefits users. | "Zero flaw" where it's visible. | QA: each migration keeps its exactness/oracle test. |
| **P2** | **Omega infra** — OpenTelemetry tracer, fast-check expansion, Stryker mutation gate, SLO/error-budget. | Operational depth; does not by itself add a user capability. | Release: defer until P0 surfaces exist to instrument. |
| **P3** | **Process cleanup (N-0016)** — 424 markdown / stray `plan/`, `agents/`, `prompt/`, `.codex` dirs. | Onboarding & "all-in-one" credibility. | Architect: archive, don't delete, behind a single `docs/`. |

**The one hard open item (unchanged):** N-0010 — the audit chain (old **and** new event-ledger) is tamper-*evident*, not keyed. Closing it needs an external key sink — an architecture decision, not a batch.

## 4. Definition of done for the goal

- Reachability ≥ 90% of *valued* engines (after dedupe), each backed by an exactness/oracle test.
- 0 dead orphan engines (the 2 removed or tested).
- Money primitive on every reachable financial path; `toFixed` ratchet at 0 on reachable code.
- Every newly surfaced engine canary-flagged and verified end-to-end.

## 5. Next batches (sequenced)

- **BATCH-005 — Reachability triage.** Classify the 109 orphans by domain, dedupe overlapping clusters, output a value-tiered wire backlog. *(evidence for the whole program)*
- **BATCH-006 — First surface.** Wire the top-valued orphan treasury engine to a real page, feature-flagged (canary), with an end-to-end test. *(proof-of-pattern)*
- **BATCH-007 — Dead-code removal.** Remove or test the 2 untested orphans. *(smallest, ships fast)*

The council resumes autonomous execution at BATCH-005.

---

## 6. BATCH-005 — Reachability triage (executed)

Clustering the 109 tested orphans by domain (via `scripts/engine-reachability.mjs --json`):

| Tier | Cluster | Count | Action |
| --- | --- | --- | --- |
| **1 — wire first** | Treasury (CapEx, Cash, CashFlowWaterfall, DebtSchedule, Depreciation, FairValue, Lease, LoanAmortization) | 8 | Surface; Loan & Depreciation already money-migrated → precision-ready |
| **1** | Budget/Forecast/Scenario (BudgetCollection, ForecastMethod, ForecastReconciliation, RollingForecast) | 4 | Surface — core planning |
| **1** | ConsolidationAdjustments · Tax · VarianceAttribution | 3 | Surface — core FP&A |
| **2 — dedupe then surface** | Export/Document (PDF/Excel variants) | 17 | Consolidate overlapping PDF/Excel engines first |
| **3** | Data/OLAP/Cube/ETL (10) · Industry verticals (4) | 14 | Power-user / sector depth |
| **4 — investigate** | Spreadsheet/cell internals (9) · Infra/UI-builders (13) | 22 | Likely plumbing, not user features — confirm |
| — | Other (long tail) | 41 | Triage into the above |

**First wire target (BATCH-006):** a Tier-1 treasury engine that is precision-ready and table-renderable — **LoanAmortizationEngine** (money-migrated, clean `schedule()` → amortization table). Feature-flagged canary + end-to-end test. This proves the reachability pattern and immediately gives users a working loan-amortization tool.

**BATCH-005 verdict:** MERGED — the program now has a measured, value-tiered backlog instead of guesswork.
