import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CapexTracker from '../../capex/CapexTracker';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
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
  LineChart: () => <div />,
  Line: () => null,
  PieChart: () => <div />,
  Pie: () => null,
  Cell: () => null,
  ReferenceLine: () => null,
}));

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    Plus: mk(),
    Trash2: mk(),
    Edit2: mk(),
    Save: mk(),
    X: mk(),
    Download: mk(),
    DollarSign: mk(),
    TrendingUp: mk(),
    Calendar: mk(),
    AlertTriangle: mk(),
    ChevronDown: mk(),
    ChevronUp: mk(),
    Filter: mk(),
    Search: mk(),
    Building: mk(),
    Truck: mk(),
  };
});

describe('CapexTracker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders without crashing', () => {
    render(<CapexTracker />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
