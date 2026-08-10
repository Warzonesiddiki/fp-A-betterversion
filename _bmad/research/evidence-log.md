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
| E-004 | 2026-08-10 | Technical verification (not customer evidence) | Merged main `f3834e2` + session branch `b146dc8` (F-03/F-04 + governance hardening) | Full suite **1,184 files / 13,333 tests passed** (1 skipped; incl. F-03/F-04 suites and extended Atlas structural baseline); `tsc --noEmit` 0 errors (root + server); full-src ESLint 0 warnings; production build (tsc + eslint + vite + PWA) passed; a11y gate suite 10 files / 448 tests passed; capability inventory deterministic; docs-truth passed; `npm audit --omit=dev` 0 vulnerabilities; governance scripts green (architecture guardrails, compliance evidence 22/22, hygiene, license, export, money, mock-data); `git diff --check` clean. | A-05 (health only) | Supports foundation quality; does **not** validate market/buyer/deployment assumptions | Technical / high | None — repeat verification after each code change |
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
