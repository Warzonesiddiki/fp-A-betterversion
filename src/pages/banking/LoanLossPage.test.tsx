/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

vi.mock('@/engines', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
  BankingEngine: {
    calculateLoanLossStats: vi.fn(() => ({
      reserveBalance: 2500000,
      nplRatio: 1.8,
      coverageRatio: 125,
      netChargeOffs: 450000,
      trend: [1.9, 1.85, 1.8],
    })),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useTour', () => ({
  useTour: vi.fn(() => ({ runTour: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
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
    Percent: makeIcon(),
    AlertCircle: makeIcon(),
    Download: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="chart-wrapper">
      {title}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/DataGrid', () => ({
  DataGrid: () => <div data-testid="data-grid" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Import page AFTER mocks
// ---------------------------------------------------------------------------

import LoanLossPage from '@/pages/banking/LoanLossPage';
import { useGLStore } from '@/store/glStore';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoanLossPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <LoanLossPage />
      </MemoryRouter>
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays no-data state when entries are empty', () => {
    const { getByText } = render(
      <MemoryRouter>
        <LoanLossPage />
      </MemoryRouter>
    );
    expect(getByText(/No Loan Data/i)).toBeInTheDocument();
  });

  it('renders the charge-off feed disclosure when entries are posted', () => {
    // Real BankingEngine runs (only @/engines barrel is mocked): with a posted
    // loan the page must show the em-dash disclosure for netChargeOffs —
    // never a fabricated charge-off figure.
    vi.mocked(useGLStore).mockReturnValue({
      entries: [
        {
          id: 'gl-1',
          accountId: 'acct-1',
          accountCode: '1301',
          accountName: 'Gross Loans',
          period: '2026-01',
          periodName: 'Jan 2026',
          debit: 100000,
          credit: 0,
          netChange: 100000,
          date: '2026-01-15',
          amount: 100000,
          description: '',
          reference: 'ref-1',
          entityId: 'bank-1',
          currency: 'USD',
        },
      ],
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
    } as never);
    const { getByText } = render(
      <MemoryRouter>
        <LoanLossPage />
      </MemoryRouter>
    );
    expect(getByText(/loan-loss transaction feed/i)).toBeInTheDocument();
  });
});
