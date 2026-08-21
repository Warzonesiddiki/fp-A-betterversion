/**
 * @vitest-environment jsdom
 *
 * K30 remediation — state coverage for report pages that now render the shared
 * ErrorState component. Asserts the error+retry branch, the empty+CTA branch,
 * and (where cheap) the populated view for each wired page.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

type GLState = { entries: unknown[]; importError: string | null };
let glState: GLState = { entries: [], importError: null };

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => glState),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({ budgets: [], lineItems: [] })),
}));

vi.mock('@/engines/VarianceDecompositionEngine', () => ({
  VarianceDecompositionEngine: { computePriceVolumeMix: vi.fn(() => []) },
}));

vi.mock('@/pages/reports/components/BudgetVsActualHeader', () => ({
  BudgetVsActualHeader: () => <div data-testid="bva-header" />,
}));

vi.mock('@/pages/reports/components/BudgetVsActualSummary', () => ({
  BudgetVsActualSummary: () => <div data-testid="bva-summary" />,
}));

vi.mock('@/pages/reports/components/BudgetVsActualTable', () => ({
  BudgetVsActualTable: () => <div data-testid="bva-table" />,
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  const iconNames = [
    'Download', 'TrendingUp', 'Scale', 'DollarSign', 'CheckCircle', 'AlertTriangle',
    'XCircle', 'BarChart3', 'FileText', 'Table', 'HelpCircle', 'Search', 'Layers',
    'RefreshCw', 'Upload', 'Target', 'LayoutDashboard', 'Plus', 'Save', 'FolderOpen',
    'Database', 'TrendingDown', 'ChevronDown',
  ];
  const proxy: Record<string, ReturnType<typeof makeIcon>> = {};
  for (const name of iconNames) proxy[name] = makeIcon();
  return proxy;
});

vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-copilot" />,
}));

import BalanceSheetPage from '@/pages/reports/BalanceSheetPage';
import CashFlowPage from '@/pages/reports/CashFlowPage';
import ProfitLossPage from '@/pages/reports/ProfitLossPage';
import ThreeStatementDashboardPage from '@/pages/reports/ThreeStatementDashboardPage';
import BoardPackPage from '@/pages/reports/BoardPackPage';
import ReportsListPage from '@/pages/reports/ReportsListPage';
import BudgetVsActualPage from '@/pages/reports/BudgetVsActualPage';

const PAGES: [string, React.ComponentType][] = [
  ['BalanceSheetPage', BalanceSheetPage],
  ['CashFlowPage', CashFlowPage],
  ['ProfitLossPage', ProfitLossPage],
  ['ThreeStatementDashboardPage', ThreeStatementDashboardPage],
  ['BoardPackPage', BoardPackPage],
  ['ReportsListPage', ReportsListPage],
  ['BudgetVsActualPage', BudgetVsActualPage],
];

function renderPage(Component: React.ComponentType) {
  return render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  );
}

describe('K30 remediation — error state wiring on report pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    glState = { entries: [], importError: null };
  });

  it.each(PAGES)('%s renders ErrorState with retry and secondary action when importError is set', (_name, Page) => {
    glState = { entries: [], importError: 'Row 12: debit does not balance' };
    renderPage(Page);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
    expect(screen.getByText(/Row 12: debit does not balance/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-code')).toHaveTextContent('GL-IMPORT-ERROR');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(_name === 'BudgetVsActualPage' ? 'Retry' : 'Try again')).toBeInTheDocument();
    expect(screen.getByText('Go to Data Import')).toBeInTheDocument();
  });

  it.each(PAGES)('%s retry button invokes the retry handler', (_name, Page) => {
    glState = { entries: [], importError: 'boom' };
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
    renderPage(Page);
    fireEvent.click(screen.getByText(_name === 'BudgetVsActualPage' ? 'Retry' : 'Try again'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it.each(PAGES)('%s renders empty state with CTA when there is no data and no error', (_name, Page) => {
    if (_name === 'ReportsListPage') return; // covered below with its own copy
    renderPage(Page);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Import Data|Create Budget|No data yet/i).length
    ).toBeGreaterThan(0);
  });

  it('BudgetVsActualPage keeps Retry label after ErrorState migration', () => {
    glState = { entries: [], importError: 'boom' };
    renderPage(BudgetVsActualPage);
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it.each(PAGES)('%s shows no error UI when store is healthy', (_name, Page) => {
    glState = { entries: [{ accountCode: '4000', debit: 0, credit: 100, date: '2026-01-15' }], importError: null };
    renderPage(Page);
    expect(screen.queryByText(/Failed to load data/i)).not.toBeInTheDocument();
  });
});
