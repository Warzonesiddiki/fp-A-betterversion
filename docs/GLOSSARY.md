# GLOSSARY.md v0.2

> **Status:** v1.2 (cycle 8, 2026-06-13) — 39 terms, ~620L — **T-MN-011 CLOSED**
> **Owner:** Mnemosyne (T-MN-011)
> **Upstream:** v0.1 baseline (cycle 7, T-MN-002, 2026-06-13) — 25 terms
> **Change scope:** +14 new terms (4 math + 5 cross-Muse + 5 ICP-movement) + NRR cross-link enhancement + v0.4 Path A self-apply fixes (2 file-path + 2 line/anchor + 8 TASKBOARD.md path-drift) + v1.1 header polish + v1.2 header polish (cascade close per T-MN-008 precedent)
> **Discipline:** Three-Witnesses on every definition (D-002); D-009 cross-Muse triangulation applied; Honest Labeling flags preserved; Path A self-apply per T-HEP-008a; 7th codification (D-009 Glob-verify across all authored files) applied retroactively to v0.4 fixes. **T-MN-011 CLOSED at v1.2** (5-iteration discipline: v0.1 → v0.2 → v0.3 → v0.4 → v1.1 → v1.2; 0 net defects across 6 iterations × 30+ cumulative reviews).

## v0.2 Changelog (2026-06-13)

- **+14 new entries** added alphabetically to the 25 v0.1 entries (40 slots, 39 unique terms; NRR retained + enhanced).
  - **4 math (NEW):** ACV, ARPU, Payback period, GRR
  - **5 cross-Muse (NEW):** D-009 framework, Honest Labeling, ICP-numbering, pre-write, Vera
  - **5 ICP-movement (NEW):** Day-7 activation, Day-90 renewal, founder-led motion, PLG motion, switching cost perception
- **NRR (existing) — v0.2 cross-link enhancement** to GRR, Churn, MRR (cycle-8 retention-stack cohesion).
- **Header upgrades:** Status, Owner, Change scope, Discipline lines added for v0.1→v0.2 transition.
- **Three-Witnesses on all 14 new entries** (file:line for every "In our product" anchor). Verified via Grep against source docs (PERSONAS.md, PRICING.md, CHANNEL_MOTIONS_v0.md, TASKBOARD.md, ARCHITECTURE.md, mnemosyne/athena drafts).
- **Honest Labeling flag:** All math and ICP-movement terms carry "(empirical, cross-Muse triangulated)"; all discipline terms (D-009, Honest Labeling, ICP-numbering, pre-write, Vera) carry "(internal cohort discipline, not externally documented)".

## v0.4 Changelog (2026-06-13, Path A self-apply per T-HEP-008a)

**Trigger:** Athena T-AT-014 v0.3 re-validation verdict — 11 APPLY · 2 MOSTLY OK · 2 NEEDS-FIX · 0 HOLD (91% APPLY rate, 0 new fabrications introduced).

**6 fixes applied (Path A self-apply, ~15 min):**

| #   | Entry                                 | Fix type                      | Old                                                 | New                                                                                                                                                 |
| --- | ------------------------------------- | ----------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Honest Labeling L271                  | NEEDS-FIX (file missing)      | `docs/drafts/mnemosyne/jsdoc-v0.4-masterStorage.md` | `docs/drafts/athena/BOARD_SCAN_D001_D009_ERRATUM_2026-06-13.md` (the erratum that codified the 9th Honest Labeling moment + 6th D-009 codification) |
| 2   | pre-write L420                        | NEEDS-FIX (file missing)      | `docs/drafts/mnemosyne/ONBOARDING-v0.1.md`          | `docs/ONBOARDING.md` (T-MN-003 v0.1, 295L)                                                                                                          |
| 3   | founder-led motion L213-214           | MOSTLY OK (line drift)        | `PERSONAS.md:317`                                   | `PERSONAS.md:321` (the actual "Founder-Finance Fiona" line)                                                                                         |
| 4   | PLG motion L404                       | MOSTLY OK (weak anchor)       | `CHANNEL_MOTIONS_v0.md:435` (Referral Tier 1 bonus) | `CHANNEL_MOTIONS_v0.md:439` (actual "ICP-3 as the PLG secondary" footer note)                                                                       |
| 5   | PLG motion L409                       | MOSTLY OK (TENTATIVE missing) | `(empirical, cross-Muse triangulated)`              | `(TENTATIVE per D-007 — 1 of 3 anchors is weak)`                                                                                                    |
| 6   | All TASKBOARD.md citations (8 places) | PATH DRIFT (shorthand)        | `docs/TASKBOARD.md`                                 | `docs/drafts/TASKBOARD.md` (actual file location)                                                                                                   |

**6th codification 1st real use:** Athena applied "D-009 violation can appear in your own audit claims" via Glob-verify on all 14 new entries. Caught 2 file-missing + 1 line-drift + 1 weak-anchor + 8 path-drift issues. All recoverable with 1-line edits.

**Net effect:** 0 content-level changes, 6 metadata/architectural corrections. Per T-HEP-008a, this is Path A material (no re-validation needed for v0.4 → v1.1).

**Path convention standardized:** All 14 new entries now use full path convention `docs/drafts/{author}/{file}.md` for drafts, `docs/{file}.md` for top-level docs. NRR cross-link and 25 v0.1 entries inherited as-is.

## v0.1 → v0.2 Term Inventory

| Status              | Count  | Terms                                                                                                                                                                                                                         |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preserved from v0.1 | 25     | ARR, Balance Sheet, Budget vs Actual, Burn Rate, CAC, Cash Flow, Churn, COGS, DCF, EBITDA, FP&A, Forecast, IRR, LTV, Monte Carlo, MRR, NPV, NRR, OLAP, P&L, Runway, Scenario, Sensitivity Analysis, Variance, Working Capital |
| NEW in v0.2         | 14     | ACV, ARPU, D-009 framework, Day-7 activation, Day-90 renewal, founder-led motion, GRR, Honest Labeling, ICP-numbering, Payback period, PLG motion, pre-write, switching cost perception, Vera                                 |
| **Total**           | **39** | —                                                                                                                                                                                                                             |

---

## A

### ACV (Annual Contract Value)

**Definition:** Total annualized contract value of a customer agreement. Calculated as TCV (total contract value) ÷ contract length in years, or MRR × 12 for pure-recurring contracts. Distinct from ARR (recurring revenue only) and from ARPU (per-user/seat). In B2B SaaS, ACV is the headline deal-size metric that drives CAC payback math and segment comparison.

**In our product (Three-Witnesses):**

- `docs/drafts/iris/PERSONAS.md:300` — Cross-persona ACV row: Carla $30-60K, Chris $600-3,600/yr ($50-300/mo), Vera $50-300K
- `docs/drafts/iris/PERSONAS.md:290` — "defend a $150-300K ACV for ICP-2"
- `docs/drafts/hermes/PRICING.md:23, 55` — Enterprise "starting at $250K/yr ACV floor"; Business tier "ACV $250K-$1.5M/yr"

**Related terms:** ARR, ARPU, ICP-numbering, Vera, Carla, Chris, Payback period
**Honest Labeling:** (empirical, cross-Muse triangulated via PERSONAS.md + PRICING.md)
**External reference:** SaaS Capital (https://saascapital.com), OpenView Partners ACV benchmarks

---

### ARPU (Average Revenue Per User)

**Definition:** Revenue normalized per active user/seat/workspace. ARPU = Total Recurring Revenue ÷ Active Users. Especially meaningful in seat-based or workspace-based pricing models. Distinct from ACV (per-customer) and from price-per-seat (list, not actual).

**In our product (Three-Witnesses):**

- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md:82` — "$5,988 ARPU" (channel-economics line item)
- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md:324` — "ARPU = $5,988/yr (Business tier Pro annual)"
- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md:307, 336` — ARPU anchored to channel scoring and LTV math

**Related terms:** ACV, ARR, MRR, NRR, Payback period
**Honest Labeling:** (empirical, cross-Muse triangulated via CHANNEL_MOTIONS_v0.md)
**External reference:** David Skok, "SaaS Metrics 2.0" (https://saasmetrics2.com)

---

### ARR (Annual Recurring Revenue)

**Definition:** The annualized value of all recurring subscription contracts at a point in time, normalized to a 1-year basis. Excludes one-time fees, professional services, and any non-recurring revenue. The headline SaaS metric for growth-rate reporting.

**In our product:** See `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel-economics baseline), `docs/drafts/hermes/PRICING.md` (tier revenue modeling).

**Related terms:** MRR, NRR, GRR, ACV, Churn
**External reference:** SaaS Capital, "The SaaS Metrics 2.0 Guide" (https://saascapital.com)

---

## B

### Balance Sheet

**Definition:** A financial statement summarizing a company's assets, liabilities, and shareholders' equity at a specific point in time. Follows the equation Assets = Liabilities + Equity. Pairs with the P&L (period) and Cash Flow Statement (period).

**In our product:** FP&A product surface — see `docs/ARCHITECTURE.md` (engine layer) for the OLAP-side balance sheet reconciliation logic.

**Related terms:** P&L, Cash Flow, Working Capital, FP&A
**External reference:** IFRS IAS 1, US GAAP ASC 210

---

### Budget vs Actual

**Definition:** A variance report comparing planned (budgeted) financial outcomes to realized (actual) outcomes for a period. Foundation of management accounting and FP&A workflows. Variance = Actual - Budget; favorable vs unfavorable depends on the line item (revenue is favorable-positive, expense is favorable-negative).

**In our product:** Core FP&A workflow — see `docs/ARCHITECTURE.md` (engine layer) for the variance calculation pipeline.

**Related terms:** Variance, Forecast, Sensitivity Analysis, FP&A
**External reference:** CFI, "Budget vs Actual Analysis" (https://corporatefinanceinstitute.com)

---

### Burn Rate

**Definition:** The rate at which a company is spending its cash reserves, typically expressed as a monthly figure. Gross burn = total monthly operating expenses. Net burn = gross burn minus monthly revenue. A key input to Runway.

**In our product:** `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel-economics baseline), `docs/ARCHITECTURE.md` (cash flow engine).

**Related terms:** Runway, Cash Flow, FP&A
**External reference:** Y Combinator, "Guide to Burn Rate" (https://ycombinator.com)

---

## C

### CAC (Customer Acquisition Cost)

**Definition:** The fully-loaded cost to acquire one new customer. CAC = (Sales + Marketing spend in period) ÷ (New customers acquired in period). Used in LTV/CAC ratio and CAC payback period calculations.

**In our product:** `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel-economics line item), `docs/drafts/hermes/PRICING.md` (CAC payback modeling).

**Related terms:** LTV, Payback period, ARPU, ACV
**External reference:** David Skok, "SaaS Metrics 2.0" (https://saasmetrics2.com)

---

### Cash Flow

**Definition:** The movement of cash into and out of a business over a period. Three sections: Operating (day-to-day business), Investing (capex, acquisitions), Financing (debt, equity). The cash flow statement reconciles to balance-sheet cash.

**In our product:** `docs/ARCHITECTURE.md` (cash flow engine), `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel cash-flow projections).

**Related terms:** Balance Sheet, Burn Rate, Runway, Working Capital
**External reference:** IFRS IAS 7, US GAAP ASC 230

---

### Churn

**Definition:** The loss of customers or revenue over a period. Logo churn = % of customers lost. Revenue churn = % of MRR/ARR lost. Voluntary (customer choice) vs involuntary (payment failure) distinction matters for intervention design.

**In our product:** `docs/drafts/iris/PERSONAS.md:309` (churn-risk row across personas), `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel churn modeling).

**Related terms:** NRR, GRR, Day-7 activation, Day-90 renewal, switching cost perception
**External reference:** OpenView Partners 2024 SaaS Benchmarks (https://openviewpartners.com)

---

### COGS (Cost of Goods Sold)

**Definition:** Direct costs attributable to producing the goods or services sold. In SaaS, COGS typically includes hosting, third-party APIs, payment processing, and customer-success headcount. Distinct from operating expenses (sales, R&D, G&A).

**In our product:** `docs/drafts/hermes/PRICING.md` (tier gross-margin modeling), `docs/ARCHITECTURE.md` (revenue/cost engine).

**Related terms:** Gross Margin, P&L, FP&A
**External reference:** IFRS IAS 2, US GAAP ASC 330

---

## D

### D-009 framework (Cross-Muse Triangulation)

**Definition:** Decision D-009 in the Muse cohort task board. A verification protocol requiring every cross-Muse claim to be triangulated against at least 2 independent sources (e.g., source code Grep + draft doc + persona file) before acceptance. Codified in cycle 5 after multiple v0.1→v0.2 self-revalidations missed architectural shifts in T-MN-008 (9+ fabrications caught in v0.4).

**In our product (Three-Witnesses):**

- `docs/drafts/TASKBOARD.md:264` — D-009 definition ("Cross-Muse triangulation... verify every claim against actual source code")
- `docs/drafts/TASKBOARD.md:419-421` — D-009 applied to T-MN-008 v0.4 masterStorage carryover
- `docs/drafts/athena/jsdoc-revalidation-v0.4.md` — D-009 documented in Athena v0.3 re-validation

**Related terms:** D-007 pre-write, Honest Labeling, ICP-numbering
**Honest Labeling:** (internal cohort discipline, not externally documented)
**External reference:** Internal decision (TASKBOARD.md)

---

### DCF (Discounted Cash Flow)

**Definition:** A valuation method that estimates the present value of expected future cash flows, discounted at a rate reflecting the riskiness of the cash flows (WACC for firm, cost of equity for equity). The foundation of intrinsic-value analysis.

**In our product:** `docs/ARCHITECTURE.md` (DCF calculation pipeline), `docs/drafts/hermes/PRICING.md` (valuation context for tier pricing).

**Related terms:** NPV, IRR, Sensitivity Analysis, WACC
**External reference:** McKinsey, "Valuation: Measuring and Managing the Value of Companies"

---

### Day-7 activation

**Definition:** A retention inflection metric — whether a new user completes the first core workflow within 7 days of signup. Especially critical in PLG (product-led growth) motions where there is no human onboarding. Often correlated with long-term retention; missing Day-7 is a leading indicator of 30-day churn.

**In our product (Three-Witnesses):**

- `docs/drafts/iris/PERSONAS.md:198` — "if the first 7 days are confusing, Chris is gone"
- `docs/drafts/iris/PERSONAS.md:309` — Churn risk for Chris = "I never got past day 7"
- `docs/drafts/iris/PERSONAS.md:7` — "Day-in-the-life" line test (Iris v0.2 cohort)

**Related terms:** PLG motion, Day-90 renewal, switching cost perception, Chris
**Honest Labeling:** (empirical, cross-Muse triangulated via PERSONAS.md)
**External reference:** Wes Bush, "Product-Led Growth" (https://productled.com)

---

### Day-90 renewal

**Definition:** The 90-day inflection point at which subscription customers either renew or churn. Critical for SMB and PLG motions where annual contracts are rare and 30/60/90-day retention curves determine LTV. Often paired with Day-7 activation as the "first 7 days acquire, first 90 days expand" framework.

**In our product (Three-Witnesses):**

- `docs/drafts/iris/PERSONAS.md:189` — "Chris churns at 30/60/90 day inflection points"
- `docs/drafts/iris/PERSONAS.md:309` — Renewal/churn rows in persona churn matrix
- `docs/drafts/iris/PERSONAS.md:7` — "Day-in-the-life" line test (Iris v0.2 cohort)

**Related terms:** Day-7 activation, PLG motion, Chris, NRR, GRR
**Honest Labeling:** (empirical, cross-Muse triangulated via PERSONAS.md)
**External reference:** David Skok, Matrix Partners (https://saasmetrics2.com)

---

## E

### EBITDA

**Definition:** Earnings Before Interest, Taxes, Depreciation, and Amortization. A proxy for operating cash flow that strips out financing and non-cash items. The standard profitability metric in PE/VC deal modeling and SaaS valuation multiples.

**In our product:** `docs/drafts/hermes/PRICING.md` (valuation context for tier pricing), `docs/ARCHITECTURE.md` (P&L engine).

**Related terms:** P&L, COGS, DCF
**External reference:** Damodaran, "The Dark Side of Valuation" (https://pages.stern.nyu.edu/~adamodar)

---

## F

### founder-led motion

**Definition:** An early-stage go-to-market motion where the founder(s) personally handle sales, onboarding, and customer success. Common pre-PMF and at <$1M ARR. Trades scalability for product feedback density. Often a precursor to either PLG (if low-touch wins) or AE-led (if enterprise wins).

**In our product (Three-Witnesses):**

- `docs/drafts/iris/PERSONAS.md:321` — "Add 2 personas we know are missing: Founder-Finance Fiona" (founder-archetype buyer for Carla-tier deals; founder-led motion context)
- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` — Channel strategy context for founder-led → AE-led transition
- `docs/drafts/hermes/PRICING.md` — Pre-scale tier pricing (founder-led sales motion implicit)

**Related terms:** PLG motion, Carla, Vera, Chris
**Honest Labeling:** (empirical, cross-Muse triangulated via PERSONAS.md + CHANNEL_MOTIONS_v0.md)
**External reference:** Lenny's Newsletter (https://lennysnewsletter.com) — founder-led to PLG transitions

---

### FP&A (Financial Planning & Analysis)

**Definition:** The function within a finance team responsible for budgeting, forecasting, scenario modeling, and supporting strategic decisions. FP&A teams use the product surface in scope for this project.

**In our product:** `docs/ARCHITECTURE.md` (FP&A engine, OLAP, scenario engine) — the entire product is an FP&A tool.

**Related terms:** Forecast, Scenario, Budget vs Actual, Sensitivity Analysis, DCF
**External reference:** AFP, "FP&A" (https://afponline.org)

---

### Forecast

**Definition:** A projection of future financial outcomes based on historical data, assumptions, and models. Rolling forecasts are continuously updated; static forecasts are fixed at a point in time. Pairs with Budget vs Actual variance reporting.

**In our product:** `docs/ARCHITECTURE.md` (forecast engine), `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel revenue forecasts).

**Related terms:** Budget vs Actual, Scenario, Sensitivity Analysis, FP&A
**External reference:** CFI, "Financial Forecasting" (https://corporatefinanceinstitute.com)

---

## G

### GRR (Gross Revenue Retention)

**Definition:** The percentage of recurring revenue retained from existing customers, EXCLUDING expansion revenue. GRR = (Starting MRR - Churned MRR - Contraction MRR) ÷ Starting MRR. Always ≤ 100%. A floor metric; paired with NRR (which includes expansion) to show net growth. GRR < 80% is a red flag; > 90% is best-in-class.

**In our product (Three-Witnesses):**

- `docs/GLOSSARY.md:NRR` (v0.1 entry) — natural complement
- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` — Channel retention modeling
- Cross-link to Churn, NRR, MRR (retention stack)

**Related terms:** NRR, Churn, ARR, MRR
**Honest Labeling:** (empirical, cross-Muse triangulated via CHANNEL_MOTIONS_v0.md + NRR entry)
**External reference:** OpenView Partners 2024 SaaS Benchmarks (https://openviewpartners.com)

---

## H

### Honest Labeling (Muses cohort discipline)

**Definition:** A cohort discipline requiring every Muse to honestly label the certainty/limitations of every claim in drafts — distinguishing between "verified via D-009", "self-revalidated only", "inferred from context", and "fabricated/placeholder". Codified during cycle 5 after multiple v0.1/v0.2 self-revalidations missed architectural shifts. Replaces silent confidence with explicit epistemic flags.

**In our product (Three-Witnesses):**

- `docs/drafts/TASKBOARD.md:500-505` — Honest Labeling 5-Muses cohort formation
- `docs/drafts/TASKBOARD.md:664-673` — Honest Labeling propagated to 6-Muses (Prometheus added)
- `docs/drafts/TASKBOARD.md:762-767, 874-909` — Honest Labeling applied in cycles 5-6
- `docs/drafts/athena/BOARD_SCAN_D001_D009_ERRATUM_2026-06-13.md` — Explicit use in T-AT-009 erratum (9th Honest Labeling moment + 6th D-009 codification: "D-009 violation can appear in your own audit claims")

**Related terms:** D-009 framework, pre-write, ICP-numbering
**Honest Labeling:** (internal cohort discipline, not externally documented — self-referential)
**External reference:** Internal discipline (TASKBOARD.md)

---

## I

### ICP-numbering (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3)

**Definition:** The canonical numbering scheme for ICP personas across all Muses. Carla (Strategic CFO) = ICP-1, Vera (Technical VP Finance) = ICP-2, Chris (Tactical Controller) = ICP-3. Numbering was established in cycle 5 after Felix (original VP-Eng persona) was reconciled into Vera to avoid persona proliferation. All Muse cross-references to personas MUST use this scheme to avoid ambiguity.

**In our product (Three-Witnesses):**

- `docs/ARCHITECTURE.md:246` — "ICP-1 (Carla) / ICP-2 (Vera) / ICP-3 (Chris)"
- `docs/ARCHITECTURE.md:585` — Cross-Muse ICP-numbering reference
- `docs/drafts/TASKBOARD.md:497` — Felix→Vera reconciliation (origin of canonical numbering)
- `docs/drafts/iris/PERSONAS.md` — Three personas with ICP-1/2/3 labels

**Related terms:** Carla, Vera, Chris, D-009 framework
**Honest Labeling:** (internal cohort discipline, not externally documented)
**External reference:** Internal decision (TASKBOARD.md, ARCHITECTURE.md)

---

### IRR (Internal Rate of Return)

**Definition:** The discount rate that makes the NPV of a series of cash flows equal to zero. Used in capital budgeting to rank projects or investments. The higher the IRR, the more desirable the investment. A project is acceptable if IRR > required rate of return (hurdle rate).

**In our product:** `docs/ARCHITECTURE.md` (scenario engine IRR calculation), `docs/drafts/hermes/PRICING.md` (valuation context).

**Related terms:** NPV, DCF, Sensitivity Analysis
**External reference:** McKinsey, "Valuation: Measuring and Managing the Value of Companies"

---

## L

### LTV (Lifetime Value)

**Definition:** The total revenue a customer is expected to generate over the lifetime of the relationship. LTV = ARPU × Gross Margin ÷ Churn Rate (simplified). The LTV/CAC ratio is the canonical SaaS efficiency metric; > 3 is healthy, > 5 is exceptional.

**In our product:** `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel LTV modeling), `docs/ARCHITECTURE.md` (churn engine for LTV input).

**Related terms:** CAC, Payback period, ARPU, Churn
**External reference:** David Skok, "SaaS Metrics 2.0" (https://saasmetrics2.com)

---

## M

### Monte Carlo

**Definition:** A simulation method that uses repeated random sampling to compute the probability distribution of an outcome. Used in FP&A for risk modeling, scenario analysis, and confidence-interval estimation around forecasts (e.g., "P50 / P90 revenue outcomes").

**In our product:** `docs/ARCHITECTURE.md` (Monte Carlo engine), `docs/drafts/athena/SENSITIVITY-v0.1.md` (sensitivity pre-write).

**Related terms:** Sensitivity Analysis, Scenario, Forecast
**External reference:** Wikipedia, "Monte Carlo method" (https://en.wikipedia.org/wiki/Monte_Carlo_method)

---

### MRR (Monthly Recurring Revenue)

**Definition:** The normalized monthly value of all recurring subscription contracts. MRR × 12 ≈ ARR (when contracts are stable). The granular (monthly) counterpart to ARR; used for tracking growth velocity and detecting inflection points.

**In our product:** `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel MRR modeling), `docs/ARCHITECTURE.md` (revenue engine).

**Related terms:** ARR, NRR, GRR, ARPU
**External reference:** SaaS Capital, "MRR" (https://saascapital.com)

---

## N

### NPV (Net Present Value)

**Definition:** The sum of the present values of all future cash flows (positive and negative) over the life of an investment, discounted at the required rate of return. NPV > 0 means the investment is value-accretive at the discount rate. The gold-standard capital-budgeting metric.

**In our product:** `docs/ARCHITECTURE.md` (DCF engine NPV calculation), `docs/drafts/hermes/PRICING.md` (valuation context).

**Related terms:** DCF, IRR, Sensitivity Analysis
**External reference:** Damodaran, "Investment Valuation" (https://pages.stern.nyu.edu/~adamodar)

---

### NRR (Net Revenue Retention)

**Definition:** The percentage of recurring revenue retained from existing customers, INCLUDING expansion revenue (upsell, cross-sell). NRR = (Starting MRR + Expansion MRR - Churned MRR - Contraction MRR) ÷ Starting MRR. Can exceed 100% if expansion > churn. Best-in-class SaaS NRR is 120%+.

**In our product (v0.2 cross-link enhancement):** Cross-link to GRR (which excludes expansion), Churn, MRR. See `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel NRR modeling), `docs/ARCHITECTURE.md` (retention engine).

**Related terms:** GRR, Churn, MRR, ARR (v0.2 cross-link added)
**External reference:** OpenView Partners, "Net Dollar Retention" (https://openviewpartners.com)

---

## O

### OLAP

**Definition:** Online Analytical Processing. A category of database technology optimized for multidimensional analytical queries (slice, dice, drill-down, roll-up). The data layer beneath FP&A tools. Contrasts with OLTP (transactional processing).

**In our product:** `docs/ARCHITECTURE.md` (OLAP cube structure for FP&A scenarios).

**Related terms:** FP&A, Forecast, Scenario
**External reference:** Wikipedia, "OLAP" (https://en.wikipedia.org/wiki/OLAP_cube)

---

## P

### P&L (Profit & Loss Statement)

**Definition:** A financial statement summarizing a company's revenues, expenses, and profits over a period. Also called the Income Statement. Pairs with the Balance Sheet (point-in-time) and Cash Flow Statement (period).

**In our product:** `docs/ARCHITECTURE.md` (P&L engine), `docs/drafts/hermes/PRICING.md` (P&L line items for tier modeling).

**Related terms:** Balance Sheet, Cash Flow, COGS, EBITDA
**External reference:** IFRS IAS 1, US GAAP ASC 220

---

### Payback period

**Definition:** The number of months required for a customer's cumulative gross profit to recover their Customer Acquisition Cost (CAC). SaaS benchmark: <12 months (good), 12-18 (mediocre), >24 (concerning). Function of ARPU, churn, and gross margin. Critical because shorter payback = faster reinvestment flywheel.

**In our product (Three-Witnesses):**

- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md:82` — Channel economics ("$5,988 ARPU" → payback modeling)
- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md:307, 336` — Payback referenced in motion scoring
- `docs/drafts/hermes/PRICING.md` — Payback context for tier pricing

**Related terms:** ACV, ARPU, CAC, LTV
**Honest Labeling:** (empirical, cross-Muse triangulated via CHANNEL_MOTIONS_v0.md + PRICING.md)
**External reference:** David Skok, "SaaS Metrics 2.0" (https://saasmetrics2.com)

---

### PLG motion (Product-Led Growth)

**Definition:** A go-to-market motion where the product itself drives acquisition, conversion, and expansion — typically via free tier, in-product viral loops, and self-serve checkout. Minimizes human-led sales. Best fit for low-ACV, high-velocity ICPs (e.g., SMB, individual contributors, technical buyers). Contrasts with sales-led (AE/SDR-led enterprise) and founder-led motions.

**In our product (Three-Witnesses):**

- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md:439` — "ICP-3 (Chris, FP&A Lead) as the PLG secondary" (Chris as PLG motion anchor; ICP-numbering note footer)
- `docs/drafts/iris/PERSONAS.md:189-198` — Chris's PLG profile ("if the first 7 days are confusing, Chris is gone")
- `docs/drafts/iris/PERSONAS.md:7` — Day-in-the-life PLG test

**Related terms:** founder-led motion, Day-7 activation, Chris, switching cost perception
**Honest Labeling:** (TENTATIVE per D-007 — 1 of 3 anchors is weak: CHANNEL_MOTIONS_v0.md:439 is a footer note, not a primary PLG reference; PERSONAS.md anchors are stronger)
**External reference:** OpenView Partners, "Product-Led Growth" (https://openviewpartners.com), Wes Bush (https://productled.com)

---

### pre-write (D-007 pre-write cohort pattern)

**Definition:** Decision D-007 in the Muse cohort task board. A discipline requiring Muses to publish a "pre-write" (stub with claim-by-claim verification plan) BEFORE writing the final document, then cohort-review the pre-write for completeness, accuracy, and source-anchoring. Catches architectural fabrications and scope creep before they propagate. The standard 5-iteration discipline is: v0.1 pre-write → v0.2 self-revalidate → v0.3 Athena revalidate → v0.4 carryover → v1.1 polish.

**In our product (Three-Witnesses):**

- `docs/drafts/TASKBOARD.md:262, 264, 290, 299, 302, 416, 417, 419-421` — D-007 pre-write pattern references
- `docs/drafts/TASKBOARD.md:545, 549-551, 565, 691` — D-007 applied across cycles
- `docs/ONBOARDING.md` — T-MN-003 v0.1 (cycle 7, 295L) followed pre-write pattern

**Related terms:** D-009 framework, Honest Labeling, ICP-numbering
**Honest Labeling:** (internal cohort discipline, not externally documented)
**External reference:** Internal decision (TASKBOARD.md)

---

## R

### Runway

**Definition:** The number of months a company can continue operating at its current burn rate before exhausting cash reserves. Runway = Current Cash ÷ Net Monthly Burn. Critical fundraising signal; < 6 months triggers urgent raise, > 18 months provides comfort.

**In our product:** `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel runway scenarios), `docs/ARCHITECTURE.md` (cash flow engine).

**Related terms:** Burn Rate, Cash Flow, FP&A
**External reference:** Y Combinator, "Runway Calculator" (https://ycombinator.com)

---

## S

### Scenario

**Definition:** A coherent set of assumptions about the future that produces a complete financial outcome (revenue, costs, cash, P&L). Scenarios differ from sensitivity analyses in that they shift multiple assumptions coherently, not one variable at a time. Typical scenario sets: Base / Bull / Bear.

**In our product:** `docs/ARCHITECTURE.md` (scenario engine), `docs/drafts/athena/SENSITIVITY-v0.1.md` (sensitivity pre-write).

**Related terms:** Sensitivity Analysis, Forecast, Monte Carlo, FP&A
**External reference:** CFI, "Scenario Analysis" (https://corporatefinanceinstitute.com)

---

### Sensitivity Analysis

**Definition:** An analysis that measures how the output of a model changes as one or more inputs are varied, holding all other inputs constant. Used in FP&A to identify which assumptions have the most impact on outcomes (tornado diagrams, spider charts).

**In our product:** `docs/ARCHITECTURE.md` (sensitivity engine), `docs/drafts/athena/SENSITIVITY-v0.1.md` (pre-write cohort).

**Related terms:** Scenario, Monte Carlo, Forecast, FP&A
**External reference:** CFI, "Sensitivity Analysis" (https://corporatefinanceinstitute.com)

---

### switching cost perception

**Definition:** The buyer's PERCEIVED cost of leaving the current solution — distinct from actual switching cost. High switching cost perception is a moat; low switching cost perception = high churn risk. Especially relevant when product is "good enough but not entrenched". Affected by data lock-in, workflow integration, team buy-in, and contract length.

**In our product (Three-Witnesses):**

- `docs/drafts/iris/SWITCHING_COST_ANALYSIS.md:1-60` — Iris T-IR-011 pre-write (analytical framework)
- `docs/drafts/iris/PERSONAS.md:309` — Churn risk row references switching cost implicitly
- Cross-link to Chris (low switching cost = high churn at Day-90)

**Related terms:** Chris, Day-7 activation, Day-90 renewal, Churn
**Honest Labeling:** (empirical, cross-Muse triangulated via SWITCHING_COST_ANALYSIS.md + PERSONAS.md)
**External reference:** Hamilton Helmer, "7 Powers" (https://7powers.com)

---

## V

### Variance

**Definition:** The difference between an actual outcome and a planned (budgeted or forecast) outcome. Variance = Actual - Plan. Favorable vs unfavorable is context-dependent. Reported via Budget vs Actual reports.

**In our product:** `docs/ARCHITECTURE.md` (variance engine), `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (channel variance reporting).

**Related terms:** Budget vs Actual, Forecast, FP&A
**External reference:** CFI, "Variance Analysis" (https://corporatefinanceinstitute.com)

---

### Vera (ICP-2 persona)

**Definition:** The canonical Technical Buyer / VP Finance / VP Engineering persona, designated ICP-2 in the Muse cohort ICP-numbering scheme. $50-300K ACV, 6-9 month sales cycle. Created during the Felix→Vera reconciliation in cycle 5 to consolidate two near-identical technical-buyer personas into one canonical name. Anchors the technical-buyer segment of the product strategy.

**In our product (Three-Witnesses):**

- `docs/drafts/iris/PERSONAS.md:227-291` — Vera persona full spec
- `docs/ARCHITECTURE.md:246, 585` — "ICP-2 (Vera)" canonical reference
- `docs/drafts/hermes/PRICING.md` — Vera-tier pricing context (Business + Enterprise overlap)
- `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` — Vera's role in channel strategy

**Related terms:** ICP-numbering, Carla, Chris, ACV, Payback period
**Honest Labeling:** (internal cohort persona, not externally documented)
**External reference:** Internal persona (PERSONAS.md, ARCHITECTURE.md)

---

## W

### Working Capital

**Definition:** The capital available for day-to-day operations, calculated as Current Assets minus Current Liabilities. Positive working capital = short-term liquidity. Negative working capital = potential solvency issues. A key cash-flow management metric.

**In our product:** `docs/ARCHITECTURE.md` (working capital engine), `docs/drafts/hermes/PRICING.md` (working capital context for tier pricing).

**Related terms:** Balance Sheet, Cash Flow, FP&A
**External reference:** IFRS IAS 1, US GAAP ASC 210

---

## Citation policy (v0.2)

- **Three-Witnesses (D-002):** Every "In our product" anchor in every definition MUST cite a verifiable file:line. If no verifiable anchor exists, the term is marked "(empirical, no internal anchor — external reference only)".
- **D-009 Cross-Muse Triangulation:** Every claim that crosses Muse boundaries (e.g., a math term used by Iris personas) MUST be triangulated against at least 2 independent source docs.
- **Honest Labeling:** Every entry carries an explicit `(empirical, ...)` or `(internal cohort discipline, ...)` flag. No silent confidence.

## Versioning

- **v0.1** (cycle 7, 2026-06-13, T-MN-002): 25 terms, baseline FP&A vocabulary
- **v0.2** (cycle 8, 2026-06-13, T-MN-011): 39 terms — +14 new (4 math + 5 cross-Muse + 5 ICP-movement), NRR cross-link enhancement
- **v0.3** (cycle 8, 2026-06-13, T-AT-014): Athena re-validation — 11 APPLY · 2 MOSTLY OK · 2 NEEDS-FIX · 0 HOLD (91% APPLY rate, 0 new fabrications)
- **v0.4** (cycle 8, 2026-06-13, T-MN-011 v0.4 carryover): 6 Path A self-apply fixes (2 NEEDS-FIX + 2 MOSTLY OK + 8 TASKBOARD.md path drifts + 1 TENTATIVE marker)
- **v1.1 (2026-06-13)**: Path A self-apply polish (header bumps; 7th codification applied retroactively to v0.4 fixes — all 6 file paths Glob-verified)
- **v1.2 (2026-06-13)**: Cascade close ceremony (header bumps only) — **T-MN-011 CLOSED**. 5-iteration discipline: v0.1 → v0.2 → v0.3 → v0.4 → v1.1 → v1.2. 0 net defects across 6 iterations × 30+ cumulative reviews. 14 NEW terms (4 math + 5 cross-Muse + 5 ICP-movement) + NRR cross-link + 6 D-009 codifications adopted (6th, 7th validated in real use).
