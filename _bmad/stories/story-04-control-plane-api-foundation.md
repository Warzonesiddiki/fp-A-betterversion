# Story 04: Control-Plane API Foundation

## Status: DRAFT

## Context & Purpose
Fulfils Architecture §§3 and 6, PRD E2/E8. Establishes the incremental authoritative API boundary.

## Dependencies
- Requires Story 03 DONE.
- Relevant files: `server/src/`, root typed client boundary, API tests.

## Acceptance Criteria
- [ ] Versioned command/query API supports command ID, correlation ID, base revision, typed errors, and financial context envelope.
- [ ] Trusted server identity, not client payload, determines actor/tenant.
- [ ] Request validation, redacted structured logging, rate/error taxonomy, and trace propagation exist.
- [ ] Contract tests cover accepted/completed/conflict/rejected outcomes.

## Technical Guidance
Modularize existing Express incrementally; do not rewrite framework without ADR amendment. Official routes must have no direct local-storage authority.

## Definition of Done
- [ ] API integration and negative validation tests pass; runbook/API docs updated.
- [ ] QA review and G6/G7 approval completed.