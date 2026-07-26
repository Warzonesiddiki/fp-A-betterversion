# S55 — Research

**Date:** 2026-07-25

## 1. Questions
- Prob-weighted status?

## 2. Findings
- Tasklist 2.2.2 probability-weighted scenario output.
- S50 has probability; S53 has MC.

## 3. Decision
- Compute expected = Σ(p×result); present with MC percentiles.

## 4. Risks
- Probabilities not summing to 1 → normalize + warn (S50).

## 5. Dependencies
- S50, S53.
