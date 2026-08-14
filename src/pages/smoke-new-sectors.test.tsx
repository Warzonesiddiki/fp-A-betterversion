/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToCSV: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
    exportToPDF: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi-value">{label}</div>,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <button {...props}>{children}</button>
  ),
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  Cell: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Mock docs
// ---------------------------------------------------------------------------

vi.mock('@/pages/_docs', () => ({
  PAGE_HELP: {},
}));

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import ManufacturingPage from '@/pages/manufacturing/ProductionDashboardPage';
import LogisticsPage from '@/pages/logistics/LogisticsPage';
import GovernmentPage from '@/pages/government/GovernmentPage';
import EducationPage from '@/pages/education/EducationPage';
import SectorPage from '@/pages/sector/SectorPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Smoke Tests — each page renders without crashing
// ---------------------------------------------------------------------------

describe('New Sector Page Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('ManufacturingPage (ProductionDashboardPage)', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ManufacturingPage, '/manufacturing', '/manufacturing');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the no-data state when entries are empty', () => {
      renderPage(ManufacturingPage, '/manufacturing', '/manufacturing');
      expect(screen.getByText(/No Production Data/i)).toBeInTheDocument();
    });
  });

  describe('LogisticsPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(LogisticsPage, '/logistics', '/logistics');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the no-data state when entries are empty', () => {
      renderPage(LogisticsPage, '/logistics', '/logistics');
      expect(screen.getByText(/No Logistics Data/i)).toBeInTheDocument();
    });
  });

  describe('GovernmentPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(GovernmentPage, '/government', '/government');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the no-data state when entries are empty', () => {
      renderPage(GovernmentPage, '/government', '/government');
      expect(screen.getByText(/No Government Data/i)).toBeInTheDocument();
    });
  });

  describe('EducationPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(EducationPage, '/education', '/education');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the no-data state when entries are empty', () => {
      renderPage(EducationPage, '/education', '/education');
      expect(screen.getByText(/No Education Data/i)).toBeInTheDocument();
    });
  });

  describe('SectorPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(SectorPage, '/sector', '/sector');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the no-data state when entries are empty', () => {
      renderPage(SectorPage, '/sector', '/sector');
      expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    });
  });
});
