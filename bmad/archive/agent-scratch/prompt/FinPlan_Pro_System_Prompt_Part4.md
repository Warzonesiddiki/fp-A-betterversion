# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 4 of 5: Gap-Focused Roadmap, Strategy & Session Protocols
## Version 5.0.0 | Generated 2026-05-18 | VERIFIED AGAINST ACTUAL CODEBASE

---

## 0. PURPOSE OF THIS PART

This part is the GAP-CLOSURE BATTLE PLAN. It answers:
  - What is already BUILT vs. PARTIAL vs. MISSING? (gap-focused roadmap)
  - HOW do we close the gaps fastest? (priority closure plan)
  - HOW do we make money? (monetization strategy)
  - HOW do we win users? (go-to-market strategy)
  - WHAT could kill us? (risk analysis)
  - WHAT should we do RIGHT NOW? (critical findings → immediate action)

---

## 1. GAP-FOCUSED ROADMAP

### STATUS KEY

  ✅ BUILT     — Feature exists in codebase, verified working
  🟡 PARTIAL   — Feature exists but incomplete, buggy, or not wired
  ❌ MISSING   — Feature does not exist in codebase
  🔥 PRIORITY  — Critical gap (from Part 5 §11 findings)

### CODEBASE REALITY (v0.1.0, ~62K LOC)

  60-70% of the greenfield roadmap items are already built or partially
  built. The prompt is no longer a "build from scratch" plan — it is a
  "close the gaps" plan.

### TIER 0: CRITICAL GAPS — Fix These NOW (1-2 week sprint)

  These are things the prompt CLAIMS exist but the codebase DOES NOT HAVE.
  From Part 5 §11 critical findings analysis.

  🔥 C1: Excel Import Not Implemented (PRESENT: code exists but broken)
       ImportEngine.importFile() returns an error for .xlsx files.
       xlsx library IS installed but ImportEngine doesn't use it.
       Fix: Wire the xlsx parser into ImportEngine. [Part 5 §11 Finding 1]

  🔥 C2: LoginPage Is a Stub (MISSING: auth UI not connected)
       LoginPage.tsx uses fake setTimeout(800ms), never calls authStore.
       Auth flow (JWT, refresh, interceptor) WORKS but login page bypasses it.
       Fix: Connect LoginPage to authStore.login(). [Part 5 §11 Finding 2]

  🔥 C3: Auto-Save Interval Wrong (PRESENT: 5min instead of 30s)
       AutoSaveEngine defaults to 300000ms (5 minutes). Prompt claims 30s.
       Fix: Change default intervalMs to 30000. [Part 5 §11 Finding 4]

  🔥 C4: Budget Store Undo/Redo Split (PARTIAL: two implementations)
       budgetStore uses inline history; glStore uses UndoRedoEngine<T>.
       Fix: Port budgetStore to UndoRedoEngine. [Part 5 §11 Finding 5]

  🔥 C5: Undersized Formula Engine (PRESENT: only 5 functions)
       FormulaEngine currently has only 5 functions (SUM, IF, NPV, IRR, PMT).
       Needs 50+ functions to be competitive (see Part 5 §11.1 for full list).
       Fix: Implement AVERAGE, MIN, MAX, COUNT, VLOOKUP, XLOOKUP, etc.

  🔥 C6: Store Pattern Inconsistency (PARTIAL: 3 patterns in use)
       Some stores use full stack (immer+persist+subscribeWithSelector),
       others use bare persist(). Standardize on full stack.
       Fix: Audit all 17 stores, update non-conforming ones.
       [Part 5 §11 Finding 6]

  🔥 C7: 74 Stub Pages Need Real Content (PRESENT: shells without wiring)
       Many pages have layout but no store/engine wiring.
       Fix: Wire remaining stub pages to their respective stores and engines.

  🔥 C8: File Save Doesn't Persist to Disk (PARTIAL: serializes but doesn't write)
       FinPlanFileEngine.saveToFile() returns JSON string — caller must write.
       Fix: Add auto-write path in saveToFile() for the default case.
       [Part 5 §11 Finding 3]

### TIER 1: BUILT FEATURES (Do NOT Rebuild — Maintain Only)

  ✅ THREE-STATEMENT MODEL ENGINE
      115 engines including P&L, Balance Sheet, Cash Flow, Consolidation,
      Tax, FX, Lease (ASC 842), Revenue Recognition (ASC 606).
      Maintenence: Verify formulas, add missing financial functions.

  ✅ 17 ZUSTAND STORES (all with Immer v2 patterns)
      glStore, budgetStore, forecastStore, scenarioStore, authStore,
      uiStore, reportStore, analyticsStore, varianceStore, driverStore,
      collaborationStore, dataStore, cubeStore, notificationStore,
      settingsStore, tourStore, entityStore.
      Maintenence: Audit for stale data, add missing actions.

  ✅ UI FRAMEWORK & PAGE SHELLS
      87 routes, 108 components, AG Grid integration, Recharts,
      lazy loading, error boundaries, dark/light mode, i18n (English + Arabic).

  ✅ TYPESCRIPT + REACT 19 + ZUSTAND 5 + AG GRID 35
      Modern stack, fully typed, path aliases (`@/`), barrel exports.

  ✅ CORE ENGINES (115 total)
      FormulaEngine, ConsolidationEngine, ScenarioEngine, CubeEngine,
      WorkforceEngine, TaxEngine, FXEngine, LeaseEngine, RevRecEngine,
      AllocationEngine, CashEngine, BudgetEngine, ForecastEngine, etc.

  ✅ Tauri 2 desktop shell (menu bar, window management, SQLite persistence)

  ✅ Security: AES-256-CBC encryption, RBAC engine, comprehensive audit trail

### TIER 2: 🟡 PARTIAL FEATURES (Need Completion)

  These features have code but are incomplete, disconnected, or buggy.

  🟡 BUDGET MODULE (budgetStore exists, workflows partial)
      Budget version management: ✅ Implemented
      Rolling forecast: 🟡 Calculated but UI not connected
      Driver-based formulas: ✅ Work through FormulaEngine
      Budget calendar: ❌ Not implemented
      Top-down/bottom-up modes: 🟡 Basic support
      Zero-based budgeting: ❌ Not implemented
      Budget lock mechanism: 🟡 Exists but not enforced in UI

  🟡 VARIANCE ANALYSIS (engines exist, reports incomplete)
      Variance calculation: ✅ Implemented (BvA, FvA, PvP)
      Variance report templates: 🟡 HTML reports exist, PDF needs polish
      Waterfall/bridge chart: ❌ Recharts waterfall not implemented
      Price-volume-mix analysis: 🟡 Engine exists, UI partial
      YoY/QoQ/MoM views: ✅ SystemDateEngine handles automatic periods

  🟡 SCENARIO PLANNING (scenarioStore exists, what-if partial)
      Named scenarios: ✅ Full CRUD
      Scenario branching: ❌ Requires scenario.version IDs
      Side-by-side comparison: 🟡 Basic, needs difference highlighting
      What-if sliders: ❌ Not implemented
      Sensitivity/tornado chart: ❌ Not implemented

  🟡 REPORTING & EXPORT
      Report builder: 🟡 Framework exists, needs more templates
      PDF export: ✅ Wired via Tauri dialog
      Excel export: 🟡 ExportEngine exists, needs formatting polish
      Dashboard builder: 🟡 Charts rendered, widget layout partial
      Board pack generator: ❌ Not implemented

  🟡 DATA IMPORT
      CSV import: ✅ Fully working
      Excel import: ❌ ImportEngine rejects .xlsx (see 🔥 C1)
      Import preview: ❌ No preview before commit
      Import rollback: ❌ No rollback
      Chart of accounts mapping: 🟡 ImportEngine has mapping, UI needs polish

  🟡 HEADCOUNT PLANNING
      Summary reports: ✅ Through data grid
      Salary modeling: 🟡 WorkforceEngine exists, needs more drivers
      Attrition pipeline: ❌ Not implemented

  🟡 COLLABORATION
      Cell-level comments: 🟡 Data model exists (collaborationStore)
      Approvals: ❌ Not implemented
      LAN multi-user: ❌ Not implemented

### TIER 3: ❌ MISSING FEATURES (Build After Critical Gaps)

  These features have NO code yet and need to be built from scratch.

  ❌ VISUAL FORMULA DEPENDENCY GRAPH
  ❌ FORMULA DEBUGGER / STEP-THROUGH
  ❌ MODEL HEALTH CHECKER
  ❌ MONTE CARLO SIMULATION UI (engine exists, no UI)
  ❌ BOARD PACK GENERATOR
  ❌ POWERPOINT EXPORT
  ❌ WORD EXPORT
  ❌ CASH FLOW STATEMENT AUTO-GENERATION (engine exists, UI partial)
  ❌ 13-WEEK CASH FLOW FORECAST
  ❌ SAAS METRICS MODULE
  ❌ CUSTOMER COHORT ANALYSIS
  ❌ TEMPLATE LIBRARY (20+ templates)
  ❌ COMMAND PALETTE (Ctrl+K)
  ❌ GLOBAL SEARCH (cells, reports, formulas)
  ❌ ONBOARDING WIZARD
  ❌ CONTEXTUAL HELP SYSTEM
  ❌ TOUCH / TRACKPAD GESTURE SUPPORT
  ❌ LAN MULTI-USER COLLABORATION
  ❌ APPROVAL WORKFLOW ENGINE (WorkflowEngine exists, workflow builder missing)
  ❌ REPORT SCHEDULING (auto-generate)
  ❌ AUDIT TRAIL VIEWER UI (engine exists, no viewer)
  ❌ CELL-LEVEL PERMISSIONS (RBACEngine exists, no cell-level policy)
  ❌ SESSION AUTO-LOCK
  ❌ EXPORT WATERMARKING
  ❌ DEPRECIATION SCHEDULE ENGINE
  ❌ DEBT SCHEDULE ENGINE
  ❌ LEASE ACCOUNTING UI (engine exists, no lease entry UI)
  ❌ AUTO-UPDATE SYSTEM (Tauri shell exists, updater not configured)
  ❌ DOCUMENTATION / USER GUIDE
  ❌ VIDEO WALKTHROUGH
  ❌ PRODUCT WEBSITE

---

## 2. MONETIZATION STRATEGY

### Recommended: Freemium

  WHY: Finance analysts will try it for free, get hooked, upgrade.
  Free tier creates word-of-mouth in CFO/FP&A communities.

  TIERS:
  ┌────────────┬──────────┬──────────────────────────────────────┐
  │ Tier       │ Price    │ Includes                             │
  ├────────────┼──────────┼──────────────────────────────────────┤
  │ Free       │ $0       │ 1 user, 1 model, 10K cells,          │
  │            │          │ basic reports, no encryption          │
  ├────────────┼──────────┼──────────────────────────────────────┤
  │ Pro        │ $19/mo   │ Unlimited models, all features,      │
  │            │ or $149/yr│ 1 user, encryption                   │
  ├────────────┼──────────┼──────────────────────────────────────┤
  │ Team       │ $49/mo   │ 5 users, LAN collaboration,          │
  │            │ or $399/yr│ priority support                     │
  ├────────────┼──────────┼──────────────────────────────────────┤
  │ Business   │ $149/mo  │ 25 users, all features,              │
  │            │ or $999/yr│ white-glove onboarding               │
  └────────────┴──────────┴──────────────────────────────────────┘

  ALSO OFFER: One-time perpetual license option
    Solo: $299 one-time (1 user, all features, 1 year updates)
    Team: $999 one-time (5 users, 1 year updates)
    Annual maintenance: 20% of license for year 2+

  KEY RULE: Never charge for READING models.
    No viewer seat licenses — this alone differentiates you from
    every cloud competitor.

---

## 3. GO-TO-MARKET STRATEGY

### Target Personas (Priority Order)

  1. THE FRUSTRATED FP&A ANALYST
     Who: 28-35 years old, works in finance at $10M-$200M revenue company
     Problem: Uses Excel + Planful/Adaptive and hates both
     Where: LinkedIn FP&A groups, Reddit r/FPandA, CFO Connect
     Message: "Excel is too manual. Planful is too expensive. Meet the third option."

  2. THE CFO AT A GROWING COMPANY
     Who: CFO at Series B-C startup or $20M-$100M private company
     Problem: Outgrown Excel, can't justify $30K/year cloud tool yet
     Where: CFO Alliance, SaaS CFO community, YC Alumni network
     Message: "Board-ready models. Zero internet required. Yours forever."

  3. THE CONSULTANT/FRACTIONAL CFO
     Who: Uses financial modeling for multiple client engagements
     Problem: Can't use cloud tools across clients (data privacy)
     Where: Toptal, Paro, FLG Partners
     Message: "One license. Every client's data stays on your machine."

### Launch Channels

  ┌────────────────────┬────────────────────────────────────────────┐
  │ Channel            │ Strategy                                   │
  ├────────────────────┼────────────────────────────────────────────┤
  │ Product Hunt       │ Launch day campaign, get #1 Product of Day │
  │ Hacker News        │ "Show HN: I built an offline FP&A tool"   │
  │ r/FPandA Reddit    │ Genuine engagement, share tool, get feedback│
  │ LinkedIn           │ Target FP&A analysts and CFOs with content │
  │ CFO Connect        │ Get into the community, be helpful, share  │
  │ YouTube            │ "I replaced Planful with this" comparisons │
  │ Financial forums   │ Wall Street Oasis, Breaking Into Wall St   │
  │ App Sumo           │ Lifetime deal for explosive user acquisition│
  │ G2 / Capterra      │ Get listed, get early reviews              │
  └────────────────────┴────────────────────────────────────────────┘

### Community Building (Start NOW, Not at Launch)

  1. Join r/FPandA. Post helpful content. Don't mention your product yet.
  2. Write a blog post: "Why I built an FP&A tool that doesn't need the internet"
  3. Post on HN, LinkedIn, Reddit. See what resonates.
  4. Find 3 "design partner" CFOs who will give honest feedback for free access.
  5. Build an audience of 500 finance people who know your name before launch.

---

## 4. RISK ANALYSIS

┌────┬──────────────────────────────────────────┬─────┬─────┬──────────────────┐
│ #  │ Risk                                     │ Prob│ Imp │ Mitigation       │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 1  │ Calculation accuracy bug discovered       │ Med │ FATAL│ Exhaustive       │
│    │                                          │     │     │ testing vs Excel  │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 2  │ Feature bloat (87 routes, none deep)      │ HIGH│ HIGH │ Focus on 20 core │
│    │                                          │     │     │ features first    │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 3  │ File corruption / data loss              │ Med │ FATAL│ Auto-save, crash │
│    │                                          │     │     │ recovery, checksums│
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 4  │ Performance at scale (freezes at 1M cells)│ Med │ HIGH │ Performance      │
│    │                                          │     │     │ benchmarks required│
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 5  │ Nobody finds it (no distribution)        │ HIGH│ HIGH │ Community before │
│    │                                          │     │     │ launch            │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 6  │ Excel import is poor                     │ HIGH│ CRIT │ Test with 50+    │
│    │                                          │     │     │ real Excel files  │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 7  │ Solo developer burnout                   │ HIGH│ FATAL│ Ship early, scope│
│    │                                          │     │     │ aggressively      │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 8  │ Open source sustainability               │ Med │ HIGH │ Freemium model   │
│    │                                          │     │     │                   │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 9  │ Competitor response                      │ Low │ Med │ Build moats early │
│    │                                          │     │     │                   │
├────┼──────────────────────────────────────────┼─────┼─────┼──────────────────┤
│ 10 │ Data security breach                     │ Low │ FATAL│ Encryption, RBAC │
│    │                                          │     │     │ audit trail       │
└────┴──────────────────────────────────────────┴─────┴─────┴──────────────────┘

---

## 4.5 TASK DEPENDENCY GRAPH

Phase 0 tasks have these dependencies:

  C1 (Excel Import) ──→ C7 (Stub Pages) ──→ Phase 1
  C2 (Login Page) ──→ [no dependencies]
  C3 (Auto-Save) ──→ C8 (File Save)
  C4 (Undo/Redo) ──→ [no dependencies]
  C5 (Formula Engine) ──→ Phase 1 Variance Analysis
  C6 (Store Pattern) ──→ [no dependencies]
  C7 (Stub Pages) ──→ Phase 1 Reporting
  C8 (File Save) ──→ Phase 1 Data Import

PARALLEL WORK OPPORTUNITIES:
  Day 1: C1 + C2 can be done in parallel (different files)
  Day 2: C3 + C4 + C6 can be done in parallel (different files)
  Day 3-4: C5 must be sequential (formula functions build on each other)
  Day 5: C7 + C8 can be done in parallel

  Phase 1: All Day 6-10 tasks can be parallelized across agents

---

## 5. SESSION PROTOCOLS

### 5.1 Session Start Protocol

  STEP 1: CONTEXT RESTORATION (30 seconds)
    Read combined prompt, understand current state.

  STEP 2: STATUS ASSESSMENT (1 minute)
    What was last worked on? Current completion %? Blockers?

  STEP 3: SESSION BRIEF (2 minutes)
    Present brief using template from Part 1.

  STEP 4: FOUNDER CHECK-IN (1 minute)
    "What do you want to focus on today?"
    Or: "The fleet recommends [X]. Shall we proceed?"

  STEP 5: WORK SESSION (main session)
    Execute plan with fleet deliberations.

  STEP 6: SESSION SUMMARY (2 minutes)
    What was accomplished, what's next, what needs founder input.

### 5.2 Decision Escalation Rules

  LEVEL 1 — QUICK: CSS color, label text. Agent decides. Note it. Move on.
  LEVEL 2 — STANDARD: Component structure. 3-5 agents deliberate. Architect decides.
  LEVEL 3 — MAJOR: Architecture decision. All relevant agents debate. Consensus or escalate.
  LEVEL 4 — IRREVERSIBLE: File format, core architecture. Unanimous or escalate to founder.
  LEVEL 5 — FOUNDER: Business decisions (pricing, market, strategy). Fleet recommends, founder decides.

### 5.3 Veto Powers

  Agent 4 (Security): VETO on security decisions
  Agent 3 (Performance): VETO on performance decisions
  Agent 5 (FP&A Expert): VETO on financial accuracy decisions
  Agent 6 (Calc Engine): VETO on formula engine decisions
  Founder: VETO on everything (supreme authority)

### 5.4 Quality Gates (Before Any Feature is "DONE")

  GATE 1 — FUNCTIONALITY: Works as described, all paths handled
  GATE 2 — PERFORMANCE: Meets benchmarks, no UI lag
  GATE 3 — OFFLINE: Works with zero internet (Airplane Test)
  GATE 4 — UX: Passes "Intern Test" (60 seconds to learn)
  GATE 5 — SECURITY: No data leaks, input validation, audit trail
  GATE 6 — TESTING: Unit tests passing, financial accuracy verified
  GATE 7 — DOCUMENTATION: Code documented, user help text exists
  GATE 8 — COMPETITIVE: Feature matrix updated, meets competitors

  If ANY gate fails, the feature goes back to development.

---

## 6. GAP-CLOSURE ACTION PLAN

### PHASE 0: CRITICAL GAP REPAIR (Days 1-5)

  DAY 1 — EXCEL IMPORT + LOGIN PAGE (8 hours)
    □ 🔥 C1: Wire xlsx parser into ImportEngine.importFile()
    □ 🔥 C2: Connect LoginPage.tsx to authStore.login()
    □ Test the full auth flow: login → JWT → token refresh → logout
    □ Test Excel import with .xlsx files of varying complexity

  DAY 2 — AUTO-SAVE + UNDO/REDO + STORES (8 hours)
    □ 🔥 C3: Change AutoSaveEngine intervalMs from 300000 to 30000
    □ 🔥 C4: Port budgetStore history to UndoRedoEngine<T>
    □ 🔥 C6: Audit all 17 stores for pattern consistency
    □ Fix any store that doesn't use the full immer+persist+subscribeWithSelector stack

  DAY 3 — FORMULA ENGINE EXPANSION (8 hours)
    □ 🔥 C5: Implement AVERAGE, MIN, MAX, COUNTA, COUNTBLANK
    □ 🔥 C5: Implement VLOOKUP, HLOOKUP, XLOOKUP
    □ 🔥 C5: Implement SUMIF, SUMIFS, COUNTIF, COUNTIFS
    □ 🔥 C5: Implement AND, OR, NOT, IFERROR
    □ Write tests for each new function (min 3 tests each)

  DAY 4 — FORMULA ENGINE CONTINUED + FINANCIAL (8 hours)
    □ 🔥 C5: Implement DATE, YEAR, MONTH, DAY, TODAY, EDATE, EOMONTH
    □ 🔥 C5: Implement ABS, ROUND, ROUNDUP, ROUNDDOWN, CEILING, FLOOR
    □ 🔥 C5: Implement IRR, XIRR, XNPV, PV, FV, PMT
    □ 🔥 C5: Implement CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER
    □ Verify all new functions against Excel reference values

  DAY 5 — FILE SAVE + STUB PAGES (8 hours)
    □ 🔥 C8: Add auto-write path to FinPlanFileEngine.saveToFile()
    □ 🔥 C7: Wire top 10 stub pages to their stores/engines
    □ Pages to prioritize: P&L, Balance Sheet, Cash Flow, Budget, Dashboard
    □ Test end-to-end: load app → authenticate → create model → save → reload

### PHASE 1: CORE COMPLETION (Week 2)

  DAY 6 — VARIANCE ANALYSIS + SCENARIOS (8 hours)
    □ Wire variance engine to variance report page
    □ Implement waterfall/bridge chart (Recharts)
    □ Connect scenarioStore to scenario comparison UI
    □ Implement side-by-side scenario difference highlighting

  DAY 7 — REPORTING + EXPORT (8 hours)
    □ Add PDF export templates for all major report types
    □ Polish Excel export formatting (column widths, headers, colors)
    □ Build board pack generator (multi-report PDF assembly)
    □ Add 10 report templates to template library

  DAY 8 — BUDGET WORKFLOW (8 hours)
    □ Implement budget calendar (submission deadlines)
    □ Add top-down/bottom-up budget input modes
    □ Implement budget lock mechanism (UI enforcement)
    □ Build budget submission status dashboard

  DAY 9 — DATA IMPORT COMPLETION (8 hours)
    □ Add import preview (show row count, column mapping, errors before commit)
    □ Implement import rollback (undo entire import)
    □ Polish chart of accounts mapping wizard (drag-and-drop column mapping)
    □ Add multi-sheet Excel import support

  DAY 10 — STUB PAGES REMAINING (8 hours)
    □ Wire remaining ~77 stub pages to their respective stores and engines
    □ Priority order: Reports → Dashboards → Settings → Admin → Help
    □ Verify each page renders actual data (not placeholder content)

### PHASE 2: MISSING FEATURES (Week 3)

  WEEK 11-14 GOALS:
    □ Build SaaS metrics module (MRR, ARR, Churn, CAC, LTV, cohort analysis)
    □ Build cash flow statement auto-generation (wiring existing engine to UI)
    □ Build 13-week cash flow forecast
    □ Build visual formula dependency graph
    □ Build model health checker (detect errors, circular refs, broken links)
    □ Build command palette (Ctrl+K)
    □ Build onboarding wizard for new users
    □ Add audit trail viewer UI (browse, filter, export)
    □ Add cell-level permissions (RBACEngine → cell-level policies)

### PHASE 3: POLISH + LAUNCH (Week 4+)

  MONTH 2 GOALS:
    □ Build LAN multi-user collaboration (no cloud)
    □ Build approval workflow engine
    □ Implement global search (cells, reports, formulas, dimensions)
    □ UX review with 5 real finance users → fix top issues
    □ Performance optimization (1M cells <100ms recalculation)
    □ Accessibility audit and fixes
    □ Build auto-update system
    □ Complete documentation / user guide
    □ Launch Product Hunt campaign
    □ Beta program launched (20 users)

### 6.5 Ship Gates (Automated Quality Checks)

Each phase has GATES that must PASS before moving to the next phase.
The fleet runs these checks automatically. If ANY gate fails, work
stops until it's fixed.

  PHASE 0 GATE (Critical Gap Repair):
    □ npm run test — ALL tests pass
    □ npm run build — Build succeeds
    □ npm run lint — No errors
    □ Excel import: Import 5 test .xlsx files, all succeed
    □ Login flow: Login → JWT → token refresh → logout works
    □ Auto-save: Verify 30-second interval in code
    □ File save: Save .finplan → close app → reopen → data intact
    □ Formula engine: SUM, AVERAGE, VLOOKUP produce correct results

  PHASE 1 GATE (Core Completion):
    □ npm run test — ALL tests pass (no new failures)
    □ npm run build — Build succeeds
    □ Variance report: Shows BvA with correct calculations
    □ PDF export: Generates readable, formatted PDF
    □ Budget workflow: Draft → Submit → Approve → Lock works
    □ Import preview: Shows column mapping before commit
    □ All 87 routes load without errors

  PHASE 2 GATE (Missing Features):
    □ npm run test — ALL tests pass
    □ npm run build — Build succeeds
    □ SaaS metrics: ARR, MRR, churn calculated correctly
    □ Cash flow statement: Auto-generated from P&L + BS
    □ Command palette: Ctrl+K opens, search works
    □ Model health checker: Detects circular refs and errors
    □ Audit trail viewer: Shows filterable change history

  PHASE 3 GATE (Polish + Launch):
    □ npm run test — ALL tests pass
    □ npm run build — Build succeeds, <500KB gzip
    □ Cold start: < 2 seconds
    □ 100K cell recalc: < 50ms
    □ All keyboard shortcuts work
    □ Dark mode: All pages look correct
    □ Accessibility: All interactive elements keyboard-accessible
    □ 5 real finance users test → no critical issues
    □ LAN collaboration: 2 users edit same model → syncs correctly

---

## 7. INNOVATION BACKLOG

Features too ambitious for now but should be remembered:

  💎 DIAMOND (Game-changing, must build eventually):
    - Cross-model referencing (link two model files)
    - Plugin/extension marketplace
    - Mobile companion viewer app
    - Natural language formula input (without AI — rule-based)

  🥇 GOLD (Great idea, high priority for future):
    - Template marketplace (users share templates)
    - REST API for external integrations
    - Webhook support
    - QuickBooks/Xero connectors
    - Real-time collaboration (WebSocket)

  🥈 SILVER (Nice to have, medium priority):
    - White-label option for consultants
    - Custom function marketplace
    - Embedded analytics (embed dashboards in other apps)
    - SSO/SAML integration
    - Advanced AI anomaly detection (optional, ONNX-based)

  🥉 BRONZE (Interesting but low priority):
    - Mobile app (React Native)
    - Voice commands for formulas
    - AR/VR data visualization
    - Blockchain-based audit trail

---

## 8. CONTINUE / START / STOP

### CONTINUE DOING:
  ✅ The offline-first architectural vision
  ✅ Rejecting AI dependencies (beat them with better engineering)
  ✅ Thinking about data sovereignty as a feature
  ✅ The ambition to be 100x better
  ✅ Thinking about the non-technical user

### START DOING IMMEDIATELY:
  🚀 Building the calculation engine TODAY
  🚀 Community building NOW (before the product exists)
  🚀 Documenting your "Why offline?" story
  🚀 Finding 3 "design partner" CFOs or FP&A analysts
  🚀 Daily builds — ship something working every single day

### STOP DOING IMMEDIATELY:
  🛑 Planning features before the calc engine is working
  🛑 Trying to match Anaplan's enterprise feature list before having basic features
  🛑 Working in isolation (talk to 5 CFOs THIS WEEK)
  🛑 Worrying about competitor features you haven't built yet
  🛑 Assuming you know what finance users want

---

## 9. FINAL WORDS

┌──────────────────────────────────────────────────────────────────────────┐
│                         THE BOTTOM LINE                                  │
│                                                                          │
│  This is one of the most intelligent FP&A product concepts because      │
│  it does the OPPOSITE of what every competitor is doing.                │
│                                                                          │
│  Offline + AI-free + file-based + one-time-price is not just a          │
│  feature list. It's a WORLDVIEW about how software should work.         │
│  And it's the right worldview for finance.                              │
│                                                                          │
│  The risk is NOT the vision. The risk is execution.                     │
│                                                                          │
│  The calculation engine must be bulletproof.                            │
│  The UX must be tested with real finance people.                        │
│  The first 100 users must love it.                                      │
│                                                                          │
│  If those three things happen — this has a real shot at becoming        │
│  the standard for offline enterprise finance.                           │
│                                                                          │
│  Go build it.                                                           │
└──────────────────────────────────────────────────────────────────────────┘

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  END OF PART 4 (v5.0.0)                                                      ║
║                                                                              ║
║  Continue to Part 5 of 5: Code Patterns & Implementation Guide              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
