# Story F-01: Capability Evidence Governance

## Status: DONE — QA APPROVED 2026-08-10
## Size: M | Risk: LOW

## Why This Story Exists
Fulfils Pack F-01 and R-05. The codebase has broad source inventory, but only evidence-backed maturity can support internal prioritization or external claims.

## Research Context
The capability matrix established that source/test presence is not Connected, Governed, or Enterprise-ready. Research-first delivery requires a deterministic owner/disposition/evidence route for every route and source category.

## Dependencies
- Requires Gate G5 approval (complete).
- Files: `scripts/generate-capability-truth-matrix.mjs`, `docs/CAPABILITY_TRUTH_MATRIX.md`, `docs/ZERO_COMPROMISE_PRODUCT_BLUEPRINT.md`, `docs/design/*` as applicable.
- Depended on by: F-02, F-03, and Pack P release certification.

## Acceptance Criteria
- [ ] Generated inventory gives every routed screen a pillar, disposition, and accountable role.
- [ ] Generated page/engine/store/component/service inventories have deterministic category and accountable role fields.
- [ ] No generated row claims Connected, Governed, or Enterprise-ready without linked evidence.
- [ ] Generator remains reproducible via `npm run capability:inventory`.
- [ ] Documentation explains role ownership is a placeholder until named enterprise owners are assigned.
- [ ] Generator/type/diff checks pass.

## Implementation Context
Roles are governance categories, not fabricated employee assignments. Use explicit `UNVERIFIED` maturity values. This story does not change product behavior, architecture, routes, or financial calculations.

## Definition of Done
- [ ] All ACs verified.
- [ ] Generator run and generated matrix reviewed.
- [ ] QA review records result.
- [ ] project-context and capability truth documentation updated.