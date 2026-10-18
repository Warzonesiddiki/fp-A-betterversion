import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: () => <div data-testid="scatter" />,
  Treemap: () => <div data-testid="treemap" />,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  RadialBarChart: ({ children }: any) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
}));

// Phase 10 decontamination: the page must derive from ACTUAL workforce
// records. The mock supplies real employees; the old invented LEVELS
// bands (Junior/Senior/...) must never appear.
vi.mock('@/store/workforceStore', () => ({
  useWorkforceStore: (selector?: (s: { employees: unknown[] }) => unknown) => {
    const state = {
      employees: [
        {
          id: 'e1',
          name: 'A',
          department: 'Eng',
          position: 'Engineer',
          salary: 100000,
          startDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'e2',
          name: 'B',
          department: 'Eng',
          position: 'Engineer',
          salary: 120000,
          startDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'e3',
          name: 'C',
          department: 'Design',
          position: 'Designer',
          salary: 80000,
          startDate: '2024-01-01',
          status: 'active',
        },
      ],
    };
    return selector ? selector(state) : state;
  },
}));

import { render, screen, within } from '@/test/testUtils';
import CompModelingPage from '../CompModelingPage';

describe('CompModelingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading and KPI cards', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByText(/compensation modeling/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/total headcount/i).length).toBeGreaterThan(0);
  });

  it('derives position rows from actual employees — no invented bands', () => {
    render(<CompModelingPage />);
    const engineerRow = screen.getByRole('row', { name: /Engineer/ });
    expect(within(engineerRow).getByText('2')).toBeTruthy(); // headcount
    expect(screen.getByRole('row', { name: /Designer/ })).toBeTruthy();
    expect(screen.queryByText('Junior')).toBeNull();
    expect(screen.queryByText('Principal')).toBeNull();
  });

  it('headcount KPI counts actual active employees', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('renders merit increase slider and charts', () => {
    const { container } = render(<CompModelingPage />);
    expect(container.querySelector('input[type="range"]')).toBeTruthy();
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });
});
