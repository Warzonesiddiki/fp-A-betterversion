<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# FP&A Glossary

> _A function without a docstring is a word unspoken. A domain term without a definition is a budget line the next developer will misread. This glossary is the contract between the codebase and the next person who opens it._
>
> **Status:** Draft v0.1 — pending Apollo review and staging
> **Owner:** Mnemosyne (Documentation & Architecture)
> **Last updated:** 2026-06-12
> **Source of truth:** This file is canonical once staged to `docs/GLOSSARY.md` (Apollo's P0 doc fix)
> **Cross-references:** [ADR-002 Zustand](#adr-cross-references), [ADR-003 OLAP cube](#adr-cross-references), [ADR-004 Decimal.js](#adr-cross-references), [ADR-005 masterStorage](#adr-cross-references), [ADR-006 Schema migration](#adr-cross-references)

---

## How to use this glossary

Every FP&A term used in the FinPlan Pro codebase is defined here, with:

1. **Definition** — plain English (1-3 sentences)
2. **Formula** — the math, where applicable
3. **Code locations** — the engine / store / page that _produces_ and _consumes_ the value
4. **See also** — related terms and ADRs

If a term appears in code but not in this glossary, that's a **documentation bug** — open a PR. New terms are welcome.

**For non-financial readers:** the four terms that unlock the rest of FP&A are [Gross Margin](#gross-margin), [EBITDA](#ebitda), [NPV](#npv-npv), and [Scenario](#scenario). Start there.

---

## Allocation

**Definition.** Distributing a single monetary pool (overhead, marketing spend, IT cost) across multiple recipients (departments, products, cost centers) according to a rule. Allocation rules are _not_ the same as direct cost assignment: an allocated cost is a _share_ of an indirect cost.

**Rule shapes supported.** Fixed amount, percentage of driver, step-function, tier-based (e.g. first $1M at 5%, next $4M at 3%, above at 1.5%), and custom formula.

**Code locations.**

- Producer / consumer: `src/engines/AllocationEngine.ts` — `allocate(pool, rule, recipients)`, `AllocationRuleBuilder.tsx`
- Store: `allocationStore` (transient, immer-only)
- See ADR-004 — currency math in allocation splits uses Decimal.js to avoid float drift on small percentages.

**See also.** [Driver](#driver), [Variance](#variance), [Scenario](#scenario).

---

## Break-even

**Definition.** The revenue level at which total revenue equals total cost (fixed + variable), producing zero profit. The break-even point is foundational for sensitivity analysis and pricing decisions.

**Formula.** `Break-even Revenue = Fixed Costs / (1 - Variable Cost Ratio)` where `Variable Cost Ratio = Variable Costs / Revenue`. In units: `Break-even Units = Fixed Costs / (Price - Variable Cost per Unit)`.

**Code locations.**

- `src/engines/ProfitLossEngine.ts:breakEven(fixed, variableRatio)`
- Used in: `BreakEvenChart.tsx`, `PricingPage`

**See also.** [Sensitivity Analysis](#sensitivity-analysis), [Scenario](#scenario), [Margin](#gross-margin).

---

## Budget vs Actual

**Definition.** A variance report comparing the _planned_ (budget) financial state against the _realized_ (actual) state for a given period. The difference is _variance_.

**Variance flavors.**

- **Favorable (F)** — actual is better than budget (e.g. lower cost, higher revenue)
- **Unfavorable (U)** — actual is worse than budget
- **Timing** — actual is on track but in a different period (e.g. PO issued in March instead of February)
- **Volume** — driver count changed (units sold, headcount), not the per-unit rate
- **Rate** — per-unit rate changed (price erosion, rate increase)

**Code locations.**

- Producer: `src/store/dataStore.ts` (Actuals), `src/engines/BudgetEngine.ts` (Budget)
- Consumer: `src/pages/BudgetVsActualPage.tsx`, `VarianceAnalysisGrid.tsx`
- Store: `varianceStore`

**See also.** [Variance](#variance), [Scenario](#scenario), [Driver](#driver).

---

## COGS — Cost of Goods Sold

**Definition.** The direct cost of producing the goods or services sold in a period. Includes raw materials, direct labor, and manufacturing overhead _directly attributable_ to production. **Excludes** selling, general, and administrative expenses (SG&A).

**Formula.** `COGS = Beginning Inventory + Purchases - Ending Inventory` (for product businesses). For service businesses: `COGS = Direct Labor + Direct Materials + Direct Overhead`.

**Code locations.**

- Producer: `src/engines/ProfitLossEngine.ts:cogs(inventory, purchases, endingInv)`
- Consumer: `src/engines/ProfitLossEngine.ts:grossMargin()`, P&L report
- Note: Hephaestus found P0/P1 float-bug risk at `ProfitLossEngine.ts:65,89,116` (raw `Math.round(x*100)/100`). **Use Decimal.js for currency math (see ADR-004).**

**See also.** [Gross Margin](#gross-margin), [EBITDA](#ebitda), [WACC](#wacc).

---

## Consolidation

**Definition.** The process of combining the financial statements of a parent company and its subsidiaries into a single set of consolidated statements, while **eliminating intercompany (IC) transactions** so that revenue/cost between group entities does not inflate group totals.

**Three eliminations.**

1. **IC revenue / cost** — `IC revenue from A → B` cancels with `IC cost in B from A`
2. **IC receivables / payables** — balance sheet elimination
3. **Investment in sub vs. sub equity** — parent's books eliminate against sub's equity at acquisition

**Code locations.**

- Producer: `src/engines/ConsolidationEngine.ts` (consolidate(parent, children, eliminations))
- Consumer: `src/pages/ConsolidatedReports/`, group P&L, group balance sheet
- Hephaestus found P1 NCI (non-controlling interest) algebra bug at `ConsolidationEngine.ts:849-851` — the dead code simplifies to `netIncome - dividends` and is never wired in. **See ADR-003 (cube data model) for why this matters.**

**See also.** [IC (Intercompany)](#ic-intercompany), [NCI](#nci-non-controlling-interest), [FX Revaluation](#fx-revaluation).

---

## Cube (OLAP)

**Definition.** A multi-dimensional data structure organized as **dimensions** (axes you slice by: time, region, product, customer) and **measures** (numeric values you aggregate: revenue, cost, count). OLAP = Online Analytical Processing — the discipline of querying cubes fast. See [ADR-003](/docs/adr/ADR-003-olap-cube-data-model.md) for the architectural decision.

**Anatomy.**

- **Dimension** — a categorical axis. Members are arranged in hierarchies: `Time > Year > Quarter > Month > Day`.
- **Measure** — a numeric value. `Revenue`, `COGS`, `Headcount`.
- **Cell** — the intersection of one member per dimension, holding one value per measure.
- **Slice** — a 2D projection where one dimension is fixed (e.g. "2024 revenue by region").
- **Dice** — a sub-cube where multiple dimensions are filtered to a range.
- **Drill-down / roll-up** — moving between hierarchy levels.

**Code locations.**

- `src/engines/CubeEngine.ts` — `Cube(dimensions, measures)`, `slice()`, `dice()`, `drillDown()`
- `src/store/cubeStore.ts` — wraps the engine, exposes it via `getState().engine` (must be `partialize`-excluded from persist — see ADR-002, ADR-006)
- The cube is the **primary data model**; 202 engines orbit it.

**See also.** [Driver](#driver), [Scenario](#scenario), [Variance](#variance), [ADR-003](#adr-cross-references).

---

## Discount Rate

**Definition.** The interest rate used to determine the present value of future cash flows. Conceptually, it's the opportunity cost of capital — what the same dollar would earn in a comparable-risk investment. **The discount rate is the key input to NPV and DCF.**

**Variants.**

- **WACC** — discount rate for a project's free cash flow when the project's risk mirrors the firm's overall risk
- **Risk-adjusted rate** — bumped up for project-specific risk (e.g. +3% for a new market entry)
- **Sovereign rate** — used for government / non-profit projects

**Formula.** `PV = CF / (1 + r)^n` where `r` is the discount rate and `n` is the period. Sum over all periods for NPV.

**Code locations.**

- `src/engines/CapExEngine.ts:npv(rate, cashFlows)`, `src/engines/CapExEngine.ts:calculateIRR(cashFlows)` (the IRR is the discount rate at which NPV = 0)

**See also.** [WACC](#wacc), [NPV](#npv-npv), [IRR](#irr-internal-rate-of-return).

---

## Driver

**Definition.** A business assumption used to forecast a measure. Drivers are the _levers_ of a model — change a driver, the model recomputes. Drivers can be **quantitative** (headcount, units sold, price) or **index-linked** (CPI, FX, market growth).

**Driver flavors.**

- **Volume driver** — `units_sold`, `seats`, `transactions`
- **Rate driver** — `price_per_unit`, `cost_per_seat`, `tax_rate`
- **Index driver** — `CPI`, `GDP_growth`, `industry_growth`
- **Driver trees** — a parent driver can roll up into a child driver (e.g. `Marketing Spend → Digital + Print + Events`)

**Code locations.**

- `src/engines/DriverCascadeEngine.ts:353-354` (Hephaestus flagged cumulative drift here — see ADR-004)
- `src/store/driverStore.ts`

**See also.** [Scenario](#scenario), [Sensitivity Analysis](#sensitivity-analysis), [Cube](#cube-olap).

---

## EBITDA

**Definition.** **E**arnings **B**efore **I**nterest, **T**axes, **D**epreciation, and **A**mortization. A proxy for operating cash flow: it strips out financing decisions (interest), tax jurisdictions (taxes), and non-cash accounting charges (D&A). It is the most-cited operating profitability metric in FP&A.

**Formula.** `EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization`. Equivalent top-down: `EBITDA = Revenue - COGS - SG&A` (operating income, _not_ including D&A in SG&A) — depends on accounting layout.

**Why finance teams use it.** Comparable across companies with different capital structures, tax regimes, and asset bases. **Caveat:** excludes capex — a capital-heavy business with high D&A can look better on EBITDA than on free cash flow.

**Code locations.**

- `src/engines/ProfitLossEngine.ts:calcEBITDA(revenue, cogs, sga, otherOp)`
- P&L report: line 4 (after Gross Profit, before Interest)

**See also.** [Gross Margin](#gross-margin), [NPV](#npv-npv), [WACC](#wacc).

---

## FX Revaluation

**Definition.** Re-measuring foreign-currency-denominated monetary balance sheet items (cash, receivables, payables, debt) at the **period-end** exchange rate, with the difference flowing through the income statement. Distinct from FX **translation** (the parent's presentation currency conversion) — see [ADR-001](/docs/adr/ADR-001-currency-translation-method.md).

**When does FX gain/loss hit P&L?**

- **Monetary items** (cash, AR, AP) → revalued at period-end → FX gain/loss in P&L
- **Non-monetary items** (PP&E, inventory, equity) → revalued at _historical_ rate → no FX gain/loss
- **FX revenue / cost in P&L** → translated at _average_ rate for the period

**Code locations.**

- `src/engines/FXTranslationEngine.ts:revalue(monetaryItems, periodEndRate)`
- The only ADR-documented engine in the project. **See [ADR-001](/docs/adr/ADR-001-currency-translation-method.md) for the architectural decision.**

**See also.** [Consolidation](#consolidation), [WACC](#wacc), [Scenario](#scenario).

---

## Gross Margin

**Definition.** Revenue minus the direct cost of producing the goods/services sold. Expressed as either a dollar amount (`Gross Profit = Revenue - COGS`) or a percentage (`Gross Margin % = Gross Profit / Revenue`). The single most-watched profitability ratio in product businesses.

**Formula.** `Gross Margin % = (Revenue - COGS) / Revenue`

**Sector benchmarks (rough).** SaaS: 70-85%. Retail: 25-50%. Manufacturing: 15-30%. Professional services: 30-50%.

**Code locations.**

- `src/engines/ProfitLossEngine.ts:grossMargin(revenue, cogs)` → `{ absolute, percent }`
- P&L report: line 2 (Revenue - COGS)

**See also.** [COGS](#cogs-cost-of-goods-sold), [EBITDA](#ebitda), [Break-even](#break-even).

---

## IC (Intercompany)

**Definition.** Transactions, balances, or relationships **between two entities in the same corporate group** (parent ↔ subsidiary, sub ↔ sub). Intercompany activity must be **eliminated** in consolidation so the group doesn't report revenue from itself. See [Consolidation](#consolidation).

**Examples.**

- `IC Revenue` — sub A sells to sub B at $1M. From the group view, this is not external revenue.
- `IC Receivable / Payable` — sub A's AR from sub B is sub B's AP to sub A. They cancel.
- `IC Loan` — sub A lends cash to sub B. Group view: external cash unchanged.
- `IC Service\*\* — sub A charges sub B a management fee.

**Code locations.**

- `src/engines/ConsolidationEngine.ts:eliminateIC(transactions)`
- IC flag on transactions: `txn.type === 'IC'` (vs. `'EXTERNAL'`)

**See also.** [Consolidation](#consolidation), [NCI](#nci-non-controlling-interest), [FX Revaluation](#fx-revaluation).

---

## IRR (Internal Rate of Return)

**Definition.** The discount rate at which the **NPV of all cash flows from a project equals zero**. Conceptually, the project's break-even discount rate. If `IRR > WACC`, the project creates value. If `IRR < WACC`, it destroys value.

**Formula.** `0 = Σ [CF_t / (1 + IRR)^t]` for `t = 0..N`. Solved by iteration (Newton-Raphson, bisection, or secant). `CapExEngine.calculateIRR` uses Newton-Raphson with a 100-iteration cap and 1e-7 tolerance.

**Decision rule.** `IRR > hurdle rate (WACC + risk premium)` → invest. `IRR < hurdle` → reject.

**Caveats.**

- **Non-unique IRR** — for non-conventional cash flows (multiple sign changes), there can be 0, 1, or many IRRs. The implementation throws on no convergence within tolerance (see `@throws` in JSDoc).
- **Reinvestment assumption** — IRR implicitly assumes intermediate CFs are reinvested at the IRR. NPV assumes reinvestment at the discount rate. **For uneven project lives, NPV is preferred.**

**Code locations.**

- `src/engines/CapExEngine.ts:49` `static calculateIRR(cashFlows: number[]): number` — see ADR-004 for Decimal.js migration.

**See also.** [NPV](#npv-npv), [WACC](#wacc), [Discount Rate](#discount-rate).

---

## Monte Carlo

**Definition.** A simulation method that runs a calculation **thousands of times** with randomly sampled inputs (drawn from a probability distribution rather than a single point estimate) to produce a _distribution_ of outcomes. The output is not "the answer is X" but "X has a 90% confidence interval of [A, B]."

**When to use.** Forecasting under uncertainty — revenue next year, project NPV, headcount needs. Especially powerful for tail-risk questions: "what's the probability we miss our EBITDA target by >20%?"

**Input distributions.**

- **Normal** — `μ` and `σ` from historical data
- **Triangular** — `min`, `mode`, `max` (used when only expert judgment is available)
- **Uniform** — `min`, `max` (max-ignorance)
- **Custom** — empirical distribution from a dataset

**Output.** A histogram or summary statistics: mean, median, std dev, percentiles (P5, P50, P95, etc.). `MonteCarloEngine.simulate` returns `{ mean, median, stdDev, percentiles, samples }`.

**Code locations.**

- `src/engines/MonteCarloEngine.ts:~440` `simulate(params, config)` — see ADR-004 for Decimal.js on money outputs.

**See also.** [Sensitivity Analysis](#sensitivity-analysis), [Scenario](#scenario), [Driver](#driver).

---

## NCI (Non-Controlling Interest)

**Definition.** The portion of equity and net income in a subsidiary that is **not attributable to the parent company**. When a parent owns 80% of sub, the other 20% is the NCI. The NCI gets its own line on the balance sheet (equity section) and a subtraction to reach "net income attributable to parent."

**Formula.**

- `NCI Equity = (1 - majorityPct) × Sub Equity`
- `NCI Net Income = (1 - majorityPct) × Sub Net Income - (1 - majorityPct) × Sub Dividends` ← **the dead-code algebra bug at `ConsolidationEngine.ts:849-851` simplifies to this incorrectly.** See Hephaestus P1 finding.

**Code locations.**

- `src/engines/ConsolidationEngine.ts:849-851` (bug)
- `src/engines/ConsolidationEngine.ts:consolidate(parent, children, majorityPct)` (correct usage)

**See also.** [Consolidation](#consolidation), [IC (Intercompany)](#ic-intercompany).

---

## NPV (Net Present Value)

**Definition.** The sum of all future cash flows from a project, **discounted to present value** at the chosen discount rate, minus the initial investment. **The canonical capital budgeting decision metric.**

**Formula.** `NPV = -Initial Investment + Σ [CF_t / (1 + r)^t]` for `t = 1..N`

**Decision rule.** `NPV > 0` → project creates value, accept. `NPV < 0` → destroys value, reject. For mutually exclusive projects, pick the one with the highest NPV.

**Code locations.**

- `src/engines/CapExEngine.ts:npv(rate, cashFlows)` — input is the WACC (or risk-adjusted hurdle rate).

**See also.** [IRR](#irr-internal-rate-of-return), [WACC](#wacc), [Discount Rate](#discount-rate).

---

## Scenario

**Definition.** A _named set of assumptions and overrides_ applied to a base-case forecast. Scenarios are FP&A's "what-if" primitive: "what if revenue grows 5% slower? what if we enter EU in Q3? what if the dollar weakens 10%?" Each scenario produces a parallel forecast without modifying the base.

**Scenario flavors.**

- **Base case** — the management plan; the most-likely outcome
- **Upside / Downside** — symmetric stress; e.g. +20% / -20% on revenue
- **Stretch / Plan / Worst** — three-tier strategic view
- **Best-of-N** — Monte Carlo produces N scenarios stochastically; see [Monte Carlo](#monte-carlo)

**Code locations.**

- `src/store/scenarioStore.ts` (transient, immer-only — not persisted; see ADR-002)
- `src/engines/ScenarioEngine.ts:apply(base, overrides)`
- `src/components/ui/ScenarioLocking.tsx:58` (Hephaestus found `document.write` XSS here — replaced with `createElement` + `textContent`)

**See also.** [Sensitivity Analysis](#sensitivity-analysis), [Driver](#driver), [Monte Carlo](#monte-carlo).

---

## Sensitivity Analysis

**Definition.** Measuring how the output of a model changes as one (or two) inputs are varied. The output is typically a **sensitivity table** or **tornado chart** ranking inputs by their impact on the result.

**Tornado chart.** A bar chart where each bar is one input, sorted by magnitude of impact. The biggest bar at the top → most-leverage input.

**One-at-a-time (OAT) vs. multi-variate.** OAT varies one input while holding others constant. Multi-variate varies all simultaneously (often via Monte Carlo). OAT is faster; multi-variate captures interaction effects.

**Code locations.**

- `src/engines/SensitivityEngine.ts` (if present; otherwise via MonteCarlo)
- `src/components/charts/TornadoChart.tsx`

**See also.** [Monte Carlo](#monte-carlo), [Scenario](#scenario), [Driver](#driver).

---

## Spread

**Definition.** The _difference_ between two related financial values, most commonly:

- **Bid-ask spread** — the gap between what a buyer will pay and what a seller will accept
- **Credit spread** — the yield premium of a corporate bond over a risk-free government bond
- **Interest rate spread** — the gap between two rates (e.g. 10Y Treasury vs. 2Y, used as a recession indicator)
- **Pricing spread** — the markup over cost (e.g. `Avg Sale Price - Unit COGS`)

**Code locations.**

- `src/engines/SpreadEngine.ts:167` (Hephaestus flagged for Decimal.js migration; see ADR-004)

**See also.** [Driver](#driver), [Variance](#variance).

---

## Variance

**Definition.** The difference between a planned (budget, forecast, prior period) value and the actual realized value. The two flavors in FP&A:

- **Volume variance** — caused by activity level (units sold, headcount)
- **Rate / price variance** — caused by per-unit rate (price erosion, wage increase)

**Formula.** `Variance = Actual - Budget` (signed). `Variance % = (Actual - Budget) / |Budget|`.

**Code locations.**

- `src/store/varianceStore.ts` (transient, immer-only)
- `src/engines/VarianceEngine.ts:analyze(actual, budget)` → returns `{ volume, rate, mix, total }`
- `src/pages/VarianceAnalysisPage.tsx`

**See also.** [Budget vs Actual](#budget-vs-actual), [Driver](#driver), [Scenario](#scenario).

---

## WACC (Weighted Average Cost of Capital)

**Definition.** The blended cost of capital a company uses to discount its projects' cash flows. It weights the cost of equity and the after-tax cost of debt by their share of total capital.

**Formula.** `WACC = (E/V) × Re + (D/V) × Rd × (1 - T)` where:

- `E` = market value of equity, `D` = market value of debt, `V = E + D`
- `Re` = cost of equity (often `Risk-Free Rate + β × Equity Risk Premium`)
- `Rd` = pre-tax cost of debt, `T` = marginal tax rate

**Why it matters.** It's the _hurdle rate_ against which a project's IRR is compared. If `IRR < WACC`, the project earns less than the company's blended cost of capital — value-destructive.

**Code locations.**

- `src/engines/CapExEngine.ts:wacc(equity, debt, costOfEquity, costOfDebt, taxRate)`

**See also.** [NPV](#npv-npv), [IRR](#irr-internal-rate-of-return), [Discount Rate](#discount-rate).

---

## ADR cross-references

This glossary is the _narrative_ layer; the ADRs are the _decision_ layer. They should always be read together.

| ADR                                                           | Decision                                                                                         | Glossary terms it touches                                                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [ADR-002](/docs/adr/ADR-002-zustand-state-management.md)      | Zustand + `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))` for 35 stores | [Cube](#cube-olap), [Scenario](#scenario), [Driver](#driver), [Variance](#variance)                                                            |
| [ADR-003](/docs/adr/ADR-003-olap-cube-data-model.md)          | OLAP cube as the primary data model; 202 engines orbit it                                        | [Cube](#cube-olap), [Driver](#driver), [Consolidation](#consolidation)                                                                         |
| [ADR-004](/docs/adr/ADR-004-decimal-js-currency-precision.md) | Decimal.js for currency math (replacing raw `Math.round(x*100)/100`)                             | All money terms: [Gross Margin](#gross-margin), [EBITDA](#ebitda), [NPV](#npv-npv), [IRR](#irr-internal-rate-of-return), [Variance](#variance) |
| [ADR-005](/docs/adr/ADR-005-custom-masterstorage.md)          | `masterStorage` wrapper instead of direct `localStorage`                                         | [Scenario](#scenario), [Driver](#driver), persistence-related state                                                                            |
| [ADR-006](/docs/adr/ADR-006-schema-migration-strategy.md)     | `kdfVersion` + storage key versioning for migration                                              | Persistence for [Cube](#cube-olap), [Scenario](#scenario)                                                                                      |

---

## Multi-agent audit cross-references

This glossary is the convergence point of every audit in the cycle:

- **Apollo** — 35 stores: this glossary explains _what_ each persists.
- **Athena v2** — `uiStore.ts:33` direct `localStorage` violation: motivates ADR-005 (masterStorage).
- **Hera v1** — i18n string literals: this glossary's `[See also]` keys must be routed through `useTranslation()`.
- **Hephaestus** — 6 P0/P1 float-bug engines (`TaxEngine.ts:65,89,116`, `SaaSMetricsEngine.ts:90-93`, `DriverCascadeEngine.ts:353-354`, `AllocationEngine.ts:84-99`, `SpreadEngine.ts:167`, `CubeEngine.ts:51-72`): every currency term in this glossary is the rationale for ADR-004 (Decimal.js).
- **Prometheus** — bundle & render perf: glossary entries help onlookers understand which engines are heavy (Cube, Monte Carlo, Consolidation).

---

## Future terms (not yet in code, but coming)

These terms don't yet appear in the codebase but are commonly requested by FP&A customers; tracking them here so the next contributor can find a place to add them.

- **MRR / ARR** — Monthly / Annual Recurring Revenue (SaaS)
- **CAC / LTV** — Customer Acquisition Cost / Lifetime Value
- **Burn / Runway** — Cash burn rate and months of runway
- **DSO / DPO / DIO** — Days Sales Outstanding / Days Payable Outstanding / Days Inventory Outstanding (working capital)
- **PBP** — Payback Period (years to recover initial investment)
- **ROIC** — Return on Invested Capital
- **TCO** — Total Cost of Ownership

---

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-12 -->
