# Missing Features Deep Dive — FinPlan Pro

## Executive Summary

FinPlan Pro has strong foundations but significant gaps between "code exists" and "production-ready competitive product." Current state: ~70% of what's needed to dominate the FP&A market.

## 10 Areas Analyzed

### 1. Formula Engine — 95% Complete

**Exists:** 245 functions across 7 modules (financial, statistical, math, text, lookup, logical, helpers)
**Missing:**

- Functions exist but many aren't wired into the formula parser
- No custom function registration from plugins
- No formula autocomplete/suggestions in UI
  **Impact:** Medium — core engine works, but UX polish missing

### 2. Charts — 40% Complete (MAJOR GAP)

**Exists:** 6 chart components created (WaterfallChart, VarianceChart, SparklineChart, TreemapChart, HeatmapChart, GaugeChart)
**Missing:**

- Only WaterfallChart used in 2 pages (BudgetVAReport, ARRDashboard)
- VarianceChart, SparklineChart, TreemapChart, HeatmapChart, GaugeChart NOT used anywhere
- No chart export to PNG/SVG
- No chart drill-down
- No chart annotations
  **Impact:** HIGH — charts created but not integrated. Users see basic Recharts, not the advanced components.

### 3. Stores — 95% Complete

**Exists:** All 40 stores have subscribeWithSelector pattern
**Missing:**

- Only 4 stores have undo/redo (budget, cube, forecast, gl)
- Other stores lack undo/redo capability
  **Impact:** Low — undo/redo is nice-to-have for most stores

### 4. CommandPalette — 100% Complete

**Exists:** Wired into AppLayout with Ctrl+K shortcut
**Missing:** Nothing — fully functional
**Impact:** None — done

### 5. Error Boundaries — 20% Complete (MAJOR GAP)

**Exists:** 3 components created (AsyncErrorBoundary, PageErrorBoundary, ErrorFallback)
**Missing:**

- NOT used in any pages
- No error reporting/logging
- No retry mechanisms
- No graceful degradation
  **Impact:** HIGH — one component crash kills entire app

### 6. Keyboard Shortcuts — 80% Complete

**Exists:** useKeyboardShortcuts hook wired in AppLayout
**Missing:**

- Shortcut help modal exists but not wired
- No shortcut customization
- No shortcut conflict detection
  **Impact:** Medium — core shortcuts work, polish missing

### 7. Plugin System — 30% Complete (MAJOR GAP)

**Exists:** Registry, Loader, API, Manager all built
**Missing:**

- NOT integrated with rest of app
- No plugins installed
- No plugin UI (settings page)
- No plugin discovery/marketplace
- No plugin sandboxing enforcement
  **Impact:** HIGH — system exists in isolation, not connected

### 8. Migration — 100% Complete

**Exists:** MigrationWizard wired to routes at /data/migration
**Missing:** Nothing — fully functional
**Impact:** None — done

### 9. A11y — 70% Complete

**Exists:** 460 ARIA attributes in pages, FocusTrap, LiveRegion, SkipToContent, VisuallyHidden
**Missing:**

- No screen reader testing
- No keyboard navigation testing
- No color contrast validation
- No focus management in modals
  **Impact:** Medium — basic a11y present, compliance gaps

### 10. Tests — 85% Complete

**Exists:** 418 test files, 5990 passing
**Missing:**

- ~25 test failures (regression)
- No E2E tests (only smoke.spec.ts)
- No visual regression tests
- No performance tests
  **Impact:** Medium — unit tests strong, integration/E2E weak

## Beyond Prompt Specs — What Competitors Have

### What Adaptive Insights / Anaplan / Planful Have That We Don't

1. **Real-time Collaboration** — Multiple users editing same budget (we have comments only)
2. **Workflow Automation** — Approval chains, notifications, deadlines (we have basic approvals)
3. **Advanced What-If** — Monte Carlo simulation, sensitivity analysis (we have basic scenarios)
4. **Data Connectors** — Direct ERP/CRM integration (we have import only)
5. **AI-Powered Forecasting** — ML-based predictions (we have basic AI engine)
6. **Audit Compliance** — SOX/IFRS built-in (we have basic audit trail)
7. **Mobile App** — iOS/Android for approvals (we have desktop only)
8. **API Access** — REST/GraphQL for integrations (we have none)
9. **Advanced Reporting** — Pixel-perfect PDF, scheduled delivery (we have basic export)
10. **Data Governance** — Lineage, quality checks, reconciliation (we have none)

## Top 20 Features for "Absolute Perfect Product"

### Critical (Must Have — blocks sales)

1. **Wire charts into pages** — 5 chart components exist but unused
2. **Error boundaries on all pages** — prevent app crashes
3. **Fix 25 test failures** — regression from store changes
4. **Plugin system integration** — connect to rest of app
5. **E2E tests** — Playwright MCP installed but no tests

### High Priority (Competitive parity)

6. **Real-time collaboration** — WebSocket-based multi-user editing
7. **Workflow automation** — Approval chains with notifications
8. **API layer** — REST endpoints for integrations
9. **Advanced what-if** — Monte Carlo, sensitivity analysis
10. **Data connectors** — Direct ERP/CRM/SaaS integration

### Medium Priority (Differentiation)

11. **AI-powered forecasting** — ML models for predictions
12. **Mobile companion** — React Native for approvals
13. **Advanced reporting** — Pixel-perfect PDF, scheduled delivery
14. **Data governance** — Lineage, quality, reconciliation
15. **Custom dashboards** — Drag-drop widget builder

### Nice to Have (Future)

16. **Offline sync** — CRDT-based conflict resolution
17. **Plugin marketplace** — Discover and install plugins
18. **White-labeling** — Custom branding for enterprises
19. **Multi-currency reporting** — Consolidated FX reports
20. **Regulatory templates** — IFRS/GAAP/SOX pre-built

## Completion Assessment

| Category             | Current | Target | Gap |
| -------------------- | ------- | ------ | --- |
| Core Features        | 95%     | 100%   | 5%  |
| UX Polish            | 60%     | 95%    | 35% |
| Testing              | 85%     | 95%    | 10% |
| Competitive Features | 40%     | 90%    | 50% |
| Enterprise Features  | 20%     | 80%    | 60% |

**Overall: ~70% of "absolute perfect product"**

## Recommendation

Focus on:

1. Wire existing components (charts, error boundaries, plugin system)
2. Fix test regression
3. Build competitive features (real-time, workflow, API)
4. Add enterprise features (governance, compliance, mobile)
