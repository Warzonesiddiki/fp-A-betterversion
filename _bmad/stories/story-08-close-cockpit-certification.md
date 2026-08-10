# Story 08: Close Cockpit and Certification Vertical Slice

## Status: DRAFT

## Context & Purpose
Fulfils PRD E4.1/E4.2 and UX §5.4. Controller completes a controlled close based on real control state.

## Dependencies
- Requires Story 07 DONE.
- Relevant files: consolidation/period/audit UI through feature flags; close/workflow authoritative domains.

## Acceptance Criteria
- [ ] Checklist derives task state from controls and shows owner, SLA, dependency, evidence, exception and blocker.
- [ ] Reconciliation exposes source/target/tolerance/difference/freshness/matches and drill-through.
- [ ] Certification captures scope, role, attester, evidence, time and policy version.
- [ ] Lock rejects unauthorized API/UI/import/offline replay; exceptions require approval/rationale/expiry/audit.

## Technical Guidance
Do not use generic progress cards. Follow UX Close Cockpit state model and require server lifecycle enforcement.

## Definition of Done
- [ ] Simulated close E2E, authz, audit, keyboard/a11y and failure recovery tests pass.
- [ ] QA review and G6/G7 approval completed.