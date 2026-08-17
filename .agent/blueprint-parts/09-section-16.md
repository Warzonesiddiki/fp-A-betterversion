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
