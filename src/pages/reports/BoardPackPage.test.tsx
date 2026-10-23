import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(vi.fn((sel?: (s: unknown) => unknown) => { const state = { entries: [] }; return sel ? sel(state) : state; }), { getState: () => ({ entries: [] }) }),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn((sel?: (s: { budgets: never[] }) => unknown) => {
    const state = { budgets: [] as never[] };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
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
    Download: makeIcon(),
    DollarSign: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
    TrendingUp: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
  };
});

import BoardPackPage from '@/pages/reports/BoardPackPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/board-pack']}>
      <BoardPackPage />
    </MemoryRouter>
  );
}

describe('BoardPackPage smoke test', () => {
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
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Data/i)).toBeTruthy();
  });
});

describe('BoardPackPage missing-is-not-zero (PR #91)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('shows empty state (not $0) when no GL entries exist — missing is not zero', async () => {
    // Even if budgets exist, GL entries missing means report is null and
    // the page shows empty state, not $0 for expenses (missing-is-not-zero)
    const { useBudgetStore } = await import('@/store/budgetStore');
    vi.mocked(useBudgetStore).mockImplementation((sel?: (s: { budgets: { totalAmount: number }[] }) => unknown) => {
      const state = { budgets: [{ totalAmount: 10000 }] };
      return sel ? sel(state as never) : (state as never);
    });
    const { container } = renderPage();
    // Empty state, not a $0 total
    expect(container.textContent).toContain('No Data');
    expect(container.textContent).not.toContain('$0');
  });
});
