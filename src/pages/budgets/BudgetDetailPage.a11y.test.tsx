// =============================================================================
// BudgetDetailPage — axe-core a11y regression (matched-budget content states)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): budgetStore seeded with the matched
// budget + plan lines, glStore with the referenced accounts, authStore via
// actAs('Admin') so the Viewer guard stays out of the way. Only the AG Grid
// boundary is mocked (jsdom cannot host AG Grid); both real content branches
// are scanned — grid-editor chrome and the full line-item table. Bar:
// 0 critical, 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { axe } from 'jest-axe';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import { actAs } from '@/test/rbacFixtures';

vi.mock('@/components/ui/FinPlanGrid', () => ({
  FinPlanGrid: () => <div data-testid="finplan-grid">grid</div>,
}));

// The page pulls in EmptyState/ErrorState/Skeleton plus many inline icons;
// their imports resolve through the shared proxy lucide double (N-0001).
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import BudgetDetailPage from './BudgetDetailPage';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

/** Guards against a silent fallback to the empty/skeleton state. */
const expectRenderedRealContent = (container: HTMLElement, minElements: number) => {
  const elementCount = container.querySelectorAll('*').length;
  expect(
    elementCount,
    `expected populated content (>= ${minElements} elements) but rendered ${elementCount}`
  ).toBeGreaterThanOrEqual(minElements);
};

function renderDetailPage() {
  return render(
    <MemoryRouter initialEntries={['/budgets/b-1']}>
      <Routes>
        <Route path="/budgets/:id" element={<BudgetDetailPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function seedStores() {
  useBudgetStore.setState({
    budgets: [
      {
        id: 'b-1',
        name: 'FY2026 Operating Plan',
        fiscalYear: 2026,
        status: 'Draft',
        totalAmount: 4100,
      },
    ],
    activeBudgetId: null,
    lineItems: [
      {
        id: 'li-r0',
        budgetId: 'b-1',
        accountId: 'acct-rev',
        accountName: 'Revenue',
        accountCode: '4000',
        month: 0,
        amount: 1000,
        isLocked: false,
      },
      {
        id: 'li-r1',
        budgetId: 'b-1',
        accountId: 'acct-rev',
        accountName: 'Revenue',
        accountCode: '4000',
        month: 1,
        amount: 2000,
        isLocked: false,
      },
      {
        id: 'li-s0',
        budgetId: 'b-1',
        accountId: 'acct-sal',
        accountName: 'Salaries',
        accountCode: '6000',
        month: 0,
        amount: 500,
        isLocked: false,
      },
      {
        id: 'li-s1',
        budgetId: 'b-1',
        accountId: 'acct-sal',
        accountName: 'Salaries',
        accountCode: '6000',
        month: 1,
        amount: 600,
        isLocked: false,
      },
    ],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    selectedCellId: null,
  });
  useGLStore.setState({
    entries: [],
    accounts: [
      { id: 'acct-rev', name: 'Revenue', code: '4000' },
      { id: 'acct-sal', name: 'Salaries', code: '6000' },
    ],
    trialBalance: [],
    importError: null,
  });
}

describe('BudgetDetailPage a11y (axe-core)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actAs('Admin');
    seedStores();
  });

  it('renders no critical or serious violations in the grid-editor chrome state', async () => {
    const { container } = renderDetailPage();

    // Content branch is really on: budget header, view toggle, summary cards
    // and the (boundary-mocked) grid editor are mounted before the scan.
    expect(
      screen.getByRole('heading', { level: 1, name: /FY2026 Operating Plan/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('view-mode-grid')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('finplan-grid')).toBeInTheDocument();
    expect(screen.getByText(/Version History/i)).toBeInTheDocument();
    expect(screen.getByText(/Cell Locking/i)).toBeInTheDocument();
    expectRenderedRealContent(container, 50);

    expectNoCriticalOrSerious(await axe(container));
  });

  it('renders no critical or serious violations in the line-item table state', async () => {
    const { container } = renderDetailPage();

    fireEvent.click(screen.getByTestId('view-mode-table'));

    // Content branch is really on: the full line-item table with one row per
    // account group plus the totals footer.
    const table = screen.getByRole('table', { name: /Budget detail line items/i });
    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 2 groups + tfoot
    expect(screen.getByText('4000')).toBeInTheDocument();
    expect(screen.getByText('6000')).toBeInTheDocument();
    expectRenderedRealContent(container, 60);

    expectNoCriticalOrSerious(await axe(container));
  });
});
