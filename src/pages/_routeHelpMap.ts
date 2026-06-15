/**
 * ROUTE_HELP_DOCS - Route to Part documentation reference map
 * Built by ATHENA (Phase 9 _docs.ts hand-off, 2026-06-15)
 * Source: docs/parts/_manifest.json (G14 reconciliation output)
 * Reference: docs/parts/00-INDEX.md (Part N -> title)
 *
 * Each route maps to the canonical Part documentation file.
 * Use getRouteHelpDoc(route) to look up help content for any route.
 */

export interface RouteHelpDoc {
  part: number | null; // Part N reference (null = no doc / auth route)
  title: string; // Part title (from 00-INDEX.md)
  file: string | null; // Canonical filename (from _manifest.json)
  path: string; // Help doc file path relative to docs/parts/
}

export const ROUTE_HELP_DOCS: Record<string, RouteHelpDoc> = {
  '/login': { part: null, title: 'Auth (no help)', file: null, path: '' },
  '/register': { part: null, title: 'Auth (no help)', file: null, path: '' },
  '/forgot-password': { part: null, title: 'Auth (no help)', file: null, path: '' },
  '/onboarding': {
    part: 29,
    title: 'Onboarding, Help & User Education',
    file: 'Part_29_Onboarding_Help.md',
    path: 'docs/parts/Part_29_Onboarding_Help.md',
  },
  '/': {
    part: 11,
    title: 'Screen-by-Screen UI Specification',
    file: 'PART_011_SCREEN_BY_SCREEN_UI_SPECIFICATION.md',
    path: 'docs/parts/PART_011_SCREEN_BY_SCREEN_UI_SPECIFICATION.md',
  },
  '/dashboard': {
    part: 27,
    title: 'Dashboard Engine Deep Spec',
    file: 'Part_27_Dashboard_Engine.md',
    path: 'docs/parts/Part_27_Dashboard_Engine.md',
  },
  '/drill-down': {
    part: 28,
    title: 'Drill-Down & Pivot Engine',
    file: 'Part_28_Drill_Down_Pivot.md',
    path: 'docs/parts/Part_28_Drill_Down_Pivot.md',
  },
  '/budgets': {
    part: 33,
    title: 'Budget Driver & Assumption Library',
    file: 'Part_33_Budget_Drivers.md',
    path: 'docs/parts/Part_33_Budget_Drivers.md',
  },
  '/budgets/create': {
    part: 33,
    title: 'Budget Driver & Assumption Library',
    file: 'Part_33_Budget_Drivers.md',
    path: 'docs/parts/Part_33_Budget_Drivers.md',
  },
  '/budgets/bva': {
    part: 33,
    title: 'Budget Driver & Assumption Library',
    file: 'Part_33_Budget_Drivers.md',
    path: 'docs/parts/Part_33_Budget_Drivers.md',
  },
  '/budgets/*': {
    part: 33,
    title: 'Budget Driver & Assumption Library',
    file: 'Part_33_Budget_Drivers.md',
    path: 'docs/parts/Part_33_Budget_Drivers.md',
  },
  '/forecasts': {
    part: 57,
    title: 'Forecasting Algorithm Deep Spec',
    file: 'Part_57_Forecasting.md',
    path: 'docs/parts/Part_57_Forecasting.md',
  },
  '/forecasts/create': {
    part: 57,
    title: 'Forecasting Algorithm Deep Spec',
    file: 'Part_57_Forecasting.md',
    path: 'docs/parts/Part_57_Forecasting.md',
  },
  '/forecasts/what-if': {
    part: 59,
    title: 'Sensitivity Analysis Engine',
    file: 'Part_59_Sensitivity.md',
    path: 'docs/parts/Part_59_Sensitivity.md',
  },
  '/forecasts/*': {
    part: 57,
    title: 'Forecasting Algorithm Deep Spec',
    file: 'Part_57_Forecasting.md',
    path: 'docs/parts/Part_57_Forecasting.md',
  },
  '/scenarios': {
    part: 31,
    title: 'Financial Planning Workflows',
    file: 'Part_31_Workflows.md',
    path: 'docs/parts/Part_31_Workflows.md',
  },
  '/scenarios/create': {
    part: 31,
    title: 'Financial Planning Workflows',
    file: 'Part_31_Workflows.md',
    path: 'docs/parts/Part_31_Workflows.md',
  },
  '/scenarios/*': {
    part: 31,
    title: 'Financial Planning Workflows',
    file: 'Part_31_Workflows.md',
    path: 'docs/parts/Part_31_Workflows.md',
  },
  '/variance': {
    part: 33,
    title: 'Budget Driver & Assumption Library',
    file: 'Part_33_Budget_Drivers.md',
    path: 'docs/parts/Part_33_Budget_Drivers.md',
  },
  '/analytics': {
    part: 43,
    title: 'Analytics & BI',
    file: 'PART_043_ANALYTICS_BUSINESS_INTELLIGENCE.md',
    path: 'docs/parts/PART_043_ANALYTICS_BUSINESS_INTELLIGENCE.md',
  },
  '/analytics/benchmarking': {
    part: 43,
    title: 'Analytics & BI',
    file: 'PART_043_ANALYTICS_BUSINESS_INTELLIGENCE.md',
    path: 'docs/parts/PART_043_ANALYTICS_BUSINESS_INTELLIGENCE.md',
  },
  '/analytics/goal-seek': {
    part: 59,
    title: 'Sensitivity Analysis Engine',
    file: 'Part_59_Sensitivity.md',
    path: 'docs/parts/Part_59_Sensitivity.md',
  },
  '/analytics/dashboard-builder': {
    part: 27,
    title: 'Dashboard Engine Deep Spec',
    file: 'Part_27_Dashboard_Engine.md',
    path: 'docs/parts/Part_27_Dashboard_Engine.md',
  },
  '/ai': {
    part: 14,
    title: 'Formula Engine & Spreadsheet Compatibility',
    file: 'PART_014_FORMULA_ENGINE.md',
    path: 'docs/parts/PART_014_FORMULA_ENGINE.md',
  },
  '/data': {
    part: 6,
    title: 'Data Architecture & Financial Data Models',
    file: 'PART_006_DATA_ARCHITECTURE_AND_FINANCIAL_DATA_MODELS.md',
    path: 'docs/parts/PART_006_DATA_ARCHITECTURE_AND_FINANCIAL_DATA_MODELS.md',
  },
  '/data/migration': {
    part: 19,
    title: 'Migration & Versioning Strategy',
    file: 'Part_19_Migration_Versioning.md',
    path: 'docs/parts/Part_19_Migration_Versioning.md',
  },
  '/data/chart-of-accounts': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/data/gl-upload': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/data/gl-explorer': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/data/gl-trial-balance': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/data/gl-journals': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/data/gl-account-analysis': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/data/gl-reporting': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/audit/trail': {
    part: 15,
    title: 'Security, Compliance & Audit Architecture',
    file: 'PART_015_SECURITY_COMPLIANCE_AUDIT.md',
    path: 'docs/parts/PART_015_SECURITY_COMPLIANCE_AUDIT.md',
  },
  '/audit/fair-value': {
    part: 15,
    title: 'Security, Compliance & Audit Architecture',
    file: 'PART_015_SECURITY_COMPLIANCE_AUDIT.md',
    path: 'docs/parts/PART_015_SECURITY_COMPLIANCE_AUDIT.md',
  },
  '/audit/impairment': {
    part: 15,
    title: 'Security, Compliance & Audit Architecture',
    file: 'PART_015_SECURITY_COMPLIANCE_AUDIT.md',
    path: 'docs/parts/PART_015_SECURITY_COMPLIANCE_AUDIT.md',
  },
  '/consolidation': {
    part: 36,
    title: 'Consolidation (ASC 810 with NCI)',
    file: 'Part_36_Consolidation.md',
    path: 'docs/parts/Part_36_Consolidation.md',
  },
  '/consolidation/ic-eliminations': {
    part: 55,
    title: 'Intercompany Matching',
    file: 'PART_055_INTERCOMPANY.md',
    path: 'docs/parts/PART_055_INTERCOMPANY.md',
  },
  '/consolidation/ownership': {
    part: 36,
    title: 'Consolidation (ASC 810 with NCI)',
    file: 'Part_36_Consolidation.md',
    path: 'docs/parts/Part_36_Consolidation.md',
  },
  '/currency/fx-rates': {
    part: 42,
    title: 'FX & Treasury (Hedge Accounting)',
    file: 'PART_042_FX_TREASURY.md',
    path: 'docs/parts/PART_042_FX_TREASURY.md',
  },
  '/currency/translation': {
    part: 42,
    title: 'FX & Treasury (Hedge Accounting)',
    file: 'PART_042_FX_TREASURY.md',
    path: 'docs/parts/PART_042_FX_TREASURY.md',
  },
  '/currency/hedging': {
    part: 42,
    title: 'FX & Treasury (Hedge Accounting)',
    file: 'PART_042_FX_TREASURY.md',
    path: 'docs/parts/PART_042_FX_TREASURY.md',
  },
  '/cash/forecast': {
    part: 35,
    title: 'Cash Flow Modeling (13-week)',
    file: 'Part_35_Cash_Flow_Modeling.md',
    path: 'docs/parts/Part_35_Cash_Flow_Modeling.md',
  },
  '/cash/debt': {
    part: 61,
    title: 'Debt Schedule & Covenants',
    file: 'Part_61_Debt.md',
    path: 'docs/parts/Part_61_Debt.md',
  },
  '/cash/working-capital': {
    part: 60,
    title: 'Working Capital Models',
    file: 'Part_60_Working_Capital.md',
    path: 'docs/parts/Part_60_Working_Capital.md',
  },
  '/treasury/investments': {
    part: 42,
    title: 'FX & Treasury (Hedge Accounting)',
    file: 'PART_042_FX_TREASURY.md',
    path: 'docs/parts/PART_042_FX_TREASURY.md',
  },
  '/treasury/fx-exposure': {
    part: 42,
    title: 'FX & Treasury (Hedge Accounting)',
    file: 'PART_042_FX_TREASURY.md',
    path: 'docs/parts/PART_042_FX_TREASURY.md',
  },
  '/reports': {
    part: 26,
    title: 'Custom Report Builder Deep Spec',
    file: 'Part_26_Custom_Report_Builder.md',
    path: 'docs/parts/Part_26_Custom_Report_Builder.md',
  },
  '/reports/profit-loss': {
    part: 54,
    title: 'Financial Statement Construction Algorithm',
    file: 'PART_054_STATEMENT_CONSTRUCTION.md',
    path: 'docs/parts/PART_054_STATEMENT_CONSTRUCTION.md',
  },
  '/reports/balance-sheet': {
    part: 54,
    title: 'Financial Statement Construction Algorithm',
    file: 'PART_054_STATEMENT_CONSTRUCTION.md',
    path: 'docs/parts/PART_054_STATEMENT_CONSTRUCTION.md',
  },
  '/reports/cash-flow': {
    part: 35,
    title: 'Cash Flow Modeling (13-week)',
    file: 'Part_35_Cash_Flow_Modeling.md',
    path: 'docs/parts/Part_35_Cash_Flow_Modeling.md',
  },
  '/reports/three-statement': {
    part: 54,
    title: 'Financial Statement Construction Algorithm',
    file: 'PART_054_STATEMENT_CONSTRUCTION.md',
    path: 'docs/parts/PART_054_STATEMENT_CONSTRUCTION.md',
  },
  '/reports/budget-vs-actual': {
    part: 33,
    title: 'Budget Driver & Assumption Library',
    file: 'Part_33_Budget_Drivers.md',
    path: 'docs/parts/Part_33_Budget_Drivers.md',
  },
  '/reports/segment': {
    part: 43,
    title: 'Analytics & BI',
    file: 'PART_043_ANALYTICS_BUSINESS_INTELLIGENCE.md',
    path: 'docs/parts/PART_043_ANALYTICS_BUSINESS_INTELLIGENCE.md',
  },
  '/board-pack': {
    part: 63,
    title: 'Management Reporting',
    file: 'Part_63_Management_Reporting.md',
    path: 'docs/parts/Part_63_Management_Reporting.md',
  },
  '/templates': {
    part: 25,
    title: 'Financial Model Templates & Starters',
    file: 'PART_025_FINANCIAL_MODEL_TEMPLATES.md',
    path: 'docs/parts/PART_025_FINANCIAL_MODEL_TEMPLATES.md',
  },
  '/revenue/rev-rec': {
    part: 37,
    title: 'Rev Rec (ASC 606 with SSP)',
    file: 'Part_37_Rev_Rec.md',
    path: 'docs/parts/Part_37_Rev_Rec.md',
  },
  '/revenue/deferred': {
    part: 37,
    title: 'Rev Rec (ASC 606 with SSP)',
    file: 'Part_37_Rev_Rec.md',
    path: 'docs/parts/Part_37_Rev_Rec.md',
  },
  '/lease': {
    part: 39,
    title: 'Lease (ASC 842 / IFRS 16)',
    file: 'Part_39_Lease.md',
    path: 'docs/parts/Part_39_Lease.md',
  },
  '/lease/*': {
    part: 39,
    title: 'Lease (ASC 842 / IFRS 16)',
    file: 'Part_39_Lease.md',
    path: 'docs/parts/Part_39_Lease.md',
  },
  '/tax/provision': {
    part: 38,
    title: 'Tax (ASC 740)',
    file: 'Part_38_Tax.md',
    path: 'docs/parts/Part_38_Tax.md',
  },
  '/tax/transfer-pricing': {
    part: 38,
    title: 'Tax (ASC 740)',
    file: 'Part_38_Tax.md',
    path: 'docs/parts/Part_38_Tax.md',
  },
  '/capex': {
    part: 40,
    title: 'Fixed Asset & Depreciation',
    file: 'Part_40_Fixed_Asset.md',
    path: 'docs/parts/Part_40_Fixed_Asset.md',
  },
  '/capex/depreciation': {
    part: 40,
    title: 'Fixed Asset & Depreciation',
    file: 'Part_40_Fixed_Asset.md',
    path: 'docs/parts/Part_40_Fixed_Asset.md',
  },
  '/workforce/headcount': {
    part: 41,
    title: 'Workforce & Equity Comp',
    file: 'Part_41_Workforce_Equity.md',
    path: 'docs/parts/Part_41_Workforce_Equity.md',
  },
  '/workforce/compensation': {
    part: 41,
    title: 'Workforce & Equity Comp',
    file: 'Part_41_Workforce_Equity.md',
    path: 'docs/parts/Part_41_Workforce_Equity.md',
  },
  '/workforce/payroll': {
    part: 41,
    title: 'Workforce & Equity Comp',
    file: 'Part_41_Workforce_Equity.md',
    path: 'docs/parts/Part_41_Workforce_Equity.md',
  },
  '/saas/arr': {
    part: 88,
    title: 'Sector: SaaS & Technology',
    file: 'PART_088_SAAS_SECTOR.md',
    path: 'docs/parts/PART_088_SAAS_SECTOR.md',
  },
  '/saas/cohort': {
    part: 88,
    title: 'Sector: SaaS & Technology',
    file: 'PART_088_SAAS_SECTOR.md',
    path: 'docs/parts/PART_088_SAAS_SECTOR.md',
  },
  '/saas/churn': {
    part: 88,
    title: 'Sector: SaaS & Technology',
    file: 'PART_088_SAAS_SECTOR.md',
    path: 'docs/parts/PART_088_SAAS_SECTOR.md',
  },
  '/manufacturing/production': {
    part: 105,
    title: 'Sector: Insurance',
    file: 'Part_105_Sector_Insurance.md',
    path: 'docs/parts/Part_105_Sector_Insurance.md',
  },
  '/manufacturing/cogs': {
    part: 105,
    title: 'Sector: Insurance',
    file: 'Part_105_Sector_Insurance.md',
    path: 'docs/parts/Part_105_Sector_Insurance.md',
  },
  '/manufacturing/inventory': {
    part: 105,
    title: 'Sector: Insurance',
    file: 'Part_105_Sector_Insurance.md',
    path: 'docs/parts/Part_105_Sector_Insurance.md',
  },
  '/retail/stores': {
    part: 106,
    title: 'Sector: Telecommunications',
    file: 'Part_106_Sector_Telecom.md',
    path: 'docs/parts/Part_106_Sector_Telecom.md',
  },
  '/retail/promo': {
    part: 106,
    title: 'Sector: Telecommunications',
    file: 'Part_106_Sector_Telecom.md',
    path: 'docs/parts/Part_106_Sector_Telecom.md',
  },
  '/banking/nim': {
    part: 107,
    title: 'Sector: Banking & Lending',
    file: 'Part_107_Sector_Banking.md',
    path: 'docs/parts/Part_107_Sector_Banking.md',
  },
  '/banking/capital': {
    part: 107,
    title: 'Sector: Banking & Lending',
    file: 'Part_107_Sector_Banking.md',
    path: 'docs/parts/Part_107_Sector_Banking.md',
  },
  '/banking/loan-loss': {
    part: 107,
    title: 'Sector: Banking & Lending',
    file: 'Part_107_Sector_Banking.md',
    path: 'docs/parts/Part_107_Sector_Banking.md',
  },
  '/healthcare/dashboard': {
    part: 108,
    title: 'Sector: Mining & Metals',
    file: 'Part_108_Sector_Mining.md',
    path: 'docs/parts/Part_108_Sector_Mining.md',
  },
  '/healthcare/revenue': {
    part: 108,
    title: 'Sector: Mining & Metals',
    file: 'Part_108_Sector_Mining.md',
    path: 'docs/parts/Part_108_Sector_Mining.md',
  },
  '/healthcare/clinical-trials': {
    part: 108,
    title: 'Sector: Mining & Metals',
    file: 'Part_108_Sector_Mining.md',
    path: 'docs/parts/Part_108_Sector_Mining.md',
  },
  '/energy/dashboard': {
    part: 109,
    title: 'Audit & Compliance Testing',
    file: 'Part_109_Audit_Compliance_Test.md',
    path: 'docs/parts/Part_109_Audit_Compliance_Test.md',
  },
  '/energy/production': {
    part: 109,
    title: 'Audit & Compliance Testing',
    file: 'Part_109_Audit_Compliance_Test.md',
    path: 'docs/parts/Part_109_Audit_Compliance_Test.md',
  },
  '/energy/risk': {
    part: 109,
    title: 'Audit & Compliance Testing',
    file: 'Part_109_Audit_Compliance_Test.md',
    path: 'docs/parts/Part_109_Audit_Compliance_Test.md',
  },
  '/energy/renewable': {
    part: 109,
    title: 'Audit & Compliance Testing',
    file: 'Part_109_Audit_Compliance_Test.md',
    path: 'docs/parts/Part_109_Audit_Compliance_Test.md',
  },
  '/energy/emissions': {
    part: 109,
    title: 'Audit & Compliance Testing',
    file: 'Part_109_Audit_Compliance_Test.md',
    path: 'docs/parts/Part_109_Audit_Compliance_Test.md',
  },
  '/esg/carbon': {
    part: 110,
    title: 'Print, PDF & Board Pack',
    file: 'Part_110_Print_PDF.md',
    path: 'docs/parts/Part_110_Print_PDF.md',
  },
  '/esg/csrd': {
    part: 110,
    title: 'Print, PDF & Board Pack',
    file: 'Part_110_Print_PDF.md',
    path: 'docs/parts/Part_110_Print_PDF.md',
  },
  '/accounting/depreciation': {
    part: 40,
    title: 'Fixed Asset & Depreciation',
    file: 'Part_40_Fixed_Asset.md',
    path: 'docs/parts/Part_40_Fixed_Asset.md',
  },
  '/accounting/multi-book': {
    part: 32,
    title: 'Chart of Accounts Deep Spec',
    file: 'Part_32_Chart_Of_Accounts.md',
    path: 'docs/parts/Part_32_Chart_Of_Accounts.md',
  },
  '/settings': {
    part: 75,
    title: 'Configuration & Feature Toggles',
    file: 'Part_75_Configuration.md',
    path: 'docs/parts/Part_75_Configuration.md',
  },
  '/settings/users': {
    part: 75,
    title: 'Configuration & Feature Toggles',
    file: 'Part_75_Configuration.md',
    path: 'docs/parts/Part_75_Configuration.md',
  },
  '/profile': {
    part: 75,
    title: 'Configuration & Feature Toggles',
    file: 'Part_75_Configuration.md',
    path: 'docs/parts/Part_75_Configuration.md',
  },
  '/plugins': {
    part: 73,
    title: 'Plugin Architecture (Detailed)',
    file: 'Part_73_Plugin_Architecture.md',
    path: 'docs/parts/Part_73_Plugin_Architecture.md',
  },
  '/help': {
    part: 29,
    title: 'Onboarding, Help & User Education',
    file: 'Part_29_Onboarding_Help.md',
    path: 'docs/parts/Part_29_Onboarding_Help.md',
  },
  '/admin/debug': {
    part: 80,
    title: 'On-Call & Incident Response',
    file: 'Part_80_OnCall_Incident.md',
    path: 'docs/parts/Part_80_OnCall_Incident.md',
  },
  '/collaboration': {
    part: 46,
    title: 'Collaboration & Workflow',
    file: 'Part_46_Collaboration.md',
    path: 'docs/parts/Part_46_Collaboration.md',
  },
  '/collaboration/approvals': {
    part: 46,
    title: 'Collaboration & Workflow',
    file: 'Part_46_Collaboration.md',
    path: 'docs/parts/Part_46_Collaboration.md',
  },
};

/**
 * Look up help documentation for a given route.
 * Supports exact match and wildcard family match (e.g., '/budgets/abc' -> '/budgets/*').
 * Returns null for auth routes (no help doc) or unknown routes.
 */
export function getRouteHelpDoc(route: string): RouteHelpDoc | null {
  if (ROUTE_HELP_DOCS[route]) return ROUTE_HELP_DOCS[route];
  // Wildcard family match: replace last segment with *
  const family = route.replace(/\/[^/]+\$/, '/*');
  if (ROUTE_HELP_DOCS[family]) return ROUTE_HELP_DOCS[family];
  return null;
}

/**
 * Build summary stats for the route help map.
 * Returns: { total, mapped, auth, missing }
 */
export function getRouteHelpStats() {
  const all = Object.values(ROUTE_HELP_DOCS);
  return {
    total: all.length,
    mapped: all.filter((r) => r.part !== null).length,
    auth: all.filter((r) => r.part === null).length,
  };
}
