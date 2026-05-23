# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 13 of 10: Industry Sector Financial Modeling Guide
## Version 5.0.0 | Generated 2026-05-18 | GROUNDED IN ACTUAL CODEBASE

---

## 0. PURPOSE OF THIS PART

FinPlan Pro supports 15 industry sectors via `src/config/sectors/`.
Each sector has domain-specific KPIs, chart of accounts, budget drivers,
and compliance requirements. This guide ensures the fleet writes
SECTOR-CORRECT financial models — not generic templates.

SECTOR REGISTRY (verified from `src/config/sectors/index.ts`):
  technology, manufacturing, retail, banking, healthcare, energy,
  realestate, construction, insurance, telecom, logistics,
  hospitality, government, education, agriculture

---

## 1. TECHNOLOGY / SaaS

Config: `src/config/sectors/technology.ts`
Modules: saas, revenue, workforce, cash
KPIs: ARR, NRR, Churn, LTV/CAC, Magic Number, Quick Ratio, Gross Margin

### 1.1 Unique Financial Metrics

  ARR (Annual Recurring Revenue)
    Formula: MRR × 12
    Meaning: Total annualized recurring subscription revenue
    Benchmark: $1M+ seed, $10M+ Series A, $50M+ Series B

  MRR (Monthly Recurring Revenue)
    Formula: SUM(active subscriptions × monthly price)
    Meaning: Predictable monthly revenue
    Breakdown: New MRR + Expansion MRR - Contraction MRR - Churned MRR

  NRR (Net Revenue Retention)
    Formula: (Beginning MRR + Expansion - Contraction - Churn) / Beginning MRR × 100
    Benchmark: >120% excellent, 100-120% good, <100% concerning
    Meaning: How much existing customers grow (or shrink) over time

  Logo Churn Rate
    Formula: Customers Lost / Total Customers × 100
    Benchmark: <5% annual, <2% for enterprise SaaS
    Lower is better

  LTV/CAC Ratio
    Formula: (ARPU × Gross Margin %) / Churn Rate / Customer Acquisition Cost
    Benchmark: >3x healthy, >5x excellent
    Meaning: Return on customer acquisition investment

  Magic Number
    Formula: Net New ARR / Sales & Marketing Spend (prior quarter)
    Benchmark: >0.75 = invest more, 0.5-0.75 = efficient, <0.5 = fix GTM
    Meaning: Sales efficiency

  Quick Ratio
    Formula: (New MRR + Expansion MRR) / (Churned MRR + Contraction MRR)
    Benchmark: >4x healthy
    Meaning: Growth efficiency — how much growth vs. loss

  Gross Margin
    Formula: (Revenue - COGS) / Revenue × 100
    Benchmark: 70-85% for SaaS
    COGS includes: hosting, support, DevOps

### 1.2 Chart of Accounts Differences

  UNIQUE TO SaaS:
    - Deferred Revenue (liability) — prepaid subscriptions
    - Unbilled Revenue (asset) — earned but not yet invoiced
    - Customer Acquisition Cost (marketing/sales expense)
    - Hosting & Infrastructure (COGS)
    - Customer Success (COGS or OpEx)
    - R&D Expense (often 20-30% of revenue)

  REVENUE RECOGNITION:
    - Recognize ratably over subscription period
    - Annual prepaid = 1/12 per month recognized
    - Multi-year deals = recognize over contract term
    - Usage-based = recognize as consumed

### 1.3 Key Budget Drivers

  TOP-DOWN: ARR growth target → work backward to needed bookings
  BOTTOM-UP: Sales capacity × quota × win rate → bookings forecast

  BUDGET BUILD:
    1. Start with current ARR and churn assumptions
    2. Add new customer bookings (rep count × quota × win rate)
    3. Add expansion bookings (upsell/cross-sell rate)
    4. Subtract churn (logo churn × ARPU)
    5. Build COGS (hosting scales with customers)
    6. Build OpEx (headcount plan: engineering 40%, S&M 30%, G&A 15%, CS 15%)

### 1.4 Industry-Specific Formulas

  Customer Lifetime: 1 / Monthly Churn Rate
  LTV: ARPU × Customer Lifetime × Gross Margin %
  CAC: Total S&M Spend / New Customers Acquired
  Months to Recover CAC: CAC / (ARPU × Gross Margin %)
  Rule of 40: Revenue Growth % + Profit Margin % > 40%
  Burn Multiple: Net Burn / Net New ARR (lower is better)
  Hype Ratio: Valuation / ARR (compare to peers)

### 1.5 Compliance Requirements

  - ASC 606: Revenue recognition standard (critical for SaaS)
  - SOX: If public company, internal controls over revenue
  - SOC 2: Security compliance for B2B SaaS
  - GDPR: If serving EU customers
  - SaaS-specific: Data residency, uptime SLAs

### 1.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  ARR Growth      | >100%     | 50-100%   | 20-50%     | <20%
  NRR             | >130%     | 110-130%  | 100-110%   | <100%
  Gross Margin    | >80%      | 70-80%    | 60-70%     | <60%
  LTV/CAC         | >5x       | 3-5x      | 1-3x       | <1x
  Magic Number    | >1.0      | 0.75-1.0  | 0.5-0.75   | <0.5
  Burn Multiple   | <1.0      | 1.0-2.0   | 2.0-3.0    | >3.0
  Rule of 40      | >60%      | 40-60%    | 20-40%     | <20%

---

## 2. BANKING / FINANCIAL SERVICES

Config: `src/config/sectors/banking.ts`
Modules: banking, treasury, compliance, tax
KPIs: NIM, CET1, NPL Ratio, Efficiency Ratio, ROA, Cost of Funds, LDR

### 2.1 Unique Financial Metrics

  NIM (Net Interest Margin)
    Formula: (Interest Income - Interest Expense) / Average Earning Assets × 100
    Benchmark: 3.0-3.5%
    Meaning: Core profitability from lending activities

  CET1 Ratio (Common Equity Tier 1)
    Formula: CET1 Capital / Risk-Weighted Assets × 100
    Benchmark: >12% (regulatory minimum 4.5% + buffer 2.5% = 7%)
    Meaning: Capital adequacy — Basel III requirement

  NPL Ratio (Non-Performing Loans)
    Formula: Non-Performing Loans / Total Loans × 100
    Benchmark: <2%
    Lower is better

  Efficiency Ratio
    Formula: Non-Interest Expense / Total Revenue × 100
    Benchmark: <55%
    Lower is better — measures cost efficiency

  ROA (Return on Assets)
    Formula: Net Income / Average Total Assets × 100
    Benchmark: >1.0%

  Loan-to-Deposit Ratio
    Formula: Total Loans / Total Deposits × 100
    Benchmark: 80-90%
    Too high = liquidity risk, too low = inefficient

### 2.2 Chart of Accounts Differences

  UNIQUE TO BANKING:
    - Interest Income (by loan type: commercial, consumer, mortgage)
    - Interest Expense (by deposit type: savings, checking, CDs)
    - Provision for Loan Losses (contra-asset)
    - Non-Interest Income (fees, trading, investment banking)
    - Trading Assets / Liabilities
    - Held-to-Maturity Securities
    - Available-for-Sale Securities
    - Deposits (by type: demand, savings, time)

### 2.3 Key Budget Drivers

  1. Net Interest Income: Loan volume × spread
  2. Provision Expense: Expected credit losses (CECL model)
  3. Non-Interest Income: Fee growth, trading revenue
  4. Non-Interest Expense: Headcount, technology, compliance
  5. Capital: CET1 target, dividend policy, buybacks

### 2.4 Industry-Specific Formulas

  Spread: Weighted Avg Yield on Assets - Weighted Avg Cost of Liabilities
  Leverage Ratio: Tier 1 Capital / Total Exposure × 100
  LCR (Liquidity Coverage Ratio): HQLA / Net Cash Outflows (30-day)
  Cost-to-Income: Operating Expenses / Operating Income × 100
  Risk-Adjusted Return: (Revenue - OpEx - Expected Loss) / Economic Capital

### 2.5 Compliance Requirements

  - Basel III/IV: Capital adequacy, liquidity, leverage
  - CECL (Current Expected Credit Losses): Loan loss provisioning
  - Dodd-Frank: Stress testing, resolution planning
  - BSA/AML: Anti-money laundering
  - CCAR: Comprehensive Capital Analysis and Review
  - SOX: Internal controls over financial reporting

### 2.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  NIM             | >3.5%     | 3.0-3.5%  | 2.5-3.0%   | <2.5%
  CET1            | >13%      | 10-13%    | 7-10%      | <7%
  NPL Ratio       | <1.5%     | 1.5-3%    | 3-5%       | >5%
  Efficiency      | <50%      | 50-60%    | 60-70%     | >70%
  ROA             | >1.2%     | 0.8-1.2%  | 0.5-0.8%   | <0.5%

---

## 3. CONSTRUCTION

Config: `src/config/sectors/construction.ts`
Modules: construction, project, workforce, equipment
KPIs: Gross Profit Margin, Over/Under Billing, Backlog, Job Cost Variance, Retention

### 3.1 Unique Financial Metrics

  Gross Profit Margin (by project)
    Formula: (Contract Revenue - Project Costs) / Contract Revenue × 100
    Benchmark: 15-25% for general contractors

  Over/Under Billing
    Formula: Billings to Date - Earned Revenue (POC method)
    Over-billed = liability (billings > earned)
    Under-billed = asset (earned > billings)

  Backlog
    Formula: Total Contract Value - Revenue Recognized to Date
    Meaning: Remaining work to be performed
    Benchmark: 6-12 months of revenue

  Job Cost Variance
    Formula: Actual Project Cost - Estimated Project Cost
    Positive = over budget (bad)
    Negative = under budget (good)

  Retention
    Formula: Percentage of payment withheld until project completion
    Typical: 5-10% held by owner

### 3.2 Chart of Accounts Differences

  UNIQUE TO CONSTRUCTION:
    - Work-in-Progress (WIP) — asset, not inventory
    - Billings in Excess of Costs (liability)
    - Costs in Excess of Billings (asset)
    - Retention Receivable / Payable
    - Equipment (owned and rented)
    - Subcontractor Costs
    - Bond Costs (bid bonds, performance bonds, payment bonds)
    - Change Orders (contract modifications)

### 3.3 Key Budget Drivers

  1. Project Pipeline: Bids submitted × win rate
  2. Backlog Conversion: Backlog × expected start dates
  3. Project Costs: Materials, labor, subcontractors, equipment
  4. Overhead: Office, insurance, bonding, estimating
  5. Equipment: Owned depreciation + rental expense

### 3.4 Industry-Specific Formulas

  POC (Percentage of Completion): Costs Incurred / Total Estimated Costs × 100
  Earned Revenue: Contract Value × POC %
  Gross Profit: Earned Revenue - Costs Incurred to Date
  Labor Productivity: Earned Hours / Actual Hours
  Equipment Utilization: Hours Used / Hours Available × 100
  Bid Win Rate: Contracts Won / Bids Submitted × 100

### 3.5 Compliance Requirements

  - ASC 606: Revenue recognition for construction contracts
  - Percentage of Completion: Primary method for long-term contracts
  - Retainage Laws: Vary by state
  - Lien Laws: Mechanics lien rights by state
  - Bonding: Surety bond requirements
  - Davis-Bacon: Prevailing wage requirements (federal projects)

### 3.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Gross Margin    | >20%      | 15-20%    | 10-15%     | <10%
  Backlog         | >12 mo    | 6-12 mo   | 3-6 mo     | <3 mo
  Bid Win Rate    | >25%      | 15-25%    | 10-15%     | <10%
  Job Cost Var    | <2%       | 2-5%      | 5-10%      | >10%
  DSO             | <45 days  | 45-60     | 60-90      | >90

---

## 4. EDUCATION

Config: `src/config/sectors/education.ts`
Modules: education, enrollment, grants, endowment
KPIs: Enrollment, Tuition Revenue, Grant Funding, Endowment Yield, Cost per Student

### 4.1 Unique Financial Metrics

  Enrollment Revenue
    Formula: Headcount × Tuition Rate × Collection Rate
    Driven by: Admissions yield, retention, tuition increases

  Cost per Student
    Formula: Total Operating Expenses / FTE Students
    Benchmark: Varies widely by institution type

  Endowment Yield
    Formula: Endowment Distribution / Endowment Market Value × 100
    Typical: 4-5% annual distribution

  Grant Revenue
    Formula: SUM(direct costs + indirect costs) for funded grants
    Indirect Rate: Negotiated with federal government (typically 40-60%)

  Retention Rate
    Formula: Returning Students / Prior Year Students × 100
    Benchmark: >85% for 4-year institutions

### 4.2 Chart of Accounts Differences

  UNIQUE TO EDUCATION:
    - Tuition Revenue (net of scholarships/discounts)
    - Grant Revenue (federal, state, private)
    - Endowment Income
    - Auxiliary Revenue (housing, dining, parking)
    - Scholarships & Discounts (contra-revenue)
    - Restricted vs. Unrestricted Funds
    - Plant Fund (capital projects)

### 4.3 Key Budget Drivers

  1. Enrollment: New + returning students × tuition rate
  2. Financial Aid: Discount rate (scholarships/tuition)
  3. Grants: Funded proposals × success rate
  4. State Appropriation: Per-student funding (public institutions)
  5. Endowment: Market return × distribution rate

### 4.4 Industry-Specific Formulas

  Discount Rate: Institutional Aid / Gross Tuition × 100
  Revenue per FTE: Total Revenue / FTE Students
  Faculty Ratio: FTE Faculty / FTE Students
  Research Expenditures: Direct + Indirect Costs
  Composite Financial Index: (Primary Reserve × 1.65) + (Viability × 1.05) + (Return × 1.07) + (Net Income × 0.36)

### 4.5 Compliance Requirements

  - GASB (Governmental Accounting Standards Board): For public institutions
  - FASB (Financial Accounting Standards Board): For private institutions
  - OMB Uniform Guidance: Federal grant compliance
  - Single Audit: Required if >$750K federal spending
  - IPEDS: Federal reporting requirement
  - NCAA: Athletic compliance (if applicable)

### 4.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Retention       | >90%      | 80-90%    | 70-80%     | <70%
  Discount Rate   | <40%      | 40-50%    | 50-60%     | >60%
  Endowment/Student| >$100K   | $30-100K  | $10-30K    | <$10K
  OpEx Coverage   | >1.1x     | 1.0-1.1x  | 0.9-1.0x   | <0.9x

---

## 5. ENERGY / UTILITIES

Config: `src/config/sectors/energy.ts`
Modules: energy, esg, capex, compliance
KPIs: Reserve Replacement, Lifting Cost, Carbon Intensity, Availability, CapEx/MW, Safety, Renewable Mix

### 5.1 Unique Financial Metrics

  Reserve Replacement Ratio
    Formula: New Reserves Added / Reserves Produced × 100
    Benchmark: >100% (replacing what you produce)

  Lifting Cost per BOE
    Formula: Production Costs / Barrels of Oil Equivalent Produced
    Lower is better
    Benchmark: $10-20/BOE

  Carbon Intensity
    Formula: CO2 Emitted / Revenue or Production
    Lower is better
    Trend: Declining with ESG pressure

  Plant Availability Factor
    Formula: Hours Available for Service / Total Hours × 100
    Benchmark: >93% for thermal, >98% for renewables

  CapEx per MW
    Formula: Capital Expenditure / Megawatts Installed
    Benchmark: $1-2M/MW for solar, $1.5-3M/MW for wind

### 5.2 Chart of Accounts Differences

  UNIQUE TO ENERGY:
    - Exploration Costs (expensed or capitalized)
    - Proved Reserves (disclosure, not on balance sheet)
    - DD&A (Depletion, Depreciation, Amortization) by asset
    - Decommissioning Provision (asset retirement obligation)
    - Commodity Hedging Gains/Losses
    - Production Sharing Agreements
    - Renewable Energy Credits (RECs)

### 5.3 Key Budget Drivers

  1. Production Volume: Reserves × decline rate + new wells
  2. Commodity Price: Oil/gas price assumptions (sensitivity!)
  3. Capital Program: Drilling, facilities, renewable projects
  4. Operating Costs: Lifting, processing, transportation
  5. Hedging: Forward contracts to lock in prices

### 5.4 Industry-Specific Formulas

  BOE Conversion: 1 barrel oil = 6,000 cubic feet gas = 1 BOE
  Finding & Development Cost: Total F&D CapEx / New Reserves Added
  NPV10: Net present value at 10% discount rate
  Payout Period: Time to recover drilling cost from cash flow
  Decline Rate: Annual production decrease %
  EROEI (Energy Return on Energy Invested): Energy Produced / Energy Consumed

### 5.5 Compliance Requirements

  - SEC Regulation S-X: Reserve reporting
  - EPA: Emissions reporting, environmental compliance
  - FERC: Utility regulation
  - SOX: Internal controls (if public)
  - ESG Reporting: TCFD, SASB, GRI
  - Decommissioning: Asset retirement obligations

### 5.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Reserve Replace | >120%     | 100-120%  | 80-100%    | <80%
  Lifting Cost    | <$12/BOE  | $12-20    | $20-30     | >$30
  Availability    | >95%      | 90-95%    | 85-90%     | <85%
  Debt/EBITDA     | <1.5x     | 1.5-2.5x  | 2.5-4x     | >4x

---

## 6. GOVERNMENT / PUBLIC SECTOR

Config: `src/config/sectors/government.ts`
Modules: government, fund, compliance, audit
KPIs: Fund Balance, Budget Variance, Debt per Capita, Revenue Growth, Operating Surplus

### 6.1 Unique Financial Metrics

  Fund Balance
    Formula: Fund Assets - Fund Liabilities
    Types: Nonspendable, Restricted, Committed, Assigned, Unassigned
    Benchmark: 15-25% of expenditures

  Budget Variance
    Formula: Actual Revenue/Expenditure - Budgeted Revenue/Expenditure
    Positive on revenue = good (more than expected)
    Negative on expenditure = good (less than expected)

  Debt per Capita
    Formula: Total Outstanding Debt / Population
    Benchmark: <3% of personal income

  Operating Surplus
    Formula: Total Revenue - Total Expenditures
    Should be positive (balanced budget requirement)

### 6.2 Chart of Accounts Differences

  UNIQUE TO GOVERNMENT:
    - Fund Accounting (General Fund, Special Revenue, Capital, Debt Service, Enterprise)
    - Appropriations (budget authority)
    - Encumbrances (committed but not yet spent)
    - Interfund Transfers
    - Tax Revenue (property, sales, income)
    - Grants (federal, state)
    - Capital Assets (infrastructure, buildings, vehicles)

### 6.3 Key Budget Drivers

  1. Tax Revenue: Property tax base × rate, sales tax collections
  2. Intergovernmental Revenue: State/federal formula allocations
  3. Service Charges: Fees for services (utilities, permits, fines)
  4. Personnel: Salaries, benefits, pensions (60-70% of budget)
  5. Capital: Infrastructure maintenance, new construction

### 6.4 Industry-Specific Formulas

  Property Tax Levy: Assessed Value × Mill Rate / 1000
  Sales Tax Revenue: Taxable Sales × Tax Rate
  Pension Funded Ratio: Plan Assets / Plan Liabilities × 100
  Debt Service Coverage: Revenue Available for Debt Service / Debt Service
  Unassigned Fund Balance %: Unassigned Fund Balance / Total Fund Balance × 100

### 6.5 Compliance Requirements

  - GASB Standards: Government accounting (GASB 34 for infrastructure)
  - Single Audit: Federal grant compliance
  - Truth-in-Bonding: Debt disclosure requirements
  - Levy Limits: Property tax increase caps
  - Fund Balance Policies: Minimum reserves
  - Transparency: Public financial reporting

### 6.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Fund Balance    | >20%      | 15-20%    | 10-15%     | <10%
  Debt/Population | <$2,000   | $2-5K     | $5-10K     | >$10K
  Pension Funded  | >80%      | 60-80%    | 40-60%     | <40%
  Budget Var      | <3%       | 3-5%      | 5-10%      | >10%

---

## 7. HEALTHCARE

Config: `src/config/sectors/healthcare.ts`
Modules: healthcare, workforce, revenue, compliance
KPIs: LOS, Occupancy, Denial Rate, AR Days, EBITDAR, Patient Satisfaction, Staff Ratio

### 7.1 Unique Financial Metrics

  Average Length of Stay (LOS)
    Formula: Total Patient Days / Total Discharges
    Benchmark: 4-5 days (acute care)
    Lower is better (efficiency)

  Bed Occupancy Rate
    Formula: Patient Days / (Available Beds × Days in Period) × 100
    Benchmark: 85-90%
    Too low = inefficiency, too high = capacity strain

  Claim Denial Rate
    Formula: Denied Claims / Total Claims × 100
    Benchmark: <5%
    Lower is better

  Days in A/R
    Formula: Accounts Receivable / (Net Revenue / Days in Period)
    Benchmark: <40 days
    Lower is better

  EBITDAR Margin
    Formula: (Earnings before Interest, Tax, Depreciation, Amortization, Rent) / Revenue × 100
    Benchmark: 15-20%

### 7.2 Chart of Accounts Differences

  UNIQUE TO HEALTHCARE:
    - Patient Service Revenue (gross)
    - Contractual Adjustments (contra-revenue)
    - Charity Care (contra-revenue)
    - Bad Debt Expense
    - Case Mix Index adjustments
    - DRG-based revenue
    - Payer-specific revenue (Medicare, Medicaid, Commercial, Self-Pay)

### 7.3 Key Budget Drivers

  1. Patient Volume: Admissions × case mix × payer mix
  2. Reimbursement: Payer rates, DRG weights, value-based contracts
  3. Labor: Nursing ratios, overtime, agency staffing
  4. Supplies: Medical supplies, pharmaceuticals
  5. Capital: Equipment, facility upgrades, IT

### 7.4 Industry-Specific Formulas

  Case Mix Index: SUM(DRG Weight × Discharges) / Total Discharges
  Revenue per Discharge: Net Patient Revenue / Discharges
  Cost per Discharge: Total Operating Expenses / Discharges
  FTEs per Adjusted Occupied Bed: Total FTEs / Adjusted Occupied Beds
  CMI-Adjusted Revenue: Revenue / Case Mix Index

### 7.5 Compliance Requirements

  - HIPAA: Patient data protection
  - CMS Conditions of Participation
  - Stark Law: Physician self-referral
  - Anti-Kickback Statute
  - RAC Audits: Recovery Audit Contractor
  - EMTALA: Emergency treatment requirements
  - Joint Commission: Accreditation

### 7.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  LOS             | <4 days   | 4-5 days  | 5-6 days   | >6 days
  Occupancy       | 85-90%    | 75-85%    | 65-75%     | <65%
  Denial Rate     | <3%       | 3-5%      | 5-8%       | >8%
  AR Days         | <35       | 35-45     | 45-60      | >60
  EBITDAR Margin  | >18%      | 12-18%    | 8-12%      | <8%

---

## 8. HOSPITALITY

Config: `src/config/sectors/hospitality.ts`
Modules: hospitality, revenue, workforce, f&b
KPIs: RevPAR, ADR, Occupancy, F&B Revenue, GOP, Guest Satisfaction, Labor Cost %

### 8.1 Unique Financial Metrics

  RevPAR (Revenue per Available Room)
    Formula: ADR × Occupancy Rate
    OR: Total Room Revenue / Available Rooms
    Benchmark: $80-200 (varies by market/tier)

  ADR (Average Daily Rate)
    Formula: Total Room Revenue / Rooms Sold
    Benchmark: $100-300 (varies by tier)

  Occupancy Rate
    Formula: Rooms Sold / Available Rooms × 100
    Benchmark: 65-75%

  GOP (Gross Operating Profit)
    Formula: Total Revenue - Total Operating Expenses
    GOP Margin: GOP / Total Revenue × 100
    Benchmark: 30-40%

  F&B Revenue per Available Room
    Formula: Total F&B Revenue / Available Rooms
    Benchmark: $20-60 per available room per day

### 8.2 Chart of Accounts Differences

  UNIQUE TO HOSPITALITY:
    - Room Revenue (by channel: direct, OTA, corporate)
    - F&B Revenue (restaurant, bar, banquet, room service)
    - Spa/Recreation Revenue
    - Other Revenue (parking, resort fees, minibar)
    - Rooms Division Expenses
    - F&B Cost of Sales (food cost %)
    - Franchise Fees (typically 5-6% of room revenue)
    - Management Fees (typically 3% of revenue + 8% of GOP)

### 8.3 Key Budget Drivers

  1. Room Demand: Market demand × market share × pricing strategy
  2. ADR: Rate strategy, seasonality, group vs. transient mix
  3. F&B: Covers per day × average check
  4. Labor: Staff per room ratio, wage rates
  5. Capital: FF&E reserve (4-5% of revenue)

### 8.4 Industry-Specific Formulas

  TREVPAR (Total RevPAR): Total Revenue / Available Rooms
  CPOR (Cost per Occupied Room): Total Operating Costs / Rooms Sold
  Flow-Through: Change in GOP / Change in Revenue × 100
  RevPAR Index: Hotel RevPAR / Market RevPAR × 100 (STR Report)
  Food Cost %: Cost of Food Sold / Food Revenue × 100
  Beverage Cost %: Cost of Beverages Sold / Beverage Revenue × 100

### 8.5 Compliance Requirements

  - ADA: Americans with Disabilities Act
  - Fire Safety: NFPA codes
  - Health Department: Food safety, pool safety
  - Franchise Agreements: Brand standards compliance
  - STR Report: Industry benchmarking participation
  - Local Taxes: Occupancy tax, tourism tax

### 8.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  RevPAR          | >$150     | $80-150   | $50-80     | <$50
  Occupancy       | >75%      | 65-75%    | 55-65%     | <55%
  GOP Margin      | >35%      | 25-35%    | 15-25%     | <15%
  Food Cost %     | <28%      | 28-32%    | 32-35%     | >35%
  Labor Cost %    | <30%      | 30-35%    | 35-40%     | >40%

---

## 9. INSURANCE

Config: `src/config/sectors/insurance.ts`
Modules: insurance, claims, reserves, compliance
KPIs: Loss Ratio, Combined Ratio, Expense Ratio, Reserve Adequacy, Premium Growth

### 9.1 Unique Financial Metrics

  Loss Ratio
    Formula: (Incurred Losses + Loss Adjustment Expenses) / Earned Premiums × 100
    Benchmark: <65% (P&C), <80% (Health)

  Combined Ratio
    Formula: Loss Ratio + Expense Ratio
    Benchmark: <100% = underwriting profit
    >100% = underwriting loss (must be offset by investment income)

  Expense Ratio
    Formula: Underwriting Expenses / Written Premiums × 100
    Benchmark: <30%

  Reserve Adequacy
    Formula: Actual Losses vs. Reserved Amounts
    Monitored via: Actuarial studies, IBNR estimates

  Premium Growth
    Formula: (Current Premium - Prior Premium) / Prior Premium × 100
    Benchmark: 5-10% annually

### 9.2 Chart of Accounts Differences

  UNIQUE TO INSURANCE:
    - Written Premium (gross)
    - Earned Premium (recognized over policy period)
    - Unearned Premium Reserve (liability)
    - Loss Reserves (case reserves + IBNR)
    - Loss Adjustment Expense (LAE)
    - Reinsurance Recoverables
    - Ceded Premium
    - Deferred Acquisition Costs (DAC)

### 9.3 Key Budget Drivers

  1. Premium Volume: Policies sold × average premium
  2. Loss Development: Historical loss trends, inflation
  3. Investment Income: Portfolio yield, realized gains
  4. Expenses: Acquisition, general, claims handling
  5. Reinsurance: Cession rate, treaty terms

### 9.4 Industry-Specific Formulas

  Pure Loss Ratio: Incurred Losses / Earned Premiums
  Frequency: Number of Claims / Exposure Units
  Severity: Total Losses / Number of Claims
  IBNR: Incurred But Not Reported reserves (actuarial estimate)
  Retention Rate: Renewed Policies / Expiring Policies × 100
  Combined Ratio (Calendar Year): Loss Ratio + Expense Ratio
  Operating Ratio: Combined Ratio - Investment Yield

### 9.5 Compliance Requirements

  - Statutory Accounting (SAP): Primary accounting basis
  - Risk-Based Capital (RBC): Minimum capital requirements
  - NAIC Reporting: Annual/statutory filings
  - ORSA: Own Risk and Solvency Assessment
  - State Insurance Regulations: Rate filings, form approvals
  - Solvency II: If operating in EU

### 9.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Combined Ratio  | <95%      | 95-100%   | 100-105%   | >105%
  Loss Ratio      | <60%      | 60-70%    | 70-80%     | >80%
  Expense Ratio   | <25%      | 25-30%    | 30-35%     | >35%
  RBC Ratio       | >500%     | 300-500%  | 200-300%   | <200%
  Reserve/Premium | >100%     | 80-100%   | 60-80%     | <60%

---

## 10. LOGISTICS / TRANSPORTATION

Config: `src/config/sectors/logistics.ts`
Modules: logistics, fleet, fuel, operations
KPIs: Revenue per Mile, Cost per Mile, Fleet Utilization, On-Time Delivery, Fuel Efficiency

### 10.1 Unique Financial Metrics

  Revenue per Mile
    Formula: Total Revenue / Total Miles Driven
    Benchmark: $2.00-3.50 (truckload)

  Cost per Mile
    Formula: Total Operating Cost / Total Miles Driven
    Components: Fuel (30%), Driver (25%), Equipment (20%), Insurance (10%), Maintenance (15%)

  Fleet Utilization
    Formula: Revenue Miles / Total Available Miles × 100
    Benchmark: >85%

  On-Time Delivery
    Formula: On-Time Deliveries / Total Deliveries × 100
    Benchmark: >95%

  Fuel Efficiency
    Formula: Miles Driven / Gallons Consumed
    Benchmark: 6-8 MPG (trucks), varies by equipment

### 10.2 Chart of Accounts Differences

  UNIQUE TO LOGISTICS:
    - Freight Revenue (by mode: truckload, LTL, intermodal)
    - Fuel Expense (largest variable cost)
    - Driver Wages & Benefits
    - Equipment Lease/Depreciation
    - Maintenance & Repairs
    - Insurance (auto liability, cargo, workers comp)
    - Tolls & Permits
    - Terminal & Warehouse Costs

### 10.3 Key Budget Drivers

  1. Volume: Loads × rate per load
  2. Fuel: Price per gallon × consumption
  3. Drivers: Headcount × compensation
  4. Equipment: Fleet size × utilization × cost per unit
  5. Insurance: Premium rates, claims history

### 10.4 Industry-Specific Formulas

  Deadhead %: Empty Miles / Total Miles × 100 (lower is better)
  Revenue per Truck per Week: Weekly Revenue / Active Trucks
  Driver Turnover Cost: Recruiting + Training + Lost Productivity
  Cost per Shipment: Total Cost / Total Shipments
  Warehouse Cost per Order: Warehouse Costs / Orders Fulfilled

### 10.5 Compliance Requirements

  - DOT/FMCSA: Hours of Service, drug testing
  - IFTA: International Fuel Tax Agreement
  - IRP: International Registration Plan
  - ELD: Electronic Logging Device mandate
  - CSA: Compliance, Safety, Accountability scores
  - Hazmat: If applicable

### 10.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Operating Ratio | <85%      | 85-92%    | 92-97%     | >97%
  Fleet Utilize   | >90%      | 85-90%    | 80-85%     | <80%
  On-Time         | >97%      | 95-97%    | 90-95%     | <90%
  Driver Turnover | <50%      | 50-75%    | 75-100%    | >100%

---

## 11. MANUFACTURING

Config: `src/config/sectors/manufacturing.ts`
Modules: manufacturing, inventory, quality, supply-chain
KPIs: Gross Margin, Inventory Turns, OEE, Yield, Scrap Rate, WIP Days

### 11.1 Unique Financial Metrics

  Gross Margin
    Formula: (Revenue - COGS) / Revenue × 100
    Benchmark: 25-40% (varies by sub-industry)

  Inventory Turns
    Formula: COGS / Average Inventory
    Benchmark: 6-12 turns per year
    Higher is better

  OEE (Overall Equipment Effectiveness)
    Formula: Availability × Performance × Quality × 100
    Benchmark: >85% (world-class)
    Components: Uptime × Speed × Good Units

  Yield
    Formula: Good Units / Total Units Produced × 100
    Benchmark: >95%

  Scrap Rate
    Formula: Scrap Units / Total Units Produced × 100
    Benchmark: <3%
    Lower is better

  WIP Days
    Formula: WIP Inventory / (COGS / 365)
    Benchmark: <15 days

### 11.2 Chart of Accounts Differences

  UNIQUE TO MANUFACTURING:
    - Raw Materials Inventory
    - Work-in-Progress (WIP) Inventory
    - Finished Goods Inventory
    - COGS (by component: materials, labor, overhead)
    - Manufacturing Overhead (indirect labor, utilities, depreciation)
    - Standard Cost Variance (material, labor, overhead)
    - Warranty Expense

### 11.3 Key Budget Drivers

  1. Production Volume: Demand forecast × safety stock
  2. Material Costs: BOM × commodity prices
  3. Labor: Headcount × wage rate × efficiency
  4. Overhead: Fixed costs (depreciation, rent) + variable costs (utilities)
  5. CapEx: Equipment, tooling, facility upgrades

### 11.4 Industry-Specific Formulas

  COGS Build-Up: Direct Materials + Direct Labor + Manufacturing Overhead
  Standard Cost: Predetermined cost per unit
  Material Price Variance: (Actual Price - Standard Price) × Actual Quantity
  Labor Efficiency Variance: (Actual Hours - Standard Hours) × Standard Rate
  Throughput: Units Produced / Time Period
  Capacity Utilization: Actual Output / Maximum Capacity × 100

### 11.5 Compliance Requirements

  - ISO 9001: Quality management
  - ISO 14001: Environmental management
  - OSHA: Workplace safety
  - EPA: Emissions, waste disposal
  - SOX: Inventory controls (if public)
  - Industry-specific: FDA (food/pharma), AS9100 (aerospace)

### 11.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Gross Margin    | >35%      | 25-35%    | 15-25%     | <15%
  Inventory Turns | >10       | 6-10      | 4-6        | <4
  OEE             | >85%      | 70-85%    | 55-70%     | <55%
  Yield           | >97%      | 95-97%    | 90-95%     | <90%
  WIP Days        | <10       | 10-20     | 20-30      | >30

---

## 12. REAL ESTATE

Config: `src/config/sectors/realestate.ts`
Modules: realestate, property, lease, capex
KPIs: Cap Rate, NOI, DSCR, LTV, Occupancy, Rent Roll

### 12.1 Unique Financial Metrics

  Cap Rate (Capitalization Rate)
    Formula: NOI / Property Value × 100
    Benchmark: 4-10% (varies by property type and market)
    Higher = higher return, higher risk

  NOI (Net Operating Income)
    Formula: Gross Rental Income - Operating Expenses
    Excludes: Debt service, capital expenditures, depreciation

  DSCR (Debt Service Coverage Ratio)
    Formula: NOI / Annual Debt Service
    Benchmark: >1.25x
    Meaning: Can property cash flow cover mortgage payments?

  LTV (Loan-to-Value)
    Formula: Loan Amount / Property Value × 100
    Benchmark: <75% (conventional), <65% (commercial)

  Occupancy Rate
    Formula: Occupied Space / Total Available Space × 100
    Benchmark: >90%

### 12.2 Chart of Accounts Differences

  UNIQUE TO REAL ESTATE:
    - Rental Income (by tenant, by unit)
    - Operating Expenses (by category: taxes, insurance, maintenance, management)
    - Capital Improvements (not expensed — capitalized)
    - Tenant Improvements (TI)
    - Leasing Commissions
    - Straight-Line Rent Adjustment
    - Deferred Rent Receivable

### 12.3 Key Budget Drivers

  1. Rental Income: Occupancy × rent per sq ft × total sq ft
  2. Operating Expenses: Per sq ft cost assumptions
  3. Capital: Improvements, deferred maintenance
  4. Debt: Mortgage terms, refinancing
  5. Acquisitions/Dispositions: New properties, sales

### 12.4 Industry-Specific Formulas

  Price per Sq Ft: Property Value / Total Square Feet
  Rent per Sq Ft: Annual Rent / Leased Square Feet
  Break-Even Occupancy: Fixed Costs / (Revenue per Sq Ft - Variable Cost per Sq Ft)
  Cash-on-Cash Return: Annual Pre-Tax Cash Flow / Total Cash Invested × 100
  GRM (Gross Rent Multiplier): Property Price / Gross Annual Rent

### 12.5 Compliance Requirements

  - FASB ASC 842: Lease accounting
  - Fair Housing Act: Anti-discrimination
  - ADA: Accessibility
  - Environmental: Phase I/II assessments
  - Zoning: Local land use regulations
  - Rent Control: Where applicable

### 12.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Cap Rate        | >7%       | 5-7%      | 4-5%       | <4%
  DSCR            | >1.5x     | 1.25-1.5x | 1.0-1.25x  | <1.0x
  Occupancy       | >95%      | 90-95%    | 85-90%     | <85%
  LTV             | <60%      | 60-70%    | 70-80%     | >80%

---

## 13. RETAIL

Config: `src/config/sectors/retail.ts`
Modules: retail, inventory, stores, e-commerce
KPIs: Same-Store Sales, Inventory Turnover, Shrinkage, Gross Margin, Sales per Sq Ft

### 13.1 Unique Financial Metrics

  Same-Store Sales Growth (Comp Sales)
    Formula: (Current Year Sales - Prior Year Sales) / Prior Year Sales × 100
    For stores open >12 months
    Benchmark: 2-5% growth

  Inventory Turnover
    Formula: COGS / Average Inventory
    Benchmark: 4-8 turns (varies by category)
    Higher is better

  Shrinkage
    Formula: (Recorded Inventory - Actual Inventory) / Recorded Inventory × 100
    Benchmark: <1.5%
    Components: Theft, damage, administrative error

  Sales per Square Foot
    Formula: Net Sales / Selling Square Feet
    Benchmark: $200-500 (varies by format)

  Gross Margin
    Formula: (Net Sales - COGS) / Net Sales × 100
    Benchmark: 35-50% (varies by category)

### 13.2 Chart of Accounts Differences

  UNIQUE TO RETAIL:
    - Sales Revenue (by channel: store, e-commerce, wholesale)
    - Cost of Goods Sold (purchase price + freight + duty)
    - Inventory (at lower of cost or market)
    - Markdowns (contra-revenue or COGS adjustment)
    - Returns & Allowances (contra-revenue)
    - Store Operating Expenses (rent, payroll, utilities)
    - Loyalty Program Liabilities

### 13.3 Key Budget Drivers

  1. Traffic: Foot traffic × conversion rate
  2. Average Transaction Value: Units per transaction × price per unit
  3. Store Count: New stores × ramp curve
  4. E-Commerce: Traffic × conversion × AOV
  5. Inventory: Open-to-buy budget, markdown planning

### 13.4 Industry-Specific Formulas

  Conversion Rate: Transactions / Foot Traffic × 100
  Average Transaction Value: Total Revenue / Number of Transactions
  Units per Transaction: Total Units Sold / Number of Transactions
  Markdown %: Markdowns / Net Sales × 100
  GMROI (Gross Margin Return on Investment): Gross Margin / Average Inventory Cost
  Weeks of Supply: On-Hand Inventory / Average Weekly Sales

### 13.5 Compliance Requirements

  - PCI DSS: Payment card security
  - ADA: Store accessibility
  - Consumer Protection: Return policies, warranties
  - Sales Tax: Collection and remittance
  - Product Safety: CPSC compliance
  - E-Privacy: Cookie consent, data protection

### 13.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  Comp Sales      | >5%       | 2-5%      | 0-2%       | <0%
  Inv Turns       | >8        | 5-8       | 3-5        | <3
  Shrinkage       | <1%       | 1-1.5%    | 1.5-2%     | >2%
  Gross Margin    | >45%      | 35-45%    | 25-35%     | <25%
  Sales/Sq Ft     | >$400     | $200-400  | $100-200   | <$100

---

## 14. TELECOMMUNICATIONS

Config: `src/config/sectors/telecom.ts`
Modules: telecom, network, subscribers, spectrum
KPIs: ARPU, Churn, CapEx/Revenue, Subscriber Growth, EBITDA Margin

### 14.1 Unique Financial Metrics

  ARPU (Average Revenue per User)
    Formula: Total Revenue / Average Subscribers
    Benchmark: $40-70/month (wireless), $50-100 (broadband)

  Churn Rate
    Formula: Subscribers Lost / Total Subscribers × 100
    Benchmark: <1% monthly (wireless)
    Lower is better

  CapEx/Revenue
    Formula: Capital Expenditure / Total Revenue × 100
    Benchmark: 15-20%
    Spectrum auctions can spike this

  EBITDA Margin
    Formula: EBITDA / Total Revenue × 100
    Benchmark: 35-45%

  Subscriber Growth
    Formula: Net Subscriber Adds / Beginning Subscribers × 100
    Benchmark: 3-8% annually

### 14.2 Chart of Accounts Differences

  UNIQUE TO TELECOM:
    - Service Revenue (wireless, wireline, broadband, video)
    - Equipment Revenue (handset sales)
    - Interconnection Revenue/Costs
    - Spectrum Licenses (intangible asset)
    - Network Infrastructure (towers, fiber, switches)
    - Customer Acquisition Costs (subsidies, commissions)
    - Bad Debt (post-paid receivables)

### 14.3 Key Budget Drivers

  1. Subscriber Base: Gross adds - churn
  2. ARPU: Plan mix, upsell, data consumption
  3. Network CapEx: 5G rollout, fiber expansion, capacity
  4. Spectrum: Auction costs, license renewals
  5. Content: Sports rights, exclusive content (if video)

### 14.4 Industry-Specific Formulas

  Cost per Gross Add (CPGA): Total S&M Spend / Gross Subscriber Adds
  Churn Cost: Churned Subscribers × LTV per Subscriber
  Network Cost per Subscriber: Network OpEx / Total Subscribers
  Data ARPU: Data Revenue / Subscribers
  Blended ARPU: (Prepaid ARPU × Prepaid Subs + Postpaid ARPU × Postpaid Subs) / Total Subs

### 14.5 Compliance Requirements

  - FCC: Spectrum licensing, net neutrality, CALEA
  - Universal Service Fund: Contributions
  - CPNI: Customer proprietary network information
  - Tower Regulations: FAA, environmental
  - Number Portability: Must support
  - E911: Emergency service requirements

### 14.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  ARPU            | >$55      | $45-55    | $35-45     | <$35
  Monthly Churn   | <0.8%     | 0.8-1.2%  | 1.2-1.8%   | >1.8%
  EBITDA Margin   | >40%      | 35-40%    | 25-35%     | <25%
  CapEx/Revenue   | <15%      | 15-20%    | 20-25%     | >25%

---

## 15. AGRICULTURE

Config: `src/config/sectors/agriculture.ts`
Modules: agriculture, commodities, land, equipment
KPIs: Yield per Acre, Cost per Acre, Commodity Price, Debt-to-Asset, Working Capital

### 15.1 Unique Financial Metrics

  Yield per Acre
    Formula: Total Production / Acres Planted
    Benchmark: Varies by crop (e.g., corn: 180 bu/acre, soybeans: 50 bu/acre)

  Cost per Acre
    Formula: Total Production Costs / Acres Farmed
    Components: Seed, fertilizer, chemicals, fuel, labor, land rent

  Debt-to-Asset Ratio
    Formula: Total Liabilities / Total Assets × 100
    Benchmark: <30%
    Higher = more leverage, more risk

  Working Capital
    Formula: Current Assets - Current Liabilities
    Benchmark: >$500/acre
    Meaning: Ability to fund operations through the season

  Return on Assets
    Formula: Net Farm Income / Average Total Assets × 100
    Benchmark: >5%

### 15.2 Chart of Accounts Differences

  UNIQUE TO AGRICULTURE:
    - Crop Revenue (by commodity: corn, soybeans, wheat, cotton)
    - Livestock Revenue (cattle, hogs, poultry)
    - Government Payments (subsidies, crop insurance)
    - Crop Inventory (stored grain, harvested crops)
    - Livestock Inventory
    - Land (often largest asset)
    - Equipment (tractors, combines, irrigation)
    - Prepaid Expenses (seed, fertilizer bought before planting)

### 15.3 Key Budget Drivers

  1. Acres Planted: Land available × crop rotation
  2. Yield: Historical yield × weather assumptions
  3. Commodity Price: Futures market, forward contracts
  4. Input Costs: Seed, fertilizer, chemicals, fuel
  5. Government Programs: Subsidies, crop insurance

### 15.4 Industry-Specific Formulas

  Gross Revenue per Acre: Yield per Acre × Price per Unit
  Net Farm Income: Total Revenue - Total Expenses
  Breakeven Yield: Total Cost per Acre / Price per Unit
  Breakeven Price: Total Cost per Acre / Yield per Acre
  Crop Insurance Guarantee: APH Yield × Coverage Level × Projected Price
  Basis: Cash Price - Futures Price

### 15.5 Compliance Requirements

  - USDA Programs: ARC, PLC, CRP compliance
  - Crop Insurance: Federal Crop Insurance Corporation
  - Environmental: Clean Water Act, pesticide regulations
  - Labor: H-2A visa program, worker safety
  - Food Safety: FSMA (if selling direct)
  - Organic Certification: USDA Organic (if applicable)

### 15.6 Benchmark Targets

  METRIC          | GREAT     | GOOD      | CONCERNING | RED FLAG
  ROA             | >8%       | 5-8%      | 2-5%       | <2%
  Debt/Asset      | <20%      | 20-35%    | 35-50%     | >50%
  Working Capital | >$750/ac  | $400-750  | $200-400   | <$200
  Current Ratio   | >2.5x     | 1.5-2.5x  | 1.0-1.5x   | <1.0x

---

## 16. CROSS-SECTOR PATTERNS

### 16.1 Universal Financial Statements

  ALL sectors produce these 3 statements:
    1. Income Statement (Profit & Loss)
    2. Balance Sheet (Statement of Financial Position)
    3. Cash Flow Statement

  The DIFFERENCE is what goes INSIDE each statement.

### 16.2 Universal Budget Structure

  ALL budgets follow this pattern:
    Revenue Budget → Expense Budget → Capital Budget → Cash Budget

  Sector-specific differences:
    - Revenue drivers change (patients vs. rooms vs. subscribers)
    - Expense categories change (COGS structure varies)
    - Capital needs change (equipment vs. spectrum vs. land)
    - Cash flow patterns change (seasonal vs. steady)

### 16.3 Template Selection Logic

  When user selects a sector:
    1. Load sector config from `src/config/sectors/{sector}.ts`
    2. Apply defaultKPIs to dashboard
    3. Enable enabledModules in sidebar
    4. Load sector-specific chart of accounts
    5. Pre-populate budget template with sector formulas
    6. Apply sector-specific validation rules

### 16.4 Sector Migration

  If user changes sector after data entry:
    1. Warn: "Changing sector will modify KPIs and modules"
    2. Preserve: All existing financial data
    3. Add: New sector-specific KPIs and modules
    4. Remove: Old sector-specific KPIs and modules
    5. Remap: Chart of accounts where possible
    6. Flag: Any accounts that don't map to new sector

---

## VERSION 5.0.0
## Generated 2026-05-18
## All sector configs verified against src/config/sectors/
