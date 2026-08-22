import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  EnergyEngine: {
    calculateStats: vi.fn(() => ({
      totalRevenue: 0,
      totalCapacity: 0,
      avgGrossMargin: 0,
      carbonIntensity: 0,
    })),
    getProductionBySource: vi.fn(() => []),
    getRevenueTrend: vi.fn(() => []),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import EmissionsTradingPage from '@/pages/energy/EmissionsTradingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/energy/emissions']}>
      <EmissionsTradingPage />
    </MemoryRouter>
  );
}

describe('EmissionsTradingPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays Emissions Trading heading', () => {
    renderPage();
    expect(screen.getByText('Emissions Trading')).toBeTruthy();
  });

  // =============================================================================
  // Empty-branch honesty (K17/K18): real energyStore now ships [] defaults
  // (post-1bea2f3a) and the GL mock is empty, so every KPI renders '—' with
  // its disclosure, no chart mounts, and both the compliance card and the
  // inventory section disclose instead of inventing positions.
  // =============================================================================
  it('empty store and GL render disclosures and mount no chart or table', () => {
    renderPage();

    // All four KPIs disclose absence.
    expect(screen.getByRole('region', { name: 'Recorded Assets' })).toHaveTextContent('—');
    expect(screen.getByRole('region', { name: 'Total Generation (window)' })).toHaveTextContent(
      '—'
    );
    expect(screen.getAllByText(/no assets recorded/i).length).toBeGreaterThan(0);
    // 'No generation on file' appears both as a KPI changeLabel and as the
    // trend card description, hence getAllByText.
    expect(screen.getAllByText(/no generation on file/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no GL imported/i)).toBeInTheDocument();

    // Generation chart: disclosure only — no ResponsiveContainer mount.
    expect(screen.getByText(/No generation trend recorded yet\./i)).toBeInTheDocument();
    expect(screen.queryByTestId('rc')).not.toBeInTheDocument();

    // Compliance card discloses the missing feed.
    expect(screen.getByText(/Allowance ledger and price feed required/i)).toBeInTheDocument();

    // Inventory section: disclosure copy, no DataTable mount.
    expect(
      screen.getByText(/No carbon allowance positions are recorded in this workspace\./i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });
});
