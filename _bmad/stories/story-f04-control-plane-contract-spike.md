# Story F-04: Control-Plane API Contract Spike

> **File history:** created as `story-04-control-plane-api-foundation.md`; research-contextualized and renamed F-04 on 2026-08-10 (YOLO mode).

## Status: APPROVED — ready for implementation (research-contextualized 2026-08-10); implementation not yet started
## Size: M | Risk: MEDIUM

## Why This Story Exists
Fulfils PRD Epics E2/E8 and Architecture §§3 and 6 (incremental authoritative API boundary). It proves the typed command/evidence/authorization contract as a technical spike — **not** a production migration — so that the Enterprise Control Plane hypothesis (A-04) is tested before any commitment.

## Research Context
- R-03: official finance operations require authoritative, auditable, tenant-safe server enforcement; R-05: current breadth does not establish enterprise maturity.
- A-04 (hybrid Control Plane meets security/audit needs) and A-05 (engine reuse with bounded migration risk) are UNVALIDATED — this spike produces technical feasibility evidence for them, which is not market validation.
- Owner direction (E-001): hybrid Workspace + Enterprise Control Plane; local workspace remains draft/cache, never official authority.
- No production migration is authorized by this story; output is evidence + ADR amendment if required.

## Dependencies
- Requires: story-f01 capability governance — COMPLETE; F-03 typed `FinancialContext` contract (shared envelope types).
- Files to inspect/modify: `server/src/`, root typed client boundary (e.g., `src/types/` or `src/api/`), API contract tests, `_bmad/architecture.md` (ADRs).
- Depended on by: P-02…P-06 (pilot slice commands), P-07 (certification).

## Acceptance Criteria
- [ ] AC1: Versioned command/query API supports command ID, correlation ID, idempotency key, base revision, typed errors, and the financial context envelope.
- [ ] AC2: Trusted server identity — never the client payload — determines actor/tenant/entity scope.
- [ ] AC3: Negative authorization tests prove cross-tenant/entity access is rejected for official routes.
- [ ] AC4: Audit event contract is defined (actor, action, scope, revision, before/after references, timestamp) and recorded for accepted commands.
- [ ] AC5: Request validation, redacted structured logging, rate/error taxonomy, and trace propagation exist in the spike.
- [ ] AC6: Contract tests cover accepted / completed / conflict / rejected outcomes; no direct local-storage authority for official routes.

## Implementation Context
- Modularize the existing Express server incrementally; do not rewrite the framework without an ADR amendment.
- The spike may use in-memory or minimal persistence; it must not claim production readiness.
- Document outcome and migration path in the architecture ADR (amend or add ADR-###).

## Out of Scope
- Production deployment, real tenancy data, connector implementation, browser/PWA changes, AI autonomy, broad API migration of all existing routes.

## Definition of Done
- [ ] All ACs verified; API integration and negative validation tests pass.
- [ ] Spike outcome documented (what was proven, what failed, migration path) in `_bmad/architecture.md`.
- [ ] Typecheck and changed-file lint pass; targeted suite green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix and project context updated.
