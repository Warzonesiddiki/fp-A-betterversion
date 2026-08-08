import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeaseDetailPage from '../../lease/LeaseDetailPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: undefined }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: () => <div />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: () => <div />,
  Bar: () => null,
  AreaChart: () => <div />,
  Area: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
  Pie: () => null,
  PieChart: () => <div />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi">{label}</div>,
}));

vi.mock('@/components/lease/LeaseForm', () => ({
  LeaseForm: () => <div data-testid="lease-form" />,
}));

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    Download: mk(),
    FileText: mk(),
    Calendar: mk(),
    DollarSign: mk(),
    Percent: mk(),
    ArrowLeft: mk(),
    Plus: mk(),
    Pencil: mk(),
    Trash2: mk(),
    X: mk(),
    Save: mk(),
    ChevronDown: mk(),
    ChevronUp: mk(),
    Edit2: mk(),
    Eye: mk(),
    AlertTriangle: mk(),
  };
});

const leaseStore = { leases: [] };
vi.mock('@/store/leaseStore', () => ({
  useLeaseStore: Object.assign((sel?: (s: any) => any) => (sel ? sel(leaseStore) : leaseStore), {
    getState: () => leaseStore,
  }),
}));

describe('LeaseDetailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders lease detail heading', () => {
    render(<LeaseDetailPage />);
    expect(
      screen.getAllByRole('heading', { level: 1, name: /lease detail/i }).length
    ).toBeGreaterThan(0);
  });
});
