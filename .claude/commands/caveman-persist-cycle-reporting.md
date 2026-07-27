---
name: caveman-persist-cycle-reporting
description: Workflow command scaffold for caveman-persist-cycle-reporting in fp-A-betterversion.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /caveman-persist-cycle-reporting

Use this workflow when working on **caveman-persist-cycle-reporting** in `fp-A-betterversion`.

## Goal

Documents and archives project progress, compliance, and technical decisions for each development cycle or turn, with highly structured markdown files.

## Common Files

- `docs/CAVEMAN_PERSIST/CYCLE_*_*.md`
- `docs/CAVEMAN_PERSIST/*_TURN_*_*.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Draft new cycle/turn summary or compliance report as a markdown file.
- Save the file under docs/CAVEMAN_PERSIST/ with a filename pattern indicating cycle/turn and topic.
- Commit the new report(s) together, often in batches.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.