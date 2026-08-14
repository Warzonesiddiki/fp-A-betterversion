/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    isLoading: false,
    setEntries: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
  })),
}));

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => ({
    scenarios: [],
    selectedScenarioId: null,
    isLoading: false,
    createScenario: vi.fn(),
    deleteScenario: vi.fn(),
    updateScenario: vi.fn(),
    setScenarios: vi.fn(),
    setSelectedScenario: vi.fn(),
  })),
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    organization: { name: 'Test Org' },
    users: [],
    preferences: { activeSector: 'technology' },
    addUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    updatePreferences: vi.fn(),
  })),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '1', email: 'test@test.com', name: 'Test User', role: 'Admin' },
    isAuthenticated: true,
  })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    isLoading: false,
    setBudgets: vi.fn(),
    setActiveBudget: vi.fn(),
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
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

// ---------------------------------------------------------------------------
// Mock utils
// ---------------------------------------------------------------------------

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (n: number) => `$${n.toLocaleString()}`,
  formatNumber: (n: number) => n.toLocaleString(),
  formatCompactNumber: (n: number) => `${(n / 1000).toFixed(0)}K`,
}));

vi.mock('@/utils/backupRestore', () => ({
  BackupRestore: {
    exportBackup: vi.fn(),
    importBackup: vi.fn(() => ({ success: true, errors: [] })),
  },
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => {
  const stub = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-stub">{children}</div>
  );
  return {
    ResponsiveContainer: stub,
    BarChart: stub,
    Bar: () => null,
    LineChart: stub,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ReferenceLine: () => null,
    Cell: () => null,
  };
});

// ---------------------------------------------------------------------------
// Mock lucide-react
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Import pages AFTER mocks
// ---------------------------------------------------------------------------

import SectorPage from '@/pages/sector/SectorPage';
import ScenarioBuilderPage from '@/pages/scenarios/ScenarioBuilderPage';
import BackupRestorePage from '@/pages/settings/BackupRestorePage';
import IntegrationSettingsPage from '@/pages/settings/IntegrationSettingsPage';
import SecuritySettingsPage from '@/pages/settings/SecuritySettingsPage';
import UserManagementPage from '@/pages/settings/UserManagementPage';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPage(Page: React.ComponentType, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sector, Scenarios, Settings smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('SectorPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(SectorPage, '/sector');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
    it('shows empty state with no data', () => {
      renderPage(SectorPage, '/sector');
      expect(screen.getByText(/No Data/i)).toBeTruthy();
    });
  });

  describe('ScenarioBuilderPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ScenarioBuilderPage, '/scenarios/builder');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
    it('displays the page heading', () => {
      renderPage(ScenarioBuilderPage, '/scenarios/builder');
      expect(screen.getByText(/Scenario Builder/i)).toBeTruthy();
    });
  });

  describe('BackupRestorePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(BackupRestorePage, '/settings/backup');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
    it('displays the page heading', () => {
      renderPage(BackupRestorePage, '/settings/backup');
      expect(screen.getByText(/Backup & Restore/i)).toBeTruthy();
    });
  });

  describe('IntegrationSettingsPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(IntegrationSettingsPage, '/settings/integrations');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
    it('displays the page heading', () => {
      renderPage(IntegrationSettingsPage, '/settings/integrations');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Integrations/i);
    });
  });

  describe('SecuritySettingsPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(SecuritySettingsPage, '/settings/security');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
    it('displays the page heading', () => {
      renderPage(SecuritySettingsPage, '/settings/security');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Security Settings/i);
    });
  });

  describe('UserManagementPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(UserManagementPage, '/settings/users');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
    it('displays the page heading', () => {
      renderPage(UserManagementPage, '/settings/users');
      expect(screen.getByText(/User Management/i)).toBeTruthy();
    });
  });
});
