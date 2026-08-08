import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BudgetDetailPage from '../../budgets/BudgetDetailPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'missing' }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: () => <div />,
  Pie: () => null,
  Cell: () => null,
  LineChart: () => <div />,
  Line: () => null,
}));

const emptyBudgetStore = {
  budgets: [],
  lineItems: [],
  getBudgetById: () => undefined,
  currentBudget: null,
  setCurrentBudget: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  approveBudget: vi.fn(),
  rejectBudget: vi.fn(),
  lockBudget: vi.fn(),
  unlockBudget: vi.fn(),
  submitForApproval: vi.fn(),
  addLineItem: vi.fn(),
  updateLineItem: vi.fn(),
  removeLineItem: vi.fn(),
  bulkUpdateLineItems: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  loadBudgets: vi.fn(),
  snapshots: [],
  historyIndex: -1,
  history: [],
  activeBudgetId: null,
  setActiveBudget: vi.fn(),
  submitBudget: vi.fn(),
  createSnapshot: vi.fn(),
  restoreSnapshot: vi.fn(),
};

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: Object.assign(
    (selector?: (s: any) => any) => (selector ? selector(emptyBudgetStore) : emptyBudgetStore),
    { getState: () => emptyBudgetStore }
  ),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign((selector?: (s: any) => any) =>
    selector ? selector({ accounts: [], entries: [] }) : { accounts: [], entries: [] }
  ),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', role: 'Admin', email: 'a@b.c' },
  }),
}));

vi.mock('@/components/ui/FinPlanGrid', () => ({
  FinPlanGrid: () => <div data-testid="finplan-grid" />,
}));

vi.mock('lucide-react', () => {
  const make = () => () => <svg />;
  return {
    ArrowLeft: make(),
    Plus: make(),
    Trash2: make(),
    Undo2: make(),
    Redo2: make(),
    Lock: make(),
    Unlock: make(),
    Send: make(),
    History: make(),
    CheckCircle: make(),
    XCircle: make(),
    Clock: make(),
    Download: make(),
    Upload: make(),
    MoreVertical: make(),
    AlertTriangle: make(),
    MessageSquare: make(),
    Shield: make(),
    ChevronDown: make(),
    ChevronUp: make(),
    Users: make(),
    Save: make(),
    Camera: make(),
    Loader2: make(),
    X: make(),
    Edit3: make(),
    Eye: make(),
    List: make(),
    Grid3x3: make(),
    Calendar: make(),
    DollarSign: make(),
    Percent: make(),
    TrendingUp: make(),
    TrendingDown: make(),
  };
});

describe('BudgetDetailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows Budget Not Found state when id does not match any budget', () => {
    render(<BudgetDetailPage />);
    expect(
      screen.getByRole('heading', { level: 2, name: /budget not found/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to budgets/i })).toBeInTheDocument();
  });
});
