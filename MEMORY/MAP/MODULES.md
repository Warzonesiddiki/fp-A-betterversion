---
id: MEMORY/MAP/MODULES.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# MAP/MODULES — canonical modules and status

Status vocabulary: `shipped` (files exist and are routed/used) · `partial` · `flagged`
(exists but carries known defects) · `planned` (no files). A module is never `shipped`
because a plan says so.

| Module | Entry point(s) | Status | Notes |
| --- | --- | --- | --- |
| Money primitive | `src/utils/money.ts` | shipped | decimal.js, precision 40, ROUND_HALF_UP |
| Money-AST detector | `scripts/money-ast-detector.mjs` | shipped | ratchet 489 / 80.05% |
| Fabrication detector | `scripts/fabrication-detector.mjs` | shipped | ratchet 60 / 19 files |
| GL store | `src/store/glStore.ts` | shipped | localStorage persist; not server-authoritative |
| Dashboard | `src/pages/DashboardPage.tsx` + `src/pages/dashboard/dashboardModel.ts` | shipped | session 017: 11 unsafe ops → 0; revenue sign inversion fixed |
| Credit risk | `src/pages/credit/CreditRiskPage.tsx` + `creditRiskData.ts` | shipped | session 016 |
| Scenario builder | `src/pages/scenarios/ScenarioBuilderPage.tsx` + `scenarioBuilderModel.ts` | shipped | session 015 |
| Underwriting | `src/pages/insurance/UnderwritingPage.tsx` + `underwritingData.ts` | shipped | session 015 |
| Project costing | `src/pages/construction/ProjectCostingPage.tsx` + `projectCostingData.ts` | shipped | session 014 |
| Tax provision | `src/pages/tax/TaxProvisionPage.tsx` + `taxProvisionData.ts` | shipped | session 011 |
| Patient revenue | `src/pages/healthcare/PatientRevenuePage.tsx` | shipped | session 017: fabrication 5 → 0; denial analytics disclosed, not estimated |
| Healthcare engine | `src/engines/HealthcareEngine.ts` | partial | session 017: `denialRate` is now `null` and the 30-day A/R basis is disclosed; `cashCollected` still sums all 11xx, not patient-only collections (H-004) |
| Construction engine | `src/engines/ConstructionEngine.ts` | flagged | 1.5× backlog invention + Math.abs |
| Insurance engine | `src/engines/InsuranceEngine.ts` | flagged | 0.85× net-written + premium/360 policy count |
| Retail engine | `src/engines/RetailEngine.ts` | flagged | 254 / 92.8 mocks remain |
| Real-estate engine | `src/engines/RealEstateEngine.ts` | flagged | 4.2 / 94.8 / 6.2 mocks + amount-sign fork |
| Export engines | `src/engines/ProfessionalExportEngine.ts`, `ExportTemplateEngine.ts` | flagged | fabrication 0, but raw floats can cross into autoTable |
| Board pack | `BoardPackTemplate` (barrel-exported) | partial | NOT routed — no user reaches it |
| Cash position | `src/pages/cash/CashForecastPage.tsx` + `cashForecastModel.ts` | shipped | session 018: cash-account scoped, categories from journal counter-lines, forward forecast disclosed |
| Education dashboard | `src/pages/sectors/EducationDashboardPage.tsx` + `educationDashboardData.ts` | shipped | session 018: was 100% invented; now GL + budget derived |
| Rolling forecast | `src/pages/forecasts/RollingForecastPage.tsx` + `rollingForecastModel.ts` | shipped | session 019: walk-forward backtest replaced a fake accuracy KPI |
| Government dashboard | `src/pages/sectors/GovernmentDashboardPage.tsx` + `governmentDashboardData.ts` | shipped | session 019: demo fallback removed |
| Property valuation | `src/pages/realestate/ValuationPage.tsx` + `valuationData.ts` | shipped | session 020: per-property cap rate, engine placeholders no longer called |
| Logistics dashboard | `src/pages/sectors/LogisticsDashboardPage.tsx` + `logisticsDashboardData.ts` | shipped | session 020: fixtures and the 96.4% default removed |
| Sector dashboards (`src/pages/sectors/*`) | — | flagged | Telecom still renders an invented company |
| Chart scaling | `src/utils/chartScale.ts` | shipped | layout percentages only — NOT a money helper |
| Server API | `server/src/routes/*.ts` (11 route files) | partial | only ~14 non-test frontend files call it |
| Persistence authority (W0.8) | — | planned | 41 persisting stores, schema fork, no tenancy |
| MSI installer | — | planned | repo ships NSIS only; GA needs MSI + NSIS |
