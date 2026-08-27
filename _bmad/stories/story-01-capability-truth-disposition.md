# Story 01: Capability Truth Disposition

## Status: DONE — 2026-08-10

## Context & Purpose

Fulfils PRD E1.1 and Blueprint inventory Pass B. Static matrix proves source/test evidence only; all 199 routes need a human product disposition before migration or enterprise claims.

## Dependencies

- Requires G5 approval.
- Inputs: `docs/CAPABILITY_TRUTH_MATRIX.md`, `docs/ZERO_COMPROMISE_PRODUCT_BLUEPRINT.md` §1.5.
- Modifies: capability matrix and supporting evidence records only; no route behavior.

## Acceptance Criteria

- [ ] Every routed screen has one disposition: retain, migrate, redirect, retire, or experimental.
- [ ] Each core-journey route has owner, persona/job, and current maturity evidence gap.
- [ ] Duplicates/aliases are identified with target route and retirement risk.
- [ ] No maturity is promoted without linked evidence.

## Technical Guidance

Use `npm run capability:inventory` as baseline. Add a manual disposition column/companion evidence record; do not edit generator output manually without documenting why. Reconcile source counts with manifest counts rather than treating either as readiness.

## Definition of Done

- [ ] ACs pass; matrix regenerated; review evidence recorded.
- [ ] Documentation check passes.
- [ ] QA review and G6/G7 approval completed.
