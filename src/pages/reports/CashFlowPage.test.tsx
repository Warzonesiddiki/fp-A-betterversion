import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
}));

vi.mock('@/engines/CashEngine', () => ({
  CashEngine: {
    forecast13Week: vi.fn(() => []),
    calculateDSO: vi.fn(() => 0),
    calculateDPO: vi.fn(() => 0),
    calculateDIO: vi.fn(() => 0),
    calculateCCC: vi.fn(() => 0),
  },
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ count }: { count?: number }) => <div data-testid="skeleton">{count} skeletons</div>,
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Download: makeIcon(), DollarSign: makeIcon(), FileText: makeIcon(),
    Table: makeIcon(), TrendingUp: makeIcon(), TrendingDown: makeIcon(),
    ArrowRight: makeIcon(), ArrowUpRight: makeIcon(), ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
  };
});

import CashFlowPage from '@/pages/reports/CashFlowPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/cash-flow']}>
      <CashFlowPage />
    </MemoryRouter>
  );
}

describe('CashFlowPage smoke test', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Data/i)).toBeTruthy();
  });
});
