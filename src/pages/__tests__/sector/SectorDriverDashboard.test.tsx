import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectorDriverDashboard from '../../sector/SectorDriverDashboard';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ sector: 'technology' }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: () => <div data-testid="radar-chart" />,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  Legend: () => null,
  Tooltip: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: (sel?: (s: any) => any) => {
    const state = { entries: [], filters: {} };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: () => ({
    organization: { name: 'Test Org', sector: 'technology' },
  }),
}));

// Lucide icon components — render minimal SVG placeholders so DOM queries don't choke
vi.mock('lucide-react', () => ({
  TrendingUp: () => <svg />,
  DollarSign: () => <svg />,
  Activity: () => <svg />,
  BarChart3: () => <svg />,
  Target: () => <svg />,
  ArrowLeft: () => <svg />,
  RefreshCw: () => <svg />,
  Download: () => <svg />,
  AlertTriangle: () => <svg />,
  Sliders: () => <svg />,
  Info: () => <svg />,
}));

describe('SectorDriverDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing for the technology sector', () => {
    render(<SectorDriverDashboard sectorId="technology" />);
    // sector heading or content rendered
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
