---
name: rolling-forecast-implementation
description: >
  Use when implementing or changing rolling forecast, driver-based forecasting, or continuous planning: 12-18 month horizon, 5-day cycle, driver-based, back-test.
group: finance
---

# Rolling forecast implementation

**Use when** working on `/forecasts`, `/forecasts/rolling`, `/forecasts/drivers`, rollingForecastModel, forecastStore, or any continuous planning surface.

## Method

1. **Driver-based framework**: identify 5-7 key drivers that explain business, build financial model from them. Don't forecast every GL account. Integrate financial + operational data so driver changes flow to statements.
2. **12-18 month horizon**: always looks same distance forward (12, 18, 24 months), not fiscal year. Long enough for seasonality, short enough for relevant assumptions.
3. **Time fence**: first 3 months locked for execution, months 4-6 lightly reviewed, months 7-18 directional.
4. **5-day monthly cycle**: Day1 load actuals, Day2-3 analyze variances, Day4 update drivers, Day5 publish/socialize. Cap revisions at 10% OpEx per cycle to prevent drift.
5. **Continuous updates**: actuals replace forecasts as periods close; view stays future-focused. Updated monthly/quarterly, not annually.
6. **Pilot**: one BU for one cycle to validate data feeds and acceptance, then enterprise-wide.
7. **Automate**: connectors from ERP/CRM/HRIS reduce manual errors 40%. Target 75% GL accounts auto-loaded.
8. **KPIs**: forecast cycle time <5 days, data automation 75%, user satisfaction 4.2/5, MAPE 3mo <7%, budget-to-actual variance <10%, working capital days -5 in 12mo.
9. **Off-cycle trigger**: revenue/cost deviates >5% annual plan for 2 consecutive months, or catalyst shifts annual EBITDA >$3M.
10. **Accuracy**: IBM research (widely cited since 2017): rolling forecasts deliver 12% greater accuracy, 50% less prep time, 10% profitability improvement.

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

**Proves itself with:** rolling forecast tests with 18-month horizon, driver-based calcs, 5-day cycle documented.
**Source:** adapted from cubesoftware.com rolling forecast best practices, cleoai.tech rolling forecast implementation, metapraxis.com rolling forecasting (MIT, rewritten). IBM Institute for Business Value research cited in FP&A Trends.
