import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/educationStore', () => ({
  useEducationStore: vi.fn(() => ({
    kpis: [
      { id: 'enrollment', label: 'Total Enrollment', value: '38,700', change: 4.9 },
      { id: 'tuition', label: 'Tuition Revenue', value: '$485.0M', change: 3.2 },
    ],
  })),
}));
vi.mock('lucide-react', () => ({
  makeIcon: vi.fn(() => ({ className }: { className?: string }) => (
    <span data-testid="mock-icon" className={className} />
  )),
  GraduationCap: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
}));

import { render, screen } from '@/test/testUtils';
import { EducationDashboardPage } from '@/pages/sectors/EducationDashboardPage';

describe('sectors/EducationDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the education dashboard', () => {
    render(<EducationDashboardPage />);
    expect(screen.getByText(/Education Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Enrollment/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tuition Revenue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Operating Cost/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Financial Aid Disbursed/i)).toBeInTheDocument();
    expect(screen.getByText(/Research Funding/i)).toBeInTheDocument();
  });

  it('renders charts', () => {
    render(<EducationDashboardPage />);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
