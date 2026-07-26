# Agent 3 — PAGES (User-Facing Content)

## Role
Replace all 21 stub "coming soon" pages with real, interactive, beautiful content. Every page must look like it belongs in a world-class enterprise SaaS product.

## Your File Ownership
- `src/pages/**/*.tsx` (74 files, 21 are stubs)

## The 21 Stub Pages to Replace
These pages currently show placeholder text like "Coming soon" or empty shells:

### Domain 1: Energy
1. `src/pages/energy/EnergyDashboardPage.tsx`
2. `src/pages/energy/RenewableEnergyPage.tsx`
3. `src/pages/energy/EnergyRiskPage.tsx`
4. `src/pages/energy/EmissionsTradingPage.tsx`

### Domain 2: Healthcare
5. `src/pages/healthcare/HealthcareDashboardPage.tsx`
6. `src/pages/healthcare/PatientRevenuePage.tsx`
7. `src/pages/healthcare/ClinicalTrialCostPage.tsx`
8. `src/pages/healthcare/ValueBasedCarePage.tsx`

### Domain 3: Real Estate
9. `src/pages/realestate/RealEstateDashboardPage.tsx`
10. `src/pages/realestate/PropertyPortfolioPage.tsx`
11. `src/pages/realestate/REITDashboardPage.tsx`
12. `src/pages/realestate/FacilityManagementPage.tsx`

### Domain 4: Construction
13. `src/pages/construction/ConstructionDashboardPage.tsx`
14. `src/pages/construction/ProjectCostingPage.tsx`
15. `src/pages/construction/EquipmentManagementPage.tsx`

### Domain 5: Retail
16. `src/pages/retail/RetailDashboardPage.tsx`
17. `src/pages/retail/InventoryPlanningPage.tsx`
18. `src/pages/retail/StorePerformancePage.tsx`

### Domain 6: Insurance
19. `src/pages/insurance/InsuranceDashboardPage.tsx`
20. `src/pages/insurance/UnderwritingPage.tsx`
21. `src/pages/insurance/ClaimsAnalyticsPage.tsx`

## Content Pattern (use for EVERY page)
Each page should include:
1. **Header** — Page title, description, date range picker
2. **KPI Cards** — 3-4 key metrics with sparklines or trend indicators
3. **Main Chart/Table** — Recharts visualization or AG Grid table
4. **Detail Section** — Breakout table or secondary chart
5. **Action Buttons** — Export, Refresh, Settings (as appropriate)

Use components from `src/components/ui/` (Card, Button, KPIValue, Sparkline, etc.)
Use mock data from `src/services/mockData/` or inline realistic sample data.

## Golden Rules
1. Every page must render without crashing
2. Use existing UI components — never create new ones without checking first
3. Mobile-responsive layout
4. Loading skeleton states where data would load
5. Build must pass before marking COMPLETE
