---
name: requesting-review
description: >
  Use before asking for a review or opening a PR: make the change reviewable —
  small, self-explaining, with the evidence a reviewer would otherwise chase.
group: discipline
---

# Requesting review

**Use when** a change is about to be reviewed, merged or handed over.
**Skip when** nothing is shared yet.

## Method

1. One change, one purpose. If the description needs "and", split it.
2. Write the review request in this order: what breaks today, what changes, how
   you know it works, what you did **not** touch or check.
3. Pre-empt the questions: link the failing-first test, paste the gate output,
   name the trade-off you chose.
4. State the risk plainly. A reviewer who finds the risk you hid stops trusting
   the rest.
5. Keep mechanical churn (formatting, renames) out of a behavioural change.

## In this repo

- PR bodies carry measured numbers with their command and date, never a summary
  someone has to re-derive.
- `gh pr edit` silently fails here; update the body with
  `gh api -X PATCH repos/Warzonesiddiki/fp-A-betterversion/pulls/<n> -F body=@file`.
- The handover entry is the review artefact for the next session
  (`docs/HANDOVER_NEXT_SESSION.md`).

## Red flags

- "Minor changes" as a description.
- A PR that mixes a gate change with the work that needed the gate changed.
- Evidence pasted from before the last commit.

**Proves itself with:** a reviewer who can reproduce your evidence without asking.
**Source:** adapted from obra/superpowers `requesting-code-review` (MIT).
