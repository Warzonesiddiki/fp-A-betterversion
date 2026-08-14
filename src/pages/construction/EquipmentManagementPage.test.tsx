import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  ConstructionEngine: {
    calculateStats: vi.fn(() => ({
      avgGrossMargin: 0,
      wipValue: 0,
      revenueYTD: 0,
      overUnderBilled: 0,
      totalBacklog: 0,
      billings: 0,
    })),
    getBacklogTrend: vi.fn(() => []),
    getProjectPortfolio: vi.fn(() => []),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import EquipmentManagementPage from '@/pages/construction/EquipmentManagementPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction/equipment']}>
      <EquipmentManagementPage />
    </MemoryRouter>
  );
}

describe('EquipmentManagementPage smoke test', () => {
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
  it('displays page heading', () => {
    renderPage();
    expect(screen.getByText('Equipment Management')).toBeTruthy();
  });
});
