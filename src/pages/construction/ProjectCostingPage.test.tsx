import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/constructionStore', () => ({
  useConstructionStore: vi.fn(() => ({ costBreakdown: [], changeOrders: [], costLedger: [] })),
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
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
}));

import ProjectCostingPage from '@/pages/construction/ProjectCostingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction/costing']}>
      <ProjectCostingPage />
    </MemoryRouter>
  );
}

describe('ProjectCostingPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays Project Costing heading', () => {
    renderPage();
    expect(screen.getByText('Project Costing')).toBeTruthy();
  });
});
