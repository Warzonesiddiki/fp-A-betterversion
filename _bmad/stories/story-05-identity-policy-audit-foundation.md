# Story 05: Identity, Tenant Policy, and Audit Foundation

## Status: DRAFT

## Context & Purpose
Fulfils PRD E2.1/E2.2 and Architecture §8. Establishes authoritative security and evidence before official financial workflows.

## Dependencies
- Requires Story 04 DONE.
- Relevant files: server auth/middleware/services, policy modules, audit trail adapters/tests.

## Acceptance Criteria
- [ ] Trusted identity/session and production mock-auth prohibition are enforced.
- [ ] Tenant/entity/classification/lifecycle policy is deny-by-default server-side.
- [ ] Official commands emit append-only audit events with actor, scope, correlation, policy result and secure diff reference.
- [ ] Cross-tenant, privilege escalation, missing-audit and SoD negative tests pass.

## Technical Guidance
Client hash chains are not sufficient immutable evidence. Use protected authoritative audit/export storage design from Architecture §8.

## Definition of Done
- [ ] Security review, API authz tests, audit evidence tests pass.
- [ ] QA review and G6/G7 approval completed.