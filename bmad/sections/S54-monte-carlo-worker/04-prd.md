# S54 — PRD

**Date:** 2026-07-25

## 1. Overview
Monte Carlo Web Worker.

## 2. FRs
- FR-1: Worker runs S53 `monteCarlo`.
- FR-2: Post progress (iteration %) + final samples.
- FR-3: Cancel message support.

## 3. Acceptance
- Worker computes; UI shows progress; cancel works.

## 4. Out of Scope
- Engine (→ S53).

## 5. Dependencies
- S53, S91.
