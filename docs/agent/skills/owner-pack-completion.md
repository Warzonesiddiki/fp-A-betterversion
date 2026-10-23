---
name: owner-pack-completion
description: Use when compiling owner decisions O1-O9 into a completion document. Records what is claimed, what is blocked, and what the owner must answer.
group: meta
---

# Owner Pack Completion

**Use it when:** summarizing the state of owner decisions (O1-O9) for a release or completion report.

## Method

1. **Enumerate all O-ids:** O1 through O9, each with its question, recommended default, and what stays blocked.
2. **Record status:** For each O-id, state whether the owner has answered, or whether it remains BLOCKED-ON-OWNER.
3. **No inference:** Never infer an answer from silence. Silence means the provisional default is adopted, recorded as provisional, and named as such in every report.
4. **State boundaries:** Explicitly list what the agent will never do without an answer (no D365 verified, no "your data is safe", no SOX authority, no CI green claim, no entity-scope authorization).
5. **Reply template:** Provide a copy-paste template for the owner to answer in one reply.

## What this prevents

- Claiming D365 verified without a real export
- Saying "your data is safe" without a restore test
- Claiming SOX compliance without an authority source
- Claiming CI green when GitHub Actions returns 403
- Inferring entity-scope authorization from the active entity

## Related

- `docs-and-decisions` — how decisions are recorded
- `release-engineering` — release preparation
- `zero-compromise-verification` — the overarching discipline
