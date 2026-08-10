# Integration & Data Quality Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Make integration a controlled data product, not a connector demo.

## Core rule

No data becomes an authoritative financial fact until its source, extraction, mapping, validation, control totals, retries, and reconciliation outcome are recorded.

## Connector contract

Each connection has tenant-scoped identity, credential-vault reference, source permissions, schema/version, cursor/checkpoint, mapping version, schedule, health state, rate-limit policy, revoke/rotate lifecycle, and owner. Credentials never enter client state, logs, mapping JSON, or exports.

## Import lifecycle

`Discover → Authenticate/Test → Extract → Stage → Profile → Map → Validate → Quarantine/Correct → Post → Reconcile → Monitor`

| Stage | Required evidence |
|---|---|
| Extract | source/cursor/range, time, hash, job, retry/idempotency key |
| Stage/Profile | schema, row count, sensitive fields, quality profile |
| Map | mapping version, source-to-canonical fields, transformation rules, owner/approval |
| Validate | required dimensions, period, currency, balance, duplicate, reference, policy failures |
| Quarantine | row-level reason, correction path, source preservation, no silent coercion |
| Post | accepted/rejected counts, authoritative IDs, audit/outbox |
| Reconcile | source/control total vs posted total, difference/tolerance, sign-off |

## Data-quality dimensions

Completeness, validity, uniqueness, referential integrity, timeliness, balance/reconciliation, mapping coverage, and freshness. A quality score never hides failed mandatory controls.

## First connector selection

Select only after validation-plan evidence: frequency in target ICP, access/API feasibility, financial value, mapping complexity, security/legal constraints, and paid-pilot demand. CSV/XLSX import remains a first-class controlled path, not a fallback shame state.

## UX and operations

Import UI shows source, mapping, preview, validation outcomes, quarantine, correction/retry, control totals, evidence, freshness, and health. Operators see job state, queue age, error class, retry, pause/resume, and support correlation ID.

## Acceptance evidence

- Idempotent re-run does not duplicate facts.
- Invalid rows quarantine with actionable reason.
- Mapping change creates new version/lineage.
- Source-to-posted reconciliation is reproducible.
- Credential, cross-tenant, logging/redaction, retry, and checkpoint failures are negative-tested.
