---
name: rolling-forecast-implementation
description: >
  Use when implementing or changing rolling forecasts, drivers, or continuous planning; validate horizon, versioning, and actual-replacement semantics against current owner decisions.
group: finance
---

# Rolling forecast implementation

**Use when** working on `/forecasts`, `/forecasts/rolling`, `/forecasts/drivers`, rollingForecastModel, forecastStore, or any continuous planning surface.

## Method

1. **Driver-based framework**: choose assumptions appropriate to the planning question, document their source/owner and how they affect outputs. Do not prescribe a fixed driver count or imply operational-data integration that is not evidenced.
2. **Horizon**: follow the applicable owner decision and user-selected planning cadence. Do not present a universal 12–18 month horizon as a project requirement.
3. **Versioning and time fence**: preserve approved versions and explicit assumptions; any locked/directional horizon rules need a documented product/accounting decision.
4. **Review cadence**: define responsibilities and approvals for the customer workflow; do not impose a five-day cadence or arbitrary revision cap without owner evidence.
5. **Actuals and forecast versions**: follow DEC-096 and applicable approved semantics for replacement/blending, retain prior approved versions, and make the as-of period explicit.
6. **Pilot and rollout**: scope and acceptance require an agreed pilot plan; do not infer enterprise readiness from one test cycle.
7. **Integrations**: no automation or reduction claim without measured evidence and an approved connector scope. User-mapped CSV/XLSX is the broad baseline; optional APIs follow the same canonical contract.
8. **Evaluation**: establish owner-approved baselines and targets before measuring accuracy, cycle time, or adoption. Do not present generic targets as current product performance.
9. **Off-cycle updates**: define triggers with the owner and use case; do not hard-code generic revenue/EBITDA thresholds.
10. **Accuracy**: report only measured back-test or live results with scope, periods, data, and method. Industry claims are not project evidence.

## In this repo

- `/forecasts`: ForecastListPage, ForecastBuilderPage, RollingForecastPage, WhatIfPage.
- Models: rollingForecastModel.ts, forecastBuilderData.ts, cashForecastModel.ts.
- Stores: forecastStore (isLoading, error).
- Gates: determinism ratchet (same input same output), money adoption, financial oracles.

## Red flags

- Forecasting every GL line individually.
- No actuals integration.
- Forecast drift without governance.
- Excel-based implementation without automation.

**Evidence:** verify current rolling forecast semantics against DEC-096 and `docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`; tests demonstrate only their asserted cases.
**Source:** current owner decisions and master plan; external benchmarks, if used, must be sourced, qualified, and kept distinct from measured project outcomes.
