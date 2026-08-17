# OMNIPLAN — LOCKED ENGINEERING BLUEPRINT

> **Artifact:** `.agent/BLUEPRINT.md`
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

# SECTION 4 — SYSTEM ARCHITECTURE

## 4.1 The architecture decision (ADR-003, binding)

**Decision: evolve the existing two-plane local-first architecture into a
governed control plane. Do NOT rewrite to the Codex "recommended stack".**

Article XVIII-G recommends Next.js + Fastify + PostgreSQL + Drizzle + Redis + BullMQ.
K2 requires probing that recommendation against the actual environment before adopting it.
The probe result (Section 4.2) is decisive: this repository is 455,514 lines of React 19 +
Vite + Zustand + Express + SQLite with 1,228 green test files, and the sandbox has **no
Docker, no PostgreSQL, no Redis, 2 cores, 3 GB RAM**. A wholesale migration would:

1. discard a verified-green 1,228-file test suite (violates K14, K15);
2. produce zero improvement in financial correctness (violates K18 priority ordering);
3. be unverifiable in this environment — no Postgres to run RLS tests against (violates K2);
4. take multiple quarters before the first correct number moves (violates K15).

**Therefore the canonical architecture is the two-plane model, and the Codex stack
recommendation is recorded as a Phase 3+ option gated on evidence, not a Phase 0 mandate.**
This is an explicit, reasoned deviation from XVIII-G, permitted by K2 and K15, and is
logged as ADR-003 in Section 21.

## 4.2 Capability probe (K2 — measured, 2026-08-17)

| Capability                       | Present        | Consequence for architecture                                                                                                                                          |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node` v22.22.3 / `npm` 10.9.8   | ✅             | TypeScript everywhere; single language.                                                                                                                               |
| `git` 2.39.5 / `gh` 2.23.0       | ✅             | GitOps model lifecycle viable (Part XL).                                                                                                                              |
| `python3` 3.11.2                 | ✅             | Available for offline analysis; **not** in the product runtime.                                                                                                       |
| `docker`                         | ❌             | No containerised Postgres/Redis. Compose-based dev is NOT provable here.                                                                                              |
| `cargo` / `rustc`                | ❌             | **Rust/Wasm hot paths cannot be built or verified.** Tauri desktop builds are unverifiable in-sandbox; the Rust source under `src-tauri/` must not be modified blind. |
| PostgreSQL                       | ❌             | RLS cannot be implemented at the Postgres level today. Portable design required.                                                                                      |
| Redis                            | ❌             | No BullMQ. Queueing must degrade to an in-process/SQLite-backed outbox.                                                                                               |
| CPU / RAM                        | 2 cores / 3 GB | Full frontend suite must run sharded; heap flags are load-bearing.                                                                                                    |
| Network egress                   | ✅             | Live connector work possible; not required for Phase 0.                                                                                                               |
| GitHub Actions `workflows` scope | ❌             | **Standing constraint** — CI changes ship as `ci-patches/*.patch` for human `git apply`.                                                                              |

## 4.3 Canonical architecture — two planes

```
┌───────────────────────────────────────────────────────────────────────┐
│  PLANE A — OMNIPLAN WORKSPACE  (React 19 · Vite · Tauri/PWA)          │
│  Local-first modelling. Fast, offline-capable, analyst-grade.         │
│                                                                       │
│   UI Shell (Ledger design system, 5 pillars, Ctrl+K palette)           │
│        │                                                              │
│   Grid (AG Grid) · Charts (Recharts) · Forms (Zod)                    │
│        │                                                              │
│   Zustand stores (44)  ── draft state, optimistic, offline queue      │
│        │                                                              │
│   Calculation Core (187 engines, pure TS, decimal.js)                 │
│     FormulaEngine · CalculationGraph (DAG) · PrecisionLayer           │
│     Consolidation · Allocation · Scenario · Variance · CashFlow       │
│     CapEx · Headcount · Forecast · Validation                         │
│        │                                                              │
│   Local persistence: encrypted IndexedDB / SQLite (Tauri)             │
│   Web Workers: MonteCarlo, bulk recalc, import parsing                │
└──────────────────────────────┬────────────────────────────────────────┘
                               │  Command/Sync protocol (idempotent,
                               │  signed, replayable, conflict-typed)
┌──────────────────────────────┴────────────────────────────────────────┐
│  PLANE B — OMNIPLAN CONTROL PLANE  (Node · Express → Fastify · SQL)   │
│  Authority. Nothing is official until it passes through here.         │
│                                                                       │
│   API layer  ── authn (OIDC/SAML/JWT) · authz · rate limit · Zod      │
│   Policy service ── RLS predicates · field masks · SoD · entitlements │
│   Command handlers ── maker-checker · period locks · idempotency keys │
│   Financial fact store ── financial_facts, immutable, versioned       │
│   Lineage graph ── append-only nodes + edges                          │
│   Metric store ── governed definitions, versioned (K21)               │
│   Workflow engine ── declarative state machines (Part XXV)            │
│   Audit sink ── append-only, hash-chained, tamper-evident             │
│   Integration hub ── adapters · inbox/outbox · DLQ · reconciliation   │
│   Job runner ── SQLite-backed outbox (Redis/BullMQ when available)    │
│   Storage: SQLite (dev/single-tenant) → PostgreSQL (multi-tenant)     │
└───────────────────────────────────────────────────────────────────────┘
```

## 4.4 The authority rule (non-negotiable)

> Local calculation may support **draft** work. **Official** reports, locks,
> certifications, approvals, journal posting, and published forecasts are
> authoritative **only** after server-side validation and immutable evidence capture.

The workspace is never a loophole around policy. A number computed locally and never
confirmed by the control plane is `DRAFT` and must be visually marked as such.

## 4.5 Evolution path (evidence-driven, not premature)

| Stage          | Trigger (measured, not guessed)                   | Change                                                                              |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| S0 — today     | —                                                 | Express + SQLite, single tenant                                                     |
| S1 — Phase 0/1 | tenancy work begins                               | Repository pattern + `tenant_id` everywhere; SQL kept portable (ANSI subset)        |
| S2 — Phase 2   | 2+ tenants OR > 10M facts OR RLS required in prod | Swap SQLite → PostgreSQL 16 behind the same repository interface; enable native RLS |
| S3 — Phase 2/3 | p95 calc > 2s at target scale                     | Extract calculation engine as a service                                             |
| S4 — Phase 3   | multi-region demand                               | Extract integration hub; regional deployments                                       |

**S2 is the only migration that is architecturally significant.** It is made cheap by
requiring, from Phase 0, that no SQLite-specific SQL leaks outside `server/src/db/`.

## 4.6 Portability contract (enables S2 without a rewrite)

```
PC1  All SQL lives under server/src/db/. No SQL string in a route handler.
PC2  Only the ANSI subset both SQLite and PostgreSQL support is used.
     Exceptions live in a dialect adapter with one implementation per engine.
PC3  Money columns: DECIMAL(28,10) in Postgres; TEXT (canonical decimal string)
     in SQLite. Never REAL/FLOAT in either. (RULE D1)
PC4  Row-level security is expressed once as a policy predicate, applied twice:
     (a) as a Postgres RLS policy when available,
     (b) as a mandatory query-builder filter in every read path.
     The app-layer filter is NOT optional even under Postgres (defence in depth).
PC5  Every migration is forward-only, numbered, and has a rehearsal test.
```

## 4.7 Frontend architecture

```
src/
  App.tsx                193 lazy routes  →  remapped onto 5 pillars (Section 9.3)
  pages/        (203)    route components; thin — orchestration only
  components/   (287)    presentational + pattern components
  engines/      (187)    PURE functions. No React, no store, no I/O. Testable alone.
  store/         (44)    Zustand. Draft state + sync queue. No business math.
  domain/                canonical types: Account, Entity, Period, Scenario, Fact
  utils/money.ts         THE money primitive. decimal.js. Single source of truth.
  workers/               Monte Carlo, bulk recalc, import parse
  sdk/                   typed client for the control plane
```

**Layering law (enforced by `scripts/architecture-guardrails.mjs`):**
`pages → components → store → engines → utils`. Arrows never reverse.
An engine importing from `store/` or `components/` is a build failure.

## 4.8 Stack decision record — what stays, what changes

| Layer         | Today                   | Decision                                                     | Rationale                                                                                        |
| ------------- | ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| UI framework  | React 19 + Vite 8       | **KEEP**                                                     | Modern, fast, 1,228 tests depend on it. Next.js buys SSR that a finance workspace does not need. |
| Desktop       | Tauri 2                 | **KEEP, do not modify blind**                                | No `cargo` in sandbox; Rust changes are unverifiable (K2).                                       |
| State         | Zustand                 | **KEEP**                                                     | Codex-recommended.                                                                               |
| Grid          | AG Grid 35              | **KEEP**                                                     | Codex-recommended, best-in-class.                                                                |
| Charts        | Recharts                | **KEEP**                                                     | Codex-listed alternative.                                                                        |
| Money         | decimal.js              | **KEEP, ENFORCE**                                            | Codex-mandated. Gap is adoption, not choice.                                                     |
| Validation    | Zod 4                   | **KEEP**                                                     | Codex-recommended.                                                                               |
| API server    | Express 5               | **KEEP through Phase 1**, evaluate Fastify at S3             | Rewriting the transport does not move a number.                                                  |
| Database      | SQLite (better-sqlite3) | **KEEP for dev/single-tenant**, Postgres at S2               | No Docker/Postgres available to verify against today.                                            |
| Queue         | none                    | **SQLite-backed outbox**, BullMQ at S2                       | No Redis. Degrade honestly (K2).                                                                 |
| Calc hot path | TypeScript              | **KEEP.** Rust/Wasm is `NON-GOAL` until `cargo` exists in CI | Cannot build or verify it.                                                                       |
| ORM           | hand-rolled SQL         | **Repository pattern**, no heavy ORM                         | Preserves PC1/PC2 portability.                                                                   |

---

# SECTION 5 — DATA ARCHITECTURE

## 5.1 Canonical schema (normative)

Types shown as PostgreSQL. SQLite mappings per PC3. Every table carries `tenant_id`
from Phase 0 — retrofitting tenancy later is the single most expensive mistake available.

```sql
-- ── TENANCY ────────────────────────────────────────────────────────────
tenants (
  id UUID PK, name TEXT NOT NULL, plan TEXT NOT NULL,
  fiscal_year_start SMALLINT NOT NULL,        -- 1..12
  fiscal_calendar_type TEXT NOT NULL,         -- gregorian|445|454|544|52_53_week
  base_currency CHAR(3) NOT NULL,             -- ISO 4217
  industry_vertical TEXT NOT NULL,
  data_residency_region TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL, settings JSONB NOT NULL DEFAULT '{}'
)

-- ── ENVIRONMENTS (K26) ─────────────────────────────────────────────────
environments (
  id UUID PK, tenant_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('dev','uat','prod')),
  is_default BOOLEAN NOT NULL, promoted_from UUID NULL, created_at TIMESTAMPTZ
)

-- ── ENTITY HIERARCHY ───────────────────────────────────────────────────
entities (
  id UUID PK, tenant_id UUID NOT NULL, parent_id UUID NULL,
  code TEXT NOT NULL, name TEXT NOT NULL,
  type TEXT NOT NULL,                          -- legal|cost_center|profit_center|project
  functional_currency CHAR(3) NOT NULL,
  is_consolidation_entity BOOLEAN NOT NULL,
  ownership_pct DECIMAL(9,6) NULL,             -- for NCI
  valid_from DATE NOT NULL, valid_to DATE NULL,   -- SCD2 (MDM2)
  metadata JSONB, UNIQUE (tenant_id, code, valid_from)
)

-- ── CHART OF ACCOUNTS ──────────────────────────────────────────────────
accounts (
  id UUID PK, tenant_id UUID NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  sub_type TEXT NOT NULL,
  normal_balance CHAR(1) NOT NULL CHECK (normal_balance IN ('D','C')),
  is_calculated BOOLEAN NOT NULL DEFAULT FALSE,
  statement TEXT NOT NULL CHECK (statement IN ('PL','BS','CF','MEMO')),
  parent_id UUID NULL, tags TEXT[], gl_code_map JSONB,
  valid_from DATE NOT NULL, valid_to DATE NULL,
  UNIQUE (tenant_id, code, valid_from)
)

-- ── DIMENSIONS (extensible, SCD2) ──────────────────────────────────────
dimensions      (id UUID PK, tenant_id UUID, code TEXT, name TEXT, cardinality_hint INT)
dimension_members (
  id UUID PK, tenant_id UUID NOT NULL, dimension_id UUID NOT NULL,
  business_key TEXT NOT NULL, name TEXT NOT NULL, parent_id UUID NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','active','frozen','merged','retired')),
  merged_into UUID NULL,
  valid_from DATE NOT NULL, valid_to DATE NULL,     -- MDM2
  external_ids JSONB NOT NULL DEFAULT '{}',         -- MDM10
  UNIQUE (tenant_id, dimension_id, business_key, valid_from)
)
hierarchies         (id UUID PK, tenant_id UUID, dimension_id UUID, name TEXT, version INT)
hierarchy_edges     (hierarchy_id UUID, parent_member_id UUID, child_member_id UUID,
                     weight DECIMAL(9,6) NOT NULL DEFAULT 1, valid_from DATE, valid_to DATE)

-- ── TIME (K22) ─────────────────────────────────────────────────────────
periods (
  id UUID PK, tenant_id UUID NOT NULL,
  fiscal_year SMALLINT NOT NULL, fiscal_period SMALLINT NOT NULL,
  fiscal_quarter SMALLINT NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL,   -- inclusive, half-open in code
  week_count SMALLINT NULL,                            -- 4|5 for 4-4-5; 53-week flag
  is_adjustment_period BOOLEAN NOT NULL DEFAULT FALSE, -- period 13
  status TEXT NOT NULL CHECK (status IN ('open','soft_closed','closed','reopened')),
  closed_at TIMESTAMPTZ NULL, closed_by UUID NULL,
  UNIQUE (tenant_id, fiscal_year, fiscal_period)
)

-- ── BOOKS (K23) ────────────────────────────────────────────────────────
books (id UUID PK, tenant_id UUID, code TEXT,  -- MGMT|IFRS|LOCAL_xx|TAX
       basis TEXT, parent_book_id UUID NULL, description TEXT)

-- ── SCENARIOS / VERSIONS ───────────────────────────────────────────────
scenarios (
  id UUID PK, tenant_id UUID NOT NULL, environment_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('actual','budget','forecast','strategic','what_if')),
  base_scenario_id UUID NULL, branch_of UUID NULL,
  locked_at TIMESTAMPTZ NULL, locked_by UUID NULL,   -- immutable once set (XIX-B)
  created_by UUID NOT NULL, description TEXT
)

-- ── THE FACT TABLE (the heart) ─────────────────────────────────────────
financial_facts (
  id UUID PK,
  tenant_id UUID NOT NULL, environment_id UUID NOT NULL,
  entity_id UUID NOT NULL, account_id UUID NOT NULL,
  scenario_id UUID NOT NULL, period_id UUID NOT NULL, book_id UUID NOT NULL,
  dim_values JSONB NOT NULL DEFAULT '{}',      -- {dimension_code: member_id}
  amount DECIMAL(28,10) NOT NULL,              -- RULE D1 — never FLOAT
  currency CHAR(3) NOT NULL,                   -- RULE D2 — never bare
  amount_reporting DECIMAL(28,10) NOT NULL,
  reporting_currency CHAR(3) NOT NULL,
  fx_rate DECIMAL(18,8) NOT NULL,              -- RULE D5 — stored, not recomputed
  fx_rate_type TEXT NOT NULL,                  -- opening|closing|average|budget|custom|historical
  source TEXT NOT NULL CHECK (source IN ('manual','imported','calculated','ai_forecast','allocated','eliminated')),
  source_ref TEXT NULL,
  lineage_node_id UUID NOT NULL,               -- RULE D4 — mandatory
  entered_by UUID NOT NULL, entered_at TIMESTAMPTZ NOT NULL,
  approved_by UUID NULL, approved_at TIMESTAMPTZ NULL,
  note TEXT NULL,
  version INT NOT NULL DEFAULT 1,
  superseded_by UUID NULL,                     -- restatement chain
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE    -- RULE D6 — soft delete only
)

-- ── FX ─────────────────────────────────────────────────────────────────
fx_rates (
  id UUID PK, tenant_id UUID NOT NULL,
  from_currency CHAR(3), to_currency CHAR(3),
  period_id UUID NOT NULL, rate_type TEXT NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  source TEXT NOT NULL,                        -- user|ecb|oxr|csv
  locked BOOLEAN NOT NULL DEFAULT FALSE,       -- budget rates
  UNIQUE (tenant_id, from_currency, to_currency, period_id, rate_type)
)

-- ── LINEAGE (Part XXIV) ────────────────────────────────────────────────
lineage_nodes (
  id UUID PK, tenant_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SOURCE','TRANSFORM','CALCULATE','OUTPUT')),
  label TEXT NOT NULL, metadata JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL
)
lineage_edges (
  source_id UUID NOT NULL, target_id UUID NOT NULL,
  operation_type TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL, diff JSONB,
  PRIMARY KEY (source_id, target_id, occurred_at)
)   -- APPEND-ONLY. No UPDATE, no DELETE. Enforced by trigger.

-- ── METRIC STORE (K21) ─────────────────────────────────────────────────
metrics (
  id TEXT PK,                                  -- e.g. metric.net_revenue
  tenant_id UUID NULL,                         -- NULL = system-defined
  name JSONB NOT NULL,                         -- {en: "...", de: "..."}
  description TEXT NOT NULL, formula_ast JSONB NOT NULL,
  grain TEXT[] NOT NULL, unit TEXT NOT NULL, books TEXT[] NOT NULL,
  owners UUID[] NOT NULL,
  version INT NOT NULL, certified_at TIMESTAMPTZ NULL,
  changelog TEXT NOT NULL,
  gaap_reconciliation_metric TEXT NULL,        -- MET4
  UNIQUE (id, version)
)

-- ── AUDIT (immutable, append-only) ─────────────────────────────────────
audit_log (
  id UUID PK, tenant_id UUID NOT NULL, user_id UUID NULL,
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID NULL,
  field_changed TEXT NULL, old_value TEXT NULL, new_value TEXT NULL,
  ip_address INET NULL, session_id TEXT NULL, correlation_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL, metadata JSONB,
  prev_hash BYTEA NOT NULL, entry_hash BYTEA NOT NULL   -- tamper-evident chain
)   -- NO UPDATE. NO DELETE. DB-level enforcement (XIX-B).

-- ── WORKFLOW (Part XXV) ────────────────────────────────────────────────
workflow_definitions (id UUID PK, tenant_id UUID, code TEXT, version INT,
                      machine JSONB NOT NULL)      -- states, transitions, guards
workflow_instances   (id UUID PK, tenant_id UUID, definition_id UUID,
                      subject_type TEXT, subject_id UUID,
                      current_state TEXT NOT NULL, context JSONB,
                      created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
workflow_transitions (id UUID PK, instance_id UUID, from_state TEXT, to_state TEXT,
                      actor_id UUID, reason TEXT, occurred_at TIMESTAMPTZ)

-- ── INTEGRATIONS (Part LI) ─────────────────────────────────────────────
integrations       (id UUID PK, tenant_id UUID, type TEXT, name TEXT,
                    config_encrypted BYTEA, credential_ref TEXT,
                    last_sync_at TIMESTAMPTZ, sync_status TEXT, field_mapping JSONB)
integration_inbox  (id UUID PK, integration_id UUID, external_id TEXT,
                    payload JSONB, received_at TIMESTAMPTZ, processed_at TIMESTAMPTZ NULL,
                    UNIQUE (integration_id, external_id))   -- idempotency
integration_outbox (id UUID PK, tenant_id UUID, topic TEXT, payload JSONB,
                    attempts INT NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ,
                    delivered_at TIMESTAMPTZ NULL, dead_lettered_at TIMESTAMPTZ NULL)
integration_sync_log (id UUID PK, integration_id UUID, started_at TIMESTAMPTZ,
                    completed_at TIMESTAMPTZ, records_processed INT,
                    records_failed INT, reconciliation JSONB, error_log JSONB)

-- ── REPORTING ──────────────────────────────────────────────────────────
saved_reports    (id UUID PK, tenant_id UUID, name TEXT, type TEXT, config JSONB,
                  created_by UUID, is_public BOOLEAN, schedule JSONB)
report_snapshots (id UUID PK, tenant_id UUID, report_id UUID,
                  rendered_at TIMESTAMPTZ, metric_versions JSONB NOT NULL,
                  content_hash BYTEA NOT NULL, storage_ref TEXT NOT NULL,
                  certified_by UUID NULL, certified_at TIMESTAMPTZ NULL)
```

## 5.2 Critical data rules (normative, testable)

| Rule | Statement                                                                   | Enforcement                                                      |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| D1   | Money columns are `DECIMAL(28,10)`; never FLOAT/DOUBLE/REAL.                | Migration lint + `tests/financial/precision-no-float.spec.ts`    |
| D2   | Every monetary value carries an ISO 4217 currency code.                     | Type system: `Money = {amount: Decimal, currency: CurrencyCode}` |
| D3   | Actuals in closed periods are immutable; corrections are adjusting entries. | DB constraint on `periods.status='closed'`                       |
| D4   | Every fact has `lineage_node_id NOT NULL`.                                  | Schema constraint                                                |
| D5   | FX rate is stored with the fact, never recomputed on read.                  | Column `fx_rate NOT NULL`; no read-path FX lookup                |
| D6   | Soft delete only. Financial data is never physically purged.                | `is_deleted`; DELETE grants revoked                              |
| D7   | Tenancy is enforced at row level, not application level only.               | PC4 dual enforcement                                             |
| D8   | Indexes cover every query path.                                             | Section 5.3                                                      |
| D9   | No SQL outside `server/src/db/`.                                            | `scripts/architecture-guardrails.mjs`                            |
| D10  | Every dimension member is SCD2 with `valid_from`/`valid_to`.                | Schema + MDM tests                                               |

## 5.3 Indexing strategy

```sql
CREATE INDEX fact_primary_path ON financial_facts
  (tenant_id, environment_id, scenario_id, period_id, entity_id, account_id)
  WHERE is_deleted = FALSE;
CREATE INDEX fact_account_scan ON financial_facts
  (tenant_id, account_id, period_id) WHERE is_deleted = FALSE;
CREATE INDEX fact_lineage      ON financial_facts (lineage_node_id);
CREATE INDEX fact_dims_gin     ON financial_facts USING GIN (dim_values);
CREATE INDEX audit_correlation ON audit_log (tenant_id, correlation_id, occurred_at);
CREATE INDEX audit_entity      ON audit_log (tenant_id, entity_type, entity_id, occurred_at);
CREATE INDEX lineage_reverse   ON lineage_edges (target_id);
CREATE INDEX outbox_pending    ON integration_outbox (next_attempt_at)
  WHERE delivered_at IS NULL AND dead_lettered_at IS NULL;
```

Partitioning (Postgres, S2+): `financial_facts` LIST-partitioned by `tenant_id`,
then RANGE sub-partitioned by `period_id` fiscal year. Facts are sparse — a dense
cube is a `NON-GOAL` (Part L).

## 5.4 Migration plan

| #    | Migration                                                         | Phase | Reversible               | Rehearsal                                 |
| ---- | ----------------------------------------------------------------- | ----- | ------------------------ | ----------------------------------------- |
| M001 | Add `tenant_id` to all existing tables, backfill `DEFAULT_TENANT` | 0     | yes                      | required                                  |
| M002 | Create `environments`; backfill every row to `prod`               | 0     | yes                      | required                                  |
| M003 | Money columns → decimal-string TEXT (SQLite) / DECIMAL (PG)       | 0     | **no** — data conversion | **mandatory dual-write rehearsal**        |
| M004 | Create `lineage_nodes`/`lineage_edges` + append-only triggers     | 1     | yes                      | required                                  |
| M005 | Add `lineage_node_id` to facts, backfill `SOURCE:legacy`          | 1     | yes                      | required                                  |
| M006 | Create `metrics`; seed system metrics                             | 1     | yes                      | required                                  |
| M007 | Create `books`; backfill `MGMT`                                   | 1     | yes                      | required                                  |
| M008 | SCD2 columns on dimension tables                                  | 1     | yes                      | required                                  |
| M009 | Workflow tables                                                   | 1     | yes                      | required                                  |
| M010 | Audit hash-chain columns + backfill genesis hash                  | 1     | **no**                   | **mandatory rehearsal**                   |
| M011 | Integration inbox/outbox                                          | 1     | yes                      | required                                  |
| M012 | Report snapshots                                                  | 2     | yes                      | required                                  |
| M013 | SQLite → PostgreSQL cutover                                       | S2    | via restore              | **full dress rehearsal + reconciliation** |

**Migration law:** forward-only, numbered, idempotent, and every one has a test that
runs it against a seeded database and asserts row counts and monetary sums are preserved
to the cent. Irreversible migrations (M003, M010, M013) require a verified backup first (K3).

---

# SECTION 6 — FINANCIAL ENGINE SPECIFICATION

## 6.1 Engine map

```
FinancialEngine
├── PrecisionLayer         decimal.js · banker's/half-up · currency · penny allocation
├── FormulaParser          Excel-compatible syntax → AST · cycle detection
├── CalculationGraph       DAG · topological sort · incremental recalc
├── ConsolidationEngine    multi-entity · eliminations · NCI · FX translation
├── AllocationEngine       %, headcount, revenue, custom driver
├── ScenarioEngine         branch · compare · delta · merge
├── ForecastEngine         naive · linear · Holt-Winters · ARIMA · ensemble
├── VarianceEngine         absolute · % · favourable/unfavourable · drill path
├── CashFlowEngine         direct + indirect · FCF · working capital
├── CapExEngine            asset register · SL/DB/SOYD/UOP depreciation
├── HeadcountEngine        FTE · comp · benefits load · attrition
├── PeriodEngine           fiscal calendars · 4-4-5 · 53-week · adjustment periods
└── ValidationEngine       three-statement assertions · sign rules · reconciliation
```

All engines are **pure**: `(inputs) → outputs`, no React, no store, no I/O, no clock
access (time is injected). This is why they are testable in isolation and why the
1,228-file suite can run without a browser.

## 6.2 Formula engine rules

| Rule | Statement                                                                                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1   | Circular dependency detection **before** any calculation. Fail fast, never silent.                                                                                                                      |
| F2   | Calculation order is deterministic (topological sort of the DAG).                                                                                                                                       |
| F3   | Rounding is applied at the **output** layer, never mid-calculation.                                                                                                                                     |
| F4   | Division by zero → `NULL` + logged warning. Never `NaN`, never `Infinity`.                                                                                                                              |
| F5   | Formula errors surface with the formula text and the offending value.                                                                                                                                   |
| F6   | Formulas are stored as **AST**, never as strings.                                                                                                                                                       |
| F7   | Formula changes trigger **incremental** recalculation of affected nodes only.                                                                                                                           |
| F8   | FX translation follows IAS 21: P&L at average, BS at closing, CTA to equity. Non-negotiable, tested.                                                                                                    |
| F9   | Iterative/circular models (e.g. interest-on-average-debt) are allowed **only** via an explicit, bounded solver with a convergence tolerance and a max-iteration cap; silent circularity remains banned. |

## 6.3 Three-statement integrity rules (Severity-0)

| Rule | Assertion                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------ |
| TS1  | Net Income (P&L) flows to Retained Earnings (BS).                                                      |
| TS2  | Cash (BS) = ending cash (CF statement).                                                                |
| TS3  | Total Assets = Total Liabilities + Total Equity.                                                       |
| TS4  | TS1–TS3 run after **every** save, import, and calculation. **They cannot be disabled.**                |
| TS5  | A violation blocks the write and returns a structured error naming the failing identity and the delta. |

TS4 is currently a **test-time** check in this repo (`financialStatementOracles.test.ts`).
Promoting it to a **runtime, non-disableable gate** is Phase 0 work item F-PLAT-004.

## 6.4 Arithmetic contract (Part XIX-A)

```
NEVER use IEEE-754 floating point for monetary values.
NEVER compare money with == (use exact decimal comparison).
NEVER truncate — round explicitly with a documented rule.
NEVER store a currency-agnostic amount.
NEVER aggregate across currencies without explicit FX conversion.
NEVER silently drop precision — log and alert.
```

Violation of any of the above is a **Severity-0 defect that blocks all other work**.

Rounding policy: `ROUND_HALF_UP` for currency presentation by default (as implemented in
`src/utils/money.ts`); banker's rounding (`ROUND_HALF_EVEN`) is available and required
where a jurisdiction or standard demands it — the choice is explicit at the call site and
recorded, never implicit. Residuals from proportional splits are allocated deterministically
so parts always sum exactly to the parent.

**Deviation from the Codex, recorded (ADR-012).** Codex XVIII-G line 522 mandates
_"Banker's rounding (round-half-to-even) as default"_. This blueprint defaults to
`ROUND_HALF_UP` instead. The Codex is internally inconsistent on this point: line 692
requires that _"0.005 rounds to 0.01 (banker's rounding)"_, but banker's rounding returns
`0.00` for that input, not `0.01` — verified:

```
new Decimal('0.005').toDecimalPlaces(2, ROUND_HALF_EVEN) === 0     // Codex line 522 label
new Decimal('0.005').toDecimalPlaces(2, ROUND_HALF_UP)   === 0.01  // Codex line 692 test
```

Both mandates cannot hold. We implement the **behaviour the Codex tests for** (line 692)
rather than the **label it uses** (line 522), because the test is the falsifiable artefact.
The consequence is stated rather than hidden: HALF_UP carries a small upward bias on exact
half values — immaterial for presentation, **not** acceptable for statutory allocation in
jurisdictions that require half-even. Therefore `ROUND_HALF_EVEN` is mandatory, explicitly
at the call site, for tax provision (A.7), statutory local-GAAP books (A.3), and any
jurisdiction pack that declares it. `roundMoney()` accepts an explicit mode and no statutory
path may rely on the default. Full record: **ADR-012, §21**.

## 6.5 FX protocol (Part XIX-E)

Rate priority: user-entered (board-approved) > integrated feed (ECB/OXR) > CSV import.
Rate types stored: opening, closing, average, budget (locked), custom, historical.

| Account class            | IAS 21 rate                                 |
| ------------------------ | ------------------------------------------- |
| P&L                      | Average                                     |
| Balance sheet (monetary) | Closing                                     |
| Equity                   | Historical (at transaction date)            |
| CTA                      | Balancing figure to equity, auto-calculated |

Every rate application is stored with the translated amount (RULE D5). Reports may be
re-run at any rate type for comparison, which creates a _new_ result set — it never
mutates the stored fact.

## 6.6 Reconciliation contract (Part XIX-C)

After every import or bulk calculation, a reconciliation report must show: records
imported vs processed; sum of source amounts vs sum in DB (matching to 2 dp); FX
reconciliation (source × rate = converted); rejected records with reasons; three-statement
check result. **Any failure rolls the whole import back.** Errors are never swallowed.

## 6.7 Period-close protocol (Part XIX-D)

1. Three-statement integrity check — must pass.
2. Reconciliation against source systems.
3. Lock all facts for the period (DB-level constraint).
4. Snapshot scenario state to an immutable archive.
5. Generate the close package (TB, P&L, BS, CF) as a stored artefact.
6. Notify configured recipients.
7. Write the close event to `audit_log` with the approver.

Close is irreversible via API. Reopening requires explicit admin action, a reason, and
generates an audit event. Unmapped accounts block close (XX-B).

## 6.8 Financial rule → test specification map (XVIII-N)

Every normative financial rule in this blueprint has a named test specification. A rule
without a test is an opinion; this table is what makes them contracts. The
`financial:oracles` CI gate walks this table and fails if any listed spec is missing,
skipped, or marked `.todo`.

| Rule     | Statement (abbrev.)                              | Test specification                                                                  | Kind                |
| -------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------- |
| D1       | Amounts are `DECIMAL(28,10)`, never `FLOAT`      | `tests/financial/schema-no-float.spec.ts`                                           | schema assertion    |
| D2       | Every amount carries a currency                  | `tests/financial/currency-required.spec.ts`                                         | property            |
| D3       | Closed-period facts immutable                    | `tests/financial/closed-period-immutable.spec.ts`                                   | negative            |
| D4       | Every fact has a lineage node                    | `tests/financial/lineage-mandatory.spec.ts`                                         | invariant           |
| D5       | FX rate stored with the fact                     | `tests/financial/fx-rate-persisted.spec.ts`                                         | invariant           |
| D6       | Soft delete only                                 | `tests/financial/no-hard-delete.spec.ts`                                            | negative            |
| F1       | Circular dependency detected pre-calc            | `tests/engines/formula/circular-detect.spec.ts`                                     | unit                |
| F2       | Deterministic topological order                  | `tests/engines/formula/deterministic-order.spec.ts`                                 | property            |
| F3       | Rounding at output only                          | `tests/engines/formula/rounding-boundary.spec.ts`                                   | property            |
| F4       | Div-by-zero → `NULL`, never `NaN`/`Infinity`     | `tests/engines/formula/div-zero.spec.ts`                                            | unit                |
| F5       | Errors surface formula text + offending value    | `tests/engines/formula/error-payload.spec.ts`                                       | unit                |
| F6       | Formulas stored as AST                           | `tests/engines/formula/ast-storage.spec.ts`                                         | schema              |
| F7       | Incremental recalc touches only affected nodes   | `tests/engines/formula/incremental-scope.spec.ts`                                   | property            |
| F8       | IAS 21 translation by account class              | `tests/financial/ias21-translation.spec.ts`                                         | golden              |
| F9       | Bounded iterative solver, convergence proven     | `tests/engines/formula/iterative-convergence.spec.ts`                               | property            |
| TS1      | Net income → retained earnings                   | `tests/financial/three-statement.spec.ts`                                           | oracle              |
| TS2      | BS cash = CF ending cash                         | `tests/financial/three-statement.spec.ts`                                           | oracle              |
| TS3      | Assets = Liabilities + Equity                    | `tests/financial/three-statement.spec.ts`                                           | oracle              |
| TS4      | Oracles run at runtime on every write            | `tests/financial/runtime-gate-active.spec.ts`                                       | integration         |
| TS5      | Violation blocks write with `FIN-000` + delta    | `tests/financial/runtime-gate-blocks.spec.ts`                                       | negative            |
| XIX-A.1  | No IEEE-754 in a money path                      | `scripts/guardrails/no-float-money.ts` + `tests/financial/money-float-scan.spec.ts` | static + test       |
| XIX-A.2  | No `==` comparison on money                      | `eslint` rule `omni/no-money-equality` + unit                                       | lint + unit         |
| XIX-A.3  | No truncation; explicit documented rounding      | `tests/unit/money.rounding.spec.ts`                                                 | property + mutation |
| XIX-A.5  | No cross-currency aggregation without FX         | `tests/financial/no-implicit-fx-agg.spec.ts`                                        | negative            |
| XIX-A.6  | No silent precision loss                         | `tests/unit/money.precision.spec.ts`                                                | property            |
| —        | Allocation residuals sum exactly to parent       | `tests/unit/money.allocation.spec.ts`                                               | property            |
| XIX-C    | Import reconciles or fully rolls back            | `tests/integration/import-reconcile-rollback.spec.ts`                               | integration         |
| XIX-D    | 7-step close, irreversible via API               | `tests/integration/period-close-protocol.spec.ts`                                   | integration         |
| IC1      | Post-elimination IC nets to zero                 | `tests/financial/ic-zero.spec.ts`                                                   | golden              |
| IC2      | Investment-in-sub vs equity eliminates           | `tests/financial/consol-investment-elim.spec.ts`                                    | golden              |
| MET4     | Non-GAAP metric declares GAAP reconciliation     | `tests/semantic/non-gaap-reconciliation.spec.ts`                                    | schema              |
| MET5     | Uncertified metric blocked from FINAL packs      | `tests/reporting/uncertified-metric-blocked.spec.ts`                                | negative            |
| FIN-008  | Book mixing rejected at plan time                | `tests/semantic/book-mixing-rejected.spec.ts`                                       | negative            |
| MB5      | Books have independent period status             | `tests/financial/book-period-independence.spec.ts`                                  | integration         |
| A.4.5 R2 | Restatement versions, never overwrites           | `tests/financial/restatement-versioning.spec.ts`                                    | integration         |
| A.4.5 R3 | Prior packs marked SUPERSEDED                    | `tests/reporting/pack-superseded.spec.ts`                                           | integration         |
| A.6      | Deferred revenue waterfall ties to BS            | `tests/financial/revrec-waterfall-tie.spec.ts`                                      | golden              |
| TZ3      | DST transitions never split/duplicate a posting  | `tests/temporal/dst-boundaries.spec.ts`                                             | golden              |
| A.1.4    | Minor units correct (JPY 0, KWD 3, CLP 0)        | `tests/i18n/currency-minor-units.spec.ts`                                           | table-driven        |
| J1       | Journal lines balance                            | `tests/financial/journal-balance.spec.ts`                                           | property            |
| J3       | No posting to a closed period (except reversals) | `tests/financial/journal-closed-period.spec.ts`                                     | negative            |
| J6       | Preparer ≠ poster (SoD)                          | `tests/security/sod-journal.spec.ts`                                                | negative            |
| TR2      | Cash actuals tie to GL cash or close blocks      | `tests/financial/cash-gl-tie.spec.ts`                                               | integration         |
| TR3      | Forecast covenant breach raises a P0 alert       | `tests/integration/covenant-alert.spec.ts`                                          | integration         |
| MDM8     | Unmapped members block close                     | `tests/mdm/unmapped-blocks-close.spec.ts`                                           | negative            |
| PK4      | Every pack ships a golden-numbers test           | `tools/codegen/packs.ts` load check + per-pack golden                               | build gate          |

Rules stated elsewhere as `CL*`, `WF*`, `AP*`, `EN*`, `PR*`, `ST*`, `SYN*` and `N*` carry
their test specs inline in their own sections. The invariant is uniform: **no normative
rule ships without a named, executing spec.**

---

# SECTION 7 — INDUSTRY VERTICAL CONFIGURATION SYSTEM

## 7.1 Architecture

**Packs are data, not code.** A vertical pack must never fork the engine (K19).
A pack that requires an engine change means the engine is under-generalised — fix the
engine, not the pack.

```
packs/{vertical}/
  pack.yaml          id, name, version, engine_compat_range
  kpis.yaml          ≥ 10 KPI definitions, each binding to a metric id (K21)
  coa_mapping.yaml   generic account → industry GL codes
  templates/         pre-built model templates
  reports/           pre-built report definitions
  terminology.yaml   relabel generic terms (Revenue → Premiums for insurance)
  validation.yaml    industry-specific validation rules
  onboarding.yaml    guided setup steps
```

Selection happens at tenant onboarding and is admin-changeable. A holding company may
run multiple packs simultaneously; conflicting terminology resolves per-entity.

## 7.2 Pack contract (enforced by `tools/codegen/packs.ts`)

```
PK1  A pack declares an engine_compat semver range. Loading outside it is refused.
PK2  Every KPI binds to a metric id in the governed metric store. No pack-local math.
PK3  A pack may add dimensions and accounts; it may NOT alter fact semantics.
PK4  A pack ships fixtures + a golden-numbers test. No fixtures = pack does not load.
PK5  terminology.yaml is presentation-only. It never changes a calculation.
PK6  A pack that needs an engine change is REJECTED — generalise the engine instead.
```

## 7.3 Vertical coverage plan

Existing sector configs (15): agriculture, banking, construction, education, energy,
government, healthcare, hospitality, insurance, logistics, manufacturing, realestate,
retail, technology, telecom.

| Wave | Verticals                                                                                               | Phase |
| ---- | ------------------------------------------------------------------------------------------------------- | ----- |
| V1   | SaaS/Technology, Financial Services–Banking, Healthcare Providers, Manufacturing                        | 2     |
| V2   | Retail/CPG, E-commerce, Professional Services, Real Estate                                              | 2     |
| V3   | Insurance, Energy–Utilities, Energy–Oil&Gas, Construction                                               | 3     |
| V4   | Non-profit, Public Sector, Education, Hospitality                                                       | 3     |
| V5   | Telecom, Media, Logistics, Agriculture, Travel, Marketplace, Gaming, Life Sciences, Asset Management/PE | 3     |

**Honesty rule:** a vertical is "supported" only when its pack has ≥ 10 KPIs bound to
metric ids, a COA mapping, ≥ 1 template, ≥ 1 report, and a passing golden-numbers test.
The 15 existing sector configs are **UI configuration**, not packs, and must not be
described as vertical support until migrated to the pack contract.

## 7.4 Example — SaaS pack KPIs (all 10+ required, each metric-bound)

`metric.arr`, `metric.mrr`, `metric.nrr`, `metric.grr`, `metric.logo_churn`,
`metric.rev_churn`, `metric.expansion_mrr`, `metric.cac`, `metric.ltv`,
`metric.ltv_cac_ratio`, `metric.cac_payback_months`, `metric.magic_number`,
`metric.rule_of_40`, `metric.burn_multiple`, `metric.net_new_arr`, `metric.acv`.

Each carries: formula AST, grain, unit, book, owner, tests (identity, sign, GL recon).

---

# SECTION 8 — INTEGRATION ARCHITECTURE

## 8.1 Adapter contract (every integration, no exceptions)

```typescript
interface IntegrationAdapter {
  testConnection(): Promise<ConnectionResult>;
  discover(): Promise<DiscoveryManifest>; // COA, entities, periods
  extract(config: ExtractionConfig): AsyncGenerator<RawRecord>;
  transform(raw: RawRecord, mapping: FieldMapping): CanonicalRecord;
  load(records: CanonicalRecord[]): Promise<LoadResult>;
  reconcile(syncId: string): Promise<ReconciliationReport>;
}
```

## 8.2 Reliability contract (Part LI) — F-INTEGRATE-000

```
IR1  Inbox: every inbound record is stored with (integration_id, external_id) UNIQUE.
     Replaying a sync is a no-op. Idempotency is structural, not hopeful.
IR2  Outbox: every outbound event is persisted before delivery is attempted.
IR3  Retry: exponential backoff with jitter; max 8 attempts; then dead-letter.
IR4  DLQ: dead-lettered items are visible in the UI with the payload and last error,
     and are replayable by an admin after the cause is fixed.
IR5  Every sync produces a reconciliation report (Section 6.6). No report = failed sync.
IR6  Credentials are never stored in plaintext and never logged. Rotation is supported.
IR7  A connector that only parks data without enabling planning, control, and audit
     inside OmniPlan is INCOMPLETE (K28).
IR8  Rate limits and backpressure are respected; a slow source never drops records.
```

**F-INTEGRATE-000 is a hard prerequisite for every connector.** Building a NetSuite
adapter before the inbox/outbox exists produces an unreliable integration that must be
rebuilt. Sequencing is not negotiable.

## 8.3 GL mapping engine (Part XX-B)

Every source GL code maps to a canonical OmniPlan account. Mapping is tenant-configured
with per-ERP suggested defaults. The mapping UI provides fuzzy-match auto-suggestion,
sample transactions per source account for user validation, bulk mapping by account type,
and reusable per-ERP templates. Unmapped accounts land in an `_UNMAPPED` holding account,
raise an alert, and **block period close** (MDM8).

## 8.4 Excel two-way sync (K20 — the critical differentiator)

**Pull:** upload XLSX → detect structure → suggest mappings → preserve existing data,
overwrite only mapped cells → reconciliation report of what changed and why.

**Push:** export any view as XLSX with formulas preserved where possible.

**Live add-in (Phase 2):** Excel cells pull from the OmniPlan API; writeback is
governed — it is a _command_ subject to the same period locks, maker-checker, and audit
as the UI. There is no privileged path through Excel.

## 8.5 Connector roadmap

| Wave | Connectors                                          | Phase | Gate                     |
| ---- | --------------------------------------------------- | ----- | ------------------------ |
| C0   | CSV/XLSX + field mapper, FX feed (ECB)              | 1     | F-INTEGRATE-000 complete |
| C1   | NetSuite, QuickBooks                                | 2     | C0 reconciliation proven |
| C2   | Xero, Sage Intacct, Dynamics 365                    | 2     | C1 pattern stable        |
| C3   | Salesforce, HubSpot (CRM); Workday, BambooHR (HRIS) | 2     | —                        |
| C4   | Stripe, Zuora, Chargebee (billing)                  | 2     | —                        |
| C5   | SAP S/4, SAP ECC, Oracle Fusion/EBS                 | 3     | enterprise demand        |
| C6   | Snowflake, BigQuery, Redshift, Databricks           | 3     | —                        |
| C7   | Plaid, CAMT.053 (banks)                             | 3     | treasury scope confirmed |
| C8   | Zapier, Make, Workato (iPaaS)                       | 3     | public API GA            |

# SECTION 9 — UI/UX SYSTEM SPECIFICATION

## 9.1 Design philosophy

> **Finance software should feel like a precision instrument, not a database form.**

Five principles, in priority order:

1. **Speed is a feature.** Every interaction < 100 ms perceived. Nothing blocks the UI.
2. **Progressive disclosure.** Simple by default; power is one keystroke away, never in the way.
3. **Trust through transparency.** Every number can be traced. Nothing is a black box.
4. **Keyboard-first.** A finance professional's hands should not need to leave the keyboard.
5. **Beautiful by default.** No configuration needed to get a presentable output.

## 9.2 The navigation crisis (measured)

`src/App.tsx` declares **193 lazy routes**. `src/pages/` holds 203 non-test page
components across ~50 subdirectories. This is not a product; it is a directory.
No user can hold 193 destinations in working memory.

**This is the single largest UVI defect (UVI = 44).** It is Phase 0 work.

## 9.3 Five-pillar information architecture (target)

```
┌─────────────────────────────────────────────────────────────────────┐
│  OmniPlan     PLAN   ANALYZE   REPORT   MODEL   ADMIN        ⌘K  ●  │
└─────────────────────────────────────────────────────────────────────┘

PLAN     Budgets · Forecasts · Scenarios · Workforce · CapEx · Drivers
ANALYZE  Dashboards · Variance · Trends · Cohorts · Profitability · KPIs
REPORT   Financial Statements · Board Pack · Management Reports · Exports
MODEL    Formula Workbench · Model Structure · Data Model · Metric Catalog
ADMIN    Users & Roles · Entities · Chart of Accounts · Integrations ·
         Periods · Environments · Audit · Settings · Health
```

**Route consolidation rule (RC1–RC4):**

- RC1 — Every one of the 193 routes maps to exactly one pillar, or is deleted, or becomes a _view_ within a page (a tab/filter, not a route).
- RC2 — Target ≤ 40 top-level routes. The rest become in-page views.
- RC3 — No route is deleted without a redirect from the old path (nothing 404s for an existing user).
- RC4 — The inventory lives in `docs/product/ROUTE_MAP.md` and is regenerated by a script; drift fails CI.

Target depth: **any feature reachable in ≤ 3 clicks** from the pillar bar.

## 9.4 Command palette (⌘K) — the power surface

One keystroke to: navigate anywhere, run any action, search any entity/account/metric,
jump to any period or scenario, ask the AI copilot, open recent items. Fuzzy-matched,
ranked by recency and frequency, fully keyboard-driven, and **permission-filtered** —
the palette never reveals the existence of something the user may not see (Part XLII).

## 9.5 The grid (the workhorse)

Requirements: Excel-grade keyboard navigation; copy/paste to and from Excel preserving
formats; multi-cell edit; formula bar; freeze panes; grouping and pivot; conditional
formatting; inline sparklines; cell comments; **cell-level audit trail on hover**;
virtual scrolling to 1M+ rows at 60 fps; undo/redo across the session.

Grid cells display money via the money primitive only. A grid must never format a number
with `toFixed`.

## 9.6 Interaction & performance budgets (hard, CI-enforced)

| Interaction                           | Budget   |
| ------------------------------------- | -------- |
| Keystroke → character on screen       | < 16 ms  |
| Cell edit → dependent recalc visible  | < 100 ms |
| Page navigation (cached)              | < 200 ms |
| Page navigation (cold)                | < 1 s    |
| Report generation (10k rows)          | < 2 s    |
| Full model recalculation (100k cells) | < 5 s    |
| Initial bundle (gzipped)              | < 500 KB |
| Time to interactive                   | < 2 s    |
| Lighthouse performance                | ≥ 90     |

Anything exceeding budget is a **defect**, tracked and burned down — not a "known limitation".

## 9.7 Accessibility (Part XXX) — non-negotiable

WCAG 2.2 **AA** is the floor. Specifically: full keyboard operability with a visible focus
ring; screen-reader semantics on the grid (row/column headers announced, cell coordinates,
edit state); colour is never the sole carrier of meaning (variance uses sign + icon +
colour); contrast ≥ 4.5:1 for text and ≥ 3:1 for UI components; respects
`prefers-reduced-motion`; all form fields labelled and error-associated; skip links;
logical heading order. Automated axe checks run in CI on every route; violations fail the build.

## 9.8 Design system — "Ledger" (Part LVII)

Tokens (Part LVII) are the single source of truth: colour, spacing (4px base), typography
(Inter UI / JetBrains Mono for numerals — **tabular figures mandatory for money**), radius,
elevation, motion. Semantic aliases only in components (`--color-variance-favorable`,
never `--green-600`). Dark mode is a token set, not a stylesheet fork. Density modes:
comfortable / compact / dense (finance users want dense).

**Number formatting law:** every monetary display goes through one formatter. Negative
numbers in parentheses (finance convention) or with a minus sign — tenant-configurable,
consistent everywhere. Thousands separators and decimal marks follow the tenant locale.
Currency symbol and code shown where ambiguity is possible.

## 9.9 Empty, loading, and error states

Every surface specifies all four states: **empty** (what it is, why it's empty, the one
action to fill it), **loading** (skeleton matching final layout, never a spinner over
content), **error** (what failed, error code from the registry, what to do, how to retry),
and **partial** (some data loaded, clearly marked, never silently truncated).

## 9.10 Mobile posture (Part LVI) — deliberate non-goals

Mobile is **review and approve**, not modelling.

**Supported on mobile:** dashboards, KPI cards, variance review, approvals, comments,
notifications, report viewing.
**Explicit NON-GOALS:** grid editing, formula authoring, model structure changes, bulk
imports, admin configuration. These are declared unsupported rather than shipped badly.

## 9.11 Desktop posture (Section 23) — the primary modelling surface

Mobile is review-and-approve; **the desktop is where the work happens.** Windows is a
Tier-1 target with a shipping Tauri 2 application (§23.2), and it is the reference
implementation of the local-first plane (§4.3) — not a wrapper around the website.

The UI consequences are binding: the five-pillar shell (§9.3) and ⌘K palette (§9.4) must
work identically on desktop and web; the grid (§9.5) must meet §11.2 budgets against local
SQLite with no network hop; and anything the desktop can do better — native print (§23.3
F-DESK-005), multi-window detach (F-DESK-009), drag-drop import (F-DESK-003) — must be
_used_, not levelled down to browser capability. Where a capability cannot exist on the
web, the web surface states so plainly rather than degrading silently.

---

# SECTION 10 — SECURITY & COMPLIANCE ARCHITECTURE

## 10.1 Threat model (STRIDE, abbreviated)

| Threat                 | Vector                                           | Control                                                                                                          |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Spoofing               | Credential stuffing, session theft               | OIDC/SAML SSO, MFA, short-lived JWT + rotating refresh, device binding, login-attempt throttling                 |
| Tampering              | Direct DB write, API manipulation, audit erasure | Append-only audit with hash chain, DB-level immutability on closed periods, signed commands, checksum on exports |
| Repudiation            | "I didn't approve that"                          | Maker-checker with actor identity, IP, timestamp, correlation id; non-repudiable audit chain                     |
| Information disclosure | Cross-tenant leak, over-broad reads, log leakage | RLS (dual-enforced, PC4), field-level masking, redaction in logs, per-tenant encryption keys                     |
| Denial of service      | Expensive queries, recalc storms, import floods  | Query cost limits, rate limiting, backpressure, job quotas, circuit breakers                                     |
| Elevation of privilege | Role escalation, SoD bypass, plugin escape       | Deny-by-default RBAC+ABAC, SoD matrix enforced server-side, plugins sandboxed with no DB/network access          |

## 10.2 Row-level security — F-PLAT-001 (P0)

Access is deny-by-default. A user sees a fact only if a policy grants it.

```
Policy dimensions: tenant → environment → entity subtree → scenario →
                   book → account class → dimension member set
```

Dual enforcement (PC4): the same predicate compiles to a Postgres RLS policy _and_ to a
mandatory query-builder filter. **Every read path passes through the filter — there is no
"admin bypass" query.** Break-glass access exists, requires justification, is time-boxed,
and pages the security owner.

Test obligation: for every table holding tenant data there is a cross-tenant leak test that
asserts tenant A's credentials return zero rows of tenant B's data. Missing test = failing build.

## 10.3 Field-level masking — F-SEC-003 (P0)

Salary, individual compensation, and PII are masked by default. Masking is applied at the
data layer, not the UI — a masked field is masked in the API response, in exports, in logs,
and in AI prompts. Unmasking is a distinct permission and an audited event.

## 10.4 Identity lifecycle — F-SEC-004 (P0)

SCIM 2.0 provisioning and de-provisioning; joiner/mover/leaver flows; SSO with
just-in-time provisioning; group-to-role mapping; access reviews (quarterly attestation
export); orphaned-account detection. Segregation of duties is a server-enforced matrix:
the creator of a journal cannot approve it; the person who defines a metric cannot certify
it alone; the administrator who grants a role cannot also approve their own grant.

## 10.5 Encryption & key management

At rest: AES-256-GCM, per-tenant data encryption keys wrapped by a KMS master key,
rotatable without re-encrypting everything. In transit: TLS 1.3 only. In the desktop
workspace: OS keychain-backed local encryption. Secrets are never in source, never in
logs, never in error messages. A committed secret is a Severity-0 incident with a
documented rotation runbook.

## 10.6 Compliance targets

| Framework      | Status                                                                                                                                                                                 | Phase                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| SOC 2 Type II  | Controls designed; evidence pipeline scripted (`compliance:evidence`)                                                                                                                  | 2 (readiness) → 3 (audit) |
| ISO 27001      | Control mapping documented                                                                                                                                                             | 3                         |
| GDPR / UK GDPR | DPA, DSR workflow, residency, retention (K25 — retention beats erasure for financial records; erasure applies to PII, with a documented legal-basis carve-out for statutory retention) | 1–2                       |
| SOX / ICFR     | Control matrix, maker-checker, SoD, immutable audit, close evidence pack                                                                                                               | 2                         |
| CCPA           | DSR workflow                                                                                                                                                                           | 2                         |

**Certification honesty (Part LII):** the product claims a certification only when the
audit report exists. Until then the public language is "designed to meet", with the control
evidence available. Claiming an uncertified standard is a Severity-0 integrity failure.

## 10.7 Data retention & residency (Part XLVII)

Financial records: retained per jurisdiction (default 7 years), never hard-deleted.
Audit log: retained ≥ the financial record it describes; append-only. PII: retained per
policy with DSR-driven redaction that preserves the financial fact while removing the
personal identifier. Residency: tenant-pinned region recorded on the tenant row and
enforced at the storage and processing layers; cross-region processing requires explicit
configuration and is audited.

## 10.8 OWASP Top 10 (2021) — financial-application mapping (XVIII-N)

Every item is mapped to a named control and a blocking test. An unmapped item is a lock
blocker, not a backlog item.

| OWASP                                            | Financial-app expression                                                         | Control                                                                                                                                                                                                      | Blocking test                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **A01 Broken Access Control**                    | Analyst reads another entity's comp detail; user opens another tenant's scenario | Deny-by-default RLS dual-enforced (PC4): PG policy **and** mandatory query-builder filter; SoD matrix server-side; entitlements checked per call (A.12)                                                      | Cross-tenant leak test **per table**; `tests/security/rls-*.spec.ts`; SoD self-approval negative test |
| **A02 Cryptographic Failures**                   | Bank tokens, salary data, export files at rest                                   | AES-256 at rest, TLS 1.3 in transit, per-tenant DEKs, BYOK/CMEK (PR3); no bank credentials in the app DB (TR1)                                                                                               | Key-rotation runbook rehearsal; secret-scan gate; plaintext-at-rest assertion                         |
| **A03 Injection**                                | SQL in a filter string; formula-driven data exfiltration                         | Parameterised queries only, zero SQL outside `server/src/db/`; formula AST is structured — never string-concatenated into SQL; `INDIRECT`/`OFFSET` restricted, file/URL fetch from a formula banned (A.14.1) | `architecture:guardrails` (no raw SQL); injection fuzz suite on every list endpoint                   |
| **A04 Insecure Design**                          | A "temporarily disable validation" flag; a bypassable close lock                 | Three-statement gate is **runtime and non-disableable** (ADR-010); closed-period immutability at DB level; threat model required per new endpoint (A.21)                                                     | `FIN-000` block test; closed-period write negative test                                               |
| **A05 Security Misconfiguration**                | Debug endpoints in prod; permissive CORS; default admin                          | IaC scanned in CI; environment parity (EN1–EN7); no default credentials; strict CORS/CSP; `ignore-scripts=true` retained (ADR-002)                                                                           | IaC scan gate; prod config smoke test; header assertions                                              |
| **A06 Vulnerable & Outdated Components**         | A transitive CVE in an export or parsing library                                 | Pinned deps, patch-level `overrides` (ADR-001), SCA + SBOM per release, advisory ingest                                                                                                                      | `license:check` + SCA gate blocking on high/critical                                                  |
| **A07 Identification & Authentication Failures** | Shared service accounts; stale leaver access                                     | OIDC/SAML SSO, MFA, step-up auth for money-moving actions, short-lived JWT + rotating refresh, SCIM JML deprovisioning (10.4), break-glass audited and time-boxed                                            | `tests/security/scim.jml.spec.ts`; session-fixation and token-replay tests                            |
| **A08 Software & Data Integrity Failures**       | A tampered import silently changing actuals; an unsigned plugin                  | Append-only audit hash chain (M010), checksums on import and export, reconciliation-or-rollback on every import, plugins sandboxed with no DB/network access, signed commands                                | Hash-chain tamper-detection test; import reconciliation assertion                                     |
| **A09 Logging & Monitoring Failures**            | Nobody notices a cross-tenant read for a month                                   | OTel traces with tenant/correlation ids, 100% audit of privileged and money-path actions, alerting on integrity counters (16.5), log redaction of amounts and PII                                            | Audit-completeness test; alert-fires integration test on a seeded violation                           |
| **A10 SSRF**                                     | A connector URL pointed at cloud metadata                                        | Outbound URLs allow-listed, no user-supplied fetch targets in connectors, egress proxy, metadata endpoints blocked (A.21)                                                                                    | SSRF attempt suite against every connector config field                                               |

**Finance-specific additions beyond the OWASP list** (because the Top 10 does not cover
them and they are how finance products actually get hurt):

```
FS1  Money-egress to an LLM is a distinct control surface (F-AI-011, Section 12.3).
FS2  Field-level masking applies to notifications, exports, and search results —
     not just to the grid (N2, A.10).
FS3  Lower environments are masked clones (PR7); a prod copy in UAT is an incident.
FS4  A report published from uncertified metrics is an integrity failure (MET5),
     tracked with the same severity as an access-control defect.
```

---

# SECTION 11 — PERFORMANCE & SCALABILITY SPECIFICATION

## 11.1 Scale targets (the numbers the architecture must survive)

| Dimension                    | Phase 1   | Phase 2 (GA) | Phase 3   |
| ---------------------------- | --------- | ------------ | --------- |
| Tenants per deployment       | 1         | 200          | 5,000     |
| Users per tenant             | 25        | 500          | 5,000     |
| Concurrent editors per model | 5         | 50           | 200       |
| Legal entities per tenant    | 20        | 250          | 2,000     |
| Accounts (COA)               | 2,000     | 10,000       | 50,000    |
| Dimensions × members         | 5 × 1k    | 12 × 50k     | 20 × 500k |
| Facts per tenant             | 5M        | 250M         | 5B        |
| Scenarios per tenant         | 50        | 500          | 5,000     |
| Formula nodes per model      | 50k       | 500k         | 2M        |
| Import batch size            | 100k rows | 5M rows      | 50M rows  |

**Honesty note:** the sandbox has 2 cores and 3 GB RAM with no Postgres and no Redis
(K2). Phase 1 targets are verifiable here. Phase 2/3 targets are **design obligations**
that must be validated on real infrastructure before being claimed. Until a k6 run exists
at a given tier, the tier is "designed for", not "supported".

## 11.2 Latency budgets (restated as engineering contracts)

| Operation                                | p50    | p95    | p99    | Hard fail |
| ---------------------------------------- | ------ | ------ | ------ | --------- |
| Keystroke echo                           | 8 ms   | 16 ms  | 33 ms  | 50 ms     |
| Cell edit → dependent recalc             | 30 ms  | 100 ms | 250 ms | 500 ms    |
| Cached page navigation                   | 80 ms  | 200 ms | 400 ms | 1 s       |
| Cold page navigation                     | 400 ms | 1 s    | 1.8 s  | 3 s       |
| API read (governed query)                | 90 ms  | 300 ms | 700 ms | 2 s       |
| API write (command)                      | 120 ms | 400 ms | 900 ms | 3 s       |
| Report render (10k rows)                 | 700 ms | 2 s    | 4 s    | 8 s       |
| Full recalc (100k cells)                 | 1.5 s  | 5 s    | 9 s    | 15 s      |
| Consolidation (20 entities, 12 periods)  | 1 s    | 3 s    | 6 s    | 12 s      |
| Import (100k rows, incl. reconciliation) | 25 s   | 60 s   | 120 s  | 300 s     |

Budgets are asserted in CI against a fixed synthetic dataset (Part LIX). A regression
past p95 fails the build. Exceeding "hard fail" in production is an incident.

## 11.3 Calculation performance strategy

**The DAG is the whole game.** Performance comes from not recalculating things.

```
CP1  Every formula is a node in a dependency graph with explicit in/out edges.
CP2  An edit dirties only its transitive dependents. Nothing else recalculates.
CP3  Topological ordering is cached and invalidated only on structure change.
CP4  Independent subgraphs are calculated in parallel (Web Workers on the client,
     worker threads on the server).
CP5  Results are memoised with a content hash of (inputs, formula version,
     metric version, fx rate set). A cache hit is free.
CP6  Aggregations are incremental: adding one fact updates rollups by delta,
     it does not re-sum the subtree.
CP7  Large recalcs stream progress to the UI and remain cancellable.
CP8  A calculation never blocks the main thread for more than 16 ms; long work
     is chunked and yielded.
```

**Explicit non-goal (K2):** Rust/WebAssembly hot paths. `cargo` and `rustc` do not exist
in this environment, so Wasm cannot be built, tested, or verified. Any Wasm claim would be
unverifiable and is therefore banned until CI can compile it. `decimal.js` in pure
TypeScript is the sanctioned implementation; if profiling later proves it insufficient,
that is an ADR with measured evidence, not a preference.

## 11.4 Query performance strategy

```
QP1  Every query path has a covering index (Section 5.3). No index = no ship.
QP2  Query cost is estimated before execution; queries over a tenant's cost
     ceiling are rejected with OMNI-QUERY-xxxx and a suggested narrower filter.
QP3  Pagination is keyset-based, never OFFSET, on any table that can exceed 10k rows.
QP4  N+1 is a build failure: repository methods are batch-first by design.
QP5  Read replicas serve reporting; the primary serves commands (Phase 2+).
QP6  Aggregate materialisation is opt-in per tenant, refreshed on fact change,
     and always reconcilable against the base facts. A materialised view that
     disagrees with the facts is a Severity-0 defect.
QP7  No unbounded SELECT. Every query has a LIMIT or an explicit streaming cursor.
```

**Aggregation approach (Part L):** OmniPlan uses a **sparse fact store with incremental
rollups**, not a dense in-memory cube. Facts in FP&A are overwhelmingly sparse; a dense
cube of 20 dimensions is combinatorially absurd and would blow memory at Phase 2 scale.
A full OLAP cube engine and CQRS read-model split are **explicit non-goals for Phase 1–2**
and are revisited only if measured query latency demands it.

## 11.5 Frontend performance strategy

Route-level code splitting is already in place (193 lazy routes) but the bundle must be
measured, not assumed. Requirements: initial gzipped bundle < 500 KB; TTI < 2 s;
virtualised rendering for any list over 100 rows; AG Grid row virtualisation at 1M+ rows;
`React.memo`/`useMemo` applied where profiling shows benefit (not reflexively); no
synchronous layout thrash; images and icons tree-shaken; Lighthouse ≥ 90 enforced in CI.

Bundle budgets per pillar are tracked in `docs/product/BUNDLE_BUDGETS.md`; a pillar
exceeding its budget fails the build.

## 11.6 Scalability architecture

**Stateless API.** Every control-plane instance is interchangeable; session state lives in
the token and the database. Horizontal scaling is adding instances.

**Tenant isolation as a scaling unit.** Because tenancy is a first-class column and
partition key from Phase 0, a hot tenant can be moved to dedicated infrastructure without
a schema change. Large tenants get their own partition, then their own database, then
their own deployment — the same code the whole way.

**Work is queued, not blocked.** Imports, consolidations, report generation, and
integration syncs run as jobs with progress, cancellation, and retry. The SQLite-backed
outbox is the Phase 1 implementation; the interface is identical when Redis/BullMQ
becomes available (S2), so no calling code changes.

**Backpressure is explicit.** Queue depth is a monitored signal; when a tenant's queue
exceeds its quota, new jobs are rejected with a clear error rather than silently piling up.

## 11.7 Capacity planning & load testing

A k6 profile per tier defines: concurrent users, read/write mix, calculation intensity,
and import volume. Load tests run against a seeded synthetic dataset (Part LIX: 3 tenant
sizes — small 1M facts, medium 50M, large 500M — generated deterministically from a seed
so results are comparable across runs). Results are published to
`docs/release/PERFORMANCE_BASELINE.md` and are the only acceptable basis for a scale claim.

# SECTION 12 — AI/ML MODULE SPECIFICATION

## 12.1 The governing constraint

> **AI never touches a number without a human's explicit acceptance, and never sees
> a raw monetary value it does not need.**

AI in OmniPlan is an _assistant to_ the financial engine, never a _substitute for_ it.
Every AI output is a **suggestion** with provenance, confidence, and an accept/reject
decision recorded in the audit log.

## 12.2 Capability tiers

**Tier 1 — Deterministic ML (no LLM).** Runs locally, fully explainable.
Forecasting (naive, linear, Holt-Winters, ARIMA, ensemble with backtest-selected
weights), anomaly detection (statistical: z-score, IQR, seasonal decomposition),
driver discovery (correlation and elasticity), Monte Carlo simulation.
_These are engines, tested with golden numbers, and are the default._

**Tier 2 — LLM-assisted narrative.** Variance commentary drafting, board-pack narrative,
natural-language query → structured query, formula explanation in plain English,
data-quality issue summarisation.
_Output is text about numbers, never numbers themselves._

**Tier 3 — LLM-assisted authoring (Phase 3, gated).** Formula generation from a
description, model scaffolding from a business description, mapping suggestions.
_Every output lands in a review diff that a human must accept._

## 12.3 Money-egress guardrail — F-AI-011 (P0, Severity-0 if violated)

```
AI1  No raw monetary value leaves the tenant boundary to a third-party LLM
     unless the tenant has explicitly opted in, per-feature, with an audit record.
AI2  Default mode is REDACTED: values are replaced with normalised indices,
     percentage changes, and ranked ordinals before egress.
AI3  A single chokepoint module performs every LLM call. Direct SDK calls from
     feature code are a build failure (architecture guardrail).
AI4  Every prompt and response is logged with a hash, token count, model id,
     latency, cost, and the redaction mode used.
AI5  Prompt-injection defence: retrieved content is fenced and never treated as
     instructions; tool use is allowlisted; outputs are schema-validated (Zod).
AI6  Model, version, and prompt template are pinned and versioned. A model change
     is a release event, and forecast outputs record the model version used.
AI7  Any AI-derived figure entering the fact table carries source='ai_forecast'
     and requires human acceptance before it can be certified or published.
AI8  Confidence is always shown. A forecast without an interval is not shipped.
AI9  Users can disable AI entirely, per tenant and per user. The product remains
     fully functional with AI off. AI is never load-bearing for correctness.
AI10 No customer data is used for third-party model training. Contractually and
     technically enforced (zero-retention endpoints only).
```

## 12.4 Forecasting specification

Methods run in an ensemble; selection is by rolling-origin backtest (MAPE/sMAPE/MASE) on
the tenant's own history, per series. Every forecast returns: point estimate, prediction
interval (80% and 95%), method chosen, backtest error, feature/driver contributions, and
data-sufficiency status. Series with < 12 observations are labelled `INSUFFICIENT_HISTORY`
and fall back to driver-based or manual planning — **the product never fabricates
confidence it does not have.**

## 12.5 Explainability contract

For every AI output: what data was used (lineage node ids), what method, what confidence,
what the top drivers were, and what would change the answer. An unexplainable output is
not shipped. "The model said so" is not an acceptable answer in a finance product.

---

# SECTION 13 — WORKFLOW & COLLABORATION ENGINE

## 13.1 Why this is a P0 concern, not a nicety

Finance work is not individual work. A budget is proposed, challenged, revised, approved,
and locked by different people with different authority. A close is a choreographed
sequence with owners and dependencies. A forecast is negotiated. If the software does not
model this, the work leaks back into email and spreadsheets — which is exactly the
displacement OmniPlan exists to end (K28).

Two of the fourteen P0 gaps live here: **F-WORKFLOW-008** (declarative state machines) and
**F-COLLAB-002** (money-safe concurrent editing).

## 13.2 Declarative workflow engine — F-WORKFLOW-008 (P0)

Workflows are **data, not code** (Part XXV). A workflow definition is a JSON state machine
stored in `workflow_definitions`, versioned, and validated on save.

```jsonc
{
  "code": "budget_approval",
  "version": 3,
  "initial": "draft",
  "states": {
    "draft": {
      "on": { "SUBMIT": { "target": "in_review", "guard": "isOwner && passesValidation" } },
    },
    "in_review": {
      "on": {
        "APPROVE": { "target": "approved", "guard": "hasRole('approver') && notSubmitter" },
        "REJECT": { "target": "draft", "guard": "hasRole('approver')", "requiresReason": true },
      },
      "sla": { "hours": 48, "onBreach": "escalate" },
    },
    "approved": { "on": { "LOCK": { "target": "locked", "guard": "hasRole('controller')" } } },
    "locked": { "final": true, "immutable": true },
  },
}
```

**Engine contract:**

```
WF1  Transitions execute server-side only. A client-declared state change is ignored.
WF2  Every guard is evaluated against server-held identity and policy, never client claims.
WF3  Every transition writes to workflow_transitions AND audit_log with actor, reason,
     timestamp, correlation id. No silent transitions.
WF4  `notSubmitter` is a first-class guard primitive — maker-checker is built in, not bolted on.
WF5  Reaching a state marked `immutable` locks the subject at the database level.
WF6  SLA breaches raise events (escalation, notification, dashboard signal).
WF7  A definition version is pinned to each instance. Changing the definition never
     retroactively alters in-flight instances.
WF8  Definitions are validated for reachability and deadlock before activation.
```

## 13.3 Maker-checker — F-CTRL-001 (P0)

Applies to: journal entries, budget submission and approval, forecast publication, period
close and reopen, metric certification, scenario locking, FX rate publication, role
grants, integration mapping changes, and data deletion requests.

Rules: the actor who creates cannot approve; approval requires an explicit reason for
anything reversing or overriding; approval authority is scoped by entity, amount
threshold, and account class; delegation is time-boxed and audited; and the entire
maker-checker matrix is server-enforced (Section 10.4 SoD).

## 13.4 Approval routing

Routing supports: sequential chains, parallel approvals with quorum (e.g. 2 of 3), amount
thresholds that add approvers, entity-hierarchy-derived approvers (approve up the org
tree), conditional branches, delegation during absence, and escalation on SLA breach.
Routing rules are configuration, not code.

## 13.5 Collaboration model — F-COLLAB-002 (P0)

**The governing rule (K27): collaboration must never corrupt numbers.**

OmniPlan deliberately does **not** use CRDT/OT free-for-all merging on financial cells.
Two analysts silently merging conflicting values into one cell is a correctness failure
dressed up as a feature.

```
CL1  Presence: users see who is viewing and editing, in real time. Always on.
CL2  Cell-level soft locks: editing a cell acquires a short-lived lease. A second
     editor sees "Priya is editing" and is blocked from a blind overwrite.
CL3  Optimistic concurrency: every write carries the version it read. A stale
     version is REJECTED with OMNI-CONFLICT-xxxx — never last-write-wins.
CL4  Conflicts are TYPED and surfaced: the UI shows both values, both authors,
     both timestamps, and requires an explicit human resolution.
CL5  Non-financial content (comments, narrative text, descriptions) MAY use
     collaborative text merging. Money never does.
CL6  Offline edits queue locally as DRAFT, are replayed as idempotent commands on
     reconnect, and any rejected command surfaces for resolution. Nothing is
     silently dropped and nothing is silently applied.
CL7  Bulk paste into a region acquires leases for the whole region atomically or
     fails cleanly — partial application of a paste is banned.
```

## 13.6 Comments, threads, and annotations

Comments attach to any addressable object: a cell, a row, a report, a scenario, a variance,
a metric definition, a workflow instance. Threads support @mentions (which notify),
resolution state, attachments, and are included in exports where relevant. A comment on a
cell is visible on hover in the grid alongside the audit trail — the number and the
conversation about the number live together.

## 13.7 Close orchestration (Part XXXIV)

The period close is a first-class workflow: a task list with owners, dependencies, due
offsets from period end, evidence attachment per task, blocking vs non-blocking
classification, real-time status, and a burndown view. The seven-step technical close
protocol (Section 6.7) is the terminal task of that workflow. Recurring close tasks are
templated per entity and rolled forward automatically each period.

## 13.8 Notifications (Part XLIII)

Channels: in-app, email, and webhook (Slack/Teams via webhook, not bespoke integrations).
Every notification is generated from a typed event, is deduplicated, respects per-user
digest preferences (immediate / hourly / daily), and is never the only record of something
important — the audit log is. Notification failures never block the underlying transaction.

## 13.9 Auditor role — F-WORKFLOW-007 (P0)

A dedicated read-only role with: full read of facts, lineage, audit log, workflow history,
and evidence artefacts; **no** write capability anywhere; scoped by entity and period;
time-boxed access grants; and its own access log. An auditor's session cannot be
distinguished from a normal read at the data layer — meaning the auditor sees exactly what
the system holds, not a curated view. Every auditor read is itself logged.

# SECTION 14 — REPORTING & EXPORT ENGINE

## 14.1 Reporting philosophy

> A report is a **claim about the business**. A claim needs provenance, a version,
> and an owner. Reports in OmniPlan are reproducible artefacts, not screenshots.

Every rendered report captures a **snapshot** (`report_snapshots`) recording: the metric
versions used, the FX rate set, the scenario and period, the filter state, a content hash,
and the renderer version. Re-running the same snapshot id must produce byte-identical
numbers forever. If it cannot, the report was not reproducible and that is a defect.

## 14.2 Report catalogue

**Statutory / core financial**
Trial Balance · Profit & Loss (by entity, consolidated, by dimension) · Balance Sheet ·
Cash Flow (direct and indirect) · Statement of Changes in Equity · Consolidation
worksheet with eliminations · Intercompany matching report · FX translation and CTA
reconciliation.

**Management**
Budget vs Actual with variance and commentary · Rolling forecast vs plan · Departmental
P&L · Profitability by product/customer/channel/region · KPI scorecard · Headcount and
compensation analysis · CapEx schedule and depreciation roll-forward · Working capital
and DSO/DPO/DIO · Cohort analysis · Contribution margin waterfall.

**Board & external**
Board pack (Part XLVIII) · Investor update · Lender covenant compliance certificate ·
Audit evidence pack · Close package.

**Operational**
Data quality report · Unmapped accounts · Integration sync and reconciliation status ·
Lineage report for a selected figure · Access review export · Change log for a scenario.

## 14.3 Report builder

Drag-and-drop rows (accounts, hierarchies, metrics), columns (periods, scenarios,
entities, books, variance pairs), and filters (any dimension). Supports: nested grouping,
calculated rows and columns defined as metric expressions, conditional formatting rules,
custom headers/footers, page setup for print, and saved layouts shareable by permission.
A report definition is JSON and is versionable, diffable, and exportable between
environments (Part XL).

## 14.4 Board pack generator (Part XLVIII)

A board pack is a **compiled document**, not a folder of exports:

```
BP1  Sections are ordered, templated, and per-tenant configurable.
BP2  Every figure in the narrative is a live binding to a metric + period + scenario,
     not typed text. Regenerating the pack updates the prose figures.
BP3  Charts are rendered server-side for deterministic output.
BP4  AI may DRAFT commentary (Tier 2); a human must accept every paragraph before
     the pack can be marked FINAL. Unaccepted AI text is watermarked DRAFT.
BP5  The pack records the snapshot id of every underlying report. An auditor can
     open the pack and drill from any number to its lineage.
BP6  Version history with side-by-side diff between board meetings — including
     "what changed and why" derived from the audit log.
BP7  A pack cannot be marked FINAL while any underlying period is open or any
     included metric is uncertified.
```

## 14.5 Export formats

| Format | Fidelity requirement                                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XLSX   | Live formulas preserved where the source was a formula; number formats, frozen panes, grouping, and tab structure retained. Not a CSV in a spreadsheet costume. |
| PDF    | Print-quality, paginated, headers/footers, page numbers, embedded fonts, deterministic pagination.                                                              |
| CSV    | RFC 4180, UTF-8 BOM optional, explicit decimal and thousands convention, currency column always present.                                                        |
| JSON   | Canonical schema, decimal amounts as strings (never JS numbers — RULE D1), lineage ids included.                                                                |
| PPTX   | Board-deck export of charts and tables (Phase 3).                                                                                                               |
| XBRL   | Statutory tagging (Phase 3, jurisdiction-scoped).                                                                                                               |

**Export integrity rules:** every export carries a footer/metadata block with tenant,
scenario, period, FX rate set, generation timestamp, generating user, snapshot id, and a
content hash. Exports of restricted fields respect field masking (Section 10.3) — an
export is not an escape hatch around permissions. Every export is an audited event
recording who exported what, when, and how many rows.

## 14.6 Scheduling & distribution

Reports can be scheduled (cron-like, fiscal-calendar-aware — "3rd business day after
period close" is expressible), delivered by email or webhook or to a storage target, with
recipient lists resolved from roles rather than hardcoded addresses, and with delivery
failures surfaced and retried. A scheduled report that fails silently is a defect.

## 14.7 Drill-through contract

From any number in any report, in one click: the contributing facts, their source
(manual/import/calculated/allocated), the formula or metric definition that produced it,
the lineage path back to the source system record, the audit trail of changes, and the
approval state. **This is the auditor's promise from Section 0 and it is testable:**
`tests/e2e/auditor-drill-through.spec.ts` asserts one click from a board-pack figure to a
source system record id.

## 14.8 Print & pixel fidelity

Print stylesheets are first-class, not an afterthought: page breaks respect logical group
boundaries, headers repeat on every page, wide reports scale or split predictably, and the
printed output matches the PDF byte-for-byte in layout. Finance still prints board packs;
pretending otherwise is not a strategy.

# SECTION 15 — API SPECIFICATION

## 15.1 API principles

```
AP1  The API is the product surface. The UI is one client among several
     (web, desktop, Excel add-in, partner integrations). No privileged client.
AP2  Commands are idempotent. Every mutating call carries an Idempotency-Key.
AP3  Reads are governed. Every read passes the RLS predicate (PC4). No bypass.
AP4  Contracts are typed end-to-end. Zod schemas generate both runtime validation
     and the OpenAPI document. The spec cannot drift from the code.
AP5  Money crosses the wire as a decimal STRING with a currency code, never as a
     JSON number. A JSON number for money is a build failure (RULE D1).
AP6  Errors use the registry (F-ERR-001): stable code, message, remediation, correlation id.
AP7  Versioned: /v1. Breaking changes require a new version and a deprecation window.
AP8  Every response carries the correlation id used for tracing and audit.
```

## 15.2 Resource surface (v1)

```
POST   /v1/auth/login                      OIDC/SAML/password + MFA
POST   /v1/auth/refresh                    rotating refresh token
POST   /v1/auth/logout
GET    /v1/me                              identity, roles, entitlements

GET    /v1/tenants/:id                     tenant config
GET    /v1/environments                    dev | uat | prod
POST   /v1/environments/:id/promote        governed promotion (Part XL)

GET    /v1/entities                        hierarchy, SCD2-aware (?asOf=)
POST   /v1/entities
GET    /v1/accounts                        COA, ?asOf=
POST   /v1/accounts/bulk                   validated bulk upsert
GET    /v1/dimensions/:code/members        ?asOf= &status=
POST   /v1/dimensions/:code/members/merge  MDM merge with survivorship record

GET    /v1/periods                         calendar, status
POST   /v1/periods/:id/close               7-step protocol, irreversible
POST   /v1/periods/:id/reopen              admin + reason + audit

GET    /v1/books                           MGMT | IFRS | LOCAL_xx | TAX
GET    /v1/scenarios
POST   /v1/scenarios                       create / branch
POST   /v1/scenarios/:id/lock              immutable thereafter
GET    /v1/scenarios/:a/compare/:b         typed delta

GET    /v1/facts                           governed query (see 15.3)
POST   /v1/facts:batch                     command; validated; reconciled; audited
GET    /v1/facts/:id/lineage               upstream + downstream graph

GET    /v1/metrics                         governed metric catalog
POST   /v1/metrics                         propose (maker)
POST   /v1/metrics/:id/certify             checker; version bump
GET    /v1/metrics/:id/versions

POST   /v1/calc/run                        scenario recalc; returns job id
GET    /v1/jobs/:id                        progress, cancellable
POST   /v1/consolidate                     entity set + period + book

GET    /v1/reports
POST   /v1/reports/:id/render               → snapshot id
GET    /v1/snapshots/:id                    reproducible artefact
POST   /v1/exports                          format + scope; audited

GET    /v1/workflows/:code/instances
POST   /v1/workflows/instances/:id/transition   event + reason

GET    /v1/integrations
POST   /v1/integrations/:id/sync
GET    /v1/integrations/:id/reconciliation/:syncId
GET    /v1/integrations/:id/dlq
POST   /v1/integrations/:id/dlq/:itemId/replay

GET    /v1/audit                            filtered, paginated, never mutable
GET    /v1/audit/verify                     hash-chain integrity check

GET    /v1/fx/rates                         ?period= &type=
POST   /v1/fx/rates                         board-approved rate publication

POST   /v1/ai/query                         NL → structured query (redaction-gated)
POST   /v1/ai/narrative                     draft commentary (redaction-gated)
GET    /v1/health                           liveness, readiness, dependency status
```

## 15.3 The governed query endpoint

`GET /v1/facts` is the single read path for financial data. It accepts a structured query
(entity set, account set, period range, scenario, book, dimension filters, metric
expressions, grain) and returns facts or aggregates. It:

1. resolves the caller's RLS predicate and injects it — unconditionally;
2. applies field masking before serialisation;
3. estimates cost and rejects over-budget queries (QP2);
4. paginates by keyset (QP3);
5. returns amounts as decimal strings with currency (AP5);
6. includes `lineage_node_id` on every returned fact;
7. logs the query shape (never the values) for observability.

## 15.4 Command semantics

Every mutating endpoint is a command with: an `Idempotency-Key` header (replay returns the
original result, never a duplicate write), a `version` for optimistic concurrency (CL3),
server-side validation via Zod, a policy check, a period-lock check, a maker-checker
check, three-statement validation where applicable (TS4), an audit write, a lineage write,
and an outbox event. **Any of these failing rolls back the entire command.** Partial
application is banned.

## 15.5 Errors

```jsonc
{
  "error": {
    "code": "OMNI-PERIOD-0201",
    "message": "Period 2026-03 is closed; posting rejected.",
    "remediation": "Post an adjusting entry to the next open period, or request a reopen from a controller.",
    "severity": 2,
    "correlationId": "0f2c...",
    "details": { "periodId": "...", "closedAt": "2026-04-05T09:12:00Z" },
  },
}
```

HTTP mapping: 400 validation, 401 unauthenticated, 403 policy/SoD denial, 404 not found
**or not permitted** (never leak existence), 409 conflict/version stale, 422 business-rule
violation, 429 rate limit, 500 unexpected (always with a correlation id), 503 dependency
unavailable.

## 15.6 Rate limiting, quotas, and pagination

Per-tenant and per-user token buckets, with separate budgets for reads, commands, exports,
and AI calls. Quotas are visible to the tenant admin. Pagination is keyset-based with an
opaque cursor and a documented maximum page size. Bulk endpoints stream with backpressure.

## 15.7 Webhooks & public API

Outbound webhooks are delivered from the outbox with signature (HMAC), retries with
backoff, and a DLQ. Subscribable events include: period closed, scenario locked, forecast
published, approval completed, metric certified, integration sync completed or failed,
three-statement violation detected. The public API (Phase 3) is the same `/v1` surface with
scoped API keys, documented in an OpenAPI spec generated from the Zod schemas — never
hand-written, because hand-written specs lie.

# SECTION 16 — INFRASTRUCTURE, DEPLOYMENT & OBSERVABILITY

## 16.1 Environments — F-OPS-002 (P0, K26)

Three environments are a **product feature**, not an ops detail. A finance team cannot
test a model change against production data in production.

| Environment | Purpose                                                                  | Data                                       | Who                     |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------ | ----------------------- |
| **DEV**     | Model authoring, structure changes, connector configuration              | Synthetic or masked subset                 | Modellers, admins       |
| **UAT**     | Validation of a change against realistic data before it becomes official | Masked copy of prod, refreshable on demand | Finance leads, auditors |
| **PROD**    | The books. Official numbers.                                             | Real                                       | Everyone, per RLS       |

**Promotion contract (Part XL):**

```
EN1  Environment is a first-class column (environments table) on every governed object.
EN2  Metadata promotes (COA, dimensions, metrics, workflows, reports, mappings).
     Transactional facts do NOT promote upward. Ever.
EN3  Promotion is a diff-and-approve flow: the promoter sees exactly what will change,
     a checker approves, and the promotion is recorded in the audit log.
EN4  Promotion is atomic. A partially promoted metadata set is banned.
EN5  Refreshing UAT from PROD applies field masking and PII redaction in transit.
EN6  A change that has not passed UAT cannot be promoted to PROD for tenants on the
     governed track. This is enforced, not advised.
EN7  Rollback: every promotion records the prior metadata version and can be reverted.
```

## 16.2 Deployment topology

**Plane A (Workspace):** static bundle on a CDN (web/PWA) plus signed Tauri desktop
builds for macOS/Windows/Linux. Desktop auto-update over a signed channel with staged
rollout. **Note (K2): Tauri builds cannot be produced or verified in this sandbox — no
`cargo`. Desktop release engineering is a Phase 2 item requiring a Rust-capable runner.**

**Plane B (Control Plane):** stateless Node containers behind a load balancer; managed
PostgreSQL with read replicas (S2+); object storage for snapshots and exports; a job
runner; and a KMS. Deployment models offered: multi-tenant SaaS (default), single-tenant
dedicated, and customer-managed VPC (Phase 3, for regulated buyers).

**Phase 1 reality:** single Node process + SQLite, run locally or on a single host. This
is honest, sufficient for the first design partners, and — because of the portability
contract (PC1–PC5) — not a dead end.

## 16.3 CI/CD pipeline

```
commit → typecheck → lint → unit (sharded) → financial:oracles
       → architecture:guardrails → money:adoption ratchet → type-safety ratchet
       → engines:verify → build → integration → e2e → a11y → perf-budget
       → license:check → docs:links → compliance:evidence → release:dry-run
       → sign → deploy DEV → smoke → deploy UAT → approval gate → deploy PROD
       → post-deploy verification → auto-rollback on failed verification
```

Deployments are blue/green with automated rollback triggered by error-rate or
correctness-signal regression. Database migrations run separately from code deploys,
expand-then-contract, so a rollback never strands the schema.

**Standing constraint:** `.github/workflows/**` cannot be pushed from this environment
(GitHub App permission). Every CI change ships as a numbered patch in `ci-patches/` with
apply instructions. `ci-patches/0005-*.patch` is currently pending human application.

## 16.4 Backup, restore & disaster recovery (Part XXVII)

| Control              | Requirement                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Backup frequency     | Continuous WAL archiving + nightly full                                                               |
| RPO                  | ≤ 15 minutes                                                                                          |
| RTO                  | ≤ 4 hours                                                                                             |
| Retention            | 35 days point-in-time; monthly archives for 7 years                                                   |
| Encryption           | Backups encrypted with a separate key from the live data                                              |
| **Restore drill**    | **Monthly, rehearsed, timed, and recorded. A backup that has never been restored is not a backup.**   |
| Tenant-level restore | A single tenant can be restored without affecting others                                              |
| Verification         | Every restore drill runs the three-statement oracle and a row-count reconciliation against the source |

Wave 7 of `MASTER_ROADMAP.md` (backup/restore E2E) is the in-flight implementation of this
section and must not be descoped.

## 16.5 Observability

OpenTelemetry throughout. Every request carries a `correlation_id` that flows from the UI
click, through the API, into the calculation, into the audit log, and into any outbound
integration call. Given a wrong number, an engineer can reconstruct the full causal chain
from a single id.

**Structured logs only.** JSON with `tenant_id`, `user_id`, `correlation_id`, `route`,
`duration_ms`, `outcome`, `error_code`. **Never log a monetary amount, a credential, or PII.**

### Golden signals + finance-specific signals

| Signal          | Metric                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Latency         | p50/p95/p99 per route and per engine operation                                                            |
| Traffic         | Requests, active tenants, active users, calc operations/min                                               |
| Errors          | Rate by error code; Severity-0 count (target: 0)                                                          |
| Saturation      | CPU, memory, DB connections, queue depth, DLQ depth                                                       |
| **Correctness** | Three-statement check failures (target 0), reconciliation failures, unmapped accounts                     |
| **Trust**       | Facts without lineage (target 0), uncertified metrics in published reports (target 0), stale integrations |

## 16.6 SLOs and error budgets (Part XLV)

| SLO                           | Target        | Error budget                         |
| ----------------------------- | ------------- | ------------------------------------ |
| API availability              | 99.9% monthly | 43 min/month                         |
| Read latency p95              | < 300 ms      | 1% of requests                       |
| Calculation p95 (100k cells)  | < 5 s         | 1%                                   |
| Data freshness (integrations) | < 4 h         | 2% of syncs                          |
| **Correctness**               | **100%**      | **Zero. Not an SLO — an invariant.** |

**Error-budget policy:** when a budget is exhausted, feature work stops and reliability
work starts. This is a rule, not a suggestion.

## 16.7 Alerting

**Page immediately:** any three-statement check failure in production; any cross-tenant
access anomaly; audit hash-chain verification failure; data loss or a failed restore drill;
availability SLO burning at > 10×.

**Ticket, don't page:** DLQ growth, stale integration, coverage-ratchet regression,
performance budget overrun, certificate expiry within 14 days.

## 16.8 Error registry — F-ERR-001 (P0)

Every user-visible error has a stable code `OMNI-<DOMAIN>-<NNNN>`, a user-facing message,
a remediation hint, a severity, and an owner. The registry is one source file that
generates both the runtime constants and `docs/errors/REGISTRY.md`. **An error thrown
without a registry code fails the build.**

Seed entries:

```
OMNI-MONEY-0001   Currency mismatch in aggregation             Severity-0
OMNI-MONEY-0002   Precision loss detected                      Severity-0
OMNI-MONEY-0003   Float encountered in a monetary path         Severity-0
OMNI-CALC-0101    Circular dependency detected                 Severity-1
OMNI-CALC-0102    Three-statement identity violated            Severity-0
OMNI-CALC-0103    Iterative solver failed to converge          Severity-1
OMNI-PERIOD-0201  Period is closed; posting rejected           Severity-2
OMNI-PERIOD-0202  Unmapped accounts block close                Severity-1
OMNI-AUTH-0301    Insufficient permission for this entity      Severity-2
OMNI-AUTH-0302    Segregation of duties violation              Severity-1
OMNI-CONFLICT-0311 Stale version; edit rejected                Severity-2
OMNI-INTEG-0401   Sync reconciliation failed; rolled back      Severity-1
OMNI-INTEG-0402   Record dead-lettered after max retries       Severity-2
OMNI-QUERY-0451   Query exceeds cost budget                    Severity-3
OMNI-AI-0501      Money egress blocked by tenant policy        Severity-0
OMNI-AI-0502      Model output failed schema validation        Severity-2
```

## 16.9 Runbooks

Required before GA, each rehearsed and timed: backup verification; point-in-time restore;
single-tenant restore; failed-migration rollback; integration DLQ drain; audit-chain
verification failure investigation; key rotation; break-glass access; period-close reopen;
Severity-0 correctness incident; and customer incident communications.
**An untested runbook does not exist.**

# SECTION 17 — TESTING STRATEGY

## 17.1 The testing pyramid (target shape)

```
                    ╱╲     E2E (Playwright)          ~150 specs
                   ╱  ╲    real browser, real flows
                  ╱────╲   Integration                ~600 specs
                 ╱      ╲  API + DB + engine wiring
                ╱────────╲ Unit                     ~4,000 specs
               ╱          ╲ engines, utils, hooks, components
              ╱────────────╲ Golden numbers          ~200 fixtures
             ╱______________╲ known-correct financial outputs
```

Current state: **1,228 test files, `tsc --noEmit` clean, `eslint --max-warnings 0` clean.**
That is a genuinely strong foundation and must not regress.

## 17.2 Coverage requirements (differentiated by risk)

| Area                         | Line  | Branch | Rationale                     |
| ---------------------------- | ----- | ------ | ----------------------------- |
| `src/utils/money.ts`         | 100%  | 100%   | The primitive. No exceptions. |
| `src/engines/**` (financial) | ≥ 95% | ≥ 90%  | Wrong numbers are Severity-0. |
| `server/src/routes/**`       | ≥ 90% | ≥ 85%  | Authority plane.              |
| Security/RLS paths           | 100%  | 100%   | A gap is a breach.            |
| `src/store/**`               | ≥ 85% | ≥ 75%  |                               |
| `src/components/**`          | ≥ 80% | ≥ 70%  |                               |
| Overall                      | ≥ 85% | ≥ 78%  | Ratchet — may only increase.  |

Coverage is a **ratchet**: the threshold is raised to the achieved value on every green
main build and never lowered.

## 17.3 Golden-number fixtures (the financial oracle)

A corpus of hand-verified financial scenarios with known-correct outputs:
three-statement models, multi-entity consolidations with eliminations and NCI, FX
translation cases per IAS 21, allocation cascades, depreciation schedules across all four
methods, revenue recognition (ASC 606 five-step, including multi-element arrangements),
lease accounting (IFRS 16 / ASC 842), and 4-4-5 / 53-week calendar boundary cases.

Each fixture states its source of truth (worked example, textbook, or auditor-reviewed
spreadsheet) and asserts to the cent. `npm run financial:oracles` runs them. **A golden
fixture may never be edited to make a failing test pass** — a diff in a golden number is
either a genuine bug or a deliberate, reviewed standard change with an ADR.

## 17.4 Property-based tests (financial invariants)

Generated across random inputs:

- Debits equal credits, always.
- Assets = Liabilities + Equity, always.
- Sum of allocated parts equals the allocated whole, exactly (no penny leaks).
- Consolidation of one entity equals that entity's standalone statements.
- FX round-trip at the same rate returns the original amount.
- Aggregation is associative and commutative over decimal money.
- A period's closing balance equals the next period's opening balance.

## 17.5 Mutation testing

Stryker on `src/utils/money.ts` and the financial engines. Target mutation score ≥ 80%
on money, ≥ 70% on engines. Surviving mutants on the money primitive are treated as
missing tests and fixed before feature work.

## 17.6 Non-functional test gates

Performance (budgets in 9.6, asserted in CI on a fixed dataset), accessibility (axe on
every route, zero violations), visual regression (Playwright screenshots on key surfaces),
load (k6 profile at target concurrency, Phase 2), chaos (kill the DB mid-import and assert
full rollback + reconciliation, Phase 2), and restore drills (Part XXVII — a backup is not
a backup until a restore has been rehearsed and timed).

## 17.7 Definition of Done (every feature, no exceptions)

```
□ Spec written and reviewed before code
□ Unit tests pass, coverage threshold met for the area
□ Integration tests pass
□ E2E test for the primary user journey
□ Golden-number fixture added if the feature touches money
□ Accessibility check passes (axe, keyboard-only walkthrough)
□ Performance budget met and measured
□ Error states designed, implemented, and coded in the error registry
□ Empty and loading states implemented
□ Audit events emitted for every state change
□ Lineage recorded for every derived value
□ RLS/permission checks in place and tested (including a negative test)
□ Documentation updated (user-facing + ADR if a decision was made)
□ Telemetry added (usage + failure)
□ tsc clean, eslint clean, no new TODOs without an issue link
```

## 17.8 CI gates (blocking)

`typecheck` → `lint` → `unit (sharded)` → `financial:oracles` → `architecture:guardrails`
→ `money:adoption` (ratchet) → `type-safety:ratchet` → `engines:verify` → `integration`
→ `e2e` → `a11y` → `perf-budget` → `license:check` → `docs:links` → `compliance:evidence`
→ `release:dry-run`.

**Constraint:** this sandbox cannot push `.github/workflows/**`. All CI changes are
delivered as numbered patches in `ci-patches/` for human `git apply` (see `ci-patches/0005-*.patch`,
currently pending).

---

# SECTION 18 — PHASED ROADMAP

## 18.1 Phasing philosophy

Phases are ordered by **dependency and risk**, not by demo appeal. The rule:

> Build the thing that makes the next thing possible and safe.
> Never build a feature whose foundation does not exist — you will rebuild it.

This is why F-INTEGRATE-000 (inbox/outbox/DLQ) precedes every connector, why tenancy
precedes every feature that stores data, and why the money primitive migration precedes
everything.

Each phase has an **exit gate**. A phase is not "done" when the tickets close; it is done
when the gate assertions pass. A phase that fails its gate does not advance — the next
phase's scope is cut instead.

---

## 18.2 PHASE 0 — FOUNDATION HARDENING

**Duration:** 6 weeks · **Theme:** _Make the ground safe to build on._
**Index movement:** SHI 71 → 78 · UVI 44 → 52 · DEI 49 → 60

Phase 0 ships almost no user-visible features. That is deliberate and it is the most
important decision in this roadmap. Every P0 gap in Section 3.8 is a foundation gap; each
one, left unfixed, multiplies the cost of everything built on top of it.

### Workstream 0.1 — Money integrity (highest priority, nothing outranks it)

| #                            | Item                                                       | Acceptance                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0 ✅ **DONE 2026-08-17** | **Replace the adoption detector before trusting the gate** | The current `money:adoption` scanner counts modules that _import_ `@/utils/money` via regex. Importing the primitive is not proof of using it. Replace with an **AST detector** that flags arithmetic (`+ - * / +=`), comparison (`> < ===`), and `reduce` accumulation on values whose type resolves to a monetary type. Adoption = modules with **zero** unsafe monetary operations. Re-baseline honestly; the number will fall before it rises. |
| 0.1.1                        | Complete money-primitive migration                         | Safety ≥ 90% measured by the **0.1.0 AST detector** (`npm run money:ast`). First honest baseline 2026-08-17: **78.55% safe — 740 unsafe monetary operations across 184 of 858 monetary modules**. Ratchet enforces monotonic improvement                                                                                                                                                                                                           |
| 0.1.2                        | Eliminate float paths                                      | Detector reports 0 unsafe monetary operations in financial paths — including the **persistence boundary** (§0.6.1: `localStorage` JSON round-trips) and the store-selector layer, not only `toFixed`/`parseFloat`/`Number()`. Guardrail fails the build on reintroduction                                                                                                                                                                          |
| 0.1.3                        | Money type is total                                        | `Money = {amount: Decimal, currency: CurrencyCode}`; no bare number crosses an engine boundary                                                                                                                                                                                                                                                                                                                                                     |
| 0.1.4                        | 100% coverage + mutation ≥ 80% on `src/utils/money.ts`     | Stryker report checked in                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0.1.5                        | Property tests for allocation, aggregation, FX round-trip  | Section 17.4 suite green                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 0.1.6                        | Type-aware money detection                                 | Upgrade `money-ast-detector.mjs` from name-based to full type resolution via the TS type checker, so money flowing through a generically-named variable is still caught. Expect another honest drop                                                                                                                                                                                                                                                |

### Workstream 0.2 — Tenancy & environments (F-PLAT-001, F-OPS-002)

| #     | Item                                                               | Acceptance                                              |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| 0.2.1 | `tenant_id` on every table (M001)                                  | Migration + backfill + rehearsal test                   |
| 0.2.2 | `environments` table + `environment_id` on governed objects (M002) | Every row defaults to `prod`                            |
| 0.2.3 | Repository pattern; zero SQL outside `server/src/db/`              | `architecture:guardrails` asserts it                    |
| 0.2.4 | Policy predicate compiler + mandatory query filter (PC4 app layer) | Cross-tenant leak test per table; all green             |
| 0.2.5 | Portability contract PC1–PC5 enforced                              | Dialect adapter in place; no SQLite-only SQL outside it |

### Workstream 0.3 — Runtime correctness gate (F-PLAT-004)

| #     | Item                                                          | Acceptance                                                    |
| ----- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| 0.3.1 | Promote three-statement oracles from test-time to **runtime** | TS1–TS3 run on every write path; cannot be disabled by config |
| 0.3.2 | Violation blocks the write with `FIN-000` and the delta       | Negative test asserts the block                               |
| 0.3.3 | Correctness signal emitted to observability                   | Counter exists; alert wired                                   |

### Workstream 0.4 — Error registry (F-ERR-001)

| #     | Item                                         | Acceptance                                              |
| ----- | -------------------------------------------- | ------------------------------------------------------- |
| 0.4.1 | Registry source file with the LX code set    | Generates runtime constants + `docs/errors/REGISTRY.md` |
| 0.4.2 | Build fails on an uncoded user-visible error | Lint rule active                                        |

### Workstream 0.5 — Navigation triage (the UVI unlock)

| #     | Item                                                           | Acceptance                                            |
| ----- | -------------------------------------------------------------- | ----------------------------------------------------- |
| 0.5.1 | Inventory all 193 routes → pillar mapping (RC1)                | `docs/product/ROUTE_MAP.md` generated; drift fails CI |
| 0.5.2 | Five-pillar shell + ⌘K palette (permission-filtered)           | E2E: any feature in ≤ 3 clicks                        |
| 0.5.3 | Consolidate to ≤ 40 top-level routes with redirects (RC2, RC3) | No 404 for any previously valid path                  |

### Workstream 0.6 — AI egress guardrail (F-AI-011)

| #     | Item                                               | Acceptance                                                           |
| ----- | -------------------------------------------------- | -------------------------------------------------------------------- |
| 0.6.1 | Single LLM chokepoint module                       | Direct SDK import elsewhere = build failure                          |
| 0.6.2 | REDACTED default mode; opt-in per feature, audited | `FIN`/`AI` code emitted on block; test proves no raw amount egresses |

### Workstream 0.8 — Persistence authority (added session 004, from the §0.6.1 measurement)

**Why this exists.** §0.6.1 measured that 43 stores persist financial state to
`localStorage` while only 14 non-test files ever call the server, and that `tenant_id`
appears **zero** times in `server/src/db/`. Workstream 0.2 adds `tenant_id` to a database
that is not yet the system of record — which would produce governed columns nobody writes
to. This workstream establishes the authority boundary that 0.2 then governs.

It is deliberately scoped to _authority and safety_, **not** to a full cloud migration. The
local-first posture stays (it is a §0.5 differentiator); what changes is which copy is
**authoritative** and whether the client copy can silently corrupt a decimal.

| #     | Task                                     | Acceptance criterion                                                                                                                                                                 |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.8.1 | Persistence inventory                    | `docs/architecture/PERSISTENCE_MAP.md` lists all 43 persisted stores, classifies each **financial-truth / user-preference / derived-cache**, and names the authority for each.       |
| 0.8.2 | Money-safe serialization boundary        | Every persisted monetary value round-trips as a **canonical decimal string**, never a JS `number`. Property test: persist → reload → value is bit-identical for 10k random decimals. |
| 0.8.3 | Declare the authority rule               | For each financial-truth store: server is authoritative, client is a replica/cache. Encoded as a typed contract, not a comment.                                                      |
| 0.8.4 | Schema fork closure                      | One schema source. CI fails if `src-tauri/migrations/` and the server's in-code DDL disagree on any shared table.                                                                    |
| 0.8.5 | Durability honesty in the UI             | Until a store is server-backed, its surface states plainly that data is local-only. No screen may imply durability it does not have.                                                 |
| 0.8.6 | Sync spike for **one** store (`glStore`) | One financial store demonstrably server-authoritative end-to-end, with offline edit → reconnect → deterministic conflict resolution (never last-write-wins on a decimal).            |

**Deliberately out of scope for Phase 0:** migrating all 43 stores. That is Phase 1 work and
depends on tenancy (0.2). Phase 0 proves the pattern on the ledger, the highest-value store,
and makes the remaining gap visible and honest.

#### W0.1.0 result (executed 2026-08-17)

`scripts/money-ast-detector.mjs` replaces the import-proxy metric. It parses every
financial-path module with the TypeScript compiler and flags arithmetic, compound
assignment, float comparison, float equality, `reduce` accumulation, `Math.round`
and value-producing `toFixed` **on monetary operands**. A module is safe only when it
has zero unsafe operations — safety is a property of operations, not of imports.

| Metric                       | Legacy import proxy | AST detector |
| ---------------------------- | ------------------- | ------------ |
| Reported adoption            | 25.44%              | —            |
| Modules handling money       | not measured        | 858          |
| Modules with zero unsafe ops | not measured        | 674 (78.55%) |
| Unsafe monetary operations   | **invisible**       | **740**      |

The two numbers are not comparable and the increase is not progress: the old metric
asked "does this file import money.ts", the new one asks "does this file do unsafe
arithmetic on money". 740 real defects that the old gate could not see are now visible
and ratcheted. Breakdown: 580 arithmetic, 62 compound-assign, 38 `Math.round`,
24 comparison, 20 reduce-accumulate, 16 float-equality.

The detector was hand-validated against live modules before baselining. Three
false-positive classes were found and fixed: request counters (`state.totalAllowed += 1`),
bare generic names used as denominators (`windowFailures / total`), and token-bucket
`cost` arithmetic. `CircuitBreaker.ts` fell 15 → 0 findings while
`FinancialStatementTemplates.tsx` held at 59 true positives. Both directions are pinned
by 17 fixture tests in `src/utils/moneyAstDetector.test.ts` (8 must-catch, 9 must-ignore),
so tightening the heuristics can never silently blind the gate. Enforced as pre-push
gate 9b and `npm run money:ast`.

**Known limitation (honest):** monetary identification is name-based, not type-based.
It cannot see money flowing through a variable called `x`. Upgrading to full type
resolution via the TypeScript type checker is tracked as **W0.1.6**.

#### W0.1.1 progress — `FinancialStatementTemplates.tsx` (2026-08-17)

The worst module on the W0.1.1 worklist (59 unsafe operations) is now at **0**, taking the
ratchet from 740 → **681 unsafe operations (78.7% safe)**.

The float arithmetic turned out to be the _smaller_ defect. The page fabricated financial
statements from hardcoded ratios while reading the user's real general ledger: cash was
`assets * 0.15`, receivables `assets * 0.1`, product revenue `revenue * 0.7`, the budget
column `revenue * 0.95`, and variance percentages were literals (`5.3`) that did not even
agree with the variance dollars beside them. The output was exportable to PDF and Excel
from `/reports/templates`. Under K18 this is Severity-0: invented numbers presented as
statements are worse than an error, because they are plausible.

Two further defects surfaced while fixing it:

- **Only 10 of the 110 emitted keys ever rendered.** The renderer builds its lookup key as
  `label.toLowerCase().replace(/[^a-z]/g,'')`, so `'product revenue_actual'` (with a space)
  could never match `productrevenue_actual`. Measured on a live render: 126 of 161 cells
  were already showing an em dash. Most of the fabrication was dead code that only _looked_
  authoritative in source review.
- **Contra entries were double-counted.** Sums used `Math.abs(debit - credit)`, so a sales
  return or vendor credit _increased_ revenue and COGS instead of reducing them.

Derivation moved to `src/pages/reports/financialStatementData.ts` — decimal.js throughout,
debit-normal and credit-normal netting per account class, and a hard rule: a line is emitted
only when the posted GL supports it. Captions the GL cannot substantiate (cash vs
receivables, D&A, cash-flow activities) are omitted and listed in an on-screen
"not derivable from the posted General Ledger" disclosure, so absence is explained rather
than silently blank. Budget-vs-Actual now reads posted `budgetStore` line items and omits
all budget columns when none exist.

Pinned by 21 tests in `src/pages/reports/financialStatementData.test.ts`, including a
source-level guard that fails if any ratio multiplier (`* 0.15`, `.times(0.15)`) reappears
in the derivation module. The guard was verified to fail when a ratio is reintroduced.

**Note for the remaining worklist:** the mock-data audit did not catch this, because it
looks for synthetic _arrays_ and this fabrication was inline arithmetic on real data.
Remaining W0.1.1 modules must be read for invented values, not only for float arithmetic.

**Exit criterion:** `docs/architecture/PERSISTENCE_MAP.md` exists and is CI-drift-checked; no monetary value
is persisted as an IEEE-754 `number`; `glStore` is server-authoritative; every local-only
surface says so.

### Workstream 0.7 — Task sizing & independence proof (XVIII-N)

**Every Phase 0 item above is decomposed to a task of ≤ 1 week for one engineer.** Items
that could not be honestly sized under a week were split; the split is shown here so the
sizing claim is auditable rather than asserted.

| Item                            | Sub-tasks (each ≤ 1 week)                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.1 Money safety to 90%       | (a) AST detector + ratchet script (done 0.1.0) · (b) `FinancialStatementTemplates.tsx` (done — 59 → 0) · (c) convert consolidation + variance engines · (d) convert forecast + scenario engines · (e) convert server route boundaries · (f) convert store selectors that format money |
| 0.1.2 Eliminate float paths     | (a) guardrail script + allow-list of non-financial uses · (b) remediate `src/engines` hits · (c) remediate `server/src` hits                                                                                                                                                          |
| 0.1.3 Total money type          | (a) type definition + codemod · (b) engine boundary signatures · (c) fix fallout                                                                                                                                                                                                      |
| 0.2.1 `tenant_id` everywhere    | (a) M001 migration + backfill · (b) repository signature change · (c) rehearsal test on a seeded copy                                                                                                                                                                                 |
| 0.2.2 Environments              | (a) M002 migration · (b) `environment_id` on governed objects · (c) default-to-prod backfill                                                                                                                                                                                          |
| 0.2.3 Repository pattern        | (a) inventory SQL outside `server/src/db/` · (b) move it · (c) guardrail rule                                                                                                                                                                                                         |
| 0.2.4 Policy predicate compiler | (a) predicate DSL + compiler · (b) mandatory query-builder filter · (c) per-table leak test generator                                                                                                                                                                                 |
| 0.3.1 Runtime oracle            | (a) extract oracle from test harness into an engine module · (b) wire into write path · (c) non-disableable assertion + negative test                                                                                                                                                 |
| 0.4.1 Error registry            | (a) registry source + codegen · (b) migrate existing thrown errors · (c) lint rule                                                                                                                                                                                                    |
| 0.5.1 Route inventory           | (a) route extractor → `docs/product/ROUTE_MAP.md` · (b) pillar classification · (c) drift check in CI                                                                                                                                                                                 |
| 0.5.2 Shell + palette           | (a) five-pillar shell · (b) ⌘K palette · (c) permission filtering · (d) ≤3-click E2E                                                                                                                                                                                                  |
| 0.5.3 Route consolidation       | (a) redirect table · (b) collapse batch 1 (≈80 routes) · (c) collapse batch 2 · (d) 404 sweep                                                                                                                                                                                         |
| 0.6.1 LLM chokepoint            | (a) chokepoint module · (b) ban direct SDK imports · (c) redaction default + egress test                                                                                                                                                                                              |
| 0.8.1 Persistence inventory     | (a) enumerate + classify 43 stores · (b) write `docs/architecture/PERSISTENCE_MAP.md` · (c) CI drift check                                                                                                                                                                            |
| 0.8.2 Money-safe serialization  | (a) decimal-string codec · (b) apply to financial stores · (c) 10k-case round-trip property test                                                                                                                                                                                      |
| 0.8.4 Schema fork closure       | (a) diff the two schema sources · (b) reconcile · (c) CI equality gate                                                                                                                                                                                                                |
| 0.8.6 `glStore` authority spike | (a) server read/write path · (b) offline replica + reconnect · (c) typed conflict resolution on decimals                                                                                                                                                                              |

**Phase 0 independence proof.** Phase 0 has **zero dependencies on Phase 1 deliverables**.
Specifically, it does not require: the lineage graph (F-PLAT-005), the metric store
(F-SEM-001), MDM/SCD2 (F-MDM-001), the connector framework (F-INTEGRATE-000), workflow
state machines (F-WORKFLOW-008), or PostgreSQL. Each Phase 0 workstream operates on
schema, guardrails, and shell concerns that exist today:

```
0.1 money        → src/utils/money.ts exists; migration is mechanical
0.2 tenancy      → additive columns + repository refactor; SQLite is sufficient (stage S0/S1)
0.3 runtime gate → oracle logic already exists as a test; promotion is a wiring change
0.4 error codes  → new module + codegen; no data dependency
0.5 navigation   → routing layer only; consumes no new backend capability
0.6 AI guardrail → chokepoint module; degrades safely to "AI disabled"
0.8 persistence  → existing stores + existing Express/SQLite service; no new infrastructure
```

**Intra-phase ordering correction (session 004).** Phase 0 is independent of Phase 1, but it
is **not** internally unordered. `0.8.1–0.8.3` (persistence authority) must precede
`0.2.1` (`tenant_id` everywhere): adding tenancy columns to a database that is not yet the
system of record produces governed columns that nothing writes to, and would let the Phase 0
gate pass while the ledger still lives in `localStorage`. Required order:

```
0.1 money ─► 0.8.1–0.8.3 persistence authority ─► 0.2 tenancy ─► 0.3 runtime gate
                    │
0.4 error registry ─┼─ independent, any time
0.5 navigation ─────┤
0.6 AI guardrail ───┘
0.8.6 glStore spike ─── after 0.2 (needs tenant scoping to be meaningful)
```

The reverse is not true — every Phase 1 workstream depends on Phase 0. That asymmetry is
the reason for the ordering (Section 18.1) and is re-verified at the Phase 0 exit gate.

### 🚦 Phase 0 exit gate

```
□ Money safety ≥ 90% measured by the AST detector (`npm run money:ast`, baseline
  78.55% / 740 unsafe ops on 2026-08-17), not the import-regex proxy;
  zero float in financial paths; money mutation score ≥ 80%
□ No monetary value is persisted as an IEEE-754 number anywhere (0.8.2 property test green)
□ PERSISTENCE_MAP.md exists, CI-drift-checked; glStore is server-authoritative (0.8)
□ One schema source; src-tauri/migrations vs server DDL equality gate green (0.8.4)
□ tenant_id + environment_id on every governed table; cross-tenant leak test per table green
□ Three-statement validation runs at RUNTIME and blocks writes
□ Error registry live; build fails on uncoded errors
□ ≤ 40 top-level routes; ⌘K palette; ROUTE_MAP.md in CI
□ LLM chokepoint enforced; redaction default proven by test
□ Every Phase 0 task closed at ≤ 1 week of actual effort, or split and re-planned
□ tsc clean · eslint clean · full suite green · no coverage regression
□ SHI ≥ 78 · UVI ≥ 52 · DEI ≥ 60 (measured, recorded in .agent/state.json)
```

---

## 18.3 PHASE 1 — THE GOVERNED CORE

**Duration:** 12 weeks · **Theme:** _Every number has a definition, a source, and a history._
**Index movement:** SHI 78 → 85 · UVI 52 → 74 · DEI 60 → 80

### Workstream 1.1 — Semantic layer (F-SEM-001, K21)

Governed metric store (M006): definitions as AST, versioned, owned, certified via
maker-checker. Every report, dashboard, KPI, and pack figure resolves through it. A
hardcoded formula in a UI component becomes a build failure. Seed catalogue of ~80 system
metrics with tests. GAAP-reconciliation link for every non-GAAP metric (MET4).

### Workstream 1.2 — Lineage graph (F-PLAT-005)

Real append-only graph (M004, M005): `lineage_nodes` + `lineage_edges` with DB triggers
forbidding UPDATE/DELETE. `lineage_node_id NOT NULL` on every fact (RULE D4). Drill-through
API + UI: any number → contributing facts → transformation → source record, in one click.
E2E test asserts the auditor's promise end to end.

### Workstream 1.3 — MDM & temporal core (F-MDM-001, K22)

SCD2 on entities, accounts, and dimension members (M008). `?asOf=` on every read.
Fiscal calendar engine: gregorian, offset FY, 4-4-5 / 4-5-4 / 5-4-4, 13-period, 53-week
with an explicit 53rd-week allocation policy, custom period tables, and public-sector
appropriation years. Tenant `close_timezone`; DST tests for America/New_York and
Europe/London mandatory. Merge/survivorship workflow with a recorded decision.

### Workstream 1.4 — Multi-book (K23)

`books` table (M007). Book selection at session and report level; **never mix books in one
total** (MB3, enforced — `FIN-008`). Typed adjustment journals: GAAP_TO_IFRS, MGMT_TO_STAT,
TAX_TO_BOOK, ELIM, RECLASS. Independent period status per book. Local-GAAP packs are
declared **Not available** rather than approximated (XXXIII honesty rule).

### Workstream 1.5 — Controls (F-CTRL-001, F-WORKFLOW-007, F-WORKFLOW-008)

Declarative workflow engine (M009) with server-side guards including `notSubmitter`.
Maker-checker on the full Section 13.3 object list. SoD matrix enforced in application and
database. Auditor read-only role with its own access log. Audit hash-chain (M010) +
`/v1/audit/verify`.

### Workstream 1.6 — Integration foundation (F-INTEGRATE-000)

Inbox + outbox + DLQ + replay UI (M011). Adapter contract (Section 8.1). Reconciliation
report mandatory on every sync — no report, no success. Then, and only then, the C0
connectors: CSV/XLSX with field mapping, and an FX feed.

### Workstream 1.7 — Collaboration safety (F-COLLAB-002, COL1/COL3/COL4)

Presence and comments ship. Cell-level leases on monetary inputs. Optimistic concurrency
with typed conflict rejection (`OMNI-CONFLICT` / step-up path). CRDT for comments only.
**Never last-write-wins on a decimal amount.**

### Workstream 1.8 — Security completion (F-SEC-003, F-SEC-004)

Field-level masking at the data layer (API, exports, logs, AI prompts). SCIM 2.0, JML
flows, break-glass with dual control and recorded sessions, quarterly access recertification.

### 🚦 Phase 1 exit gate

```
□ Zero facts without lineage; drill-through E2E green
□ Zero hardcoded metric formulas outside the metric store
□ SCD2 + ?asOf= working; DST and 53-week tests green
□ Book mixing impossible; FIN-008 emitted and tested
□ Maker-checker + SoD enforced server-side; auditor role shipped
□ Audit chain verifiable; tamper test detected
□ Inbox/outbox/DLQ live; every sync produces a reconciliation report
□ Money adoption ≥ 90%; coverage ratchet raised
□ SHI ≥ 85 · UVI ≥ 74 · DEI ≥ 80
```

---

## 18.4 PHASE 2 — DEPTH & DISPLACEMENT

**Duration:** 20 weeks · **Theme:** _Do the finance work end to end, better than the incumbent._
**Index movement:** SHI 85 → 90 · UVI 74 → 88 · DEI 80 → 90

- **Close OS (XXXIV):** close calendar, task templates, dependencies, SLA clocks, evidence
  locker, e-sign certification, journal engine (recurring/reversing/allocation/statistical),
  account reconciliation with matching and rollforwards, flux and commentary with lineage
  links, restatement protocol (superseded packs, never silent rewrites).
- **Consolidation depth (XXXVIII):** IC matching with tolerances and dispute workflow, full
  elimination identity set including investment-in-sub vs equity and unrealised inventory
  profit, NCI, equity method vs full vs proportionate declared per investee, IAS 21
  remeasurement vs translation distinguished. `IC1` post-elim netting assertion is blocking.
- **Treasury (XXXV):** bank account master via aggregator tokens (never stored credentials),
  13-week direct cash forecast, debt schedules with day-count conventions, covenant
  definitions as code with a headroom dashboard and a P0 breach-forecast alert.
- **RevRec Phase 2 (XXXVI):** compute recognition for standard SaaS/subscription; deferred
  revenue waterfall tying to the balance sheet.
- **Leases & SBC Phase 2 (XXXVII):** compute ROU/liability schedules from abstracts;
  grant register with vesting and expense attribution.
- **Reporting:** board pack generator with freeze, watermark, secure expiring links,
  superseded banner; PDF/PPTX/XLSX fidelity; scheduling on a fiscal-aware calendar.
- **Vertical packs V1+V2:** eight packs migrated to the pack contract (PK1–PK6) with golden
  tests. The 15 existing sector configs are converted or explicitly reclassified as UI config.
- **Connectors C1–C4:** NetSuite, QuickBooks, Xero, Sage Intacct, D365, Salesforce, HubSpot,
  Workday, BambooHR, Stripe, Zuora, Chargebee.
- **Excel add-in (XLIX):** Office.js, cells bound to metric queries, writeback only to
  unlocked input cells, fully audited, offline replay through the COL6 conflict protocol.
- **Platform:** PostgreSQL cutover (S2, M013) with full dress rehearsal and reconciliation;
  read replicas; BullMQ; entitlements + metering engine (XLIV).
- **Compliance:** SOC 2 Type II readiness, evidence pipeline, SOX/ICFR control library with
  narratives generated from actual workflow graphs.

### 🚦 Phase 2 exit gate

```
□ A real customer closes a real month end-to-end in OmniPlan with no spreadsheet
□ 20-entity multi-currency consolidation reconciles to the cent; IC nets to 0
□ Board pack generated from live actuals, frozen, watermarked, drillable
□ 8 vertical packs pass golden-number tests
□ ≥ 10 production connectors with reconciliation on every sync
□ PostgreSQL in production; RLS native + app-layer dual enforcement
□ k6 load profile passes at Phase 2 scale; perf budgets green
□ SOC 2 Type II fieldwork underway; no uncertified claims published
□ SHI ≥ 90 · UVI ≥ 88 · DEI ≥ 90
```

---

## 18.5 PHASE 3 — GENERAL AVAILABILITY

**Duration:** 20 weeks · **Theme:** _Enterprise-grade, industry-complete, provably correct._
**Index target:** **SHI ≥ 92 · UVI ≥ 95 · DEI ≥ 95** (the mandated acceptance bar)

Verticals V3–V5 (all 25 packs). Connectors C5–C8 (SAP, Oracle, warehouses, banks, iPaaS).
ESG/sustainability module (XXXIX) with versioned emission factors and restatement
discipline. Deal room, M&A models, and impairment workflow (LV). Tax provision Phase 3
(Pillar Two, CbCR helper). Hedge accounting pack. Public API + generated SDKs + embed SDK.
Mobile (review/approve only, per the Section 9.10 non-goals). Slack/Teams apps.
i18n Phase 2/3 language sets with RTL. AI Tier 3 behind review diffs. SOC 2 Type II report
issued, ISO 27001 certified. Customer-managed VPC deployment. Full DR programme with
monthly rehearsed restores.

### 🚦 GA gate (non-negotiable)

```
□ SHI ≥ 92 · UVI ≥ 95 · DEI ≥ 95, measured and published
□ Zero Severity-0 defects, ever, in the trailing 90 days
□ Three-statement assertion pass ratio = 100% in production
□ Every published claim is true: no uncertified certification named (LII)
□ Every runbook rehearsed and timed; RTO ≤ 4h, RPO ≤ 15m demonstrated
□ 14-day implementation playbook (LVIII) executed successfully with 3 design partners
□ Accessibility: WCAG 2.2 AA verified on every route by audit, not just axe
```

---

## 18.6 Sequencing dependency graph (why this order and no other)

```
money primitive ──┬─► every engine
                  └─► every report
tenancy + envs ───┬─► RLS ──► field masking ──► SCIM/SoD ──► auditor role
                  └─► promotion pipeline
error registry ───► every user-facing surface
lineage graph ────┬─► drill-through ──► auditor promise ──► board pack trust
                  └─► restatement protocol
metric store ─────┬─► every KPI ──► vertical packs ──► board pack
                  └─► Excel add-in bindings
SCD2 + calendars ─┬─► as-of reporting ──► restatement ──► "what did the pack say then"
                  └─► multi-book period status
workflow engine ──┬─► maker-checker ──► close OS ──► SOX evidence
                  └─► approval routing
inbox/outbox/DLQ ─► every connector ──► reconciliation ──► close readiness
```

Every arrow is a hard dependency. Building a downstream item first guarantees a rebuild.

---

## 18.7 Scheduling ledger — every non-BUILT feature names a phase (ADR-013)

The audit that preceded this section found 16 `NOT STARTED` features present in §3 but
absent from every phase in §18. Two of them are advertised in §0.5 as headline
differentiators, and one is the K20 filter itself. This ledger closes that hole: **a
feature may be deferred, but it may not be unscheduled.**

### Pulled into an existing phase (differentiator-critical)

| Feature         | Title                                      | Phase       | Why it cannot drift                                                                      |
| --------------- | ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| F-INTEGRATE-006 | Excel/Sheets import + live two-way sync    | **Phase 2** | **K20 filter.** §0.5 sells "Excel deconstruction"; §19.2 makes Excel the real incumbent. |
| F-MIGRATE-001   | Excel deconstruction protocol (XXVIII)     | **Phase 2** | §0.5 differentiator + PR-06; the 14-day playbook (A.17) is unachievable without it.      |
| F-REPORT-007    | Scheduled distribution (email/Slack/Teams) | **Phase 2** | A board pack nobody receives is not a board pack; A.11 escalations depend on it.         |
| F-AI-007        | Forecast accuracy scoring                  | **Phase 2** | §12.4 forecasting claims are unfalsifiable without a scoring backtest.                   |
| F-PLAN-007      | Pipeline-weighted revenue forecast         | **Phase 2** | Required by the SaaS pack's KPI set (§7.4); a pack without it fails PK2.                 |
| F-INTEGRATE-002 | CRM connectors                             | **Phase 2** | Prerequisite for F-PLAN-007; gated behind F-INTEGRATE-000.                               |
| F-INTEGRATE-003 | HRIS connectors                            | **Phase 2** | Workforce planning actuals; gated behind F-INTEGRATE-000.                                |
| F-INTEGRATE-004 | Billing connectors                         | **Phase 2** | ARR/MRR truth for the SaaS pack; gated behind F-INTEGRATE-000.                           |

### Scheduled to Phase 3 / GA

| Feature         | Title                                   | Phase       | Note                                                                |
| --------------- | --------------------------------------- | ----------- | ------------------------------------------------------------------- |
| F-INTEGRATE-005 | Data-warehouse connectors               | **Phase 3** | Enterprise procurement requirement; needs the storage tiers (A.20). |
| F-AI-010        | Data-quality AI (mapping, dup accounts) | **Phase 3** | Advisory only; must never auto-post (§12.2 tiering).                |
| F-PLAN-011      | M&A modelling                           | **Phase 3** | Depends on A.16; large surface, low frequency.                      |
| F-REPORT-010    | Benchmark database                      | **Phase 3** | Requires multi-tenant consented aggregation — privacy gate (A.13).  |

### Explicitly deferred beyond GA (declared, not forgotten)

| Feature         | Title                           | Status                 | Reason                                                                      |
| --------------- | ------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| F-UDF-001       | Wasm-sandboxed UDFs (Part XXVI) | **v2+, not scheduled** | ADR-004 — no `cargo`/`rustc` in this environment; unverifiable, so unbuilt. |
| F-PLAN-013      | Transfer pricing support        | **v2+, not scheduled** | Needs A.8 intercompany maturity first; niche until enterprise demand.       |
| F-PLAN-015      | Equity / cap-table modelling    | **v2+, not scheduled** | Adjacent domain; not FP&A core. Revisit on design-partner pull.             |
| F-INTEGRATE-009 | iPaaS connectors                | **v2+, not scheduled** | Commoditised; a public API (§15.7) serves the same need sooner.             |
| F-INTEGRATE-012 | Market data                     | **v2+, not scheduled** | Licensing cost with no correctness benefit at current scale.                |

### Windows desktop features (Section 23) and escape-closing features (Section 24)

Added session 005. Desktop items carry the §23.8 caveat: **none may be marked `BUILT` from
this sandbox** (no `cargo`/`rustc`, no Windows); each requires execution on real hardware.

| Feature        | Title                                    | Phase       | Rationale                                                                              |
| -------------- | ---------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| F-DESK-001     | Native local SQLite database             | **Phase 0** | The desktop half of W0.8 persistence authority — no financial truth in `localStorage`. |
| F-DESK-006     | OS credential storage                    | **Phase 0** | Key custody for the encrypted local DB; implemented, needs Windows verification.       |
| F-DESK-012     | Crash reporting with money/PII redaction | **Phase 0** | §12.3 egress rule extends to crash dumps; currently unverified (R-26).                 |
| F-DESK-002     | True offline modelling                   | **Phase 1** | Makes the §0.5 "local-first + governed" differentiator literally true.                 |
| F-DESK-003     | File associations + drag-drop            | **Phase 1** | File-system gravity; the desktop's core ergonomic advantage.                           |
| F-DESK-005     | Native print + page setup                | **Phase 1** | Delivers the §14.8 pixel-fidelity promise a browser cannot honour.                     |
| F-DESK-010     | Signed auto-update, policy-disableable   | **Phase 1** | Resolves the §23.5 ambiguity before any external distribution.                         |
| F-DESK-007     | Global shortcut + tray                   | **Phase 2** | Plugins present; wiring only.                                                          |
| F-DESK-008     | Native notifications                     | **Phase 2** | Pairs with A.11 digests/escalations.                                                   |
| F-DESK-009     | Multi-window / second monitor            | **Phase 2** | Most-requested FP&A ergonomic; `window-state` plugin present.                          |
| F-DESK-011     | Local Excel round-trip                   | **Phase 2** | Desktop half of the K20 filter; pairs with F-INTEGRATE-006.                            |
| F-DESK-004     | Watched-folder ingestion                 | **Phase 2** | Automates the controller-workbook river; gated behind maker-checker.                   |
| F-ANALYSIS-001 | Native pivot / ad-hoc analysis           | **Phase 2** | Escape ledger row 15 — the top reason analysts return to Excel.                        |
| F-REPORT-013   | Narrative / MD&A with live bindings      | **Phase 2** | Escape ledger row 27 — removes the Word escape from board-pack production.             |
| F-REPORT-014   | Model documentation generator            | **Phase 3** | Escape ledger row 30 — replaces the unmaintained handover document.                    |

### CI enforcement

```bash
# Every NOT STARTED feature must be scheduled or explicitly deferred.
# Empty output = pass. Wired into `docs:verify`.
comm -23 <(not_started_ids) <(scheduled_ids; declared_deferred_ids)
```

This makes "we forgot to schedule the differentiator" a build failure rather than a
discovery made two phases later.

# SECTION 19 — GAP ANALYSIS VS COMPETITORS

## 19.1 Method

For each incumbent: what it genuinely does well (stated honestly — a competitor analysis
that finds no strengths is marketing, not analysis), where it fails its users, and what
OmniPlan must ship to displace it. "Where we are today" is measured against this
repository, not aspiration.

## 19.2 Microsoft Excel (the real incumbent — ~70% of FP&A)

|                              |                                                                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Genuinely wins on**        | Universality, zero learning curve, infinite flexibility, instant start, offline, every finance professional is already expert                                                                                             |
| **Fails on**                 | No audit trail, no access control, version chaos (`Budget_v7_FINAL_v2.xlsx`), broken links, no multi-user truth, formula errors invisible until they are expensive, no lineage, no workflow, does not scale past ~1M rows |
| **Displacement requirement** | Match Excel's _feel_ (Section 9.5 grid, LIII function library, keyboard parity) while adding what it structurally cannot have: governance, lineage, concurrency safety, audit                                             |
| **OmniPlan today**           | Grid exists (AG Grid); formula engine exists (4 modules); **no lineage, no governed metrics, no maker-checker**                                                                                                           |
| **Gap closed by**            | Phase 0 (grid/nav), Phase 1 (lineage, metrics, controls), Phase 2 (Excel add-in — meet users where they are rather than fighting them)                                                                                    |

## 19.3 Anaplan

|                              |                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Genuinely wins on**        | Hyperblock multidimensional engine, genuine enterprise scale, strong connected-planning story beyond finance                                                 |
| **Fails on**                 | 6–12 month implementations, requires certified "Model Builders" (a priesthood), high TCO, sparse-model memory limits, rigid once built, poor ad-hoc analysis |
| **Displacement requirement** | Self-serve modelling with **no certification required**, 14-day time-to-value (LVIII), comparable dimensional power via sparse facts + metric store          |
| **OmniPlan today**           | Engines exist; **no dimensional metadata layer, no MDM, no as-of**                                                                                           |
| **Gap closed by**            | Phase 1 (MDM, dimensions, hierarchies, metric store), Phase 2 (scale + packs)                                                                                |

## 19.4 Workday Adaptive Planning

|                              |                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Genuinely wins on**        | Fast mid-market deployment, solid Workday HCM integration, decent standard reporting                                                 |
| **Fails on**                 | Weak modelling depth, poor performance on large models, dated UX, limited dimensionality, expensive to extend, consolidation is thin |
| **Displacement requirement** | Better modelling depth _and_ better UX at the same deployment speed; genuine multi-entity consolidation                              |
| **OmniPlan today**           | Consolidation engines (2) exist; **no IC matching, no NCI, no elimination identity tests**                                           |
| **Gap closed by**            | Phase 2 (Close OS + consolidation depth XXXVIII)                                                                                     |

## 19.5 Vena Solutions

|                              |                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Genuinely wins on**        | Excel-native — the lowest change-management cost in the category                                                                                               |
| **Fails on**                 | Still fundamentally Excel underneath, so it inherits Excel's fragility; database is a bolt-on; performance degrades with workbook complexity; audit is partial |
| **Displacement requirement** | Excel-_compatible_ rather than Excel-_dependent_: the same familiarity with an actual governed database behind it (K28 — replace, don't wrap)                  |
| **OmniPlan today**           | Import/export exists; **no live add-in, no writeback governance**                                                                                              |
| **Gap closed by**            | Phase 2 (XLIX Excel add-in with governed writeback)                                                                                                            |

## 19.6 Planful

|                              |                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| **Genuinely wins on**        | Structured close + consolidation, reasonable mid-market fit                                      |
| **Fails on**                 | Limited modelling flexibility, weak scenario capability, dated interface, limited dimensionality |
| **Displacement requirement** | Unlimited scenario branching, superior modelling, modern UX                                      |
| **OmniPlan today**           | ScenarioEngine exists; **no branch/merge with AST 3-way diff**                                   |
| **Gap closed by**            | Phase 1 (scenarios + environments), Phase 2 (model releases, XL)                                 |

## 19.7 Oracle EPM / SAP BPC / OneStream

|                              |                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Genuinely wins on**        | Deep statutory consolidation, true enterprise governance, breadth of regulatory coverage (OneStream especially)           |
| **Fails on**                 | Enormous cost, multi-year implementations, consultant dependency, UX built for administrators rather than analysts        |
| **Displacement requirement** | Match statutory depth (multi-book, local GAAP packs, IC eliminations, restatement) at a fraction of implementation cost   |
| **OmniPlan today**           | **No multi-book, no local GAAP packs, no restatement protocol**                                                           |
| **Gap closed by**            | Phase 1 (multi-book), Phase 2 (Close OS, restatement), Phase 3 (local GAAP packs — declared **Not available** until real) |

## 19.8 Power BI / Tableau / Looker

|                              |                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Genuinely wins on**        | Visualisation, ad-hoc exploration, broad data-source connectivity, ubiquity                                                                                           |
| **Fails on**                 | **Read-only** — they cannot plan, cannot write back, have no workflow, no approvals, no period locks; metric definitions drift across reports; not a system of record |
| **Displacement requirement** | Analysis _and_ planning in one governed surface, with a single certified metric definition (K21)                                                                      |
| **OmniPlan today**           | Charts exist; **no governed metric store — same drift problem as BI tools**                                                                                           |
| **Gap closed by**            | Phase 1 (metric store), Phase 2 (reporting depth)                                                                                                                     |

## 19.9 BlackLine / FloQast / Cadency (close management)

|                              |                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Genuinely wins on**        | Mature close checklists, reconciliation matching, SOX evidence                                                              |
| **Fails on**                 | Close-only — disconnected from planning, so actuals and plans live in different worlds; another system to buy and integrate |
| **Displacement requirement** | Close OS _inside_ the planning platform so the actuals that close feed the forecast that plans, with one audit trail        |
| **OmniPlan today**           | PeriodEngine (3 modules) exists; **no close calendar, no reconciliation workflow, no evidence locker**                      |
| **Gap closed by**            | Phase 2 (XXXIV Close OS)                                                                                                    |

## 19.10 Consolidated gap summary — what OmniPlan must be true about

| Capability                  | Excel | Anaplan | Adaptive | Vena | Planful | OneStream | Power BI | BlackLine | **OmniPlan target** |
| --------------------------- | ----- | ------- | -------- | ---- | ------- | --------- | -------- | --------- | ------------------- |
| Familiar grid + formulas    | ✅    | ⚠️      | ⚠️       | ✅   | ⚠️      | ⚠️        | ❌       | ❌        | **✅**              |
| Governed metric layer       | ❌    | ⚠️      | ⚠️       | ❌   | ⚠️      | ✅        | ❌       | ❌        | **✅**              |
| Cell-level lineage          | ❌    | ⚠️      | ❌       | ❌   | ❌      | ⚠️        | ❌       | ⚠️        | **✅**              |
| Multi-entity consolidation  | ❌    | ⚠️      | ⚠️       | ⚠️   | ✅      | ✅        | ❌       | ❌        | **✅**              |
| Multi-book / local GAAP     | ❌    | ❌      | ❌       | ❌   | ⚠️      | ✅        | ❌       | ❌        | **✅**              |
| Close orchestration         | ❌    | ❌      | ⚠️       | ⚠️   | ✅      | ✅        | ❌       | ✅        | **✅**              |
| Maker-checker + SoD         | ❌    | ⚠️      | ⚠️       | ⚠️   | ⚠️      | ✅        | ❌       | ✅        | **✅**              |
| Scenario branching          | ⚠️    | ✅      | ⚠️       | ⚠️   | ⚠️      | ⚠️        | ❌       | ❌        | **✅**              |
| Self-serve (no consultants) | ✅    | ❌      | ⚠️       | ✅   | ⚠️      | ❌        | ✅       | ⚠️        | **✅**              |
| Time-to-value ≤ 14 days     | ✅    | ❌      | ⚠️       | ✅   | ⚠️      | ❌        | ✅       | ⚠️        | **✅**              |
| Industry packs              | ❌    | ⚠️      | ⚠️       | ❌   | ⚠️      | ⚠️        | ❌       | ❌        | **✅**              |
| ESG / carbon planning       | ❌    | ⚠️      | ❌       | ❌   | ❌      | ⚠️        | ⚠️       | ❌        | **✅**              |

**The strategic conclusion:** no incumbent is simultaneously _familiar_, _governed_, and
_fast to value_. Excel has familiarity and speed without governance; OneStream has
governance without speed or familiarity; Power BI has speed and familiarity without
planning or governance. **That intersection is OmniPlan's entire reason to exist**, and
every roadmap decision above is subordinate to occupying it.

---

# SECTION 20 — RISK REGISTER

Scored as Likelihood (1–5) × Impact (1–5). Anything ≥ 15 requires a named owner and an
active mitigation in the current phase.

| ID   | Risk                                                                                                                                                                                                                                       | L   | I   | Score  | Mitigation                                                                                                                                                            | Trigger to escalate                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| R-01 | **A wrong number reaches a customer's board pack.** The existential risk.                                                                                                                                                                  | 3   | 5   | **15** | Runtime three-statement gate (0.3), golden fixtures, property tests, mutation testing on money, reconciliation on every import, lineage for every fact                | Any `FIN-000` in production                                                         |
| R-02 | Money-primitive migration stalls at partial adoption, leaving mixed float/decimal paths — the most dangerous possible state                                                                                                                | 4   | 5   | **20** | Ratchet script; Phase 0 gate at 60%, Phase 1 at 90%; no feature work merges that lowers adoption                                                                      | Adoption flat for 2 consecutive weeks                                               |
| R-03 | Scope paralysis — 96 features, 25 verticals, and nothing ships                                                                                                                                                                             | 4   | 4   | **16** | Hard phase gates; Phase 0 ships almost no features on purpose; vertical packs deferred to Phase 2/3                                                                   | Phase overruns by > 25%                                                             |
| R-04 | Retrofitting tenancy later requires touching every table and query                                                                                                                                                                         | 3   | 5   | **15** | `tenant_id` in Phase 0, before anything else stores data (M001)                                                                                                       | Any new table shipped without `tenant_id`                                           |
| R-05 | Cross-tenant data leak                                                                                                                                                                                                                     | 2   | 5   | 10     | Dual enforcement PC4; per-table leak tests; deny-by-default; no admin bypass query                                                                                    | Any leak test added without a passing assertion                                     |
| R-06 | Environment degradation hides real problems — no Docker/Postgres/Rust means RLS, scale, and Wasm claims are unverifiable here                                                                                                              | 5   | 3   | **15** | Explicitly label unverifiable claims "designed for, not proven"; require real-infra validation before any scale or certification claim                                | A scale claim published without a k6 run                                            |
| R-07 | The 193-route sprawl makes the product unlearnable; users churn in trial                                                                                                                                                                   | 4   | 4   | **16** | Phase 0 workstream 0.5; ≤ 40 routes; ⌘K; ROUTE_MAP drift gate                                                                                                         | Trial activation < 40%                                                              |
| R-08 | Connector built before inbox/outbox → duplicate or lost financial records                                                                                                                                                                  | 3   | 5   | **15** | F-INTEGRATE-000 is a hard prerequisite; no connector PR merges before it                                                                                              | Any adapter PR without idempotency                                                  |
| R-09 | LLM egress of customer monetary data                                                                                                                                                                                                       | 2   | 5   | 10     | Single chokepoint, REDACTED default, per-feature opt-in, audit of every call, zero-retention endpoints only                                                           | Any direct SDK import outside the chokepoint                                        |
| R-10 | Claiming a certification that does not exist                                                                                                                                                                                               | 2   | 5   | 10     | LII honesty matrix; "designed to meet" language until the report is issued; legal review of all claims                                                                | Any marketing draft naming an unissued cert                                         |
| R-11 | The Codex-prescribed stack (Next.js/Fastify/Prisma/Kafka/Rust) is imposed as a rewrite, destroying 455k lines and 1,228 green tests                                                                                                        | 3   | 5   | **15** | ADR-003 (Section 21) records the reasoned deviation with evidence; evolution path S0→S4 is trigger-based                                                              | Any PR that begins a framework migration without a measured trigger                 |
| R-12 | SQLite → PostgreSQL cutover corrupts or loses data                                                                                                                                                                                         | 2   | 5   | 10     | PC1–PC5 portability from Phase 0; M013 full dress rehearsal with row-count and sum reconciliation; verified backup first                                              | Rehearsal reconciliation mismatch of any size                                       |
| R-13 | Vertical packs fork the engine (violating K19), creating 25 unmaintainable codebases                                                                                                                                                       | 3   | 4   | 12     | PK6 — a pack needing an engine change is rejected; generalise the engine instead                                                                                      | Any pack PR touching `src/engines/`                                                 |
| R-14 | Performance collapses at real scale; the DAG recalc does not hold                                                                                                                                                                          | 3   | 4   | 12     | CP1–CP8; CI perf budgets on a fixed dataset; k6 per tier; profiler with top-50 slowest nodes                                                                          | p95 recalc regression > 20%                                                         |
| R-15 | Audit log tampering or hash-chain break                                                                                                                                                                                                    | 2   | 5   | 10     | DB-level append-only, hash chain, `/v1/audit/verify`, alerting on verification failure                                                                                | Any verify failure                                                                  |
| R-16 | Collaboration corrupts numbers via silent merge                                                                                                                                                                                            | 3   | 5   | **15** | COL3/COL4 — leases + typed conflict + explicit human resolution; CRDT restricted to non-monetary content                                                              | Any last-write-wins path on a decimal                                               |
| R-17 | Key-person dependency / context loss between sessions                                                                                                                                                                                      | 4   | 3   | 12     | `.agent/` memory discipline, PROJECT_JOURNAL, ADR log, this blueprint as the single source of intent                                                                  | Any session starting without reading `.agent/state.json`                            |
| R-18 | CI cannot be updated from this environment (no `workflows` permission), so gates silently rot                                                                                                                                              | 4   | 3   | 12     | Numbered `ci-patches/*.patch` with apply instructions; track pending patches in state.json                                                                            | > 2 unapplied patches                                                               |
| R-19 | Restatement handled as an in-place edit, silently changing published history                                                                                                                                                               | 2   | 5   | 10     | R1–R5 restatement protocol; new immutable version; SUPERSEDED banners; disclosure checklist                                                                           | Any UPDATE on a closed-period fact                                                  |
| R-21 | **No system of record.** 43 stores persist financial truth to browser `localStorage`; only 14 non-test files call the server (§0.6.1). Clearing site data destroys the ledger; backup/RTO/RPO/audit claims are unbackable while this holds | 4   | 5   | **20** | Workstream 0.8 — persistence authority, money-safe serialization, `glStore` server-authoritative spike; UI must state local-only durability honestly                  | Any durability, backup, or audit claim made for a store still classified local-only |
| R-22 | **The money gate can read green while money is unsafe.** `money:adoption` detects an _import_ of the primitive by regex, not decimal-correct arithmetic; "0 raw `toFixed`" is therefore not evidence of safety                             | 4   | 5   | **20** | Workstream 0.1.0 replaces the regex with an AST detector before the ≥60% gate is trusted; re-baseline expected to fall before it rises                                | Any adoption figure quoted from the import-regex scanner after 0.1.0 lands          |
| R-23 | Schema forked across `src-tauri/migrations/*.sql` (35 tables) and the server's in-code DDL (9 more) with no drift detection                                                                                                                | 3   | 4   | 12     | Workstream 0.8.4 — single schema source + CI equality gate                                                                                                            | Any table defined in one source and not the other                                   |
| R-24 | **The Windows desktop app cannot be built or verified in this environment** — no `cargo`/`rustc`/Windows (K2). Rust changes ship blind; every desktop claim is unproven here                                                               | 5   | 4   | **20** | §23.8 verification protocol: no `src-tauri/src/*.rs` edits without a real toolchain; nothing marked BUILT until executed on Windows; desktop CI leg via `ci-patches/` | Any desktop capability marked BUILT from this sandbox                               |
| R-25 | Uninstall or a botched upgrade destroys the only copy of a customer's ledger (§0.6.1: local is currently authoritative)                                                                                                                    | 3   | 5   | **15** | Uninstall keeps data by default; automatic pre-migration backup; W0.8 makes the server authoritative so local loss is recoverable                                     | Any uninstall/upgrade path that deletes data without confirmation                   |
| R-26 | Crash reports or telemetry exfiltrate monetary values from a customer machine                                                                                                                                                              | 3   | 5   | **15** | F-DESK-012 redaction before transmission; §12.3 egress chokepoint extends to crash/telemetry; automated scan in CI                                                    | Any crash payload containing a monetary value                                       |
| R-27 | Unsigned installer trips SmartScreen; enterprise buyers cannot deploy and trust collapses at first contact                                                                                                                                 | 4   | 4   | **16** | Code signing mandatory for GA (§23.4); reputation warm-up; MSI for managed deployment                                                                                 | Any external distribution of an unsigned build                                      |
| R-28 | WebView2 absent or policy-blocked on older Windows 10 → blank window on launch                                                                                                                                                             | 3   | 4   | 12     | Evergreen bootstrapper + offline installer variant; explicit actionable error; Tier-1 test on clean Win10 22H2                                                        | Any launch path that can render a blank window                                      |
| R-29 | **"All-in-one" is claimed while users still leave for Excel/Word/PowerPoint** — the promise fails at the demo, not in the backlog                                                                                                          | 4   | 5   | **20** | §24 Zero-Escape Contract: escape ledger, escape-rate ratchet, GA blocked on zero hard escapes in the Core-20                                                          | Any Core-20 row reclassified "legitimate boundary" without an ADR                   |
| R-20 | Non-payment freezes a customer mid-close, causing regulatory harm                                                                                                                                                                          | 2   | 4   | 8      | Fair-use ladder (XLIV): close and audit paths are never frozen without a legal-notice workflow                                                                        | Any hard limit applied to a close path                                              |

---

# SECTION 21 — ADR LOG

Full records live in `docs/adr/`. This is the authoritative index of decisions made during
Blueprint Genesis.

### ADR-001 — Server dependency hygiene via `overrides`, not `npm audit fix`

**Status:** Accepted (pre-existing) · **Context:** `npm audit fix --omit=dev` in `server/`
prunes devDependencies, removing `@types/express`, producing 12 `TS7016` errors and 8
failing test files. **Decision:** use patch-level `overrides` in `server/package.json`.
**Consequence:** advisories are resolved without breaking the type surface.
**Do not retry the audit-fix path.**

### ADR-002 — `server/.npmrc` keeps `ignore-scripts=true`

**Status:** Accepted (pre-existing) · **Context:** supply-chain posture; lifecycle scripts
are an execution vector. **Decision:** keep the flag; bootstrap native bindings explicitly
when needed. **Consequence:** native modules require an explicit rebuild step, which is
documented rather than automatic.

### ADR-003 — Evolve the existing stack; do not adopt the Codex-recommended rewrite

**Status:** Accepted (this session) · **Context:** Article XVIII-G recommends
Next.js/Fastify/Prisma/Postgres/Redis/Kafka/Rust-Wasm. The repository is React 19 + Vite +
Zustand + Express + SQLite, 455,514 lines, 1,228 green test files, `tsc` and `eslint`
clean. The environment has no Docker, no Postgres, no Redis, no `cargo`, 2 cores, 3 GB RAM.
**Decision:** adopt the two-plane architecture (Section 4.3), keep the current stack, and
define trigger-based evolution stages S0–S4 (Section 4.5). Enforce the portability contract
PC1–PC5 so the one architecturally significant migration (SQLite → PostgreSQL) is cheap.
**Consequences:** (+) no loss of verified work, first correct number moves in weeks not
quarters; (−) deviates from the Codex's literal stack list, which must be re-justified at
each stage trigger. **Permitted by K2** (probe before adopting) **and K15** (working code
outranks aspiration).

### ADR-004 — Money is `decimal.js` in pure TypeScript; Rust/Wasm is a non-goal until CI can compile it

**Status:** Accepted · **Context:** `cargo`/`rustc` absent; a Wasm hot path cannot be
built, tested, or verified here. **Decision:** `src/utils/money.ts` (decimal.js, precision
40, ROUND_HALF_UP, deterministic penny allocation) is the sole money primitive; Wasm is
revisited only with a Rust-capable CI runner and a measured performance trigger.
**Consequence:** no unverifiable performance claims.

### ADR-005 — Sparse fact store with incremental rollups; no dense OLAP cube

**Status:** Accepted · **Context:** Part L (ST3) and the combinatorics of 20 dimensions.
**Decision:** store only non-null intersections; precompute common grains as a rebuildable
derived layer that is never the system of record (ST2). Full cube/CQRS split is deferred
until measured latency demands it. **Consequence:** memory-safe at scale; some aggregate
queries need materialisation work in Phase 2.

### ADR-006 — Collaboration uses leases + typed conflicts on money, CRDT only for text

**Status:** Accepted · **Context:** K27, COL3/COL4. **Decision:** never last-write-wins and
never automatic merge on a decimal amount. **Consequence:** slightly more friction for
concurrent editors, in exchange for numbers that cannot be silently corrupted. This trade
is accepted deliberately.

### ADR-007 — Metric store is the single source of calculation truth

**Status:** Accepted · **Context:** K21; BI-tool metric drift (Section 19.8). **Decision:**
every KPI, report figure, pack number, and pack-defined metric resolves through the
governed metric store; hardcoded formulas in UI or pack code are a build failure.
**Consequence:** a migration cost for existing hardcoded calculations, paid in Phase 1.

### ADR-008 — Product renaming (`finplan-pro` → OmniPlan) deferred to Phase 2

**Status:** Accepted · **Context:** the rename touches package names, build IDs, Tauri
identifiers, and desktop update channels; it moves no number and closes no gap.
**Decision:** defer to a Phase 2 ADR with a full impact analysis. **Consequence:** internal
identifiers temporarily differ from the product name; documentation notes this explicitly
rather than hiding it.

### ADR-009 — Vertical packs are data with a compatibility contract, never engine forks

**Status:** Accepted · **Context:** K19. **Decision:** PK1–PK6 (Section 7.2); a pack that
requires an engine change is rejected and the engine is generalised instead.
**Consequence:** occasional engine work to admit a vertical, which is the correct place to
absorb the cost.

### ADR-010 — Three-statement validation is promoted from test-time to runtime

**Status:** Accepted · **Context:** oracles currently exist only as tests
(`financialStatementOracles.test.ts`), so a production write path can violate TS1–TS3
undetected. **Decision:** TS4 becomes a runtime, non-disableable gate on every write
(Phase 0 workstream 0.3). **Consequence:** a small write-path latency cost, accepted
without argument — correctness outranks performance (K18).

### ADR-011 — CI changes ship as numbered patches

**Status:** Accepted · **Context:** the GitHub App lacks `workflows` permission.
**Decision:** deliver every `.github/workflows/**` change as `ci-patches/NNNN-*.patch` with
apply instructions and track pending patches in `.agent/state.json`. **Consequence:**
a human step is required for CI evolution; the alternative is a silent CI drift, which is worse.

### ADR-012 — Default rounding is ROUND_HALF_UP, not banker's rounding

**Status:** Accepted (session 004) · **Context:** Codex XVIII-G line 522 mandates banker's
rounding (half-even) as the default, but Codex line 692 mandates that `0.005` round to
`0.01`, which is half-**up** behaviour — half-even yields `0.00`. The two instructions are
mutually exclusive; `src/utils/money.ts` already implements `ROUND_HALF_UP`.
**Decision:** honour the executable requirement (line 692) over the label (line 522).
Default `ROUND_HALF_UP`; require explicit `ROUND_HALF_EVEN` at the call site for tax
provision (A.7), statutory local-GAAP books (A.3), and any jurisdiction pack that declares
it. No statutory path may rely on the default mode.
**Consequence:** a small, known upward bias on exact-half values in presentation paths,
accepted and documented; statutory correctness is preserved by explicit call-site selection
rather than by a global default. Reversing this decision later is a one-line change to the
`Decimal.set()` default plus a golden-fixture re-baseline, so the cost of being wrong is low.
**Alternative rejected:** switching the global default to half-even, which would silently
change existing golden fixtures and break the Codex's own stated test.

### ADR-013 — Every NOT-STARTED feature must name a phase

**Status:** Accepted (session 004) · **Context:** an audit of the locked blueprint found 16
`NOT STARTED` features that appear in the Feature Universe (§3) but in **no** phase of the
roadmap (§18) — including `F-MIGRATE-001` (Excel deconstruction) and `F-INTEGRATE-006`
(Excel live two-way sync), both of which §0.5 advertises as headline differentiators and
K20 names as the critical filter. Unscheduled work is how a differentiator quietly becomes
vapour. **Decision:** §18.7 now carries a scheduling ledger that assigns a phase to every
non-`BUILT` feature; a feature may be explicitly deferred ("v2+, not scheduled") but it may
not be silently absent. **Consequence:** the roadmap is auditable by script
(`comm -23 not-started scheduled` must be empty apart from the declared deferral list).

---

# SECTION 22 — DEFINITION OF DONE PER PHASE

## 22.1 Universal DoD (every feature, every phase)

The fifteen-point checklist in Section 17.7 applies without exception. A feature that
skips any line is not done; it is in progress.

## 22.2 Phase 0 DoD

```
□ Every Phase 0 exit-gate assertion (18.2) passes and is recorded in .agent/state.json
□ Money adoption ≥ 60%, monotonically increasing, ratchet enforced in CI
□ Zero IEEE-754 float in any financial path (script-verified, not eyeballed)
□ Mutation score ≥ 80% on src/utils/money.ts
□ tenant_id + environment_id on every governed table; leak test per table
□ Runtime three-statement gate active and provably non-disableable
□ Error registry generating both runtime constants and docs
□ ≤ 40 top-level routes; ROUTE_MAP.md drift check in CI; zero broken legacy paths
□ LLM chokepoint enforced; redaction proven by test
□ SHI ≥ 78 · UVI ≥ 52 · DEI ≥ 60, measured with the published rubric
□ PROJECT_JOURNAL updated; every decision has an ADR
```

## 22.3 Phase 1 DoD

```
□ Every Phase 1 exit-gate assertion (18.3) passes
□ Zero facts without a lineage node; drill-through E2E green from report to source record
□ Zero calculation logic outside the metric store or an engine
□ SCD2 + ?asOf= on entities, accounts, dimension members
□ Fiscal calendars: gregorian, offset, 4-4-5/4-5-4/5-4-4, 13-period, 53-week, custom, appropriation
□ DST boundary tests green for America/New_York and Europe/London
□ Multi-book live; cross-book totals impossible; FIN-008 tested
□ Maker-checker + SoD enforced in application AND database
□ Auditor read-only role shipped with its own access log
□ Audit hash chain verifiable; tamper detection test green
□ Inbox/outbox/DLQ live; every sync emits a reconciliation report; replay UI works
□ Cell leases + typed conflict resolution on monetary inputs
□ Field masking enforced in API, exports, logs, and AI prompts
□ Money adoption ≥ 90%; coverage ratchet raised to achieved values
□ SHI ≥ 85 · UVI ≥ 74 · DEI ≥ 80
```

## 22.4 Phase 2 DoD

```
□ Every Phase 2 exit-gate assertion (18.4) passes
□ A design partner closes a real month entirely in OmniPlan, with evidence
□ 20-entity multi-currency consolidation reconciles to the cent; IC nets to zero within tolerance
□ Restatement protocol exercised: prior pack marked SUPERSEDED, never silently altered
□ Board pack frozen, watermarked, expiring-link distributed, drillable to source
□ 8 vertical packs pass golden-number tests under the pack contract
□ ≥ 10 connectors in production, each with reconciliation on every sync
□ Excel add-in writeback governed by the same locks, approvals, and audit as the UI
□ PostgreSQL in production; RLS native + application-layer dual enforcement
□ k6 profile green at Phase 2 scale; all perf budgets met on a fixed dataset
□ SOC 2 Type II fieldwork underway; no uncertified certification claimed anywhere
□ Monthly restore drill rehearsed and timed; RTO/RPO demonstrated
□ SHI ≥ 90 · UVI ≥ 88 · DEI ≥ 90
```

## 22.5 Phase 3 / GA DoD

```
□ Every GA gate assertion (18.5) passes
□ SHI ≥ 92 · UVI ≥ 95 · DEI ≥ 95, measured and published with the rubric
□ Zero Severity-0 defects in the trailing 90 days
□ Three-statement assertion pass ratio = 100% in production, continuously monitored
□ 25 vertical packs, each with ≥ 10 metric-bound KPIs and golden tests
□ Every runbook rehearsed within the last 90 days
□ WCAG 2.2 AA verified by external audit on every route
□ SOC 2 Type II report issued; ISO 27001 certified; claims match reality (LII)
□ 14-day implementation playbook executed with 3 design partners, timed and documented
□ Every roadmap item is either shipped, explicitly deferred with a reason, or an explicit
  non-goal. Nothing is silently dropped.
```

## 22.5.1 Windows desktop & all-in-one GA gates (Sections 23–24)

```
□ Windows 11 + Windows 10 22H2 clean-install verified (MSI silent + NSIS interactive)
□ Installer code-signed; SmartScreen clean; offline installer variant available
□ No blank-window failure mode: WebView2 present, bootstrapped, or actionable error
□ Full offline session proven: model, calculate, report with the network disabled
□ Financial data in encrypted %APPDATA% SQLite, key in Credential Manager — never localStorage
□ Uninstall preserves data by default; upgrade auto-backs-up before migration
□ Per-user isolation verified under RDS/Citrix multi-session
□ Crash reports contain zero monetary values or PII (automated scan)
□ Auto-update signed and policy-disableable, or explicitly disabled — never ambiguous
□ Every desktop capability executed on real Windows (§23.8) — none marked BUILT from the sandbox
□ **ZERO hard escapes across the Core-20 workflows (§24.3)**
□ Escape rate ≤ 5% across the full 30-row ledger, ratcheted in CI
□ A full monthly cycle — ingest → close → consolidate → variance → reforecast → board pack →
  distribute — completes without opening Excel, Word, PowerPoint, or a BI tool
```

## 22.6 The honesty clause (binding on all phases)

> A phase is complete when its gate passes — not when the calendar says so, and not when
> the tickets close. If a gate fails, the correct action is to cut the _next_ phase's
> scope, never to lower the gate. Any gate change requires an ADR explaining what was
> learned that made the original bar wrong. Moving a bar to make a date is the one
> failure mode this document exists to prevent.

## 22.7 Blueprint validation record (XVIII-N + Addendum II)

Executed at lock. Each box is checked against a named location in this document, not
against intent. A box that could only be checked by charity was left open and its work
was done first.

### XVIII-N checklist

| ✅  | Requirement                                                       | Evidence                                                                                                        |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ☑   | Every Phase 0 feature has an implementation task ≤ 1 week         | §18.2 W0.7 decomposition table (13 items → sub-tasks)                                                           |
| ☑   | Every data table has all required columns defined                 | §5.1 canonical schema, PostgreSQL types, all tables                                                             |
| ☑   | Every financial rule has a corresponding test specification       | §6.8 rule → spec map (48 rules); `financial:oracles` walks it                                                   |
| ☑   | Every integration has a stated adapter pattern                    | §8.1 adapter contract; §8.2 IR1–IR8; §8.5 connector roadmap                                                     |
| ☑   | Every industry pack has at least 10 KPIs defined                  | §7.2 PK2 + §7.4 SaaS exemplar (16 KPIs); PK4 blocks a pack without fixtures                                     |
| ☑   | Three-statement integrity is testable from day one                | §6.3 TS1–TS5; §18.2 W0.3 promotes it to a runtime gate in Phase 0                                               |
| ☑   | Security architecture covers all OWASP Top 10 for financial apps  | §10.8 full A01–A10 map + FS1–FS4 finance-specific additions                                                     |
| ☑   | No floating point anywhere in the monetary calculation path       | §6.4 arithmetic contract; §5.2 D1; §18.2 W0.1.2; static guardrail + `money:ast` gate                            |
| ☑   | Onboarding path for each persona is < defined time targets        | §2.8 seven personas, seven timed specs                                                                          |
| ☑   | Technology choices validated against the capability audit (K2)    | §4.2 measured probe; ADR-003 rejects the XVIII-G rewrite; ADR-004 defers Rust/Wasm                              |
| ☑   | Phase 0 can be completed without Phase 1 dependencies             | §18.2 W0.7 independence proof (explicit non-dependency list)                                                    |
| ☑   | Gap analysis names specific competitor weaknesses OmniPlan closes | §19 — Excel, Anaplan, Adaptive, Vena, Planful, Oracle/SAP/OneStream, Power BI/Tableau/Looker, BlackLine/FloQast |

### Addendum II checklist

All 31 boxes are mapped, item by item, in **Appendix A.22**. The final box —
_"Full tree (LXI) checked into repo as `docs/architecture/TREE.md`"_ — is satisfied by
`docs/architecture/TREE.md`, written verbatim from Part LXI with a _Known deviations_
table recording every decided divergence (ADR-003, ADR-004, ADR-011) so that drift is
distinguishable from decision.

### Lock

```json
{ "blueprint_status": "LOCKED", "blueprint_locked_at": "2026-08-17T00:00:00Z" }
```

**Zero unchecked boxes. Product code may now begin, starting at Phase 0 Workstream 0.1
(money integrity) — not at AI, VDR, or Pillar Two.**

## 22.9 Scope expansion (session 005) — Windows desktop + zero-escape

Two requirements were added by explicit direction, both of which the locked blueprint
failed to cover. Neither is a Codex requirement — the Codex mentions Windows once in 3,765
lines and never specifies a desktop client — so both **supersede the Codex's silence**.

| Requirement                              | Gap found                                                                                                                                                                                                                                                                                                                                        | Response                                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Must run on Windows as a proper tool** | "Windows" appeared **once** in 3,756 lines; `MSI`, `installer`, `code signing`, `printer` appeared **zero** times — while the repo already ships a complete Tauri 2 desktop app (9 plugins, 35-table SQLite schema, `keyring`, strict CSP) that no section described. A shipping surface the blueprint does not govern is an ungoverned surface. | **Section 23** (platform tiers, packaging/MSI+NSIS, code signing, WebView2, auto-update, security, desktop DoD) + **12 `F-DESK-*` features** + **§9.11** desktop posture + A.19 corrected + **R-24–R-28** |
| **All-in-one; user needs no other tool** | The promise was asserted, never measured. No definition of "escape", no inventory of workflows, no gate. Three common workflows — ad-hoc pivot analysis, MD&A narrative, model documentation — had **no owning feature at all**.                                                                                                                 | **Section 24** (escape definition, 30-row Escape Ledger, Core-20 zero-hard-escape GA gate, escape-rate ratchet in UVI, governed-handoff contract) + **3 new features** + **R-29**                         |

**Net effect on the feature universe:** 98 → **113** (+12 desktop, +3 escape-closing). The P0
backlog is unchanged at 13, because the desktop P0 items (F-DESK-001/006/012) already exist
in code as `PARTIAL` — though per §23.8 none may be promoted to `BUILT` from this sandbox.

**The honest headline:** OmniPlan is **not** an all-in-one product today and the desktop app
is **unverified** from this environment. Sections 23 and 24 do not fix either fact; they make
both measurable every release instead of discoverable at a customer demo.

## 22.8 Adversarial re-audit (session 004) — findings and dispositions

The locked blueprint was re-audited against the Codex **and against the repository as
measured**, on the premise that a document that passes its own checklist may still be wrong.
Eight defects were found. All are fixed above; each is recorded here because §22.6 forbids
quietly overwriting a published number.

| #   | Severity     | Finding                                                                                                                                      | Disposition                                                                 |
| --- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **High**     | **§3.8 feature arithmetic was wrong on every line** — published 96 / 61 / 35 / 14; machine count is 98 / 68 / 30 / 13                        | §3.8 rebuilt from a reproducible command; correction stated in place        |
| 2   | **Critical** | **No system of record.** 43 stores persist financial truth to `localStorage`; 14 non-test files call the server; `tenant_id` = 0 occurrences | New §0.6.1 measurement; new **Workstream 0.8**; new **R-21** (score 20)     |
| 3   | **Critical** | **The money gate can read green while money is unsafe** — adoption is an import regex, so "0 raw `toFixed`" proves nothing about arithmetic  | New **W0.1.0** AST detector precedes the ≥60% gate; new **R-22** (score 20) |
| 4   | **High**     | **16 `NOT STARTED` features were in no phase at all**, including F-INTEGRATE-006 (K20 filter) and F-MIGRATE-001 (a §0.5 differentiator)      | New **§18.7 scheduling ledger** + **ADR-013** + CI check                    |
| 5   | **High**     | **Codex rounding mandate contradicts itself** (line 522 half-even vs line 692 `0.005 → 0.01`); deviation was undocumented                    | **ADR-012**; statutory paths must select half-even explicitly               |
| 6   | **Medium**   | **Phase 0 was internally unordered** — 0.2 tenancy would add governed columns to a non-authoritative database                                | Intra-phase ordering graph added to §18.7 independence proof                |
| 7   | **Medium**   | **Schema forked** across `src-tauri/migrations/` (35 tables) and server in-code DDL (9), no drift detection                                  | **W0.8.4** single-source + equality gate; **R-23**                          |
| 8   | **Low**      | F-ERR-001 is P1 in §3.7 but scheduled in Phase 0 (W0.4), inflating the "14 P0" figure                                                        | Stated explicitly in §3.8; counted as P1                                    |

**What the audit did _not_ find**, having looked: no U+FFFD/encoding corruption (0 occurrences);
all 98 feature IDs referenced anywhere resolve to a defining row in §3; every §0.6 baseline
count re-verified against the live repo (2,342 files · 187 engines · 44 stores · 193 routes ·
1,228 test files — all still exact); the sector `Math.random` hits are doc comments asserting
its _absence_, not fabricated numbers.

**Honest status of the lock.** These were substantive defects, two of them Severity-critical
by §22.6's own standard. The blueprint remains **LOCKED**; it is now locked around numbers
that are reproducible by command rather than asserted by hand. The most important change is
conceptual: Phase 0 previously assumed a governed database that does not yet hold the data.
It no longer does.

# SECTION 23 — WINDOWS DESKTOP APPLICATION SPECIFICATION

**Status:** normative, added session 005 at explicit direction. **Supersedes the Codex's
silence.** The Codex mentions Windows exactly once (line 2933, "redirect to desktop" for
phones) and never specifies a desktop client. The directive is that OmniPlan must be _a
proper tool that runs on Windows_. This section is that specification.

## 23.0 Why this section exists (the gap it closes)

An audit of the locked blueprint found that the word "Windows" appeared **once** in 3,756
lines, and that `MSI`, `installer`, `code signing`, and `printer` appeared **zero** times —
while the repository already ships a complete Tauri 2 desktop application:

| Evidence in repo            | Measured                                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src-tauri/tauri.conf.json` | `productName: "FinPlan Pro"`, `bundle.active: true`, `targets: all`, **`bundle.windows.nsis` configured**                                                   |
| `src-tauri/Cargo.toml`      | Tauri 2 + 9 plugins: `sql(sqlite)`, `fs`, `dialog`, `shell`, `window-state`, `global-shortcut`, `notification`, `updater`, `clipboard-manager`; `keyring` 3 |
| `src-tauri/src/`            | `lib.rs`, `main.rs`, `secure_storage.rs`, `crash_reporter.rs`                                                                                               |
| `src-tauri/capabilities/`   | 12 permissions, scoped to appdata/applocaldata/appconfig/applog                                                                                             |
| `src-tauri/migrations/`     | `001_initial_schema.sql`, `002_cube_schema.sql` — **35 tables, the real schema home**                                                                       |
| CSP (`app.security.csp`)    | Strict: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`                                                                                 |
| `tauri-plugin-updater`      | Dependency present; **`plugins: {}` is empty — updater is not configured** (release gate asserts "updater disabled")                                        |

**A shipping desktop client that the blueprint does not describe is an ungoverned surface.**
Section 9.10 defines a mobile posture; there was no equivalent desktop posture. A.19 listed
seven client surfaces and omitted the one that actually builds today. This section makes the
desktop a first-class, gated deliverable.

## 23.1 The desktop thesis (why Windows is strategic, not a port)

The FP&A buyer is overwhelmingly a Windows organisation, and the incumbent being displaced
(§19.2, Excel, ~70% of FP&A) is a **local Windows application**. A browser tab does not
replace a desktop application in this market for four concrete, non-cosmetic reasons:

1. **Offline is the norm, not the exception.** Board prep on a plane, close work in a
   datacentre-restricted office, audit fieldwork at a client site. §0.5 already sells
   "local-first + governed" as a differentiator; the desktop is the only surface that
   makes it literally true.
2. **File-system gravity.** Real FP&A is a river of `.xlsx` files from controllers, banks,
   and subsidiaries. A desktop app can watch folders, own file associations, and round-trip
   files without an upload dialog. K20's Excel two-way sync (F-INTEGRATE-006) is
   substantially easier and materially better on the desktop.
3. **Data residency by construction.** "Our financials never leave this machine" is an
   answer no cloud-only competitor can give, and it closes procurement objections in
   regulated and family-office segments.
4. **Grid performance.** A 100k-cell recalc (§11.2 budget: 5 s p95) runs against native
   SQLite with no network hop. The desktop is the surface most likely to _meet_ the
   performance contract, not least likely.

**Corollary (binding):** the desktop is **not** a wrapper around a website. It is the
reference implementation of the local-first plane defined in §4.3, and the web app is the
same product minus the local file and offline capabilities.

## 23.2 Supported platform matrix (normative)

| Platform                                 | Tier       | Commitment                                                                                        |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| **Windows 11 (x64)**                     | **Tier 1** | Primary target. Every release blocked on a green Tier-1 test run. All perf budgets measured here. |
| **Windows 10 22H2 (x64)**                | **Tier 1** | Supported through Microsoft's EOL (Oct 2025 mainstream; extended per ESU). WebView2 required.     |
| Windows 11 (ARM64)                       | Tier 2     | Built and smoke-tested; performance budgets not guaranteed.                                       |
| Windows Server 2019/2022 (RDS)           | Tier 2     | Must run under RDS/Citrix multi-session; per-user data isolation verified (§23.6).                |
| macOS 13+ (Apple Silicon/Intel)          | Tier 2     | Built and smoke-tested. Not a release blocker.                                                    |
| Linux (Ubuntu 22.04+, .deb/AppImage)     | Tier 3     | Best effort, community-grade.                                                                     |
| Web (Chrome/Edge/Firefox/Safari, last 2) | Tier 1     | Full parity except §23.3 desktop-only capabilities.                                               |

**Tier definitions.** Tier 1 = release blocker, full test matrix, perf budgets enforced.
Tier 2 = builds and passes smoke tests; bugs triaged but do not block release.
Tier 3 = builds; no guarantee.

**Minimum hardware (Tier 1):** 4-core x64, 8 GB RAM, 2 GB free disk, 1366×768. **Recommended
for 5M+ facts:** 8-core, 16 GB RAM, SSD. These are stated so that §11 performance budgets
have a defined reference machine; a budget without a machine is not a budget.

**WebView2 dependency (the classic Windows deployment trap).** Tauri renders through
Edge WebView2. It is present by default on Windows 11 and on updated Windows 10, but **not
guaranteed** on stale Windows 10 images. The installer MUST use the WebView2 **evergreen
bootstrapper** and MUST degrade to a clear, actionable error if installation is blocked by
policy — never a blank white window. A blank window on launch is a **release-blocking
defect**, not a support ticket.

## 23.3 Desktop-only capabilities (what justifies the surface)

These are the capabilities that make the desktop worth shipping. Each is a feature with an
ID, a phase, and an acceptance test — not an aspiration.

| ID         | Capability                     | Phase | Specification                                                                                                                                                               |
| ---------- | ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-DESK-001 | Native local database          | 0     | SQLite via `tauri-plugin-sql`, at `%APPDATA%\OmniPlan\`. **This is the system-of-record fix for the desktop surface** (§0.6.1, W0.8): no financial truth in `localStorage`. |
| F-DESK-002 | True offline modelling         | 1     | Full model/edit/report with the network cable pulled. Publication requires reconnection and server authorization (§4.4 authority rule).                                     |
| F-DESK-003 | File associations + drag-drop  | 1     | `.omniplan` model files open on double-click; `.xlsx`/`.csv` dropped on the window enter the import pipeline with reconciliation (§XIX-C).                                  |
| F-DESK-004 | Watched-folder ingestion       | 2     | Point at a folder; new/changed workbooks are detected, staged, diffed, and queued for approval. Never auto-posted without maker-checker (§13.3).                            |
| F-DESK-005 | Native print + page setup      | 1     | OS print dialog, real page setup, print preview matching output. Closes the §14.8 pixel-fidelity promise, which no browser can honour.                                      |
| F-DESK-006 | OS credential storage          | 0     | Tokens and the DB key in Windows Credential Manager via `keyring` (already implemented in `secure_storage.rs`). **Never** in `localStorage` or a plaintext file.            |
| F-DESK-007 | Global shortcut + tray         | 2     | System-wide ⌘K/Ctrl-K to the command palette; tray shows close-task and approval counts. Plugins already present.                                                           |
| F-DESK-008 | Native notifications           | 2     | Approval requests, close-task deadlines, failed imports via Windows notifications (§A.11), honouring Focus Assist.                                                          |
| F-DESK-009 | Multi-window                   | 2     | Detach a report/grid to a second monitor — the single most-requested FP&A ergonomic. Window state persisted (`window-state` plugin present).                                |
| F-DESK-010 | Signed auto-update             | 1     | See §23.5. Currently a dependency with no configuration; must be either configured-and-signed or explicitly disabled — never ambiguous.                                     |
| F-DESK-011 | Local Excel round-trip         | 2     | Open→edit→save a workbook in place, preserving formulas (§14.5 XLSX fidelity). The desktop half of the K20 filter (F-INTEGRATE-006).                                        |
| F-DESK-012 | Crash reporting with redaction | 1     | `crash_reporter.rs` exists. Reports MUST be scrubbed of monetary values and PII before leaving the machine — the §12.3 egress rule applies to crash dumps (see §23.7 R-26). |

## 23.4 Packaging & installation (Windows-native, enterprise-deployable)

| Requirement             | Specification                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Installer formats**   | **MSI** (`wix`) for enterprise/GPO/Intune deployment **and** **NSIS** (`.exe`) for self-serve. Repo currently configures NSIS only — MSI is a gap to close.                                  |
| Per-user vs per-machine | Both. Per-user default (no admin rights); per-machine for managed fleets via MSI with `ALLUSERS=1`.                                                                                          |
| Silent install          | `msiexec /i OmniPlan.msi /qn` MUST succeed unattended with no dialog. Verified in CI-equivalent VM, not assumed.                                                                             |
| Install location        | `%LOCALAPPDATA%\Programs\OmniPlan` (per-user) / `%ProgramFiles%\OmniPlan` (per-machine).                                                                                                     |
| Data location           | `%APPDATA%\OmniPlan\` — DB, logs, config. **Never** in Program Files. Roaming-profile safe: DB in `%LOCALAPPDATA%`, config in `%APPDATA%`.                                                   |
| Uninstall               | Removes binaries; **prompts before deleting financial data** and defaults to keeping it. Silently destroying a ledger on uninstall is a Severity-0 class defect.                             |
| Upgrade                 | In-place, preserving the database; forward-only migrations (PC5) run on first launch with an automatic pre-migration backup.                                                                 |
| **Code signing**        | **Mandatory for GA.** EV or OV certificate; SmartScreen reputation established before public release. An unsigned installer that trips SmartScreen is an unshippable product, not a warning. |
| Bundle size             | Installer ≤ 60 MB; installed footprint ≤ 250 MB. Tauri's advantage over Electron is real and must not be squandered.                                                                         |
| Offline installer       | A fully offline installer variant (WebView2 evergreen **standalone**) for air-gapped/regulated sites.                                                                                        |

**Product naming.** The repo ships `productName: "FinPlan Pro"`; the product is **OmniPlan**
(§0.1). ADR-008 defers the rename to Phase 2. The installer, window title, and Credential
Manager entries must all change **together with a migration** for `%APPDATA%` paths and
credential keys — a rename that orphans a user's database is data loss. Tracked as a
Phase 2 task with an explicit migration step, not a find-and-replace.

## 23.5 Auto-update (currently ambiguous — must be resolved)

`tauri-plugin-updater` is a declared dependency, `plugins` in `tauri.conf.json` is empty, and
the release gate asserts "updater is disabled (no uncontrolled update endpoint)". That is a
**safe** state but an **undecided** one. The decision:

- **Phase 0–1:** updater stays **explicitly disabled**. The release gate that asserts this is
  correct and must remain.
- **Phase 2:** enable with **mandatory signature verification** (Tauri's minisign public key
  compiled in; unsigned or mis-signed payloads rejected).
- **Enterprise:** auto-update MUST be centrally disableable by GPO/registry policy; managed
  fleets patch through Intune/SCCM, and an app that self-updates against IT policy will be
  banned from the estate.
- **Never** auto-update mid-close. If a period close or an approval workflow is in progress,
  the update defers with a visible, dismissible notice. **Interrupting a close to install a
  patch is a Severity-1 defect.**

## 23.6 Desktop security posture

The desktop surface **increases** the attack surface and this is stated plainly rather than
assumed away.

| Control                | Requirement                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local DB encryption    | Encrypted at rest with a key in Windows Credential Manager (`keyring`, implemented). Machine-bound; a copied `.db` file is useless without the key.                     |
| Capability scope       | The 12 Tauri permissions are the **maximum**; `fs` scopes stay confined to app dirs. Any widening requires an ADR. `shell` MUST NOT expose arbitrary command execution. |
| CSP                    | Current strict CSP (`object-src 'none'`, `frame-ancestors 'none'`) is normative; loosening it requires an ADR.                                                          |
| IPC boundary           | Every Rust command validates and type-checks its input. The webview is treated as untrusted (XSS in the renderer must not become code execution on the host).           |
| Multi-session/RDS      | Per-user data isolation verified under RDS/Citrix: user A must not read user B's database. Explicit test, because shared-desktop deployments are common in finance.     |
| Screen-capture posture | Field masking (§10.3) applies identically on desktop. Optional screenshot-protection flag for restricted views.                                                         |
| Crash dumps            | Scrubbed of monetary values and PII **before** transmission (F-DESK-012).                                                                                               |
| Supply chain           | Rust dependencies pinned via `Cargo.lock`; `cargo audit` in the release pipeline once a Rust toolchain exists (K2 blocks this today — see §23.8).                       |

## 23.7 New risks arising from the desktop surface

| ID   | Risk                                                                                                                                                       | L   | I   | Score  | Mitigation                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-24 | **The desktop app cannot be built or verified in this environment** — no `cargo`/`rustc` (K2). Rust changes ship blind; the Windows build is unproven here | 5   | 4   | **20** | §23.8 verification protocol: no Rust edits without a real toolchain; Windows build/test runs on a real machine or CI runner before any desktop claim |
| R-25 | Uninstall or a botched upgrade destroys the only copy of a customer's ledger (§0.6.1: local is currently authoritative)                                    | 3   | 5   | **15** | Uninstall defaults to keeping data; pre-migration automatic backup; W0.8 makes the server authoritative so local loss is recoverable                 |
| R-26 | Crash reports or telemetry exfiltrate monetary values from a customer machine                                                                              | 3   | 5   | **15** | F-DESK-012 redaction before transmission; the §12.3 egress chokepoint rule extends to crash/telemetry paths; egress test in CI                       |
| R-27 | Unsigned installer trips SmartScreen; enterprise buyers cannot deploy and trust collapses at first contact                                                 | 4   | 4   | **16** | Code signing mandatory for GA (§23.4); reputation warm-up before public launch; MSI for managed deployment                                           |
| R-28 | WebView2 absent or policy-blocked on older Windows 10 → blank window on launch                                                                             | 3   | 4   | 12     | Evergreen bootstrapper + offline installer variant; explicit actionable error, never a blank window; Tier-1 test on a clean Win10 22H2 image         |

## 23.8 Verification protocol under K2 (honesty about what cannot be proven here)

**This sandbox has no `cargo`, no `rustc`, and no Windows.** Therefore every claim in this
section is **"designed for, not proven"** until executed on real hardware. Per §22.6 and
ADR-004 this is stated rather than glossed:

```
CANNOT be verified in this environment:
  · Windows build, installer generation, silent install, code signing
  · WebView2 bootstrapping behaviour on a clean Windows 10 image
  · RDS/Citrix multi-session isolation
  · Native print fidelity
  · Any change to src-tauri/src/*.rs (no compiler → no feedback → no blind edits)

CAN be verified here:
  · tauri.conf.json / capabilities JSON schema correctness (static)
  · The TypeScript side of every desktop feature
  · Migration SQL under src-tauri/migrations/ (SQLite runs headless)
  · Documentation and gate definitions
```

**Binding rule:** no `src-tauri/src/*.rs` file is modified from this environment without a
real toolchain, and **no desktop capability is marked BUILT until it has been executed on
Windows** by a human or a Windows CI runner. Desktop CI (a `windows-latest` matrix leg)
ships as a numbered `ci-patches/*.patch` per ADR-011.

## 23.9 Desktop Definition of Done (additive to §22.1)

```
□ Installs on clean Windows 11 and clean Windows 10 22H2 via MSI and NSIS, silently and interactively
□ No blank window: WebView2 present, bootstrapped, or a clear actionable error
□ Launch to interactive ≤ 3 s on the Tier-1 reference machine
□ Full offline session: model, calculate, report with the network disabled
□ Financial data in %APPDATA% SQLite, encrypted, key in Credential Manager — never localStorage
□ Uninstall preserves data by default; upgrade preserves data and auto-backs-up pre-migration
□ Installer is code-signed; SmartScreen clean (GA)
□ Print output matches preview (§14.8)
□ Per-user isolation verified under RDS multi-session
□ Crash reports contain zero monetary values or PII (automated scan)
□ Auto-update: signed and policy-disableable, or explicitly disabled — never ambiguous
□ Every desktop claim executed on real Windows, per §23.8 — no capability marked BUILT from this sandbox
```

# SECTION 24 — THE ZERO-ESCAPE CONTRACT (ALL-IN-ONE, MEASURED)

**Status:** normative, added session 005 at explicit direction: _"an all-in-one FP&A tool, a
one-stop solution, so the user doesn't have to use any other tool."_

"All-in-one" is a slogan until it is measured. This section converts it into a falsifiable
contract with a metric, a ledger, and a CI gate.

## 24.1 The escape event (definition)

> An **escape** is any moment a user must leave OmniPlan to complete a finance workflow that
> OmniPlan claims to support.

Three kinds, in descending severity:

| Kind                    | Definition                                                                                        | Verdict                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Hard escape**         | The workflow is impossible in-product. The user opens Excel/Word/PowerPoint/a BI tool to finish.  | **Defect.** Must be scheduled or the claim withdrawn.                   |
| **Soft escape**         | Possible in-product but so poor the user leaves anyway (too slow, too many clicks, worse output). | **Defect.** Equivalent to a hard escape; users do not grade on a curve. |
| **Legitimate boundary** | Outside FP&A's remit — filing with a tax authority, signing a contract, running payroll.          | **Not a defect** — but must be a _governed handoff_ (§24.4).            |

**The distinction that matters:** a legitimate boundary is a place where finance work leaves
the finance function. An escape is where it leaves _our product_ while remaining finance work.
Confusing the two is how "all-in-one" quietly becomes false.

## 24.2 The Escape Ledger (normative; the all-in-one scoreboard)

Every workflow a finance team performs in a month is enumerated, classified, and owned.
This is the operative test of the one-stop promise.

**UVI (User Value Index) is redefined to include escape rate**, so the index cannot rise
while users still leave the product:

```
Escape Rate = (hard escapes + soft escapes) / total workflows in the ledger
Target: Phase 1 ≤ 40%   Phase 2 ≤ 20%   Phase 3 / GA ≤ 5%
GA gate: ZERO hard escapes in the Core-20 (§24.3).
```

| #   | Workflow                             | Today       | Owning feature                   | Target phase | Escape class if unmet    |
| --- | ------------------------------------ | ----------- | -------------------------------- | ------------ | ------------------------ |
| 1   | Build/maintain an operating model    | PARTIAL     | F-CORE-001/011                   | 1            | Hard (→ Excel)           |
| 2   | Rolling forecast                     | PARTIAL     | F-PLAN-001                       | 1            | Hard (→ Excel)           |
| 3   | Budget cycle + submissions           | PARTIAL     | F-PLAN-002, F-WORKFLOW-008       | 1            | Hard (→ Excel)           |
| 4   | Actuals ingestion from ERP           | PARTIAL     | F-INTEGRATE-000/001              | 1            | Hard (→ manual CSV)      |
| 5   | Variance analysis + commentary       | PARTIAL     | F-REPORT-003, F-AI-004           | 1            | Soft                     |
| 6   | Three-statement model                | PARTIAL     | F-CORE-002, F-PLAT-004           | 0            | Hard                     |
| 7   | Multi-entity consolidation           | PARTIAL     | F-CORE-006                       | 2            | Hard (→ Excel)           |
| 8   | FX translation (IAS 21)              | BUILT       | F-CORE-005                       | 1            | Hard                     |
| 9   | Intercompany elimination             | NOT STARTED | A.8                              | 2            | Hard (→ Excel)           |
| 10  | Period close checklist               | PARTIAL     | F-CLOSE-001, A.4                 | 2            | Hard (→ BlackLine)       |
| 11  | Journal entries + adjustments        | PARTIAL     | A.4                              | 2            | Hard                     |
| 12  | Reconciliations                      | PARTIAL     | XIX-C, A.4                       | 2            | Hard (→ Excel)           |
| 13  | **Board pack production**            | PARTIAL     | F-REPORT-006, A.17               | 2            | **Hard (→ PowerPoint)**  |
| 14  | Management reporting pack            | PARTIAL     | F-REPORT-002                     | 1            | Hard                     |
| 15  | Ad-hoc analysis / slice-and-dice     | PARTIAL     | F-REPORT-004, **F-ANALYSIS-001** | 2            | **Soft (→ Excel/BI)**    |
| 16  | Dashboards + KPI monitoring          | BUILT       | F-REPORT-001                     | 1            | Soft (→ Power BI)        |
| 17  | Scenario / sensitivity analysis      | PARTIAL     | F-CORE-010, F-PLAN-004           | 1            | Hard                     |
| 18  | Headcount / workforce planning       | PARTIAL     | F-PLAN-003                       | 2            | Hard (→ Excel)           |
| 19  | Cash flow forecasting + treasury     | PARTIAL     | A.5                              | 2            | Hard                     |
| 20  | Capex / project planning             | PARTIAL     | F-PLAN-005                       | 2            | Hard                     |
| 21  | Revenue recognition (ASC 606)        | NOT STARTED | A.6                              | 3            | Legitimate→governed      |
| 22  | Lease accounting (IFRS 16)           | NOT STARTED | A.7                              | 3            | Legitimate→governed      |
| 23  | Tax provision                        | NOT STARTED | A.7                              | 3            | Legitimate→governed      |
| 24  | Statutory reporting / XBRL           | NOT STARTED | §14.5                            | 3            | **Legitimate boundary**  |
| 25  | Audit evidence / PBC fulfilment      | PARTIAL     | F-WORKFLOW-007, A.15             | 2            | Hard (→ email+Excel)     |
| 26  | SOX / ICFR controls testing          | NOT STARTED | A.15                             | 3            | Legitimate→governed      |
| 27  | Narrative / MD&A authoring           | NOT STARTED | **F-REPORT-013**                 | 2            | **Hard (→ Word)**        |
| 28  | Data prep / mapping / cleansing      | PARTIAL     | F-INTEGRATE-000, §8.3            | 2            | Hard (→ Excel/ETL)       |
| 29  | Distributing reports to stakeholders | NOT STARTED | F-REPORT-007                     | 2            | Hard (→ email)           |
| 30  | Model documentation / handover       | NOT STARTED | **F-REPORT-014**                 | 3            | Soft (→ Word/Confluence) |

**Ledger discipline.** A row may be `Legitimate boundary` **only** with a stated reason and a
governed handoff (§24.4). Silently reclassifying a hard escape as legitimate to make the
number look better is a §22.6 honesty-clause violation.

## 24.3 The Core-20 (zero hard escapes at GA)

Rows 1–20 are the **Core-20**: the workflows that define a monthly FP&A cycle. **GA is
blocked while any Core-20 row is a hard escape.** Rows 21–30 may remain governed boundaries
at GA provided each has a handoff and a stated roadmap position.

This is the concrete meaning of "the user doesn't have to use any other tool": a full monthly
cycle — ingest actuals, close, consolidate, analyse variance, reforecast, produce the board
pack, distribute it — completes without opening Excel, Word, PowerPoint, or a BI tool.

## 24.4 Governed handoff (what a legitimate boundary must provide)

Where OmniPlan legitimately stops, it must hand off rather than dead-end. A governed handoff:

1. **Produces the artefact the receiving system needs** in its required format (e.g. an XBRL
   instance, a tax-package export, a payment file) — not a screenshot or a raw dump.
2. **Records the handoff** as an audited event with lineage: what was sent, by whom, from
   which snapshot, under which FX rate set.
3. **Reconciles on return** where money comes back (bank statements, payroll postings) per
   §XIX-C — a handoff without a return reconciliation is an unclosed loop.
4. **Never loses provenance.** Exported figures carry the §14.5 metadata block so the
   receiving system's numbers remain traceable to a source fact.

## 24.5 Features added by this analysis

The ledger exposed three gaps with **no owning feature** in §3 — each a hard or soft escape on
a workflow the product implicitly claims:

| ID                 | Feature                                       | Phase | Why it is required by the all-in-one promise                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-ANALYSIS-001** | Native pivot / ad-hoc analysis surface        | 2     | Row 15. "Slice-and-dice" is the single most common reason an FP&A analyst opens Excel against a planning tool. Without a real pivot over the metric store, every other governance guarantee leaks the moment someone needs a cut we did not pre-build.        |
| **F-REPORT-013**   | Narrative / MD&A authoring with live bindings | 2     | Row 27. Board and management commentary is written in Word today, then numbers are pasted in and go stale. Live-bound narrative (text with metric references that update and re-verify) removes the last document-shaped escape from the board-pack workflow. |
| **F-REPORT-014**   | Model documentation generator                 | 3     | Row 30. Auto-generated model documentation (drivers, assumptions, lineage, change history) replaces the hand-written Word/Confluence page nobody maintains.                                                                                                   |

These are added to §3.4/§3.3 and scheduled in §18.7, taking the feature universe to **101**.

## 24.6 CI enforcement

```bash
# 1. Escape ledger must be complete: every row has an owning feature ID and a phase.
# 2. Every owning feature ID must resolve to a defining row in Section 3.
# 3. No Core-20 row may be classified "Legitimate boundary" without an ADR reference.
# 4. Escape rate is computed per release and must not increase (one-way ratchet).
node scripts/escape-ledger-check.mjs   # wired into docs:verify
```

**The honest position today.** The measured escape rate is high — most Core-20 rows are
PARTIAL, and rows 9, 27, and 29 are unowned before this section. OmniPlan is **not** an
all-in-one product today. This ledger is the instrument that makes the gap visible every
release instead of at the demo where a user opens Excel.

# APPENDIX A — DOMAIN MODULE SPECIFICATIONS (ADDENDUM II, PARTS XXXI–LX)

Sections 0–22 are the blueprint required by XVIII-C. This appendix carries the
domain-level detail mandated by the Addendum II lock checklist (Codex line 3042). Each
subsection is normative and is referenced from the phase where it is built.

---

## A.1 Temporal domain, calendars, locales, i18n (Part XXXI)

### A.1.1 Time model

| Concept         | Representation                        | Rule                                                                        |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Instant         | `TIMESTAMPTZ`, UTC internally, always | Never a local-time string in storage                                        |
| Civil date      | ISO-8601 date, no timezone            | Period keys, due dates, effective dates                                     |
| Period          | First-class entity (`periods` table)  | **Never** "just a date column"                                              |
| Fiscal calendar | Tenant-configurable **and versioned** | Calendars change; history must not silently rewrite                         |
| Clock           | Injected                              | Tests freeze it; production uses NTP. No engine calls `Date.now()` directly |

**Calendars supported:** standard Gregorian 12; fiscal-year offset (any month start, any
day start); 4-4-5 / 4-5-4 / 5-4-4 retail; 13-period; 53-week year with an **explicit 53rd-week
allocation policy** recorded per tenant; 4-4-4; custom period table (uploaded dates);
public-sector appropriation year (may differ from the fiscal year).

**Period types:** `hour, day, week, period, month, quarter, half, year, ytd, r12, r13, ltd`.

### A.1.2 As-of reporting

Every report accepts `as_of_ts`. Late-arriving actuals do **not** rewrite history unless
the restatement protocol (A.4.5) runs. _"What did the board pack say on the day we
published it"_ is a first-class, indexed query — not an archaeology exercise.

### A.1.3 Timezone & close boundaries

```
TZ1  Tenant has a close_timezone. "Period close at 00:00" means that zone.
TZ2  Integrations normalise to UTC on ingest; period-bucketing uses close_timezone.
TZ3  DST transitions never split or duplicate a posting. Tests for America/New_York
     and Europe/London March and November transitions are MANDATORY.
TZ4  Each entity may have a local close timezone; consolidation uses the group close
     timezone plus an explicit lag policy (e.g. +1 day).
TZ5  "Today" in the UI is tenant-local, never browser-local, unless the user overrides.
```

### A.1.4 Locale, numerals, RTL

Languages — Phase 1: `en-US, en-GB`. Phase 2: `de, fr, es, pt-BR, ja, zh-Hans, nl, it, sv, pl`.
Phase 3: `ko, zh-Hant, ar, he, hi, th, vi, tr, nb, da, fi, cs, ro, uk`.
RTL (`ar`, `he`): grid, formula bar, and PDF all flip correctly — verified, not assumed.

Number formats follow CLDR (`1,234.56` / `1.234,56` / `1 234,56` / `1'234.56`). Currency
display carries ISO code, symbol, and correct minor units (**JPY = 0, KWD = 3, CLP = 0** —
hardcoding 2 decimal places is a defect). Negative conventions: locale default, user
override, tenant policy. Date formats: locale plus an ISO toggle for auditors. Fiscal
labels (`FY26 P03`) and calendar labels (`May 2025`) are independently togglable.

### A.1.5 Formula localisation

```
Storage:   ALWAYS canonical English function names (SUM, IF, XLOOKUP).
Display:   optional locale aliases (SOMME, WENN) — a translation layer only.
Separators: locale-aware in the UI (; vs ,); the AST stores structured arguments.
NEVER persist localised formula text as the source of truth.
```

### A.1.6 Holiday, workday, seasonality calendars

Per-country and per-entity holiday calendars (cash, staffing, retail). `NETWORKDAYS` /
`WORKDAY` equivalents in the formula engine. Event calendars (Black Friday, Chinese New
Year, Ramadan, earnings dates). Reusable seasonality profiles bound to drivers.

---

## A.2 MDM, semantic layer, and the query planner (Part XXXII)

### A.2.1 Master data management

```
MDM1   Every dimension member has a stable internal id and a business key.
MDM2   All members are SCD2 (valid_from / valid_to). No in-place semantic change.
MDM3   Member lifecycle: draft → active → frozen → merged | retired.
MDM4   Merge records survivorship: which attributes won, who decided, when, why.
MDM5   Hierarchies are versioned; a restated hierarchy does not rewrite prior reports.
MDM6   Ragged and alternate hierarchies are supported; weights on edges support
       proportional consolidation.
MDM7   Golden-record matching is proposed by the system and CONFIRMED by a human.
MDM8   Unmapped members land in a holding node, raise an alert, and BLOCK period close.
MDM9   Bulk load is validated, staged, diffed, and approved — never applied blind.
MDM10  External ids from every source system are retained (external_ids JSONB) so
       lineage back to the source survives a merge.
```

### A.2.2 Metric store (K21)

```
MET1  A metric has: id, name (i18n), description, formula AST, grain, unit,
      applicable books, owners, version, certification state, changelog.
MET2  Metrics are versioned. A report snapshot pins the metric versions it used.
MET3  Certification is maker-checker. The definer cannot certify alone.
MET4  Every non-GAAP metric declares its GAAP reconciliation metric. No exceptions —
      an uncontrolled "adjusted EBITDA" is how finance products lose credibility.
MET5  A metric used in a published report must be certified. Uncertified metrics
      render with a visible DRAFT marker and are blocked from FINAL board packs.
```

### A.2.3 Semantic query planner

A query names **metrics, dimensions, filters, and a grain** — never tables. The planner:

1. resolves metric ASTs at the pinned version;
2. determines the minimum fact grain required;
3. injects the caller's RLS predicate (PC4) — unconditionally, before optimisation;
4. applies field masking to the projection;
5. selects a source: base facts, a precomputed rollup, or a derived columnar store
   (never the reverse — a derived store is never the system of record, ST2);
6. estimates cost and rejects over-budget queries (`OMNI-QUERY-0451`);
7. returns results with the metric versions, FX rate set, and lineage ids used.

**Book mixing is rejected at plan time** (`FIN-008`), not discovered in a total.

---

## A.3 Multi-book & local GAAP honesty (Part XXXIII)

### A.3.1 Book taxonomy

```
BOOK.MGMT           management / decision
BOOK.STAT_IFRS      IFRS group
BOOK.STAT_US        US GAAP
BOOK.LOCAL_{cc}     local statutory (HGB, J-GAAP, ASBE, Ind-AS, UK-GAAP, CPC…)
BOOK.TAX            tax basis
BOOK.CASH           cash / treasury view
BOOK.STATUTORY_FUND nonprofit / government
```

```
MB1  A fact may exist in one book and be derived into others via adjustment journals.
MB2  Adjustments are typed: GAAP_TO_IFRS, MGMT_TO_STAT, TAX_TO_BOOK, ELIM, RECLASS.
MB3  Book is chosen at session or report level. NEVER mix books in one total.
MB4  Consolidation scope may differ by book (management may include JVs).
MB5  Local close may precede group close; books have INDEPENDENT period statuses.
```

### A.3.2 Chart mapping

`Legal COA (per entity, per ERP) ↕ Management COA (group) ↕ Statutory group COA ↕ Industry KPI accounts`

All maps are **SCD2 and bidirectional**. A 2026 map must not silently rewrite 2025
statutory numbers.

### A.3.3 Local GAAP pack honesty matrix

| Pack                                                              | Phase | Status language when not implemented |
| ----------------------------------------------------------------- | ----- | ------------------------------------ |
| US GAAP, IFRS                                                     | 2     | —                                    |
| HGB, UK FRS 102, J-GAAP, ASBE, Ind-AS, Brazilian CPC, Mexican NIF | 3     | **"Not available"**                  |
| GASB, IPSAS, UK Whole of Government                               | 3     | **"Not available"**                  |
| Insurance statutory vs GAAP                                       | 3     | **"Not available"**                  |
| Bank regulatory (CCAR and similar)                                | 3+    | **"Not available" — never faked**    |

**Honesty rule:** if a local pack is not implemented, the UI says **Not available**. It
never renders an approximate local statement. A plausible-looking wrong statutory number is
worse than no number, because the user will file it.

---

## A.4 Record-to-report: Close OS, journals, reconciliation, restatement (Part XXXIV)

### A.4.1 Close orchestration

Artefacts: close calendar (entity × book × period × task), task template library,
dependencies (consolidation cannot start until all children close), SLA clocks, an
**evidence locker** (file + screenshot + system extract, each hashed), and sign-off
(e-sign, role, timestamp, IP, reason).

Task types: `subledger_close, flux, rec, journal, ic_match, fx_reval, consol,
tax_provision, commentary, package, certify`.

### A.4.2 Journal engine

```
J1  Journals have a header and lines; lines balance debit/credit (or are memo-book).
J2  Recurring, reversing, allocation, and standard journals are all supported.
J3  Posting to a CLOSED period is forbidden except reversing entries and the
    restatement protocol.
J4  Auto-reverse-next-period is a first-class flag, not a manual habit.
J5  Management journals NEVER post to the ERP unless an explicit push integration is
    configured and approved. Default: they stay in OmniPlan.
J6  Every journal carries an attachment, a ticket reference, and SoD (preparer ≠ poster).
J7  Statistical journals (headcount, sqft, kWh) use the same control plane as monetary ones.
```

### A.4.3 Account reconciliation

Types: `GL_to_subledger, GL_to_bank, IC, system_to_system, rollforward`.
States: `OPEN → PREPARED → REVIEWED → APPROVED`, plus `BROKEN`.
Matching: exact, fuzzy amount, many-to-one, one-to-many, date-window, and AI-suggested
matches that **always require confirmation**.
Rollforwards: prepaid, deferred revenue, fixed assets, debt, tax, equity.
Materiality is a tenant policy per account. Auto-certification only when unmatched items
are below materiality **and** the ruleset itself is certified. Unreconciled items age with
escalation.

### A.4.4 Flux & commentary

Automated flux at configurable thresholds; commentary mandatory above threshold with
per-account templates; **numbers cited in commentary hyperlink to the cells that produced
them**; prior-period commentary carries forward with stale warnings; AI drafts (Tier 2)
never auto-publish.

### A.4.5 Restatement protocol

```
R1  A restatement is a named object: reason, periods, books, approvers.
R2  It creates a NEW immutable version of affected facts. The old version remains.
R3  Downstream locked board packs are marked SUPERSEDED — never silently changed.
R4  Rolling forecasts that consumed restated actuals recompute on a branch first.
R5  An external disclosure checklist is generated covering what was already published.
```

---

## A.5 Treasury, cash, debt, covenants (Part XXXV)

**Cash position:** bank account master (IBAN masked), balances via Open Banking / Plaid /
Yodlee / file / ERP, optional intraday (Phase 3), cash pooling and ZBA awareness.

**Forecast:** direct method (receipts/disbursements) and indirect (from the three-statement
model); 13-week weekly plus 18-month monthly; collections curves by customer segment;
payroll, tax, debt-service, and capex calendars.

**Debt:** facilities, draws, amortisation, revolver, bonds, leases-as-debt view; interest
day-count conventions actual/360, 30/360, actual/actual; variable rates with forward curves
and scenarios; **covenant definitions as code** with a headroom dashboard; default, waiver,
and amendment events.

**Investments:** surplus cash, money market, simple securities (fair value optional, Phase 3).

**FX operations:** exposures, natural hedges, forwards inventory. **Not a full TMS in Phase 1.**
Hedge accounting (IFRS 9 / ASC 815) is an explicitly scoped Phase 3 pack.

**Explicit non-goal — payments:** OmniPlan does **not** become a payment rail. It plans and
monitors. Initiation, if ever built, is via a certified partner with dual control and PCI
out of scope.

```
TR1  Bank credentials are NEVER stored in the OmniPlan application database.
     Aggregator tokens only.
TR2  Cash actuals must reconcile to GL cash (A.4) or the period cannot close.
TR3  A forecast covenant breach is a P0 alert path (treasurer + CFO, immediately).
```

---

## A.6 Revenue recognition (Part XXXVI)

**Standards:** ASC 606, IFRS 15.
**Objects:** customer contract, performance obligation, SSP catalog, allocation, contract
asset / contract liability, variable consideration (with constraint), modification, refund
liability, principal-vs-agent flag.
**Methods:** point in time; over time (output); over time (input, cost-to-cost); usage;
milestone.
**Waterfalls:** deferred revenue rollforward — `beginning + billings − recognised + fx +
other = ending` — which **must tie to the balance sheet** as a blocking assertion.
**Integrations:** Stripe, Zuora, Chargebee, NetSuite, Salesforce CPQ.

**Phased honesty:** Phase 1 ingests recognised and deferred balances and builds the
waterfall. Phase 2 computes recognition for standard SaaS/subscription. Phase 3 handles
complex multi-element arrangements and contract modifications.
**Do not claim a full Zuora replacement on day one** — claim planning, waterfall, and audit.

---

## A.7 Leases, SBC, tax provision (Part XXXVII)

**Leases (ASC 842 / IFRS 16):** lease inventory from abstracted terms; classification
(finance/operating under US GAAP; single model under IFRS); ROU asset and liability
schedules; IBR policy; modifications, indexation, and term options; documented transition
elections. Outputs feed the three-statement model, covenants, and cash.
_Phase 1: import schedules. Phase 2: compute from abstracts._

**Stock-based compensation (ASC 718 / IFRS 2):** grant register (options, RSUs, ESPP,
performance awards); cliff and graded vesting; forfeiture policy; expense attribution and
equity contra; dilution for EPS and cap-table scenarios.
**Non-goal:** OmniPlan does not replace Carta/Shareworks as the legal cap-table system of record.

**Tax provision (ASC 740 / IAS 12):**
Phase 1 — ETR bridge, deferred rollforward import, rate scenarios.
Phase 2 — temporary-difference library, valuation-allowance workflow.
Phase 3 — Pillar Two GloBE, CbCR helper, uncertain tax positions.
**Never, in any phase** — full corporate tax compliance or e-filing.
Outputs: provision, deferred tax balance sheet, ETR, cash tax forecast.

---

## A.8 Intercompany matching, eliminations, transfer pricing (Part XXXVIII)

**Partner master:** every entity knows its counterparties.
**Transaction types:** goods, services, royalties, loans, management fees, dividends.
**Matching:** auto-match on reference + amount + currency + date window; materiality
tolerances; dispute workflow; a confirmation portal for subsidiary controllers (external
users, scoped access).

**Elimination identities (each a tested assertion, not a journal habit):**
balance-sheet IC AR/AP; IC loans; investment-in-subsidiary vs equity; P&L IC revenue and
expense; unrealised profit in inventory; NCI / minority interest. Consolidation method is
declared **explicitly per investee**: full consolidation, equity method, or proportionate.

**FX on IC:** remeasurement and translation are distinguished (complete IAS 21).
Hyperinflation (IAS 29) is an explicit pack, **off by default**.

**Netting:** the system proposes netting statements. It does **not** move cash without
treasury approval.

**Transfer pricing:** policy library (CUP, resale, cost-plus, TNMM, profit split), a
calculator, and an OECD BEPS documentation stub. **Not a full TP suite in Phase 1.**

```
IC1  Post-elimination IC balances must net to zero within tolerance.
     The assertion is BLOCKING — consolidation does not complete if it fails.
IC2  Investment-in-sub vs equity elimination is a tested identity.
```

---

## A.9 ESG / sustainability FP&A (Part XXXIX)

Finance now owns climate numbers; a platform that ignores this is not all-in-one.

**Frameworks:** ISSB IFRS S2, CSRD/ESRS, TCFD, SEC climate rules as applicable, GRI crosswalk.

**Carbon data model:** Scope 1 / Scope 2 / Scope 3 (by category); a **versioned,
source-cited emission-factor library**; activity data (kWh, fuel, travel, purchased goods);
intensity metrics (per revenue, per unit, per FTE).

**Financial linkage:** carbon price scenarios flowing into OpEx and COGS and capex; carbon
tax and ETS modelling; capex tagging (taxonomy eligible / aligned); transition-plan opex.

**Controls:** identical audit trail, lineage, and period locks as financial data.
**An emission-factor change is a versioned restatement (A.4.5), never a silent rewrite** —
this is the single most common integrity failure in ESG tooling and it is banned here.

**Honesty:** OmniPlan is the planning and control plane. Raw IoT and utility-meter data may
remain in specialist systems; OmniPlan ingests and governs it.

---

## A.10 Search, help, academy, empty states (Part XLII)

**Search:** global across models, reports, metrics, journals, tasks, people, help, and
settings. Operators: `metric:`, `entity:`, `period:`, `book:`, `owner:`, `status:`.
Semantic search runs over names, descriptions, and commentary — **never over raw amounts**,
unless the tenant explicitly enables it and the data stays in-region. Recents, pinned
items, and "jump to my incomplete tasks" are first-class. Results are permission-filtered:
search never reveals the existence of an object the user may not see.

**Help:** contextual coach marks bound to feature ids; a formula assistant that explains a
formula in English; **"why is this number" resolves to lineage, never to a tooltip guess**;
in-app academy (CFO 30-minute path, Analyst 3-hour path, Admin 4-hour path); certification
exams for implementation partners; a per-tenant changelog reflecting that tenant's flags.

**Empty states:** every screen has a purposeful empty state with exactly one primary
action, plus a first-run sample model per industry pack — synthetic and labelled `DEMO`.

---

## A.11 Notifications, digests, escalations (Part XLIII)

**Event envelope:** `{id, tenant, type, severity, actor, entity_ref, ts, dedupe_key}`.
**Deliveries:** in-app, email, Slack, Teams, webhook, optional SMS.
**Preferences:** per user, per type, quiet hours, digest (daily/weekly).

**Escalation ladders:** budget overdue → owner → manager → FP&A lead; covenant headroom
below threshold → treasurer + CFO immediately; three-statement break → on-call finance
systems **and block the close**.

```
N1  No notification without a deep link to the exact object.
N2  Financial amounts in email/Slack obey field-level masking (Section 10.3).
N3  Unsubscribe cannot disable legal or control notices (close, SoD).
N4  100% of delivery attempts are logged; webhooks retry and then dead-letter.
```

---

## A.12 Entitlements, metering, commercial engine (Part XLIV)

The product must sell, meter, and enforce itself, or it is not complete.

**Metering dimensions:** seats by role, legal entities, model cells / facts, connected
systems, industry packs, AI queries, environments, VPC isolation.
**Plans:** starter, professional, enterprise, public sector.

**Entitlements engine:** evaluated **server-side on every API call**.
**Feature flags ≠ entitlements** — a flag ships code; an entitlement grants use. Conflating
them is how customers get access they did not buy, and how paying customers lose access
they did.

**Metering:** usage events in an append-only ledger; a customer-visible usage dashboard —
the customer must never be surprised by their own bill.

**Billing:** Stripe for self-serve; invoice + PO + net-30 for enterprise; **raw PAN is never
stored (PCI out of scope)**.

**Fair use:** soft limit warns → hard limit with grace → paid overage or a freeze on
non-close work. **Close and audit paths are never frozen for non-payment** without a legal
notice workflow (see R-20).

---

## A.13 Privacy, retention, legal hold, residency (Part XLVII)

```
PR1   Data map: financial, HR-comp, bank, usage, logs — categories documented.
PR2   Residency: tenant region pin (US, EU, UK, AU, CA, JP, IN…). Backups stay in-region.
PR3   BYOK / CMEK for enterprise, with a rehearsed key-rotation runbook.
PR4   Financial record retention default 7–10 years (tenant + jurisdiction policy).
PR5   GDPR erasure of a person: erase identifying fields, RETAIN the anonymised
      financial amounts required by law (K25), and document the legal basis in the
      erasure log.
PR6   Legal hold freezes purge jobs for specified entities, periods, and people.
PR7   Lower environments: production clones are masked (salaries, names, accounts).
PR8   DLP: block outbound webhooks containing unmasked salary or bank fields unless
      the destination is allow-listed.
PR9   Subprocessors published; DPA templates; SCC/IDTA as applicable.
PR10  Customer amounts are NEVER used to train shared models.
```

---

## A.14 Formula compatibility & calc profiler (Part LIII)

### A.14.1 Function library (implemented in heat order)

```
Core    IF, IFS, SWITCH, IFERROR, IFNA, AND, OR, NOT, LET, LAMBDA (Phase 2)
Math    SUM, SUMIF(S), SUMPRODUCT, AVERAGE, MIN, MAX, ROUND, ROUNDUP, ROUNDDOWN,
        MROUND, ABS, SIGN, MOD, POWER, SQRT, LOG, LN, EXP, INT, TRUNC
Lookup  INDEX, MATCH, XLOOKUP, XMATCH, CHOOSE, INDIRECT (restricted), OFFSET (restricted)
Ref     named ranges, structured table refs, spill arrays (Phase 2)
Logic   comparisons; boolean coercion rules documented as Excel-compatible AND tested
Text    LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER, TEXT, VALUE, CONCAT, TEXTJOIN
Date    DATE, DATEVALUE, EOMONTH, EDATE, YEAR, MONTH, DAY, YEARFRAC, NETWORKDAYS,
        WORKDAY, WEEKNUM, ISOWEEKNUM
Fin     NPV, XNPV, IRR, XIRR, MIRR, PMT, IPMT, PPMT, FV, PV, NPER, RATE,
        SLN, DDB, SYD, DB, VDB
Stat    STDEV.S/P, VAR.S/P, MEDIAN, PERCENTILE, CORREL, FORECAST, GROWTH, LINEST
Array   FILTER, SORT, UNIQUE, SEQUENCE, MAP, REDUCE (Phase 2)
Omni    METRIC(), ALLOC(), FX(), CONSOL(), PRIOR(), YOY(), R12(), DRIVER(),
        SCENARIO(), BOOK(), ASSET_DEP(), HC_FTE(), IC_ELIM(), COVENANT()

BANNED  INDIRECT/OFFSET against unbounded ranges; volatile NOW/RAND inside locked
        packs (sandbox only); CALL/REGISTER; any file or URL fetch from a formula.
```

### A.14.2 Compatibility & circular-reference policy

200 golden workbooks cover operator precedence, implicit intersection, percent handling,
and the date-serial policy (**ADR required: Excel serial OR ISO — pick one and document
it**), plus locale argument separators.

**Circular references default to FAIL**, not to Excel-style silent iteration.
Optional iterative calculation is a **tenant flag** requiring: a maximum iteration count,
a change threshold, convergence proof, and a **watermark on every output produced by an
iterative model**. A user must never be unable to tell whether a number converged.

**Profiler:** top 50 slowest nodes, dependent counts, cache hit rate; trace precedents /
dependents / evaluate-stepper for auditors; an inconsistent-formula linter across a block.

---

## A.15 Controls, fraud analytics, ICFR / SOX (Part LIV)

**Control library:** COSO-aligned catalogue. Types: preventive, detective, ITGC,
entity-level, transaction. Each control records an owner, frequency, evidence template,
population, and sampling method, with an automated test wherever one is possible
(SoD checks, period-lock checks, reconciliation completeness).

**SOX 404:** process narratives are **generated from the actual workflow graphs**, not
written as Word fiction that drifts from reality. Deficiency → remediation task → retest,
tracked as workflow instances.

**Fraud analytics:** Benford analysis on journals; round-dollar, weekend, and holiday
postings; sequential invoice gaps; duplicate payments and duplicate journals; related-party
keyword and entity-graph detection; unusual reversal patterns. Every finding is
**explainable and never auto-accusatory** — the system surfaces a pattern for a human to
investigate.

**ICFR honesty:** OmniPlan provides evidence and automation. It does **not** "make you SOX
compliant", and no surface, document, or sales claim will say that it does.

---

## A.16 M&A, deal room, impairment (Part LV)

**Virtual data room:** permissioned folders, watermarking, Q&A threads, NDA gate;
financials published as **frozen packs** (Section 14.4), never live links.

**Models:** merger (accretion/dilution, share issuance); LBO template (debt schedules,
returns); synergy tracker (plan vs actual, one-time vs run-rate); TSA income and cost;
carve-out P&L with stranded cost; working-capital peg and true-up; purchase price
allocation slots (intangibles, goodwill); earnout tracker.

**Impairment:** CGU / reporting-unit register; IAS 36 and ASC 350 workflow; DCF and market
approach slots; disclosure checklist.

---

## A.17 Implementation methodology & ecosystem (Part LVIII)

### The 14-day playbook (the promise that must be kept)

| Day    | Milestone                                         | Proof it happened                                                  |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------ |
| **0**  | Sandbox provisioned with an industry sample model | Tenant exists; `DEMO` data labelled; user logged in                |
| **1**  | One actuals source connected; COA mapped          | Sync completes with a reconciliation report; unmapped accounts = 0 |
| **3**  | Three statements balance                          | TS1–TS3 pass at runtime on real data; variance to source = 0       |
| **7**  | First rolling forecast produced                   | Forecast published with method, backtest error, and interval       |
| **14** | **First board pack generated from live actuals**  | Pack FINAL, frozen, watermarked, every figure drillable to source  |

This is a tested, timed commitment — not a marketing slogan. Failure to hit Day 14 with
three design partners blocks the GA gate (Section 22.5).

**Displacement playbooks:** Excel takeover; Anaplan / Adaptive / Planful / Vena
displacement; NetSuite-native finance team; SAP ECC / S4 group finance; PE portfolio
rollout via template-tenant cloning.

**Partner ecosystem:** certified implementer exam, sandbox entitlements, and an
implementation-project object **inside OmniPlan** — we run our own implementations on our
own product.

---

## A.18 Demo, sandbox, synthetic data (Part LIX)

```
SYN1  A deterministic, seeded generator per industry. Same seed = same dataset,
      so performance results and bug reports are comparable across runs.
SYN2  Every generated record is labelled DEMO. It is structurally impossible to
      confuse synthetic data with real data.
SYN3  Coverage of edge cases is mandatory, not optional: mid-year fiscal start,
      53-week years, multi-currency, intercompany transactions, NCI, adjustment
      periods, negative balances, zero-amount facts, and closed-period corrections.
SYN4  Performance dataset: 50M facts, 5,000 cost centres. Runs nightly in CI, never
      on a pull request (2-core constraint, K2).
SYN5  Masked-clone job for support access, gated on legal approval plus a
      customer-issued token, time-boxed and audited.
```

Three standard sizes back the Section 11.7 load profile: small (1M facts), medium (50M),
large (500M).

---

## A.19 Client surfaces beyond web (Part XLIX)

| Surface              | Phase | Contract                                                                                                                                                                                                                                                      |
| -------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Windows desktop**  | **0** | **Tier 1 and already shipping** — Tauri 2 + WebView2, native SQLite, offline modelling, OS credential storage. Full specification in **Section 23**; 12 `F-DESK-*` features in §3.7.1. Per §23.8 nothing here is marked BUILT until executed on real Windows. |
| Web                  | 1     | Co-primary. React 19 + Vite (ADR-003). Full parity except desktop-only capabilities (§23.3).                                                                                                                                                                  |
| Excel add-in         | 2     | Office.js. Cells bind to metric queries. **Writeback only to unlocked input cells, fully audited, subject to identical period locks and maker-checker.** Offline cache replays through the COL6 conflict protocol.                                            |
| Google Sheets add-on | 2     | Read-first; writeback under the same rules.                                                                                                                                                                                                                   |
| Slack / Teams        | 3     | Approve/reject budget lines, ask masked NLQ, complete close tasks. **Never dumps a full P&L into a channel.**                                                                                                                                                 |
| Mobile               | 2     | Read-only dashboards and approvals; biometric + step-up auth; **no local plaintext database of financials**. Modelling is an explicit non-goal (Section 9.10).                                                                                                |
| Browser extension    | 3     | Optional capture of ERP screenshots into the evidence locker.                                                                                                                                                                                                 |
| Public API + SDKs    | 3     | TypeScript and Python, generated from the OpenAPI document.                                                                                                                                                                                                   |
| Embed SDK            | 3     | iframe + scoped token for customer portals, field-masked.                                                                                                                                                                                                     |

---

## A.20 Storage tiers & derived stores (Part L)

```
ST1   Postgres OLTP is the system of record for facts, journals, workflow, and MDM.
ST2   Any OLAP path (DuckDB, columnar, cube) is DERIVED, rebuildable, and NEVER the SoR.
ST3   Sparse addressing: store only non-null intersections. A "1B-cell model" stored
      densely is a lie.
ST4   Aggregate navigator precomputes common grains (entity × account × month).
ST5   CQRS: writes go to facts + outbox; readers may use replicas or derived stores.
ST6   Derived-store lag is PUBLISHED IN THE UI ("actuals as of 03:12 UTC"). A user
      must never be silently reading stale numbers.
ST7   Columnar export (Parquet) to a customer warehouse (Snowflake share / S3).
ST8   Arrow Flight optional in Phase 3 for partner BI — it does not replace the OmniPlan UI.
ST9   Partitions compressed and encrypted at rest.
ST10  Hot / warm / cold tiers: current FY hot, prior FY warm, 6+ years cold.
```

---

## A.21 Secure SDLC (Part LII)

Threat model per new endpoint. SAST, DAST, SCA, container scan, and IaC scan in CI. SBOM
generated per release. Blocking secret scan. Pinned dependencies with advisory ingest.
Annual penetration test **and an additional test after any major calculation-engine
change**. Bug bounty after Phase 2. WAF, DDoS protection, and bot management at the edge.
No user-supplied SSRF in connectors — outbound URLs are allow-listed.

### Certification roadmap (honesty matrix)

| Phase | Target                                                                                                                       | Claim permitted before issuance                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1     | SOC 2 Type I controls designed; vulnerability management                                                                     | "Controls designed to meet SOC 2"              |
| 2     | SOC 2 Type II, ISO 27001, GDPR/UK DPA, CCPA                                                                                  | "Audit in progress" only once fieldwork starts |
| 3     | ISO 27701; HIPAA BAA only if ePHI is ever in scope (default: avoid); IRAP / FedRAMP-adjacent for public-sector packs as sold | None                                           |

**Do not print "FedRAMP authorized" until authorized.** This applies to every certification
in the table, without exception.

---

## A.22 Addendum II lock-checklist coverage map

| Checklist item (Codex line 3042)                           | Where satisfied                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Temporal domain + fiscal calendars + TZ/DST tests (XXXI)   | A.1; Section 5.1 `periods`; 18.3 W1.3                         |
| MDM + SCD2 + metric store + semantic planner (XXXII)       | A.2; Section 5.1; 15.3; 18.3 W1.1/W1.3                        |
| Multi-book + local GAAP honesty matrix (XXXIII)            | A.3; Section 5.1 `books`; 18.3 W1.4                           |
| Close OS + journals + recs + restatement (XXXIV)           | A.4; Section 13.7; 6.7; 18.4                                  |
| Treasury / cash / debt / covenant scope + non-goals (XXXV) | A.5; 18.4                                                     |
| RevRec phases + waterfalls (XXXVI)                         | A.6; 18.4                                                     |
| Leases, SBC, tax provision phases (XXXVII)                 | A.7; 18.4/18.5                                                |
| IC match + elimination identities (XXXVIII)                | A.8; 18.4                                                     |
| ESG data model + factor versioning (XXXIX)                 | A.9; 18.5                                                     |
| Dev/UAT/Prod + model promotion (XL)                        | Section 16.1 (EN1–EN7); 18.2 W0.2                             |
| Collaboration conflict protocol for money (XLI)            | Section 13.5 (CL1–CL7); ADR-006                               |
| Search / academy / empty states (XLII)                     | A.10; Section 9.4; 9.9                                        |
| Event bus + masking in notifications (XLIII)               | A.11; Section 13.8                                            |
| Entitlements + metering (XLIV)                             | A.12                                                          |
| SLIs/SLOs including 100% integrity (XLV)                   | Section 16.5–16.6                                             |
| SCIM, SoD, JML, break-glass (XLVI)                         | Section 10.4; A.13; 18.3 W1.8                                 |
| Retention vs erasure + residency + BYOK (XLVII)            | A.13 (PR1–PR10); Section 10.7                                 |
| Board pack freeze + watermark + e-sign (XLVIII)            | Section 14.4 (BP1–BP7); A.4.1                                 |
| Excel add-in writeback rules (XLIX)                        | Section 8.4; A.19                                             |
| Sparse cube + CQRS + SoR rule (L)                          | A.20 (ST1–ST10); Section 11.4; ADR-005                        |
| Connector outbox/inbox/DLQ (LI)                            | Section 8.2 (IR1–IR8); 5.1; 18.3 W1.6                         |
| Certification honesty matrix (LII)                         | A.21; Section 10.6                                            |
| Formula function list + circular-ref policy (LIII)         | A.14; Section 6.2 (F1–F9)                                     |
| SOX/ICFR evidence model (LIV)                              | A.15; Section 10.6                                            |
| Deal room + impairment workflow (LV)                       | A.16; 18.5                                                    |
| Mobile non-goals (LVI)                                     | Section 9.10; A.19                                            |
| Ledger design system tokens (LVII)                         | Section 9.8                                                   |
| 14-day implementation playbook (LVIII)                     | A.17                                                          |
| Synthetic data generator spec (LIX)                        | A.18; Section 11.7                                            |
| Stable error code registry (LX)                            | Section 16.8; A.14                                            |
| Full tree (LXI) as `docs/architecture/TREE.md`             | Written at lock; see Section 21 ADR index and the lock record |
