import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        account: '4000',
        accountName: 'Revenue',
        amount: 100000,
        period: '2026-01',
        department: 'Sales',
        type: 'revenue',
      },
      {
        id: '2',
        account: '5000',
        accountName: 'COGS',
        amount: 30000,
        period: '2026-01',
        department: 'COGS',
        type: 'expense',
      },
    ],
  })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn() },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  TrendingDown: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
}));

import { render, screen } from '@/test/testUtils';
import ChurnDashboard from '../ChurnDashboard';

describe('ChurnDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/churn dashboard/i)).toBeDefined();
  });

  it('renders customer churn KPI', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/customer churn/i)).toBeDefined();
  });

  it('renders revenue churn KPI', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/revenue churn/i)).toBeDefined();
  });

  it('renders at risk section', () => {
    render(<ChurnDashboard />);
    // There are multiple "At-Risk" texts (KPI labels + section title)
    expect(screen.getAllByText(/at[- ]risk/i).length).toBeGreaterThan(0);
  });

  it('renders charts', () => {
    render(<ChurnDashboard />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    const { container } = render(<ChurnDashboard />);
    // Download icon + text on the button
    const buttons = container.querySelectorAll('button');
    const hasExport = Array.from(buttons).some((b) => /export/i.test(b.textContent || ''));
    expect(hasExport).toBe(true);
  });
});
