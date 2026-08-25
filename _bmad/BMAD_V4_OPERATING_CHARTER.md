# BMAD v4.0 Operating Charter — FinPlan Pro

> **Effective:** 2026-08-10 · **Status:** SUPERSEDED 2026-08-10 by `_bmad/BMAD_V5_OPERATING_CHARTER.md` (ULTRA-YOLO edition). Kept as the historical record of v4.0 semantics.
> **Mode:** Research-first, artifact-driven, continuous execution inside the owner-approved path.

## Purpose

This file is the durable operational interpretation of the owner-provided BMAD v4.0 method for this repository. It prevents drift between conversations and ensures product/code decisions remain traceable.

## Phase state

| Phase            | Required artifacts                                                                                    | Current status                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0 — Intelligence | `_bmad/research/research-report.md`, `_bmad/research/assumption-registry.md`, relevant Blaze sessions | Gate G0 approved hypothesis baseline; primary validation remains open          |
| 1 — Discovery    | research validation plan, evidence log, research-informed product brief                               | Gate G1 approved hypothesis brief; no primary participant evidence entered yet |
| 2 — Planning     | research-traceable PRD and UX specification                                                           | Gates G2/G3 approved hypothesis artifacts; assumptions remain open             |
| 3 — Solutioning  | research-traceable architecture and ADRs                                                              | Gate G4 approved hypothesis architecture; primary validation remains open      |
| 4 — Delivery     | aligned sprint plan, self-contained research-contextual stories, QA evidence                          | Gate G5 approved hypothesis plan; R-01 evidence-track recruitment is active    |

## Execution semantics

- **YOLO mode:** the owner authorizes continuous work without conversational waiting. It does not waive the BMAD phase order, research traceability, assumption tagging, test evidence, QA, documentation, or zero-compromise quality requirements.
- **Research gate semantics:** desk research may establish a hypothesis; primary evidence is required to validate buyer behavior, willingness to pay, deployment preference, workflow value, connector demand, and ICP claims.
- **No orphaned decisions:** all significant decisions must appear in `_bmad/research/research-to-requirements-traceability.md`.
- **No silent state change:** changed direction, scope, architecture, or artifact status is logged in `project-context.md` and, where applicable, the assumption registry/path lock.
- **Safe foundations:** accessibility, truth labeling, source/test inventory, precision, explicit error state, and reusable Atlas primitives may progress only where they do not pre-decide unvalidated market/user/architecture choices.

## Canonical artifact map

- Research: `_bmad/research/`
- Ideation: `_bmad/brainstorm/`
- Discovery brief: `_bmad/product-brief.md`
- Requirements / UX / architecture: `_bmad/prd.md`, `_bmad/ux-design.md`, `_bmad/architecture.md`
- Delivery plan / stories: `_bmad/sprint-plan.md`, `_bmad/stories/`
- Living state: `_bmad/project-context.md`
- Path protection: `_bmad/path-lock.md`
- Codebase maturity truth: `docs/CAPABILITY_TRUTH_MATRIX.md`

## Current authoritative next action

Run primary validation according to `_bmad/research/validation-plan.md`, capture sessions using `_bmad/research/research-session-notes-template.md`, and record evidence in `_bmad/research/evidence-log.md`. Then synthesize findings and revise downstream artifacts only where evidence warrants it.
