/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => ({ scenarios: [], createScenario: vi.fn() })),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], accounts: [] })),
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
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
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
  VarianceChart: (props: Record<string, unknown>) => <div data-testid="variance-chart" />,
}));

vi.mock('lucide-react', () => ({
  FileText: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Save: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  BarChart3: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Table2: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
}));

import { render, screen } from '@/test/testUtils';
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
    expect(screen.getByText(/run monte carlo/i)).toBeDefined();
  });
});
