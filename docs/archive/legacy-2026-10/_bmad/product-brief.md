# Product Brief — FinPlan Pro, Research-Informed v2

> **Version:** 2.3 · **Status:** APPROVED HYPOTHESIS BRIEF — Gate G1 approved by owner on 2026-08-10; re-baselined 2026-08-10 (YOLO mode); **BMAD v5.0 re-certified 2026-08-10** (restart Step 2, see `_bmad/v5-restart-2026-08-10.md`) · **Phase:** BMAD v5 Discovery complete
> **Inputs:** approved Phase 0 hypothesis baseline, `_bmad/research/assumption-registry.md`, `_bmad/research/validation-plan.md`, `_bmad/research/owner-direction-record-2026-08-10.md`, `_bmad/brainstorm/session-strategic-wedge-2026-08-10.md`

> **v2.2 rebaseline notes (2026-08-10):** No thesis, scope, or success-criteria change. Merged delivery (PR #53) verified; full-suite/type/lint/build/audit verification recorded (E-004); CI red explained as account billing block (E-005); F-02 pixel baseline still blocked. All market claims remain hypothesis-level. See §2 evidence table below.

## 1. Product thesis

FinPlan Pro will help finance leaders turn a material financial signal into a controlled, evidence-backed decision without relying on untraceable spreadsheets, exports, and approval chasing.

The initial product hypothesis is not “all-in-one FP&A.” It is a **controlled close-to-decision-to-board-pack operating loop**:

1. ingest/validate actuals;
2. reconcile and certify close controls;
3. model forecast/variance with governed assumptions;
4. expose material changes, evidence, and accountable actions;
5. publish an immutable, evidence-backed management or board snapshot.

## 2. Evidence and assumptions

| Claim                                                         | Evidence source                                  | Confidence | Required validation                     |
| ------------------------------------------------------------- | ------------------------------------------------ | ---------- | --------------------------------------- |
| Finance teams need trusted connected planning/close workflows | Phase 0 category research and competitor signals | Medium     | primary workflow observation            |
| Generic dashboards do not solve executive decision work       | codebase audit + UX hypothesis                   | Medium     | CFO comparative prototype test          |
| Control/evidence is central to enterprise credibility         | competitor/security research                     | High       | controller/auditor interviews           |
| Local-first/hybrid may differentiate                          | strategic hypothesis only                        | Low        | IT/security and buyer research          |
| $500k+ price point is viable                                  | no direct evidence yet                           | Low        | WTP interviews, paid design partner/LOI |

## 3. Initial target customer hypothesis

[ASSUMPTION A-13] Enterprise, multi-entity organizations with a multi-stakeholder buying committee (CFO/finance leadership, controller, FP&A, IT/security, and procurement) are the intended initial segment. This is owner direction, not market validation. The initial vertical and exact entity/user scale remain undecided until enterprise research evidence is collected.

## 4. Users and jobs

| User               | Job                                                       | Required product outcome                                             |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------------------------- |
| CFO / VP Finance   | Decide where to intervene and communicate a trusted story | materiality, cash/forecast context, evidence, owner, next action     |
| Controller         | Close safely and demonstrate control                      | reconciliation, certification, exceptions, lock, audit evidence      |
| FP&A analyst       | Update plan/forecast and explain why                      | keyboard-grade model workflow, formulas, versions, lineage, workflow |
| Budget owner       | Provide accountable input                                 | scoped task, guidance, validation, due date, approval state          |
| Data owner / admin | Keep inputs secure and current                            | mapping, quality checks, retry/reconcile, health, access controls    |
| Auditor            | Reconstruct official result/change                        | scoped immutable evidence and export                                 |

## 5. In-scope release hypothesis

- FinPlan Atlas shell with financial context and explicit trust states.
- Authoritative identity, tenant/entity scope, audit evidence, master data, fiscal period control.
- Controlled CSV/XLSX ingestion plus one validated demand-led connector.
- Reconciliation, close checklist, exception/certification, and lock.
- Plan/forecast version lifecycle and analyst workspace.
- Decision Workspace with evidence/action loop.
- Governed statements/BvA/variance/board-pack snapshots.
- Observability, backup/restore, security evidence, pilot support.

## 6. Explicitly out of scope until evidence changes

- Broad sector parity or marketing all routes as supported.
- Autonomous AI write/publish actions.
- Generic dashboard builder as primary experience.
- Big-bang technology rewrite.
- Full mobile model-editing parity.
- Treating client-local data as official financial authority.

## 7. Success criteria

| Horizon               | Evidence of success                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Research (30–60 days) | validation-plan thresholds achieved or strategic pivot documented                                                 |
| Pilot                 | one customer-shaped close-to-board-pack loop completes with traceable evidence and no critical control workaround |
| Product               | ≥95% moderated completion for decision, reconciliation, plan edit, approval, and report-evidence tasks            |
| Trust                 | 100% published values drill to permitted source/version/calculation/actor evidence                                |
| Economics             | paid pilot/LOI and validated packaging before $500k+ public claim                                                 |

## 8. Risks and boundaries

- The biggest failure mode is building a polished feature catalog without validated economic urgency.
- The second is making local-first a product religion rather than a customer-proven deployment advantage.
- The third is AI overreach that weakens finance trust.
- The product will never hide data freshness, lifecycle, scope, or evidence status behind generic UI.

## 9. Open questions

1. Which buyer has economic authority and which user is the daily champion?
2. Which connector/system must be first for paid pilot value?
3. Is hybrid/local-first permitted and desired by target IT/security teams?
4. Which first vertical has the best pain, data accessibility, and sales path?
5. What packaging, implementation, and SLA make premium pricing credible?

## 10. Discovery next action

Execute `_bmad/research/validation-plan.md`. Update the assumption registry after every evidence-bearing session. Only then rebaseline PRD, UX, architecture, and delivery stories.
