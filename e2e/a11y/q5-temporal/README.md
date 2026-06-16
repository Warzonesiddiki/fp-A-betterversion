# A11Y Q5 Temporal a11y — E2E Walkthroughs

**Source:** Chronos V3 e.ix.7 spec, extracted in `memory/chronos-q5-spec-v03.md`
**Status:** ⏳ SKELETON (A11Y-P1-6, P1-7, P1-8, P1-9, P1-10, P1-11; ETA 2-3h)

## Overview

5 E2E walkthroughs for Q5 Temporal a11y sub-criteria, per Chronos V3 e.ix.7 spec.

| # | Sub-Criterion | Threshold | V3 e.ix.7 Mapping | E2E File | Owner | ETA |
|---|---|---|---|---|---|---|
| Q5.1 | Keyboard navigation latency | ≤100ms | #13 | q5.1-keyboard-nav-latency.spec.ts | Hera+Performance (P1-11) | 2h |
| Q5.2 | Focus restore after modal/dialog close | <50ms | #15+#14 | q5.2-focus-restore.spec.ts | Hera T-HE-021 (P1-10) | 2h |
| Q5.3 | Time extension for session timeout | ≥20s warning + user-extendable + turn-off | #12+#11 | q5.3-session-timeout.spec.ts | Atlas+Security (P1-8) | 1h |
| Q5.4 | Sub-second announcement (assertive + polite) | <1s | #11+#14+#15 | q5.4-sub-second-announcement.spec.ts | Hera+Mnemosyne (P1-7) | 2h |
| Q5.5 | Animation duration + prefers-reduced-motion | ≤200ms + motion-reduce override | all | q5.5-animation-duration.spec.ts | Hera (P1-6) | 2-3h |

## Running Q5 E2E Walkthroughs

```bash
# Run all 5 Q5 E2E walkthroughs
npx playwright test e2e/a11y/q5-temporal/

# Run individual Q5 sub-criterion
npx playwright test e2e/a11y/q5-temporal/q5.1-keyboard-nav-latency.spec.ts

# Run with Q5 gate
npm run test:a11y:q5
```

## Q5 Score → Composite

```
Q5_score = sum of 5 sub-criteria scores (0-2 each, max 10)
Composite = 87.5%×6/7 + (Q5_score/10)×1/7
```

| Q5_score | Composite | Status |
|---|---|---|
| 5 (50%) | 82.14% | baseline w/ LiveRegion + Tailwind motion |
| 7 (70%) | 85.00% | + P1-6 + P1-7 + P1-8 partial |
| 10 (100%) | 89.29% | all sub-criteria FULL |
| 12+ | 92-95% target | requires Hera domain review + P0-4 CI gate closure |

## CI Gate

`scripts/a11y-q5-gate.js` runs all 5 Q5 sub-criteria and fails the build if any drops below 1/2.

Gate decision:
- score ≥ 8/10: PASS (composite ≥ ~89%)
- score 5-7/10: PARTIAL (composite ~85%, alert RATIFICATION GATE)
- score < 5/10: FAIL (block v1.0.0 ship readiness)

**Status:** ⏳ BLOCKED on Atlas A11Y-P0-4 (CI gate integration, in flight per 93545ae99 feature branch)

## Cross-witness

- @Hera (A11Y domain owner): all 5 sub-criteria + A11Y-P1-6, P1-7, P1-10, P1-11
- @Mnemosyne (test infrastructure): 5 vitest-axe rules + A11Y-P1-7
- @Atlas (Security + CI gate): A11Y-P0-4 + A11Y-P1-8
- @Beth (user-research): A11Y-P1-9 (vestibular disorder validation, cycle 8)
- @Hermes (Pages domain): cross-witness with PAGES_APP_SURFACE_MAPPING v0.1 (9 demo steps × 192 pages)
- @Iris (P7 cross-witness): Q5.4 + Q5.1 customer-impact dimensions

## Related

- A11Y_READINESS v0.3 (Q5 spec integration): `docs/ratification/RATIFICATION_GATE_PRECHECK_A11Y_v0.3.md` (commit f32403fd4)
- Chronos Q5 spec extraction: `memory/chronos-q5-spec-v03.md` (commit 3f8e607d4)
- A11Y_READINESS v0.2 (6-dim baseline): `docs/ratification/RATIFICATION_GATE_PRECHECK_A11Y.md` (commit 3b67051c7)
- Tyche 2nd-witness (87.5% baseline): `docs/ratification/RATIFICATION_GATE_PRECHECK_A11Y_2ND_WITNESS_TYCHE_ANALYTICS.md` (commit 04ed1465e)
- Hera T-HE-019 cross-witness: `.openhands/hera-eslint-jsx-a11y-cross-witness.md` (commit 0c5300ec)
- Prometheus A11Y-P0-2 (2.5.7 closure): `src/components/ui/DataGrid.tsx` (commit bb8c64fd)
- Apollo 2nd-Muse witness (TENTATIVE 3.5/4): INDEX v0.7 / MASTER_REPORT v1.2

## T-3d Hard Intermediate Deadline

2026-06-19 EOD — full Q5 implementation + CI gate closure + 5 test files + 5 vitest-axe rules + 5 E2E walkthroughs.
