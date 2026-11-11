# FinPlan Pro — Product Vision

> **Goal:** cover **everything that falls under FP&A** in one ultimate workspace—
> from trusted source data through planning, analysis, close, collaboration,
> governance, and board-ready outputs. The owner's ambition is a tool that can
> replace an army of FP&A analysts and perform more accurately and intelligently.
> This is the product's north-star, not a statement of current capability or
> proven replacement performance. Evidence for what exists lives in
> [`docs/CAPABILITY_TRUTH_MATRIX.md`](CAPABILITY_TRUTH_MATRIX.md) and
> [`docs/agent/09_KNOWN_GAPS.md`](agent/09_KNOWN_GAPS.md).
>
> **Broader owner direction, reaffirmed 2026-11-10:** build a one-stop FP&A
> product so users do not need another app to complete supported FP&A work; use
> data from accounting/ERP systems through the product's user-customizable
> format; and cater to all industries. DEC-104 already accepts the universal
> template direction. This target expands the D365-first starting workflow; it
> does not certify universal ERP coverage or any industry today.
>
> **Format principle:** users should map their existing structured exports into
> a versioned FinPlan canonical model rather than manually reshape every source
> to a proprietary layout. The product may provide a documented FinPlan
> template format for repeatable interchange, but it must be an option, not a
> barrier to importing source-native CSV/XLSX. Mappings may not invent financial
> values or silently discard unmapped fields.

Last reviewed: **2026-11-10**. Detailed proposed execution is in
[`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md);
[`docs/discovery/roadmap.md`](discovery/roadmap.md) is its high-level gated
summary. Accepted decisions remain in
[`docs/discovery/decision-log.md`](discovery/decision-log.md) (DEC-010, DEC-011,
DEC-033, DEC-104).

---

## 1. Why this product exists

The owner is an FP&A practitioner. Their first known workflow is to export a
General Ledger dump from **Microsoft Dynamics 365**, perform FP&A work, identify
potentially wrong entries, guide the accounts team to correct them, and compare
day by day, month by month and year over year in extreme detail. That workflow
is the product's first owner-specific proof, not its product boundary. Per
DEC-033, the ultimate scope is all FP&A work; the 2026-11-04 direction further
requires user-configurable accounting/ERP data intake and industry
extensibility. Any discovered FP&A responsibility must be made visible in the
live scope records rather than silently deferred or omitted.

The ambition to replace analyst capacity and improve accuracy/intelligence is
not yet a verified claim. It requires owner-accepted parallel runs on real
work, with measured accuracy, coverage and time outcomes. Human dispositions
remain the authority for correction decisions (DEC-018, refined by DEC-035:
in-tool completion, optional Excel export); AI remains local-only behind the
verified-facts gate (DEC-022).

### One-stop interpretation

For supported FP&A workflows, the practitioner should not have to move data
among a spreadsheet, another FP&A application, a separate rule script, and a
hand-built board pack. A connected ERP may remain an upstream source/system of
record; ERP replacement and write-back are not implied. The destination is one
workspace, one canonical dataset, and one audit trail:

```text
D365 owner export / user-mapped file from an accounting or finance ERP
  → select/build a versioned template; preview and validate every row
  → explicit period/entity/currency scope, source controls and reconciliation
  → canonical ledger, trial balance, close state and source lineage
  → analysis, planning, variance and drill-to-source
  → exception candidates → human review → in-tool correction tracking
  → comparison and reviewed outputs (exports optional; outputs tie to screen)
```

D365 is the first owner-specific source proof, not the only intended source.
The universal user-mapped file/template path is the baseline coverage
mechanism; API connectors are optional, provider-specific additions that feed
the same canonical contract (DEC-104; detailed proposal in the master plan).

The import/reconciliation/close/traceability workflow is the **spine**. It must
work on synthetic fixtures and then reconcile against owner source controls
before any real-source workflow is called supported. A synthetic D365-shaped
file proves a software path, not universal compatibility or owner acceptance.
Broader FP&A depth is delivered on top of that spine, not instead of it.

**No ceiling clause.** No feature list, current implementation, roadmap phase or
initial data source is a permanent ceiling on scope. D365 GL import is a
critical starting workflow, not the product boundary; as the discipline,
organisation or operating model evolves, newly identified FP&A responsibilities
are added to the live scope records rather than silently omitted.

**One-stop acceptance (a requirement, not a claim).** A user must be able to
complete the agreed supported FP&A work without another FP&A application or a
mandatory spreadsheet/script round-trip. Exports may be offered for
interoperability, but a separate application must not be a required step in the
supported journey. The in-app correction-request lifecycle now exists and
Excel export is optional (DEC-035); real accounts-team validation and proof
that the source entry was actually corrected remain open. The broader one-stop
claim is therefore **not yet earned** (DEC-058 and the completion programme).

**Zero compromise is an operating bar, not a promise of flawlessness.** It binds
accuracy, traceability, security, human control and dependable operation. Claims
about replacing analyst capacity or beating a baseline require owner-accepted
real-data measurement; until then they are aspirations, and the repository says
so.

---

## 2. The all-in-one module map

The product is organised into the six pillars that already exist in the target
shell ([`docs/product/ROUTE_MAP.md`](product/ROUTE_MAP.md)). Each pillar is a
claim about capability; each capability is only as mature as the evidence can
prove.

| Pillar | Job to be done | Core capability target |
|---|---|---|
| **DATA** | Get finance data in safely from user-mapped ERP exports or validated connectors, and know exactly what arrived. | Canonical CSV/XLSX templates; schema validation, row reasons, control totals and provenance; D365 is first owner proof. |
| **CLOSE** | Prove the books are tied out and controlled for the period. | Trial balance, tie-out, period close state machine, write guards and audit chain. |
| **PLAN** | Build budgets, forecasts, scenarios and drivers. | Budgeting, rolling forecasts, scenarios, workforce/CapEx/cash planning. |
| **ANALYZE** | Explain the numbers and surface what is worth a second look. | Statements, variance decomposition, drill-to-source and human-reviewed exception candidates. |
| **MODEL** | Handle specialist accounting and FP&A models. | Consolidation, FX/CTA, intercompany elimination, revenue, leases, tax and other governed models. |
| **REPORT** | Produce trustworthy, tie-out-verified outputs. | Financial statements, board packs, formula-preserving XLSX, PDF/PPT and other owner-approved outputs. |

Cross-cutting: **ADMIN** (settings, users, integrations, data management),
**GOVERN** (RBAC, audit, security policy), **COLLABORATION** (roles and shared
work only if approved), and **AI** (commentary drafted only from verified
facts—deferred, never a source of financial numbers).

### Maturity vocabulary

Every capability is graded, and grades may not be claimed without evidence:

| Grade | Meaning | Evidence required |
|---|---|---|
| **BUILT** | Source exists. | Source path and owner. |
| **CONNECTED** | Uses real domain contracts and handles loading/empty/error states. | Integration test or E2E run and data contract. |
| **GOVERNED** | Authorization, validation, audit and scope are enforced. | API/authz tests, audit record and policy reference. |
| **ENTERPRISE-READY** | Governed and operationally fit for a supported workflow. | Performance, accessibility, backup/rollback, runbook and owner acceptance. |

A blank or `UNVERIFIED` grade is not a failure—it prohibits making the claim.
Per-capability grades are generated by `npm run capability:inventory` into
[`docs/CAPABILITY_TRUTH_MATRIX.md`](CAPABILITY_TRUTH_MATRIX.md).

---

## 3. What “zero compromise” means here

These are standing commitments enforced by gates rather than good intentions:

1. **Measured, or not stated.** No claim without the command or evidence that
   produced it.
2. **Nothing is done without evidence.** Done = code + a test that fails
   without the change + relevant gates green + docs updated.
3. **Money has one primitive.** Amount arithmetic goes through
   `src/utils/money.ts` (`decimal.js`); `money:ast` stays at 0 unsafe operations.
4. **Deterministic.** Time and randomness are injected; the determinism ratchet
   may only go down.
5. **Nothing silently discarded.** Every rejected row has a number, code and
   reason; every batch has a hash, id and controls.
6. **Missing is not zero.** Unavailable inputs render unavailable with a reason,
   never as 0.
7. **A potential exception is never an error.** Flags are review candidates;
   only human disposition makes something wrong.
8. **Missing and invalid are distinguished** at every boundary.
9. **One source of truth per fact.**
10. **No gate is weakened to pass it.**

The full rationale and enforcing commands live in `AGENTS.md` §2 and
[`docs/agent/04_ENGINEERING_RULES.md`](agent/04_ENGINEERING_RULES.md).

---

## 4. Guardrails for the first supported product slice

Stated so nobody mistakes the long-term vision for current capability. DEC-033
keeps all FP&A as the ultimate scope; DEC-042 bounds the current v1 `SUPPORTED`
label to the DATA→CLOSE trust spine. Anything broader remains visible with its
measured maturity until evidence and a scope decision justify promotion.

- No cloud sync, multi-tenant login or real-time collaboration until the owner
  resolves the current local-first/single-user decisions against the accounts
  team workflow.
- No ERP write-back; the GL is read-only input unless separately approved.
- No AI that computes, posts or asserts numbers. AI may draft commentary only
  from approved, verified facts, behind an explicit user action and approved
  data-egress policy.
- DEC-104's universal user-mapped file/template path and its integration with
  the current upload UI are explicit foundation work; do not defer them as
  “feature expansion.”
- Do not add API connectors or industry packs as unsupported breadth. Stage
  them behind the shared canonical contract, owner priority and provider/pack
  evidence in the master plan. Do not claim universal support from code presence.
- No industry/jurisdiction certification until a domain owner validates
  representative data, definitions and outputs; O5 currently certifies none.

---

## 5. Success looks like

A verified, owner-accepted vertical slice—not a route count or synthetic demo:

1. A D365-shaped export and a generic user-mapped CSV/XLSX fixture use one
   canonical import/validation path; a saved mapping can be reviewed, reused
   and versioned.
2. Every source row is accounted for, with provenance and an explicit accepted
   or rejected reason; re-import and rollback follow a defined policy.
3. Import controls reconcile to the source; the trial balance and supported
   outputs tie to independent expected values.
4. Period/close controls cannot be bypassed by any supported write path.
5. The owner reviews evidence-backed exception candidates and records a human
   disposition; no flag is presented as a proven error.
6. Correction and day/month/year comparison journeys are validated on real
   supported work, with no mandatory external FP&A app or spreadsheet step.
7. Outputs tie to the screen; Excel/PDF/PPT are supported only to the extent
   their own parity evidence exists.
8. The chosen deployment passes security, recovery, accessibility and support
   gates; automated checks are green and known limitations remain visible.

The first release scope, cycle count, performance thresholds and industry/API
priority require owner review; proposed detailed gates are in the master plan.

---

## 6. Where the detail lives

| Question | Document |
|---|---|
| What was asked, and is it done? | `docs/discovery/requirements-register.md` |
| What is the detailed proposed approach? | `docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md` |
| What are the high-level delivery gates? | `docs/discovery/roadmap.md` |
| What has been decided? | `docs/discovery/decision-log.md` |
| What can go wrong? | `docs/discovery/risk-register.md` |
| What actually exists right now? | `docs/CAPABILITY_TRUTH_MATRIX.md`, `docs/agent/09_KNOWN_GAPS.md` |
| How do we build without breaking money? | `docs/agent/03_DOMAIN_RULES.md` |
| How is each rule enforced? | `docs/agent/05_COMMANDS_AND_GATES.md` |

---

## 7. How “complete” is decided

Completeness is a property of a register, not a feature count: every identified
responsibility is either supported to an evidence-backed standard or explicitly
recorded as not supported, experimental, blocked or retired by decision. A
silent omission cannot be described as complete.

The programme that builds that register and fills it is
[`docs/plan/COMPLETION_PLAN_86_100.md`](plan/COMPLETION_PLAN_86_100.md)
(PRs #86–#100, DEC-058). Its six contract criteria fix what “done” means at PR
#100 so the definition cannot be relaxed at the end:

1. every route, engine, requirement and annex section has a closed-vocabulary
   status plus evidence a script re-derives;
2. every supported workflow is completable in-app (one-stop census);
3. money and “missing is not zero” invariants hold on every supported surface;
4. every claimed grade is reproduced by a named test or gate, not prose;
5. the supported set is operationally fit—accessibility, performance, bundle,
   determinism and authorization;
6. what is not supported is stated, with the decision that blocks it.

Nothing in this document is evidence of capability. Evidence lives in the
generated matrix and the gates that re-derive it.
