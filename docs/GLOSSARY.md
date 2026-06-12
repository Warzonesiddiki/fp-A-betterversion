<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-13 -->

# FinPlan Pro — FP&A Glossary

> **Audience:** new engineers and first-time users of FinPlan Pro.
> **Goal:** a single, opinionated reference for the financial-planning terms that show up in our UI, engines, and reports. Each entry gives the plain-English meaning, where the term lives in the codebase, the terms it is usually grouped with, and an external reference for deeper study.
> **Path-alias convention:** per `AGENTS.md` §"Path Alias", `@/` resolves to `src/`. All file paths below are repo-relative.
> **Cross-links:** see `docs/ARCHITECTURE.md` for the engine/UI topology and `docs/PRODUCT_VISION.md` §3 for the FP&A workflow that motivates these terms.

## How to use this doc

1. Find the term in the alphabetical list below.
2. Read the **Definition** to anchor the concept.
3. Open the **In our product** file:line to see the canonical implementation.
4. Follow **Related terms** to neighbouring concepts (e.g. ARR ⇄ MRR ⇄ NRR).
5. Use the **External reference** for the textbook / industry-standard definition.

If a term is missing, add it as a new H2 in alphabetical order — keep the four-section template (`Definition` → `In our product` → `Related terms` → `External reference`) and cite file:line for every "In our product" claim.

---

## ARR (Annual Recurring Revenue)

**Definition.** The annualized value of all currently-active subscription contracts, expressed as the periodic recurring revenue multiplied by the number of periods in a year. ARR strips out one-time fees, professional-services revenue, and any non-recurring components, so it is the cleanest run-rate number for a subscription business. ARR is the SaaS cousin of "annualized" revenue and is usually reported alongside its monthly equivalent, MRR.

**In our product.**
- `@/engines/SaaSMetricsEngine.ts:14` — `SaaSMetricsEngine` computes ARR, MRR, NRR, churn, CAC, LTV, and the rest of the subscription KPI set in one place.
- `@/pages/saas/ARRDashboard.tsx:15` — the page that renders the ARR/MRR waterline (new + expansion − churn − contraction).
- `@/engines/templates/saas.ts:13` — `ARR` row in the SaaS KPI template used by ReportBuilder.

**Related terms.** [MRR](#mrr-monthly-recurring-revenue) · [NRR](#nrr-net-revenue-retention) · [Churn](#churn) · [LTV](#ltv-lifetime-value) · [CAC](#cac-customer-acquisition-cost).

**External reference.** [Wikipedia — Annual recurring revenue](https://en.wikipedia.org/wiki/Annual_recurring_revenue).

---

## Balance Sheet

**Definition.** A point-in-time financial statement that lists a company's **Assets**, **Liabilities**, and **Equity**, satisfying the identity `Assets = Liabilities + Equity`. Unlike the P&L, the balance sheet is a stock measure (cumulative balances) rather than a flow measure (period activity). FinPlan Pro's Balance Sheet is built from the chart-of-accounts and is reconciled through the ConsolidationEngine.

**In our product.**
- `@/components/reports/FinancialStatementTemplates.tsx:96` — `balanceSheet` template rows (assets, liabilities, equity, working-capital subtotal) used by ReportBuilder.
- `@/pages/reports/BalanceSheetPage.tsx:20` — the dedicated Balance Sheet report page.
- `@/engines/ConsolidationEngine.ts:185` — collapses intercompany balances to deliver the consolidated balance sheet.

**Related terms.** [P&L](#pl-profit--loss) · [Cash Flow](#cash-flow) · [Working Capital](#working-capital).

**External reference.** [Wikipedia — Balance sheet](https://en.wikipedia.org/wiki/Balance_sheet).

---

## Budget vs Actual

**Definition.** A variance report that compares the **budgeted** (planned) amount for each account/period against the **actual** (recorded) amount, surfacing the difference in absolute terms and as a percentage. "Favourable" variance usually means revenue is higher or expense is lower than budget; "unfavourable" means the opposite. Variance colour convention in FinPlan Pro: favourable = `#16A34A` (green), unfavourable = `#DC2626` (red) per `AGENTS.md` §"Code Conventions".

**In our product.**
- `@/pages/budgets/BudgetVAReport.tsx:41` — the Budget-vs-Actual report grid (default export).
- `@/engines/VarianceDecompositionEngine.ts:21` — decomposes total variance into price, volume, and mix components.
- `@/pages/reports/BudgetVsActualPage.tsx:98` — the route-level page that surfaces the comparison.

**Related terms.** [Variance](#variance) · [Forecast](#forecast) · [P&L](#pl-profit--loss) · [Sensitivity Analysis](#sensitivity-analysis).

**External reference.** [Investopedia — Budget vs Actual](https://www.investopedia.com/terms/b/budget-vs-actual.asp).

---

## Burn Rate

**Definition.** The rate at which a company is spending its cash reserves, almost always reported as a **monthly** figure (cash out per month) or an **annual** figure (cash out per year). A company with $1.2M in the bank and a $100K/month burn has a 12-month runway. Burn rate drives the Runway KPI directly and is the single most-watched metric for cash-constrained startups.

**In our product.**
- `@/engines/CashFlowWaterfallEngine.ts:40` — the `CashFlowWaterfallEngine` that exposes `burnRate` as a field on the waterfall output.
- `@/engines/ScenarioEngine.ts:66` — `burnRate: opex / 12` is the simplified monthly-burn in scenario modeling.
- `@/engines/MonteCarloEngine.ts:436` — `burnRate` is one of the inputs to the Monte Carlo runway simulation.
- `@/pages/cash/CashForecastPage.tsx:55` — the page that visualises burn forward (default export).

**Related terms.** [Runway](#runway) · [Cash Flow](#cash-flow) · [Scenario](#scenario) · [Monte Carlo](#monte-carlo).

**External reference.** [Investopedia — Burn rate](https://www.investopedia.com/terms/b/burnrate.asp).

---

## CAC (Customer Acquisition Cost)

**Definition.** The fully-loaded cost to acquire one new customer, typically computed as (Sales + Marketing spend in a period) ÷ (New customers added in the same period). CAC is paired with LTV to assess unit economics: an LTV/CAC ratio ≥ 3 is the common rule-of-thumb for a healthy SaaS business.

**In our product.**
- `@/engines/SaaSMetricsEngine.ts:14` — `CAC` is computed alongside LTV, ARR, and the other SaaS KPIs.
- `@/pages/saas/ARRDashboard.tsx:15` — renders the LTV/CAC ratio and CAC payback months.
- `@/engines/templates/saas.ts:13` — `CAC` row in the SaaS KPI template.

**Related terms.** [LTV](#ltv-lifetime-value) · [ARR](#arr-annual-recurring-revenue) · [Churn](#churn) · [MRR](#mrr-monthly-recurring-revenue).

**External reference.** [Wikipedia — Customer acquisition cost](https://en.wikipedia.org/wiki/Customer_acquisition_cost).

---

## Cash Flow

**Definition.** A financial statement that reconciles a company's cash balance from the start of a period to the end of a period by classifying all cash movements as **Operating**, **Investing**, or **Financing** activities. The Cash Flow Statement answers "where did the cash go?" and is the source of truth for liquidity, free cash flow, and ultimately runway. FinPlan Pro computes the cash-flow statement both as a report and as the driver for cash-flow forecasting.

**In our product.**
- `@/components/reports/FinancialStatementTemplates.tsx:166` — the `cashFlow` template (operating / investing / financing).
- `@/pages/reports/CashFlowPage.tsx:54` — the route-level Cash Flow page (default export).
- `@/engines/CashFlowWaterfallEngine.ts:40` — projects the cash balance forward and surfaces the waterfall.

**Related terms.** [P&L](#pl-profit--loss) · [Balance Sheet](#balance-sheet) · [Burn Rate](#burn-rate) · [Runway](#runway) · [Working Capital](#working-capital).

**External reference.** [Wikipedia — Cash flow statement](https://en.wikipedia.org/wiki/Cash_flow_statement).

---

## Churn

**Definition.** The rate at which customers (or revenue) stop subscribing over a given period, usually reported as **Logo Churn** (% of customers lost) and **Revenue Churn** (% of MRR lost). The inverse of churn is **retention**; gross retention plus expansion gives NRR. Churn is the primary driver of the difference between gross and net revenue retention.

**In our product.**
- `@/engines/SaaSMetricsEngine.ts:14` — `Churn` is one of the computed SaaS KPIs.
- `@/engines/templates/saas.ts:13` — the SaaS template surfaces churn as both a number and a sparkline.
- `@/pages/saas/ChurnDashboard.tsx:71` — the page that visualises churn cohorts (default export).

**Related terms.** [NRR](#nrr-net-revenue-retention) · [LTV](#ltv-lifetime-value) · [MRR](#mrr-monthly-recurring-revenue) · [CAC](#cac-customer-acquisition-cost).

**External reference.** [Investopedia — Churn rate](https://www.investopedia.com/terms/c/churnrate.asp).

---

## COGS (Cost of Goods Sold)

**Definition.** The direct costs attributable to producing the goods (or delivering the services) a company sells in a period. COGS excludes selling, general, and administrative expenses — those land in OpEx. In a SaaS context, COGS is often called "cost of revenue" and includes hosting, payment processing, and customer-support headcount. COGS drives Gross Profit (= Revenue − COGS) and Gross Margin (= Gross Profit / Revenue).

**In our product.**
- `@/engines/COGSVarianceEngine.ts:3` — the dedicated engine that analyses COGS variance against plan and prior periods.
- `@/engines/templates/saas.ts:183` — the SaaS template's COGS row (cost-of-revenue line).
- `@/components/scenarios/scenarioUtils.ts:25` — `cogs` is a scenario input alongside `revenue` and `opex`.
- `@/pages/manufacturing/COGSVariancePage.tsx:23` — the route-level COGS variance page (manufacturing module).

**Related terms.** [P&L](#pl-profit--loss) · [EBITDA](#ebitda-earnings-before-interest-taxes-depreciation-amortization) · [Variance](#variance) · [Scenario](#scenario).

**External reference.** [Investopedia — Cost of goods sold (COGS)](https://www.investopedia.com/terms/c/cogs.asp).

---

## DCF (Discounted Cash Flow)

**Definition.** A valuation method that estimates the present value of an asset (or a company) by projecting its future free cash flows and discounting them back to today at a risk-adjusted discount rate (typically the WACC). DCF is the workhorse of intrinsic valuation; its output is highly sensitive to the terminal-growth-rate assumption. A DCF requires an explicit forecast horizon (usually 5–10 years) plus a terminal value.

**In our product.**
- `@/engines/FairValueEngine.ts:47` — `FairValueEngine.calculateDCF(cashFlows, discountRate, terminalGrowth?)` is the canonical DCF implementation.
- `@/engines/FinancialInstrumentsEngine.ts:273` — `dcfValuation(...)` is the second DCF entry point, used by the financial-instruments module.
- `@/engines/formula-functions/financial.ts:39` — the `DCF()` formula function exposed to the safe-math parser.
- `@/pages/audit/FairValuePage.tsx:93` — the Fair-Value worksheet that surfaces DCF alongside other valuation methods.

**Related terms.** [NPV](#npv-net-present-value) · [IRR](#irr-internal-rate-of-return) · [EBITDA](#ebitda-earnings-before-interest-taxes-depreciation-amortization) · [Forecast](#forecast).

**External reference.** [Wikipedia — Discounted cash flow](https://en.wikipedia.org/wiki/Discounted_cash_flow).

---

## EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)

**Definition.** A proxy for operating cash-flow profitability: net income with interest, taxes, depreciation, and amortisation added back. EBITDA strips out the effects of financing decisions (interest) and accounting choices (D&A, tax) to give a cleaner comparison of operating performance across companies and across capital structures. EBITDA Margin (= EBITDA / Revenue) is the standard profitability ratio.

**In our product.**
- `@/engines/formula-functions/financial.ts:12` — `EBITDA(r, c, o)` is the formula-function entry point: `revenue − cogs − opex`.
- `@/engines/SafeMathParser.ts:754` — the `EBITDA` token for the safe-math parser (used in the scenario-modeling sandbox).
- `@/engines/WaterfallBridgeEngine.ts:83` — documents the P&L waterfall `Revenue → COGS → Gross Profit → OpEx → EBITDA → Net Income` (line 94 is the EBITDA calculation in code).
- `@/components/scenarios/scenarioUtils.ts:43` — `ebitda` is grouped with `arr` and `cogs` as a top-line scenario metric.

**Related terms.** [P&L](#pl-profit--loss) · [COGS](#cogs-cost-of-goods-sold) · [Cash Flow](#cash-flow) · [DCF](#dcf-discounted-cash-flow).

**External reference.** [Wikipedia — Earnings before interest, taxes, depreciation and amortization](https://en.wikipedia.org/wiki/EBITDA).

---

## FP&A (Financial Planning & Analysis)

**Definition.** The corporate function that owns budgeting, forecasting, scenario modeling, and the analytical support for strategic decisions. FP&A sits between Finance (which records what happened) and the business (which wants to know what to do next). FinPlan Pro is an FP&A product: the entire engine layer exists to make budgeting, forecasting, and what-if analysis faster and more defensible.

**In our product.**
- `docs/PRODUCT_VISION.md:1` — the product vision document is the source of truth for the FP&A workflow.
- `docs/ARCHITECTURE.md:1` — the architecture document explains how the engines, stores, and pages serve FP&A use cases.
- `AGENTS.md:28` — the engines directory description (150+ pure calculation engines for financial logic).
- `@/engines/` — the 150+ pure calculation engines that power the FP&A workflows.

**Related terms.** [Budget vs Actual](#budget-vs-actual) · [Forecast](#forecast) · [Scenario](#scenario) · [Sensitivity Analysis](#sensitivity-analysis) · [Variance](#variance).

**External reference.** [Wikipedia — Financial planning and analysis](https://en.wikipedia.org/wiki/Financial_planning_and_analysis).

---

## Forecast

**Definition.** A forward-looking estimate of future financial outcomes (revenue, expense, cash, headcount). Forecasts can be **driver-based** (built bottom-up from named inputs), **statistical** (time-series extrapolation), or **judgmental** (management override). Rolling forecasts continuously extend the horizon (e.g. always 12 months out) as each period closes, in contrast to the fixed annual budget.

**In our product.**
- `@/engines/ForecastMethodEngine.ts:129` — implements the family of forecast methods (linear, exponential-smoothing, Holt-Winters, etc.).
- `@/engines/RollingForecastEngine.ts:93` — the rolling-forecast engine that slides the horizon each period.
- `@/pages/forecasts/ForecastListPage.tsx:34` — the route-level forecast list page (default export).
- `@/pages/forecasts/WhatIfPage.tsx:98` — the what-if / driver-planning page that builds forecasts bottom-up.

**Related terms.** [Budget vs Actual](#budget-vs-actual) · [Variance](#variance) · [Scenario](#scenario) · [Sensitivity Analysis](#sensitivity-analysis).

**External reference.** [Investopedia — Financial forecasting](https://www.investopedia.com/terms/f/financial-forecasting.asp).

---

## IRR (Internal Rate of Return)

**Definition.** The discount rate at which the Net Present Value of a series of cash flows equals zero. IRR is the project's "effective annual return" if all cash flows are realised as projected. It is widely used to rank mutually-exclusive investments and is the standard hurdle rate for capital-budgeting decisions. IRR is undefined when cash flows change sign more than once.

**In our product.**
- `@/engines/FinancialInstrumentsEngine.ts:46` — `computeIRR(cashFlows)` is the canonical IRR implementation (Newton-Raphson bracketing-root-finder).
- `@/engines/formula-functions/financial.ts:36` — the `IRR()` formula function exposed to the safe-math parser.
- `@/pages/capex/CapExDashboard.tsx:145` — the CapEx dashboard that displays IRR vs hurdle for capital projects (default export).
- `@/engines/FinancialInstrumentsEngine.test.ts:25` — the IRR test-suite verifies the bracketing-root-finder behaviour.

**Related terms.** [NPV](#npv-net-present-value) · [DCF](#dcf-discounted-cash-flow) · [Cash Flow](#cash-flow).

**External reference.** [Wikipedia — Internal rate of return](https://en.wikipedia.org/wiki/Internal_rate_of_return).

---

## LTV (Lifetime Value)

**Definition.** The total gross-margin-adjusted revenue a typical customer will generate over their lifetime as a paying customer, computed as `(ARPA × Gross Margin) / Churn` for a steady-state SaaS business. LTV is paired with CAC: an LTV/CAC ratio of ≥ 3 indicates healthy unit economics, while a ratio of < 1 means each new customer is destroying value.

**In our product.**
- `@/engines/SaaSMetricsEngine.ts:14` — `LTV` is computed alongside CAC, ARR, NRR.
- `@/engines/templates/saas.ts:13` — the SaaS KPI template's LTV/CAC row.
- `@/pages/saas/ARRDashboard.tsx:15` — the page that renders the LTV trendline and payback months.

**Related terms.** [CAC](#cac-customer-acquisition-cost) · [Churn](#churn) · [ARR](#arr-annual-recurring-revenue) · [MRR](#mrr-monthly-recurring-revenue).

**External reference.** [Wikipedia — Customer lifetime value](https://en.wikipedia.org/wiki/Customer_lifetime_value).

---

## Monte Carlo

**Definition.** A simulation technique that runs a calculation many thousands of times, each iteration sampling uncertain inputs from their probability distributions, in order to estimate the distribution of the output. In FP&A, Monte Carlo is used to convert a single-point forecast into a probability cone (e.g. "what is the 5th/50th/95th percentile of next quarter's cash balance?"). The FinPlan Pro Monte Carlo engine runs in a Web Worker pool to keep the UI responsive on long simulations.

**In our product.**
- `@/engines/MonteCarloEngine.ts:333` — the simulation entry point; iterates `iterations` × `horizon` steps.
- `@/workers/monte-carlo.worker.ts:117` — the Web Worker that runs the simulation off the main thread (`runMonteCarlo` function).
- `@/workers/index.ts:96` — the `runMonteCarlo()` public API exported from the workers index.
- `@/workers/types.ts:43` — the `MonteCarloRequest` type (assumptions, iterations, horizon).
- `@/pages/analytics/GoalSeekPage.tsx:22` — the Goal-Seek page that calls `runMonteCarlo()` (default export).

**Related terms.** [Sensitivity Analysis](#sensitivity-analysis) · [Scenario](#scenario) · [Forecast](#forecast) · [Burn Rate](#burn-rate) · [Runway](#runway).

**External reference.** [Wikipedia — Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method).

---

## MRR (Monthly Recurring Revenue)

**Definition.** The normalised monthly value of all currently-active subscription contracts, expressed as the sum of subscription fees that recur each month. MRR is the granular counterpart to ARR; it is the primary run-rate metric for early-stage SaaS companies and is the input for churn, expansion, and net-revenue calculations. `MRR × 12 ≈ ARR` for steady-state businesses.

**In our product.**
- `@/engines/SaaSMetricsEngine.ts:14` — `MRR` is computed alongside ARR, NRR, churn.
- `@/pages/saas/ARRDashboard.tsx:15` — renders the MRR waterline (new + expansion − churn − contraction) on the same dashboard as ARR.
- `@/engines/templates/saas.ts:13` — the SaaS template's `MRR` row.

**Related terms.** [ARR](#arr-annual-recurring-revenue) · [NRR](#nrr-net-revenue-retention) · [Churn](#churn) · [LTV](#ltv-lifetime-value).

**External reference.** [Wikipedia — Monthly recurring revenue](https://en.wikipedia.org/wiki/Monthly_recurring_revenue).

---

## NPV (Net Present Value)

**Definition.** The sum of a series of future cash flows, each discounted back to the present at a risk-adjusted discount rate. A positive NPV means the project earns more than the discount rate (creates value); a negative NPV means it does not. NPV and IRR usually agree on the ranking of projects, but NPV is theoretically preferred because it is a direct dollar measure.

**In our product.**
- `@/engines/FinancialInstrumentsEngine.ts:46` — the `npv(rate, cashFlows)` function (vectorised summation of `cf / (1+r)^t`).
- `@/engines/formula-functions/financial.ts:30` — the `NPV()` formula function exposed to the safe-math parser.
- `@/engines/FairValueEngine.ts:47` — `FairValueEngine` uses NPV internally as part of DCF.
- `@/pages/capex/CapExDashboard.tsx:145` — the CapEx dashboard that displays NPV vs hurdle for capital projects.

**Related terms.** [IRR](#irr-internal-rate-of-return) · [DCF](#dcf-discounted-cash-flow) · [Cash Flow](#cash-flow).

**External reference.** [Wikipedia — Net present value](https://en.wikipedia.org/wiki/Net_present_value).

---

## NRR (Net Revenue Retention)

**Definition.** The percentage of recurring revenue retained from existing customers over a period, **including expansion** (upsell, cross-sell) and **contraction** (downgrades), but excluding new-customer revenue. NRR > 100% means expansion more than offsets churn — a hallmark of best-in-class SaaS businesses. NRR complements gross retention: `NRR = Gross Retention + Expansion`.

**In our product.**
- `@/engines/SaaSMetricsEngine.ts:14` — `NRR` is computed alongside ARR, MRR, churn.
- `@/engines/templates/saas.ts:13` — the SaaS template's NRR row.
- `@/pages/saas/ARRDashboard.tsx:15` — the page that renders the NRR cohort grid.

**Related terms.** [ARR](#arr-annual-recurring-revenue) · [MRR](#mrr-monthly-recurring-revenue) · [Churn](#churn) · [CAC](#cac-customer-acquisition-cost).

**External reference.** [Wikipedia — Net revenue retention](https://en.wikipedia.org/wiki/Net_revenue_retention).

---

## OLAP (Online Analytical Processing)

**Definition.** A category of database and cube technology optimised for **multi-dimensional analytical queries** — slice, dice, drill-down, roll-up — across large fact tables. An OLAP "cube" pre-aggregates measures (e.g. revenue, units) by dimensions (e.g. region, product, period) so interactive dashboards can pivot instantly. FinPlan Pro ships an in-memory OLAP engine so users can pivot their budget/actual data without round-tripping to a warehouse.

**In our product.**
- `@/engines/CubeEngine.ts:31` — the in-memory cube (`measures × dimensions`, with `slice`/`dice`/`drillDown` operations).
- `@/engines/AdvancedOLAPEngine.ts:62` — the advanced OLAP engine (calculated members, named sets, KPIs).
- `@/store/cubeStore.ts:111` — the cube state in the zustand store (measures, dimensions, results).
- `@/pages/reports/ReportDesignerPage.tsx:1` — the Report Designer where users build pivot views on top of the cube.

**Related terms.** [Budget vs Actual](#budget-vs-actual) · [Scenario](#scenario) · [Sensitivity Analysis](#sensitivity-analysis).

**External reference.** [Wikipedia — Online analytical processing](https://en.wikipedia.org/wiki/Online_analytical_processing).

---

## P&L (Profit & Loss)

**Definition.** Also called the **Income Statement**, the P&L reports a company's revenues, expenses, and resulting profit (or loss) over a period. The canonical P&L chain is `Revenue → COGS → Gross Profit → OpEx → EBITDA → Interest & Tax → Net Income`. Unlike the Balance Sheet, the P&L is a flow measure (period activity, not point-in-time).

**In our product.**
- `@/components/reports/FinancialStatementTemplates.tsx:6` — the `profitAndLoss` template (the rows down to Net Income).
- `@/pages/reports/ProfitLossPage.tsx:20` — the route-level P&L page (default export).
- `@/engines/ReportLayoutEngine.ts:2` — documents the canonical row order: `Revenue → COGS → Gross Profit → OpEx → EBITDA → Net Income`.

**Related terms.** [Balance Sheet](#balance-sheet) · [Cash Flow](#cash-flow) · [EBITDA](#ebitda-earnings-before-interest-taxes-depreciation-amortization) · [COGS](#cogs-cost-of-goods-sold).

**External reference.** [Wikipedia — Income statement](https://en.wikipedia.org/wiki/Income_statement).

---

## Runway

**Definition.** The number of months (or years) a company can continue operating at its current burn rate before cash reaches zero. Runway = Cash ÷ Monthly Burn. Runway is the canonical fundraising signal for cash-constrained startups: < 6 months means raise now, > 18 months means you have time to optimise. The runway figure is best modelled probabilistically (Monte Carlo) because burn itself is uncertain.

**In our product.**
- `@/engines/CashFlowWaterfallEngine.ts:113` — `static runway` (the `cash / monthlyBurn` calculation).
- `@/engines/MonteCarloEngine.ts:333` — probabilistic runway distribution (P5/P50/P95 months-to-zero).
- `@/pages/cash/CashForecastPage.tsx:55` — the Cash Forecast page that displays the static runway KPI.
- `@/pages/scenarios/ScenarioBuilderPage.tsx:61` — the Scenario Builder that overlays runway across scenarios (default export).

**Related terms.** [Burn Rate](#burn-rate) · [Cash Flow](#cash-flow) · [Monte Carlo](#monte-carlo) · [Scenario](#scenario).

**External reference.** [Investopedia — Runway (finance)](https://www.investopedia.com/terms/r/runway.asp).

---

## Scenario

**Definition.** A named, internally-consistent "what-if" view of the business — e.g. `Base`, `Best`, `Worst`, `Layoffs 10%`, `EU Expansion 2027`. Each scenario overrides selected drivers (revenue growth, opex, headcount) and recomputes the downstream P&L, cash, and KPIs. Scenarios are the bridge between **sensitivity analysis** (one driver at a time) and **Monte Carlo** (probabilistic).

**In our product.**
- `@/engines/ScenarioEngine.ts:42` — the core scenario engine (applies driver deltas, recomputes EBITDA, cash, margins).
- `@/store/scenarioStore.ts:7` — the scenario state (named scenarios, active scenario, deltas).
- `@/pages/scenarios/ScenarioListPage.tsx:11` — the route-level scenarios list page (default export).
- `@/pages/scenarios/ScenarioBuilderPage.tsx:61` — the Scenario Builder editor (default export).

**Related terms.** [Sensitivity Analysis](#sensitivity-analysis) · [Monte Carlo](#monte-carlo) · [Forecast](#forecast) · [Budget vs Actual](#budget-vs-actual).

**External reference.** [Wikipedia — Scenario planning](https://en.wikipedia.org/wiki/Scenario_planning).

---

## Sensitivity Analysis

**Definition.** A "what-if" technique that measures how the output of a model changes as one (or two) inputs are flexed across a defined range, holding other inputs constant. The result is typically a **tornado chart** (rank-ordered impact) or a **data table** (output as a function of two inputs). Sensitivity analysis is the simplest form of stress-test: "if revenue drops 10%, what happens to EBITDA?".

**In our product.**
- `@/engines/SensitivityEngine.ts:39` — the one-at-a-time sensitivity engine (tornado chart).
- `@/engines/SensitivityTableEngine.ts:68` — the two-input data-table engine.
- `@/pages/forecasts/WhatIfPage.tsx:98` — the What-If page that hosts the sensitivity views alongside driver planning.

**Related terms.** [Scenario](#scenario) · [Monte Carlo](#monte-carlo) · [Forecast](#forecast) · [Variance](#variance).

**External reference.** [Investopedia — Sensitivity analysis](https://www.investopedia.com/terms/s/sensitivityanalysis.asp).

---

## Variance

**Definition.** The difference between an **actual** result and a **budgeted / forecast / prior-period** result, typically reported in absolute terms and as a percentage. Variance can be **favourable** (revenue higher or expense lower than plan) or **unfavourable** (the opposite). Variance **decomposition** breaks the total variance into price, volume, and mix components to explain the cause.

**In our product.**
- `@/engines/VarianceDecompositionEngine.ts:21` — decomposes total variance into price/volume/mix.
- `@/pages/variance/VarianceDashboardPage.tsx:54` — the route-level variance dashboard (default export).
- `@/pages/budgets/BudgetVAReport.tsx:41` — the Budget-vs-Actual variance report (default export).

**Related terms.** [Budget vs Actual](#budget-vs-actual) · [Forecast](#forecast) · [COGS](#cogs-cost-of-goods-sold) · [P&L](#pl-profit--loss).

**External reference.** [Investopedia — Variance analysis](https://www.investopedia.com/terms/v/varianceanalysis.asp).

---

## Working Capital

**Definition.** The capital a company uses in its day-to-day operations, calculated as **Current Assets − Current Liabilities**. Working capital measures short-term liquidity and operational efficiency. The two main working-capital metrics are **Days Sales Outstanding (DSO)**, **Days Payable Outstanding (DPO)**, and **Days Inventory Outstanding (DIO)**; their sum gives the **Cash Conversion Cycle (CCC)**.

**In our product.**
- `@/engines/WorkingCapitalEngine.ts:42` — the working-capital engine (current assets, current liabilities, DSO/DPO/DIO, CCC).
- `@/pages/cash/WorkingCapitalPage.tsx:50` — the route-level working-capital page (default export).
- `@/components/reports/FinancialStatementTemplates.tsx:96` — the Balance Sheet template's working-capital subtotal.

**Related terms.** [Balance Sheet](#balance-sheet) · [Cash Flow](#cash-flow) · [P&L](#pl-profit--loss).

**External reference.** [Wikipedia — Working capital](https://en.wikipedia.org/wiki/Working_capital).

---

## Cross-references

- **Engine layer overview** — `docs/ARCHITECTURE.md` §3.
- **FP&A workflow** — `docs/PRODUCT_VISION.md` §3.
- **Path-alias convention (`@/` → `src/`)** — `AGENTS.md` §"Path Alias".
- **File-size limits & test conventions** — `AGENTS.md` §"Code Conventions" and §"Testing".
- **Companion index** — `docs/GLOSSARY_INDEX.md` (one-line summaries for quick lookup).
- **Compliance evidence** — `docs/security-deferrals.md` (audit trail; not a financial term but the source for compliance references).

## Citation policy

Every "In our product" claim above cites a `file:line` that was verified against the current working tree on 2026-06-13. If you change a cited file, update the line number. If a file is deleted, the term is considered stale and must be re-anchored before publication.

## Versioning

- v0.1 (2026-06-13) — initial 25-term draft by Mnemosyne; pending Themis review.
