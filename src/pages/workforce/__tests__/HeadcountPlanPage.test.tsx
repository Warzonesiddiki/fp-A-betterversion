import { describe, it, expect, vi, beforeEach } from 'vitest';

// Phase 10 decontamination: the page derives from ACTUAL workforce
// records, so the mock supplies real employees (the GL store is no
// longer consulted by this page).
vi.mock('@/store/workforceStore', () => ({
  useWorkforceStore: vi.fn((selector?: (s: { employees: unknown[] }) => unknown) => {
    const state = {
      employees: [
        {
          id: 'e1',
          name: 'A',
          department: 'Engineering',
          position: 'Engineer',
          salary: 100000,
          startDate: '2025-11-15',
          status: 'active',
        },
        {
          id: 'e2',
          name: 'B',
          department: 'Engineering',
          position: 'Engineer',
          salary: 120000,
          startDate: '2026-02-01',
          status: 'active',
        },
        {
          id: 'e3',
          name: 'C',
          department: 'Sales',
          position: 'Rep',
          salary: 80000,
          startDate: '2026-03-10',
          status: 'active',
        },
      ],
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToCSV: vi.fn(), exportToPDF: vi.fn() },
}));

vi.mock('@/components/charts/TreemapChart', () => ({
  TreemapChart: ({ data }: any) => <div data-testid="treemap-chart">{JSON.stringify(data)}</div>,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

vi.mock('lucide-react', () => ({
  Headphones: makeIcon(),
  Download: makeIcon(),
  FileText: makeIcon(),
  Table: makeIcon(),
  Users: makeIcon(),
  DollarSign: makeIcon(),
  TrendingDown: makeIcon(),
  ChevronUp: makeIcon(),
  ChevronDown: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen } from '@/test/testUtils';
import HeadcountPlanPage from '../HeadcountPlanPage';

describe('HeadcountPlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByText(/headcount plan/i).length).toBeGreaterThan(0);
  });

  it('renders KPI section', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByText(/total headcount/i).length).toBeGreaterThan(0);
  });

  it('renders department table', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByText(/department/i).length).toBeGreaterThan(0);
  });

  it('renders charts section', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders treemap chart', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getByTestId('treemap-chart')).toBeDefined();
  });

  it('shows ACTUAL department headcounts from employee records', () => {
    render(<HeadcountPlanPage />);
    const row = screen.getByRole('row', { name: /Engineering/ });
    expect(row.textContent).toContain('2');
    // The invented departments of the old page must never appear.
    expect(screen.queryByText('Marketing')).toBeNull();
  });

  it('renders export button', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getByLabelText(/export pdf/i)).toBeDefined();
    expect(screen.getByLabelText(/export excel/i)).toBeDefined();
  });
});
