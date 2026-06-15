# CATCH Entry — Atlas v0.14 filename vs master Part title mismatch (2026-06-15)

## What happened

In v0.14 dispatch, the Lead assigned Atlas 7 "infra-aligned" Parts with these filenames:

| Filename in dispatch                    | Master Part title (from `C:\Users\Tahir\Desktop\New Text Document.txt`) |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `PART_021_INFRA_OPERATIONS_RUNBOOK.md`  | Part 21 — **API & Service Layer Specification**                         |
| `PART_022_INFRA_OBSERVABILITY_SLO.md`   | Part 22 — **Validation & Business Rules Engine**                        |
| `PART_023_INFRA_DISASTER_RECOVERY.md`   | Part 23 — **Notification, Alert & Event System**                        |
| `PART_024_INFRA_DEPLOYMENT_TOPOLOGY.md` | Part 24 — **Keyboard Shortcuts & Power User Features**                  |
| `PART_084_BUILD_PIPELINE_DETAIL.md`     | Part 84 — **Routing Architecture & Navigation Specification**           |
| `PART_085_RELEASE_MANAGEMENT.md`        | Part 85 — **Financial Accounting Edge Cases Specification**             |
| `PART_086_ENVIRONMENT_STRATEGY.md`      | Part 86 — **Formula Parser Grammar & Spreadsheet Engine Specification** |

The Lead's filenames describe an **infra-operations perspective** (runbook, SLO, DR, deployment topology, etc.). The master Part titles describe **specific implementation domains** (API, validation, notifications, keyboard, routing, accounting edges, formula engine).

## What I did

1. **Wrote the 7 docs with the Lead-assigned filenames and titles** (the dispatch is explicit and an implementing agent can build infra from them).
2. **Cross-referenced the corresponding master Parts** in each doc's "Cross-refs" frontmatter so an implementing agent knows the master Part is the source of truth for the _what_, and this doc is the source of truth for the _how it's operated in production_.
3. **Flagged the overlap** in each doc's "Open Questions" section so Strategos / the synthesizing agent can resolve.

## Suggested resolution

**Option A** — accept the Leader's filenames as **companion infra-operation specs** that supplement the master Part docs. This is what I did. Downside: file-name collision when an agent searches for "Part 21" and finds both "API & Service Layer" and "Operations Runbook".

**Option B** — rename the Leader-assigned files to make the infra-perspective explicit, e.g.:

- `PART_021_INFRA_OPERATIONS_RUNBOOK.md` → `INFRA_OPS_RUNBOOK.md`
- `PART_022_INFRA_OBSERVABILITY_SLO.md` → `INFRA_OBSERVABILITY_SLO.md`
- ...etc.
  And let the master Part numbers (21-24, 84-86) be authored by the Muses who own those domains (Athena, Hephaestus, Hera, Apollo, etc.).

**Option C** — relabel the master Part numbers to match the Leader's infra titles, and move the original master Part content to other available numbers. This is invasive and likely not what the Lead intends.

**Recommendation:** Option B. The infra-runbook, observability-SLO, DR, deployment-topology, build-pipeline-detail, release-management, and environment-strategy documents are genuinely useful and infra-domain; they just shouldn't masquerade as the master Part 21/22/23/24/84/85/86 because those Part numbers are already taken by other domains.

## Three-witness verification

| Claim                                 | Witness 1             | Witness 2                                        | Witness 3   |
| ------------------------------------- | --------------------- | ------------------------------------------------ | ----------- |
| Master Part 21 = API & Service Layer  | `parts2.txt` line 64  | grep regex `Part (21\|22\|23\|24\|84\|85\|86)\b` | manual read |
| Master Part 84 = Routing Architecture | `parts2.txt` line 253 | grep regex                                       | manual read |
| Master Part 86 = Formula Parser       | `parts2.txt` line 259 | grep regex                                       | manual read |

## Status: FILED — awaiting Lead decision on Option A vs B vs C
