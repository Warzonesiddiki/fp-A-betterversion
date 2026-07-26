# Step 08 — Sprint Planning: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Sprint:** Section 012 Sprint (focused 1-2 day implementation)

## Sprint Goal
Deliver hardened, interconnected Trial Balance, Journals, and Account Analysis experiences with full navigation, running balance, and passing gates.

## Committed Stories (from Step 07)

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| 012-01 | Trial Balance Polish + Navigation | 5 | P0 |
| 012-03 | Account Analysis (Trend + Running Balance) | 5 | P0 |
| 012-02 | Journals Enhancements | 3 | P1 |
| 012-04 | Cross-Page Navigation & State | 3 | P1 |
| 012-05 | Consistent UX & Accessibility | 2 | P2 |
| 012-06 | Tests & Validation | 4 | Parallel |

**Total:** ~22 points (focused sprint)

## Sprint Breakdown (Batches)

**Batch 1 (Foundation)**
- Enhance `generateTrialBalance` if needed + add `getRunningBalance` helper in glStore or util
- Wire clickable rows + actions in GLTrialBalancePage
- Update Account Analysis to compute + display running balance + improve trend

**Batch 2 (Navigation)**
- Add "Analyze Account" and "View Journals" flows
- Pass state/params between pages
- Improve Journals with Analyze action

**Batch 3 (Polish + Tests)**
- Consistent loading/empty states
- Accessibility pass
- Add/update targeted tests
- Full gate run

## Definition of Done per Story
- Code + tests
- Gates verified (tsc, lint, build, hygiene, targeted tests)
- Task board updated
- Evidence in section files

## Capacity & Approach
- Small meaningful batches
- Verify gates after every batch
- Prefer derivation over new store state where possible
- Document any deferred items

## Risks for Sprint
- Performance on large data — mitigate with memo + pagination
- Pre-existing test noise — focus only on GL-related tests

Sprint planning complete. Moving to implementation (Step 09/10).
