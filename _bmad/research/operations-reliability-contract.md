# Operations, Reliability & Deployment Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Define the operating evidence required before calling a capability enterprise-ready.

## SLO baseline

| Capability                      | Target at approved reference workload | Evidence                  |
| ------------------------------- | ------------------------------------: | ------------------------- |
| Interactive context/page change |                               p95 ≤2s | RUM trace                 |
| Financial grid usable state     |                               p95 ≤3s | browser performance trace |
| Simple/complex report           |                        p95 ≤5s / ≤30s | job telemetry             |
| API read excluding async work   |                            p95 ≤200ms | service metrics           |
| Availability post-GA            |                  ≥99.9% control plane | SLO/error budget          |
| Recovery                        |        RPO ≤15 min, RTO ≤4h initially | quarterly restore drill   |

Targets are hypotheses until a design-partner workload profile replaces the reference workload.

## Operability model

- Structured, redacted logs; distributed traces; metrics; correlation IDs; business/control events.
- Dashboards: API errors/latency, job/queue health, import quality, close blockers, report failure, sync conflicts, authorization denial, backup health.
- Durable jobs for import, export, report snapshot, close/consolidation, notification, recalculation; idempotent retries, dead-letter/quarantine and tenant context.
- Environment separation: local/dev, preview, staging with sanitized data, production; IaC, migration preflight, feature flags, rollback.
- Customer-safe support bundle excludes secrets/raw financial content and includes correlation IDs/health/config metadata.

## Release certification

A release has: signed/provenance artifact, schema migration/rollback plan, feature-flag plan, security/dependency/secret evidence, type/lint/unit/integration/E2E results, accessibility/performance evidence, SLO alert/runbook coverage, support communication, and rollback owner.

## Acceptance evidence

- Failure injection: queue failure, import retry, partial dependency outage, stale cache, offline replay.
- Load/soak at reference workload; performance regression budget.
- Backup restore and rollback rehearsal.
- Incident tabletop and on-call runbook exercise.
- No test that could not run is counted as passed; it is recorded UNVERIFIED.
