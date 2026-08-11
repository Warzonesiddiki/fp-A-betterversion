# BMAD v5.0 Operating Charter — FinPlan Pro (ULTRA-YOLO EDITION)

> **Effective:** 2026-08-10 (upgraded from v4.0 at owner direction)
> **Mode:** ULTRA-YOLO · ZERO COMPROMISE · MAXIMUM AUTONOMY, with **mandatory Deep Reasoning Protocol (DRP)** at every step.
> **Supersedes:** `_bmad/BMAD_V4_OPERATING_CHARTER.md` (kept as historical record).  
> **Elevated by:** `_bmad/BMAD_V5_REASONING_QUALITY_ADDON.md` (Reasoning & Quality Addon — Proof of Thought, Reasoning Depth Score, quality gates, steelman audit, pre-mortem loop). The addon applies to every agent, artifact, and action.

## Purpose

This file is the durable operational interpretation of the owner-provided **BMAD v5.0 ULTIMATE** method for this repository. It upgrades v4.0 semantics — research-first ordering, artifact-driven state, zero-compromise quality — with v5.0's self-governed execution engine: the **Deep Reasoning Protocol**, the **Reasoning Ledger**, and the **Autonomy Level Matrix**.

**The v5 equation:** `AUTONOMY = REASONING QUALITY × EVIDENCE × CONFIDENCE`.
Speed without thought is waste; thought without action is paralysis. This repo runs both.

## The Deep Reasoning Protocol (DRP)

Every action passes through DRP before execution:

- **DRP-FULL** (mandatory for any decision with downstream impact): First Principles Decomposition → Evidence Sovereignty (≥2:1 evidence-to-assumption ratio; assumptions tagged) → Option Space Exploration (≥3 distinct alternatives, steelmanned; discarded options logged) → Risk Probe (pre-mortem) → Consequence Projection → Confidence Certification (0–100%) → Execution Clearance.
- **DRP-MINI** (low-stakes, reversible, pattern-consistent micro-decisions): reversible? consistent? confident ≥85%? → proceed; any NO → DRP-FULL or escalate.

**Execution clearance:** confidence ≥85% → full autonomy; 60–84% → autonomy with caveat (document + async notify); <60% or reasoning gap → **escalate, do not act**.

## Autonomy levels

| Level | Meaning | When |
|---|---|---|
| A5 FULL YOLO | Execute autonomously, document reasoning | Confidence ≥85% (any criticality) |
| A4 STEALTH | Execute + parallel self-verification | Confidence ≥85% high-criticality, or 60–84% low |
| A3 CONSULT | Share DRP summary, proceed unless objection | 60–84% medium |
| A2 PAUSE | Present reasoning + options, wait | 60–84% high |
| A1 CRITICAL STOP | Stop all work, escalate | Confidence <60%, or security/irreversibility |

**Repo-specific escalation triggers (mapped to reality):**

| Situation | Level | Action |
|---|---|---|
| CI/workflow changes that cannot be pushed (missing `workflows` permission) | A2/A3 | Preserve changes in worktree, document caveat, flag owner — never silently drop |
| GitHub Actions billing block (E-005) | A3 | Continue local verification; never treat red CI as code evidence |
| R-01 participants unavailable | A2 (external) | Do not fabricate evidence; continue only safe foundations |
| F-02 browser pixel baseline unavailable | A2 (external) | Keep strengthening interim structural evidence; never claim pixels verified |
| Sandbox recycle (git refs reset to shallow clone) | A5 | Reconcile via verified fast-forward + index refresh; never reset/restore/clean |
| Critical security issue in review | A1 | Block merge, escalate with impact assessment |
| Story ambiguity during implementation | A1 | Stop, document exact ambiguity, never guess |

## Phase state (unchanged gates — hypothesis-approved, primary validation open)

| Phase | Required artifacts | Current status |
|---|---|---|
| 0 — Intelligence | `_bmad/research/research-report.md`, `_bmad/research/assumption-registry.md`, Blaze sessions | Gate G0 approved hypothesis baseline; primary validation open |
| 1 — Discovery | validation plan, evidence log, product brief | Gate G1 approved hypothesis brief; no primary participant evidence |
| 2 — Planning | research-traceable PRD and UX specification | Gates G2/G3 approved hypothesis artifacts |
| 3 — Solutioning | research-traceable architecture and ADRs | Gate G4 approved hypothesis architecture |
| 4 — Delivery | sprint plan, self-contained stories, QA evidence | Gate G5 approved; F-01/F-03/F-04 DONE/QA-APPROVED; R-01 active; F-02 in progress |

## Execution semantics

- **ULTRA-YOLO:** continuous autonomous execution inside the locked path. It does NOT waive research ordering, assumption tracking, primary-evidence requirements, tests, QA, accessibility, security, documentation, or zero-compromise quality.
- **Research gate semantics:** desk research establishes hypotheses; primary evidence validates buyer behavior, WTP, deployment preference, workflow value, connector demand, ICP claims.
- **No orphaned decisions:** every significant decision appears in `_bmad/reasoning-ledger.md` AND `_bmad/research/research-to-requirements-traceability.md` (where product-relevant).
- **No silent state change:** direction/scope/architecture/status changes are logged in `_bmad/project-context.md`.
- **Evidence sovereignty:** never fabricate customer, user, IT/security, WTP, connector-demand, or pilot-acceptance evidence (R-01 rule).
- **Safe foundations:** accessibility, truth labeling, source/test inventory, precision, error states, and Atlas primitives may progress only where they do not pre-decide unvalidated market/user/architecture choices.

## Canonical artifact map

- Reasoning ledger (v5): `_bmad/reasoning-ledger.md`
- Research: `_bmad/research/` · Ideation: `_bmad/brainstorm/` · Brief: `_bmad/product-brief.md`
- PRD / UX / architecture: `_bmad/prd.md`, `_bmad/ux-design.md`, `_bmad/architecture.md`
- Delivery: `_bmad/sprint-plan.md`, `_bmad/stories/` · Living state: `_bmad/project-context.md`
- Path protection: `_bmad/path-lock.md` · Maturity truth: `docs/CAPABILITY_TRUTH_MATRIX.md`

## Current authoritative next action

1. **Safe foundations (authorized now):** continue F-02 interim evidence and any self-contained safe story that does not pre-decide ICP/connector/vertical/deployment.
2. **R-01 → R-04 (externally blocked):** execute when anonymized participant material/access is provided.
3. **F-02 pixels (externally blocked):** execute `docs/design/VISUAL_REGRESSION_RUNBOOK.md` when a browser-capable environment is available.
4. **CI (externally blocked):** owner resolves the GitHub billing block (E-005) and grants `workflows` permission to land the SHA-pinning/sharding/a11y-gate changes preserved in the working tree.
5. Every action logs to `_bmad/reasoning-ledger.md` when it is a meaningful decision.
