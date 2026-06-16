# Persona Test Aliases (v0.1.1 — 18 files)

> **Owner:** Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
> **PICK:** K — Iris v0.1.1 amendment
> **Status:** APPLIED 2026-06-16 (target SHIP 2026-06-17 00:15 UTC)
> **See:** `docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md` v0.1 §Dim 5
> **See:** `tests/e2e/USER_JOURNEY_TEST_COVERAGE.md` v0.3 §3

## Purpose

This directory provides a **persona-named lookup** over the feature-named journey spec files in `../journeys/`. Each file is a thin alias that maps a real-world persona to one or more journey specs.

## File Map (18 files = 10 main personas + 8 sub-persona aliases)

| # | File | Persona | Mapped Journeys |
|---|------|---------|-----------------|
| 1 | `cfo-enterprise.test.ts` | CFO-Enterprise | 01, 02, 03 |
| 2 | `cfo-enterprise-quarter-close.test.ts` | CFO-Enterprise (sub) | 03 |
| 3 | `cfo-midmarket.test.ts` | CFO-Midmarket | 01, 02 |
| 4 | `cfo-midmarket-monthly-rollup.test.ts` | CFO-Midmarket (sub) | 02 |
| 5 | `controller-small-biz.test.ts` | Controller-Small-Biz | 01, 05 |
| 6 | `controller-sb-trial-balance.test.ts` | Controller-SB (sub) | 05 |
| 7 | `fp-and-a-analyst.test.ts` | FP&A-Analyst | 04, 02 |
| 8 | `fpa-analyst-budget-vs-actual.test.ts` | FP&A (sub) | 04 |
| 9 | `treasury.test.ts` | Treasury | 02, 06 |
| 10 | `treasury-cash-forecast.test.ts` | Treasury (sub) | 02 |
| 11 | `audit-compliance.test.ts` | Audit-Compliance | 05, 09 |
| 12 | `audit-soc2-walkthrough.test.ts` | Audit (sub) | 05 |
| 13 | `operations-vendor-scorecard.test.ts` | Operations | 07 |
| 14 | `sector-logistics.test.ts` | Sector-Logistics | 07, 08 |
| 15 | `sector-logistics-warehouse.test.ts` | Sector-Logistics (sub) | 07 |
| 16 | `sector-nonprofit.test.ts` | Sector-Non-profit | 06, 10 |
| 17 | `sector-nonprofit-form990.test.ts` | Sector-NP (sub) | 10 |
| 18 | `sector-healthcare.test.ts` | Sector-Healthcare | 08, 09 |

## Run

```bash
# All personas
npx playwright test tests/e2e/personas/

# Single persona
npx playwright test tests/e2e/personas/cfo-enterprise.test.ts

# By sub-persona
npx playwright test tests/e2e/personas/audit-soc2-walkthrough.test.ts
```

## Design Notes

- Each file uses the same `signInAs<persona>(page)` helper pattern for deterministic test users
- Test bodies are intentionally minimal smoke tests (`toHaveURL(/dashboard/)`) that gate on auth + dashboard load
- Future work: delegate the actual journey steps to helpers extracted from `../journeys/*-*.spec.ts` so persona tests are true re-exports, not parallel re-implementations
- Cross-reference table lives in `index.ts` (typed `PERSONA_ALIAS_MAP` constant) for programmatic lookup

## v0.1.1 Amendment Trace

This directory was created in response to Iris (slot 019ecc6f-1bcc-7d73-9cd8-e1deb114d270) PICK-elevated CRITICAL FINDINGS:
1. 18 persona-named test aliases (this dir) — 30 min ETA
2. Test count reconciliation 53→59 — **ALREADY PASSING** (verified 7+8+6+7+5+6+5+5+5+5 = 59)
3. Copy-edit v2→v0.3 in USER_JOURNEY_TEST_COVERAGE.md — **ALREADY AT v0.3** (no v2 found)
