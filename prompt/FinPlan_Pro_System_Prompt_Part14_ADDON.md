# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 14 of 15: Data Migration & Switching Playbook
## Version 5.0.0 | Generated 2026-05-18

---

## 0. PURPOSE OF THIS PART

This part is the MIGRATION BIBLE. It ensures every user switching to
FinPlan Pro has a FLAWLESS experience. The #1 reason users abandon a
new tool is migration friction. We eliminate ALL friction.

The fleet uses this document to:
  - Build bulletproof import engines
  - Handle every edge case in source data
  - Verify migration accuracy to the penny
  - Provide rollback confidence

---

## 1. MIGRATION FROM EXCEL (Most Common — 80% of Users)

### 1.1 What Excel Users Have

Excel users typically have ONE of these models:

  TYPE A: Simple Budget Spreadsheet
    - Single file, 5-15 tabs
    - Tabs: Revenue, COGS, OpEx, Summary, Assumptions
    - Formulas: SUM, IF, VLOOKUP, simple math
    - 1-3 years of data
    - 1 entity, 1 department

  TYPE B: Multi-Department Model
    - Single file, 15-50 tabs
    - Tabs per department + summary + consolidation
    - Cross-sheet references: ='Dept1'!B5+'Dept2'!B5
    - 3-5 years of historical + budget
    - 1 entity, multiple departments

  TYPE C: Enterprise Model (Multiple Files)
    - Multiple files linked together
    - Budget file, forecast file, actuals file
    - External links: ='[Budget.xlsx]Revenue'!B5
    - 5+ years of data
    - Multiple entities, multiple departments
    - May have VBA macros

  TYPE D: Analyst's Custom Model
    - Heavy formulas, array formulas, named ranges
    - Pivot tables, Power Query connections
    - VBA automation (buttons, macros)
    - Complex scenario toggles
    - Solver/Goal Seek usage

### 1.2 Step-by-Step Excel Migration

  STEP 1: AUDIT (5 minutes)
    Upload the file. FinPlan Pro auto-detects:
    - Number of sheets
    - Data range per sheet
    - Column headers
    - Data types (numbers, dates, text)
    - Formula complexity (simple/moderate/complex)
    - Cross-sheet references
    - External links
    - Merged cells
    - Hidden rows/columns

    Output: Migration Readiness Report
    - GREEN: Direct import, no issues
    - YELLOW: Minor mapping needed
    - RED: Manual intervention required

  STEP 2: MAP CHART OF ACCOUNTS (10 minutes)
    FinPlan Pro shows your column headers and asks:
    "Which column is Revenue? Which is COGS?"

    Auto-mapping attempts:
    - Exact match: "Revenue" → Revenue account
    - Fuzzy match: "Rev" or "Total Revenue" → Revenue account
    - Alias match: "Sales" → Revenue (learned from past imports)
    - Manual: User picks from dropdown

    Accounts that can't be auto-mapped get a YELLOW flag.
    User resolves these in the mapping wizard.

  STEP 3: IMPORT DATA (1-5 minutes)
    Options:
    - Import as-is: Copy data directly
    - Import with formulas: Convert Excel formulas to FinPlan Pro formulas
    - Import historical only: Just the numbers, recreate formulas manually
    - Import structure only: Create the template, add data later

    Import progress shows:
    - Rows imported / total rows
    - Errors encountered
    - Warnings (rounding differences, etc.)

  STEP 4: VERIFY TOTALS (2 minutes)
    Side-by-side comparison:
    - Excel totals vs FinPlan Pro totals
    - Highlight differences in red
    - Explain each difference (rounding, formula conversion, etc.)
    - User confirms or fixes

  STEP 5: RECREATE FORMULAS (varies)
    If formulas were imported:
    - Cross-sheet references → cross-dimensional references
    - VLOOKUP → XLOOKUP or INDEX/MATCH
    - SUM across sheets → SUM across entities
    - Array formulas → dynamic arrays

    If formulas were NOT imported:
    - User recreates in FinPlan Pro's formula bar
    - Auto-suggest based on data patterns
    - Template formulas available per industry

  STEP 6: TEST (10 minutes)
    Run these checks:
    - All totals match Excel
    - Formulas produce same results
    - Scenarios calculate correctly
    - Reports generate without errors
    - Performance acceptable (<2s for recalc)

### 1.3 Common Excel Import Challenges

  CHALLENGE 1: Merged Cells
    PROBLEM: Excel uses merged cells for headers and labels.
    FinPlan Pro doesn't support merged cells in data grids.
    SOLUTION: Unmerge before import. Auto-unmerge in ImportEngine.
    Each merged cell becomes: value in top-left, empty in rest.

  CHALLENGE 2: Circular References
    PROBLEM: Excel allows circular refs (A1 = B1 + 1, B1 = A1 + 1).
    Excel uses iterative calculation to resolve them.
    FinPlan Pro detects circular refs and shows the cycle.
    SOLUTION: Offer to break the cycle or enable iterative calculation.

  CHALLENGE 3: VBA Macros
    PROBLEM: Excel has VBA buttons, macros, automation.
    FinPlan Pro doesn't support VBA.
    SOLUTION: Identify what VBA does and offer alternatives:
    - Button → FinPlan Pro workflow trigger
    - Data manipulation → FinPlan Pro formula
    - Export → FinPlan Pro export engine
    Show: "Your VBA macro did X. Here's how to do it in FinPlan Pro."

  CHALLENGE 4: External Links
    PROBLEM: Excel links to other files: ='[Budget.xlsx]Revenue'!B5
    Those files may not be available.
    SOLUTION: Option A: Import both files. Option B: Replace links
    with static values. Option C: Mark as "external dependency."

  CHALLENGE 5: Hidden Rows/Columns
    PROBLEM: Excel has hidden rows/columns with data.
    User may not know they're there.
    SOLUTION: Auto-detect and reveal. Show: "Found 47 hidden rows
    with data. Import them?"

  CHALLENGE 6: Mixed Data Types
    PROBLEM: Column has numbers AND text (e.g., "123" and "N/A").
    FinPlan Pro wants consistent types.
    SOLUTION: Show the mixed column. Let user choose:
    - Convert text to 0
    - Convert text to null
    - Skip those rows
    - Mark as "data quality issue"

  CHALLENGE 7: Date Format Chaos
    PROBLEM: Excel dates are formatted differently: 01/15/2026,
    15-Jan-2026, 2026-01-15, 45672 (serial number).
    SOLUTION: Auto-detect date format. Show preview. Let user confirm.

  CHALLENGE 8: Pivot Tables
    PROBLEM: Excel pivot tables are dynamic, FinPlan Pro cubes are
    different. Can't import a pivot table directly.
    SOLUTION: Import the underlying data, not the pivot table.
    Recreate as FinPlan Pro cube/report.

### 1.4 Excel Import Checklist

  BEFORE IMPORT:
    [ ] File opens without errors in Excel
    [ ] No password protection (or password provided)
    [ ] No corrupted sheets
    [ ] All external links resolved or noted
    [ ] Hidden rows/columns revealed
    [ ] Merged cells noted

  DURING IMPORT:
    [ ] All sheets detected
    [ ] Column mapping correct
    [ ] Data types detected correctly
    [ ] Date formats recognized
    [ ] Numbers imported as numbers (not text)
    [ ] Formulas preserved or converted

  AFTER IMPORT:
    [ ] Totals match Excel (within rounding)
    [ ] All entities/accounts imported
    [ ] All periods imported
    [ ] No data loss (row count matches)
    [ ] Reports generate correctly
    [ ] Performance acceptable

### 1.5 Complex Excel Model Migration

  MULTI-TAB MODELS:
    - Map each tab to a FinPlan Pro dimension or entity
    - Cross-sheet refs become cross-dimensional formulas
    - Consolidation tabs → FinPlan Pro consolidation engine
    - Summary tabs → FinPlan Pro dashboard

  VBA-HEAVY MODELS:
    - Extract VBA logic → convert to FinPlan Pro formulas
    - Button actions → workflow triggers
    - Data manipulation → ETL pipeline
    - User forms → FinPlan Pro input forms
    - LIMITATION: Complex VBA may need manual recreation

  POWER QUERY MODELS:
    - Power Query connections → FinPlan Pro import connectors
    - Query steps → ETL pipeline steps
    - Refresh schedule → auto-sync (when online)
    - LIMITATION: Power Query M language not supported directly

  EXTERNAL DATA MODELS:
    - ODBC/OLE DB connections → FinPlan Pro API connectors
    - SQL queries → FinPlan Pro data store queries
    - Web queries → HTTP connector
    - LIMITATION: Must reconfigure connections in FinPlan Pro

---

## 2. MIGRATION FROM PLANFUL (Formerly Host Analytics)

### 2.1 What Planful Users Have

  DIMENSIONS:
    - Entity (company/division)
    - Department (cost center)
    - Account (chart of accounts)
    - Scenario (budget/actual/forecast)
    - Time (period)
    - Custom dimensions (product, region, etc.)

  MODELS:
    - Planning models with business rules
    - Cube models for multi-dimensional analysis
    - Relational models for detail planning
    - Rolling forecasts

  DATA:
    - Actuals loaded from ERP (NetSuite, SAP, etc.)
    - Budget data entered by users
    - Forecast data with driver-based calculations
    - Historical data (3-5 years)

  REPORTS:
    - Standard financial reports (P&L, BS, CF)
    - Variance reports (BvA, FvA)
    - Ad-hoc reports via report builder
    - Dashboards with charts

  WORKFLOWS:
    - Budget submission workflows
    - Approval chains
    - Task assignments
    - Status tracking

### 2.2 Planful Migration Strategy

  STEP 1: EXPORT FROM PLANFUL
    - Export dimensions as CSV (Entity, Dept, Account, etc.)
    - Export model data (all scenarios, all periods)
    - Export reports (as templates if possible)
    - Document business rules (if possible)

  STEP 2: MAP DIMENSIONS
    - Planful Entity → FinPlan Pro Entity
    - Planful Department → FinPlan Pro Department dimension
    - Planful Account → FinPlan Pro Account
    - Planful Scenario → FinPlan Pro Scenario
    - Planful Time → FinPlan Pro Period
    - Custom dimensions → FinPlan Pro custom dimensions

  STEP 3: IMPORT DATA
    - Use FinPlan Pro import engine
    - Map column headers
    - Verify totals match Planful

  STEP 4: RECREATE BUSINESS RULES
    - Planful business rules → FinPlan Pro formulas
    - Driver-based calculations → FinPlan Pro driver formulas
    - Allocation rules → FinPlan Pro allocation engine

  STEP 5: RECREATE REPORTS
    - Planful report templates → FinPlan Pro report templates
    - Variance reports → FinPlan Pro variance engine
    - Dashboards → FinPlan Pro dashboard builder

  STEP 6: VERIFY
    - Totals match Planful
    - Reports produce same results
    - Performance acceptable

---

## 3. MIGRATION FROM ADAPTIVE (Workday Adaptive Planning)

### 3.1 What Adaptive Users Have

  LEVELS (Org Hierarchy):
    - Company → Business Unit → Department → Cost Center
    - Levels are hierarchical, not flat
    - Each level has attributes

  ACCOUNTS:
    - Hierarchical chart of accounts
    - Account types: Revenue, COGS, OpEx, etc.
    - Calculated accounts (formulas)
    - Linked accounts (shared across levels)

  ATTRIBUTES (Custom Dimensions):
    - Product, Region, Project, etc.
    - Used for cross-tabulation
    - Can be hierarchical

  SHEETS (Input Forms):
    - Standard sheets (P&L input, BS input)
    - Modeled sheets (custom calculations)
    - Cube sheets (multi-dimensional)
    - Assumption sheets (shared assumptions)

  REPORTS:
    - OfficeConnect reports (Excel-based)
    - Adaptive reports (web-based)
    - Dashboards

### 3.2 Adaptive Migration Strategy

  STEP 1: EXPORT FROM ADAPTIVE
    - Export levels (hierarchy)
    - Export accounts (chart of accounts)
    - Export attributes (custom dimensions)
    - Export sheet data (all versions)
    - Export reports (if possible)

  STEP 2: MAP LEVELS TO ENTITIES
    - Adaptive levels → FinPlan Pro entity hierarchy
    - Flatten if needed (FinPlan Pro supports multi-level)
    - Map attributes to custom dimensions

  STEP 3: MAP ACCOUNTS
    - Adaptive accounts → FinPlan Pro accounts
    - Calculated accounts → FinPlan Pro formulas
    - Linked accounts → shared accounts

  STEP 4: IMPORT DATA
    - Import by version (actual, budget, forecast)
    - Verify totals match Adaptive

  STEP 5: RECREATE SHEETS
    - Adaptive sheets → FinPlan Pro input forms
    - Modeled sheets → FinPlan Pro formulas
    - Cube sheets → FinPlan Pro cube engine

---

## 4. MIGRATION FROM ANAPLAN

### 4.1 What Anaplan Users Have

  LISTS (Dimensions):
    - Organization list (hierarchy)
    - Account list (chart of accounts)
    - Time list (periods)
    - Versions list (scenarios)
    - Custom lists

  MODULES (Multi-Dimensional Models):
    - Input modules (data entry)
    - Calculation modules (business logic)
    - System modules (metadata)
    - Dashboard modules (visualization)

  LINE ITEMS (Measures):
    - Each module has line items
    - Line items are the "measures" or "fields"
    - Can have formulas
    - Can be formatted (number, %, date, etc.)

  VIEWS (Reports):
    - Saved views of modules
    - Can filter, sort, pivot
    - Can be published to dashboards

  DASHBOARDS:
    - Grid views
    - Charts
    - KPI panels
    - Action buttons

### 4.2 Anaplan Migration Strategy

  STEP 1: EXPORT FROM ANAPLAN
    - Export lists (all dimensions)
    - Export modules (all data)
    - Document formulas (manual process)
    - Screenshot dashboards

  STEP 2: MAP STRUCTURE
    - Anaplan lists → FinPlan Pro dimensions
    - Anaplan modules → FinPlan Pro cubes/views
    - Anaplan line items → FinPlan Pro measures
    - Anaplan views → FinPlan Pro reports

  STEP 3: IMPORT DATA
    - Import list data
    - Import module data
    - Map formulas manually (Anaplan formula language ≠ FinPlan Pro)

  STEP 4: RECREATE BUSINESS LOGIC
    - Anaplan formulas → FinPlan Pro formulas
    - Anaplan actions → FinPlan Pro workflows
    - LIMITATION: Anaplan's proprietary formula language must be
      manually translated. Provide a mapping guide.

---

## 5. POST-MIGRATION VERIFICATION

### 5.1 Verification Checklist

  DATA INTEGRITY:
    [ ] Total revenue matches source system
    [ ] Total expenses match source system
    [ ] Net income matches source system
    [ ] Balance sheet balances (Assets = Liabilities + Equity)
    [ ] All entities imported
    [ ] All periods imported
    [ ] All accounts imported
    [ ] No data loss (row counts match)

  FORMULA ACCURACY:
    [ ] Key formulas produce same results
    [ ] Variance calculations correct
    [ ] Consolidation produces same results
    [ ] Scenario comparisons work
    [ ] No circular references (unless intentional)

  REPORT ACCURACY:
    [ ] P&L report matches source
    [ ] Balance Sheet matches source
    [ ] Cash Flow matches source
    [ ] Variance reports match source
    [ ] Custom reports recreated

  PERFORMANCE:
    [ ] File opens in <2 seconds
    [ ] Recalculation in <100ms
    [ ] Reports generate in <5 seconds
    [ ] Export works correctly
    [ ] No UI lag

### 5.2 Rollback Plan

  IF MIGRATION FAILS:
    1. Keep source system running for 30 days minimum
    2. Daily comparison of key metrics (automated)
    3. If discrepancy > 0.1%, investigate immediately
    4. If critical issue, revert to source system
    5. Fix issue in FinPlan Pro
    6. Re-migrate and verify

  ROLLBACK TRIGGERS:
    - Data loss detected
    - Totals don't match after 3 attempts
    - Performance unacceptable
    - Critical formula errors
    - User reports data corruption

  ROLLBACK PROCESS:
    1. Stop using FinPlan Pro for that model
    2. Revert to source system
    3. Document the issue
    4. Fix the issue
    5. Re-test migration
    6. Re-attempt migration

---

## 6. MIGRATION AUTOMATION

### 6.1 Auto-Migration Wizard

  For SIMPLE Excel files (<10 sheets, <1000 rows per sheet):
    1. User drags file onto FinPlan Pro
    2. Auto-detect structure
    3. Auto-map columns
    4. Auto-import data
    5. Auto-verify totals
    6. Done in <5 minutes

  For COMPLEX files (10+ sheets, cross-references, VBA):
    1. User drags file
    2. Auto-audit: show migration readiness
    3. Guided wizard: step-by-step mapping
    4. Manual verification required
    5. Done in 15-30 minutes

### 6.2 Migration Templates

  Pre-built migration templates for common source systems:
    - Excel Budget Template → FinPlan Pro Budget
    - Excel Forecast Template → FinPlan Pro Forecast
    - Excel P&L Template → FinPlan Pro P&L
    - Excel Balance Sheet → FinPlan Pro Balance Sheet
    - Planful Export → FinPlan Pro Import
    - Adaptive Export → FinPlan Pro Import

  Templates include:
    - Column mapping
    - Formula conversion rules
    - Account mapping
    - Verification checks

---

## 7. MIGRATION SUPPORT

### 7.1 Self-Service Migration

  For users who want to do it themselves:
    - Step-by-step guides (this document)
    - Video tutorials (2-5 minutes each)
    - FAQ for common issues
    - Community forum for questions

### 7.2 Assisted Migration

  For users who need help:
    - Screen-sharing sessions
    - Migration specialist reviews their file
    - Guided migration with real-time support
    - Available for complex models

### 7.3 White-Glove Migration

  For enterprise users:
    - Dedicated migration specialist
    - Custom import scripts
    - Data validation reports
    - Training on the new system
    - 30-day post-migration support

---

*End of Part 14 — Data Migration & Switching Playbook*
*Version 5.0.0 | All paths verified against actual codebase*
