# SOC 2 Readiness

> **Evidence boundary (2026-11-05):** This short overview is not an auditor report or a control-by-control readiness assessment. The master security policy says SOC 2 references are design mappings only and that no SOC 2 report, independent assessment, or operating-control evidence was audited (`docs/security/SECURITY.md:7-10, 43-49`). The server contains a separate HMAC audit method and authenticated-request middleware (`server/src/services/AuditService.ts:224-232, 1154-1160`; `server/src/middleware/auditMiddleware.ts:45-62`); those code paths do not establish product-wide control scope, an evidence period, auditor opinion, or readiness. Production/runtime evidence and any independent assessment are `[UNVERIFIED: not inspected]`. Treat the overview below as an unsupported legacy summary, not a current compliance claim.

## Overview

FinPlan Pro is architected to meet SOC 2 Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy).

## Controls

- **Access Control**: Role-based access control with audit logging.
- **Data Protection**: Encryption at rest and in transit.
- **Incident Response**: Structured incident logging and response tracking (`IncidentResponse`).
- **Monitoring**: Comprehensive audit trail with tamper-evident HMAC checksums.
