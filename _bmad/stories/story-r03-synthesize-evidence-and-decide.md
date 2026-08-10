# Story R-03: Synthesize Evidence and Update Assumptions

## Status: DRAFT
## Size: M | Risk: HIGH

## Why This Story Exists
Turns research sessions into explicit validated, invalidated, or unresolved decisions; prevents anecdote-driven requirements.

## Research Context
The Evidence Log requires at least three relevant participant signals or verified operational evidence before a finding is validated.

## Dependencies
- Requires: R-02 DONE.
- Files: evidence-log, assumption-registry, traceability matrix, product brief, major-area map.
- Depended on by: R-04 and all pilot stories.

## Acceptance Criteria
- [ ] Every critical assumption has supporting, contradicting, and confidence evidence summarized.
- [ ] Assumption status changes cite evidence IDs and exact decision consequence.
- [ ] Contradictions are preserved; they are not averaged away.
- [ ] Product Brief/PRD/UX/architecture impacts are listed by traceability row.

## Implementation Context
Run a Blaze challenge/pre-mortem when evidence supports multiple viable paths. Do not select a pilot because of source-tree convenience.

## Definition of Done
- [ ] Evidence synthesis memo and updated registry/traceability complete.
- [ ] Owner direction/decision recorded.
- [ ] Research QA verifies no unsupported validation claim.