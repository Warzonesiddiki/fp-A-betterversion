import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Building2,
  FileText,
  Layers,
  LayoutDashboard,
  PieChart,
  Settings,
  Target,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Canonical navigation manifest (UI-03).
 *
 * Single source of truth for the sidebar, the command palette and the
 * breadcrumb trail. Every route rendered inside `<Route element={<AppLayout />}>`
 * in src/App.tsx appears here exactly once, and every path here resolves to a
 * real route — both directions are enforced by src/types/navigation.contract.test.ts,
 * so a new screen can never be shipped unreachable.
 *
 * Labels default to the `PAGE_HELP` title in src/pages/_docs.ts so the sidebar
 * and the help panel agree on what a screen is called; a small curated set is
 * overridden where the help-panel phrasing reads badly in a nav rail (e.g.
 * "Rolling Forecast Help") or where two distinct screens share a title. They
 * are inlined rather than imported so the nav chunk never pulls in help copy.
 * The contract test enforces that every path has help coverage and that labels
 * are unique within their group.
 *
 * `hidden` items are alias routes (e.g. `/` for `/dashboard`): reachable and
 * addressable, but not rendered twice in the sidebar.
 *
 * Items with a `permission` key are shown only to roles holding it. This is a
 * presentation filter; data authorization is enforced server-side (F-04).
 */

export interface NavItem {
  path: string;
  label: string;
  /** Optional ROLE_PERMISSIONS key; undefined = visible to all roles. */
  permission?: string;
  /** Alias route: part of the manifest, not rendered in the sidebar. */
  hidden?: boolean;
}

export interface NavGroup {
  /** Sub-heading inside a section; null renders the items flat. */
  label: string | null;
  items: readonly NavItem[];
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  groups: readonly NavGroup[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    groups: [
      {
        label: null,
        items: [
          { path: '/', label: 'Dashboard', hidden: true },
          { path: '/dashboard', label: 'Dashboard' },
          { path: '/board-pack', label: 'Board Pack' },
          { path: '/profile', label: 'My Profile' },
          { path: '/help', label: 'Help Center' },
          { path: '/docs/api', label: 'API Reference' },
        ],
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: Target,
    groups: [
      {
        label: 'Budgets',
        items: [
          { path: '/budgets', label: 'Budgets', permission: 'budget:read' },
          { path: '/budgets/create', label: 'Create Budget', permission: 'budget:read' },
          { path: '/budgets/bva', label: 'Budget vs Actual Report', permission: 'budget:read' },
          { path: '/budgets/approval', label: 'Budget Approval', permission: 'budget:read' },
        ],
      },
      {
        label: 'Capital',
        items: [
          { path: '/capex/tracker', label: 'CapEx Tracker', permission: 'capex:read' },
          { path: '/capex', label: 'Capital Projects', permission: 'capex:read' },
          { path: '/capex/depreciation', label: 'Depreciation Forecast', permission: 'capex:read' },
        ],
      },
      {
        label: 'Forecasts',
        items: [
          { path: '/forecasts', label: 'Forecasts', permission: 'forecast:read' },
          { path: '/forecasts/create', label: 'New Forecast', permission: 'forecast:read' },
          { path: '/forecasts/what-if', label: 'What-If Analysis', permission: 'forecast:read' },
          { path: '/forecasts/drivers', label: 'Forecast Drivers', permission: 'forecast:read' },
          { path: '/forecasts/rolling', label: 'Rolling Forecast', permission: 'forecast:read' },
          {
            path: '/forecasts/compare',
            label: 'Compare Forecasts',
            permission: 'forecast:read',
            hidden: true,
          },
          {
            path: '/forecasts/auto-update',
            label: 'Auto-Update Forecasts',
            permission: 'forecast:read',
            hidden: true,
          },
        ],
      },
      {
        label: 'Scenarios',
        items: [
          { path: '/scenarios', label: 'Scenario Planning', permission: 'scenario:read' },
          { path: '/scenarios/create', label: 'New Scenario', permission: 'scenario:read' },
          { path: '/scenarios/compare', label: 'Compare Scenarios', permission: 'scenario:read' },
          {
            path: '/scenarios/merge',
            label: 'Merge Scenarios',
            permission: 'scenario:read',
            hidden: true,
          },
          {
            path: '/scenarios/lock',
            label: 'Scenario Locks',
            permission: 'scenario:read',
            hidden: true,
          },
        ],
      },
      {
        label: 'Workforce',
        items: [
          { path: '/workforce/headcount', label: 'Headcount Plan', permission: 'budget:read' },
          {
            path: '/workforce/compensation',
            label: 'Compensation Modeling',
            permission: 'budget:read',
          },
          { path: '/workforce/payroll', label: 'Payroll Forecast', permission: 'budget:read' },
        ],
      },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: PieChart,
    groups: [
      {
        label: null,
        items: [
          { path: '/variance', label: 'Variance Analysis', permission: 'variance:read' },
          { path: '/analytics', label: 'Advanced Analytics', permission: 'analytics:read' },
          { path: '/analytics/benchmarking', label: 'Benchmarking', permission: 'analytics:read' },
          { path: '/analytics/goal-seek', label: 'Goal Seek', permission: 'analytics:read' },
          {
            path: '/analytics/dashboard-builder',
            label: 'Dashboard Builder',
            permission: 'analytics:read',
          },
          {
            path: '/analytics/pivot-explorer',
            label: 'Pivot Explorer',
            permission: 'analytics:read',
          },
          { path: '/ai', label: 'AI Intelligence', permission: 'analytics:read' },
          { path: '/analytics/data-lineage', label: 'Data Lineage', permission: 'analytics:read' },
          { path: '/ai/nlq', label: 'Natural Language Query', permission: 'analytics:read' },
          {
            path: '/charts/chart-of-accounts',
            label: 'Chart of Accounts',
            permission: 'analytics:read',
          },
          { path: '/charts/showcase', label: 'Chart Showcase', permission: 'analytics:read' },
        ],
      },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: FileText,
    groups: [
      {
        label: 'Financial Statements',
        items: [
          { path: '/reports', label: 'Financial Reports', permission: 'report:read' },
          {
            path: '/reports/profit-loss',
            label: 'Profit & Loss Statement',
            permission: 'report:read',
          },
          { path: '/reports/balance-sheet', label: 'Balance Sheet', permission: 'report:read' },
          { path: '/reports/cash-flow', label: 'Cash Flow Statement', permission: 'report:read' },
          {
            path: '/reports/three-statement',
            label: 'Three-Statement Dashboard',
            permission: 'report:read',
          },
          {
            path: '/reports/budget-vs-actual',
            label: 'Budget vs Actual',
            permission: 'report:read',
          },
          {
            path: '/reports/segment',
            label: 'Segment Reporting (ASC 280)',
            permission: 'report:read',
          },
        ],
      },
      {
        label: 'Report Builder',
        items: [
          { path: '/templates/preview', label: 'Template Preview', permission: 'report:read' },
          { path: '/reports/designer', label: 'Report Designer', permission: 'report:read' },
          { path: '/reports/scheduler', label: 'Report Scheduler', permission: 'report:read' },
          { path: '/reports/library', label: 'Report Library', permission: 'report:read' },
          { path: '/reports/book-builder', label: 'Book Builder', permission: 'report:read' },
          { path: '/reports/templates', label: 'Report Templates', permission: 'report:read' },
          { path: '/templates', label: 'Template Library', permission: 'report:read' },
        ],
      },
    ],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    icon: BookOpen,
    groups: [
      {
        label: 'Audit & Compliance',
        items: [
          { path: '/audit/trail', label: 'Audit Trail', permission: 'audit:read' },
          { path: '/audit/sox', label: 'SOX Audit', permission: 'audit:read' },
          { path: '/audit/fair-value', label: 'Fair Value (ASC 820)', permission: 'audit:read' },
          { path: '/audit/impairment', label: 'Impairment (ASC 360)', permission: 'audit:read' },
        ],
      },
      {
        label: 'Data Management',
        items: [
          { path: '/data', label: 'Data Import', permission: 'import:read' },
          { path: '/data/migration', label: 'Data Migration', permission: 'import:read' },
          { path: '/data/data-flow', label: 'Data Flow', permission: 'import:read' },
          {
            path: '/data/reconciliation',
            label: 'Data Reconciliation',
            permission: 'gl:reconcile',
          },
          { path: '/data/version-diff', label: 'Version Diff', permission: 'import:read' },
          { path: '/accounting/depreciation', label: 'Depreciation Schedule' },
          { path: '/accounting/multi-book', label: 'Multi-Book Accounting' },
        ],
      },
      {
        label: 'General Ledger',
        items: [
          { path: '/data/chart-of-accounts', label: 'Chart of Accounts', permission: 'gl:read' },
          { path: '/data/gl-upload', label: 'GL Upload', permission: 'import:read' },
          { path: '/data/gl-explorer', label: 'GL Explorer', permission: 'import:read' },
          { path: '/data/gl-trial-balance', label: 'Trial Balance', permission: 'import:read' },
          { path: '/data/gl-journals', label: 'Journals', permission: 'import:read' },
          {
            path: '/data/gl-account-analysis',
            label: 'Account Analysis',
            permission: 'import:read',
          },
          { path: '/data/gl-reporting', label: 'GL Reporting', permission: 'import:read' },
        ],
      },
      {
        label: 'Period Close',
        items: [{ path: '/periods/close', label: 'Period Close', permission: 'period:read' }],
      },
      {
        label: 'Revenue & Leases',
        items: [
          { path: '/lease/accounting', label: 'Lease Accounting' },
          { path: '/revenue/rev-rec', label: 'Revenue Recognition (ASC 606)' },
          { path: '/revenue/deferred', label: 'Deferred Revenue Schedule' },
          { path: '/lease', label: 'Lease Portfolio' },
        ],
      },
      {
        label: 'Tax',
        items: [
          { path: '/tax/provision', label: 'Tax Provision (ASC 740)' },
          { path: '/tax/transfer-pricing', label: 'Transfer Pricing' },
        ],
      },
    ],
  },
  {
    id: 'treasury',
    label: 'Treasury',
    icon: Wallet,
    groups: [
      {
        label: 'Cash & Debt',
        items: [
          { path: '/cash/forecast', label: 'Cash Forecast' },
          { path: '/cash/debt', label: 'Debt Schedule' },
          { path: '/cash/working-capital', label: 'Working Capital' },
        ],
      },
      {
        label: 'Currency',
        items: [
          { path: '/currency/fx-rates', label: 'Exchange Rates' },
          { path: '/currency/translation', label: 'Translation Results' },
          { path: '/currency/hedging', label: 'Hedge Management' },
        ],
      },
      {
        label: 'Investments',
        items: [
          { path: '/bonds/portfolio', label: 'Bond Portfolio' },
          { path: '/bonds/yield-curve', label: 'Yield Curve' },
          { path: '/credit/risk', label: 'Credit Risk' },
          { path: '/treasury/investments', label: 'Treasury Investments' },
          { path: '/treasury/fx-exposure', label: 'FX Exposure' },
          { path: '/treasury/loan-amortization', label: 'Loan Amortization' },
        ],
      },
    ],
  },
  {
    id: 'consolidation',
    label: 'Consolidation',
    icon: Layers,
    groups: [
      {
        label: null,
        items: [
          {
            path: '/consolidation/detail',
            label: 'Consolidation Detail',
            permission: 'entity:read',
          },
          {
            path: '/consolidation',
            label: 'Multi-Entity Consolidation',
            permission: 'entity:read',
          },
          {
            path: '/consolidation/ic-eliminations',
            label: 'Intercompany Eliminations',
            permission: 'entity:read',
          },
          { path: '/consolidation/ownership', label: 'Ownership Tree', permission: 'entity:read' },
        ],
      },
    ],
  },
  {
    id: 'industries',
    label: 'Industries',
    icon: Building2,
    groups: [
      { label: 'Agriculture', items: [{ path: '/sector/agriculture', label: 'Agriculture' }] },
      {
        label: 'Banking & Financial Services',
        items: [
          { path: '/banking/banking', label: 'Banking Overview' },
          { path: '/banking/reconciliation', label: 'Bank Reconciliation' },
          { path: '/banking/statements', label: 'Bank Statements' },
          { path: '/banking/nim', label: 'Net Interest Margin' },
          { path: '/banking/capital', label: 'Capital Adequacy' },
          { path: '/banking/loan-loss', label: 'Loan Loss Provisions' },
          { path: '/sector/banking', label: 'Banking', hidden: true },
        ],
      },
      {
        label: 'Construction',
        items: [
          { path: '/construction/dashboard', label: 'Construction Dashboard' },
          { path: '/construction/equipment', label: 'Equipment Tracking' },
          { path: '/construction/project', label: 'Project Tracking' },
          { path: '/sector/construction', label: 'Construction', hidden: true },
        ],
      },
      { label: 'Cross-Industry', items: [{ path: '/sector/sector', label: 'All Sectors' }] },
      {
        label: 'Education',
        items: [
          { path: '/sector/education', label: 'Education', hidden: true },
          { path: '/sectors/education', label: 'Education (legacy path)', hidden: true },
          { path: '/education', label: 'Education Overview' },
          { path: '/education/enrollment', label: 'Enrollment & Retention' },
          { path: '/education/research-grants', label: 'Research Grants' },
        ],
      },
      { label: 'Emissions', items: [{ path: '/sector/emissions', label: 'Emissions' }] },
      {
        label: 'Energy & Utilities',
        items: [
          { path: '/energy/sector', label: 'Energy Overview' },
          { path: '/energy/dashboard', label: 'Energy Dashboard' },
          { path: '/energy/production', label: 'Energy Production' },
          { path: '/energy/risk', label: 'Energy Risk' },
          { path: '/energy/renewable', label: 'Renewable Energy' },
          { path: '/energy/emissions', label: 'Emissions Trading' },
          { path: '/sector/energy', label: 'Energy', hidden: true },
        ],
      },
      { label: 'Equipment Finance', items: [{ path: '/sector/equipment', label: 'Equipment' }] },
      {
        label: 'ESG & Sustainability',
        items: [
          { path: '/esg/overview', label: 'ESG Overview' },
          { path: '/esg/carbon', label: 'Carbon Footprint' },
          { path: '/esg/csrd', label: 'CSRD Report' },
        ],
      },
      {
        label: 'Government & Public Sector',
        items: [
          { path: '/sector/government', label: 'Government', hidden: true },
          { path: '/sectors/government', label: 'Government (legacy path)', hidden: true },
          { path: '/government', label: 'Government Overview' },
          { path: '/government/grants', label: 'Grants & Disbursement' },
          { path: '/government/procurement', label: 'Procurement Cycle' },
        ],
      },
      {
        label: 'Healthcare',
        items: [
          { path: '/healthcare/overview', label: 'Healthcare Overview' },
          { path: '/healthcare/value-based', label: 'Value-Based Care' },
          { path: '/healthcare/dashboard', label: 'Healthcare Dashboard' },
          { path: '/healthcare/revenue', label: 'Patient Revenue' },
          { path: '/healthcare/clinical-trials', label: 'Clinical Trial Costing' },
          { path: '/sector/healthcare', label: 'Healthcare', hidden: true },
        ],
      },
      { label: 'Hospitality', items: [{ path: '/sector/hospitality', label: 'Hospitality' }] },
      {
        label: 'Insurance',
        items: [
          { path: '/insurance/claims', label: 'Insurance Claims' },
          { path: '/insurance/dashboard', label: 'Insurance Dashboard' },
          { path: '/insurance/insurance', label: 'Insurance Overview' },
          { path: '/insurance/underwriting', label: 'Underwriting' },
          { path: '/sector/insurance', label: 'Insurance', hidden: true },
        ],
      },
      {
        label: 'Logistics & Transport',
        items: [
          { path: '/sector/logistics', label: 'Logistics', hidden: true },
          { path: '/sectors/logistics', label: 'Logistics (legacy path)', hidden: true },
          { path: '/logistics', label: 'Logistics Overview' },
          { path: '/logistics/fleet-cost', label: 'Fleet Cost' },
          { path: '/logistics/warehouse-cost', label: 'Warehouse Cost' },
        ],
      },
      {
        label: 'Manufacturing',
        items: [
          { path: '/manufacturing/overview', label: 'Manufacturing Overview' },
          { path: '/manufacturing/production', label: 'Production Dashboard' },
          { path: '/manufacturing/cogs', label: 'COGS Variance' },
          { path: '/manufacturing/inventory', label: 'Inventory' },
          { path: '/sector/manufacturing', label: 'Manufacturing', hidden: true },
        ],
      },
      {
        label: 'Real Estate',
        items: [
          { path: '/realestate/dashboard', label: 'Real Estate Dashboard' },
          { path: '/realestate/facility', label: 'Facility Management' },
          { path: '/realestate/portfolio', label: 'Portfolio' },
          { path: '/realestate/reit', label: 'REIT' },
          { path: '/realestate/valuation', label: 'Property Valuation' },
          { path: '/sector/real-estate', label: 'Real Estate', hidden: true },
        ],
      },
      {
        label: 'Retail & E-commerce',
        items: [
          { path: '/retail/dashboard', label: 'Retail Dashboard' },
          { path: '/retail/inventory', label: 'Inventory' },
          { path: '/retail/inventory-planning', label: 'Inventory Planning' },
          { path: '/retail/retail', label: 'Retail Overview' },
          { path: '/retail/performance', label: 'Store Performance' },
          { path: '/retail/stores', label: 'Store Dashboard' },
          { path: '/retail/promo', label: 'Promo Analysis' },
          { path: '/sector/retail', label: 'Retail', hidden: true },
        ],
      },
      {
        label: 'SaaS & Subscription',
        items: [
          { path: '/saas/churn-analysis', label: 'Churn Analysis' },
          { path: '/saas/overview', label: 'SaaS Overview' },
          { path: '/saas/arr', label: 'ARR Dashboard' },
          { path: '/saas/cohort', label: 'Cohort Analysis' },
          { path: '/saas/churn', label: 'Churn Dashboard' },
        ],
      },
      { label: 'Technology', items: [{ path: '/sector/technology', label: 'Technology' }] },
      {
        label: 'Telecom',
        items: [
          { path: '/sector/telecommunications', label: 'Telecommunications', hidden: true },
          { path: '/sectors/telecom', label: 'Telecom', hidden: true },
          { path: '/telecom', label: 'Telecom Overview' },
        ],
      },
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: Users,
    groups: [
      {
        label: null,
        items: [
          { path: '/collaboration/activity', label: 'Activity Feed', permission: 'collab:read' },
          { path: '/collaboration/shared', label: 'Shared With Me', permission: 'collab:read' },
          { path: '/collaboration/team', label: 'Team', permission: 'collab:read' },
          { path: '/collaboration', label: 'Collaboration', permission: 'collab:read' },
          { path: '/collaboration/approvals', label: 'Approval Queue', permission: 'collab:read' },
        ],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    groups: [
      {
        label: 'Access',
        items: [{ path: '/settings/users', label: 'User Management', permission: 'user:read' }],
      },
      {
        label: 'Configuration',
        items: [
          { path: '/settings/backup', label: 'Backup', permission: 'settings:read' },
          { path: '/settings/connectors', label: 'Connectors', permission: 'settings:read' },
          { path: '/settings/integrations', label: 'Integrations', permission: 'settings:read' },
          { path: '/settings/security', label: 'Security', permission: 'settings:read' },
          { path: '/settings', label: 'System Settings', permission: 'settings:read' },
        ],
      },
      {
        label: 'Platform',
        items: [
          { path: '/visual/atlas', label: 'Atlas Visual Baseline (Developer Harness)' },
          { path: '/admin/benchmarks', label: 'Benchmarks' },
          { path: '/admin/engines', label: 'Engine Catalog' },
          { path: '/admin/debug', label: 'Debug Console' },
          { path: '/plugins', label: 'Plugin Marketplace' },
        ],
      },
    ],
  },
];

/** Flat list of every manifest entry, in sidebar order. */
export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) =>
  section.groups.flatMap((group) => group.items)
);

/**
 * Longest-prefix match: the deepest manifest path that the current location
 * sits under. Prevents a parent ("/reports") lighting up while a child
 * ("/reports/segment") is open.
 */
export function isItemActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + '/');
}

/** The single most specific manifest item for a location, or undefined. */
export function findActiveItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const candidate of NAV_ITEMS) {
    if (!isItemActive(pathname, candidate.path)) continue;
    if (!best || candidate.path.length > best.path.length) best = candidate;
  }
  return best;
}

/** The section id owning a location, for auto-expanding the sidebar. */
export function findActiveSectionId(pathname: string): string | undefined {
  let best: { id: string; length: number } | undefined;
  for (const section of NAV_SECTIONS) {
    for (const group of section.groups) {
      for (const candidate of group.items) {
        if (!isItemActive(pathname, candidate.path)) continue;
        if (!best || candidate.path.length > best.length) {
          best = { id: section.id, length: candidate.path.length };
        }
      }
    }
  }
  return best?.id;
}
