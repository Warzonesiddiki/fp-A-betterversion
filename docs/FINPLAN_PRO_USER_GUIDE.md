# FinPlan Pro — Complete User Guide

> **Version:** 1.0.0
> **Date:** 2026-05-20
> **Platform:** Desktop (Windows/macOS/Linux) via Tauri

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Budgeting](#3-budgeting)
4. [Forecasting](#4-forecasting)
5. [Scenario Planning](#5-scenario-planning)
6. [Reports](#6-reports)
7. [Data Import](#7-data-import)
8. [Multi-Entity Consolidation](#8-multi-entity-consolidation)
9. [Natural Language Queries](#9-natural-language-queries)
10. [Templates](#10-templates)
11. [Keyboard Shortcuts](#11-keyboard-shortcuts)
12. [Settings](#12-settings)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Getting Started

### Installation
1. Download the installer for your OS
2. Run the installer
3. Launch FinPlan Pro from your applications

### First Launch
1. The **Setup Wizard** appears on first launch
2. Enter your organization name and base currency
3. Select your industry sector (for KPI templates)
4. Choose "Start with Demo Data" or "Start Fresh"

### Onboarding Wizard
- **Step 1:** Organization setup (name, currency, fiscal year)
- **Step 2:** Industry selection (16 sectors available)
- **Step 3:** Data import (optional — upload Excel/CSV)
- **Step 4:** User roles (Admin, Manager, Analyst, Viewer)

---

## 2. Dashboard

The Dashboard shows key metrics at a glance:
- **KPI Cards:** Revenue, Expenses, Net Income, Cash Position
- **Charts:** Budget vs Actual, Trend Analysis, Sector KPIs
- **Activity Feed:** Recent changes, approvals, comments
- **Quick Actions:** Create Budget, Import Data, Generate Report

### Customization
- Drag and drop widgets to rearrange
- Click "Edit Dashboard" to add/remove widgets
- Use Ctrl+K to open Command Palette for quick navigation

---

## 3. Budgeting

### Creating a Budget
1. Go to **Budgets → Create New**
2. Choose budget method:
   - **Incremental:** Build on prior year actuals
   - **Zero-Based:** Justify every dollar from $0
3. Select accounts from Chart of Accounts
4. Enter amounts (spread across months automatically)
5. Submit for approval

### Budget Workflow
```
Draft → Submitted → Under Review → Approved → Locked
```

### Budget vs Actual
- Go to **Reports → Budget vs Actual**
- View variance by account, department, or period
- Color-coded: Green = favorable, Red = unfavorable

---

## 4. Forecasting

### Rolling Forecast
- Go to **Forecasts → Rolling Forecast**
- 12-month forward-looking projection
- Adjust assumptions via sliders
- Auto-recalculates on change

### Driver-Based Planning
- Go to **Forecasts → Driver Planning**
- Link operational drivers to financial outcomes
- Example: Headcount → Salary Expense

### What-If Analysis
- Go to **Forecasts → What-If**
- Adjust variables with sliders
- See impact on P&L, Balance Sheet, Cash Flow
- Break-even analysis included

---

## 5. Scenario Planning

### Creating Scenarios
1. Go to **Scenarios → Create New**
2. Define assumptions (growth rates, cost changes)
3. Run Monte Carlo simulation
4. Compare scenarios side-by-side

### Sensitivity Analysis
- 2-way sensitivity tables
- Tornado diagrams for key drivers
- Confidence intervals on forecasts

---

## 6. Reports

### Financial Statements
- **P&L:** Revenue → COGS → Gross Profit → OpEx → Net Income
- **Balance Sheet:** Assets = Liabilities + Equity
- **Cash Flow:** Operating → Investing → Financing

### Report Builder
- Drag and drop sections
- Add charts, tables, KPIs
- Export to PDF/Excel/CSV

### Auto-Commentary
- AI generates variance explanations
- Customizable templates
- Multi-language support

---

## 7. Data Import

### Supported Formats
- Excel (.xlsx, .xls)
- CSV
- JSON

### Import Process
1. Go to **Data → Import**
2. Upload file
3. Map columns (auto-detected)
4. Preview data
5. Validate and import

### Column Mapping
- Auto-detects: Account, Date, Amount, Description
- Manual override available
- Save mappings for reuse

---

## 8. Multi-Entity Consolidation

### Setup
1. Go to **Settings → Entities**
2. Add entities (departments, subsidiaries, regions)
3. Set ownership percentages
4. Define intercompany relationships

### Consolidation Process
1. Go to **Consolidation → Run Consolidation**
2. System automatically:
   - Eliminates intercompany transactions
   - Translates foreign currency (ASC 830)
   - Calculates minority interest
   - Generates consolidated statements

---

## 9. Natural Language Queries

### How to Use
1. Press **Ctrl+K** to open Command Palette
2. Type a question in plain English:
   - "Show revenue by region"
   - "What is total expenses this quarter?"
   - "Compare budget vs actual for marketing"
3. System generates chart/table automatically

### Supported Queries
- Revenue/expense breakdowns
- Budget vs actual comparisons
- Trend analysis
- Variance explanations

---

## 10. Templates

### Using Templates
1. Go to **Templates → Gallery**
2. Browse by category (Budget, Forecast, Report)
3. Preview template structure
4. Click "Apply" to use

### Industry Templates
- Technology/SaaS: ARR, NRR, Churn, LTV/CAC
- Banking: NIM, NPL, CAR, LDR
- Healthcare: Occupancy, ALOS, Readmission
- Manufacturing: OEE, Yield, Scrap Rate
- And 12 more sectors...

---

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Command Palette |
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+N | New item |
| Ctrl+/ | Show shortcuts |
| F2 | Edit cell |
| Escape | Cancel |
| Tab | Next cell |
| Enter | Confirm |

---

## 12. Settings

### Organization
- Name, currency, fiscal year
- Industry sector

### Users & Roles
- Admin: Full access
- Manager: Approve budgets
- Analyst: Create/edit
- Viewer: Read-only

### Integrations
- QuickBooks connector
- NetSuite connector
- Salesforce connector

---

## 13. Troubleshooting

### Common Issues

**Q: Data not showing on dashboard**
A: Check that GL data is imported. Go to Data → Import.

**Q: Budget won't submit**
A: Ensure all required fields are filled. Check approval workflow.

**Q: Forecast seems wrong**
A: Verify assumptions in Driver Planning. Check formula dependencies.

**Q: Consolidation not working**
A: Ensure all entities have data. Check intercompany matching.

**Q: Export is blank**
A: Ensure data exists for the selected period. Check filters.

### Performance Tips
- Use filters to limit data scope
- Close unused tabs
- Restart app if sluggish

---

## Competitive Advantages

| Feature | FinPlan Pro | Anaplan | Pigment | Vena |
|---------|-------------|---------|---------|------|
| Offline-First | ✅ | ❌ | ❌ | ❌ |
| Desktop App | ✅ | ❌ | ❌ | ❌ |
| One-Time Price | ✅ | $50K+/yr | $40K+/yr | $30K+/yr |
| Engine Count | 159 | ~50 | ~40 | ~30 |
| Plugin System | ✅ | ❌ | ❌ | ❌ |
| WCAG 2.1 AA | ✅ | ❌ | ❌ | ❌ |
| 16 Sectors | ✅ | 5 | 3 | 4 |
| ESG Reporting | ✅ | ❌ | ❌ | ❌ |

---

*This guide covers FinPlan Pro v1.0.0. For updates, check Help → About.*
