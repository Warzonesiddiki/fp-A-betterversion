# S55 — PRD

**Date:** 2026-07-25

## 1. Overview
Probability-weighted scenario output.

## 2. FRs
- FR-1: `expectedOutcome(scenarios)` = Σ(p_i × result_i).
- FR-2: Blend with S53 MC percentiles (p5/p50/p95).
- FR-3: Normalize probabilities (warn if ≠1).

## 3. Acceptance
- Weighted expected matches manual calc; percentiles shown.

## 4. Out of Scope
- UI (→ S52).

## 5. Dependencies
- S50, S53.
