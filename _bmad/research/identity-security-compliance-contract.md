# Identity, Security & Compliance Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Define the security/control baseline required for official enterprise finance operations.

## Security principle

A hidden menu item is not authorization. Every official command and every evidence query is denied by default until trusted identity, tenant, entity/dimension, data-classification, lifecycle, and policy context authorize it.

## Control domains

| Domain | Required control |
|---|---|
| Identity | OIDC/SAML, MFA/session controls, SCIM consideration, production mock-auth prohibition |
| Authorization | RBAC + ABAC, server enforcement, PostgreSQL RLS, least privilege, periodic access review |
| Segregation of duties | configurable incompatible roles/actions; approval/certification/exception checks |
| Data protection | TLS, encryption at rest/envelope KMS, secrets manager, key rotation, classification/masking |
| Tenant isolation | tenant-scoped database/cache/queue/object paths; negative tests for every boundary |
| Application security | schema validation, output encoding, CSRF strategy, CSP, rate limits, secure headers, idempotency |
| Audit/evidence | append-only records, protected immutable sink, correlation IDs, retention/legal hold, export audit |
| Supply chain | pinned actions, SBOM, secret/dependency/license/container scan, signed provenance |
| Privacy | minimization, retention, DSR process, data residency decision, provider controls |
| AI | tenant policy, provider allowlist, scoped retrieval, citations, no autonomous official write |

## Compliance claim policy

FinPlan may claim a control only when an owner, evidence artifact, automated/manual test, review cadence, and expiry are registered. SOC 2, GDPR, SOX, HIPAA, Basel, or jurisdictional claims require scoped legal/control review; product pages are not compliance proof.

## Incident and recovery baseline

Documented playbooks cover compromised credential, authorization breach, data integrity issue, import failure, audit-evidence outage, key rotation, backup restore, and AI data exposure. Incidents retain correlation/evidence without exposing financial payloads in standard logs.

## Acceptance evidence

- Cross-tenant/entity/classification/SoD negative tests.
- Audit-event completeness/tamper tests.
- Restore drill, access review, incident tabletop, secret rotation exercise.
- Independent security assessment before pilot/GA scope appropriate to risk.
