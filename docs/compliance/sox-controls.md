# SOX Controls

> **Supersession notice (2026-11-05, rechecked 2026-11-11):** Owner decision DEC-102 states
> that FinPlan Pro is **not a SOX compliance system** and that the local audit chain is
> client evidence, not SOX authority (`docs/discovery/decision-log.md`;
> `docs/security/SECURITY.md`). The implementation claims below are superseded; retain this
> page as historical context, not as a current product claim. The server audit service has
> a default 2,555-day (7-year) retention configuration and an HMAC checksum method
> (`server/src/services/AuditService.ts:227-232`), but those scoped facts do not establish
> SOX compliance. Its source comment still uses SOX wording; no application-source file was
> changed under the docs-first gate. No independent SOX audit, legal assessment, or deployed
> retention verification was performed.

## Overview

FinPlan Pro **does not implement SOX compliance**. It contains engineering controls that a
SOX programme in a customer's own environment might rely on as inputs. This page lists what
actually exists, and where each item falls short of a control.

## Controls — what exists, and its limit

- **Financial statement articulation** — `server/src/gates/threeStatementGate.ts` enforces
  TS3 (assets = liabilities + equity, open-ledger formulation) on GL entry writes and soft
  deletes, returning FP-0300/0301/0302. Limit: this is **server-side only** on the optional
  API; the local client does not go through it. TS1 and TS2 exist as tested pure checks but
  are **not wired to any write path** because no retained-earnings or cash-flow-statement
  tables exist. See [`../architecture/THREE_STATEMENT_GATE.md`](../architecture/THREE_STATEMENT_GATE.md).
- **Accounting equation invariant (KAV-09/KAV-10)** — covered by
  `src/engines/__tests__/kav-financial-articulation.test.ts` as hand-written known-answer
  fixtures. Limit: these are tests, not a runtime invariant guarantee, and not
  property-based tests.
- **Period close and locking** — a real local write guard exists: `DEC-008`'s
  `getGLPeriodWriteIssues` (`src/services/import/glPeriodWriteGuard.ts`) is consulted by the
  GL store at 17 call sites, treating soft-close as read-only and failing closed on
  unmapped or overlapping scopes. Limit: this is a **local, application-level** guard, not
  a database-enforced control, and it cannot constrain a user who writes to the store
  directly in devtools.
- **Audit logging** — the client audit chain is SHA-256 hash-chained. Limits: it is
  **unkeyed**, so an attacker with write access can recompute a consistent chain; it is
  **not immutable**; the 7-year retention figure is a **server default configuration value**
  (`auditLogDays: 2555`), not a verified deployed retention policy; and the frontend has no
  `/api/audit` caller. See [`../architecture/security.md`](../architecture/security.md) §5.
- **Segregation of duties and change management** — not established here. Client RBAC is
  bypassable (F-0016), and no deployment-level separation of duties was evidenced.

## Correct posture

Treat every item above as **engineering input to a control**, never as a satisfied control.
Any statement that the product is "SOX compliant", "SOX-ready", or that its audit trail is
authoritative for financial reporting would contradict DEC-102 and must be removed
wherever it appears.
