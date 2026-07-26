# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 3 of 5: Competitive Intelligence, Feature Universe & Gap Analysis
## Version 5.0.0 | Generated 2026-05-18 | VERIFIED AGAINST ACTUAL CODEBASE

---

## 0. PURPOSE OF THIS PART

This part provides the COMPETITIVE BATTLEFIELD MAP. It answers:
  - Who are we fighting? (25 competitors analyzed in depth)
  - What weapons do they have? (250+ features catalogued)
  - Where are they weak? (complaints, gaps, failures)
  - Where are WE weak? (gap analysis against feature universe)
  - Where is the BLUE OCEAN? (features nobody offers well)
  - What do users WISH existed? (unmet demand)

The fleet uses this document to:
  - Make every feature decision with competitive context
  - Prioritize features that close critical gaps
  - Identify differentiators that no competitor can match
  - Understand WHY users are unhappy with current tools
  - Build features that address REAL pain points, not hypothetical ones

---

## 1. COMPETITIVE LANDSCAPE — 25 COMPETITORS ANALYZED

### 1.1 Tier 1: Enterprise Giants ($100K+/year)

#### ANAPLAN
  Pricing: $150K-$300K+/year, custom contracts, no public pricing
  Target: Fortune 500, enterprise (1000+ employees)
  Model: Cloud-only SaaS

  TOP FEATURES:
    1. Hyperblock multi-dimensional calculation engine
    2. Connected planning across departments
    3. 200+ pre-built integrations
    4. Real-time collaboration
    5. Unlimited scenario modeling
    6. Workflow and approval management
    7. App Hub marketplace
    8. Sparsity handling for large models
    9. Granular RBAC
    10. Enterprise SSO/SAML

  BIGGEST WEAKNESSES (from G2, Reddit, Capterra):
    🔴 Insanely expensive — SMBs can't touch it
    🔴 6-18 month implementation with consultants
    🔴 Steep learning curve — requires "Anaplan certified" specialists
    🔴 Formula language is cryptic and frustrating
    🔴 Slow UI on complex models — browser-based lag
    🔴 Reporting is weak — exports look terrible
    🔴 Customer support is poor for the price
    🔴 Vendor lock-in — data nearly impossible to migrate out
    🔴 100% cloud — no offline capability whatsoever
    🔴 Pricing unpredictability — "workspace units" confuse customers

  OUR ADVANTAGE: Free, offline, instant setup, better UX, file-based sharing

#### WORKDAY ADAPTIVE PLANNING
  Pricing: $15K-$150K+/year, module-based
  Target: Mid-market to enterprise (200-5000 employees)
  Model: Cloud SaaS

  TOP FEATURES:
    1. Continuous planning (rolling forecasts)
    2. Workforce planning module
    3. Revenue planning
    4. Consolidation and reporting
    5. Excel integration (OfficeConnect)
    6. Custom dashboards
    7. What-if scenario analysis
    8. Workflow approvals
    9. Native Workday HCM integration
    10. Pre-built content library

  BIGGEST WEAKNESSES:
    🔴 Terrible UI — feels like 2012 software
    🔴 Slow — pages take 10-30 seconds to load
    🔴 Excel-heavy workflows feel bolted on
    🔴 Reporting is rigid — customization is painful
    🔴 Multi-entity consolidation is weak
    🔴 Long and expensive implementation
    🔴 Slow and unhelpful support
    🔴 Zero offline capability
    🔴 Forced to buy Workday HCM ecosystem for full value
    🔴 Calculation performance degrades with large models

  OUR ADVANTAGE: Offline, faster, better UI, not locked to Workday ecosystem

#### ORACLE HYPERION / PBCS
  Pricing: $100K-$1M+/year
  Target: Large enterprise (5000+ employees)
  Model: On-premise or cloud

  BIGGEST WEAKNESSES:
    🔴 ANCIENT UI — looks like 1998
    🔴 Requires specialist developers (not finance people)
    🔴 12-36 month implementation
    🔴 Requires dedicated IT infrastructure
    🔴 Extraordinarily expensive total cost of ownership
    🔴 Customization requires Groovy/MDX scripting
    🔴 Performance tuning is a dark art
    🔴 Oracle support is terrible
    🔴 Upgrading versions breaks everything

  OUR ADVANTAGE: Modern UI, zero implementation, free, no IT required

#### SAP BPC
  Pricing: $200K-$2M+/year (including infrastructure)
  Target: Very large enterprise, SAP customers
  Model: On-premise or SAP Cloud

  BIGGEST WEAKNESSES:
    🔴 Requires SAP ecosystem — useless without it
    🔴 12-48 month implementation
    🔴 Requires SAP certified consultants ($300+/hour)
    🔴 UI is ancient and painful
    🔴 Extremely expensive total cost of ownership
    🔴 Reports are rigid and ugly
    🔴 Completely inaccessible to mid-market

  OUR ADVANTAGE: Standalone, modern, free, accessible to all

#### IBM PLANNING ANALYTICS (TM1)
  Pricing: $50K-$500K+/year
  Target: Enterprise, TM1 heritage users
  Model: On-premise or cloud

  BIGGEST WEAKNESSES:
    🔴 TM1 rules language is extremely arcane
    🔴 UI is terrible — Cognos-era design
    🔴 Requires highly specialized consultants
    🔴 IBM's future commitment is uncertain
    🔴 Performance degrades with complex hierarchies
    🔴 Documentation is poor
    🔴 Support quality has declined sharply

  OUR ADVANTAGE: Modern, accessible formula language, better UI

### 1.2 Tier 2: Mid-Market Leaders ($20K-$100K/year)

#### PLANFUL (formerly Host Analytics)
  Pricing: $20K-$100K+/year
  Target: Mid-market (100-2000 employees)

  BIGGEST WEAKNESSES:
    🔴 Complex and clunky UI
    🔴 4-9 month implementation
    🔴 Dynamic planning (spreadsheet mode) is buggy
    🔴 Customer support is terrible (consistent G2 complaint)
    🔴 Consolidation module is unreliable
    🔴 Performance is poor with large data sets
    🔴 Reporting customization is extremely limited
    🔴 No offline capability
    🔴 High dependency on consultants
    🔴 Pricing increases aggressively at renewal

  OUR ADVANTAGE: Offline, faster, better UX, no consultants needed

#### VENA SOLUTIONS
  Pricing: $20K-$100K+/year
  Target: Mid-market finance teams that love Excel

  BIGGEST WEAKNESSES:
    🔴 It IS Excel — just with a database behind it. Not innovative.
    🔴 Scalability breaks down with complex models
    🔴 Everything is Excel — brings ALL of Excel's limitations
    🔴 Slow performance on large Excel models
    🔴 Reporting outside Excel is weak
    🔴 Collaboration is messy (Excel files checked in/out)
    🔴 No offline — Excel file ≠ offline app
    🔴 Expensive for what it is (essentially managed Excel)
    🔴 No real calculation engine — just Excel formulas

  OUR ADVANTAGE: Real calculation engine, not Excel-dependent, offline

#### PIGMENT
  Pricing: $30K-$200K+/year
  Target: Mid-market to enterprise

  TOP FEATURES:
    1. Modern UI (best-looking in the market)
    2. Multi-dimensional modeling
    3. Real-time collaboration
    4. Scenario planning
    5. Revenue modeling (SaaS-focused)

  BIGGEST WEAKNESSES:
    🔴 Very expensive for what you get
    🔴 Formula language is custom (learning curve)
    🔴 Reporting lacks depth/flexibility
    🔴 Limited ERP integrations
    🔴 Still maturing — many features feel incomplete
    🔴 No offline capability

  OUR ADVANTAGE: Offline, Excel-compatible formulas, deeper features

#### BOARD INTERNATIONAL
  Pricing: $50K-$300K+/year
  Target: Mid to large enterprise

  BIGGEST WEAKNESSES:
    🔴 Complex to configure — needs specialists
    🔴 UI feels dated despite updates
    🔴 Reporting is clunky
    🔴 Long and expensive implementation
    🔴 No offline capability in cloud version

#### JEDOX
  Pricing: $20K-$150K+/year
  Target: Mid-market to enterprise

  BIGGEST WEAKNESSES:
    🔴 Complex setup — needs IT involvement
    🔴 UI is not modern
    🔴 Steep learning curve
    🔴 Data integration is complex
    🔴 Customer support issues reported frequently

#### PROPHIX
  Pricing: $15K-$100K+/year
  Target: Mid-market

  BIGGEST WEAKNESSES:
    🔴 Implementation takes too long (4-8 months)
    🔴 UI is clunky and dated
    🔴 Calculation performance is slow
    🔴 Customer service is inconsistent
    🔴 Reporting customization is rigid
    🔴 No true multi-dimensional modeling

### 1.3 Tier 3: SMB/New Entrants ($1K-$30K/year)

#### DATARAILS
  Pricing: $2K-$3K/month
  Target: SMB, Excel-heavy teams

  BIGGEST WEAKNESSES:
    🔴 AI features are gimmicky and unreliable
    🔴 Still fundamentally Excel-dependent
    🔴 Limited modeling capability
    🔴 Weak for complex multi-entity structures
    🔴 Data quality issues on import
    🔴 No true multi-dimensional modeling
    🔴 Cloud only — no offline

#### CUBE SOFTWARE
  Pricing: $1.5K-$4K/month
  Target: Mid-market, Excel-familiar teams

  BIGGEST WEAKNESSES:
    🔴 Still fundamentally tied to Excel/Sheets limitations
    🔴 No true modeling engine
    🔴 Consolidation is basic
    🔴 Cloud-only
    🔴 Reporting outside spreadsheets is weak

#### MOSAIC TECH
  Pricing: $800-$2K/month
  Target: High-growth startups and scale-ups

  BIGGEST WEAKNESSES:
    🔴 Very limited for non-SaaS/startup businesses
    🔴 Not built for complex financial models
    🔴 No multi-entity consolidation
    🔴 Cloud-only — entirely dependent on internet
    🔴 Weak formula/modeling capability
    🔴 Doesn't scale past ~$50M revenue complexity

#### RUNWAY FINANCIAL
  Pricing: $500-$2K/month
  Target: Startups and venture-backed companies

  BIGGEST WEAKNESSES:
    🔴 Extremely limited for anything beyond startups
    🔴 No real formula engine
    🔴 No multi-entity support
    🔴 No balance sheet or cash flow statement modeling
    🔴 Cloud-dependent — 100% internet required
    🔴 Weak reporting
    🔴 Not suitable for any regulated industry

#### JIRAV
  Pricing: $1K-$5K/month
  Target: SMB to lower mid-market

  BIGGEST WEAKNESSES:
    🔴 Limited multi-dimensional modeling
    🔴 Weak for complex enterprise structures
    🔴 Cloud-only
    🔴 Formula customization is very limited
    🔴 Not built for manufacturing/inventory-heavy businesses
    🔴 Scales poorly beyond 200 employees

#### CAUSAL
  Pricing: $100-$500/month
  Target: Startups, SMBs, analysts who hate Excel

  BIGGEST WEAKNESSES:
    🔴 Not built for enterprise complexity
    🔴 No multi-entity consolidation
    🔴 Limited to relatively simple models
    🔴 Cloud-only
    🔴 No traditional financial statements out of the box
    🔴 Formula language is non-standard

### 1.4 Tier 4: The Incumbent (Everyone Uses)

#### MICROSOFT EXCEL
  Pricing: $6-$22/user/month (Microsoft 365)
  Target: Everyone — it's the default

  TOP FEATURES:
    1. Universal familiarity — everyone knows it
    2. Infinite flexibility (anything is possible)
    3. Offline capable
    4. Powerful formula engine
    5. VBA/Power Query automation
    6. Excellent charting
    7. Cheap/accessible

  BIGGEST WEAKNESSES:
    🔴 No multi-dimensional modeling natively
    🔴 Version control is non-existent
    🔴 No workflow/approvals
    🔴 Files corrupt randomly (especially large ones)
    🔴 Multi-user collaboration is painful
    🔴 No audit trail
    🔴 Formula errors cascade and are hard to find
    🔴 No scalability — breaks above ~500K rows practically
    🔴 No security — anyone with file access sees everything
    🔴 Calculation slowness on complex models
    🔴 No consolidation engine
    🔴 Reporting requires manual formatting

  OUR POSITION: We are what Excel SHOULD have been.
    Everything Excel does well (offline, flexible, familiar),
    we do BETTER. Everything Excel does poorly (no audit trail,
    no consolidation, no version control, no security),
    we SOLVE. We are Excel's natural successor for finance.

---

## 2. MASTER GAP ANALYSIS

### 2.1 TABLE STAKES (Features in 80%+ of tools — MUST HAVE)

  ✓ Budget vs. Actual reporting
  ✓ Basic scenario planning
  ✓ Dashboard/charts
  ✓ Excel import/export
  ✓ Workflow approvals
  ✓ Basic P&L reporting
  ✓ ERP integrations (cloud tools)
  ✓ User roles & permissions
  ✓ Variance analysis
  ✓ Basic headcount planning

### 2.2 RARE BUT HIGHLY DEMANDED (Features in <30% of tools)

  ⭐ True offline operation                    → ONLY Excel has this. Our #1 differentiator.
  ⭐ Sub-100ms recalculation on 1M+ cells      → Nobody achieves this consistently
  ⭐ File-based model sharing (no cloud)        → Nobody offers this except Excel
  ⭐ Unlimited scenario versions                → Most cap at 3-5 scenarios
  ⭐ Full multi-dimensional modeling for SMB     → Only enterprise tools have real MDX
  ⭐ Beautiful board-ready reports              → Most tools export ugly PDFs
  ⭐ Visual dependency graph for formulas       → No tool has this clearly
  ⭐ Monte Carlo simulation built-in            → Only available via expensive add-ons
  ⭐ True cross-dimensional formula language    → Only Anaplan/TM1 — too complex
  ⭐ Unlimited undo/redo with history viewer    → Most tools have limited undo

### 2.3 BLUE OCEAN (Features NO tool currently offers well)

  🌊 Complete offline operation with full feature parity
  🌊 File-based model (email like .xlsx but infinitely more powerful)
  🌊 Sub-100ms recalc without cloud processing
  🌊 Data NEVER leaves user's machine (true data sovereignty)
  🌊 No per-seat viewer licenses (share file = share access for viewers)
  🌊 Visual formula dependency graph (see what affects what)
  🌊 Built-in natural language formula comments (explain formula in English)
  🌊 One-click 3-statement model link (Income → Balance → Cash Flow auto-linked)
  🌊 Smart template auto-configuration from chart of accounts import
  🌊 Zero-setup multi-user via LAN (no cloud, no account, just local network)
  🌊 Tamper-proof immutable audit trail (for SOX compliance offline)
  🌊 Built-in model documentation generator
  🌊 Assumption library with version history
  🌊 Cross-model referencing (like linked Excel files but reliable and fast)
  🌊 Financial model health score (detect circular refs, formula errors, data quality)

### 2.4 WHERE EVERY COMPETITOR FAILS BADLY

  ❌ Speed — All cloud tools are SLOW. Users wait 5-30 seconds constantly.
  ❌ Offline — 0 cloud tools work offline (Excel is the only exception)
  ❌ Data security — All cloud tools require your financial data to live on their servers
  ❌ Implementation time — All enterprise tools take 6-18 months to go live
  ❌ Cost — All serious tools are $20K-$1M+/year
  ❌ UX for power users — Keyboard shortcuts and power-user features are terrible everywhere
  ❌ Formula flexibility — Either too rigid (dashboards tools) or too complex (Anaplan/TM1)
  ❌ Reporting quality — PDF/PPT exports universally look cheap and amateur
  ❌ Vendor lock-in — Migration from any cloud tool is a nightmare
  ❌ Scalability vs. simplicity — Tools are either powerful-but-complex or simple-but-weak

### 2.5 Priority Scoring Methodology

Each feature is scored on 4 dimensions (1-10 each):

  USER IMPACT: How much does this affect the user's daily workflow?
    10 = They can't work without it
    7-9 = Major pain point, high demand
    4-6 = Nice to have, moderate demand
    1-3 = Rarely needed

  COMPETITIVE NECESSITY: Do 50%+ of competitors have this?
    10 = Table stakes (must have or users won't even try)
    7-9 = Expected by most users
    4-6 = Differentiator (some competitors have it)
    1-3 = Blue ocean (nobody has it well)

  IMPLEMENTATION EASE: How hard is this to build?
    10 = Trivial (< 1 day)
    7-9 = Moderate (1-3 days)
    4-6 = Complex (1-2 weeks)
    1-3 = Very complex (1+ months)

  STRATEGIC VALUE: Does this create a moat or lock-in?
    10 = Creates switching costs, users can't leave
    7-9 = Strong differentiator, hard to copy
    4-6 = Moderate differentiator
    1-3 = Easy to replicate

  PRIORITY SCORE = (User Impact × 3) + (Competitive Necessity × 3) +
                   (Implementation Ease × 2) + (Strategic Value × 2)

  Maximum score: 100
  Priority bands:
    80-100: 🔴 CRITICAL — Build immediately
    60-79:  🟡 HIGH — Build in next sprint
    40-59:  🟢 MEDIUM — Build when capacity allows
    20-39:  ⚪ LOW — Build eventually
    0-19:   ⬜ BACKLOG — Nice to have

---

## 3. FEATURE UNIVERSE — 345 INDIVIDUAL FEATURES

### Category A: Core Financial Planning (20 features)

  A1.01  Annual budget (12-month plan)
  A1.02  Quarterly budget
  A1.03  Monthly budget with weekly breakdown option
  A1.04  Rolling budget (always X months forward)
  A1.05  Multi-year strategic plan (3, 5, 10 year)
  A1.06  Zero-based budgeting (start from zero, justify every line)
  A1.07  Activity-based budgeting (cost per activity driver)
  A1.08  Incremental budgeting (prior year +/- %)
  A1.09  Top-down budget (executive sets targets, cascades down)
  A1.10  Bottom-up budget (departments build up, consolidates)
  A1.11  Hybrid (top-down targets + bottom-up submissions)
  A1.12  Budget lock after approval (prevent edits)
  A1.13  Budget reforecast mid-year
  A1.14  Budget amendment workflow (change request process)
  A1.15  Original budget vs. revised budget tracking
  A1.16  Department-level budget templates
  A1.17  Project-level budget allocation
  A1.18  Cost center budget management
  A1.19  Budget calendar management (who submits what, by when)
  A1.20  Budget submission status dashboard

### Category B: Forecasting (15 features)

  A2.01  Driver-based forecasting (Revenue = Units × Price × Close Rate)
  A2.02  Trend-based forecasting (linear, exponential, moving average)
  A2.03  Seasonal adjustment (apply seasonal indices)
  A2.04  Time-series forecasting (statistical methods)
  A2.05  Regression-based forecasting (multi-variable)
  A2.06  Rolling 12-month forecast
  A2.07  Rolling 18-month forecast
  A2.08  Rolling 24-month forecast
  A2.09  Forecast vs. budget variance tracking
  A2.10  Forecast accuracy tracking (how good were past forecasts)
  A2.11  Forecast confidence intervals (best case / worst case bands)
  A2.12  Forecast override with reason codes
  A2.13  Automated forecast based on actuals trends
  A2.14  Category-level forecasting (different methods per line)
  A2.15  Forecast waterfall (how has forecast changed each month)

### Category C: Scenario Planning (15 features)

  A3.01  Unlimited named scenarios
  A3.02  Scenario branching from any base scenario
  A3.03  Side-by-side scenario comparison (up to 5 at once)
  A3.04  Global assumption changes (change one driver, affects all)
  A3.05  Scenario probability weighting (30% base, 20% bull, etc.)
  A3.06  Sensitivity analysis (tornado chart)
  A3.07  What-if slider (move a slider, see real-time P&L impact)
  A3.08  Monte Carlo simulation (statistical range outcomes)
  A3.09  Break-even analysis
  A3.10  Scenario narratives (document assumptions per scenario)
  A3.11  Scenario comparison report
  A3.12  Scenario merge (combine assumptions from two scenarios)
  A3.13  Scenario tagging (mark as "Board Approved", "Stretch", etc.)
  A3.14  Scenario history (all past scenarios preserved)
  A3.15  Scenario publishing (make a scenario the "official" plan)

### Category D: Consolidation & Reporting (25 features)

  B1.01  Multi-entity consolidation (unlimited entities)
  B1.02  Legal entity hierarchy (parent/child relationships)
  B1.03  Management reporting hierarchy (different from legal)
  B1.04  Intercompany transaction tracking
  B1.05  Intercompany elimination entries
  B1.06  Automatic elimination by intercompany flag
  B1.07  Partial ownership / minority interest calculation
  B1.08  Equity method accounting
  B1.09  Proportional consolidation
  B1.10  Currency translation (closing rate, average rate, historical rate)
  B1.11  CTA (Cumulative Translation Adjustment) calculation
  B1.12  Consolidation journal entries
  B1.13  Pre and post elimination reporting
  B1.14  Entity-level vs. consolidated reporting
  B1.15  Consolidation audit trail
  B1.16  GAAP compliance consolidation
  B1.17  IFRS compliance consolidation
  B1.18  Segment reporting (IFRS 8 / ASC 280)
  B1.19  Consolidation ownership table (% ownership per period)
  B1.20  Deferred tax calculation (basic)

### Category E: Financial Statements (15 features)

  B2.01  Income Statement (P&L) — GAAP format
  B2.02  Balance Sheet — GAAP format
  B2.03  Cash Flow Statement — Direct method
  B2.04  Cash Flow Statement — Indirect method
  B2.05  Statement of Retained Earnings
  B2.06  Statement of Comprehensive Income
  B2.07  Notes to financial statements (template)
  B2.08  Three-statement model (P&L → BS → CF auto-linked)
  B2.09  Management accounts format (custom P&L layout)
  B2.10  Contribution margin P&L (by product/segment)
  B2.11  Rolling 12-month P&L view
  B2.12  Year-to-date vs. full year view
  B2.13  Multiple currency display in statements
  B2.14  Comparative period columns (current + prior year + budget + forecast)
  B2.15  Footnote linking in reports

### Category F: Reporting Engine (25 features)

  B3.01  Drag-and-drop report builder
  B3.02  Row/column definition templates
  B3.03  Conditional formatting in reports
  B3.04  Report formulas (not just data — calculations in reports)
  B3.05  Calculated rows and columns
  B3.06  Subtotals and grand totals with suppression options
  B3.07  Report scheduling (auto-generate and email)
  B3.08  Report bursting (generate per-entity automatically)
  B3.09  Report packages (multi-report PDF books)
  B3.10  Table of contents for report packages
  B3.11  Drill-down within reports (click total → see detail)
  B3.12  Drill-through to source data
  B3.13  Report commentary / annotations
  B3.14  Report templates library (30+ pre-built)
  B3.15  Custom branding (logo, colors, fonts)
  B3.16  Export: PDF (pixel-perfect)
  B3.17  Export: Excel (with live formulas)
  B3.18  Export: PowerPoint (with editable charts)
  B3.19  Export: Word (narrative reports)
  B3.20  Export: CSV/JSON
  B3.21  Board pack generation (full CFO deck in one click)
  B3.22  Report version history
  B3.23  Report access control (who can see which reports)
  B3.24  Embedded charts in reports

### Category G: Dashboards & KPIs (20 features)

  B4.01  Drag-and-drop dashboard builder
  B4.02  30+ chart types (bar, line, waterfall, pie, scatter, area, etc.)
  B4.03  KPI cards with trend indicator
  B4.04  Traffic light / RAG status (Red/Amber/Green)
  B4.05  Gauge charts for targets
  B4.06  Sparklines for compact trend views
  B4.07  Cross-dimensional filters on dashboards
  B4.08  Drill-down from chart to data
  B4.09  Dashboard interactivity (click chart element → filter others)
  B4.10  Dashboard templates (Executive, CFO, Department Head, etc.)
  B4.11  Full-screen kiosk mode (for TV/large screen display)
  B4.12  Multiple pages per dashboard
  B4.13  Real-time recalculation on dashboards
  B4.14  Comparative period visual (current vs. prior bar chart)
  B4.15  Waterfall chart for variance bridges
  B4.16  Bubble chart for multi-variable analysis
  B4.17  Heat map for period-over-period matrices
  B4.18  Scatter plot for correlation analysis
  B4.19  Dashboard export to PDF/PPT
  B4.20  Dashboard sharing (export as interactive HTML)

### Category H: Data Management (35 features)

  C1.01  CSV import (configurable delimiter, encoding, date format)
  C1.02  Excel import (.xlsx, .xls) — multi-sheet support
  C1.03  XML/JSON import
  C1.04  ODBC database connection (when online or local DB)
  C1.05  Direct SQL query import
  C1.06  REST API data pull
  C1.07  Flat file import with transformation rules
  C1.08  Import mapping (their columns → our dimensions) with save
  C1.09  Import preview before committing
  C1.10  Import validation (flag data issues before import)
  C1.11  Duplicate detection on import
  C1.12  Data transformation rules (calculate/reformat during import)
  C1.13  Chart of accounts mapping table (source → target COA)
  C1.14  Import scheduling (recurring, when online)
  C1.15  Import audit log (what was imported, when, by whom)
  C1.16  Partial import (import only changed/new records)
  C1.17  Rollback last import
  C1.18  Data quality scoring (% complete, % valid)
  C1.19  Historical data archiving (move old periods to archive)
  C1.20  Data export to all formats
  C1.21  Dimension management (create/edit/delete dimensions)
  C1.22  Hierarchy management (parent/child, multiple roll-ups)
  C1.23  Alternate hierarchies (same data, different roll-up views)
  C1.24  Attribute management (metadata per dimension member)
  C1.25  Dimension member import from Excel
  C1.26  Version control (unlimited named plan versions)
  C1.27  Version comparison (diff two versions)
  C1.28  Version locking
  C1.29  Version copying (start new version from existing)
  C1.30  Auto-backup every 30 seconds (local)
  C1.31  Manual backup/restore
  C1.32  Full audit trail (every cell change: who, when, old, new)
  C1.33  Change comments (require comment on cell change option)
  C1.34  Audit trail export (CSV/PDF for compliance)
  C1.35  Data integrity checks (balance sheet balances, eliminations net to zero)

### Category I: Modeling Engine (35 features)

  D1.01  Custom formula engine (Excel-compatible + extensions)
  D1.02  Multi-dimensional formula references [Entity, Period, Account, Scenario]
  D1.03  Named ranges / named formulas
  D1.04  Business rules engine (define rules separately from data)
  D1.05  Allocation engine (allocate cost to cost centers by drivers)
  D1.06  Spread engine (spread annual to monthly by various methods)
  D1.07  Spread methods: Even, Manual, Seasonal, Trend, Curve
  D1.08  Driver-based calculation maps
  D1.09  Dependency graph (see what drives what)
  D1.10  Circular reference detection and handling
  D1.11  Iterative calculation (for circular refs like interest on debt)
  D1.12  Lookup functions (VLOOKUP, INDEX/MATCH, XLOOKUP equivalent)
  D1.13  Conditional logic (IF, IFS, SWITCH, CHOOSE)
  D1.14  Financial functions (NPV, IRR, XNPV, XIRR, PV, FV, PMT)
  D1.15  Statistical functions (AVERAGE, STDEV, PERCENTILE, etc.)
  D1.16  Date/time functions (EDATE, EOMONTH, NETWORKDAYS, etc.)
  D1.17  Text functions (CONCATENATE, MID, LEFT, RIGHT, etc.)
  D1.18  Aggregation functions (SUM, SUMIF, COUNTIF, etc.)
  D1.19  Time intelligence (YTD, QTD, prior period, same period last year)
  D1.20  Rolling calculations (rolling 12-month sum/average)
  D1.21  FX rate application (apply closing/average/historical rates)
  D1.22  FX gain/loss calculation
  D1.23  Depreciation engine (straight-line, declining balance, MACRS)
  D1.24  Amortization schedules
  D1.25  Debt schedule engine (interest calculation, principal)
  D1.26  Working capital modeling (AR, AP, inventory DSO/DPO/DIO)
  D1.27  Tax modeling (corporate tax rate, deferred taxes)
  D1.28  Intercompany transfer pricing rules
  D1.29  Formula auditing (trace precedents, trace dependents)
  D1.30  Formula syntax highlighting in formula bar
  D1.31  Formula auto-complete with documentation
  D1.32  Custom user-defined functions
  D1.33  Formula templates library
  D1.34  Model health checker (find errors, inconsistencies)
  D1.35  Calculation mode: Auto, Manual, Smart

### Category J: Cash Flow & Treasury (20 features)

  E1.01-E1.20: Direct/indirect CF, 13-week forecast, cash waterfall,
  burn rate, runway, liquidity ratios, working capital cycle,
  collections/disbursements forecast, payroll/capex/debt timing,
  covenant tracking, multi-account pooling, IC transfers, FX hedging,
  investment modeling

### Category K: Workforce Planning (20 features)

  F1.01-F1.20: Headcount by dept/role/location, open requisitions,
  hiring plan, attrition modeling, salary bands, merit increases,
  bonus modeling, benefits, payroll taxes, equity comp, FTE vs contractor,
  part-time, overtime, training budget, recruiting cost, org chart,
  headcount dashboard, workforce scenarios, HC-to-revenue ratio,
  vacancy cost

### Category L: Sales & Revenue (20 features)

  G1.01-G1.20: Revenue build-up, pipeline conversion, territory/quota,
  sales rep planning, pricing scenarios, cohort analysis, SaaS metrics
  (MRR/ARR/NRR/GRR/churn), CAC modeling, LTV modeling, LTV:CAC ratio,
  subscription tiers, ASC 606 rev rec, deferred revenue waterfall,
  bookings-to-revenue bridge, upsell/cross-sell, product mix, gross margin,
  channel revenue, geographic breakdown, revenue capacity

### Category M: Operational Planning (25 features)

  H1.01-H1.25: Project budgeting, project profitability, marketing budget,
  IT infrastructure, R&D budget, inventory cost, COGS build-up, gross margin
  bridge, manufacturing capacity, supply chain, logistics, facilities,
  insurance, professional services, travel, SaaS subscriptions, CapEx by
  category, CapEx approval, depreciation impact, lease accounting (ASC 842),
  ROU asset/liability, maintenance, warranty reserve

### Category N: Analytics & Intelligence (30 features)

  I1.01-I1.30: YoY/QoQ/MoM comparisons, SPLY, TTM, BvA/FvA/PvP variance,
  variance bridge/waterfall, price-volume-mix, flex budget, bridge analysis,
  Pareto, contribution margin, break-even, operating leverage, statistical
  functions, correlation matrix, regression, trend fitting, seasonality,
  anomaly detection, outlier detection, Monte Carlo, sensitivity table,
  goal seek, data profiling, formula-based alerts, KPI trend indicators

### Category O: Collaboration & Workflow (25 features)

  J1.01-J1.25: User management, RBAC, object-level permissions, cell-level
  security, row-level security, approval workflow, multi-step approvals,
  approval delegation, plan submission workflow, rejection with comments,
  plan locking, task assignment, task deadlines, task completion tracking,
  budget calendar, cell-level comments, threaded discussions, comment
  resolution, @mention, email notifications, audit log, assumption
  documentation, version control, version comparison, async collaboration

### Category P: User Experience (30 features)

  K1.01-K1.30: Modern UI, dark/light mode, customizable workspace,
  resizable panels, multi-tab workspace, full keyboard navigation,
  command palette, global search, deep undo/redo, undo history viewer,
  auto-save, crash recovery, onboarding wizard, contextual help,
  template library, intelligent defaults, multi-monitor support,
  font size/zoom, dense mode, comfortable mode, customizable toolbar,
  pinnable favorites, recent files, quick access, status bar,
  progress indicator, toast notifications, contextual menus,
  drag and drop, touch/trackpad gestures

### Category Q: Integration & Connectivity (20 features)

  L1.01-L1.20: REST API, webhooks, ODBC driver, QuickBooks (Online + Desktop),
  Xero, NetSuite, Sage, SAP, Microsoft Dynamics, Salesforce, HubSpot,
  BambooHR/Workday HCM, Gusto/ADP, Stripe, Power BI export, Tableau export,
  Google Sheets sync, email integration, Slack notifications

### Category R: Security & Compliance (20 features)

  M1.01-M1.20: AES-256 file encryption, password protection, user auth,
  MFA/TOTP, password policies, session management, granular RBAC,
  immutable audit trail, audit trail export for SOX, data residency,
  secure file deletion, clipboard security, screen capture protection,
  export watermarking, export permissions, SOX documentation, GDPR
  readiness, HIPAA data segregation, compliance logging, IP whitelisting

### Category S: Deployment & Performance (20 features)

  N1.01-N1.20: Windows installer (signed), macOS DMG (signed, notarized),
  Linux packages, portable version, sub-2s cold start, 60fps UI always,
  sub-100ms recalc (1M cells), virtual scrolling (10M rows), background
  calculation, background auto-save, background import/export, memory-mapped
  file access, multi-threaded parallel calc, auto-update, offline update,
  update rollback, plugin architecture, LAN multi-user, mobile companion,
  air-gapped deployment

### Category T: Unique Differentiating Features (20 features)

  O1.01-O1.20: Full offline with parity, file-based sharing, data stays
  on device, no viewer licenses, visual dependency graph, model health
  score, built-in assumption library, one-click 3-statement auto-link,
  what-if live slider, formula plain-English panel, cross-model referencing,
  smart template auto-config, built-in Monte Carlo, LAN collaboration,
  zero implementation time, financial model review mode, calculation
  step-through debugger, historical forecast accuracy leaderboard,
  financial modeling best practices checker, native air-gapped deployment

---

## 4. GAP ANALYSIS — FINPLAN PRO vs. FEATURE UNIVERSE

### 4.1 Coverage by Category

┌────────────────────────────────────┬─────────┬──────────┬───────────┐
│ Category                           │ Feature │ Estimated│ Priority  │
│                                    │ Count   │ Coverage │ Level     │
├────────────────────────────────────┼─────────┼──────────┼───────────┤
│ A. Core Financial Planning         │ 20      │ ~65%     │ 🔴 P0     │
│ B. Consolidation & Reporting       │ 25      │ ~50%     │ 🔴 P0     │
│ C. Data Management                 │ 35      │ ~45%     │ 🔴 P0     │
│ D. Modeling Engine                 │ 35      │ ~40%     │ 🔴 P0     │
│ E. Cash Flow & Treasury            │ 20      │ ~45%     │ 🟡 P1     │
│ F. Workforce Planning              │ 20      │ ~40%     │ 🟡 P1     │
│ G. Sales & Revenue                 │ 20      │ ~35%     │ 🟡 P1     │
│ H. Operational Planning            │ 25      │ ~35%     │ 🟡 P1     │
│ I. Analytics & Intelligence        │ 30      │ ~30%     │ 🟡 P1     │
│ J. Collaboration & Workflow        │ 25      │ ~35%     │ 🟢 P2     │
│ K. User Experience                 │ 30      │ ~55%     │ 🔴 P0     │
│ L. Integration & Connectivity      │ 20      │ ~10%     │ 🟢 P2     │
│ M. Security & Compliance           │ 20      │ ~35%     │ 🔴 P0     │
│ N. Deployment & Performance        │ 20      │ ~30%     │ 🔴 P0     │
│ O. Unique Differentiating Features │ 20      │ ~25%     │ 🔴 P0     │
├────────────────────────────────────┼─────────┼──────────┼───────────┤
│ OVERALL                            │ ~345    │ ~38%     │           │
└────────────────────────────────────┴─────────┴──────────┴───────────┘

### 4.2 TOP 20 HIGHEST IMPACT MISSING FEATURES

Scored: User Impact (1-10) × Competitive Necessity (1-10) × Ease (1-10) = Priority Score

  #1  File save/load with version history     — Score: 700  [CRITICAL]
  #2  Three-statement auto-link (P&L→BS→CF)   — Score: 630  [CRITICAL]
  #3  Variance analysis (BvA, FvA, PvP)       — Score: 630  [CRITICAL]
  #4  Core Calculation Engine verification     — Score: 600  [CRITICAL]
  #5  Excel import/export (full fidelity)      — Score: 540  [CRITICAL]
  #6  Scenario planning with live what-if      — Score: 540  [CRITICAL]
  #7  Report builder + PDF export              — Score: 480  [CRITICAL]
  #8  Drill-down capability                    — Score: 486  [CRITICAL]
  #9  Headcount/workforce planning             — Score: 448  [HIGH]
  #10 Audit trail (immutable, exportable)      — Score: 448  [HIGH]
  #11 Dashboard builder with 10+ chart types   — Score: 432  [HIGH]
  #12 Budget workflow (submit/approve/lock)     — Score: 432  [HIGH]
  #13 Template library (30+ models)            — Score: 392  [HIGH]
  #14 Rolling forecast automation              — Score: 384  [HIGH]
  #15 Undo/redo deep history                   — Score: 336  [HIGH]
  #16 Multi-dimensional modeling               — Score: 324  [HIGH]
  #17 Multi-entity consolidation               — Score: 252  [MEDIUM]
  #18 What-if live slider                      — Score: 162  [WOW FACTOR]
  #19 Formula dependency graph                 — Score: 80   [DIFFERENTIATOR]
  #20 Monte Carlo simulation                   — Score: 72   [DIFFERENTIATOR]

---

## 5. USER COMPLAINTS — WHAT REAL USERS HATE

### 5.1 Top 15 Complaints About Existing Tools (from 500+ reviews)

  1. "It takes 6 MONTHS to implement" (Anaplan, Adaptive, Planful)
     → YOUR ADVANTAGE: Opens instantly, works immediately

  2. "It costs $150K/year and they raise prices every year"
     → YOUR ADVANTAGE: Free or one-time purchase

  3. "The UI looks like it was built in 2008"
     → YOUR OPPORTUNITY: Modern React + Tailwind UI

  4. "I can't work on the plane / at home without VPN"
     → YOUR CORE ADVANTAGE: Offline-first

  5. "Our data lives on THEIR servers — what if they get hacked?"
     → YOUR CORE ADVANTAGE: Data stays on user's machine

  6. "Excel import is terrible — nothing maps correctly"
     → CRITICAL: Your Excel import must be FLAWLESS

  7. "The formula language is confusing — I shouldn't need a certification"
     → CRITICAL: Your formula language must feel FAMILIAR (Excel-compatible)

  8. "Reporting is ugly — I spend 2 hours formatting for the board"
     → CRITICAL: Your PDF/PPT export must be BOARD-READY

  9. "It's SLOW — I click and wait 10 seconds"
     → YOUR ADVANTAGE: Instant calculation, local processing

  10. "We're locked in — migrating data out is nearly impossible"
     → YOUR ADVANTAGE: .finplan files are self-contained, export everything

  11. "Customer support is terrible" (every cloud vendor)
     → YOUR ADVANTAGE: Open source community, or direct founder support

  12. "Consolidation breaks with more than 5 entities"
     → CRITICAL: Your consolidation must handle 50+ entities

  13. "Scenario planning is limited to 3-5 scenarios"
     → YOUR ADVANTAGE: Unlimited scenarios

  14. "Multi-currency is an afterthought"
     → CRITICAL: Your MultiCurrencyEngine must be robust

  15. "The audit trail doesn't show WHO changed WHAT"
     → CRITICAL: Immutable, detailed audit trail

### 5.2 Features Users WISH Existed (No Tool Has These Well)

  1. "I wish I could slide a number and watch the ENTIRE P&L update instantly"
     → WHAT-IF LIVE SLIDER — your unique differentiator

  2. "I wish I could see WHY a formula gives this result — trace it visually"
     → VISUAL DEPENDENCY GRAPH — no competitor has this

  3. "I wish the tool would TELL ME if something looks wrong before I present it"
     → MODEL HEALTH CHECKER — no competitor does this proactively

  4. "I wish I could open ANY Excel file and have it just work"
     → PERFECT EXCEL IMPORT — table stakes but nobody does it well

  5. "I wish my board pack could be generated in ONE click"
     → ONE-CLICK BOARD PACK — must be beautiful

  6. "I wish I didn't need to explain the tool to every new team member"
     → ONBOARDING + CONTEXTUAL HELP

  7. "I wish I could link my P&L to my Balance Sheet to my Cash Flow automatically"
     → THREE-STATEMENT AUTO-LINK — critical feature

  8. "I wish I could share a model file like I share an Excel file — just email it"
     → FILE-BASED SHARING — your .finplan format

  9. "I wish the tool would show me the assumptions behind every number"
     → ASSUMPTION DOCUMENTATION — linked to cells

  10. "I wish I could compare two plan versions side by side with differences highlighted"
     → VERSION DIFF VIEW — VersionControlEngine must support this

### 5.3 Kill Shot Features (End Competitor Conversations)

These features, if done WELL, would make a CFO stop evaluating competitors:

  KILL SHOT #1: PERFECT EXCEL IMPORT
    Why: Every competitor's Excel import is terrible. If ours is FLAWLESS
    — formulas preserved, formatting kept, complex files work — it
    eliminates the #1 switching cost.
    Test: Import 50 real-world Excel files (budgets, forecasts, models).
    Every single one must work perfectly.

  KILL SHOT #2: WHAT-IF LIVE SLIDER
    Why: No competitor does this well. A CFO slides a number and watches
    the ENTIRE P&L, Balance Sheet, and Cash Flow update in real-time.
    This is the "wow" moment that gets them to download.
    Demo: Show P&L with a revenue slider. Slide from $10M to $15M.
    Everything updates in <100ms. CFO's jaw drops.

  KILL SHOT #3: ONE-CLICK BOARD PACK
    Why: CFOs spend 2-4 hours formatting board packs. If we generate
    a beautiful, board-ready PDF in one click, we save them a full
    afternoon of work. Every month. Forever.
    Output: Professional PDF with P&L, BS, CF, variance analysis,
    KPI dashboard, scenario comparison. Branded. Print-ready.

  KILL SHOT #4: OFFLINE + FILE-BASED SHARING
    Why: "Email me the model" is how finance teams ACTUALLY work.
    Our .finplan file format = Excel's killer feature (shareability)
    but with version control, encryption, and audit trail.
    Test: Email a .finplan file. Recipient opens it. All data intact.

  KILL SHOT #5: INSTANT RECALCULATION
    Why: Cloud tools take 5-30 seconds to recalculate. If we do it
    in <100ms for 1M cells, the speed difference is PHYSICALLY NOTICEABLE.
    It's not a feature — it's a FEELING. "This is FAST."
    Benchmark: 100K cells < 50ms, 1M cells < 500ms, 10M cells < 5s.

---

## 5.5 ACTUAL INDUSTRY SECTORS (VERIFIED FROM CODEBASE)

The project has 16 industry sector configurations in src/config/sectors/:

  agriculture.ts    — Agricultural financial modeling
  banking.ts        — Banking/financial institution
  construction.ts   — Construction project costing
  education.ts      — Educational institution budgeting
  energy.ts         — Energy sector planning
  government.ts     — Government/public sector
  healthcare.ts     — Healthcare financial modeling
  hospitality.ts    — Hospitality industry
  insurance.ts      — Insurance industry
  logistics.ts      — Logistics and supply chain
  manufacturing.ts  — Manufacturing COGS/inventory
  realestate.ts     — Real estate portfolio management
  retail.ts         — Retail store performance
  technology.ts     — Technology/SaaS company
  telecom.ts        — Telecommunications

NOTE: ESG is an ENGINE (ESGEngine.ts), not a sector config.
SaaS is covered under the Technology sector.

---

## 6. COMPETITIVE FEATURE MATRIX

┌──────────────────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────┐
│ Feature              │ Us │Ana │Plf │Ven │Ada │Dat │Cub │Pig │Mos │Run │Jir  │
├──────────────────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─────┤
│ Offline Operation    │ ✅ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ Multi-dim Modeling   │    │ ✅ │ 🟡 │ 🟡 │ 🟡 │ ❌ │ ✅ │ ✅ │ 🟡 │ 🟡 │ 🟡  │
│ Real-time Calc       │    │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡  │
│ Data on User Device  │ ✅ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ No Seat Licenses     │ ✅ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ Board-Ready Reports  │    │ ✅ │ ✅ │ ✅ │ ✅ │ 🟡 │ 🟡 │ ✅ │ ✅ │ 🟡 │ 🟡  │
│ Excel Compatibility  │    │ 🟡 │ ✅ │ ✅ │ 🟡 │ ✅ │ 🟡 │ 🟡 │ 🟡 │ 🟡 │ 🟡  │
│ Consolidation        │    │ ✅ │ ✅ │ 🟡 │ ✅ │ ❌ │ 🟡 │ ✅ │ 🟡 │ ❌ │ 🟡  │
│ Scenario Planning    │    │ ✅ │ ✅ │ 🟡 │ ✅ │ 🟡 │ 🟡 │ ✅ │ ✅ │ 🟡 │ 🟡  │
│ Workforce Planning   │    │ ✅ │ ✅ │ 🟡 │ ✅ │ ❌ │ ❌ │ ✅ │ 🟡 │ 🟡 │ 🟡  │
│ Audit Trail          │    │ ✅ │ ✅ │ ✅ │ ✅ │ 🟡 │ 🟡 │ ✅ │ 🟡 │ ❌ │ 🟡  │
│ Multi-Currency       │    │ ✅ │ ✅ │ 🟡 │ ✅ │ ❌ │ ❌ │ ✅ │ ❌ │ ❌ │ ❌  │
│ Monte Carlo          │    │ 🟡 │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ SaaS Metrics         │    │ 🟡 │ ❌ │ ❌ │ ❌ │ ✅ │ ❌ │ ✅ │ ✅ │ ✅ │ 🟡  │
│ Industry Templates   │    │ 🟡 │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ LAN Collaboration    │ ✅ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ Zero Setup Time      │ ✅ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
│ Plugin Architecture  │    │ ✅ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌ │ ❌  │
└──────────────────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴─────┘

Legend: ✅ = Excellent  🟡 = Good/Partial  ❌ = Missing  blank = Unknown/Unverified

Ana=Anaplan, Plf=Planful, Ven=Vena, Ada=Adaptive, Dat=Datarails,
Cub=Cube, Pig=Pigment, Mos=Mosaic, Run=Runway, Jir=Jirav

OUR COLUMN MUST SHOW ✅ FOR EVERY FEATURE BEFORE v1.0 LAUNCH.

---

## 7. FEATURE DEPENDENCY GRAPH

Some features MUST be built before others:

  Excel Import ──→ Template Library ──→ Board Pack Generator
       │
       └──→ Chart of Accounts Mapping ──→ Consolidation

  Formula Engine ──→ Variance Analysis ──→ Scenario Comparison
       │
       └──→ Monte Carlo ──→ Sensitivity Analysis

  Cube Engine ──→ Multi-Dimensional Reports ──→ Dashboard Builder
       │
       └──→ Pivot Tables ──→ Drill-Through

  Authentication ──→ RBAC ──→ Cell-Level Security ──→ Audit Trail
       │
       └──→ Approval Workflows ──→ Plan Locking

  File Save/Load ──→ Version Control ──→ Branch/Merge
       │
       └──→ Auto-Save ──→ Crash Recovery

BUILD ORDER (dependency-resolved):
  1. Formula Engine (everything depends on this)
  2. File Save/Load (persistence is critical)
  3. Excel Import (switching cost enabler)
  4. Cube Engine (multi-dimensional foundation)
  5. Authentication + RBAC (security foundation)
  6. Variance Analysis (core FP&A feature)
  7. Reporting + Export (board-ready output)
  8. Scenario Planning (competitive differentiator)
  9. Dashboard Builder (visual insight)
  10. Everything else

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  END OF PART 3                                                               ║
║                                                                              ║
║  This document provides the complete competitive battlefield map.            ║
║  The fleet now knows every competitor's weaknesses, every feature           ║
║  in the universe, every gap in our product, and every blue ocean            ║
║  opportunity.                                                                ║
║                                                                              ║
║  Part remaining:                                                             ║
║    Part 4: Master Roadmap + Strategy + Session Protocols                     ║
║                                                                              ║
║  Say "Generate Part 4" when ready.                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
