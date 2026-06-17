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

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
}));

vi.mock('@/engines/MultiCurrencyEngine', () => ({
  MultiCurrencyEngine: {
    calculateCrossRate: vi.fn(() => 1.0),
  },
}));

// ---------------------------------------------------------------------------
// Mock utils
// ---------------------------------------------------------------------------

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (n: number) => `$${n.toLocaleString()}`,
  formatNumber: (n: number) => n.toLocaleString(),
  formatCompactNumber: (n: number) => `${(n / 1000).toFixed(0)}K`,
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
    ComposedChart: stub,
    BarChart: stub,
    Bar: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    PieChart: stub,
    Pie: () => null,
    Cell: () => null,
    AreaChart: stub,
    Area: () => null,
    LineChart: stub,
  };
});

// ---------------------------------------------------------------------------
// Mock lucide-react
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    Search: makeIcon(),
    Info: makeIcon(),
    AlertTriangle: makeIcon(),
    Landmark: makeIcon(),
    Download: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
    Percent: makeIcon(),
    DollarSign: makeIcon(),
    TrendingUp: makeIcon(),
    TrendingDown: makeIcon(),
    ArrowLeftRight: makeIcon(),
    CheckCircle: makeIcon(),
    AlertCircle: makeIcon(),
    Clock: makeIcon(),
    Wifi: makeIcon(),
    Users: makeIcon(),
    Activity: makeIcon(),
    BarChart3: makeIcon(),
    Shield: makeIcon(),
    ShieldAlert: makeIcon(),
    Headphones: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Import pages AFTER mocks
// ---------------------------------------------------------------------------

import TaxProvisionPage from '@/pages/tax/TaxProvisionPage';
import TransferPricingPage from '@/pages/tax/TransferPricingPage';
import TelecomPage from '@/pages/telecom/TelecomPage';
import FXExposurePage from '@/pages/treasury/FXExposurePage';
import VarianceDashboardPage from '@/pages/variance/VarianceDashboardPage';
import CompModelingPage from '@/pages/workforce/CompModelingPage';
import HeadcountPlanPage from '@/pages/workforce/HeadcountPlanPage';
import PayrollForecastPage from '@/pages/workforce/PayrollForecastPage';

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
// Tests — Tax
// ---------------------------------------------------------------------------

describe('Tax pages smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('TaxProvisionPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(TaxProvisionPage, '/tax/provision');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(TaxProvisionPage, '/tax/provision');
      expect(screen.getByText(/No Data/i)).toBeTruthy();
    });
  });

  describe('TransferPricingPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(TransferPricingPage, '/tax/transfer-pricing');
      expect(container).toBeTruthy();
    });
    it('displays the page heading', () => {
      renderPage(TransferPricingPage, '/tax/transfer-pricing');
      expect(screen.getByText(/Transfer Pricing/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Telecom
// ---------------------------------------------------------------------------

describe('Telecom page smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('TelecomPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(TelecomPage, '/telecom');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(TelecomPage, '/telecom');
      expect(screen.getByText(/No Telecom Data/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Treasury
// ---------------------------------------------------------------------------

describe('Treasury page smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('FXExposurePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(FXExposurePage, '/treasury/fx-exposure');
      expect(container).toBeTruthy();
    });
    it('displays the page heading', () => {
      renderPage(FXExposurePage, '/treasury/fx-exposure');
      expect(screen.getByText(/FX Exposure/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Variance
// ---------------------------------------------------------------------------

describe('Variance page smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('VarianceDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(VarianceDashboardPage, '/variance');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(VarianceDashboardPage, '/variance');
      expect(screen.getByText(/No Data/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Workforce
// ---------------------------------------------------------------------------

describe('Workforce pages smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('CompModelingPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CompModelingPage, '/workforce/comp-modeling');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(CompModelingPage, '/workforce/comp-modeling');
      expect(screen.getByText(/No Compensation Data/i)).toBeTruthy();
    });
  });

  describe('HeadcountPlanPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(HeadcountPlanPage, '/workforce/headcount');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(HeadcountPlanPage, '/workforce/headcount');
      expect(screen.getByText(/No Data/i)).toBeTruthy();
    });
  });

  describe('PayrollForecastPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(PayrollForecastPage, '/workforce/payroll');
      expect(container).toBeTruthy();
    });
    it('displays the page heading', () => {
      renderPage(PayrollForecastPage, '/workforce/payroll');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Payroll Forecast/i);
    });
  });
});
