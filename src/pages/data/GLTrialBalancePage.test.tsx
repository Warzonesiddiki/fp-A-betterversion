import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Lane R5-c (W-A11Y-002 M5): hoisted-mutable store ref so specs can drive the
// page into its loading branch without re-importing modules. The trial-balance
// rows live inside the hoisted ref because the mocked hook consumes them.
const glState = vi.hoisted(() => ({
  value: {
    entries: [{ id: '1' }] as unknown[],
    trialBalance: [
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
    ] as unknown[],
    isLoading: false,
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    ...glState.value,
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
    glState.value.isLoading = false;
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

// W-A11Y-002 M5 announce-once (lane R5-c): the hoisted-mutable glStore ref
// flips isLoading; the skeleton must own exactly ONE polite status
// announcement with all bars aria-hidden.
describe('GLTrialBalancePage — loading branch announce-once', () => {
  beforeEach(() => {
    glState.value.isLoading = true;
  });

  it('hydrate skeleton announces exactly once via srLabel, bars decorative', () => {
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true');
    expect(statuses[0]).toHaveTextContent('Loading trial balance…');
    expect(statuses[0]).toHaveClass('sr-only');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('non-loading render exposes no skeleton status region', () => {
    glState.value.isLoading = false;
    renderPage();
    // The loaded page shows the real table; no loading announcement remains.
    expect(screen.queryByText('Loading trial balance…')).not.toBeInTheDocument();
  });
});
