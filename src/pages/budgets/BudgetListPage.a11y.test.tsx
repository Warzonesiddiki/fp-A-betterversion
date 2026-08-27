// =============================================================================
// BudgetListPage — axe-core a11y regression (populated list state)
// -----------------------------------------------------------------------------
// Real budgetStore seeded via merge-setState (never replace=true — that would
// detach the store's actions) so the CONTENT branch (filters toolbar + budget
// grid) renders. AICopilotPanel is stubbed like the sibling suites so jsdom
// never loads the real panel. Bar: 0 critical, 0 serious (UI-07).
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useBudgetStore, type Budget } from '@/store/budgetStore';
import { actAs } from '@/test/rbacFixtures';

vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-copilot-stub" />,
}));

import BudgetListPage from './BudgetListPage';

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

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b-1',
    name: 'FY2026 Operating Plan',
    fiscalYear: 2026,
    status: 'Draft',
    totalAmount: 120000,
    departments: ['Operations'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    items: [],
    ...overrides,
  };
}

describe('BudgetListPage a11y (axe-core, populated)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actAs('Admin');
    useBudgetStore.setState({
      budgets: [],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
      isSubmitting: false,
      lastChange: null,
      selectedCellId: null,
    });
  });

  it('renders no critical or serious violations with budgets in the list', async () => {
    useBudgetStore.setState({
      budgets: [
        makeBudget(),
        makeBudget({
          id: 'b-2',
          name: 'Marketing FY2026',
          status: 'InReview',
          createdAt: '2026-01-03T00:00:00Z',
          updatedAt: '2026-01-04T00:00:00Z',
        }),
      ],
    });
    const { container } = render(<BudgetListPage />);

    // Content branch is really on: the budgets grid with data rows mounted.
    expect(screen.getByRole('grid', { name: 'Budgets list' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 budgets
    expectRenderedRealContent(container, 40);
    expectNoCriticalOrSerious(await axe(container));
  });
});
