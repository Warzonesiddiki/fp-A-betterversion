# Product Requirements Document — FinPlan Pro Enterprise Decision System

> **Status:** APPROVED HYPOTHESIS PRD — Gate G2 approved by owner on 2026-08-10; re-baselined 2026-08-10 (YOLO mode); primary validation remains mandatory
> **BMAD phase:** 2 — Planning & Requirements complete
> **Depends on:** approved hypothesis Product Brief (G1), `_bmad/research/research-report.md`, `_bmad/research/assumption-registry.md`, `_bmad/research/research-to-requirements-traceability.md`, `_bmad/project-context.md`, `docs/CAPABILITY_TRUTH_MATRIX.md`
> **Scope:** First enterprise release hypothesis plus sequenced capability boundaries. This is not authorization to implement.

> **v2.1 rebaseline notes (2026-08-10):** No requirement, epic, story, NFR, or acceptance criterion changed. Evidence additions are environmental/technical only (E-004 verification, E-005 CI billing block). F-01 (capability governance) is QA-approved; F-02 remains IN PROGRESS (pixel baseline blocked). All epics remain research-backed hypotheses requiring primary validation.

---

## 1. Executive summary

FinPlan Pro will evolve from a broad local-first FP&A application into a trusted financial decision system. The first enterprise release solves one connected operating loop: **ingest actuals → validate/reconcile → close/certify → plan/reforecast → decide/assign → report/publish → drill to evidence.**

The product must be exceptional for CFOs, FP&A analysts, controllers, budget owners, admins, and auditors. It must not market route/component/engine breadth as enterprise readiness. Every supported workflow has an explicit data authority, permission policy, lifecycle, audit record, performance budget, accessibility behavior, operational runbook, and acceptance evidence.

## 1.1 Research traceability and hypothesis boundaries

| Requirement group | Research basis | Status |
|---|---|---|
| Controlled close, reconciliation, immutable report evidence | R-03; controlled-close and reporting contracts | Research-backed hypothesis; requires controller/CFO validation |
| Materiality-first Decision Workspace | R-04, A-03; executive-workspace brainstorm | Research-backed hypothesis; requires CFO usability validation |
| Analyst Model Workspace | R-01, R-05; model-workspace contract | Research-backed hypothesis; requires analyst task validation |
| Hybrid Workspace + Control Plane | A-02; owner direction E-001 | Owner-directed hypothesis; requires IT/security validation |
| Enterprise multi-stakeholder buyer | A-13/A-14; owner direction E-001 | Owner-directed hypothesis; requires buyer/procurement validation |
| Cited, supervised AI | R-02/R-03; AI governance contract | Research-backed risk posture; requires use-case/provider validation |

All scope, NFR, and acceptance criteria below are hypotheses until primary evidence changes the relevant assumption status. `docs/CAPABILITY_TRUTH_MATRIX.md` remains the implementation evidence source; it is not proof of product-market fit.

## 2. Goals and measurable success metrics

| ID | Goal | Measurable success metric | Target | Measurement owner |
|---|---|---|---:|---|
| G-01 | Deliver trusted financial decisions | Published report values with complete source/version/calculation/FX/actor drill-through | 100% | Finance platform |
| G-02 | Reduce finance decision friction | Moderated critical-task completion: decision, plan edit, reconciliation, approval, report review | ≥95% median | Product/UX |
| G-03 | Support controlled close | Reference close control script completed without undocumented workaround | 100% | Controller domain lead |
| G-04 | Preserve financial authority | Cross-tenant/entity/policy negative authorization test pass rate | 100% | Security |
| G-05 | Deliver analyst speed | Budget/model workspace usable at reference workload | p95 ≤3 sec | Engineering/SRE |
| G-06 | Deliver executive speed | Context/page transition at reference workload | p95 ≤2 sec | Engineering/SRE |
| G-07 | Operate recoverably | Restore drill meets approved initial RPO/RTO | RPO ≤15 min; RTO ≤4 h | SRE |
| G-08 | Keep claims truthful | Supported enterprise capability claims linked to truth-matrix evidence | 100% | Product |

**Reference workload [ASSUMPTION]:** 20 entities, 5 years actuals, 2m GL rows, 50 concurrent planners, 250k planning cells. A signed customer workload profile replaces this assumption before pilot.

## 3. Personas and outcomes

| Persona | Primary outcome | Primary surfaces | Authority boundary |
|---|---|---|---|
| CFO | Make and communicate material decisions with confidence | Decision Workspace, Board Pack | May approve/certify according to policy; never bypass evidence/SoD |
| VP FP&A | Run the planning cadence and forecast | Planning Command Center, models, scenarios | Owns plans and workflow configuration within scope |
| FP&A analyst | Model, explain, and submit | Analyst Model Workspace, variance review | Draft/edit within policy; cannot self-approve restricted changes |
| Controller | Complete reconciled, controlled close | Close Cockpit, reconciliation, certification | Period/close authority only as delegated by policy |
| Budget owner | Provide accountable input | My Work, scoped model view | Scope-limited inputs and attestation |
| Admin/data owner | Maintain safe, healthy data operations | Admin, integration health, mappings | No implicit access to financial values beyond assigned scope |
| Auditor | Independently inspect evidence | Evidence Room, audit export | Read-only, time-scoped, no mutation |

## 4. Scope boundary

### In scope: Enterprise Release 1

1. Five-pillar shell, global context, command palette, trust state system, and canonical finance page layouts.
2. Authoritative tenancy/identity/authorization/audit foundation for official data and actions.
3. Master data and period lifecycle required by the vertical slice.
4. Controlled actuals import with mapping, validation, data-quality quarantine, retry/reconciliation evidence.
5. Close Cockpit, reconciliation, period lock, certification, exception/evidence workflow.
6. Plan/forecast version lifecycle, drivers, assumptions, analyst grid, scenario comparison, approval.
7. Published financial reports: P&L, balance sheet, cash flow, BvA, variance review, management/board pack snapshot with drill-through.
8. One demand-led production connector plus robust CSV/XLSX ingestion.
9. Minimum enterprise operations: observability, backup/restore, support bundle, error taxonomy, release/rollback process.

### Explicitly out of scope: Enterprise Release 1

- Autonomous AI financial actions or autonomous publishing.
- A universal report designer with no governance model.
- Simultaneous certification of every existing sector/industry route.
- Every ERP/HRIS/CRM connector.
- Big-bang rewrite of all frontend/server technology.
- Mobile editing parity for complex models.
- Direct use of local workspace state as authoritative official financial data.

## 5. Epics, user stories, and acceptance criteria

### Epic E1 — Product truth, navigation, and global context

**Objective:** The application is comprehensible as a finance operating system, not a route collection.

#### Story E1.1 — Five-pillar navigation
As any authorized user, I can see only the Workspace, Modeling, Close, Reporting, and Admin destinations permitted to me, so I understand where my job belongs.

- **AC1:** Navigation is permission-aware and exposes no inaccessible destination as an enabled action.
- **AC2:** Every existing route has a disposition in the capability matrix: retain, migrate, redirect, retire, or experimental.
- **AC3:** Navigation works by keyboard, supports collapsed/compact states, and has an accessible current-page indication.
- **AC4:** Legacy duplicate aliases redirect or are visibly marked experimental; they do not imply supported product breadth.

#### Story E1.2 — Global financial context
As a finance user, I can set organization/entity scope, period range, scenario/version, currency, and view mode once and understand exactly which page data will change.

- **AC1:** Context is visible on every canonical screen and serialized into a shareable/saved view without leaking unauthorized scope.
- **AC2:** Each context change shows affected dimensions and resets only incompatible page-local filters with explanation.
- **AC3:** Context data is policy-filtered server-side for official views.
- **AC4:** Offline/stale/queued/published states are distinguishable in text, icon, and accessible name.

#### Story E1.3 — Command and work surface
As a user, I can navigate, create permitted objects, find saved views, and act on assigned work with a keyboard-first command surface.

- **AC1:** Cmd/Ctrl+K is fully keyboard operable, permission filtered, and supports navigation, create, recent, and assigned action results.
- **AC2:** Sensitive financial query text is not emitted to general telemetry.
- **AC3:** My Work exposes owner, due date, workflow state, severity, and next permitted action.

### Epic E2 — Identity, tenancy, policy, and evidence

**Objective:** Official operations have authoritative, tenant-safe controls.

#### Story E2.1 — Enterprise identity and scoped access
As an administrator, I can manage SSO-backed membership, roles, entity scope, and access reviews, so data is restricted correctly.

- **AC1:** OIDC/SAML authentication and session lifecycle are documented and tested; dev/mock authentication is physically prevented in production deployment.
- **AC2:** Every official API command derives tenant and actor identity from trusted server authentication, not client input.
- **AC3:** Entity/cost-center/data-classification scope is enforced server-side and verified by negative tests.
- **AC4:** Access changes create audit events and support periodic review/export.

#### Story E2.2 — Immutable evidence
As an auditor, I can reconstruct official changes and published figures without depending on mutable client data.

- **AC1:** Every official command emits actor, tenant, authorization context, correlation ID, before/after secure diff, lifecycle state, timestamp, and evidence reference.
- **AC2:** Audit data is append-only in the authoritative service and exported/retained in a protected immutable sink.
- **AC3:** UI evidence drill-through respects current user's authorization scope.
- **AC4:** Tamper, privilege escalation, and missing-audit-event negative tests block release.

### Epic E3 — Master data and actuals ingestion

**Objective:** Finance begins with controlled, explainable actuals.

#### Story E3.1 — Governed master data
As a data owner, I can manage entities, hierarchy, COA, cost centers, calendars, and currencies with effective dates and controlled change history.

- **AC1:** Master data changes are validated, versioned/effective-dated where applicable, policy-authorized, and auditable.
- **AC2:** Fiscal calendars support non-January year end, adjustment periods, and configured periodicity.
- **AC3:** Financial dimensions cannot be deleted when referenced; retirement/replacement policy is enforced.

#### Story E3.2 — Import, map, validate, recover
As a data owner, I can import files/connector data, preview mappings, quarantine invalid records, correct failures, and safely retry.

- **AC1:** Import is idempotent and records source, mapping version, file/artifact hash, row outcomes, actor, timestamps, and reconciliation results.
- **AC2:** Validation includes schema, required dimensions, dates/periods, currency, debit/credit balance, duplicates, and reference integrity.
- **AC3:** Failed rows are quarantined with actionable reason and correction/retry path; no silent coercion occurs.
- **AC4:** A completed import produces an evidence report reconciled to source control totals.

### Epic E4 — Close and consolidation control loop

**Objective:** A controller can complete a safe, visible close.

#### Story E4.1 — Close Cockpit
As a controller, I can see every close task, dependency, owner, SLA, evidence requirement, exception, and blocking condition.

- **AC1:** Checklist status is derived from controls, not manually painted progress.
- **AC2:** A critical failed control blocks close advancement unless an authorized exception includes rationale, approver, expiry, and audit trail.
- **AC3:** Every task supports evidence attachment/link, comments, delegation/escalation policy, and notification history.

#### Story E4.2 — Reconciliation and certification
As a controller, I can reconcile balances, review unmatched items, certify results, and lock a period.

- **AC1:** Reconciliation exposes source/target, tolerance, difference, freshness, matched/unmatched counts, and drill-through.
- **AC2:** Certification captures attester, role, scope, evidence, time, and policy version.
- **AC3:** Locked periods reject unauthorized edits at authoritative service boundary; authorized adjustments use a distinct lifecycle and reversal history.

#### Story E4.3 — Consolidation
As a consolidation manager, I can run reproducible multi-entity consolidation with ownership, FX, eliminations, validation, and immutable inputs.

- **AC1:** Each run freezes input version IDs, rules, ownership, FX source/rate/type, execution version, actor, output, and validation result.
- **AC2:** Intercompany mismatches and elimination exceptions are surfaced as assigned work before certification.
- **AC3:** A rerun cannot overwrite a published result; it creates a new run/version.

### Epic E5 — Planning, forecasting, and analyst modeling

**Objective:** Analysts gain spreadsheet-level speed without losing model governance.

#### Story E5.1 — Model lifecycle
As an FP&A lead, I can create, branch, review, approve, lock, and supersede plan/forecast versions with explicit lineage.

- **AC1:** Every version names its base, owner, dimensions, calendar, assumptions, and lifecycle state.
- **AC2:** Approval and lock behavior are server enforced; locked data cannot be modified through API, UI, import, or offline replay.
- **AC3:** Comparison shows selected versions/scenarios, context, material deltas, and source lineage.

#### Story E5.2 — Analyst Model Workspace
As an analyst, I can edit a permitted grid quickly and safely using formulas, paste, fill, undo/redo, comments, filtering, hierarchy, and drill-through.

- **AC1:** Formula entry, validation error, calculated/manual state, dependencies, audit/history, comments, lock state, and conflict state are discoverable from selection inspector.
- **AC2:** Keyboard navigation, copy/paste, bulk edit, undo/redo, freeze panes, and accessible focus semantics have E2E coverage.
- **AC3:** Changes have base revision/idempotency semantics; conflicts never silently use last-write-wins for official financial facts.
- **AC4:** The reference grid meets p95 usable-state performance budget.

#### Story E5.3 — Drivers, assumptions, scenarios, and rolling forecast
As an FP&A lead, I can define governed assumptions/drivers, assess scenarios, and publish a rolling forecast.

- **AC1:** Assumption/driver source, owner, effective period, dependency graph, approval, and impact are visible.
- **AC2:** Scenario is explicitly based on a version and preserves adjustment reason/value and comparison context.
- **AC3:** Forecast snapshots are immutable; actuals updates produce a new run/version, never mutate a published snapshot.

### Epic E6 — Decision Workspace and accountability

**Objective:** CFOs move from material signal to accountable response without an export.

#### Story E6.1 — Materiality-first workspace
As a CFO, I see the most material changes against a named baseline, their drivers, data freshness, owner, and recommended next action.

- **AC1:** Every KPI/chart has period, comparison, currency, rounding, freshness, source/definition, and drill-through.
- **AC2:** Variances rank by configurable materiality and distinguish favorable/unfavorable logic by metric semantics.
- **AC3:** No card may present an official conclusion without an evidence path.

#### Story E6.2 — Decision/action loop
As a finance leader, I can assign, request explanation, create scenario, escalate, or approve a response from a variance/evidence context.

- **AC1:** Action is scoped to the financial object/context and creates a task/workflow/audit event.
- **AC2:** Assignee sees actionable instructions, due date, evidence, and allowed actions in My Work.
- **AC3:** Completed action links back to decision, report, and evidence history.

### Epic E7 — Governed reporting and board communication

**Objective:** Published communication is reproducible, not a disposable dashboard.

#### Story E7.1 — Semantic metrics and report definitions
As a report author, I can use certified metric definitions and controlled report templates.

- **AC1:** Metric definition includes owner, formula/version, dimensions, currency/rounding, permitted use, and certification state.
- **AC2:** Report definition records sources, filters, formatting, author, review, version, and lifecycle.
- **AC3:** Report changes follow policy and cannot silently alter a published snapshot.

#### Story E7.2 — Snapshot, board pack, and export
As a CFO, I can publish a board pack/report snapshot that retains context, evidence, status, and controlled distribution.

- **AC1:** Published snapshot is immutable and includes report definition/version, data/input versions, context, timestamp, publisher, and certification status.
- **AC2:** PDF/XLSX/CSV export retains required labels/watermarking and emits an audit event.
- **AC3:** Viewer supports drill-through according to recipient permission; unauthorized recipients see no inferred restricted data.

### Epic E8 — Operations, resilience, and support

**Objective:** The platform can be safely operated in production.

#### Story E8.1 — Observability and support
As an operator, I can detect, diagnose, and safely support failures without exposing secrets or financial content.

- **AC1:** Logs are structured/redacted; traces/metrics carry correlation IDs; financial payloads and secrets are excluded from general logs.
- **AC2:** Dashboard covers API/job/import/close/report SLOs, errors, queue health, sync failures, and security events.
- **AC3:** Customer-safe support bundle and incident runbooks exist for the core journeys.

#### Story E8.2 — Backup, restore, deployment
As an operator, I can deploy safely, roll back, and restore authoritative data.

- **AC1:** Migration/backward compatibility/rollback plan exists for each persistent schema change.
- **AC2:** Encrypted backup and quarterly restore drill meet approved RPO/RTO.
- **AC3:** Release is gated by security, test, accessibility, performance, dependency, and artifact provenance evidence.

### Epic E9 — Controlled AI and certified verticals (post-Release 1)

- AI is retrieval- and citation-based, policy aware, evaluated against finance question sets, and requires confirmation/workflow for any write action.
- A vertical pack earns support status only with metric dictionary, templates, mappings, reports, data-quality controls, demo/reference data, user guidance, and domain-owner sign-off.

## 6. Non-functional requirements

| ID | Requirement | Release criterion |
|---|---|---|
| NFR-01 | Accessibility | WCAG 2.2 AA for canonical screens; keyboard-only and screen-reader journeys tested manually and automatically. |
| NFR-02 | Financial integrity | Decimal-safe server/client calculations; ISO currency rounding; no official float-only result; reconciliations exact within explicit configured tolerance. |
| NFR-03 | Security | OWASP-aligned protections, secret scanning, SBOM, dependency/container scan, TLS, encryption, tenant/entity authorization negative tests, threat model review. |
| NFR-04 | Privacy | Data classification, retention, DSR process, regional/residency decision, redacted telemetry/logging, provider controls for AI. |
| NFR-05 | Performance | Metrics G-05/G-06 plus report p95 ≤5s simple, ≤30s complex; API p95 ≤200ms excluding async workloads. |
| NFR-06 | Availability | ≥99.9% control-plane target after GA; error budget and documented degradation mode. |
| NFR-07 | Resilience | RPO/RTO G-07; idempotent commands/imports; tested retries; no silent data loss on interruption. |
| NFR-08 | Compatibility | Supported browsers/desktop OS matrix approved before pilot; responsive behavior designed for desktop, compact desktop, tablet; mobile complex editing explicitly deferred. |
| NFR-09 | Observability | Traceable request/job IDs, SLO dashboard, alert/runbook, redacted logs, business-event telemetry. |
| NFR-10 | Maintainability | TypeScript strict; defined API/schema versioning; ADRs; test pyramid; feature flags; no unowned shared component or metric. |

## 7. Release definition

A capability is in **Release 1** only if it completes a supported core journey with all acceptance criteria and relevant NFR evidence. A page, engine, route, sector, connector, chart, or AI action lacking evidence remains **Built**, **Partially wired**, or **Experimental** in `docs/CAPABILITY_TRUTH_MATRIX.md` and is not included in commercial claims.

## 8. Risks, conflicts, and mitigations

| Risk/conflict | Decision or mitigation |
|---|---|
| Existing rich route inventory vs. clean five-pillar IA | Treat all existing routes as migration candidates; do not promise migration parity. Matrix disposition is required. |
| Desktop/local-first vs. enterprise authority | Workspace supports drafts/offline use; authoritative server governs official operations. |
| Browser/PWA claims vs. current Tauri-only gate | Browser support is an explicit verified work item; no readiness claim until test evidence exists. |
| $500k goal vs. broad unsupported vertical scope | Sell a supported core plus certified vertical packs, implementation, and SLA—not vanity feature count. |
| AI demand vs. finance risk | AI assistant/supervised action only after data/permission/evaluation controls. |
| Current client/server mismatch | Architecture phase will define incremental target and migration; PRD forbids big-bang assumption. |

## 9. Open decisions and assumptions

- [ASSUMPTION] Hybrid deployment is the preferred direction, subject to architecture/security approval.
- [ASSUMPTION] Release 1 supports a controlled desktop-first experience with a browser/PWA path assessed explicitly.
- [OPEN DECISION] Primary buyer priority: CFO, VP FP&A, or Controller when needs conflict.
- [OPEN DECISION] Design partners, first vertical, and first connector.
- [OPEN DECISION] Managed cloud/customer-managed deployment and data residency requirements.
- [OPEN DECISION] Legal/commercial SLA, support hours, incident severity model, and implementation packaging.
- [OPEN DECISION] Regulatory certifications in first 12 months.

## 10. Glossary

| Term | Definition |
|---|---|
| Actuals | Recorded financial outcomes imported/posted for a fiscal period. |
| Authoritative | Enforced, versioned, audited server-side state used for official operations. |
| BvA | Budget versus Actual comparison. |
| Certification | Attestation that a scoped control/result has been reviewed under policy. |
| Connected | Maturity where real data/contract and journey state handling are evidenced. |
| Consolidation | Combining entity results using ownership, FX, and elimination rules. |
| Evidence | Reproducible source, version, actor, policy, and validation information behind a financial result. |
| Governed | Maturity where policy, authorization, audit, tenant scope, and lifecycle are evidenced. |
| Materiality | Configured significance threshold/ranking for finance decisions. |
| RLS | Database row-level security enforcing scoped access. |
| SoD | Segregation of duties; a user cannot perform conflicting controlled actions. |

## 11. Gate G2 decision

**Approve, request changes, or reject this PRD.** Approval authorizes Phase 3 architecture only after the UX specification has separately passed Gate G3. It does not authorize implementation.
