# Research → Requirement → Architecture Traceability Matrix

> **Status:** ACTIVE · **Version:** 2.0 (rebaselined 2026-08-10, YOLO mode) · **Purpose:** Enforce BMAD v4 Q1: no orphaned decisions. This records the current hypothesis chain and makes missing evidence explicit.

## v2.0 rebaseline notes

- Added R-06 (technical verification evidence) and R-07 (CI billing-block environmental finding) to the finding table.
- Safe-foundation rows F-01/F-02 recorded as completed-with-evidence (capability governance QA-approved; Atlas structural/a11y baselines + browser pixel baseline 2026-08-12). Market rows unchanged.
- All market/economic/deployment rows remain UNVALIDATED; E-004/E-005 do not change their status.

## Finding identifiers

| ID   | Finding / assumption                                                                                                                     | Source                                     | Confidence           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------- |
| R-01 | Enterprise FP&A competitors converge on connected, governed planning/close/reporting.                                                    | research report, public competitor sources | Medium               |
| R-02 | AI finance adoption/trust is immature; assisted/cited use is safer than autonomous action.                                               | research report / public survey signal     | Medium               |
| R-03 | Finance credibility requires authoritative evidence, reconciliation, and immutable reporting.                                            | research report + control research         | High                 |
| R-04 | Generic KPI dashboards do not demonstrate a decision/action loop.                                                                        | codebase audit + UX hypothesis             | Medium               |
| R-05 | Existing codebase breadth does not establish connected/governed/readiness maturity.                                                      | capability matrix                          | High                 |
| R-06 | Merged main passes full local verification: 1,179 files / 13,315 tests, tsc 0 errors, lint 0 warnings, build + audit pass.               | session verification runs (E-004)          | High (technical)     |
| R-07 | GitHub Actions jobs fail before starting due to account billing/spending-limit block; repo-wide, predates PR #53; not a code regression. | GitHub check-run annotations (E-005)       | High (environmental) |
| A-01 | $500k+ willingness-to-pay is viable.                                                                                                     | assumption registry                        | Low / unvalidated    |
| A-02 | Local-first/hybrid is a buyer differentiator.                                                                                            | assumption registry                        | Low / unvalidated    |
| A-03 | Close-to-decision-to-board-pack is the best strategic wedge.                                                                             | brainstorm + registry                      | Low / unvalidated    |
| A-13 | Enterprise multi-entity ICP is optimal (owner-directed).                                                                                 | assumption registry                        | Low / unvalidated    |

## Traceability matrix

| Product requirement hypothesis                      | Research basis | Contract / architecture implication                                    | Validation required before commitment                   |
| --------------------------------------------------- | -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Five-pillar navigation and global financial context | R-04, R-05     | Atlas shell + typed FinancialContext                                   | IA tree test and user task study                        |
| Materiality-first Decision Workspace                | R-04, A-03     | MaterialityPolicy, DecisionCase, evidence/task APIs                    | CFO comparative prototype and real variance walkthrough |
| Analyst Model Workspace                             | R-01, R-05     | versioned cell commands, conflict/outbox, formula/lineage inspector    | analyst observation and keyboard/paste task study       |
| Controlled import/reconciliation                    | R-03, R-05     | staging, mapping, validation, quarantine, reconciliation               | sample extract and data-owner workflow validation       |
| Close/Cockpit/certification/lock                    | R-03, A-03     | CloseCycle, reconciliation, exception, certification, lock policy      | controller close simulation and audit review            |
| Snapshot board pack/reporting                       | R-03, A-03     | metric/report/snapshot/distribution artifacts                          | CFO/board-prep evidence retrieval task                  |
| Hybrid local workspace plus control plane           | A-02, R-03     | command outbox, server authority, entitlement/audit                    | IT/security architecture review and offline test        |
| Cited supervised AI                                 | R-02, R-03     | tenant policy, retrieval filter, citations, tool approvals, evaluation | finance task evaluation + privacy/provider review       |
| Consolidation/FX/IC                                 | R-01, R-03     | frozen run/version/rule/FX contract                                    | target-vertical/domain-expert validation                |
| Premium package / vertical certification            | A-01, A-13     | implementation, support, commercial evidence model                     | paid pilot/LOI and WTP evidence                         |

## Decision classification

- **Safe foundation decisions:** maintain truth matrix, precision/audit controls, design-system accessibility, source/test evidence discipline. These are supported by direct code/control need. Completed to date: F-01 capability evidence governance (QA APPROVED); **F-02 Atlas foundation DONE / QA APPROVED 2026-08-12** — structural/a11y baselines (empty + populated Dashboard; real heading-order defect fixed) plus the browser pixel baseline (`tests/e2e/atlas-visual.spec.ts` 5/5, 11 committed PNGs; ledger #33) and the P0 storage hydration fix it surfaced (ledger #32, evidence E-018).
- **Hypothesis decisions:** ICP, price point, local-first differentiation, first connector/vertical, materiality defaults, deployment pattern. Do not hard-code or market without validation.
- **Deferred decisions:** Graph database, Kafka, multi-database analytics, autonomous AI, broad vertical parity. No evidence currently justifies early commitment.

## Downstream artifact update protocol

1. Evidence log records a new primary evidence item.
2. Assumption registry changes status only with linked evidence IDs.
3. This matrix is updated with confidence and implications.
4. Product Brief, PRD, UX, architecture, and stories are revised only for affected rows.
5. Capability Truth Matrix is updated only when implementation evidence exists.

## Coverage audit

Every current research contract is traceable to R-01–R-05 and/or an explicit assumption. Any future requirement without a row here is blocked until it has research evidence or an [ASSUMPTION] with validation plan.
