---
name: one-stop-completion
description: >
  Use when claiming a workflow is supported, or when a user must complete
  FP&A work without leaving the app. Enforces the one-stop acceptance criterion:
  a supported workflow is completable in-app, with no mandatory external step.
group: finance
---

# One-stop completion

**Use when:** claiming a workflow is supported, promoting a route to SUPPORTED,
or auditing whether a user can finish FP&A work without another app.

## Why this exists

The vision's one-stop acceptance is a **requirement, not a claim**: a user must
be able to complete supported FP&A work without another app or tool. A connected
source may supply data and exports may be offered for interoperability, but a
separate application must not be a mandatory step. Two conflicts are recorded
rather than smoothed over (DEC-058, PR #90).

## Method

1. **Walk the workflow in-app.** For the supported workflow, list every step and
   confirm each has a UI surface inside the app. A step done by hand, by email,
   or in a spreadsheet is not in-app.
2. **Name the hand-offs.** For every step that leaves the app, say exactly what
   it is and whether it is mandatory. Two known conflicts:
   - the manual D365 export / file-intake path (data enters the app by file).
   - the DEC-018 Excel correction hand-off (corrections leave the app until the
     in-app correction path is proven sufficient).
3. **Do not claim one-stop while a mandatory hand-off exists.** If a workflow
   requires an external tool at a mandatory step, the workflow is **not**
   one-stop-complete. Report it as blocked on the hand-off, not as supported.
4. **Census.** For each supported route, record in the one-stop census whether
   its workflow is completable in-app. The census is data a script re-derives,
   not prose.
5. **Tie the census to the gate.** `npm run docs:verify` checks the census;
   `docs/plan/completion-register.json` carries the one-stop column. A route
   promoted to SUPPORTED with a `false` one-stop value is a defect.
6. **Missing is not zero.** A workflow with no census entry is **not** confirmed
   one-stop — it is unverified.

## In this repo

- The requirement: [`docs/VISION.md`](../../VISION.md) §1 ("One-stop acceptance").
- The recorded conflicts: DEC-058, PR #90; decision log
  [`docs/discovery/decision-log.md`](../../discovery/decision-log.md).
- The census: `docs/plan/completion-register.json` (one-stop column);
  [`docs/plan/COMPLETION_REGISTER.md`](../../plan/COMPLETION_REGISTER.md).
- The gate: `npm run docs:verify` (one-stop census check).
- Route status: [`docs/product/ROUTE_MAP.md`](../../product/ROUTE_MAP.md).

## Red flags

- "Supported" claimed for a workflow with a mandatory external step.
- A census row left blank instead of `true` / `false` / `unverified`.
- The D365 export hand-off or the Excel correction hand-off treated as
  completed rather than as a recorded conflict.
- Promoting a route to SUPPORTED without the one-stop value.

**Proves itself with:** a census row per supported route with an honest
one-stop value, re-derived by `npm run docs:verify`.

**Source:** original to FinPlan Pro, from the vision's one-stop acceptance
criterion and DEC-058.
