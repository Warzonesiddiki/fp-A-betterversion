import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartOfAccountsPage from '../../charts/ChartOfAccountsPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Treemap: () => <div data-testid="treemap" />,
  Tooltip: () => null,
}));

vi.mock('@/store/glStore', () => {
  const store = { accounts: [], entries: [] };
  const hook = Object.assign((selector?: (s: any) => any) => (selector ? selector(store) : store), {
    getState: () => store,
  });
  return { useGLStore: hook };
});

vi.mock('@/store/budgetStore', () => {
  const store = { budgets: [], lineItems: [] };
  const hook = Object.assign((selector?: (s: any) => any) => (selector ? selector(store) : store), {
    getState: () => store,
  });
  return { useBudgetStore: hook };
});

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    Plus: mk(),
    Search: mk(),
    Filter: mk(),
    Download: mk(),
    Upload: mk(),
    Edit2: mk(),
    Trash2: mk(),
    ChevronRight: mk(),
    ChevronDown: mk(),
    Folder: mk(),
    FileText: mk(),
    ArrowLeft: mk(),
    X: mk(),
    Check: mk(),
    AlertTriangle: mk(),
    Save: mk(),
    RefreshCw: mk(),
    Layers: mk(),
    Database: mk(),
    Tag: mk(),
    MoreVertical: mk(),
    Eye: mk(),
    EyeOff: mk(),
    BookOpen: mk(),
    List: mk(),
    Grid: mk(),
    BarChart3: mk(),
    PieChart: mk(),
    Activity: mk(),
    Copy: mk(),
    Link2: mk(),
  };
});

describe('ChartOfAccountsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders empty state with CTA when no data is imported', () => {
    render(<ChartOfAccountsPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /no chart of accounts data/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import gl data/i })).toBeInTheDocument();
  });
});
