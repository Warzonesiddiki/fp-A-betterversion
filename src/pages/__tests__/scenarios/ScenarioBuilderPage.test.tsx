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

// Hand-listing icons breaks the moment a page adds one: this file failed with
// `No "Layers" export is defined on the "lucide-react" mock` after the page's
// empty state started using <Layers>. The shared mock synthesises any icon.
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

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

  it('asks for a ledger when none is loaded', () => {
    // Session 015 gave this page an empty state: it no longer invents a
    // $48M / $28.8M / $14.4M base. With no GL entries the page IS the empty
    // state, so the page <h1> from PageHeader is not rendered. This assertion
    // previously passed only because the hand-listed lucide mock threw before
    // the empty state could render.
    render(<ScenarioBuilderPage />);
    expect(screen.getByText('No Scenario Builder Data')).toBeInTheDocument();
  });
});
