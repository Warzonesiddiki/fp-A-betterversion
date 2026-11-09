# FinPlan Pro — High-Level Roadmap

**Status:** Proposed sequencing for owner review — 2026-11-04. This is a high-level index, not a date promise or capability claim. The detailed work packages, dependencies, risks, acceptance tests, evidence labels and owner questions live in [`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md).

**Scope:** DEC-033 establishes all FP&A as the ultimate product scope. DEC-104 accepts universal accounting/finance import using the user's own template system. The owner’s Dynamics 365 workflow is the first real-source proof, not a product boundary. The earlier 2026-10-16 Gate 0–6 roadmap is superseded as the *current sequence*; the accepted owner and technical decisions remain binding in [`decision-log.md`](decision-log.md). No accepted scope is silently removed by this reordering.

## Delivery principles

- **Hybrid ingestion:** user-mapped CSV/XLSX is the baseline for broad ERP reach; optional provider APIs feed the same canonical contract after prioritization and live validation.
- **One financial authority:** converge the existing GL upload parser/mapping profiles and universal template engine. No parallel parser, dual-write, or new persistence authority by convenience.
- **Evidence before claims:** synthetic test, integrated UI path, real source reconciliation, owner acceptance and production support are separate maturity steps.
- **Spine before breadth, not instead of breadth:** build in dependency order while keeping all-FP&A and all-industry scope visible. API connectors and industry packs are staged, not rejected.
- **Safe defaults:** ERP remains source/system of record; no write-back, external egress, cloud/multi-user deployment, or sector certification without an explicit decision and required controls.
- **No dates until approved:** estimates follow owner scope, sample availability and dependency review.

## Gates

### Gate 0 — Align product intent and review scope (current)

**Goal:** establish one shared interpretation of “one stop,” “any ERP,” user-customizable templates, all industries, and “perfect.”

- Align [`../VISION.md`](../VISION.md), this roadmap, the requirements register, connector architecture, agent instructions and current-state docs with the 2026-11-04 owner direction.
- Review the master product/execution proposal; preserve DEC-033 and DEC-104 and record any new owner rulings in the decision log.
- Confirm user roles and whether the current single-user/local-first decisions (DEC-004/103) meet the accounts-team correction workflow.
- Reconcile the completion register and generated capability matrix evidence for universal import.

**Exit:** owner comments/accepts the product interpretation and the highest-impact review questions in the master plan; conflicts are recorded as decisions, not implicit code.

### Gate 1 — One canonical user-configurable import contract

**Goal:** converge existing upload and universal-template paths into one understandable user journey.

- Audit all import callers, schemas, stores, mappings and validation behavior.
- Specify the canonical GL contract, source provenance, template schema/versioning, unknown-column behavior, duplicate/re-import policy and reconciliation controls.
- Make CSV/XLSX mappings reusable and previewable; ensure the template version used is recorded on each batch.
- Preserve whole-file atomic rejection (DEC-007), exact money, period guards and the current persistence authority until its migration gates pass.
- Test structurally different synthetic D365 and generic exports through one parser/validation path.

**Exit:** every row has an accepted/rejected outcome and reason; mapped sources produce independently verified controls; template save/reuse/versioning works end-to-end; one parser and one commit authority remain.

### Gate 2 — Real D365 source validation and trusted actuals

**Goal:** verify the owner’s D365 export shapes and establish one source-to-output financial spine.

- Obtain anonymized samples and source-side controls per shape; D365 F&O, Business Central and generic/trial-balance shapes have separate statuses.
- Validate scope, entity, currency, account/dimension mapping, totals, trial balance and report outputs against independent owner evidence.
- Tie source batch → ledger → trial balance → statements; preserve lineage and make close/period guards apply to every write path.
- If owner artifacts are unavailable, keep mappings available but mark the source shape unverified.

**Exit:** each advertised shape has reconciled sample evidence, safe re-import/rollback behavior and owner sign-off; no unexplained difference or missing input is hidden.

### Gate 3 — Complete the owner’s J2/J3/J4 workflow in-app

**Goal:** validate exception review, correction follow-through and detailed comparisons on the same real supported cycle.

- Build/accept owner-labeled exception examples and validate findings as human-review candidates.
- Validate correction instructions, assignment, history and source-entry re-verification with the accounts team; no automatic ERP posting.
- Confirm day/month/year comparison definitions, all-difference visibility, signs, currencies, zero denominators, missing periods and source drill-through.
- Measure usability and remove mandatory spreadsheet/app round-trips from the supported journey; exports remain optional interoperability (DEC-035).

**Exit:** the owner and accounts team complete the supported review cycle with traceable evidence and accept its limitations. A routed page or mock test alone does not close the gate.

### Gate 4 — Prioritized API connectors and broader FP&A capabilities

**Goal:** add high-value provider-specific convenience and broaden finance workflows on the trusted spine.

- Prioritize connectors by actual ERP usage, data-object completeness, API access, licensing/security, test environment and support cost.
- Validate credentials/scopes, paging/cursors, changed/removed rows, retries, idempotency, source totals and live sandbox behavior per provider.
- Distinguish GL feeds from bank/payment/CRM/operational data; a connection or catalog flag is not accounting certification.
- Rank all-FP&A requirements—planning, forecast, scenario, consolidation, reporting, operational metrics—by user value and prerequisites. Keep missing operational inputs unavailable, not invented.

**Exit:** each provider/capability has an explicit source scope, owner acceptance and evidence tier; no generic “all ERP” claim follows from connector count.

### Gate 5 — Configurable industry packs

**Goal:** extend the shared FP&A core across prioritized industries without creating code forks or false certification.

- Confirm target industry/jurisdiction with owner and domain reviewer (O5 currently certifies none).
- Define pack versioning, dimensions, account mappings, fiscal/reporting conventions, metrics and input prerequisites, exception rules, planning drivers and reports.
- Test known answers and missing-input behavior; preserve shared money, period, audit, security and import logic.
- Label each pack experimental until representative evidence and domain review are complete.

**Exit:** a second industry uses the same core financial contract; pack-specific formulas, source prerequisites and exclusions have owner/domain acceptance.

### Gate 6 — Deployment, pilot, release and improvement

**Goal:** match the team’s real collaboration/security needs and release only a recoverable, supportable workflow.

- Resolve local single-user vs shared-team deployment, data residency/egress, secrets, retention, backups and recovery before adding infrastructure.
- Rehearse native desktop, security, accessibility, performance, migration/rollback, operations and incident controls for the chosen deployment.
- Run an owner-approved parallel pilot against the existing manual process; reconcile outputs and measure time, data gaps, correction turnaround and exception usefulness.
- Publish supported-scope statements by provider, shape, industry and workflow; keep limitations visible and re-plan from user evidence.

**Exit:** all scoped release criteria in the master plan pass and the owner accepts residual risk and rollback. No release or “production-supported” claim is inferred from automated tests alone.

## Active dependencies and blockers

| Item | Status / owner | What it blocks |
|---|---|---|
| Universal importer convergence | Code paths exist separately; UI integration and evidence wording need reconciliation. | A single user-facing universal-template claim. |
| D365 samples and control totals | Owner artifact request remains outstanding; DEC-104 resolved the architecture direction, not real-source proof. | Verified D365 shape claims and real-source J2/J3/J4 acceptance. |
| Team workflow | Current app decisions are single-user/local-first; J3 may require accounts-team access. | Shared auth/sync/collaboration design and production claims. |
| Provider access | No live provider sandbox/account used in the audit. | Provider-specific live validation. |
| Industry priority | O5 says no sector/jurisdiction certified. | Any industry-pack support/certification claim. |
| Source checklist sections 108–110 / 108–200 | Legacy annex remains unresolved/source-owed. | Complete scope evidence; titles must not be inferred. |
| Security/dependency posture | Root/server production advisories remain open; native/recovery review is incomplete. | Production-ready deployment claims. |

## Evidence standard

For every gate, the status ladder is **designed → implemented → unit tested → integrated → sample validated → owner accepted → production supported**. A status applies only to the exact data shape, provider product/edition, workflow and deployment evidenced. The current code audit, coverage details and unresolved gaps are linked from [`../VISION_ALIGNMENT_RECHECK_2026_11_02.md`](VISION_ALIGNMENT_RECHECK_2026_11_02.md), [`../CAPABILITY_TRUTH_MATRIX.md`](../CAPABILITY_TRUTH_MATRIX.md), and [`../agent/09_KNOWN_GAPS.md`](../agent/09_KNOWN_GAPS.md).

**Detailed plan:** [`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md). **Accepted decisions:** [`decision-log.md`](decision-log.md). **Requirements/evidence:** [`requirements-register.md`](requirements-register.md).