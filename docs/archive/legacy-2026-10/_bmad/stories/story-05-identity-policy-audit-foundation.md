# Story 05: Identity, Tenant Policy, and Audit Foundation

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-07** inputs (authz/audit certification) and **P-01** inputs (policy/audit evidence on authoritative data).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.

## Size: XL | Risk: HIGH (security-critical foundation)

## Why This Story Exists

Fulfils PRD E2.1/E2.2, Architecture §8, and the identity-security-compliance contract (`_bmad/research/identity-security-compliance-contract.md`). Authoritative security and evidence must exist BEFORE any official financial workflow ships — a pilot that cannot prove "who did what, under which policy, with what evidence" is not a credible close→decision→board-pack loop.

## Research Context

- The controlled-close and governed-reporting contracts require actor/scope/correlation/policy-result audit on every official command; client-side claims are never sufficient (`../research/controlled-close-reconciliation-contract.md` §Audit; `../research/governed-reporting-board-pack-contract.md` §Evidence).
- R-01/R-02 (enterprise interviews) remain UNVALIDATED; solo-dev re-baseline (2026-08-11) scopes first delivery to a **public-beta segment**. This story stays blocked until the pilot slice is evidence-selected (R-04 framework is ready).
- No deployment/residency decision is made here (A-08/A-09 UNVALIDATED); the server authz design must not presuppose a deployment target that lacks evidence.

## Dependencies

- Requires: F-04 control-plane contract spike (DONE — zod envelope, idempotency, revisions, negative authz, audit in `server/`); server real-SQLite verification (DONE).
- Files to inspect/modify: `server/` auth/middleware/services, policy modules, audit trail adapters/tests; `src/api/commandClient.ts` remains feature-flagged and unwired until this story.
- Depended on by: P-01 (master data policy/audit), P-07 (operations/security certification).

## Acceptance Criteria

- [ ] Trusted identity/session and production mock-auth prohibition are enforced.
- [ ] Tenant/entity/classification/lifecycle policy is deny-by-default server-side.
- [ ] Official commands emit append-only audit events with actor, scope, correlation, policy result and secure diff reference.
- [ ] Cross-tenant, privilege escalation, missing-audit and SoD negative tests pass.

## Technical Guidance

Client hash chains are not sufficient immutable evidence. Use the protected authoritative audit/export storage design from Architecture §8. Extend the F-04 server contracts (revisions, idempotency, zod envelope) rather than introducing a parallel command surface.

## Out of Scope

- Selecting the pilot vertical/tenant type (R-04); deployment/residency commitments (evidence-pending); client-only authorization for official data (forbidden by contract); AI autonomy expansion.

## Definition of Done

- [ ] Security review, API authz tests, audit evidence tests pass (real SQLite, native binding).
- [ ] Typecheck, changed-file lint, and targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix rows updated only with real evidence; project context updated.
