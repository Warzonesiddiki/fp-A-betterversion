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

- The gates are listed in `docs/agent/05_COMMANDS_AND_GATES.md`; run the narrow gate
  during the step and the full set before the branch finishes.
- Update `docs/TASKBOARD.md` and the handover in the same session; a plan that
  drifts from the tree is worse than no plan.
- Never edit a plan's exit gate to match what you achieved (that is a reversed
  ratchet; see `gates-and-ratchets`).

## Red flags

- Green steps that produced no diff.
- "Done" without the command output in view.
- Three steps in flight, none finished.

**Proves itself with:** the gate output for each completed step.
**Source:** adapted from obra/superpowers `executing-plans` (MIT), rewritten.
