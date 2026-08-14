import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const trialBalanceRows = [
  {
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Revenue',
    accountType: 'Revenue',
    beginningBalance: 0,
    debit: 0,
    credit: 100000,
    netChange: 100000,
    endingBalance: 100000,
  },
  {
    accountId: 'a2',
    accountCode: '1000',
    accountName: 'Cash',
    accountType: 'Asset',
    beginningBalance: 0,
    debit: 50000,
    credit: 0,
    netChange: 50000,
    endingBalance: 50000,
  },
];

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [{ id: '1' }],
    trialBalance: trialBalanceRows,
    isLoading: false,
    generateTrialBalance: vi.fn(),
  })),
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
    Scale: makeIcon(),
    RefreshCw: makeIcon(),
    Download: makeIcon(),
    Eye: makeIcon(),
    BarChart3: makeIcon(),
    ArrowUp: makeIcon(),
    ArrowDown: makeIcon(),
    ArrowUpDown: makeIcon(),
  };
});

import GLTrialBalancePage from '@/pages/data/GLTrialBalancePage';
import { useGLTrialBalanceStore } from '@/store/glTrialBalanceStore';
import { actAs } from '@/test/rbacFixtures';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/trial-balance']}>
      <GLTrialBalancePage />
    </MemoryRouter>
  );
}

describe('GLTrialBalancePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actAs('Admin');
    useGLTrialBalanceStore.getState().reset();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays Trial Balance heading', () => {
    renderPage();
    const heading = screen.getByRole('heading', { level: 1, name: /Trial Balance/i });
    expect(heading).toBeTruthy();
  });

  it('sorts rows by a clicked column header via glTrialBalanceStore', () => {
    // Regression test for the previously-orphaned glTrialBalanceStore: the
    // store had a fully working setSort/applySort implementation that no
    // page ever called. This asserts the page's column-header buttons
    // actually invoke it and the rendered row order changes.
    renderPage();

    // Initial unsorted order: Revenue (4000) then Cash (1000).
    const codeCellsBefore = screen.getAllByText(/^(4000|1000)$/);
    expect(codeCellsBefore).toHaveLength(2);
    expect(codeCellsBefore[0]?.textContent).toBe('4000');

    fireEvent.click(screen.getByRole('button', { name: /Sort by Code/i }));

    const codeCellsAfter = screen.getAllByText(/^(4000|1000)$/);
    expect(codeCellsAfter[0]?.textContent).toBe('1000');
  });
});
