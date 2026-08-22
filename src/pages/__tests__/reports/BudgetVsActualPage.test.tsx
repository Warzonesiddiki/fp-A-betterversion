import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BudgetVsActualPage from '../../reports/BudgetVsActualPage';

// Partial mock: spread the real module so every export resolves (incl.
// useNavigate, added by fa31c55f for K30 CTA wiring), then override the
// pieces the page reads while rendering OUTSIDE a <Router>.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
    useLocation: () => ({ search: '', state: {} }),
    useNavigate: vi.fn(),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const glStore = { entries: [], accounts: [] };
vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    (sel?: (s: any) => any) => (sel ? sel(glStore) : glStore),
    { getState: () => glStore },
  ),
}));

const budgetStore = {
  budgets: [],
  lineItems: [],
  activeBudgetId: null,
};
vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: Object.assign(
    (sel?: (s: any) => any) => (sel ? sel(budgetStore) : budgetStore),
    { getState: () => budgetStore },
  ),
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help" />,
}));

vi.mock('../../reports/components/BudgetVsActualHeader', () => ({
  BudgetVsActualHeader: () => <div data-testid="bva-header" />,
}));
vi.mock('../../reports/components/BudgetVsActualSummary', () => ({
  BudgetVsActualSummary: () => <div data-testid="bva-summary" />,
}));
vi.mock('../../reports/components/BudgetVsActualTable', () => ({
  BudgetVsActualTable: () => <div data-testid="bva-table" />,
}));

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    AlertCircle: mk(), Database: mk(), TrendingDown: mk(), AlertTriangle: mk(),
    ChevronDown: mk(), CheckCircle: mk(), Download: mk(), RefreshCw: mk(),
  };
});

describe('BudgetVsActualPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "no data yet" empty state with Import Data CTA', () => {
    render(<BudgetVsActualPage />);
    expect(screen.getByRole('heading', { level: 2, name: /no data yet/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import data/i })).toBeInTheDocument();
  });
});
