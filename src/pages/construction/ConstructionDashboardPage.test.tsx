import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useConstructionStore } from '@/store/constructionStore';

vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
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
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import ConstructionDashboardPage from '@/pages/construction/ConstructionDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction/dashboard']}>
      <ConstructionDashboardPage />
    </MemoryRouter>
  );
}

describe('ConstructionDashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConstructionStore.setState({ costBreakdown: [], changeOrders: [], costLedger: [] });
  });

  afterEach(() => {
    useConstructionStore.setState({ costBreakdown: [], changeOrders: [], costLedger: [] });
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('empty-states honestly when nothing is recorded', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /No Construction Data/i })).toBeTruthy();
  });

  it('shows the dashboard header once cost data is recorded', () => {
    useConstructionStore.setState({
      costBreakdown: [{ name: 'Concrete', budget: 1000, actual: 900 }],
      changeOrders: [],
      costLedger: [],
    });
    renderPage();
    expect(screen.getByText('Construction Dashboard')).toBeTruthy();
  });
});
