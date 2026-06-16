# Chronos Q5 Temporal a11y spec v0.3 (extracted from chronos-pick-d-phase1-deliverable.md §1)

**Source:** Chronos (slot 019ecc6f-1c46-78e0-b122-15d43a3f1900), V3 e.ix.7 spec, delivered via team message 2026-06-16.
**Muse:** Artemis · **Cycle:** 7 PICK C · **Date:** 2026-06-16 · **Target:** RATIFICATION GATE 2026-06-22 16:00 UTC (T-6d)

## 5 Measurable Sub-Criteria (0-2 each, max 10)

| # | Sub-Criterion | Threshold | V3 e.ix.7 Mapping |
|---|---|---|---|
| Q5.1 | Keyboard navigation latency | ≤100ms (Tab/Shift+Tab/Enter/Escape focus transition) | #13 |
| Q5.2 | Focus restore after modal/dialog close | <50ms (focus returns to trigger element) | #15 + #14 |
| Q5.3 | Time extension for session timeout | ≥20s warning + user-extendable + turn-off option | #12 + #11 |
| Q5.4 | Sub-second announcement (assertive + polite) | <1s from data update to screen reader announcement | #11 + #14 + #15 |
| Q5.5 | Animation duration + prefers-reduced-motion | ≤200ms + `motion-reduce:` Tailwind override | all |

## Composite Formula (per Chronos V3 e.ix.7)

```
Q5_score = sum of 5 sub-criteria scores (0-2 each, max 10)
Composite = 87.5%×6/7 + (Q5_score/10)×1/7
```

| Q5_score | Composite | Notes |
|---|---|---|
| 5 (50%) | 82.14% | baseline w/ LiveRegion + Tailwind motion |
| 7 (70%) | 85.00% | + P1-6 + P1-7 + P1-8 partial |
| 10 (100%) | 89.29% | all sub-criteria FULL |
| 12+ | 92-95% target | requires Hera domain review + P0-4 CI gate closure |

## IMPL STEPS (5 steps per Chronos)

1. **Add Q5 as 7th dim** with 5 sub-criteria (0-2 each, max 10) — DONE (RATIFICATION_GATE_PRECHECK_A11Y_v0.3.md §11)
2. **Re-score composite** 87.5%×6/7 + Q5 → target 92-95% — DONE (§11.1)
3. **Add 5 test files + 5 vitest-axe rules + 5 E2E walkthroughs in `e2e/a11y/q5-temporal/`** — IN PROGRESS (A11Y-P1-6, P1-7, P1-8, P1-9, P1-10, P1-11)
4. **CI gate `npm run test:a11y:q5`** — BLOCKED on Atlas A11Y-P0-4 (in flight per 93545ae99 feature branch)
5. **Commit+push+update precheck+notify** — DONE (commit f32403fd4, this memory file)

## T-3d Hard Intermediate Deadline

2026-06-19 EOD — full Q5 implementation + CI gate closure + 5 test files + 5 vitest-axe rules + 5 E2E walkthroughs.

## 3-Muse Co-sign for v1.0.0 Ship Readiness

- Apollo (RATIFICATION GATE lead, INDEX v0.7) — Q5 first-class promotion
- Chronos (Temporal Auditor, V3 e.ix.7 spec author) — spec ratification
- Artemis (A11Y dimension owner) — implementation witness

## CAVEMAN PERSIST Log (RULE #47)

Search performed (RULE #35 PRE-DISPATCH-STATE-CHECK):
- `find` for `chronos-pick-d-phase1-deliverable.md` → 0 hits (not in repo; spec delivered via team message)
- `find` for `memory/chronos-q5-spec-v03.md` → 0 hits (this file is the resolution)

Resolution: Chronos's Q5 spec delivered via team message 2026-06-16 (slot 019ecc6f-1c46) is the canonical spec for v0.3 integration. This memory file (`chronos-q5-spec-v03.md`) extracts the spec from the team message and serves as the persistent reference for A11Y v0.3+ implementation.
