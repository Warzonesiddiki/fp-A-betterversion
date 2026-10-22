---
name: writing-plans
description: >
  Use when a task spans more than one sitting or more than one PR: write the plan
  as ordered steps with a testable exit gate per step.
group: discipline
---

# Writing plans

**Use when** the work cannot be finished and verified in one reply.
**Skip when** the change is one file and one test.

## Method

1. State the outcome as something measurable, not a mood. "47 REVIEW routes have
   a disposition" beats "clean up the matrix".
2. Break it into steps that each end in a **gate you can run**. A step without a
   command is a wish.
3. Order by dependency, and say what can run in parallel. Never put a decision
   behind work that the decision would invalidate.
4. For each step, name the evidence that will be quoted at the end: file, command,
   number.
5. Write the failure modes: what would make this plan silently wrong, and what
   catches it.

## In this repo

- The live programme is `docs/plan/COMPLETION_PLAN_86_100.md`; append to the
  existing shape instead of starting a competing plan.
- Steps map to PRs. One PR = one gate-able outcome.
- Recorded numbers need their command and date; a plan is not a measurement.

## Red flags

- A step called "refactor" (what changes, and which gate proves it?).
- Ordering by convenience rather than by what unblocks evidence.
- A plan longer than the work it describes.

**Proves itself with:** each step's command exists and has been run at least once.
**Source:** adapted from obra/superpowers `writing-plans` (MIT), rewritten.
