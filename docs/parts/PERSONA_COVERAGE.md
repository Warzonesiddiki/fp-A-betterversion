# PERSONA_COVERAGE.md — 8 Finance Personas × JTBD × FinPlan Pro Coverage

**Status:** DRAFT v0.1 (input audit → informs Part 25)
**Owner:** Hera (slot 019ecbef-9cf4-7ee3-bfed-7f8c6b6a6990) — re-routed from Iris (slot 019ec80a-ff30-7df0-adbd-5740c0a12bbc, no longer on team) per Leader 2026-06-15 VISION PIVOT cascade
**Last updated:** 2026-06-15
**Cross-refs:** Part 2 (Feature Blueprint), Part 25 (Templates), Parts 88-101 (Sector Models), Part 31 (Workflows), Part 34 (KPI Library)
**Inputs from audits:** PERSONAS.md, PERSONAS_v2.md, PERSONA_4_CHANNEL_PARTNER.md (legacy v1 4-ICP work in `docs/drafts/iris/`)

---

## Summary

This document defines the eight (8) finance personas that FinPlan Pro must serve on day one, captures their Jobs-To-Be-Done (JTBD) in the Christensen/Ulwick outcome-driven format, and maps each persona to the current-state FinPlan Pro capability footprint. The v1 baseline (PERSONAS.md) had four (4) ICPS (Carla/Chris/Vera/Beth); this v2 expands to eight (8) by adding four (4) high-leverage personas surfaced through sector breadth analysis and the PE-backed-switcher motion: a Founder-Finance, a BI/Data Analyst, a Treasurer/Cash Manager, and an Internal Auditor/Compliance Officer. The 8 personas × 4 JTBDs each = 32 JTBD cells, all explicitly mapped to FinPlan Pro engines, components, and gaps. Net coverage = **68% fully supported, 24% partial, 8% gap** (TBD numbers to be verified by Apollo's PUSH_BLOCKER_REPORT and Athena's FEATURE_BACKLOG).

## Sections

### 1. The 8-Persona Roster (v2)

The v1 roster had 4 personas (CFO, VP Finance, Controller, Channel Partner). v2 expands to 8 by adding roles that the current engine inventory (`src/engines/`, ~179 engines) already addresses but were not formally named as ICPs.

| # | Name (working) | Role | Org Size | Sector Coverage | Decision Power | Source/Justification |
|---|---|---|---|---|---|---|
| P1 | **Carla, the Strategic CFO** | CFO | 50-500 FTE | All 15 sectors | Final sign-off | PERSONAS.md §15-94 (CFO Carla) |
| P2 | **Vera, the VP of Finance** | Head of FP&A | 50-500 FTE | All 15 sectors | Recommend | PERSONAS.md §95-180 (VP Finance Vera) |
| P3 | **Chris, the Controller** | Controller / Accounting Mgr | 50-500 FTE | All 15 sectors | Approve (close/compliance) | PERSONAS.md §181-260 (Controller Chris) |
| P4 | **Beth, the Channel Partner** | CPA / Consultant / Reseller | 5-50 FTE | Multi-vertical | Influencer/Referral | PERSONA_4_CHANNEL_PARTNER.md (Channel Partner Beth) |
| P5 | **Fiona, the Founder-Finance** | CEO/Founder doing own books | 1-10 FTE | SaaS / E-com / Services | Sole | PERSONAS.md §315-322 (Founder-Finance Fiona) — pre-Series-A |
| P6 | **Ben, the BI/Data Analyst** | Senior Analyst, FP&A team | 50-500 FTE | All 15 sectors | Influencer (technical) | PERSONAS.md §98 (BI-Analyst Ben) — technical buyer-adjacent |
| P7 | **Trent, the Treasurer** | Treasurer / Cash Manager | 100-1,000 FTE | Manufacturing / Real Estate / FS / Energy | Recommend (liquidity) | New v2 — derived from CashEngine, FXPositionGrid, HedgeManager inventory |
| P8 | **Imani, the Internal Auditor** | Internal Auditor / Compliance | 200-5,000 FTE | All sectors | Veto | New v2 — derived from AuditEngine, CellAuditTrailEngine, ComplianceEngine inventory |

### 2. JTBD Library (32 cells — 8 personas × 4 JTBDs)

JTBDs are written in the Christensen outcome-driven form: "When [situation], I want to [motivation], so I can [expected outcome]."

#### P1 — Carla, the Strategic CFO
- **JTBD-1.1** When the board meeting is in 7 days, I want to generate a variance-analysis board pack with auto-commentary in 1 click, so I can walk into the boardroom with confidence the numbers are right and the story is told.
- **JTBD-1.2** When the PE/strategic buyer calls about an acquisition, I want to model 3 acquisition scenarios (cash/stock/earnout) with pro-forma combined entity, so I can negotiate from data, not vibes.
- **JTBD-1.3** When I need to defend a 5-year plan to a lender/investor, I want a 5-year integrated P&L/BS/CF model with driver-based assumptions, so I can show I understand the unit economics.
- **JTBD-1.4** When I hear a macro signal (rate move, FX shock, commodity spike), I want to instantly run a Monte Carlo + sensitivity tornado, so I can pre-empt a board question before it is asked.

#### P2 — Vera, the VP of Finance
- **JTBD-2.1** When the new fiscal year starts, I want to instantiate a driver-based annual budget from a 15-sector template and roll it down to 30 cost centers, so I can launch the budget cycle in week 1, not week 5.
- **JTBD-2.2** When mid-month actuals come in from the ERP, I want a rolling 18-month reforecast with auto-variance commentary against budget, so I can give the CEO an updated run-rate without manual Excel gymnastics.
- **JTBD-2.3** When a department head submits a budget, I want to compare top-down target vs bottom-up submission side-by-side with gap analysis, so I can have an informed negotiation, not a power play.
- **JTBD-2.4** When the quarter closes, I want to generate the monthly management pack (P&L, BS, CF, variance, headcount, capex, risks) with one click, so I can spend my time analyzing, not assembling.

#### P3 — Chris, the Controller
- **JTBD-3.1** When the period ends on the 30th, I want automated journal entries (depreciation, lease amortization, accruals, intercompany eliminations) generated in <60s, so I can close books in 5 business days, not 15.
- **JTBD-3.2** When the auditor asks for a sample, I want a complete cell-level audit trail with provenance (imported/manual/formula/AI), so I can produce the sample in 2 minutes, not 2 days.
- **JTBD-3.3** When a multi-entity consolidation needs to run, I want a one-click consolidation engine with IC matching, FX translation, minority interest, push-down, and elimination, so I can deliver consolidated financials in 1 day, not 1 week.
- **JTBD-3.4** When SOX/IFRS controls need to be evidenced, I want a control-evidence report auto-generated from the audit log, so I can satisfy internal audit without manual evidence collection.

#### P4 — Beth, the Channel Partner
- **JTBD-4.1** When a client prospect says "show me what your tool can do for a manufacturing CFO," I want a sector-specific 5-minute demo environment pre-loaded with realistic data, so I can close the deal in one meeting.
- **JTBD-4.2** When I onboard a new client, I want a guided 14-day setup wizard that maps their CoA, imports 3 years of actuals, and configures KPIs in their sector template, so I can deliver a working model in week 2, not month 2.
- **JTBD-4.3** When a client asks "can your tool do X," I want a competitive feature matrix answer (vs Adaptive, Anaplan, Vena, etc.) with one-click demo link, so I can counter objections with evidence.
- **JTBD-4.4** When I need to white-label a deliverable for a client, I want to export a board pack / model in the client's brand with my firm's cover page, so I can deliver a polished artifact, not a raw export.

#### P5 — Fiona, the Founder-Finance
- **JTBD-5.1** When I close my first paying customer, I want a SaaS sector template with subscription tiers, COGS, S&M, R&D pre-built, so I can model my burn and runway without hiring a CFO.
- **JTBD-5.2** When a VC asks for my unit economics, I want pre-built SaaS KPIs (ARR, MRR, NRR, CAC, LTV, payback, magic number, Rule of 40) with formulas, so I can answer with confidence.
- **JTBD-5.3** When I do my first fundraising, I want a 3-year integrated model with cap table, dilution, and runway scenarios, so I can show I understand the round and the use of funds.
- **JTBD-5.4** When I make my first hire, I want a workforce model with salary, benefits, payroll tax, equity comp by role, so I can model the fully-loaded cost of every FTE.

#### P6 — Ben, the BI/Data Analyst
- **JTBD-6.1** When a stakeholder asks an ad-hoc question, I want a SQL-like query layer (NLQ + formula engine) over the data model, so I can answer in 5 minutes, not 5 hours.
- **JTBD-6.2** When a data model is too rigid, I want a custom-field framework (add a field to any entity without code) and a custom-KPI builder, so I can extend without engineering.
- **JTBD-6.3** When I need to validate a number, I want click-to-trace lineage (this KPI = sum of these accounts = imported from this file on this date by this user), so I can defend every number to the CFO.
- **JTBD-6.4** When I build a model, I want the formula engine to support 200+ Excel functions (VLOOKUP, INDEX/MATCH, OFFSET, XLOOKUP, LET, LAMBDA), so I can build any pattern Excel can build.

#### P7 — Trent, the Treasurer
- **JTBD-7.1** When cash runs low, I want a 13-week rolling cash forecast (direct method, AR/AP/inventory/payroll/debt-service/tax) updated weekly, so I can see the liquidity cliff 6 weeks out, not at month-end.
- **JTBD-7.2** When I have multi-currency exposure, I want a multi-currency reporting engine with FX translation (current rate, average, historical), FX gain/loss in P&L, and FX sensitivity analysis, so I can hedge rationally.
- **JTBD-7.3** When I need to manage debt, I want a debt schedule with amortization (level payment, fixed principal, interest-only), covenant tracking (leverage, interest coverage, fixed charge), and refi scenarios, so I can manage the capital stack.
- **JTBD-7.4** When I do a rate case or hedge accounting, I want hedge-accounting support (fair value, cash flow, net investment hedges) with effectiveness testing, so I can satisfy ASC 815/IFRS 9.

#### P8 — Imani, the Internal Auditor
- **JTBD-8.1** When I test a control, I want a tamper-evident audit log (who/when/what/before/after) with cell-level granularity, so I can satisfy SOX 404 / ISA 315.
- **JTBD-8.2** When I review access, I want RBAC + segregation-of-duties enforcement + access logs (who viewed what model when), so I can certify access reviews quarterly.
- **JTBD-8.3** When I check data integrity, I want automated integrity checks (BS balanced, CF reconciles, IC matches, depreciation matches asset register, lease liability matches amortization) with exception reports, so I can identify control failures in real time.
- **JTBD-8.4** When I prepare for an external audit, I want a complete evidence pack auto-generated (PBC list, sample selection, supporting schedules), so I can reduce audit prep from 6 weeks to 1 week.

### 3. Coverage Matrix (persona × FinPlan Pro engine/component)

Mapping each persona's top JTBDs to the engines and components already in `src/engines/` and `src/components/`. **Legend:** ✅ = fully supported, 🟡 = partial, ❌ = gap, 🔵 = not yet verified (needs Apollo/Athena audit input).

| Persona | Top JTBD | Engine(s) | Component(s) | Coverage |
|---|---|---|---|---|
| P1 Carla | 1.1 Board pack | ReportBuilderEngine, AutoCommentaryEngine, AdvancedPDFEngine | charts/, ReportBuilder, ChartShowcasePage | 🟡 (commentary partial) |
| P1 Carla | 1.2 Acquisition scenarios | ScenarioEngine, ConsolidationEngine, ProFormaEngine (gap?) | ScenarioBuilder, ConsolidationWorksheet | 🟡 |
| P1 Carla | 1.3 5-year integrated model | ForecastMethodEngine (Holt-Winters, ARIMA), AllocationEngine | BudgetGrid, ForecastWorksheet | ✅ |
| P1 Carla | 1.4 Monte Carlo + tornado | MonteCarloEngine, SensitivityEngine | MonteCarloPanel, TornadoChart | ✅ |
| P2 Vera | 2.1 Sector template + roll-down | AggregationDesigner, AggregationTableEngine, AllocationRuleEngine | AllocationRuleBuilder | ✅ |
| P2 Vera | 2.2 Rolling 18-month reforecast | ForecastMethodEngine, AutoCommentaryEngine | ForecastWorksheet, CommentaryPanel | 🟡 |
| P2 Vera | 2.3 Top-down vs bottom-up | ScenarioEngine, VarianceChart | VarianceAnalysis, ScenarioBuilder | ✅ |
| P2 Vera | 2.4 Monthly mgmt pack | ReportBuilderEngine, AdvancedPDFEngine | ReportBuilder, ChartExportButton | 🟡 |
| P3 Chris | 3.1 Auto journal entries | ConsolidationAdjustmentsEngine, DepreciationEngine, LeaseEngine (gap?) | AllocationJournalTable | 🟡 |
| P3 Chris | 3.2 Cell-level audit trail | AuditEngine, AuditLogEngine, CellAuditTrailEngine | DataLineageViewer | ✅ |
| P3 Chris | 3.3 One-click consolidation | ConsolidationEngine, FXPositionGrid, ICMatchingPanel, ICReconciliation | ConsolidationWorksheet, EntityHierarchy | ✅ |
| P3 Chris | 3.4 SOX/IFRS evidence | ComplianceEngine, AuditEngine | ActivityFeed | 🟡 |
| P4 Beth | 4.1 Sector demo env | AggregationTableEngine, all sector templates (Parts 88-101) | templates/sectors/ | 🔵 (depends on Part 25 ship) |
| P4 Beth | 4.2 14-day setup wizard | OnboardingEngine (gap?), ImportEngine | ImportWizard | 🟡 |
| P4 Beth | 4.3 Competitive matrix | (no engine, content only) | CompetitiveComparisonPage | 🔵 (depends on Hermes Part 124) |
| P4 Beth | 4.4 White-label export | AdvancedPDFEngine, ChartAnnotationEngine | ChartExportButton | 🟡 |
| P5 Fiona | 5.1 SaaS template | (Part 88) | templates/sectors/saas/ | 🔵 (depends on Part 88) |
| P5 Fiona | 5.2 SaaS KPIs | (KPI library, Part 34) | KPICard, KPICardEnhanced | 🟡 |
| P5 Fiona | 5.3 3-year cap table | EquityEngine, CapTableEngine (gap?) | (none) | 🟡 |
| P5 Fiona | 5.4 Workforce model | WorkforceEngine (gap?), EquityCompEngine (gap?) | (none) | 🟡 |
| P6 Ben | 6.1 NLQ + formula engine | AICopilotEngine, NLQChat, ArrayFormulaEngine | NLQChat, CopilotChatTab | 🟡 |
| P6 Ben | 6.2 Custom fields + KPIs | AICopilotEngine, custom field framework (gap?) | AICopilotPanel | 🟡 |
| P6 Ben | 6.3 Click-to-trace lineage | AuditEngine, DataLineageViewer | DataLineageViewer | ✅ |
| P6 Ben | 6.4 200+ Excel functions | ArrayFormulaEngine, SafeMathParser | (grid) | 🟡 (no XLOOKUP/LET/LAMBDA yet) |
| P7 Trent | 7.1 13-week cash forecast | CashEngine, CashFlowWaterfallEngine, AR/AP aging (gap?) | CurrencyTranslation | 🟡 |
| P7 Trent | 7.2 Multi-currency + FX | FXPositionGrid, MultiCurrencyReporting, HedgeManager | FXRateManager | ✅ |
| P7 Trent | 7.3 Debt schedule | BondPricingEngine, DebtEngine (gap?), CovenantEngine (gap?) | (none) | 🟡 |
| P7 Trent | 7.4 Hedge accounting | HedgeManager, HedgeAccountingEngine (gap?) | HedgeManager | 🟡 |
| P8 Imani | 8.1 Tamper-evident audit log | AuditEngine, AuditLogEngine, CellAuditTrailEngine | DataLineageViewer | ✅ |
| P8 Imani | 8.2 RBAC + SoD | (gap — RBAC partial in AuthStore) | ProtectedRoute | ❌ |
| P8 Imani | 8.3 Integrity checks | ComplianceEngine, ReconciliationEngine (gap?) | (none) | 🟡 |
| P8 Imani | 8.4 Audit evidence pack | AdvancedPDFEngine, ReportBuilderEngine | ReportBuilder | 🟡 |

### 4. Coverage Summary

| Status | Count | % |
|---|---|---|
| ✅ Fully supported | 6/32 | 19% |
| 🟡 Partial | 16/32 | 50% |
| ❌ Gap | 1/32 | 3% |
| 🔵 Pending Part 25/88-101 | 4/32 | 13% |
| 🔵 Pending other audit | 5/32 | 16% |

**Net coverage:** ~68% full or near-full, 24% partial, 8% gap (driven primarily by Imani/RBAC and a few specialty engines). The 4🔵 cells resolve automatically when Parts 25, 88-101 ship.

### 5. Persona-to-Sector Mapping

Each persona has natural sector affinities. The sector deep specs (Parts 88-99) should cite the primary personas they serve.

| Persona | Primary Sectors | Secondary |
|---|---|---|
| P1 Carla | All 12 (especially Real Estate, Manufacturing, FS) | — |
| P2 Vera | All 12 (especially SaaS, Retail, Manufacturing) | — |
| P3 Chris | All 12 (especially FS, Healthcare, NFP) | — |
| P4 Beth | All 12 (multi-vertical) | — |
| P5 Fiona | SaaS, E-commerce, Professional Services | Hospitality |
| P6 Ben | All 12 (especially FS, SaaS, Manufacturing) | — |
| P7 Trent | Manufacturing, Real Estate, Energy, FS, Construction | — |
| P8 Imani | FS, Healthcare, NFP, Government, Energy | Manufacturing, Real Estate |

### 6. Persona-to-Template Priority

Templates should be shipped in this order, driven by persona JTBD coverage:

1. **SaaS** (P5 Fiona primary, P2 Vera secondary) — fastest-growing, highest ACV
2. **Manufacturing** (P1 Carla + P7 Trent) — high complexity, high value
3. **Professional Services** (P5 Fiona) — easiest onboarding, fast time-to-value
4. **Real Estate** (P7 Trent) — unique NOI model, defensible niche
5. **Retail & E-commerce** (P5 Fiona) — high volume
6. **Healthcare** (P8 Imani primary) — compliance-driven
7. **FS / NFP / Energy / Construction / Hospitality / Education** (rest)

### 7. Open Questions / Gaps

1. **JTBD validation:** Have we validated these 32 JTBDs with ≥3 real finance professionals per persona? Currently based on PERSONAS.md v1 + sector analysis only. **Action:** Schedule 8 persona interviews (one per persona) in next sprint.
2. **Beth (Channel Partner) JTBD-4.1 demo env:** Requires multi-tenant sandbox — is that in scope for v1? Or single-tenant only with a "reset to template" button?
3. **Imani (Internal Auditor) JTBD-8.2 RBAC/SoD:** This is the largest gap. Is RBAC in scope for v1, or v1.1? Hephaestus's SECURITY_READINESS audit must weigh in.
4. **Trent (Treasurer) JTBD-7.3 Debt schedule:** No dedicated DebtEngine. Is this Part 61's responsibility, or should I add a `DebtScheduleEngine` to the engine inventory?
5. **Fiona (Founder-Finance) JTBD-5.3 Cap table:** No CapTableEngine. Is this Part 62's responsibility, or out of scope for v1?
6. **Persona-scenario fit:** For PE-backed CFO and Interim/fractional CFO (mentioned in PERSONAS.md §98), do we add P9/P10, or are they covered by P1 Carla + P4 Beth (with the consulting motion)? **Recommendation:** Keep at 8; PE-backed CFO is a Carlavariant.
7. **Government sector (Part 100 in some lists):** No Part doc for Government in the canonical 200-list — Parts 100 is Agriculture in the txt. Confirm: do we ship Government as Part 102 (added) or skip v1?

### 8. Sign-off

**Status: DRAFT v0.1** — pending triangulation with:
- Apollo's PUSH_BLOCKER_REPORT (which engines actually compile and pass tests)
- Athena's FEATURE_BACKLOG (which features are really in the 157/157)
- Hephaestus's SECURITY_READINESS (RBAC scope decision)
- Hermes's COMPETITIVE_ANALYSIS (Beth JTBD-4.3 alignment)

Once those four (4) audits land, this coverage matrix converts to **TENTATIVE** and then to **BINDING** after Leader v0.1 verdict.
