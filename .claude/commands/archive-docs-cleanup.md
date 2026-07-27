---
name: archive-docs-cleanup
description: Workflow command scaffold for archive-docs-cleanup in fp-A-betterversion.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /archive-docs-cleanup

Use this workflow when working on **archive-docs-cleanup** in `fp-A-betterversion`.

## Goal

Moves, deletes, or archives old documentation and technical decision records to maintain a clean, current documentation set.

## Common Files

- `docs/_archive/**/*`
- `docs/_archive/muse-scratch/**/*`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify outdated or superseded documentation in docs/_archive/ or related folders.
- Delete or move files as needed.
- Commit the changes, often as part of a larger audit or cleanup.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.