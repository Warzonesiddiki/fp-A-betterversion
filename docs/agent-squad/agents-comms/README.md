# FinPlan Pro — Squad Communication Channel

> **This folder is the squad's message bus.** There is no chat server: every member session
> has a checkout of this repo, so the repository *is* the channel. Read it at the start of
> every session; write to it after every meaningful step.
>
> New members: read [`../AGENT_JOIN_GUIDE.md`](../AGENT_JOIN_GUIDE.md) first, then claim a seat
> here. The rules that override anything in this folder: `AGENTS.md` and `docs/agent/`.

## The files

| File | What it is | Who writes |
| ---- | ---------- | ---------- |
| [`LATEST.md`](LATEST.md) | Lead's latest-changes pointer — **read this first on a short poll**. | Lead |
| [`ROSTER.md`](ROSTER.md) | Seat registry. | You, once, on join |
| [`STATUS_BOARD.md`](STATUS_BOARD.md) | What every seat is doing right now. | Each member edits their own row only |
| [`COMMS_LOG.md`](COMMS_LOG.md) | Append-only chronological messages, newest at the bottom. | Everyone |
| [`BLOCKERS.md`](BLOCKERS.md) | Open blockers and the decision each needs. | Whoever is blocked |
| [`CLAIMS.md`](CLAIMS.md) | File/directory claims — one writer per file. | Whoever starts touching files |
| [`TEMPLATES.md`](TEMPLATES.md) | Copy-paste blocks for every note type. | Read-only |
| [`START_PROMPTS.md`](START_PROMPTS.md) | Canonical start prompts for new members. | Lead |

## Hard rules

1. **Append-only.** Never edit or delete another member's entry. A correction is a new entry
   that references the old one. The only exceptions are defined status fields: your own
   `STATUS_BOARD.md` row, your own `BLOCKERS.md` row, and your own `CLAIMS.md` row.
2. **One message = one entry** in `COMMS_LOG.md`, newest at the bottom, signed with your seat ID.
3. **Mention targets.** Start every entry with `TO: @ALL`, `TO: @LEAD`, or `TO: <seat>` (for
   example `@G-04`). Members grep for their seat at session start.
4. **Claim before you edit.** Check `CLAIMS.md`, add a claim for the smallest path scope
   (a file beats a directory), release it when your change lands. Readers never need a claim.
5. **One writer per file.** If another seat holds a claim, message them and wait — do not
   edit anyway.
6. **Blockers are loud.** Raise a row in `BLOCKERS.md` AND a `COMMS_LOG.md` entry mentioning
   `@LEAD`. If the answer is an owner decision, name the DEC id from
   `docs/discovery/decision-log.md` — never invent one.
7. **Evidence, or it is not a claim.** Every `DONE` note names the command that produced the
   result and the commit. "Tests pass" is not evidence; `npx vitest run <file>` with its tally is.
8. **No secrets, no real financial data.** Synthetic fixtures only, in any message.
9. **Keep it short.** A note is a paragraph, not a report. Long-form belongs in the commit
   message and the docs.
10. **Times in UTC**, format `YYYY-MM-DD HH:MM UTC` (`date -u`).
11. **No idle seats.** `IDLE` is transient: a seat with no unit takes the next item from
    `../SQUAD_BACKLOG.md` and posts a `PICK` note in the same cycle. A unit counts as work only
    when it ends in a commit with evidence, a `BLOCK` entry with a reproduction, or a `DONE`
    note explaining why it closed without code.

## Session checklist

**Start — read, in order:**

0. `LATEST.md` — on any short poll, this file alone usually tells you what changed
1. `../AGENT_JOIN_GUIDE.md` (once, fully)
2. `ROSTER.md` — claim your seat if you have not yet
3. `STATUS_BOARD.md` — who is doing what, and what is already claimed
4. Last ~20 entries of `COMMS_LOG.md`
5. `grep "@<your-seat>" COMMS_LOG.md` — anything addressed to you
6. `BLOCKERS.md`
7. `CLAIMS.md` for the files you plan to touch
8. `../SQUAD_BACKLOG.md` — pick the highest item you can finish with evidence

**End — write, in order:**

1. `STATUS_BOARD.md` row updated to `DONE` / `IDLE` / `BLOCKED`
2. `COMMS_LOG.md` `DONE` (or `BLOCK` / `HANDOFF`) note with evidence
3. Your claims released in `CLAIMS.md`
4. `../SQUAD_STATE.md` updated if shared state changed
5. `../SQUAD_BACKLOG.md` touched only if the priority order actually changed, with a one-line reason

## Escalation ladder

Peer mention → `@LEAD` → `BLOCKERS.md` (owner decision, named by DEC id) → stop that item and
pick the next finishable one. Never guess an owner decision, and never weaken a gate to get
unblocked.
