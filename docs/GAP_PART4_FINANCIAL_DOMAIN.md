# FinPlan Pro — Part 4: Financial Domain Gaps (56 items)

> **Source:** Deep financial domain audit
> **Date:** 2026-05-20

## A. FINANCIAL DOMAIN GAPS

### 1. Spread Patterns for Budgeting ❌ NEEDED
When user enters annual $1,200,000 — how to distribute across 12 months?
- Even spread: $100K/month
- Front-loaded: 40% Q1, tapering
- Back-loaded: ramp up
- Seasonal: weighted by historical ratios
- Driver-based: distributed by headcount/units
- Custom: user-defined percentages

**Status:** SpreadEngine.ts BUILT (166 lines)

### 2. Management Commentary / Narrative Layer ❌ NEEDED
- Rich text editor attached to report line items
- Template narratives with variable interpolation
- Narrative versioning tied to report version
- Narrative approval as part of workflow
- Export combining numbers + narrative

### 3. Cross-Field Validation Rules ❌ NEEDED
- Revenue × Volume = Price
- Assets = Liabilities + Equity
- Cash Flow = Change in Cash Balance
- Net Income flows to Retained Earnings

### 4. Row-Level Security ❌ NEEDED
- Analyst A sees only their department
- CFO sees everything
- Regional manager sees their region

### 5-20. Additional Financial Domain Items
| # | Gap | Status |
|---|-----|--------|
| 5 | Sensitivity Tables (2-way) | NEEDED |
| 6 | Seasonality Profiles | NEEDED |
| 7 | Multi-GAAP Support | NEEDED |
| 8 | Segment Reporting | NEEDED |
| 9 | Non-GAAP Adjustments | NEEDED |
| 10 | 13-Week Cash Forecast | NEEDED |
| 11 | Structured Budget Process | NEEDED |
| 12 | Monthly Close Workflow | NEEDED |
| 13 | Approval Chain Config | NEEDED |
| 14 | Change Tracking | NEEDED |
| 15 | Data Reconciliation | NEEDED |
| 16 | Stale Data Detection | NEEDED |
| 17 | Data Lineage | NEEDED |
| 18 | Report Parameterization | NEEDED |
| 19 | Drill-Down/Through | NEEDED |
| 20 | Test Data Factories | NEEDED |

### 21-40. Medium Priority
Debt Covenant Monitoring, Revenue Waterfall Detail, SLA Tracking, Cascade Delete Prevention, Report Book UX, Conditional Formatting UI, Chart Annotation, Cross-Tab/Pivot UI, API Layer Design, SSO, Webhook System, Performance Benchmarks, Cross-Platform Testing, Upgrade Testing, User Manual, Plugin Dev Docs, Audit Tamper Protection, Secrets Management, Guided Workflows

### 41-56. Low Priority
XBRL Tagging, Hyperinflation Accounting, Day Count Conventions, Multi-currency Rounding, Intercompany Netting, Goodwill Impairment, Lease Modification, Hedge Effectiveness, Pension Accounting, Government Grant Recognition, Biological Asset Valuation, Insurance Contract Liability, Revenue Contract Modification, Construction Contract Progress, Financial Instrument Classification, Fair Value Hierarchy

---

## BUILT SO FAR
- SpreadEngine.ts (166 lines)
- SignConventionEngine.ts (151 lines)
