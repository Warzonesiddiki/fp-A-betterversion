/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
  Download: makeIcon(),
  BarChart3: makeIcon(),
  DollarSign: makeIcon(),
  Users: makeIcon(),
  TrendingUp: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen } from '@/test/testUtils';
import CompModelingPage from '../CompModelingPage';

describe('CompModelingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<CompModelingPage />);
    expect(screen.getByText(/compensation modeling/i)).toBeDefined();
  });

  it('renders KPI cards', () => {
    render(<CompModelingPage />);
    expect(screen.getByText(/total headcount/i)).toBeDefined();
  });

  it('renders compensation level table', () => {
    render(<CompModelingPage />);
    expect(screen.getByText(/junior/i)).toBeDefined();
    expect(screen.getByText(/senior/i)).toBeDefined();
  });

  it('renders merit increase slider', () => {
    render(<CompModelingPage />);
    expect(screen.getByText(/merit/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders download button', () => {
    render(<CompModelingPage />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
