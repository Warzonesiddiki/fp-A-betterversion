# Story 08: Close Cockpit and Certification Vertical Slice

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-03** (close controls + certification + lock).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.

## Size: XL | Risk: HIGH

## Why This Story Exists

Fulfils PRD E4.1/E4.2, UX §5.4, and the controlled-close reconciliation contract. The wedge product hypothesis (research report: "controlled close-to-decision-to-board-pack is the leading wedge, pending primary validation") cannot be demonstrated without a controller-completable, evidence-backed close — this is the highest-credibility slice of the loop.

## Research Context

- `../research/controlled-close-reconciliation-contract.md` defines task-state derivation, reconciliation evidence, certification scope/attestation, and lock semantics — the implementation contract for this story.
- The R-02 session kit's controller workflow probes (checklist, reconciliation, certification, exception process) define the UX questions this story must answer when Tier-2 evidence arrives; kit retained for revival (solo-dev re-baseline).
- P-track re-scope: the close cockpit is delivered for the first public-beta segment selected by R-04 — no enterprise controller persona is assumed (A-03/controller role UNVALIDATED).

## Dependencies

- Requires: Story 07 (ingestion/reconciliation) DONE; Story 05 DONE; F-04 command/audit envelope available.
- Files to inspect/modify: consolidation/period/audit UI through feature flags; close/workflow authoritative domains; `server/` control-plane services.

## Acceptance Criteria

- [ ] Checklist derives task state from controls and shows owner, SLA, dependency, evidence, exception and blocker.
- [ ] Reconciliation exposes source/target/tolerance/difference/freshness/matches and drill-through.
- [ ] Certification captures scope, role, attester, evidence, time and policy version.
- [ ] Lock rejects unauthorized API/UI/import/offline replay; exceptions require approval/rationale/expiry/audit.

## Technical Guidance

Do not use generic progress cards. Follow the UX Close Cockpit state model and require server lifecycle enforcement (F-04 revisions/idempotency/audit; never client-only authority). Atlas trust-language (F-02) applies to all state rendering.

## Out of Scope

- Broad consolidation/close platform parity; vertical/connector selection; enterprise certification policy without evidence; AI autonomy (no autonomous actions per ai-governance contract).

## Definition of Done

- [ ] Simulated close E2E, authz, audit, keyboard/a11y and failure recovery tests pass.
- [ ] Typecheck, changed-file lint, targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix updated only with real evidence; project context updated.
