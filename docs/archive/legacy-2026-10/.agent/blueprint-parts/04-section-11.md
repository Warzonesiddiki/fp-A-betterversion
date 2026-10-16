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
