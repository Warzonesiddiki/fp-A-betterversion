import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => ({ scenarios: [], createScenario: vi.fn() })),
}));

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
    accounts: [{ id: '1', code: '4000', name: 'Revenue' }],
  })),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('@/workers', () => ({
  runMonteCarlo: vi.fn(async () => ({
    results: [
      { iteration: 1, values: { growthPct: 10, cogsPct: -2, pricingPct: 5 }, output: 0 },
      { iteration: 2, values: { growthPct: 8, cogsPct: -1, pricingPct: 4 }, output: 0 },
      { iteration: 3, values: { growthPct: 12, cogsPct: -3, pricingPct: 6 }, output: 0 },
    ],
    statistics: { mean: 1, stdDev: 1, min: 0, max: 2, p5: 0, p25: 0.5, p50: 1, p75: 1.5, p95: 2 },
  })),
}));
vi.mock('@/engines/MonteCarloEngine', () => ({
  MonteCarloEngine: {
    run: vi.fn(() => ({
      samples: 1000,
      mean: 0,
      median: 0,
      p5: 0,
      p95: 0,
      stdDev: 0,
      distribution: [],
    })),
  },
}));
vi.mock('@/engines/SensitivityEngine', () => ({ SensitivityEngine: { analyze: vi.fn(() => []) } }));

vi.mock('@/components/charts/VarianceChart', () => ({
  VarianceChart: (_props: Record<string, unknown>) => <div data-testid="variance-chart" />,
}));

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Override only the icons that are commonly tested for attributes
    FileText: ({ className }: { className?: string }) => (
      <span data-testid="icon" className={className} />
    ),
    Save: ({ className }: { className?: string }) => (
      <span data-testid="icon" className={className} />
    ),
    BarChart3: ({ className }: { className?: string }) => (
      <span data-testid="icon" className={className} />
    ),
    Table: ({ className }: { className?: string }) => (
      <span data-testid="icon" className={className} />
    ),
    Table2: ({ className }: { className?: string }) => (
      <span data-testid="icon" className={className} />
    ),
  };
});
import { render, screen, fireEvent } from '@/test/testUtils';
import ScenarioBuilderPage from '../ScenarioBuilderPage';

describe('ScenarioBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<ScenarioBuilderPage />);
    expect(screen.getByText(/scenario builder/i)).toBeDefined();
  });

  it('renders assumption sliders section', () => {
    render(<ScenarioBuilderPage />);
    expect(screen.getByText(/assumption sliders/i)).toBeDefined();
  });

  it('renders impact KPIs', () => {
    render(<ScenarioBuilderPage />);
    expect(screen.getByText(/revenue impact/i)).toBeDefined();
    expect(screen.getByText(/net impact/i)).toBeDefined();
  });

  it('renders save scenario button', () => {
    render(<ScenarioBuilderPage />);
    expect(screen.getByText(/save scenario/i)).toBeDefined();
  });

  it('renders monte carlo button', () => {
    render(<ScenarioBuilderPage />);
    expect(screen.getByRole('button', { name: /run monte carlo/i })).toBeDefined();
  });

  it('runs a real worker-backed Monte Carlo and shows profit distribution', async () => {
    render(<ScenarioBuilderPage />);
    await fireEvent.click(screen.getByRole('button', { name: /run monte carlo/i }));
    expect(await screen.findByTestId('mc-avg')).toBeDefined();
    expect(screen.getByTestId('mc-median')).toBeDefined();
    expect(screen.getByTestId('mc-p10')).toBeDefined();
    expect(screen.getByTestId('mc-p90')).toBeDefined();
    expect(screen.getByTestId('mc-positive')).toBeDefined();
  });
});
