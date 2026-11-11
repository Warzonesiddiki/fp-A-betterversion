# SOC 2 Readiness

> **Evidence boundary (2026-11-05, rechecked 2026-11-11):** This short overview is not an
> auditor report or a control-by-control readiness assessment. The master security policy
> says SOC 2 references are design mappings only and that no SOC 2 report, independent
> assessment, or operating-control evidence was audited (`docs/security/SECURITY.md` §§1
> and 6-7). The server contains a separate HMAC audit method and authenticated-request
> middleware (`server/src/routes/audit.ts`, `server/src/middleware/auditMiddleware.ts`).
> Those code paths do not establish product-wide control scope, an evidence period,
> auditor opinion, or readiness. Production/runtime evidence and any independent
> assessment are `[UNVERIFIED: not inspected]`. Treat the overview below as an unsupported
> legacy summary, not a current compliance claim.

**Status:** legacy summary retained for provenance. The headings below describe **intended
design mappings**, and several are materially weaker than the wording suggests — the
qualifications in this section are part of the record and must travel with the claims.

## Overview

FinPlan Pro is architected with **design intentions** relevant to the SOC 2 Trust Services
Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). No
criterion has been assessed, evidenced for an operating period, or reported on by an
auditor. "Architected to meet" is therefore not a statement this repository can support.

## Controls — intended mapping, with current limitations

- **Access Control** — role-based access control exists, but it is **client-side only** on
  the shipped desktop/browser path and is bypassable by a user who edits state in devtools
  (F-0016, open). Server-side middleware exists on the optional API, which the client does
  not depend on for authorization. Not an access-control assurance for a deployed system.
  See [`../architecture/rbac.md`](../architecture/rbac.md).
- **Data Protection** — live storage is AES-256-GCM at rest, but the device key sits in
  `localStorage` beside the data, so a copied browser profile is not protected; OS keychain
  integration is **NOT IMPLEMENTED**. **"In transit" is not established**: the API server
  calls `app.listen` on plain HTTP with no TLS server
  (`server/src/index.ts:232`), and HSTS is applied only when `IS_PRODUCTION`. Backup
  exports are **unencrypted JSON**. See
  [`../security/ENCRYPTION_AT_REST_TAURI_IPC_POLICY.md`](../security/ENCRYPTION_AT_REST_TAURI_IPC_POLICY.md)
  and [`../architecture/backup-restore.md`](../architecture/backup-restore.md) §8.
- **Incident Response** — an `IncidentResponse` service class exists
  (`src/services/IncidentResponse.ts:340`). Class presence is not an operating incident
  process, and no exercise, on-call rotation, or deployed response procedure was inspected.
- **Monitoring** — the audit trail is hash-chained, but the **client chain is unkeyed** and
  therefore not tamper-evident against a local adversary; the HMAC variant exists only in
  the optional server, which the frontend does not call. See
  [`../architecture/threat-model.md`](../architecture/threat-model.md).

## What would be required to change this page's status

1. A scoped control-by-control readiness assessment against the chosen Trust Services
   Criteria, with named evidence per control.
2. An operating evidence period and deployed-environment inspection.
3. An independent auditor engagement and opinion.
4. Owner sign-off on the scope and on any publication of readiness claims.

Until all four exist, this page must not be cited in sales, board, or customer material.
