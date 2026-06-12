# FinPlan Pro — 20-Phase × 5-Subphase Master Plan

**Created:** 2026-06-10
**Type:** feat
**Status:** active
**Cycle:** Never-ending improvement — each phase loops back to Phase 20 (Continuous Improvement)

---

## Overview

Enterprise FP&A desktop app. Offline-first. React 19 + TypeScript strict + Vite + Tailwind 4 + Zustand/Immer + AG Grid + Recharts + Tauri.

100 work units across 20 phases, each with 5 subphases. Every phase deepens after completion via the Continuous Improvement cycle.

---

## Phase 1: Core Architecture & Infrastructure

| Subphase | Focus                       | Key Deliverables                                                                                             |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1.1      | Build System Auditing       | Vite config hardening, chunk optimization, tree-shaking audit, bundle size CI gate                           |
| 1.2      | State Management Foundation | Zustand middleware audit, persist strategy, store structure review, circular dep detection                   |
| 1.3      | Routing & Lazy Loading      | React Router audit, lazy load boundary check, preload strategy, error boundary coverage                      |
| 1.4      | Type System Enforcements    | strict mode gaps, `noUncheckedIndexedAccess` violations, `any` removal plan, branded types for financial IDs |
| 1.5      | PWA & Offline Shell         | Workbox config audit, service worker lifecycle, offline storage strategy, sync queue                         |

## Phase 2: Budget Engine & Data Model

| Subphase | Focus                | Key Deliverables                                                                       |
| -------- | -------------------- | -------------------------------------------------------------------------------------- |
| 2.1      | Core Budget Store    | BudgetStore audit, action completeness, derived state optimization, memoization        |
| 2.2      | Financial Data Model | Account hierarchy, period model, actuals/budget/forecast types, versioning             |
| 2.3      | Calculation Engine   | Formula engine audit, dependency graph, circular ref detection, recalculation strategy |
| 2.4      | Budget Grid          | AG Grid config audit, column definitions, cell renderers, editing, validation          |
| 2.5      | Budget Templates     | Template store, template CRUD, default templates, import from template                 |

## Phase 3: Financial Reporting Engine

| Subphase | Focus                   | Key Deliverables                                                                      |
| -------- | ----------------------- | ------------------------------------------------------------------------------------- |
| 3.1      | Report Builder          | ReportDesigner audit, layout engine, row/column hierarchies, formula support          |
| 3.2      | Report Grid & Rendering | ReportGrid enhancements, cross-footing, variance columns, conditional formatting      |
| 3.3      | Report Books            | ReportBookBuilder, BookBurstBuilder, subscheduling, batch generation                  |
| 3.4      | Board Packs             | BoardPackBuilder/Generator/Template, PDF export, executive summary                    |
| 3.5      | Export & Distribution   | ExportDialog enhancements, multi-format (PDF/XLSX/HTML), scheduler, distribution list |

## Phase 4: Consolidation & Multi-Entity

| Subphase | Focus                 | Key Deliverables                                                               |
| -------- | --------------------- | ------------------------------------------------------------------------------ |
| 4.1      | Entity Hierarchy      | EntityTree, hierarchy management, ownership percentages, consolidation scope   |
| 4.2      | Consolidation Engine  | ConsolidationWorksheet, elimination entries, minority interest, CI calculation |
| 4.3      | Intercompany Matching | ICMatchingPanel, ICReconciliation, auto-match rules, suspense handling         |
| 4.4      | Consolidation Tree    | ConsolidationTree, roll-up logic, multi-currency consolidation, eliminations   |
| 4.5      | Audit Trail           | AllocationAuditTrail, journal entries, consolidation history, drill-through    |

## Phase 5: Currency & FX Management

| Subphase | Focus                    | Key Deliverables                                                                     |
| -------- | ------------------------ | ------------------------------------------------------------------------------------ |
| 5.1      | FX Rate Manager          | FXRateManager, rate provider, historical rates, rate type support (spot/forward/avg) |
| 5.2      | Currency Translation     | CurrencyTranslation, translation methods (current rate/temporal), P&L impact         |
| 5.3      | FX Position Grid         | FXPositionGrid, exposure tracking, revaluation, gain/loss calc                       |
| 5.4      | Hedge Management         | HedgeManager, hedge effectiveness testing, hedge accounting, MTM                     |
| 5.5      | Multi-Currency Reporting | Currency constants, display currency, translation reserve, CTA reporting             |

## Phase 6: Scenario & Driver-Based Planning

| Subphase | Focus               | Key Deliverables                                                                   |
| -------- | ------------------- | ---------------------------------------------------------------------------------- |
| 6.1      | Scenario Manager    | Scenario store, CRUD, baseline vs. scenarios, branching, merge                     |
| 6.2      | Driver Tree         | DriverTreeView, driver hierarchy, driver types (volume/price/rate), sensitivity    |
| 6.3      | Impact Analysis     | ImpactAnalysis, what-if modeling, driver impact waterfall, Monte Carlo integration |
| 6.4      | Scenario Comparison | ScenarioComparison, side-by-side, variance analysis, best/worst case               |
| 6.5      | Scenario Merge      | ScenarioMerge, promote to baseline, partial merge, versioning                      |

## Phase 7: Dashboard & Visualization

| Subphase | Focus                   | Key Deliverables                                                       |
| -------- | ----------------------- | ---------------------------------------------------------------------- |
| 7.1      | Dashboard Template      | DashboardTemplate, widget grid, layout persistence, KPI library        |
| 7.2      | Advanced Charts         | WaterfallChart, TornadoChart, SankeyDiagram, HeatmapGrid, ComboChart   |
| 7.3      | KPI Cards               | KPICard, KPICardEnhanced, TrafficLightIndicator, GaugeChart, Sparkline |
| 7.4      | Activity Feed & History | ActivityFeed, change tracking, commentary, data lineage                |
| 7.5      | Widget Library          | WidgetLibrary, custom widgets, widget data binding, refresh strategy   |

## Phase 8: AI/ML Copilot & Anomaly Detection

| Subphase | Focus             | Key Deliverables                                                              |
| -------- | ----------------- | ----------------------------------------------------------------------------- |
| 8.1      | Copilot Sidebar   | CopilotSidebar, panel layout, chat/insights/alerts tabs, orchestration        |
| 8.2      | NLQ Chat          | NLQChat, natural language query, chart generation, Excel formula gen          |
| 8.3      | Anomaly Detection | AnomalyHighlight, statistical methods, ML model integration, alert generation |
| 8.4      | AI Insights       | CopilotInsightsTab, pattern recognition, trend analysis, variance explanation |
| 8.5      | Formula Assistant | CopilotFormulaDisplay, formula generation from NL, syntax check, explanation  |

## Phase 9: Data Import/Export & Integration

| Subphase | Focus                 | Key Deliverables                                                     |
| -------- | --------------------- | -------------------------------------------------------------------- |
| 9.1      | GL Data Import        | GLDropZone, GLColumnMapper, GLDataPreview, GLTrialBalanceGrid        |
| 9.2      | File Upload System    | FileUploader, ColumnMapper, ImportPreview, validation engine         |
| 9.3      | Excel Integration     | ExcelJS integration, template export, formatted export, batch import |
| 9.4      | API Integration       | Axios service layer, REST connectors, OAuth flow, rate limiting      |
| 9.5      | Data Transform Engine | ETL pipeline, mapping rules, schedule transforms, error handling     |

## Phase 10: Workflow & Approvals

| Subphase | Focus                      | Key Deliverables                                               |
| -------- | -------------------------- | -------------------------------------------------------------- |
| 10.1     | Approval Workflow Designer | ApprovalWorkflowDesigner, visual workflow builder, step types  |
| 10.2     | Approval Dashboard         | ApprovalDashboard, pending/completed/rejected, batch approve   |
| 10.3     | Approval Queue             | ApprovalQueue, notification integration, deadline tracking     |
| 10.4     | Cascade Rules              | CascadeRuleBuilder, auto-approve rules, delegation, escalation |
| 10.5     | Audit & Compliance         | Approval history, policy enforcement, SOX compliance, evidence |

## Phase 11: Collaboration & Multi-User

| Subphase | Focus                   | Key Deliverables                                                                 |
| -------- | ----------------------- | -------------------------------------------------------------------------------- |
| 11.1     | Presence System         | PresenceIndicator, online status, active sheet tracking                          |
| 11.2     | Comments & Annotations  | CellComments, CommentThread, CommentIndicator, CellCommentPanel, CommentaryPanel |
| 11.3     | Real-Time Collaboration | WebSocket service, OT/CRDT strategy, conflict resolution                         |
| 11.4     | Permissions & Sharing   | Entity-level permissions, role-based access, sharing links                       |
| 11.5     | Locking & Versioning    | Cell locking, version history, rollback, change sets                             |

## Phase 12: Plugin System & Marketplace

| Subphase | Focus                | Key Deliverables                                                 |
| -------- | -------------------- | ---------------------------------------------------------------- |
| 12.1     | Plugin Registry      | Plugin registry design, manifest schema, lifecycle hooks         |
| 12.2     | Plugin Sandbox       | Plugin sandbox, security isolation, resource limits, permissions |
| 12.3     | Plugin Card & Detail | PluginCard, PluginDetail, plugin install/update/remove           |
| 12.4     | Template Marketplace | TemplateMarketplace, template discovery, ratings, categories     |
| 12.5     | Plugin SDK           | Plugin API, hook system, custom engine support, documentation    |

## Phase 13: ESG & Sustainability Reporting

| Subphase | Focus                    | Key Deliverables                                                         |
| -------- | ------------------------ | ------------------------------------------------------------------------ |
| 13.1     | ESG Dashboard            | ESGDashboard, ESGMetricsDashboard, ESG KPI framework                     |
| 13.2     | Carbon Footprint Tracker | CarbonFootprintTracker, emission factors, scope 1/2/3, reduction targets |
| 13.3     | CSRD Reporting           | CSRDReportGenerator, ESRS compliance, double materiality                 |
| 13.4     | Regulatory Mapping       | Regulatory framework map, jurisdiction support, filing prep              |
| 13.5     | ESG Data Sources         | Data connector framework, automated collection, audit trail              |

## Phase 14: Sector-Specific Modules

| Subphase | Focus                 | Key Deliverables                                                         |
| -------- | --------------------- | ------------------------------------------------------------------------ |
| 14.1     | SaaS Metrics          | MRRBreakdown, ChurnWaterfall, SaaSCohortTable, unit economics            |
| 14.2     | Construction/Projects | JobCostDashboard, WIP tracking, progress billing, contract mix           |
| 14.3     | Manufacturing         | ProductionDashboard, cost variance, BOM, throughput analysis             |
| 14.4     | Retail/Inventory      | StoreDashboard, inventory turnover, margin analysis, promo effectiveness |
| 14.5     | Real Estate           | PropertyDashboard, NOI, occupancy, lease analysis, cap rates             |

## Phase 15: Treasury & Cash Management

| Subphase | Focus               | Key Deliverables                                                 |
| -------- | ------------------- | ---------------------------------------------------------------- |
| 15.1     | Cash Forecast       | CashForecastChart, rolling forecast, DSO/DPO, liquidity planning |
| 15.2     | Debt Schedule       | Debt schedule, interest calc, covenant tracking, refinancing     |
| 15.3     | Investment Tracker  | Investment portfolio, returns calc, IRR, duration, risk metrics  |
| 15.4     | Depreciation Engine | DepreciationProjection, methods (SL/DB/units), asset lifecycle   |
| 15.5     | Lease Accounting    | LeaseSchedule, ASC 842/IFRS 16, ROU asset, lease liability       |

## Phase 16: Audit Trail & Compliance

| Subphase | Focus             | Key Deliverables                                                |
| -------- | ----------------- | --------------------------------------------------------------- |
| 16.1     | Data Lineage      | DataLineageViewer, cell provenance, calculation chain           |
| 16.2     | Audit Log         | Comprehensive audit log, user actions, data changes, timestamps |
| 16.3     | Retention Policy  | Data retention, archival strategy, purge schedules              |
| 16.4     | SOX Compliance    | Segregation of duties, access logging, review sign-off          |
| 16.5     | GDPR/Data Privacy | PII identification, anonymization, export/deletion requests     |

## Phase 17: Performance Optimization & Offline

| Subphase | Focus                      | Key Deliverables                                                    |
| -------- | -------------------------- | ------------------------------------------------------------------- |
| 17.1     | Bundle Optimization        | Chunk analysis, code splitting audit, dynamic imports, tree-shaking |
| 17.2     | Render Performance         | React profiler, AG Grid row model, virtualization, memo audit       |
| 17.3     | Worker Offloading          | Monte Carlo worker, consolidation worker, formula worker            |
| 17.4     | SQLite/SQL.js Optimization | Query perf, indexing, batch operations, WASM optimization           |
| 17.5     | Sync Engine                | Offline queue, sync protocol, conflict resolution, merge strategy   |

## Phase 18: Security & Access Control

| Subphase | Focus            | Key Deliverables                                                     |
| -------- | ---------------- | -------------------------------------------------------------------- |
| 18.1     | Authentication   | Auth service, OAuth/SSO, session management, MFA                     |
| 18.2     | Authorization    | RBAC, permission matrix, store-level guards, UI-level guards         |
| 18.3     | Data Encryption  | At-rest encryption, key management, secure storage                   |
| 18.4     | Input Validation | Zod schema audit, XSS prevention, SQL injection prevention           |
| 18.5     | Security Audit   | Dependency audit, CSP headers, penetration testing, OWASP compliance |

## Phase 19: Desktop (Tauri) & Native Experience

| Subphase | Focus              | Key Deliverables                                      |
| -------- | ------------------ | ----------------------------------------------------- |
| 19.1     | Tauri Shell        | Tauri config audit, window management, menu system    |
| 19.2     | Native Features    | File system access, notifications, shortcuts, updater |
| 19.3     | SQLite via Tauri   | Tauri SQL plugin, migration strategy, perf comparison |
| 19.4     | System Integration | OS menu, tray icon, file associations, auto-start     |
| 19.5     | Distribution       | Build pipeline, signing, auto-update, installer       |

## Phase 20: Continuous Improvement & QA

| Subphase | Focus                  | Key Deliverables                                                         |
| -------- | ---------------------- | ------------------------------------------------------------------------ |
| 20.1     | Test Coverage          | Coverage gaps, integration tests, E2E test expansion                     |
| 20.2     | TypeScript Strictness  | Incremental `any` removal, generic parameter audit                       |
| 20.3     | Linting & Code Quality | ESLint rule expansion, Prettier consistency, complexity reduction        |
| 20.4     | UX/UI Audit            | Accessibility (WCAG), responsive check, theme consistency, i18n audit    |
| 20.5     | Feedback Loop          | Metrics collection, error tracking, user feedback, cycle back to Phase 1 |

---

## Execution Strategy

### Wave 1 (Agents 1-5 — this session)

Launch 5 parallel agents. Each agent owns 4 phases (20 subphases).

### Wave 2+ (Future sessions)

Each subphase deepens. After Wave 1 complete, Phase 20 Continuous Improvement feeds back into Phase 1.

### Agent Dispatch

| Agent | Phases | Subphases | Focus Area                                |
| ----- | ------ | --------- | ----------------------------------------- |
| A1    | 1-4    | 1.1→4.5   | Core, Budget, Reports, Consolidation      |
| A2    | 5-8    | 5.1→8.5   | FX, Scenarios, Dashboards, AI/ML          |
| A3    | 9-12   | 9.1→12.5  | Import, Workflows, Collaboration, Plugins |
| A4    | 13-16  | 13.1→16.5 | ESG, Sector, Treasury, Audit              |
| A5    | 17-20  | 17.1→20.5 | Performance, Security, Desktop, QA        |

---

## Continuous Improvement Loop

```
Phase 20 (QA & Metrics) → Identify gaps → Phase 1 (Architecture) + deeper iteration
         ↑                                                      |
         └─────────────────── Cycle back ◄──────────────────────┘
```

Each completion of Phase 20 triggers a new cycle. Each cycle deepens every phase. Never-ending improvement.
