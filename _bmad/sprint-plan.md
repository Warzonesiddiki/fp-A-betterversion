# FinPlan Pro — Research-Informed Delivery Plan

> **Version:** 2.2 · **Status:** APPROVED HYPOTHESIS DELIVERY PLAN — Gate G5 approved by owner on 2026-08-10; re-baselined 2026-08-10 (YOLO mode); **BMAD v5.0 re-certified 2026-08-10** (restart Step 5, see `_bmad/v5-restart-2026-08-10.md`)
> **Inputs:** G0–G4 approved hypothesis artifacts, traceability matrix, assumption registry, capability truth matrix
> **Rule:** No implementation story may turn an unvalidated market/user/deployment assumption into an irreversible product commitment.

## Current execution status (2026-08-10, v2.1)

| Track | Item | Status | Evidence / blocker |
|---|---|---|---|
| R | R-01 Recruit enterprise sample | IN PROGRESS | Operations prepared; externally blocked — no participants/anonymized notes yet; nothing fabricated |
| R | R-02–R-04 | BLOCKED | Require R-01 evidence |
| F | F-01 Capability evidence governance | DONE / QA APPROVED | 0 unresolved route source mappings; QA report filed |
| F | F-02 Atlas foundation | IN PROGRESS / QA REJECTED | Structural baselines + a11y pass (empty + populated); pixel baseline blocked by Playwright TLS download; verdict unchanged |
| F | F-03 Context/trust-state shell | DONE / QA APPROVED | `_bmad/stories/story-f03-financial-context-shell.md`; QA report in `_bmad/qa/` |
| F | F-04 Control-plane contract spike | DONE / QA APPROVED (spike only) | `_bmad/stories/story-f04-control-plane-contract-spike.md`; QA report in `_bmad/qa/` |
| P | P-01…P-07 | BLOCKED | Require R-04 pilot slice selection |
| — | CI on GitHub | RED — account billing block | Owner must resolve Billing & plans; not a code regression (E-005) |
| — | Local verification | PASS | 1,179 files / 13,315 tests; tsc/lint/build/audit green (E-004) |

## Delivery strategy

The program runs two synchronized tracks:

1. **Evidence track:** validate high-risk market, workflow, security, and commercial assumptions with enterprise participants.
2. **Safe foundation track:** improve truth labeling, accessibility, source/test maturity, and reusable UI/control primitives without pre-deciding ICP, connector, vertical, deployment, or workflow policy.

A pilot vertical slice begins only when the Evidence Track selects its first workflow/connector/vertical based on recorded evidence.

## Pack R — Research evidence and decision readiness

| Order | Story | Why / research trace | Prerequisite | Completion evidence |
|---:|---|---|---|---|
| R-01 | Recruit enterprise buying-committee sample | A-01, A-02, A-03, A-13, A-14 | G5 | participant quota and consent evidence |
| R-02 | Run role-based workflow sessions | validation plan, usability plan | R-01 | anonymized notes + Evidence Log entries |
| R-03 | Synthesize evidence and update assumptions | Q1/Q3 traceability rule | R-02 | validation/invalidations, contradictions, decision memo |
| R-04 | Select pilot workflow, vertical, connector, and deployment constraints | A-02/A-03/A-07/A-13 | R-03 | owner-approved pilot charter populated from evidence |

## Pack F — Safe foundations (may run only when they do not pre-decide R-04)

| Order | Story | Why / research trace | Existing artifact / code | Completion evidence |
|---:|---|---|---|---|
| F-01 | Capability truth disposition and evidence governance | R-05; Capability Truth Matrix | `docs/CAPABILITY_TRUTH_MATRIX.md` | route/module dispositions and evidence owner map |
| F-02 | Atlas foundations | R-04; Atlas contract | `src/index.css`, shared UI | accessible tokens, shared patterns, visual/a11y test baseline |
| F-03 | Context and trust-state shell | R-03/R-04; UX contract | layout/UI stores | global scope/freshness/lifecycle contract, no false authority state |
| F-04 | Control-plane contract spike | R-03/R-05; A-02/A-04 | `server/`, architecture | typed command/evidence/authorization feasibility evidence, no production migration claim |

## Pack P — Pilot vertical slice (blocked by R-04)

| Order | Story | Primary acceptance outcome |
|---:|---|---|
| P-01 | Authoritative master data and fiscal period | scoped/effective-dated data with policy/audit evidence |
| P-02 | Controlled import + reconciliation | source-to-posted evidence and quarantine/retry |
| P-03 | Close controls + certification + lock | controller completes agreed close control path |
| P-04 | Plan version + analyst workspace | analyst completes observed forecast workflow safely |
| P-05 | Materiality decision workspace | CFO identifies, verifies, assigns a material decision |
| P-06 | Report snapshot + board pack | published result reproduces and drills to permitted evidence |
| P-07 | Pilot operations/security certification | SLO/DR/authz/a11y/performance/pilot evidence pack |

## Existing implementation work

The prior Story 01 truth-inventory work and Atlas components are retained as **safe foundation evidence**, but Story 02 remains incomplete until its design-system adoption/visual/a11y requirements are independently verified. Existing old story files are historical proposals; they must be replaced or augmented with the research-contextualized template before code implementation.

## Gate G5 decision

Approve, request changes, or reject this research-informed delivery plan and its Pack R/F/P sequencing. Approval authorizes execution of **R-01** and only safe foundations that have a self-contained approved story.