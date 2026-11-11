---
name: executing-plans
description: >
  Use when working through an existing plan: one step at a time, gate before
  moving on, and update the plan when reality disagrees with it.
group: discipline
---

# Executing plans

**Use when** a written plan exists and you are implementing it.
**Skip when** you are still deciding what to do — use `brainstorming`.

## Method

1. Read the whole plan before starting. The order is the point.
2. Take **one** step. Run its gate. Read the full output before believing it.
3. If the gate fails for a reason the plan did not anticipate, stop and fix the
   plan, then continue. Do not silently reorder.
4. When a step is bigger than expected, split it and say so; do not stretch its
   definition to fit what you built.
5. At the end of each step, record what is now true that was not before: a number,
   a status, a removed gap.

## In this repo

- Current gates are indexed in `docs/agent/05_COMMANDS_AND_GATES.md`; run the
  narrow gate during a step and the required final set before declaring a branch
  complete. Check the mission contract for phase-specific authorization.
- Update the authoritative active plan and current progress record (for this
  docs-first review: `docs/_agent/PROGRESS_LOG.md` and `docs/_agent/STATE.json`).
  Update a taskboard or handover only when the active workflow requires it; do not
  let historical coordination files override the master plan or mission gate.
- Never edit a plan's exit gate to match what you achieved (that is a reversed
  ratchet; see `gates-and-ratchets`).

## Red flags

- Green steps that produced no diff.
- "Done" without the command output in view.
- Three steps in flight, none finished.

**Proves itself with:** the gate output for each completed step.
**Source:** adapted from obra/superpowers `executing-plans` (MIT), rewritten.
