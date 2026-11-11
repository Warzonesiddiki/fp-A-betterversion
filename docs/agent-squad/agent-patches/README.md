# Agent Patches

> **Conditional historical guidance — not active by default.** Use this handoff
> folder only if a squad is explicitly activated for the current task. This file
> does not activate a squad, establish current tool permissions, or override
> root `AGENTS.md` and the active Arena branch instructions. The procedure below
> is retained as historical coordination guidance; verify current permissions
> and applicable instructions before relying on it.

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
