/**
 * Route Preloader — Lazy-load 140 pages with intelligent preloading
 * Only loads page code when user hovers/navigates, not at startup
 */

const routeImports: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/DashboardPage'),
  '/dashboard': () => import('../pages/DashboardPage'),
  '/budgets': () => import('../pages/budgets/BudgetListPage'),
  '/budgets/new': () => import('../pages/budgets/BudgetCreatePage'),
  '/budgets/:id': () => import('../pages/budgets/BudgetDetailPage'),
  '/budgets/va-report': () => import('../pages/budgets/BudgetVAReport'),
  '/forecasts': () => import('../pages/forecasts/ForecastListPage'),
  '/forecasts/builder': () => import('../pages/forecasts/ForecastBuilderPage'),
  '/forecasts/rolling': () => import('../pages/forecasts/RollingForecastPage'),
  '/forecasts/what-if': () => import('../pages/forecasts/WhatIfPage'),
  '/forecasts/drivers': () => import('../pages/forecasts/DriverPlanningPage'),
  '/scenarios': () => import('../pages/scenarios/ScenarioListPage'),
  '/scenarios/builder': () => import('../pages/scenarios/ScenarioBuilderPage'),
  '/reports': () => import('../pages/reports/ReportsListPage'),
  '/reports/pnl': () => import('../pages/reports/ProfitLossPage'),
  '/reports/balance-sheet': () => import('../pages/reports/BalanceSheetPage'),
  '/reports/cash-flow': () => import('../pages/reports/CashFlowPage'),
  '/reports/three-statement': () => import('../pages/reports/ThreeStatementDashboardPage'),
  '/reports/board-pack': () => import('../pages/reports/BoardPackPage'),
  '/reports/budget-vs-actual': () => import('../pages/reports/BudgetVsActualPage'),
  '/consolidation': () => import('../pages/consolidation/ConsolidationDashboard'),
  '/consolidation/ic-elimination': () => import('../pages/consolidation/ICEliminationPage'),
  '/consolidation/ownership': () => import('../pages/consolidation/OwnershipTreePage'),
  '/currency/fx-rates': () => import('../pages/currency/FXRatesPage'),
  '/currency/hedging': () => import('../pages/currency/HedgeManagementPage'),
  '/currency/translation': () => import('../pages/currency/TranslationResultPage'),
  '/data/import': () => import('../pages/data/DataImportPage'),
  '/data/chart-of-accounts': () => import('../pages/data/ChartOfAccountsPage'),
  '/data/gl-explorer': () => import('../pages/data/GLExplorerPage'),
  '/data/gl-journals': () => import('../pages/data/GLJournalsPage'),
  '/data/gl-trial-balance': () => import('../pages/data/GLTrialBalancePage'),
  '/data/gl-upload': () => import('../pages/data/GLUploadPage'),
  '/data/migration': () => import('../pages/data/MigrationPage'),
  '/data/version-diff': () => import('../pages/data/VersionDiffPage'),
  '/sector': () => import('../pages/sector/SectorPage'),
  '/sector/banking': () => import('../pages/banking/BankingDashboardPage'),
  '/sector/construction': () => import('../pages/construction/ConstructionDashboardPage'),
  '/sector/energy': () => import('../pages/energy/EnergyDashboardPage'),
  '/sector/healthcare': () => import('../pages/healthcare/HealthcareDashboardPage'),
  '/sector/insurance': () => import('../pages/insurance/InsuranceDashboardPage'),
  '/sector/real-estate': () => import('../pages/realestate/RealEstateDashboardPage'),
  '/sector/retail': () => import('../pages/retail/RetailDashboardPage'),
  '/templates': () => import('../pages/templates/TemplateGalleryPage'),
  '/templates/preview/:id': () => import('../pages/templates/TemplatePreviewPage'),
  '/charts': () => import('../pages/charts/ChartShowcasePage'),
  '/collaboration': () => import('../pages/collaboration/CollaborationPage'),
  '/collaboration/approvals': () => import('../pages/collaboration/ApprovalQueuePage'),
  '/audit': () => import('../pages/audit/AuditTrailPage'),
  '/audit/sox': () => import('../pages/audit/SOXCompliancePage'),
  '/settings': () => import('../pages/settings/SettingsPage'),
  '/settings/users': () => import('../pages/settings/UserManagementPage'),
  '/settings/security': () => import('../pages/settings/SecuritySettingsPage'),
  '/settings/integrations': () => import('../pages/settings/IntegrationSettingsPage'),
  '/settings/connectors': () => import('../pages/settings/ConnectorSettingsPage'),
  '/settings/backup': () => import('../pages/settings/BackupRestorePage'),
  '/analytics': () => import('../pages/analytics/AnalyticsPage'),
  '/analytics/benchmarking': () => import('../pages/analytics/BenchmarkingPage'),
  '/analytics/goal-seek': () => import('../pages/analytics/GoalSeekPage'),
  '/ai': () => import('../pages/ai/AIIntelligencePage'),
  '/help': () => import('../pages/HelpPage'),
  '/profile': () => import('../pages/ProfilePage'),
  '/login': () => import('../pages/auth/LoginPage'),
  '/register': () => import('../pages/auth/RegisterPage'),
  '/forgot-password': () => import('../pages/auth/ForgotPasswordPage'),
  '/onboarding': () => import('../pages/auth/OnboardingWizard'),
  '/setup': () => import('../pages/onboarding/SetupWizardPage'),
};

// Role-based preload priorities
const rolePreloads: Record<string, string[]> = {
  admin: ['/', '/budgets', '/reports', '/consolidation', '/settings', '/audit', '/forecasts'],
  cfo: [
    '/',
    '/reports/pnl',
    '/reports/balance-sheet',
    '/reports/three-statement',
    '/consolidation',
    '/forecasts',
  ],
  analyst: ['/', '/budgets', '/forecasts', '/scenarios', '/data/gl-explorer'],
  viewer: ['/', '/reports', '/reports/pnl', '/reports/balance-sheet'],
  controller: ['/', '/audit', '/audit/sox', '/data/gl-journals', '/reports'],
};

// Track what's been preloaded
const preloaded = new Set<string>();
const preloadPromises = new Map<string, Promise<unknown>>();

export class RoutePreloader {
  /**
   * Preload a route's code on hover/intent
   */
  static preload(route: string): void {
    if (preloaded.has(route)) return;

    const importFn = routeImports[route];
    if (!importFn) return;

    preloaded.add(route);
    const promise = importFn().catch(() => {
      preloaded.delete(route); // retry on failure
    });
    preloadPromises.set(route, promise);
  }

  /**
   * Preload top pages for a user role
   */
  static preloadForRole(role: string): void {
    const routes = rolePreloads[role] ?? rolePreloads.viewer;
    // Delay slightly so initial render isn't blocked
    setTimeout(() => {
      for (const route of routes) {
        this.preload(route);
      }
    }, 1000);
  }

  /**
   * Preload routes matching a prefix (e.g., on hover of sidebar item)
   */
  static preloadPrefix(prefix: string): void {
    for (const route of Object.keys(routeImports)) {
      if (route.startsWith(prefix)) {
        this.preload(route);
      }
    }
  }

  /**
   * Get the lazy import for a route (for use with React.lazy)
   */
  static getLazyComponent(route: string): (() => Promise<unknown>) | null {
    return routeImports[route] ?? null;
  }

  /**
   * Get all registered routes
   */
  static getRegisteredRoutes(): string[] {
    return Object.keys(routeImports);
  }

  /**
   * Check if a route has been preloaded
   */
  static isPreloaded(route: string): boolean {
    return preloaded.has(route);
  }

  /**
   * Get preload stats
   */
  static getStats(): { total: number; preloaded: number; pending: number } {
    return {
      total: Object.keys(routeImports).length,
      preloaded: preloaded.size,
      pending: preloadPromises.size - preloaded.size,
    };
  }
}

/**
 * Hook for preloading on hover
 */
export function useRoutePreload(route: string) {
  return {
    onMouseEnter: () => RoutePreloader.preload(route),
    onFocus: () => RoutePreloader.preload(route),
  };
}
