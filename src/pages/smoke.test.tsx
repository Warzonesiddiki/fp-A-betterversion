/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock all stores used by the 10 page components
// ---------------------------------------------------------------------------

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    lineItems: [],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    history: [[]],
    historyIndex: 0,
    selectedCellId: null,
    submitBudget: vi.fn(),
    approveBudget: vi.fn(),
    rejectBudget: vi.fn(),
    deleteBudget: vi.fn(),
    duplicateBudget: vi.fn(),
    setActiveBudget: vi.fn(),
    setBudgets: vi.fn(),
    addLineItem: vi.fn(),
    updateLineItem: vi.fn(),
    removeLineItem: vi.fn(),
    updateCell: vi.fn(),
    updateBudget: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
  })),
}));

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
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/store/forecastStore', () => ({
  useForecastStore: vi.fn(() => ({
    forecasts: [],
    drivers: [],
    selectedForecastId: null,
    isLoading: false,
    setForecasts: vi.fn(),
    createForecast: vi.fn(),
    updateForecast: vi.fn(),
    deleteForecast: vi.fn(),
    addDriver: vi.fn(),
    updateDriver: vi.fn(),
    removeDriver: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => ({
    scenarios: [],
    selectedScenarioId: null,
    comparedScenarioIds: [],
    isLoading: false,
    setScenarios: vi.fn(),
    setSelectedScenario: vi.fn(),
    createScenario: vi.fn(),
    updateScenario: vi.fn(),
    deleteScenario: vi.fn(),
  })),
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    organization: {
      name: 'Test Org',
      fiscalYear: 2026,
      fiscalYearStart: '2026-01-01',
      calendarType: 'Standard',
      baseCurrency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      decimalPlaces: 2,
    },
    users: [],
    roles: [],
    preferences: { activeSector: 'technology' },
    isLoading: false,
    updateOrganization: vi.fn(),
    updatePreferences: vi.fn(),
    addUser: vi.fn(),
    updateUser: vi.fn(),
    removeUser: vi.fn(),
  })),
}));

vi.mock('@/store/authStore', () => {
  const authState = {
    user: {
      id: 'u1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'd1',
      departmentName: 'Finance',
      entityId: 'e1',
      status: 'Active',
      lastLoginAt: '2026-01-01T00:00:00Z',
      mfaEnabled: false,
      permissions: [],
    },
    accessToken: 'mock-token',
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    mfaRequired: false,
    activeEntityId: 'e1',
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  };
  return {
    useAuthStore: vi.fn((selector?) => (selector ? selector(authState) : authState)),
  };
});

vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    reports: [],
    scheduledReports: [],
    activeReportId: null,
    isLoading: false,
    setReports: vi.fn(),
    setActiveReport: vi.fn(),
    createReport: vi.fn(),
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

vi.mock('@/store/tourStore', () => ({
  useTourStore: vi.fn(() => ({
    isActive: false,
    currentStepIndex: 0,
    steps: [],
    startTour: vi.fn(),
    stopTour: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useTour', () => ({
  useTour: vi.fn(() => ({
    runTour: vi.fn(),
    isActive: false,
    currentStepIndex: 0,
    steps: [],
    stopTour: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSector', () => ({
  useSector: vi.fn(() => ({
    activeSector: 'technology',
    sectorConfig: {
      id: 'technology',
      name: 'Technology',
      revenueDrivers: [],
      costDrivers: [],
      kpis: [],
    },
    setSector: vi.fn(),
    availableSectors: [],
  })),
}));

// ---------------------------------------------------------------------------
// Mock heavy child components to keep tests fast and avoid deep rendering
// ---------------------------------------------------------------------------

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/dashboard/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: () => <div data-testid="chart-wrapper" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: ({ open }: { open: boolean }) => (open ? <div data-testid="help-panel" /> : null),
}));

vi.mock('@/components/ui/DrillDownModal', () => ({
  DrillDownModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="drill-modal" /> : null,
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: () => <div data-testid="file-drop-zone" />,
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
}));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  // Explicitly define all icons used across the 10 page components.
  // Icons referenced at module scope (e.g. ReportsListPage) MUST be defined.
  return {
    LayoutDashboard: makeIcon(),
    TrendingUp: makeIcon(),
    BarChart3: makeIcon(),
    Upload: makeIcon(),
    Target: makeIcon(),
    HelpCircle: makeIcon(),
    Plus: makeIcon(),
    Search: makeIcon(),
    Copy: makeIcon(),
    Trash2: makeIcon(),
    Eye: makeIcon(),
    Send: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    ArrowLeft: makeIcon(),
    Undo2: makeIcon(),
    Redo2: makeIcon(),
    Lock: makeIcon(),
    History: makeIcon(),
    FlaskConical: makeIcon(),
    FileText: makeIcon(),
    DollarSign: makeIcon(),
    Layers: makeIcon(),
    Download: makeIcon(),
    Building2: makeIcon(),
    UserCog: makeIcon(),
    Database: makeIcon(),
    Settings2: makeIcon(),
    ShieldCheck: makeIcon(),
    LogIn: makeIcon(),
    EyeOff: makeIcon(),
    ArrowLeftRight: makeIcon(),
    CheckCircle2: makeIcon(),
    AlertTriangle: makeIcon(),
    Mail: makeIcon(),
    AlertCircle: makeIcon(),
    Loader2: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronUp: makeIcon(),
    Calculator: makeIcon(),
    Shield: makeIcon(),
    Keyboard: makeIcon(),
    BookOpen: makeIcon(),
    Table: makeIcon(),
    TableIcon: makeIcon(),
    X: makeIcon(),
    Menu: makeIcon(),
    PanelLeft: makeIcon(),
    Moon: makeIcon(),
    Sun: makeIcon(),
    Monitor: makeIcon(),
    Globe: makeIcon(),
    Building: makeIcon(),
    Calendar: makeIcon(),
    Hash: makeIcon(),
    Activity: makeIcon(),
    Sparkles: makeIcon(),
    Scale: makeIcon(),
    ShieldAlert: makeIcon(),
    TrendingDown: makeIcon(),
    Info: makeIcon(),
  };
});

vi.mock('@radix-ui/react-tabs', () => {
  const Root = ({
    children,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode }) => (
    <div data-testid="tabs-root" {...props}>
      {children}
    </div>
  );
  const List = ({
    children,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode }) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  );
  const Trigger = ({
    children,
    value,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode; value: string }) => (
    <button data-testid={`tab-trigger-${value}`} {...props}>
      {children}
    </button>
  );
  const Content = ({
    children,
    value,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`} {...props}>
      {children}
    </div>
  );
  return { Root, List, Trigger, Content };
});

vi.mock('@/utils/backupRestore', () => ({
  BackupRestore: {
    exportData: vi.fn(),
    importData: vi.fn(),
    clearAllData: vi.fn(),
  },
}));

vi.mock('@/pages/_docs', () => ({
  PAGE_HELP: {},
}));

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import BudgetListPage from '@/pages/budgets/BudgetListPage';
import BudgetDetailPage from '@/pages/budgets/BudgetDetailPage';
import ForecastListPage from '@/pages/forecasts/ForecastListPage';
import ScenarioListPage from '@/pages/scenarios/ScenarioListPage';
import ReportsListPage from '@/pages/reports/ReportsListPage';
import DashboardPage from '@/pages/DashboardPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import LoginPage from '@/pages/auth/LoginPage';
import DataImportPage from '@/pages/data/DataImportPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a page component inside MemoryRouter with Routes for navigation support. */
function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        {/* Catch-all for redirects */}
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Smoke Tests — each page renders without crashing
// ---------------------------------------------------------------------------

describe('Page Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('BudgetListPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(BudgetListPage, '/budgets', '/budgets');
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no budgets exist', () => {
      renderPage(BudgetListPage, '/budgets', '/budgets');
      expect(screen.getByText(/No Budgets Yet/i)).toBeInTheDocument();
    });
  });

  describe('BudgetDetailPage', () => {
    it('renders without crashing when budget is not found', () => {
      const { container } = renderPage(BudgetDetailPage, '/budgets/nonexistent', '/budgets/:id');
      expect(container).toBeTruthy();
    });

    it('displays not found message for missing budget', () => {
      renderPage(BudgetDetailPage, '/budgets/nonexistent', '/budgets/:id');
      expect(screen.getByText(/Budget not found/i)).toBeInTheDocument();
    });
  });

  describe('ForecastListPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ForecastListPage, '/forecasts', '/forecasts');
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no forecasts exist', () => {
      renderPage(ForecastListPage, '/forecasts', '/forecasts');
      expect(screen.getByText(/No Forecasts Yet/i)).toBeInTheDocument();
    });
  });

  describe('ScenarioListPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ScenarioListPage, '/scenarios', '/scenarios');
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no scenarios exist', () => {
      renderPage(ScenarioListPage, '/scenarios', '/scenarios');
      expect(screen.getByText(/No Scenarios Yet/i)).toBeInTheDocument();
    });
  });

  describe('ReportsListPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ReportsListPage, '/reports', '/reports');
      expect(container).toBeTruthy();
    });

    it('displays the reports heading', () => {
      renderPage(ReportsListPage, '/reports', '/reports');
      expect(screen.getByText(/Reports/i)).toBeInTheDocument();
    });
  });

  describe('DashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(DashboardPage, '/', '/');
      expect(container).toBeTruthy();
    });

    it('displays the finance-workspace setup state when no data exists', () => {
      renderPage(DashboardPage, '/', '/');
      expect(
        screen.getByRole('heading', { name: 'Set up your finance workspace' })
      ).toBeInTheDocument();
    });
  });

  describe('SettingsPage', () => {
    it('renders without crashing for admin user', () => {
      const { container } = renderPage(SettingsPage, '/settings', '/settings');
      expect(container).toBeTruthy();
    });

    it('displays the settings heading', () => {
      renderPage(SettingsPage, '/settings', '/settings');
      expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
    });
  });

  describe('LoginPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(LoginPage, '/login', '/login');
      expect(container).toBeTruthy();
    });

    it('displays the login form elements', () => {
      renderPage(LoginPage, '/login', '/login');
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
  });

  describe('DataImportPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(DataImportPage, '/data/import', '/data/import');
      expect(container).toBeTruthy();
    });

    it('displays the import heading', () => {
      renderPage(DataImportPage, '/data/import', '/data/import');
      expect(screen.getByText(/Data Import/i)).toBeInTheDocument();
    });
  });

  describe('AnalyticsPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(AnalyticsPage, '/analytics', '/analytics');
      expect(container).toBeTruthy();
    });

    it('displays the analytics heading', () => {
      renderPage(AnalyticsPage, '/analytics', '/analytics');
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    });
  });
});
