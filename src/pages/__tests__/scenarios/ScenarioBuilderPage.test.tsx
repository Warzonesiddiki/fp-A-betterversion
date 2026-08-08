import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScenarioBuilderPage from '../../scenarios/ScenarioBuilderPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/workers', () => ({
  runMonteCarlo: vi.fn().mockResolvedValue({ results: [] }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  LineChart: () => <div />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
  Pie: () => null,
  PieChart: () => <div />,
  Area: () => null,
  AreaChart: () => <div />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi">{label}</div>,
}));

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    FileText: mk(),
    Table: mk(),
    Save: mk(),
    Plus: mk(),
    Trash2: mk(),
    Download: mk(),
    Play: mk(),
    RefreshCw: mk(),
    ChevronDown: mk(),
  };
});

const scenarioStore = {
  scenarios: [],
  activeScenarioId: null,
};
vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: Object.assign(
    (sel?: (s: any) => any) => (sel ? sel(scenarioStore) : scenarioStore),
    { getState: () => scenarioStore }
  ),
}));

describe('ScenarioBuilderPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders scenario builder heading', () => {
    render(<ScenarioBuilderPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /scenario builder/i })
    ).toBeInTheDocument();
  });
});
