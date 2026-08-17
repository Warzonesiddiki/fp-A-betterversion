# OMNIPLAN — LOCKED ENGINEERING BLUEPRINT

> **Artifact:** `/.agent/BLUEPRINT.md`
> **Authority:** OMNI-SOVEREIGN CODEX — ULTIMA FP&A Edition, Article XVIII (Blueprint Genesis),
> plus Addendum I (Parts XXIV–XXX) and Addendum II (Parts XXXI–LXI).
> **Kernel:** K1–K28 active and supreme.
> **Status:** LOCKED
> **Locked at:** 2026-08-17
> **Session:** sess_003
> **Supersedes:** ad-hoc planning in `MASTER_ROADMAP.md`, `PROJECT_BACKLOG.md`,
> `COMPLETION_TASKLIST_ZERO_COMPROMISE.md`, `docs/ZERO_COMPROMISE_PRODUCT_BLUEPRINT.md`,
> `docs/MASTER_PLAN*.md`, `GAP_LEDGER.md`. Those remain as historical evidence; this
> document is the single normative plan.

---

## HOW TO READ THIS DOCUMENT

This blueprint is a **zero-gap engineering contract**, not a wish list. Every entry is
scoped so a senior engineer can implement it without asking a question. Where a decision
could not honestly be made, it is marked `NON-GOAL` or `ESCALATE` — never `TBD`.

Three vocabularies are used consistently and mean different things:

| Term       | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| **TARGET** | What OmniPlan must be at GA. Normative.                                 |
| **TODAY**  | What is verifiably in this repository right now, measured, not claimed. |
| **DELTA**  | The named, sequenced work between the two.                              |

Capability maturity is a four-state ladder (K14 — evidence over assertion):

| State        | Bar                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `BUILT`      | Code exists and passes its local test scope.                                                                    |
| `CONNECTED`  | Uses real domain data; survives loading/error/empty states.                                                     |
| `GOVERNED`   | Server-authorized, validated, auditable, permission-scoped, versioned.                                          |
| `ENTERPRISE` | Governed + performance-tested + accessible + observable + documented + validated by a customer-shaped workflow. |

**No product surface may be described to a user as "complete" below `ENTERPRISE`.**

---

## TABLE OF CONTENTS

The section numbering is mandated verbatim by Codex Article XVIII-C. It is not negotiable
and not reordered.

| §   | Section                                    | Answers                                                  |
| --- | ------------------------------------------ | -------------------------------------------------------- |
| 0   | Executive Summary & North Star             | What is OmniPlan and how do we know it worked?           |
| 1   | Problem Statement (per competitor gap)     | Why does it deserve to exist?                            |
| 2   | User Personas & Jobs-to-be-Done            | Who fails today, and at what?                            |
| 3   | Feature Universe                           | Everything it must do, reconciled against what exists.   |
| 4   | System Architecture                        | Shape of the system; the build-vs-rewrite decision.      |
| 5   | Data Architecture                          | Facts, dimensions, books, lineage, migrations M001–M013. |
| 6   | Financial Engine Specification             | Money, calc, consolidation, FX, close — the sacred core. |
| 7   | Industry Vertical Configuration            | Packs as data, never engine forks (K19).                 |
| 8   | Integration Architecture                   | Adapter contract, inbox/outbox, DLQ.                     |
| 9   | UI/UX System Specification                 | Five pillars, ≤40 routes, the "Ledger" design system.    |
| 10  | Security & Compliance Architecture         | Tenancy, RLS, masking, identity, compliance.             |
| 11  | Performance & Scalability                  | Budgets, scale targets, and how they are proven.         |
| 12  | AI/ML Module Specification                 | Tiers, money-egress guardrail, explainability.           |
| 13  | Workflow & Collaboration Engine            | Approvals, SoD, money-safe concurrency, close.           |
| 14  | Reporting & Export Engine                  | Snapshots, board packs, drill-through.                   |
| 15  | API Specification                          | `/v1` contract, idempotency, error envelope.             |
| 16  | Infrastructure, Deployment & Observability | Environments, CI/CD, DR, SLOs, error codes.              |
| 17  | Testing Strategy                           | Pyramid, oracles, coverage ratchet, universal DoD.       |
| 18  | Phased Roadmap                             | Phases 0–3, workstreams, exit gates.                     |
| 19  | Gap Analysis vs Competitors                | Where the market leaves a hole.                          |
| 20  | Risk Register                              | What kills this, and the mitigation owner.               |
| 21  | ADR Log                                    | ADR-001 … ADR-013, binding.                              |
| 22  | Definition of Done per Phase               | The gates, the honesty clause, and the re-audit record.  |
| 23  | Windows Desktop Application                | Tier-1 Windows: packaging, signing, offline, DoD.        |
| 24  | The Zero-Escape Contract                   | All-in-one, measured: escape ledger + Core-20 gate.      |
| A   | Appendix A — Domain Module Specifications  | Addendum II Parts XXXI–LX detail + coverage map.         |

---

# SECTION 0 — EXECUTIVE SUMMARY & NORTH STAR

## 0.1 Product Name

**OmniPlan** — the product. `FinPlan Pro` is the current repository/codename and
remains the npm package name (`finplan-pro`) until a rename ADR is executed in Phase 2.
Renaming is cosmetic and is deliberately _not_ on the Phase 0/1 critical path (K15).

## 0.2 North Star

> One platform. Every financial planning workflow. Every industry.
> Zero spreadsheet dependency. Zero tool switching.

## 0.3 Core Promise (each is a testable acceptance criterion, not marketing)

| #   | Promise                                                                       | Acceptance test                                                                                       |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| P1  | A CFO onboards in < 2 hours and produces a board-ready report on day one.     | `tests/e2e/cfo-board-pack.spec.ts` completes from empty tenant in < 2h of scripted steps.             |
| P2  | An FP&A analyst builds a full 3-statement model without leaving the platform. | `tests/financial/three-statement.spec.ts` + analyst E2E; BS balances, CF ties, NI flows.              |
| P3  | A controller consolidates 20 entities in multiple currencies with one click.  | `tests/e2e/controller-5-entity-consol.spec.ts` scaled to 20 entities / 3 currencies; IC nets to zero. |
| P4  | A business partner runs unlimited what-if scenarios without IT.               | Scenario branch/compare/discard with no admin action; p95 < 2s for a 10k-cell scenario.               |
| P5  | An auditor traces every number to its source in one click.                    | Lineage inspector returns full chain, ≤ 5 hops, p95 < 50 ms (Part XXIV).                              |

## 0.4 The Filter (K20)

Every design decision passes through: _"does this eliminate a reason to open Excel,
Anaplan, Adaptive, Vena, Planful, Power BI, or a spreadsheet?"_ If the answer is no,
it is not Phase 0/1 work.

## 0.5 Differentiators (specific, measurable)

| Differentiator            | Measurable claim                                                              | Competitor baseline                                          |
| ------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Lineage-by-default        | 100% of published cells expose an unbroken source chain; p95 traverse < 50 ms | Anaplan/Adaptive: drill to module, not to source transaction |
| Decimal-exact money       | 0 IEEE-754 operations in any monetary path, statically enforced in CI         | Excel: binary float; every competitor: unverifiable          |
| Self-serve implementation | Tenant live in ≤ 14 days without a consultant (Part LVIII playbook)           | Anaplan: 3–6 months, $500k+ implementation                   |
| Local-first + governed    | Full offline modelling; publication still server-authorized                   | Cloud-only competitors are unusable offline                  |
| Governed metric store     | One KPI = one definition across dashboard, NLQ, Excel add-in, API (K21)       | Power BI: per-report measures diverge silently               |
| Excel deconstruction      | Upload a workbook → get a governed model, not a dead import                   | Every competitor: manual re-modelling                        |

## 0.6 Baseline — TODAY (measured 2026-08-17, session 003)

All numbers below were produced by command, not copied from prior documents.
Prior documents contain inconsistent counts; those counts are hereby superseded.

| Metric                                     | Verified value           | Command                                                         |
| ------------------------------------------ | ------------------------ | --------------------------------------------------------------- |
| TS/TSX source files (`src` + `server/src`) | 2,342                    | `find src server/src -name '*.ts' -o -name '*.tsx' \| wc -l`    |
| Lines of TS/TSX                            | 455,514                  | `find … -exec cat {} + \| wc -l`                                |
| Engines (non-test)                         | 187                      | `ls src/engines/*.ts \| grep -v '\.test\.\|benchmark' \| wc -l` |
| Zustand stores (non-test)                  | 44                       | `ls src/store/*.ts \| grep -v test \| wc -l`                    |
| Pages (non-test `.tsx`)                    | 203                      | `find src/pages -name '*.tsx' \| grep -v test \| wc -l`         |
| Components (non-test `.tsx`)               | 287                      | `find src/components -name '*.tsx' \| grep -v test \| wc -l`    |
| Test files                                 | 1,228                    | `find src -name '*.test.ts*' \| wc -l`                          |
| Lazy routes in `App.tsx`                   | 193                      | `grep -c 'lazy(' src/App.tsx`                                   |
| Server route modules                       | 10 non-test              | `ls server/src/routes`                                          |
| Sector configs                             | 15 + index               | `ls src/config/sectors`                                         |
| `tsc --noEmit`                             | **0 errors**             | `node node_modules/typescript/bin/tsc --noEmit`                 |
| `eslint src --max-warnings 0`              | **0 errors, 0 warnings** | `node node_modules/eslint/bin/eslint.js src --max-warnings 0`   |

**Interpretation (honest):** the repository is a large, disciplined, _local-first
desktop/PWA FP&A workspace_ with an auxiliary Express + SQLite service. It is **not**
a multi-tenant cloud system of record. Breadth (193 routes, 187 engines) substantially
exceeds depth (no tenancy, no RLS, no lineage graph, no metric store, no workflow state
machine, no environments). The central risk this blueprint manages is exactly that:
**breadth has been allowed to look like depth.**

### 0.6.1 Where the numbers actually live (measured, session 004)

The single most consequential structural fact about this codebase was not stated in the
first draft of this blueprint. It is stated here because Phase 0 sequencing depends on it.

| Question                                             | Measured answer                                                                                                                              | Command                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Zustand stores using `persist()` → `localStorage`    | **43**                                                                                                                                       | `grep -rln 'persist(' src/store`               |
| Non-test source files that call the server at all    | **14**                                                                                                                                       | `grep -rl 'fetch(\|axios' src \| grep -v test` |
| Stores holding financial truth persisted client-side | `glStore`, `budgetStore`, `forecastStore`, `scenarioStore`, `debtStore`, `leaseStore`, `capexStore`, `fxRateStore`, `glTrialBalanceStore`, … | `ls src/store`                                 |
| `tenant_id` occurrences in `server/src/db/`          | **0**                                                                                                                                        | `grep -rn 'tenant' server/src/db/*.ts`         |
| Schema homes                                         | **2** (`src-tauri/migrations/*.sql` = 35 tables; `server/src/db/migrate.ts` + `auditSchema.ts` = 9 more, created in code)                    | —                                              |

**What this means, plainly.** The general ledger, budgets, forecasts, scenarios, debt,
leases and FX rates are today persisted as **JSON in browser `localStorage`**, not in the
database. The Express + SQLite service exists and is well tested, but the application is
substantially _not wired to it_. Consequences that must drive sequencing:

1. **There is no system of record.** Clearing site data destroys the ledger. No backup
   (§16.4), no RTO/RPO, no PITR, and no audit trail can be honest while this holds.
2. **Server-side RLS protects almost nothing** while the authoritative copy of the data sits
   on the client, outside any policy predicate.
3. **`localStorage` is a string store.** Every persisted decimal round-trips through
   `JSON.stringify`. Any money value held as a JS `number` in store state is silently
   IEEE-754 at the persistence boundary regardless of how carefully the engines compute it —
   which is why "0 raw `toFixed`" is **not** evidence of decimal safety (§18.2 W0.1).
4. **The schema is forked in two places.** `src-tauri/migrations/` and the server's
   in-code DDL can drift apart with nothing detecting it.

This does not invalidate ADR-003 — evolving this codebase is still correct, and the local-first
posture is a deliberate §0.5 differentiator. But it reframes Phase 0: the platform is closer to
a **very sophisticated offline workbook** than to a governed cloud system, and the gap between
those two things is the actual Phase 0 backlog. Workstream 0.8 (below) makes persistence
authority an explicit, gated deliverable rather than an assumption.

## 0.7 Index scores — baseline vs target

Scores are computed from the rubric in Section 22.3. Baseline is deliberately harsh.

| Index                   | Baseline (today) | Phase 0 exit | Phase 1 exit | GA target |
| ----------------------- | ---------------- | ------------ | ------------ | --------- |
| SHI (System Health)     | 71               | 78           | 85           | ≥ 92      |
| UVI (User Value)        | 44               | 52           | 74           | ≥ 95      |
| DEI (Domain Excellence) | 49               | 60           | 80           | ≥ 95      |

Why UVI/DEI are low despite 455k lines: `CompletenessVsToolLandscape` and
`AuditReadiness` are near-zero without tenancy, lineage, governed metrics, and
server-authoritative publication. Volume of code is not value (K15).

---

# SECTION 1 — PROBLEM STATEMENT (per competitor gap)

Each problem is stated as an observed practitioner failure mode, the tool that causes
it, and the OmniPlan mechanism that removes it. A mechanism with no feature ID is not
a plan; every row cites one.

| #     | Practitioner failure mode                                  | Caused by                    | OmniPlan mechanism                                                                        | Feature ID                 |
| ----- | ---------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- | -------------------------- |
| PR-01 | "The link broke and nobody noticed for two months."        | Excel external references    | AST-stored formulas + DAG validation; a dangling ref is a build-time error, not a `#REF!` | F-CORE-011, F-CORE-001     |
| PR-02 | "Which version is the real budget?"                        | Excel file sprawl            | Immutable locked scenario versions + branch/compare/merge                                 | F-CORE-010, F-OPS-001      |
| PR-03 | "I can't tell where this number came from."                | All tools                    | Lineage graph, Output→Source ≤ 5 hops, p95 < 50 ms                                        | F-AUDIT-001                |
| PR-04 | "Consolidation takes nine days."                           | Manual eliminations in Excel | Consolidation engine with rule-driven IC elimination + NCI                                | F-CORE-006                 |
| PR-05 | "FX restated last quarter's numbers."                      | Rates recomputed on read     | FX rate stored _with_ the fact (RULE D5); IAS 21 fixed application                        | F-CORE-005                 |
| PR-06 | "Anaplan cost $500k and took six months."                  | Consultant-led modelling     | 14-day self-serve playbook + Excel deconstruction                                         | F-MIGRATE-001, Part LVIII  |
| PR-07 | "Only two people understand the model."                    | Anaplan/Adaptive DSLs        | Excel-compatible formula syntax; no proprietary language                                  | F-CORE-011, Part LIII      |
| PR-08 | "Adaptive's reporting is weak; we export to Excel anyway." | Weak report builder          | Report builder + board pack generator + certified snapshots                               | F-REPORT-002, F-REPORT-006 |
| PR-09 | "Power BI shows the variance but I can't plan in it."      | BI has no write-back         | Planning and reporting share one fact store; write-back is native                         | F-CORE-001                 |
| PR-10 | "Every report computes 'ARR' differently."                 | Per-report measures          | Governed metric store, one definition, versioned (K21)                                    | F-SEM-001                  |
| PR-11 | "Someone edited a closed period."                          | No DB-level lock             | Period close adds a DB-level constraint; edits are impossible, not discouraged            | F-CLOSE-002                |
| PR-12 | "Comp data leaked to a department head."                   | UI-only masking              | Field-level masking enforced at the API and in exports                                    | F-SEC-003                  |
| PR-13 | "The auditor asked for evidence and we spent three weeks." | No evidence model            | SOX/ICFR evidence model, exportable evidence pack                                         | F-CTRL-002                 |
| PR-14 | "We edited production because it was faster."              | No environments              | Dev/UAT/Prod model promotion, mandatory from Phase 1 (K26)                                | F-OPS-002                  |
| PR-15 | "Two people saved at once and a number was silently lost." | Last-write-wins              | Deterministic conflict protocol + integrity assertions (K27)                              | F-COLLAB-002               |

---

# SECTION 2 — USER PERSONAS & JOBS-TO-BE-DONE

Six personas. Each has goals, pains, a **time-bounded** success metric, the routes that
serve them, and the E2E spec that proves the journey. A persona without a passing E2E
spec is not served, regardless of how many pages exist.

### 2.1 CFO

- **Goals:** board reporting, strategic planning, cash visibility, M&A modelling.
- **Pains:** consolidation time, version chaos, no single source of truth.
- **Success metric:** full monthly close + board package in **< 3 days**.
- **Primary surfaces:** Home, Consolidate, Report › Board Pack, Cash & Treasury.
- **Proof:** `tests/e2e/cfo-board-pack.spec.ts`.
- **Onboarding target:** productive in **< 2 hours**.

### 2.2 FP&A Analyst

- **Goals:** variance analysis, rolling forecast, model maintenance, self-service.
- **Pains:** manual Excel manipulation, broken links, no audit trail.
- **Success metric:** zero-touch monthly model refresh in **< 30 minutes**.
- **Primary surfaces:** Plan › Budget/Forecast, Actuals › Variance, grid + formula bar.
- **Proof:** `tests/e2e/analyst-variance-drill.spec.ts`.
- **Onboarding target:** first governed model in **< 1 day**.

### 2.3 Controller

- **Goals:** accuracy, compliance, intercompany, eliminations, audit readiness.
- **Pains:** manual eliminations, currency errors, no workflow controls.
- **Success metric:** **zero** material audit findings on FP&A-produced numbers.
- **Primary surfaces:** Close (R2R), Consolidate, Actuals › Drill-to-source.
- **Proof:** `tests/e2e/controller-5-entity-consol.spec.ts`, `tests/financial/ic-zero.spec.ts`.

### 2.4 Business Partner (department budget owner)

- **Goals:** department budgets, headcount models, what-if scenarios, self-service.
- **Pains:** waiting for Finance, cannot explore scenarios, no context.
- **Success metric:** self-serve budget vs actual in **< 5 minutes**.
- **Primary surfaces:** Plan › Budget (scoped), Actuals › Variance (scoped), Scenarios.
- **Proof:** budget submission workflow E2E; RLS scoping test.
- **Constraint:** sees departmental totals, not line-item comp detail (Section 10.4).

### 2.5 CEO / Executive

- **Goals:** real-time KPI visibility, strategic scenario comparison, investor metrics.
- **Pains:** stale data, multiple dashboards, format inconsistency.
- **Success metric:** live dashboard requiring **zero** preparation.
- **Primary surfaces:** Home, Analyze › Metric Catalog, Report › Dashboards.
- **Proof:** dashboard renders with staleness badges; every tile binds to a metric id (MET3).

### 2.6 System Admin

- **Goals:** user management, integrations, data governance, security.
- **Pains:** complex setup, no IT self-service, poor audit logs.
- **Success metric:** full tenant setup in **< 4 hours**, zero shadow IT.
- **Primary surfaces:** Admin (MDM, IAM, SoD, calendars, residency, audit), Integrate.
- **Proof:** `tests/e2e/admin-onboard-entity.spec.ts`, `tests/security/scim.jml.spec.ts`.

### 2.7 Auditor (read-only, added — Part XXIV-C requires it)

- **Goals:** trace any number, verify controls, export evidence.
- **Pains:** no independent evidence, client-side-only trails.
- **Success metric:** evidence pack for any published report in **< 10 minutes**, unassisted.
- **Proof:** `tests/e2e/sod-cannot-self-approve.spec.ts`, auditor lineage E2E.
- **Onboarding target:** first independent evidence pack in **< 1 hour**, no training call.

### 2.8 Onboarding time targets (XVIII-N — one per persona, all measured)

Each target is measured by a timed scripted E2E run against an empty tenant seeded only
with the industry sample pack (A.18). "Productive" means the persona completed their
success metric once, unassisted. A missed target is a Phase gate failure, not a UX ticket.

| Persona          | Time to productive | Definition of productive                                                  | Timed spec                                      |
| ---------------- | ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- |
| CFO              | **< 2 hours**      | Viewed a consolidated P&L and generated one board pack draft              | `tests/e2e/onboarding/cfo.timed.spec.ts`        |
| FP&A Analyst     | **< 1 day**        | Built one governed driver model and published a variance view             | `tests/e2e/onboarding/analyst.timed.spec.ts`    |
| Controller       | **< 1 day**        | Ran one close task list to sign-off on sample data                        | `tests/e2e/onboarding/controller.timed.spec.ts` |
| Business Partner | **< 15 minutes**   | Opened their scoped budget and submitted one line for approval            | `tests/e2e/onboarding/partner.timed.spec.ts`    |
| CEO / Executive  | **< 10 minutes**   | Read the home dashboard and drilled one KPI to its metric definition      | `tests/e2e/onboarding/exec.timed.spec.ts`       |
| System Admin     | **< 4 hours**      | Created the entity tree, connected one source, provisioned users via SCIM | `tests/e2e/onboarding/admin.timed.spec.ts`      |
| Auditor          | **< 1 hour**       | Exported one evidence pack tracing a published figure to source           | `tests/e2e/onboarding/auditor.timed.spec.ts`    |

These roll up to the 14-day implementation playbook (A.17), which is the tenant-level
version of the same commitment.

---

# SECTION 3 — FEATURE UNIVERSE

Tag format: `[PHASE] [PRIORITY] [VERTICAL] [PERSONA] [REPLACES] [EFFORT] [DEPENDS]`
Effort: S ≤ 2d · M ≤ 1w · L ≤ 3w · XL > 3w (XL must be decomposed before scheduling).
`TODAY` column is the honest maturity of what exists in this repo right now.

## 3.1 F-CORE — Financial Engine

| ID         | Feature                                                 | Phase | Pri    | Effort | TODAY                                                                                                                                      |
| ---------- | ------------------------------------------------------- | ----- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| F-CORE-001 | Three-statement model engine (P&L, BS, CF), auto-linked | 0→1   | P0     | XL     | BUILT (`ThreeStatementEngine.ts`, oracles test exists)                                                                                     |
| F-CORE-002 | Driver-based modelling (KPI → revenue → cost cascade)   | 1     | P0     | L      | BUILT (`CascadeCalculationEngine`, `driverStore`)                                                                                          |
| F-CORE-003 | Zero-based budgeting templates                          | 1     | P1     | M      | BUILT (templates dir)                                                                                                                      |
| F-CORE-004 | Top-down / bottom-up hybrid planning                    | 1     | P0     | L      | BUILT (allocation + budget engines)                                                                                                        |
| F-CORE-005 | Multi-currency, 50+ currencies, live + locked rates     | 0→1   | P0     | L      | BUILT (`fxRateStore`, FX engine); **not** IAS 21-verified                                                                                  |
| F-CORE-006 | Multi-entity consolidation + IC eliminations + NCI      | 1     | P0     | XL     | BUILT (`ConsolidationEngine`, `IntercompanyMatchingEngine`)                                                                                |
| F-CORE-007 | Rolling forecast engine, auto-lock actuals              | 1     | P0     | L      | BUILT (`forecastStore`, rolling pages)                                                                                                     |
| F-CORE-008 | Scenario manager, unlimited scenarios                   | 1     | P0     | L      | BUILT (`ScenarioEngine`)                                                                                                                   |
| F-CORE-009 | Variance engine (BvA, FvA, YoY, QoQ)                    | 1     | P0     | M      | BUILT (variance engines + pages)                                                                                                           |
| F-CORE-010 | Version control on models (branch, compare, merge)      | 1     | P0     | XL     | PARTIAL — branch/compare exist; **merge is a gap**                                                                                         |
| F-CORE-011 | Formula engine (Excel-compatible + financial functions) | 0→1   | P0     | XL     | BUILT (`FormulaEngine`, `ArrayFormulaEngine`, `AdvancedExcelEngine`)                                                                       |
| F-CORE-012 | Allocation engine (headcount %, revenue %, custom)      | 1     | P0     | M      | BUILT (`AllocationEngine`, `AllocationRuleEngine`)                                                                                         |
| F-CORE-013 | Period engine (monthly/quarterly/annual, fiscal config) | 0     | P0     | M      | BUILT (`Period*` engines, `server/src/routes/periods.ts`)                                                                                  |
| F-CORE-014 | Audit trail on every cell change                        | 0→1   | P0     | L      | BUILT client-side; **NOT GOVERNED** — no server-authoritative chain                                                                        |
| F-CORE-015 | Data validation rules                                   | 1     | P1     | M      | BUILT (`CellValidationEngine`)                                                                                                             |
| F-CORE-016 | **Decimal precision layer, zero float in money paths**  | 0     | **P0** | M      | PARTIAL — primitive is correct; **adoption 25.44% by import-proxy (2026-08-17), true decimal-safety unmeasured until W0.1.0 AST detector** |

## 3.2 F-PLAN — Planning Modules

| ID         | Feature                                                     | Phase | Pri | Effort | TODAY                                                |
| ---------- | ----------------------------------------------------------- | ----- | --- | ------ | ---------------------------------------------------- |
| F-PLAN-001 | Headcount planning (FTE, contractor, open roles, attrition) | 1     | P0  | L      | BUILT (workforce pages, comp components)             |
| F-PLAN-002 | Compensation modelling (bands, bonus, equity, benefits)     | 1     | P0  | M      | BUILT                                                |
| F-PLAN-003 | CapEx planning + depreciation schedules (SL/DB/SOYD/UOP)    | 1     | P0  | M      | BUILT (`CapExEngine`, `capexStore`)                  |
| F-PLAN-004 | OpEx planning with vendor contract awareness                | 1     | P1  | M      | PARTIAL                                              |
| F-PLAN-005 | Revenue planning (product, geo, channel, cohort)            | 1     | P0  | L      | BUILT                                                |
| F-PLAN-006 | SaaS metrics (ARR, MRR, NRR, churn, expansion, LTV, CAC)    | 1     | P0  | M      | BUILT (`saas` pages) — **must bind to metric store** |
| F-PLAN-007 | Pipeline-weighted revenue forecast                          | 2     | P1  | M      | NOT STARTED (needs CRM connector)                    |
| F-PLAN-008 | Capacity planning (seats, licences, infra)                  | 2     | P2  | M      | PARTIAL                                              |
| F-PLAN-009 | Working capital planning (AR, AP, inventory, CCC)           | 1     | P1  | M      | BUILT                                                |
| F-PLAN-010 | Long-range planning (5–10 year)                             | 2     | P1  | M      | PARTIAL                                              |
| F-PLAN-011 | M&A modelling                                               | 3     | P2  | L      | NOT STARTED                                          |
| F-PLAN-012 | Tax provision modelling (scoped — see Part XXXVII-C)        | 2     | P2  | L      | PARTIAL (`tax` pages)                                |
| F-PLAN-013 | Transfer pricing support                                    | 3     | P3  | L      | NOT STARTED                                          |
| F-PLAN-014 | Loan / debt schedule modelling                              | 1     | P1  | M      | BUILT (`debtStore`, `BondPricingEngine`)             |
| F-PLAN-015 | Equity / cap table impact modelling                         | 3     | P3  | M      | NOT STARTED                                          |

## 3.3 F-REPORT — Reporting & Analytics

| ID             | Feature                                                   | Phase | Pri | Effort | TODAY                                                   |
| -------------- | --------------------------------------------------------- | ----- | --- | ------ | ------------------------------------------------------- |
| F-REPORT-001   | Executive dashboard (KPI tiles, sparklines, RAG)          | 1     | P0  | M      | BUILT (`DashboardPage`)                                 |
| F-REPORT-002   | Board package generator (branded PDF/PPT from live data)  | 2     | P0  | L      | PARTIAL (PDF engine exists; no freeze/watermark/e-sign) |
| F-REPORT-003   | Flash report, scheduled                                   | 2     | P1  | M      | PARTIAL                                                 |
| F-REPORT-004   | Management reporting (by dept, cost centre, project)      | 1     | P0  | M      | BUILT                                                   |
| F-REPORT-005   | Drill-through to source transaction                       | 1     | P0  | L      | PARTIAL (`DrillThroughEngine`) — **not lineage-backed** |
| F-REPORT-006   | Custom report builder (drag-drop, no-code)                | 2     | P0  | L      | PARTIAL                                                 |
| F-REPORT-007   | Scheduled distribution (email, Slack, Teams)              | 2     | P1  | M      | NOT STARTED                                             |
| F-REPORT-008   | Investor reporting templates                              | 2     | P1  | S      | PARTIAL                                                 |
| F-REPORT-009   | Regulatory helpers (SOX narratives, audit packages)       | 2     | P1  | M      | PARTIAL                                                 |
| F-REPORT-010   | Benchmark database                                        | 3     | P2  | L      | NOT STARTED                                             |
| F-REPORT-011   | Cohort analysis                                           | 1     | P1  | M      | BUILT                                                   |
| F-REPORT-012   | Unit economics dashboard                                  | 1     | P1  | M      | BUILT                                                   |
| F-REPORT-013   | Narrative / MD&A authoring with live metric bindings      | 2     | P1  | L      | NOT STARTED                                             |
| F-REPORT-014   | Model documentation generator (drivers, lineage, history) | 3     | P2  | M      | NOT STARTED                                             |
| F-ANALYSIS-001 | Native pivot / ad-hoc analysis over the metric store      | 2     | P1  | L      | NOT STARTED                                             |

**Escape-driven additions (§24.5).** `F-ANALYSIS-001`, `F-REPORT-013`, and `F-REPORT-014`
were added by the Zero-Escape Contract audit: each owns a workflow where users would
otherwise leave for Excel, Word, or a BI tool. Ad-hoc pivot analysis (row 15 of the escape
ledger) is the most common single reason an analyst abandons a planning tool mid-task.

## 3.4 F-AI — Intelligence Layer

| ID       | Feature                                                       | Phase | Pri    | Effort | TODAY                                                |
| -------- | ------------------------------------------------------------- | ----- | ------ | ------ | ---------------------------------------------------- |
| F-AI-001 | Predictive forecasting (time-series on actuals)               | 2     | P1     | L      | BUILT (`AIEngine`, `ForecastEngine`)                 |
| F-AI-002 | Anomaly detection                                             | 2     | P1     | M      | BUILT (`AnomalyDetectionEngine`, `AnomalyExplainer`) |
| F-AI-003 | Natural language query                                        | 2     | P1     | L      | BUILT rule-based (`NLQEngine`)                       |
| F-AI-004 | Auto-commentary generation                                    | 2     | P2     | M      | BUILT (`AutoCommentaryEngine`)                       |
| F-AI-005 | Monte Carlo / scenario probability                            | 2     | P2     | M      | BUILT (`MonteCarloEngine` + workers)                 |
| F-AI-006 | Driver correlation analysis                                   | 3     | P2     | M      | PARTIAL                                              |
| F-AI-007 | Forecast accuracy scoring                                     | 2     | P1     | S      | NOT STARTED — **required by AI-P5**                  |
| F-AI-008 | Smart alerts                                                  | 2     | P1     | M      | PARTIAL                                              |
| F-AI-009 | Formula suggestion                                            | 3     | P3     | M      | PARTIAL (`AICopilotEngine`)                          |
| F-AI-010 | Data quality AI (mapping errors, dup accounts)                | 2     | P2     | M      | NOT STARTED                                          |
| F-AI-011 | **AI guardrails: no monetary amounts egress to external LLM** | 2     | **P0** | M      | NOT STARTED — **blocks all LLM features (AI-P7)**    |

## 3.5 F-INTEGRATE — Integration Hub

| ID              | Feature                                         | Phase | Pri | Effort | TODAY                                                  |
| --------------- | ----------------------------------------------- | ----- | --- | ------ | ------------------------------------------------------ |
| F-INTEGRATE-000 | Adapter contract + inbox/outbox + DLQ (Part LI) | 1     | P0  | L      | NOT STARTED — **prerequisite for every connector**     |
| F-INTEGRATE-001 | ERP connectors (NetSuite, QuickBooks first)     | 2     | P0  | XL     | PARTIAL (`ConnectorEngine`, QuickBooks/Xero scaffolds) |
| F-INTEGRATE-002 | CRM connectors                                  | 2     | P1  | L      | NOT STARTED                                            |
| F-INTEGRATE-003 | HRIS connectors                                 | 2     | P1  | L      | NOT STARTED                                            |
| F-INTEGRATE-004 | Billing connectors                              | 2     | P1  | L      | NOT STARTED                                            |
| F-INTEGRATE-005 | Data warehouse connectors                       | 3     | P2  | L      | NOT STARTED                                            |
| F-INTEGRATE-006 | Excel/Sheets import + live two-way sync         | 1→2   | P0  | XL     | PARTIAL (exceljs import/export; no live sync)          |
| F-INTEGRATE-007 | CSV/XLSX bulk import with field-mapping UI      | 1     | P0  | M      | BUILT                                                  |
| F-INTEGRATE-008 | REST API + webhooks                             | 2     | P0  | L      | PARTIAL (Express routes; not a public contract)        |
| F-INTEGRATE-009 | iPaaS connectors                                | 3     | P3  | M      | NOT STARTED                                            |
| F-INTEGRATE-010 | GL actuals auto-mapping (COA normalisation)     | 1     | P0  | L      | PARTIAL (`glStore`, `chartOfAccounts`)                 |
| F-INTEGRATE-011 | FX rate feed (ECB / OpenExchangeRates)          | 1     | P0  | S      | PARTIAL                                                |
| F-INTEGRATE-012 | Market data                                     | 3     | P3  | M      | NOT STARTED                                            |

## 3.6 F-WORKFLOW / F-COLLAB — Workflow & Collaboration

| ID             | Feature                                             | Phase | Pri | Effort | TODAY                                      |
| -------------- | --------------------------------------------------- | ----- | --- | ------ | ------------------------------------------ |
| F-WORKFLOW-001 | Budget submission workflow                          | 2     | P0  | L      | PARTIAL (`WorkflowEngine`, approval pages) |
| F-WORKFLOW-002 | Version locking / freeze for board submission       | 1     | P0  | M      | PARTIAL                                    |
| F-WORKFLOW-003 | Commenting on any cell/chart/report                 | 1     | P1  | M      | BUILT (`CellCommentEngine`)                |
| F-WORKFLOW-004 | Task assignment                                     | 2     | P1  | M      | PARTIAL                                    |
| F-WORKFLOW-005 | Approval chains (configurable multi-level)          | 2     | P0  | L      | PARTIAL                                    |
| F-WORKFLOW-006 | Notification centre (in-app, email, Slack/Teams)    | 2     | P1  | M      | PARTIAL                                    |
| F-WORKFLOW-007 | Auditor read-only role with full trace              | 2     | P0  | M      | NOT STARTED                                |
| F-WORKFLOW-008 | **Declarative state machines as config (Part XXV)** | 1     | P0  | L      | NOT STARTED — workflow is imperative today |
| F-COLLAB-001   | Presence indicators                                 | 2     | P2  | S      | BUILT                                      |
| F-COLLAB-002   | **Money-safe concurrent edit protocol (K27)**       | 2     | P0  | L      | NOT STARTED                                |

## 3.7 F-PLATFORM — Foundation (Phase 0 critical path)

These are the load-bearing items. **Nothing in 3.1–3.6 can reach `GOVERNED` without them.**

| ID            | Feature                                                         | Phase | Pri    | Effort | TODAY                                             |
| ------------- | --------------------------------------------------------------- | ----- | ------ | ------ | ------------------------------------------------- |
| F-PLAT-001    | Multi-tenancy: `tenant_id` on every table + RLS                 | 0     | **P0** | L      | NOT STARTED                                       |
| F-PLAT-002    | Temporal domain: fiscal calendars, 4-4-5, 53-week, TZ/DST (K22) | 0     | **P0** | L      | PARTIAL                                           |
| F-PLAT-003    | Canonical `financial_facts` store with precision + currency     | 0     | **P0** | L      | PARTIAL (SQLite `gl_entries`)                     |
| F-PLAT-004    | Three-statement integrity assertions, non-disableable           | 0     | **P0** | M      | PARTIAL (oracles test exists; not a runtime gate) |
| F-PLAT-005    | Lineage graph + auditor view (Part XXIV)                        | 1     | **P0** | XL     | NOT STARTED                                       |
| F-SEM-001     | Governed metric store (K21, Part XXXII-B)                       | 1     | **P0** | L      | NOT STARTED                                       |
| F-MDM-001     | MDM + SCD2 dimensions + versioned hierarchies                   | 1     | P0     | XL     | NOT STARTED                                       |
| F-OPS-001     | Model branch / release / promotion                              | 1     | P0     | L      | PARTIAL                                           |
| F-OPS-002     | Dev / UAT / Prod environments (K26)                             | 1     | **P0** | M      | NOT STARTED                                       |
| F-SEC-001     | OIDC/SAML SSO + MFA                                             | 0→1   | P0     | L      | PARTIAL (JWT auth)                                |
| F-SEC-002     | RLS two-layer (DB + app)                                        | 0     | **P0** | L      | PARTIAL (app-only)                                |
| F-SEC-003     | Field-level masking, enforced in API + exports                  | 1     | P0     | M      | NOT STARTED                                       |
| F-SEC-004     | SCIM + JML + SoD + break-glass (K24, Part XLVI)                 | 2     | P0     | L      | NOT STARTED                                       |
| F-AUDIT-001   | Server-authoritative append-only audit + evidence sink          | 0→1   | **P0** | L      | PARTIAL (client chain + SQLite `audit_log`)       |
| F-CLOSE-001   | Close orchestration (calendar, SLA, tasks)                      | 2     | P0     | L      | PARTIAL                                           |
| F-CLOSE-002   | Period close = DB-level immutability                            | 1     | **P0** | M      | PARTIAL (`periodCloseLifecycle`)                  |
| F-CTRL-001    | Maker-checker on all monetary mutations                         | 2     | P0     | M      | NOT STARTED                                       |
| F-CTRL-002    | SOX/ICFR evidence model                                         | 3     | P1     | L      | PARTIAL                                           |
| F-ERR-001     | Stable error-code registry (Part LX)                            | 0     | P1     | S      | NOT STARTED                                       |
| F-MIGRATE-001 | Excel deconstruction protocol (Part XXVIII)                     | 2     | P1     | XL     | NOT STARTED                                       |
| F-UDF-001     | Wasm-sandboxed user-defined functions (Part XXVI)               | 3     | P2     | XL     | NOT STARTED (`src/wasm` scaffold only)            |

## 3.7.1 F-DESK — Windows desktop application (Section 23)

The repository already ships a Tauri 2 desktop app that the blueprint did not describe.
These features govern it. Full specification in **Section 23**; per §23.8 none may be marked
`BUILT` until executed on real Windows, because this environment has no `cargo`/`rustc`.

| ID         | Feature                                          | Phase | Prio   | Size | Status                                                            |
| ---------- | ------------------------------------------------ | ----- | ------ | ---- | ----------------------------------------------------------------- |
| F-DESK-001 | Native local SQLite database (`%APPDATA%`)       | 0     | **P0** | M    | PARTIAL (`tauri-plugin-sql`, 35 tables in `src-tauri/migrations`) |
| F-DESK-002 | True offline modelling                           | 1     | P0     | L    | PARTIAL (local-first stores; authority undefined — W0.8)          |
| F-DESK-003 | File associations + drag-drop import             | 1     | P1     | M    | NOT STARTED                                                       |
| F-DESK-004 | Watched-folder ingestion                         | 2     | P2     | M    | NOT STARTED                                                       |
| F-DESK-005 | Native print + page setup                        | 1     | P1     | M    | NOT STARTED                                                       |
| F-DESK-006 | OS credential storage (Credential Manager)       | 0     | **P0** | S    | PARTIAL (`secure_storage.rs`, `keyring` 3 — unverified)           |
| F-DESK-007 | Global shortcut + system tray                    | 2     | P2     | S    | PARTIAL (plugins present, unwired)                                |
| F-DESK-008 | Native OS notifications                          | 2     | P2     | S    | PARTIAL (plugin present)                                          |
| F-DESK-009 | Multi-window / detach to second monitor          | 2     | P1     | M    | PARTIAL (`window-state` plugin present)                           |
| F-DESK-010 | Signed auto-update, policy-disableable           | 1     | P1     | M    | NOT STARTED (dependency present, **unconfigured** — §23.5)        |
| F-DESK-011 | Local Excel round-trip (open→edit→save in place) | 2     | P1     | XL   | NOT STARTED                                                       |
| F-DESK-012 | Crash reporting with money/PII redaction         | 1     | **P0** | S    | PARTIAL (`crash_reporter.rs`; redaction unverified)               |

## 3.8 Feature-count reconciliation

| Bucket                       | Count                                     |
| ---------------------------- | ----------------------------------------- |
| Total specified features     | 113                                       |
| `BUILT`                      | 33                                        |
| `PARTIAL`                    | 42                                        |
| `BUILT` or `PARTIAL` today   | 75                                        |
| `NOT STARTED`                | 38                                        |
| P0 items still `NOT STARTED` | **13** ← this is the true project backlog |

Counts are derived by machine from the tables in §3.1–§3.7.1, not asserted by hand:

```bash
sed -n '/^# SECTION 3/,/^# SECTION 4/p' .agent/BLUEPRINT.md \
  | grep -E '^\| \*?\*?F-[A-Z]+-[0-9]{3}' > /tmp/frows.txt
wc -l < /tmp/frows.txt                                                  # 113 total
grep -o 'NOT STARTED\|PARTIAL\|BUILT' /tmp/frows.txt | sort | uniq -c  # 33 / 38 / 42
grep 'NOT STARTED' /tmp/frows.txt | grep -E '\bP0\b' | wc -l           # 13
```

The 13 open P0 items are: F-PLAT-001, F-PLAT-005, F-SEM-001, F-MDM-001, F-OPS-002,
F-SEC-003, F-SEC-004, F-CTRL-001, F-AI-011, F-INTEGRATE-000, F-WORKFLOW-007,
F-WORKFLOW-008, F-COLLAB-002.

F-ERR-001 (error registry) is **P1** in §3.7 yet scheduled in Phase 0 as Workstream 0.4:
it is cheap and every later phase's error contract depends on it, so it is pulled forward.
It is counted as P1 so the P0 backlog number stays honest.

Three P0 desktop items (F-DESK-001, F-DESK-006, F-DESK-012) are `PARTIAL` rather than
`NOT STARTED` because the Tauri implementation exists in-repo — but per §23.8 **none may be
promoted to `BUILT` from this sandbox**, which has no `cargo`/`rustc` and no Windows.

**Count history (§22.6 requires corrections be visible, not silent):**

| Session | Total | Built | Partial | Not started | P0 open | Note                                      |
| ------- | ----- | ----- | ------- | ----------- | ------- | ----------------------------------------- |
| 003     | 96    | —     | —       | 35          | 14      | Hand-tallied; **wrong on every line**     |
| 004     | 98    | 33    | 35      | 30          | 13      | Machine-derived for the first time        |
| 005     | 113   | 33    | 42      | 38          | 13      | +12 F-DESK (§23) +3 escape-driven (§24.5) |

**This list, not the 193 routes, is the measure of remaining work.**
