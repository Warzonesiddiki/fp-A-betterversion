/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// R18: the RBAC-denial matrix runs against the REAL budgetStore and REAL
// rbacEnforcer — no store stubbing here, or the PermissionError paths could
// never fire. State is driven through merge-setState (replace-mode would wipe
// the store's action implementations).
import { useBudgetStore, type Budget } from '@/store/budgetStore';
import { actAs, actAsRoleWithout } from '@/test/rbacFixtures';

// The page mounts AICopilotPanel unconditionally in its populated branch;
// stub it like the deep suite does so jsdom never loads the real panel.
vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-copilot-stub" />,
}));

// The page pulls in EmptyState/ErrorState/Skeleton, whose internal icon
// imports resolve through the shared proxy double — a hand-rolled fixed-name
// mock breaks at render time for icons it forgot to enumerate.
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import BudgetListPage from '@/pages/budgets/BudgetListPage';

function renderPage(initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<BudgetListPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b-1',
    name: 'Ops Budget',
    fiscalYear: 2026,
    status: 'Draft',
    totalAmount: 10,
    departments: ['Operations'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    items: [],
    ...overrides,
  };
}

function resetBudgetStore() {
  // Merge-setState: NEVER replace=true on a zustand store whose actions live
  // in state — replacing would detach submitBudget & co. from the component.
  useBudgetStore.setState({
    budgets: [],
    activeBudgetId: null,
    lineItems: [],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    selectedCellId: null,
  });
}

describe('BudgetListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBudgetStore();
    actAs('Admin');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders without crashing', () => {
    const { container } = renderPage('/budgets', '/budgets');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the empty state when no budgets exist', () => {
    renderPage('/budgets', '/budgets');
    expect(screen.getByText(/No Budgets Yet/i)).toBeInTheDocument();
  });

  it('keeps the page h1 mounted over a hydration skeleton instead of flashing the empty state', () => {
    useBudgetStore.setState({ budgets: [], isLoading: true });
    renderPage('/budgets', '/budgets');
    expect(screen.getByTestId('budget-list-loading')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /^Budgets$/ })).toBeInTheDocument();
    // No empty-state flash while hydrating, and no fabricated rows either.
    expect(screen.queryByText(/No Budgets Yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('renders the empty state as a shared EmptyState under the mounted h1 with a create CTA', () => {
    renderPage('/budgets', '/budgets');
    expect(screen.getByRole('heading', { level: 1, name: /^Budgets$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /No Budgets Yet/i })).toBeInTheDocument();
    expect(screen.getByTestId('budget-empty-create')).toHaveTextContent('Create Budget');
  });
});

// ---------------------------------------------------------------------------
// R18 — RBAC denial matrix (real roles, real enforce(), no stubs).
//
// Call-site permissions come straight from budgetStore.ts:
//   submitBudget / approveBudget / rejectBudget → 'budget:update'
//   duplicateBudget                             → 'budget:create'
//   deleteBudget                                → 'budget:delete'
// Each row withholds exactly ONE permission from Admin so the other four
// actions stay reachable — proving each denial is permission-specific.
//
// Per row: deny → shared ErrorState (role=alert) whose message names the
// exact permission and action → Dismiss clears → re-trigger denies again →
// elevate to full Admin via actAs('Admin') → Retry re-runs EXACTLY the
// failed action against the same seeded id and succeeds (asserted on real
// store state).
// ---------------------------------------------------------------------------

interface DenialRow {
  readonly action: string;
  /** Row-button accessible name that triggers the action. */
  readonly buttonName: string;
  readonly withheld: string;
  /** Action name embedded in the PermissionError message by rbacEnforcer. */
  readonly deniedAction: string;
  readonly deniedPermission: string;
  readonly seedStatus: 'Draft' | 'InReview';
  readonly expectedTitle: string;
  /** Store-level proof that the elevated retry actually succeeded. */
  readonly assertSuccess: () => void | Promise<void>;
}

const ROWS: readonly DenialRow[] = [
  {
    action: 'submit',
    buttonName: 'Submit budget for approval',
    withheld: 'budget:update',
    deniedAction: 'submitBudget',
    deniedPermission: 'budget:update',
    seedStatus: 'Draft',
    expectedTitle: 'Could not submit for approval',
    assertSuccess: async () => {
      // submitBudget resolves asynchronously (~1s in-store delay).
      await waitFor(() => expect(useBudgetStore.getState().budgets[0]?.status).toBe('InReview'));
    },
  },
  {
    action: 'approve',
    buttonName: 'Approve budget',
    withheld: 'budget:update',
    deniedAction: 'approveBudget',
    deniedPermission: 'budget:update',
    seedStatus: 'InReview',
    expectedTitle: 'Could not approve budget',
    assertSuccess: () => {
      expect(useBudgetStore.getState().budgets[0]?.status).toBe('Approved');
    },
  },
  {
    action: 'reject',
    buttonName: 'Reject budget',
    withheld: 'budget:update',
    deniedAction: 'rejectBudget',
    deniedPermission: 'budget:update',
    seedStatus: 'InReview',
    expectedTitle: 'Could not reject budget',
    assertSuccess: () => {
      expect(useBudgetStore.getState().budgets[0]?.status).toBe('Draft');
    },
  },
  {
    action: 'duplicate',
    buttonName: 'Duplicate budget',
    withheld: 'budget:create',
    deniedAction: 'duplicateBudget',
    deniedPermission: 'budget:create',
    seedStatus: 'Draft',
    expectedTitle: 'Could not duplicate budget',
    assertSuccess: () => {
      const budgets = useBudgetStore.getState().budgets;
      expect(budgets).toHaveLength(2);
      expect(budgets.some((b) => b.name.includes('(Copy)'))).toBe(true);
    },
  },
  {
    action: 'delete',
    buttonName: 'Delete budget',
    withheld: 'budget:delete',
    deniedAction: 'deleteBudget',
    deniedPermission: 'budget:delete',
    seedStatus: 'Draft',
    expectedTitle: 'Could not delete budget',
    assertSuccess: () => {
      expect(useBudgetStore.getState().budgets).toHaveLength(0);
    },
  },
];

async function triggerAction(user: ReturnType<typeof userEvent.setup>, row: DenialRow) {
  await user.click(screen.getByRole('button', { name: row.buttonName }));
  if (row.action === 'delete') {
    // The trash icon opens the confirm modal; the modal's Delete button is
    // what actually invokes the enforced store action.
    await user.click(screen.getByRole('button', { name: 'Delete' }));
  }
}

describe('BudgetListPage — RBAC denial matrix (R18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBudgetStore();
    actAs('Admin');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it.each(ROWS.map((r) => [r.action, r] as const))(
    '%s denial: ErrorState names the exact action+permission, Dismiss clears, elevated Retry succeeds',
    async (_name, row) => {
      const user = userEvent.setup();
      useBudgetStore.setState({ budgets: [makeBudget({ status: row.seedStatus })] });
      // Withhold ONLY this action's permission from an otherwise-full Admin;
      // identity stays constant so the denial is provably permission-specific.
      actAsRoleWithout('Admin', row.withheld);

      renderPage('/budgets', '/budgets');

      // 1) Denied attempt → shared ErrorState (role=alert) whose message
      //    names exactly the withheld permission and failed action.
      await triggerAction(user, row);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: row.expectedTitle })
      ).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`'${row.deniedPermission}'`))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`'${row.deniedAction}'`))).toBeInTheDocument();

      // 2) Dismiss clears the banner…
      await user.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // 3) …and the channel is still live: the same action denies again.
      await triggerAction(user, row);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // 4) Re-arm once more so there is an active banner to Retry; this third
      //    denial also proves elevation has NOT happened yet.
      await triggerAction(user, row);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      actAs('Admin');
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      // No further denial: the alert cleared because the retry was permitted,
      // and the real store state shows exactly that action's effect.
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await row.assertSuccess();

      // Idempotence guard for the async submit row: let its in-flight timer
      // settle so no after-test store write races the next test.
      if (row.action === 'submit') {
        await waitFor(() => expect(useBudgetStore.getState().isSubmitting).toBe(false));
      }
    },
    20000
  );
});
