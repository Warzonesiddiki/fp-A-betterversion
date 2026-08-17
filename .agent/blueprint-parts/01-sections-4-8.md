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
