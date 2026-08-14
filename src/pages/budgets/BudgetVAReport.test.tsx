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

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    isLoading: false,
    error: null,
    fetchBudgets: vi.fn(),
    setActiveBudget: vi.fn(),
    addBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
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
    ArrowDownRight: makeIcon(),
    ArrowUpRight: makeIcon(),
    FileBarChart: makeIcon(),
    Filter: makeIcon(),
    TrendingDown: makeIcon(),
    TrendingUp: makeIcon(),
    DollarSign: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

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

vi.mock('@/components/ui/Select', () => ({
  Select: ({ placeholder }: { placeholder?: string }) => (
    <select data-testid="mock-select">
      <option>{placeholder || 'Select...'}</option>
    </select>
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

// ---------------------------------------------------------------------------
// Import page AFTER mocks
// ---------------------------------------------------------------------------

import BudgetVAReport from '@/pages/budgets/BudgetVAReport';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BudgetVAReport smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <BudgetVAReport />
      </MemoryRouter>
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays no-budget-selected state', () => {
    const { getByText } = render(
      <MemoryRouter>
        <BudgetVAReport />
      </MemoryRouter>
    );
    expect(getByText(/No Budget Selected/i)).toBeInTheDocument();
  });
});
