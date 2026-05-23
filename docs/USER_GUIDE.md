# FinPlan Pro — User Guide

## 1. Getting Started

### Installation
1. Download the installer for your OS (Windows/Mac/Linux)
2. Run the installer — no server setup needed
3. Double-click the FinPlan Pro icon to launch
4. Complete the onboarding wizard

### First Launch
- **Organization Setup**: Enter company name, fiscal year start, base currency
- **Industry Selection**: Choose your sector for pre-built templates
- **Demo Data**: Option to load sample data for exploration

### Onboarding Wizard
The SetupWizardPage guides you through:
1. Company profile
2. Fiscal calendar configuration
3. Chart of accounts selection
4. User roles setup
5. Data import (optional)

---

## 2. Core Features

### Dashboard
- Real-time KPIs from all stores
- Revenue/expense trends
- Budget status overview
- Quick actions via Command Palette (Ctrl+K)

### Budget Creation
1. Navigate to Budgets → Create
2. Choose method: **Incremental** (build on prior year) or **Zero-Based** (justify every dollar)
3. Select accounts and departments
4. Enter amounts — use spread patterns (even, seasonal, driver-based)
5. Submit for approval

### Forecasting
- **Rolling Forecast**: 12-month forward-looking projection
- **What-If Analysis**: Adjust variables with sliders, see instant impact
- **Driver-Based Planning**: Link operational drivers to financial outcomes
- **Monte Carlo Simulation**: Stress-test scenarios with random variables

### Scenario Planning
1. Create base scenario from current data
2. Create variations (best case, worst case, most likely)
3. Compare scenarios side-by-side
4. Generate sensitivity tables

### Report Generation
- **P&L Statement**: Revenue → COGS → OpEx → Net Income
- **Balance Sheet**: Assets = Liabilities + Equity
- **Cash Flow**: Operating → Investing → Financing
- **3-Statement View**: Integrated view with auto-linking
- **Export**: PDF, Excel, CSV

---

## 3. Data Management

### Importing GL Data
1. Navigate to Data → Import
2. Upload Excel/CSV/JSON file
3. Column mapping (auto-detect or manual)
4. Preview first 10 rows
5. Validate and confirm

### Excel Import Engine
- Supports .xlsx, .xls, .csv, .json
- Auto-detects GL account patterns
- Handles multiple sheets
- Progress tracking during import

### Column Mapping
- **Auto-detect**: System identifies date, amount, account columns
- **Manual override**: Drag-and-drop column mapping
- **Learned mappings**: System remembers previous imports

---

## 4. Multi-Entity Consolidation

### Setting Up Entities
1. Navigate to Settings → Entities
2. Add subsidiaries with ownership percentages
3. Set functional currencies per entity
4. Configure fiscal year alignment

### Consolidation Process
1. Import data from all entities
2. Currency translation (ASC 830)
3. Intercompany elimination
4. Minority interest calculation
5. Generate consolidated statements

### Currency Management
- **FX Rate Management**: Manual or API-sourced rates
- **Translation Methods**: Closing, average, historical rates
- **FX Gain/Loss**: Automatic calculation
- **Hedge Management**: Track hedging positions

---

## 5. Advanced Features

### Natural Language Queries (NLQ)
Type questions in plain English:
- "Show revenue by region"
- "Compare budget vs actual for Q3"
- "What is the variance in marketing spend?"
- System auto-generates charts and tables

### Formula Engine
- 245+ functions (math, financial, text, logical, lookup, date, statistical)
- Excel-compatible syntax
- Cell references and cross-sheet formulas
- Real-time recalculation

### Plugin System
- Install custom formula functions
- Add chart types
- Connect data sources
- Extend export formats
- Plugin marketplace (future)

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+K | Command Palette |
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+/ | Help |
| F2 | Edit cell |
| Escape | Cancel |

---

## 6. Templates

### Using Templates
1. Navigate to Templates → Gallery
2. Browse by category (Budget, Forecast, Report)
3. Preview template structure
4. Apply to current data

### Industry Templates
- Technology/SaaS: ARR, NRR, Churn, LTV/CAC
- Manufacturing: OEE, Yield, Scrap Rate
- Retail: Same-Store Sales, Inventory Turnover
- Banking: NIM, NPL, CAR, LDR
- Healthcare: Occupancy, ALOS, Readmission
- Energy: Production, Reserve Life, Emissions
- Real Estate: NOI, Cap Rate, DSCR
- Insurance: Loss Ratio, Combined Ratio

### Creating Custom Templates
1. Build a budget/report with desired structure
2. Save as template
3. Add metadata (name, description, industry)
4. Share with team

---

## 7. Collaboration

### Comments & Tasks
- Add comments on any data point
- Create tasks with assignees and due dates
- Track activity log
- Approval workflows

### Approval Process
1. Submit budget/report for review
2. Reviewer checks data and comments
3. Approve or reject with feedback
4. Lock approved items

---

## 8. Troubleshooting

### Common Issues
- **Import fails**: Check column mapping, file format
- **Slow performance**: Reduce concurrent calculations
- **Charts not loading**: Check data source connection
- **Save not working**: Check IndexedDB storage quota

### Error Messages
- "Formula parse error": Check syntax, function names
- "Circular reference": Formula references itself
- "Data validation failed": Check input ranges
- "Storage quota exceeded": Clear old data or increase quota

### Performance Tips
- Use virtual scrolling for large tables
- Enable lazy loading for pages
- Use formula caching for complex calculations
- Reduce concurrent calculations

---

## 9. FAQ

**Q: Can I use FinPlan Pro offline?**
A: Yes! FinPlan Pro is offline-first. All data stored locally in IndexedDB/Tauri SQLite.

**Q: How many entities can I consolidate?**
A: No limit. Performance depends on data volume.

**Q: Can I import from QuickBooks/NetSuite?**
A: Export to CSV/Excel from your ERP, then import into FinPlan Pro.

**Q: Is my data secure?**
A: Yes. Data stays on your machine. AES-256-GCM encryption for sensitive data.

**Q: Can multiple users edit simultaneously?**
A: Real-time collaboration is planned. Currently uses comment/task workflow.

---

## 10. Keyboard Shortcuts Reference

| Category | Shortcut | Action |
|----------|----------|--------|
| **Navigation** | Ctrl+1-9 | Switch pages |
| | Alt+Left/Right | Back/Forward |
| | Ctrl+K | Command Palette |
| **Data** | F2 | Edit cell |
| | Escape | Cancel edit |
| | Tab | Next cell |
| | Enter | Confirm edit |
| | Ctrl+C/V | Copy/Paste |
| **Editing** | Ctrl+Z | Undo |
| | Ctrl+Shift+Z | Redo |
| | Ctrl+S | Save |
| | Ctrl+N | New item |
| **Reports** | Ctrl+P | Print |
| | Ctrl+E | Export |
| | Ctrl+F | Find/Filter |
| **Help** | Ctrl+/ | Keyboard shortcuts |
| | F1 | Help page |

---

*FinPlan Pro — Financial Planning & Analysis, Reinvented.*
