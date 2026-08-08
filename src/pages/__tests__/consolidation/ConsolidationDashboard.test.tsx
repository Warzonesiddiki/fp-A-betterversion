import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConsolidationDashboard from '../../consolidation/ConsolidationDashboard';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Treemap: () => <div data-testid="treemap" />,
  Sankey: () => <div data-testid="sankey" />,
  Tooltip: () => null,
  BarChart: () => <div />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Cell: () => null,
  ReferenceLine: () => null,
  Pie: () => null,
  PieChart: () => <div />,
  Line: () => null,
  LineChart: () => <div />,
  Area: () => null,
  AreaChart: () => <div />,
  Layer: () => null,
  Rectangle: () => null,
}));

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    Plus: mk(),
    Trash2: mk(),
    Edit2: mk(),
    Save: mk(),
    X: mk(),
    Building2: mk(),
    Users: mk(),
    Globe: mk(),
    ChevronRight: mk(),
    ChevronDown: mk(),
  };
});

describe('ConsolidationDashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the consolidation dashboard heading', () => {
    render(<ConsolidationDashboard />);
    expect(screen.getByRole('heading', { level: 1, name: /consolidation/i })).toBeInTheDocument();
  });
});
