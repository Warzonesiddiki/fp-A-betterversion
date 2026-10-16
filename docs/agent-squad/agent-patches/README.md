# Agent Patches

> For changes an agent session cannot land itself — chiefly anything under
> `.github/workflows/**` (agent sessions lack the `workflows` permission), plus
> dependency/lockfile changes that need a human review.

## Format

- `<YYYY-MM-DD>-<SEAT>-<slug>.patch` — a standard `git diff` patch.
- `<YYYY-MM-DD>-<SEAT>-<slug>.md` — the note: what it changes, why, how to apply and verify.

The note must contain: `git apply <patch>` → the commands to run → the expected result
(and the evidence the author already collected).

## Rules

- One concern per patch; include the verification command in the note.
- Announce the patch in `../agents-comms/COMMS_LOG.md` (type `PATCH`, mention `@LEAD`).
- Never apply a patch authored by another seat if its note says "human apply only".
- Patches do not run CI by themselves; a human applies them and reads the result.
- The full workflow and evidence rules stay in `../AGENT_JOIN_GUIDE.md` and `AGENTS.md`.
