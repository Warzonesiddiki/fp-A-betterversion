---
name: driver-based-scenario-modeling
description: >
  Use when building or changing scenario modeling, driver planning, or what-if analysis: 5-7 key drivers, base/upside/downside, owner-assigned assumptions.
group: finance
---

# Driver-based scenario modeling

**Use when** working on `/scenarios`, `/forecasts/drivers`, `/forecasts/what-if`, driverStore, scenarioStore, or any what-if surface.
**Skip when** change is display-only, not driver logic.

## Method

1. **5-7 key drivers**: McKinsey research: 80% of variance explained by <15 drivers. Start with 10-15 core, expand deliberately. Too many drivers = unwieldy model.
2. **Three types**: operational (sales volume, headcount), financial (price per unit, margin), external (FX, market growth, raw material). Who controls each matters.
3. **Modular separation**: inputs (drivers) separate from calculations and outputs (financial statements). Different BUs own driver sets without breaking whole system.
4. **Three cases minimum**: base (honest expectation), upside (ramp faster), downside (half speed, payment stretch). Keep internally consistent: downside with lower revenue but unchanged hiring is not a plan.
5. **What-if + stress**: driver-based modeling makes what-if easy: change driver, model recalculates. Stress test: severe adverse (price shock, supply failure).
6. **Owner-assigned assumptions**: each driver has owner, source, transformation logic, last change, approved range. Document why, not just number: "7% growth based on 3yr avg 6.5-7.5% adjusted for confirmed pipeline" beats "7%".
7. **Governance**: model factsheet listing sources, logic, owner, test results, ranges. Require approval for changing range or publishing scenario. Lock board versions.
8. **Back-test**: load trailing 8-12 quarters historical drivers, run calcs, compare to actuals. Expect 10-25% initial error, iterate until single digits for key lines.
9. **Scenario capability core**: design for scenario from start, not as afterthought. Driver changes flow automatically to financial statements.

## In this repo

- `/scenarios` route: ScenarioListPage, ScenarioBuilderPage, ScenarioComparisonPage, scenarioStore (isLoading, error already).
- `/forecasts/drivers`: DriverPlanningPage, driverStore.
- `/forecasts/what-if`: WhatIfPage, WhatIfSandboxEngine.
- Stores: scenarioStore, driverStore, forecastStore — actions, not setters, one writer per fact.
- Gates: `financial:oracles` for accounting output, `money:ast` for safe money handling.
- Evidence: journey/empty/error/loading tests per route for CONNECTED grade.

## Red flags

- Hardcoded totals instead of driver-derived.
- 50 drivers on day one.
- Driver without owner.
- Downside case with same hiring as base.

**Proves itself with:** scenario tests with oracle values, driver ownership documented, 4-state route tests.
**Source:** adapted from pigment.com driver-based planning, farseer.com rolling forecast driver framework, getaleph.com scenario planning (MIT, rewritten).
