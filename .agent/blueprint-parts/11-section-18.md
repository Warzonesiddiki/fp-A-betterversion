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
| 0.1.2                        | Type-aware money detection                                 | Upgrade `money-ast-detector.mjs` from name-based to full type resolution via the TS type checker, so money flowing through a generically-named variable is still caught. Expect another honest drop                                                                                                                                                                                                                                                |
| 0.1.1                        | Complete money-primitive migration                         | Safety ≥ 90% measured by the **0.1.0 AST detector** (`npm run money:ast`). First honest baseline 2026-08-17: **78.55% safe — 740 unsafe monetary operations across 184 of 858 monetary modules**. Ratchet enforces monotonic improvement                                                                                                                                                                                                           |
| 0.1.2                        | Eliminate float paths                                      | Detector reports 0 unsafe monetary operations in financial paths — including the **persistence boundary** (§0.6.1: `localStorage` JSON round-trips) and the store-selector layer, not only `toFixed`/`parseFloat`/`Number()`. Guardrail fails the build on reintroduction                                                                                                                                                                          |
| 0.1.3                        | Money type is total                                        | `Money = {amount: Decimal, currency: CurrencyCode}`; no bare number crosses an engine boundary                                                                                                                                                                                                                                                                                                                                                     |
| 0.1.4                        | 100% coverage + mutation ≥ 80% on `src/utils/money.ts`     | Stryker report checked in                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0.1.5                        | Property tests for allocation, aggregation, FX round-trip  | Section 17.4 suite green                                                                                                                                                                                                                                                                                                                                                                                                                           |

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
resolution via the TypeScript type checker is tracked as **W0.1.2**.

**Exit criterion:** `docs/architecture/PERSISTENCE_MAP.md` exists and is CI-drift-checked; no monetary value
is persisted as an IEEE-754 `number`; `glStore` is server-authoritative; every local-only
surface says so.

### Workstream 0.7 — Task sizing & independence proof (XVIII-N)

**Every Phase 0 item above is decomposed to a task of ≤ 1 week for one engineer.** Items
that could not be honestly sized under a week were split; the split is shown here so the
sizing claim is auditable rather than asserted.

| Item                            | Sub-tasks (each ≤ 1 week)                                                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.1 Money migration to 60%    | (a) adoption scanner + ratchet script · (b) convert consolidation + variance engines · (c) convert forecast + scenario engines · (d) convert server route boundaries · (e) convert store selectors that format money |
| 0.1.2 Eliminate float paths     | (a) guardrail script + allow-list of non-financial uses · (b) remediate `src/engines` hits · (c) remediate `server/src` hits                                                                                         |
| 0.1.3 Total money type          | (a) type definition + codemod · (b) engine boundary signatures · (c) fix fallout                                                                                                                                     |
| 0.2.1 `tenant_id` everywhere    | (a) M001 migration + backfill · (b) repository signature change · (c) rehearsal test on a seeded copy                                                                                                                |
| 0.2.2 Environments              | (a) M002 migration · (b) `environment_id` on governed objects · (c) default-to-prod backfill                                                                                                                         |
| 0.2.3 Repository pattern        | (a) inventory SQL outside `server/src/db/` · (b) move it · (c) guardrail rule                                                                                                                                        |
| 0.2.4 Policy predicate compiler | (a) predicate DSL + compiler · (b) mandatory query-builder filter · (c) per-table leak test generator                                                                                                                |
| 0.3.1 Runtime oracle            | (a) extract oracle from test harness into an engine module · (b) wire into write path · (c) non-disableable assertion + negative test                                                                                |
| 0.4.1 Error registry            | (a) registry source + codegen · (b) migrate existing thrown errors · (c) lint rule                                                                                                                                   |
| 0.5.1 Route inventory           | (a) route extractor → `docs/product/ROUTE_MAP.md` · (b) pillar classification · (c) drift check in CI                                                                                                                |
| 0.5.2 Shell + palette           | (a) five-pillar shell · (b) ⌘K palette · (c) permission filtering · (d) ≤3-click E2E                                                                                                                                 |
| 0.5.3 Route consolidation       | (a) redirect table · (b) collapse batch 1 (≈80 routes) · (c) collapse batch 2 · (d) 404 sweep                                                                                                                        |
| 0.6.1 LLM chokepoint            | (a) chokepoint module · (b) ban direct SDK imports · (c) redaction default + egress test                                                                                                                             |
| 0.8.1 Persistence inventory     | (a) enumerate + classify 43 stores · (b) write `docs/architecture/PERSISTENCE_MAP.md` · (c) CI drift check                                                                                                           |
| 0.8.2 Money-safe serialization  | (a) decimal-string codec · (b) apply to financial stores · (c) 10k-case round-trip property test                                                                                                                     |
| 0.8.4 Schema fork closure       | (a) diff the two schema sources · (b) reconcile · (c) CI equality gate                                                                                                                                               |
| 0.8.6 `glStore` authority spike | (a) server read/write path · (b) offline replica + reconnect · (c) typed conflict resolution on decimals                                                                                                             |

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
