# Architecture — FinPlan Pro Enterprise Decision System

> **Status:** APPROVED HYPOTHESIS ARCHITECTURE — Gate G4 approved by owner on 2026-08-10; re-baselined 2026-08-10 (YOLO mode); **BMAD v5.0 re-certified 2026-08-10** (restart Step 4, see `_bmad/v5-restart-2026-08-10.md`); primary validation remains mandatory
> **BMAD phase:** 3 — Solutioning & Architecture complete
> **Inputs:** approved hypothesis Product Brief (G1), PRD (G2), UX specification (G3), `_bmad/research/research-report.md`, `_bmad/research/research-to-requirements-traceability.md`, `_bmad/project-context.md`
> **Architecture principle:** Incrementally make official finance operations authoritative, auditable, tenant-safe, and operable. Do not rewrite working calculation/UI code merely to match a fashionable stack.

> **v2.1 rebaseline notes (2026-08-10):** No architecture decision or ADR changed. Merged delivery verified with full-suite/type/lint/build/audit evidence (E-004). CI red is an account billing block (E-005), not an architecture regression. F-04 remains a contract spike (not production migration); the workspace draft/cache boundary and server authority boundary statements below are unchanged and still unvalidated.

## 1. Architecture outcomes traced to requirements

| Requirement                            | Architecture response                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| PRD E1 global context and trust states | Typed `FinancialContext`, server-authorized scope resolution, shared lifecycle/event vocabulary, URL/saved-view serialization.  |
| PRD E2 tenant/policy/evidence          | Identity gateway, policy enforcement point in API, PostgreSQL RLS, append-only audit/evidence service, immutable artifact sink. |
| PRD E3 actuals/master data             | Canonical master-data and ingestion bounded contexts, staging/quarantine pipeline, mapping versions, idempotent commands.       |
| PRD E4 close/consolidation             | Asynchronous, reproducible domain runs with frozen input/rule/FX versions and workflow gates.                                   |
| PRD E5 analyst modeling/offline        | Local workspace cache + command outbox + authoritative command API + revision/conflict policy.                                  |
| PRD E6 decision workspace              | Read/query projections serving materiality/action/evidence views; no direct client database access.                             |
| PRD E7 reporting                       | Semantic metric catalog, report definition/version, immutable snapshot artifact workflow.                                       |
| PRD E8 resilience/operations           | SLO telemetry, durable jobs/outbox, backups/PITR, restore drills, runbooks, controlled deployment.                              |
| UX §9 architecture flags               | Context, evidence, grid conflict, snapshots, and responsive capabilities are contracts, not presentation-only work.             |

## 1.1 Research and hypothesis traceability

| Architecture decision                 | PRD / UX requirement                       | Research basis                                | Validation boundary                                                       |
| ------------------------------------- | ------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| Incremental Control Plane             | E2, E3, E4, E5, global context/evidence UX | R-03, R-05; A-02                              | Hybrid deployment/security acceptance remains unvalidated                 |
| PostgreSQL + RLS + immutable evidence | E2, E3, E4, E7                             | R-03; identity/security and lineage contracts | scale, residency, retention and customer control requirements remain open |
| Workspace draft/cache boundary        | E5 and offline UX                          | A-02, A-04; sync contract                     | Local-first value and conflict tolerance require user/IT validation       |
| Materiality/DecisionCase read model   | E6 and Decision Workspace                  | R-04, A-03; materiality contract              | CFO behavior and threshold policy require prototype study                 |
| Immutable report snapshots            | E7 and board-pack UX                       | R-03; reporting/lineage contracts             | reporting/certification policy requires customer validation               |
| Cited supervised AI                   | E9 and AI UX                               | R-02/R-03; AI governance contract             | provider, use case, evaluation and privacy policy remain open             |
| No big-bang rewrite                   | all                                        | R-05; brownfield audit                        | migration effort must be validated in a technical spike                   |

Every architecture decision below is an approved-hypothesis decision, not a claim that the corresponding production control already exists. Primary evidence or technical spike results may amend the ADR before implementation.

## 2. Target system overview

```text
┌──────────────────── FinPlan Workspace ────────────────────┐
│ React/Vite web + Tauri desktop                             │
│ Atlas shell | FinancialContext | Grid | local encrypted    │
│ cache | command outbox | sync/status | API client          │
└───────────────┬───────────────────────┬────────────────────┘
                │ HTTPS / OIDC          │ local draft/cache only
┌───────────────▼───────────────────────▼────────────────────┐
│ Enterprise Control Plane                                   │
│ API/BFF: authentication, scope, validation, commands       │
│ Query API: context-aware projections, reports, evidence    │
│ Domains: master data | actuals | planning | close | report  │
│          workflow | integration | audit | notification      │
└───────┬────────────┬──────────────┬───────────────┬────────┘
        │            │              │               │
┌───────▼──────┐ ┌───▼────────┐ ┌──▼───────────┐ ┌─▼─────────┐
│ PostgreSQL   │ │ Object     │ │ Durable jobs  │ │ IdP/KMS   │
│ + RLS + PITR │ │ storage/WORM│ │ + outbox      │ │ + secrets │
└──────────────┘ └────────────┘ └──────────────┘ └───────────┘
                                      │
                         imports | reports | close | notifications
```

### Authority boundary

The Workspace may calculate and persist local drafts for offline productivity. It **cannot** make an official state change. Official commands are accepted only by the Control Plane after authentication, tenant/entity scope, lifecycle/SoD, schema, idempotency, and concurrency validation. The Control Plane records audit evidence and emits an outbox event in the same transaction.

## 3. Incremental implementation topology

### Current brownfield baseline

- React/Vite client with routes, Zustand stores, AG Grid, decimal.js, Tauri source, local persistence, calculation engines.
- Separate Node/Express TypeScript server under `server/`.
- Current `src/App.tsx` has a Tauri-only browser gate; browser/PWA is not assumed delivered.

### Migration path

1. **Stabilize interfaces, not framework names:** add typed API contracts, error taxonomy, request/correlation IDs, feature flags, and a new `enterprise/` domain boundary alongside existing client stores/engines.
2. **Build one authoritative vertical slice:** identity/scope → master data → import → reconciliation → close → report snapshot. Existing UI reads through adapters; no wholesale route rewrite.
3. **Move official plan/report/close writes to commands:** preserve pure engine code where correct; execute/verify authoritative calculations server-side before publish.
4. **Introduce outbox/jobs/artifacts:** imports, consolidations, report exports, notifications, and recalculations become durable jobs.
5. **Migrate canonical UX screens behind feature flags:** shell/context first, then decision, grid, close, report patterns. Retire aliases only after parity/evidence.

## 4. Bounded contexts and ownership

| Context                  | Owns                                                         | Commands                                     | Read models                                  |
| ------------------------ | ------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------- |
| Identity & Policy        | membership, roles, attributes, sessions, access review       | grant/revoke/role change                     | permitted scopes, effective permissions      |
| Master Data              | entity, hierarchy, COA, dimensions, calendar, currency       | create/effective-date/retire                 | context picker/tree/valid dimensions         |
| Actuals & Ingestion      | source, mapping, batch, staging, journal/balance             | import/validate/correct/retry                | source health, trial balance, reconciliation |
| Planning                 | plan, version, driver, assumption, cell change               | create version/edit/submit/approve/lock      | grid, comparison, forecast coverage          |
| Close & Consolidation    | close task, reconciliation, certification, run, exception    | reconcile/certify/lock/run/approve exception | cockpit, exception queue, run history        |
| Reporting                | metric definition, report definition, snapshot, distribution | define/run/publish/export/share              | report viewer, board pack                    |
| Workflow                 | task, assignment, approval, escalation                       | assign/approve/reject/delegate/escalate      | My Work, timelines                           |
| Audit & Evidence         | immutable event/evidence reference/retention                 | append only                                  | evidence drawer, audit export                |
| Integration & Operations | connection reference, mapping, job, health                   | test/sync/pause/resume                       | connection health, job telemetry             |

No context reads another context's tables directly; it uses a transactionally published event, contract, or query projection.

## 5. Data architecture

### 5.1 Authoritative persistence

**PostgreSQL** is the initial system of record because it supports transactional integrity, numeric types, RLS, mature backup/PITR, partitioning, and operational simplicity. It replaces local SQL.js/localStorage only for authoritative enterprise state; local storage remains workspace cache/draft state.

Core conventions:

- UUID identifiers; `tenant_id` on every tenant-owned record; no tenant supplied from untrusted request body.
- `numeric(20,4)` or a documented higher precision policy for money; ISO currency stored with amount; rate/source/type/effective date for FX.
- UTC timestamps plus applicable fiscal calendar/period IDs; effective-dated master data.
- Immutable event/audit rows; mutable aggregates include `version` for optimistic concurrency.
- Soft retirement for master data; reversal/adjustment entries for posted finance facts; never destructive overwrite.
- Tenant/RLS policies and tenant-scoped indexes are tested as a separate security boundary.

### 5.2 Essential logical model

```text
Tenant ─┬─ Membership/Role/PolicyAssignment
        ├─ LegalEntity ──< EntityHierarchy
        ├─ FiscalCalendar ──< FiscalPeriod
        ├─ Account/CostCenter/Department/Dimension (effective dated)
        ├─ ImportBatch ──< StagedRecord / ValidationIssue / MappingVersion
        ├─ LedgerEntry ──< LedgerLine (period, entity, account, dimensions, money)
        ├─ Plan ──< PlanVersion ──< ModelCell / Driver / Assumption / Scenario
        ├─ CloseCycle ──< CloseTask / Reconciliation / Certification / Exception
        ├─ ConsolidationRun (frozen input/rule/FX version IDs)
        ├─ MetricDefinition ──< ReportDefinition ──< ReportSnapshot
        ├─ WorkflowInstance ──< Task / Approval / Comment
        └─ AuditEvent ──< EvidenceReference
```

### 5.3 Data lifecycle

1. Source data enters encrypted object storage/staging with content hash and a mapping version.
2. Validator produces row-level issues and control totals; invalid records are quarantined.
3. Authorized import command posts normalized facts atomically, writes audit/outbox, and exposes reconciliation results.
4. Close/consolidation/report commands freeze referenced input versions; results are versioned, never overwritten.
5. Published artifacts/snapshots go to tenant-scoped object storage with immutability/retention policy.

## 6. API and command contracts

### 6.1 API style

Use versioned REST/JSON for commands and predictable query endpoints first. The existing Express server may be modularized incrementally; adoption of Fastify or GraphQL requires a later ADR with a demonstrated problem. Browser clients use a typed generated/checked client. APIs never expose raw database access.

### 6.2 Request envelope

```ts
interface CommandEnvelope<T> {
  commandId: string; // UUID; idempotency key
  correlationId: string; // end-to-end trace/audit ID
  baseRevision?: number; // required for mutable aggregates
  financialContext: {
    entityScope: string[];
    periodIds: string[];
    versionId?: string;
    scenarioId?: string;
    currency: string;
  };
  payload: T;
}

interface CommandResult<T> {
  commandId: string;
  status: 'accepted' | 'completed' | 'conflict' | 'rejected';
  data?: T;
  errors?: Array<{ code: string; message: string; field?: string }>;
  auditEventId?: string;
  jobId?: string;
}
```

Actor/tenant/effective permissions are derived from session/token, never supplied by client. Error responses are typed, localized-safe, correlation-ID-bearing, and do not expose sensitive internals.

### 6.3 Initial endpoint families

| Family        | Examples                                                         | Control requirement                                             |
| ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| Context/query | `GET /v1/context`, `/views`, `/workspace/decisions`              | resolve scope server-side; cache key tenant/scope/version aware |
| Master data   | `/entities`, `/accounts`, `/periods`, `/dimensions`              | effective-date validation, policy, audit                        |
| Ingestion     | `/imports`, `/imports/{id}/validate`, `/retry`                   | idempotency, quarantine, hash/mapping/control totals            |
| Planning      | `/plans`, `/versions`, `/cells:batch`, `/submit`, `/approve`     | revision conflict, lifecycle/SoD, audit                         |
| Close         | `/close-cycles`, `/reconciliations`, `/certifications`, `/locks` | control gate/exception policy, immutable evidence               |
| Consolidation | `/consolidation-runs`                                            | async job/frozen inputs/validation result                       |
| Reports       | `/metrics`, `/reports`, `/snapshots`, `/exports`                 | definition/snapshot version, policy, export audit               |
| Workflow      | `/tasks`, `/approvals`, `/delegations`                           | actor/role/deadline/escalation audit                            |
| Evidence      | `/evidence/{object}`, `/audit-export`                            | scoped, redacted, retention-aware                               |

## 7. Sync, offline, and collaboration contract

- Local command outbox stores command ID, base revision, actor/device session reference, created time, payload encryption reference, and retry state.
- Server response is authoritative: accepted/completed/conflict/rejected. Client never silently retries non-idempotent command without its command ID.
- Merge policy: comments can merge; independent draft edits may merge by field; cell/financial fact collisions require conflict UI; posted/published facts never use client last-write-wins.
- Offline UI says queued/not official and displays age/count/failure/recovery actions.
- Real-time updates use a future authenticated event channel only after command/audit policy is implemented; event payloads are scope-filtered and resumable.

## 8. Security architecture

| Layer          | Control                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Authentication | Enterprise OIDC/SAML; MFA/session policy; SCIM considered by tenant tier; production mock auth prohibited.         |
| Authorization  | RBAC + ABAC with tenant/entity/cost center/classification/lifecycle context; deny by default.                      |
| Data           | TLS 1.3; envelope encryption/KMS; secrets manager; tenant-scoped object/cache/queue keys; PII classification.      |
| Database       | PostgreSQL RLS; least-privilege roles; migrations reviewed; PITR backups encrypted.                                |
| Application    | schema validation, output encoding, CSRF strategy for cookie flows, CSP, rate limits, idempotency, secure headers. |
| Supply chain   | SHA-pinned CI actions, dependency/secret/license scan, SBOM, signed artifacts/provenance.                          |
| Audit          | append-only service/store plus protected immutable export; correlation IDs; legal hold/retention.                  |
| AI             | provider allowlist, tenant opt-in/policy, minimized scoped retrieval, citations, no autonomous official writes.    |

## 9. Jobs, events, and integration architecture

Use transactional outbox records with a durable worker/queue. Initial job types: import validation/posting, report snapshot/export, consolidation, notification/escalation, recalculation, connector sync, retention/export. A worker is idempotent, has bounded retries/backoff, dead-letter/quarantine behavior, correlation IDs, tenant context, and observable state.

Connector credentials live only in a vault/secrets manager reference, never in connection JSON or client state. Connector contract includes authentication test, source cursor/checkpoint, mapping version, rate limit, delta/idempotency, job run, reconciliation, error classification, and revoke/rotate lifecycle.

## 10. Deployment, observability, and recovery

### Deployment

- Environments: local/dev, isolated preview, staging with sanitized/synthetic data, production.
- Containerized control-plane/workers; managed PostgreSQL/object storage/KMS/secret manager preferred initially.
- Infrastructure as code, environment policy, migration preflight, feature flags, canary/rollback plan.
- Desktop release remains separately signed/notarized with update channel and compatibility policy.

### Observability

- OpenTelemetry-compatible traces from workspace request through API/job/database boundary.
- Metrics: API latency/error, import quality, close controls, report jobs, queue depth, sync conflict, authorization denial, backup success, SLO/error budget.
- Structured/redacted logs; no raw ledger/PROMPT/secrets in standard logs.
- Alert + runbook per critical SLO/control failure.

### DR

- Automated encrypted backups/PITR; regular restore to isolated environment; quarterly documented drill.
- Initial approved objective: RPO ≤15 min, RTO ≤4h. New target requires measured proof, not aspiration.
- Runbooks for identity outage, import failure, data integrity issue, report failure, key rotation, compromised credential, and desktop sync failure.

## 11. ADR register

| ADR     | Decision                                      | Rationale / rejected alternative                                                           |
| ------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| ADR-E01 | Incremental strangler migration               | Preserves validated engines/UI while adding authority; reject big-bang framework rewrite.  |
| ADR-E02 | PostgreSQL as first authoritative store       | Transactional/RLS/operable; reject immediate multi-database estate without workload proof. |
| ADR-E03 | REST command/query API first                  | Clear audit and typed contracts; reject premature GraphQL/microservice proliferation.      |
| ADR-E04 | Local workspace is cache/draft, not authority | Supports offline value without policy bypass; reject client-only official numbers.         |
| ADR-E05 | Transactional outbox + durable jobs           | Prevents lost cross-domain events; reject best-effort in-process background work.          |
| ADR-E06 | Immutable snapshots for publication           | Reproducibility and audit; reject mutable report results.                                  |
| ADR-E07 | RLS plus application authorization            | Defense in depth; reject UI-only tenant filtering.                                         |
| ADR-E08 | AI is supervised/cited                        | Finance risk control; reject autonomous posting/publishing.                                |

Each ADR must become a separately numbered file under `docs/adr/` before implementation of its decision.

## 11.1 F-04 spike outcome (2026-08-10)

**What was proven (spike scope only, in-memory registry — not production):**

- A typed command envelope (`server/src/types/commandEnvelope.ts`, zod-validated) with command id, correlation id, idempotency key, base revision, timestamp, entity scope, and payload.
- Trusted-actor scope enforcement: global Admin bypass; otherwise `user_entity_access` rows (or matching global `entity_id`) grant entity scope; JWT identity, never client payload, decides actor/tenant.
- Idempotent replay: identical outcome returned for a repeated idempotency key without re-application; query side `GET /api/v1/commands/:correlationId` returns the stored outcome (404 NOT_FOUND otherwise).
- Base-revision concurrency: stale revisions return typed `CONFLICT_REVISION` with the current revision.
- Typed errors: `VALIDATION_ERROR`, `FORBIDDEN_ENTITY`, `CONFLICT_REVISION`, `NOT_FOUND`.
- Audit evidence: `audit_trail` row per accepted command with actor, scope, revision, correlation id, and idempotency key (same insert pattern as existing routes).
- Contract tests: 8 passing (`server/src/routes/commands.test.ts`), including negative authorization.

**Verification status (2026-08-10):** server tests now run against **real SQLite** (native better-sqlite3 built from local Node headers). The migration to real-DB testing surfaced and fixed schema/FK/ordering issues the mock had masked — see `_bmad/research/evidence-log.md` E-007 and reasoning-ledger entry #16. The schema is guaranteed at connection time (idempotent `ensureSchema`), `audit_trail` and server-route columns are canonicalized, and tests use per-worker disposable databases. The in-memory mock remains only as a documented dev/sandbox fallback when the native binding cannot be built.

**Client completion (same session):** `src/api/commandClient.ts` provides the typed browser transport — `CommandClient.submitCommand(envelope)` / `getCommandResult(correlationId)` against `/api/v1/commands`, bearer auth, typed error mapping (`CommandRequestError`, `ControlPlaneDisabledError`), and response validation via `isCommandResult` (no zod import, keeping the client bundle lean). Feature-flagged: `isControlPlaneEnabled()` reads `VITE_CONTROL_PLANE_URL` / `VITE_ENABLE_CONTROL_PLANE`; when unset the client is never constructed. Client contract types (`CommandResult`, `CommandError`, `CommandStatus`, `isCommandResult`) mirror the server envelope in `src/types/commandEnvelope.ts`. Tests: 14 (client + contract) with mocked fetch, including 401 and 409 mapping. The client is intentionally not wired into any screen until a Control Plane deployment is configured (no pre-decided deployment).

**Migration path:** production implementation must persist the registry (outbox + revision state) transactionally with audit evidence — PostgreSQL/outbox per ADR-E02/E03. The typed envelope and scope-check semantics carry forward unchanged.

## 12. Key risks and required decisions

| Risk/decision                   | Impact                                         | Required owner decision before story planning |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| Deployment model/data residency | determines tenancy, KMS, region, operations    | commercial + security owner                   |
| First design partner/connector  | determines canonical mapping/workflow priority | product owner                                 |
| Primary buyer conflict          | changes default workspace and permissions      | executive sponsor                             |
| Browser/PWA support             | current source is Tauri-only gated             | product + architecture owner                  |
| Offline collaboration scope     | affects sync/event/conflict architecture       | product + finance owner                       |
| Regulatory target               | drives controls/evidence/compliance scope      | legal/security owner                          |

## 13. Gate G4 decision

**Approve, request changes, or reject this architecture.**

Approval authorizes Phase 4a only: PRD-to-architecture alignment, sprint plan, and self-contained stories. It does not authorize implementation until Gate G5 approves that plan.
