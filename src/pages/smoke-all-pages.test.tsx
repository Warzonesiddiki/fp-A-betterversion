/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Mock stores ────────────────────────────────────────────────────────────────
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
    setColumnMappings: vi.fn(),
    importData: vi.fn(),
  })),
}));
vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    lineItems: [],
    activeBudgetId: null,
    isLoading: false,
    error: null,
    setBudgets: vi.fn(),
    setActiveBudget: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));
vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => ({
    scenarios: [],
    selectedScenarioId: null,
    comparedScenarioIds: [],
    isLoading: false,
    error: null,
    setScenarios: vi.fn(),
    setSelectedScenario: vi.fn(),
    createScenario: vi.fn(),
    updateScenario: vi.fn(),
    deleteScenario: vi.fn(),
    toggleScenarioComparison: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));
vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    reports: [],
    scheduledReports: [],
    activeReportId: null,
    isLoading: false,
    error: null,
    setReports: vi.fn(),
    setActiveReport: vi.fn(),
    createReport: vi.fn(),
    deleteReport: vi.fn(),
    setScheduledReports: vi.fn(),
    addScheduledReport: vi.fn(),
    deleteScheduledReport: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));
vi.mock('@/store/forecastStore', () => ({
  useForecastStore: vi.fn(() => ({
    forecasts: [],
    activeForecastId: null,
    isLoading: false,
    setForecasts: vi.fn(),
    setActiveForecast: vi.fn(),
  })),
}));
vi.mock('@/store/entityStore', () => ({
  useEntityStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { entities: [], activeEntityId: null };
    return selector ? selector(state) : state;
  }),
}));
vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: vi.fn(() => ({
    comments: [],
    tasks: [],
    activityLog: [],
    isLoading: false,
    addComment: vi.fn(),
    addTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    addActivity: vi.fn(),
  })),
}));
vi.mock('@/store/varianceStore', () => ({
  useVarianceStore: vi.fn(() => ({
    analyses: [],
    isLoading: false,
    error: null,
    setAnalyses: vi.fn(),
    addAnalysis: vi.fn(),
    deleteAnalysis: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));
vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(() => ({
    drivers: [],
    isLoading: false,
    error: null,
    setDrivers: vi.fn(),
    addDriver: vi.fn(),
    updateDriver: vi.fn(),
    deleteDriver: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    tokenExpiry: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  })),
}));
vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    organization: { name: 'Test Org', baseCurrency: 'USD' },
    users: [],
    roles: [],
    preferences: { activeSector: 'technology', density: 'comfortable' },
    isLoading: false,
    error: null,
    updateOrganization: vi.fn(),
    setUsers: vi.fn(),
    addUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    setRoles: vi.fn(),
    updateRolePermissions: vi.fn(),
    updatePreferences: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));
vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    mobileSidebarOpen: false,
    closeMobileSidebar: vi.fn(),
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));
vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));
vi.mock('@/hooks/useSector', () => ({
  useSector: vi.fn(() => ({
    activeSector: 'technology',
    sectorConfig: {
      id: 'technology',
      name: 'Technology',
      defaultKPIs: [
        { id: 'revenue', label: 'Revenue', target: 1000000, format: 'currency' },
        { id: 'gross_margin', label: 'Gross Margin', target: 0.65, format: 'percent' },
        { id: 'net_income', label: 'Net Income', target: 200000, format: 'currency' },
        { id: 'expenses', label: 'Operating Expenses', target: 800000, format: 'currency' },
      ],
    },
    setSector: vi.fn(),
    availableSectors: [],
  })),
}));
vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  Area: () => null,
  Pie: () => null,
  Scatter: () => null,
  ScatterChart: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ZAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  ReferenceLine: () => null,
  Label: () => null,
  Treemap: () => null,
}));

// ── Smoke tests for all uncovered pages ────────────────────────────────────────

describe('Smoke: uncovered pages render without crashing', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  const pages: Array<{
    name: string;
    loader: () => Promise<Record<string, React.ComponentType<any>>>;
  }> = [
    // Sector pages
    { name: 'BankingDashboardPage', loader: () => import('./sector/BankingDashboardPage') },
    {
      name: 'ConstructionDashboardPage',
      loader: () => import('./sector/ConstructionDashboardPage'),
    },
    { name: 'EmissionsTradingPage', loader: () => import('./sector/EmissionsTradingPage') },
    { name: 'EnergyDashboardPage', loader: () => import('./sector/EnergyDashboardPage') },
    { name: 'EquipmentManagementPage', loader: () => import('./sector/EquipmentManagementPage') },
    { name: 'HealthcareDashboardPage', loader: () => import('./sector/HealthcareDashboardPage') },
    { name: 'InsuranceDashboardPage', loader: () => import('./sector/InsuranceDashboardPage') },
    { name: 'RealEstateDashboardPage', loader: () => import('./sector/RealEstateDashboardPage') },
    { name: 'SectorPage', loader: () => import('./sector/SectorPage') },
    // Retail
    { name: 'RetailDashboard', loader: () => import('./retail/RetailDashboard') },
    { name: 'StoreDashboardPage', loader: () => import('./retail/StoreDashboardPage') },
    { name: 'InventoryDashboard', loader: () => import('./retail/InventoryDashboard') },
    { name: 'InventoryPlanningPage', loader: () => import('./retail/InventoryPlanningPage') },
    { name: 'PromoAnalysisPage', loader: () => import('./retail/PromoAnalysisPage') },
    // SaaS
    { name: 'ARRDashboard', loader: () => import('./saas/ARRDashboard') },
    { name: 'ChurnDashboard', loader: () => import('./saas/ChurnDashboard') },
    { name: 'ChurnAnalysisPage', loader: () => import('./saas/ChurnAnalysisPage') },
    { name: 'CohortAnalysisPage', loader: () => import('./saas/CohortAnalysisPage') },
    // Tax/Treasury
    { name: 'TaxProvisionPage', loader: () => import('./tax/TaxProvisionPage') },
    { name: 'TransferPricingPage', loader: () => import('./tax/TransferPricingPage') },
    { name: 'FXExposurePage', loader: () => import('./treasury/FXExposurePage') },
    // Workforce
    { name: 'HeadcountPlanPage', loader: () => import('./workforce/HeadcountPlanPage') },
    { name: 'CompModelingPage', loader: () => import('./workforce/CompModelingPage') },
    { name: 'PayrollForecastPage', loader: () => import('./workforce/PayrollForecastPage') },
    // Settings
    { name: 'UserManagementPage', loader: () => import('./settings/UserManagementPage') },
    { name: 'SecuritySettingsPage', loader: () => import('./settings/SecuritySettingsPage') },
    { name: 'IntegrationSettingsPage', loader: () => import('./settings/IntegrationSettingsPage') },
    { name: 'BackupRestorePage', loader: () => import('./settings/BackupRestorePage') },
    { name: 'ConnectorSettingsPage', loader: () => import('./settings/ConnectorSettingsPage') },
    // Templates
    { name: 'TemplateGalleryPage', loader: () => import('./templates/TemplateGalleryPage') },
    { name: 'TemplatePreviewPage', loader: () => import('./templates/TemplatePreviewPage') },
    // Reports
    {
      name: 'ThreeStatementDashboardPage',
      loader: () => import('./reports/ThreeStatementDashboardPage'),
    },
    { name: 'ReportBookBuilder', loader: () => import('./reports/ReportBookBuilder') },
    { name: 'ReportScheduler', loader: () => import('./reports/ReportScheduler') },
    {
      name: 'ReportTemplateLibraryPage',
      loader: () => import('./reports/ReportTemplateLibraryPage'),
    },
    {
      name: 'FinancialStatementTemplates',
      loader: () => import('./reports/FinancialStatementTemplates'),
    },
    // Forecasts
    { name: 'RollingForecastPage', loader: () => import('./forecasts/RollingForecastPage') },
    { name: 'WhatIfPage', loader: () => import('./forecasts/WhatIfPage') },
    // Scenarios
    { name: 'ScenarioBuilderPage', loader: () => import('./scenarios/ScenarioBuilderPage') },
    // Charts
    { name: 'ChartShowcasePage', loader: () => import('./charts/ChartShowcasePage') },
    // Data
    { name: 'MigrationPage', loader: () => import('./data/MigrationPage') },
    // Variance
    { name: 'VarianceDashboardPage', loader: () => import('./variance/VarianceDashboardPage') },
    // Telecom
    { name: 'TelecomPage', loader: () => import('./telecom/TelecomPage') },
  ];

  for (const page of pages) {
    it(`renders ${page.name} without crashing`, async () => {
      const mod = await page.loader();
      const Component = mod.default ?? mod[page.name];
      const { container } = render(
        <MemoryRouter>
          <Component />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });
  }
});
