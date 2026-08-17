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

| ID   | Risk                                                                                                                                                                                                                                       | L   | I   | Score  | Mitigation                                                                                                                                             | Trigger to escalate                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| R-01 | **A wrong number reaches a customer's board pack.** The existential risk.                                                                                                                                                                  | 3   | 5   | **15** | Runtime three-statement gate (0.3), golden fixtures, property tests, mutation testing on money, reconciliation on every import, lineage for every fact | Any `FIN-000` in production                                                         |
| R-02 | Money-primitive migration stalls at partial adoption, leaving mixed float/decimal paths — the most dangerous possible state                                                                                                                | 4   | 5   | **20** | Ratchet script; Phase 0 gate at 60%, Phase 1 at 90%; no feature work merges that lowers adoption                                                       | Adoption flat for 2 consecutive weeks                                               |
| R-03 | Scope paralysis — 96 features, 25 verticals, and nothing ships                                                                                                                                                                             | 4   | 4   | **16** | Hard phase gates; Phase 0 ships almost no features on purpose; vertical packs deferred to Phase 2/3                                                    | Phase overruns by > 25%                                                             |
| R-04 | Retrofitting tenancy later requires touching every table and query                                                                                                                                                                         | 3   | 5   | **15** | `tenant_id` in Phase 0, before anything else stores data (M001)                                                                                        | Any new table shipped without `tenant_id`                                           |
| R-05 | Cross-tenant data leak                                                                                                                                                                                                                     | 2   | 5   | 10     | Dual enforcement PC4; per-table leak tests; deny-by-default; no admin bypass query                                                                     | Any leak test added without a passing assertion                                     |
| R-06 | Environment degradation hides real problems — no Docker/Postgres/Rust means RLS, scale, and Wasm claims are unverifiable here                                                                                                              | 5   | 3   | **15** | Explicitly label unverifiable claims "designed for, not proven"; require real-infra validation before any scale or certification claim                 | A scale claim published without a k6 run                                            |
| R-07 | The 193-route sprawl makes the product unlearnable; users churn in trial                                                                                                                                                                   | 4   | 4   | **16** | Phase 0 workstream 0.5; ≤ 40 routes; ⌘K; ROUTE_MAP drift gate                                                                                          | Trial activation < 40%                                                              |
| R-08 | Connector built before inbox/outbox → duplicate or lost financial records                                                                                                                                                                  | 3   | 5   | **15** | F-INTEGRATE-000 is a hard prerequisite; no connector PR merges before it                                                                               | Any adapter PR without idempotency                                                  |
| R-09 | LLM egress of customer monetary data                                                                                                                                                                                                       | 2   | 5   | 10     | Single chokepoint, REDACTED default, per-feature opt-in, audit of every call, zero-retention endpoints only                                            | Any direct SDK import outside the chokepoint                                        |
| R-10 | Claiming a certification that does not exist                                                                                                                                                                                               | 2   | 5   | 10     | LII honesty matrix; "designed to meet" language until the report is issued; legal review of all claims                                                 | Any marketing draft naming an unissued cert                                         |
| R-11 | The Codex-prescribed stack (Next.js/Fastify/Prisma/Kafka/Rust) is imposed as a rewrite, destroying 455k lines and 1,228 green tests                                                                                                        | 3   | 5   | **15** | ADR-003 (Section 21) records the reasoned deviation with evidence; evolution path S0→S4 is trigger-based                                               | Any PR that begins a framework migration without a measured trigger                 |
| R-12 | SQLite → PostgreSQL cutover corrupts or loses data                                                                                                                                                                                         | 2   | 5   | 10     | PC1–PC5 portability from Phase 0; M013 full dress rehearsal with row-count and sum reconciliation; verified backup first                               | Rehearsal reconciliation mismatch of any size                                       |
| R-13 | Vertical packs fork the engine (violating K19), creating 25 unmaintainable codebases                                                                                                                                                       | 3   | 4   | 12     | PK6 — a pack needing an engine change is rejected; generalise the engine instead                                                                       | Any pack PR touching `src/engines/`                                                 |
| R-14 | Performance collapses at real scale; the DAG recalc does not hold                                                                                                                                                                          | 3   | 4   | 12     | CP1–CP8; CI perf budgets on a fixed dataset; k6 per tier; profiler with top-50 slowest nodes                                                           | p95 recalc regression > 20%                                                         |
| R-15 | Audit log tampering or hash-chain break                                                                                                                                                                                                    | 2   | 5   | 10     | DB-level append-only, hash chain, `/v1/audit/verify`, alerting on verification failure                                                                 | Any verify failure                                                                  |
| R-16 | Collaboration corrupts numbers via silent merge                                                                                                                                                                                            | 3   | 5   | **15** | COL3/COL4 — leases + typed conflict + explicit human resolution; CRDT restricted to non-monetary content                                               | Any last-write-wins path on a decimal                                               |
| R-17 | Key-person dependency / context loss between sessions                                                                                                                                                                                      | 4   | 3   | 12     | `.agent/` memory discipline, PROJECT_JOURNAL, ADR log, this blueprint as the single source of intent                                                   | Any session starting without reading `.agent/state.json`                            |
| R-18 | CI cannot be updated from this environment (no `workflows` permission), so gates silently rot                                                                                                                                              | 4   | 3   | 12     | Numbered `ci-patches/*.patch` with apply instructions; track pending patches in state.json                                                             | > 2 unapplied patches                                                               |
| R-19 | Restatement handled as an in-place edit, silently changing published history                                                                                                                                                               | 2   | 5   | 10     | R1–R5 restatement protocol; new immutable version; SUPERSEDED banners; disclosure checklist                                                            | Any UPDATE on a closed-period fact                                                  |
| R-21 | **No system of record.** 43 stores persist financial truth to browser `localStorage`; only 14 non-test files call the server (§0.6.1). Clearing site data destroys the ledger; backup/RTO/RPO/audit claims are unbackable while this holds | 4   | 5   | **20** | Workstream 0.8 — persistence authority, money-safe serialization, `glStore` server-authoritative spike; UI must state local-only durability honestly   | Any durability, backup, or audit claim made for a store still classified local-only |
| R-22 | **The money gate can read green while money is unsafe.** `money:adoption` detects an _import_ of the primitive by regex, not decimal-correct arithmetic; "0 raw `toFixed`" is therefore not evidence of safety                             | 4   | 5   | **20** | Workstream 0.1.0 replaces the regex with an AST detector before the ≥60% gate is trusted; re-baseline expected to fall before it rises                 | Any adoption figure quoted from the import-regex scanner after 0.1.0 lands          |
| R-23 | Schema forked across `src-tauri/migrations/*.sql` (35 tables) and the server's in-code DDL (9 more) with no drift detection                                                                                                                | 3   | 4   | 12     | Workstream 0.8.4 — single schema source + CI equality gate                                                                                             | Any table defined in one source and not the other                                   |
| R-20 | Non-payment freezes a customer mid-close, causing regulatory harm                                                                                                                                                                          | 2   | 4   | 8      | Fair-use ladder (XLIV): close and audit paths are never frozen without a legal-notice workflow                                                         | Any hard limit applied to a close path                                              |

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
| ☑   | No floating point anywhere in the monetary calculation path       | §6.4 arithmetic contract; §5.2 D1; §18.2 W0.1.2; static guardrail + `money:adoption` gate                       |
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
