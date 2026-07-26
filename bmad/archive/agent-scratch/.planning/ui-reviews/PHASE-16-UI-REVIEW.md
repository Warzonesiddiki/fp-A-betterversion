# Phase 16 — Industry Dashboards UI Review

**Audited:** 2025-03-24
**Baseline:** Abstract 6-pillar standards + designTokens.ts
**Screenshots:** Not captured (no dev server running)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | SaaS/Mfg/Health pages use generic boilerplate copy; Retail/Banking are good. |
| 2. Visuals | 2/4 | High variance in dashboard fidelity (Retail vs SaaS placeholders). |
| 3. Color | 2/4 | Hardcoded hex values in charts; inconsistent variance color shades (green-400 vs 600). |
| 4. Typography | 3/4 | Generally consistent but misses "tabular figures" for financial data in many tables. |
| 5. Spacing | 3/4 | Consistent 24px (p-6) dashboard padding, but empty states use p-12. |
| 6. Experience Design | 3/4 | All pages handle empty states; accessibility (aria-labels) is present. |

**Overall: 15/24**

---

## Top 3 Priority Fixes

1. **Industry Fidelity Alignment** — SaaS, Manufacturing, and Healthcare dashboards are low-fidelity placeholders. **Fix**: Implement charts and domain-specific KPIs for these pages to match the Retail/Banking standard.
2. **Chart Tokenization** — Charts in `RetailDashboardPage` and `EnergyDashboardPage` use hardcoded hex strings (e.g., `#3b82f6`). **Fix**: Use `designTokens.colors.charts` or CSS variables to ensure theme compatibility.
3. **Variance Color Standardization** — `KPIValue` uses semantic classes but page-level tables use hardcoded `text-green-600`. **Fix**: Standardize on `fin-positive` and `fin-negative` classes defined in `designTokens`.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)
- **Generic Placeholders**: `SaaSPage.tsx`, `ManufacturingPage.tsx`, and `HealthcarePage.tsx` use identical boilerplate: "Import GL data to view [Industry] metrics."
- **Good Contrast**: `RetailDashboardPage` and `BankingDashboard` provide descriptive sub-headers that explain the value of the view.

### Pillar 2: Visuals (2/4)
- **Fidelity Gap**: Retail/Banking/Energy have rich data visualizations (AreaCharts, BarCharts). SaaS/Mfg/Health/ESG only show a basic KPI row and a GL table.
- **Icon Usage**: Good icon selection across all pages (Lucide icons).

### Pillar 3: Color (2/4)
- **Hardcoded Colors**: 
    - `RetailDashboardPage.tsx`: `#3b82f6`, `#10b981`, `#f59e0b`.
    - `BankingDashboard.tsx`: `#1e293b`, `#334155`.
- **Inconsistent Green**: `RetailDashboardPage` uses `text-green-600` while `AIIntelligencePage` uses `text-green-400`.
- **Variance Matches**: `designTokens.ts` specifies `#16a34a` (green-600) and `#dc2626` (red-600). Most pages follow this, but some diverge.

### Pillar 4: Typography (3/4)
- **Tabular Figures**: Most numeric columns in `DataTable` use standard fonts. They should use `tabular-nums` from `designTokens.typography.tabularFigures` to prevent "jumping" during updates.
- **Hierarchy**: Good use of `text-3xl font-black` for main headings and `text-2xl font-bold` for card titles.

### Pillar 5: Spacing (3/4)
- **Dashboard Layout**: Consistent `p-6` and `space-y-6` for main containers.
- **KPI Grid**: Consistent `gap-4` for metrics.
- **Empty State Inconsistency**: `SaaSPage` uses `p-12` for its empty state container, while the dashboard itself is `p-6`.

### Pillar 6: Experience Design (3/4)
- **Empty States**: Well-handled with icons and clear CTAs.
- **Navigation**: Consistent integration with breadcrumbs and routing.
- **A11y**: Good use of `role="main"` and `aria-label`. Skip links are present in high-fidelity pages.

---

## Files Audited
- `src/pages/saas/SaaSPage.tsx`
- `src/pages/manufacturing/ManufacturingPage.tsx`
- `src/pages/retail/RetailDashboardPage.tsx`
- `src/pages/banking/BankingDashboard.tsx`
- `src/pages/healthcare/HealthcarePage.tsx`
- `src/pages/energy/EnergyDashboardPage.tsx`
- `src/pages/esg/ESGPage.tsx`
- `src/config/designTokens.ts`
- `src/components/ui/KPIValue.tsx`
- `src/components/ui/DataTable.tsx`
