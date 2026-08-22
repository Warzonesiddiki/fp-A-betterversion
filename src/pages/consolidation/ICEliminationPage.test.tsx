// =============================================================================
// ICEliminationPage tests — K30 four-states
// -----------------------------------------------------------------------------
// Real engine, real stores (no store-module mocks): IntercompanyMatchingEngine
// is reset via its public clear() and seeded through its public API. Seeded
// amounts are TEST fixtures exercising the pipeline — they are never rendered
// by the page as demo data (the removed `mockPairs` fabrication must stay
// gone; see the K17/K18 regression guard below). authStore via actAs drives
// elimination attribution.
//
// Loading skeleton honesty: this page has NO hydrate/in-flight skeleton by
// design — every engine read/action is synchronous — so there is deliberately
// no skeleton test (same honesty test as ScenarioBuilderPage).
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/test/testUtils';
import ICEliminationPage from '@/pages/consolidation/ICEliminationPage';
import { actAs, signOut } from '@/test/rbacFixtures';
import {
  IntercompanyMatchingEngine,
  type ICTransaction,
} from '@/engines/IntercompanyMatchingEngine';

function makeTx(
  overrides: Partial<ICTransaction> & Pick<ICTransaction, 'id' | 'amount'>
): ICTransaction {
  return {
    fromEntity: 'ent-a',
    toEntity: 'ent-b',
    currency: 'USD',
    accountCode: '1100',
    description: 'Intercompany loan leg',
    date: '2026-08-01',
    status: 'pending',
    ...overrides,
  };
}

/** A mirrored pending pair (same account, opposite direction, equal amount). */
function mirroredPair(): ICTransaction[] {
  return [
    makeTx({ id: 'd1', amount: 800 }),
    makeTx({ id: 'c1', fromEntity: 'ent-b', toEntity: 'ent-a', amount: 800 }),
  ];
}

beforeEach(() => {
  IntercompanyMatchingEngine.clear();
  signOut();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ICEliminationPage', () => {
  it('renders reconciliation content from real engine transactions (content state)', () => {
    IntercompanyMatchingEngine.addTransactions([
      ...mirroredPair(),
      makeTx({ id: 'd2', amount: 1500 }),
      makeTx({ id: 'c2', fromEntity: 'ent-c', toEntity: 'ent-a', amount: 1490 }),
    ]);
    render(<ICEliminationPage />);
    expect(
      screen.getByRole('heading', { name: /intercompany elimination/i, level: 1 })
    ).toBeInTheDocument();
    const table = screen.getByTestId('ic-pairs-table');
    expect(within(table).getAllByRole('row')).toHaveLength(5); // header + 4 legs
    // Amounts come from the seeded transactions, formatted at display layer.
    expect(screen.getByText(/1,500\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1,490\.00/)).toBeInTheDocument();
    const kpis = within(screen.getByTestId('ic-kpis'));
    expect(kpis.getByText(/total pairs/i).nextElementSibling).toHaveTextContent('4');
    expect(kpis.getByText(/unmatched/i).nextElementSibling).toHaveTextContent('4');
  });

  it('K30: empty engine renders the shared EmptyState under the page h1 — no fabricated pairs', () => {
    render(<ICEliminationPage />);
    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(
      screen.getByRole('heading', { name: /intercompany elimination/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/no intercompany transactions loaded/i)).toBeInTheDocument();
    expect(screen.getByTestId('ic-empty-recheck')).toBeInTheDocument();
    // K17/K18 regression guard: the removed mockPairs amounts must never return.
    expect(screen.queryByText(/50,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24,800/)).not.toBeInTheDocument();
    // Synchronous derivation: no loading skeleton is faked for the hydrate.
    expect(screen.queryByLabelText(/loading content/i)).not.toBeInTheDocument();
  });

  it('K30: empty-state CTA re-checks the engine and transitions to content once transactions exist', () => {
    render(<ICEliminationPage />);
    expect(screen.getByText(/no intercompany transactions loaded/i)).toBeInTheDocument();
    // Transactions arrive between renders (e.g. another surface importing them).
    IntercompanyMatchingEngine.addTransactions([makeTx({ id: 'tx-9', amount: 250 })]);
    fireEvent.click(screen.getByTestId('ic-empty-recheck'));
    expect(screen.queryByText(/no intercompany transactions loaded/i)).not.toBeInTheDocument();
    expect(screen.getByText(/250\.00/)).toBeInTheDocument();
  });

  it('Auto-Match flips mirrored pending legs to Matched via the real engine', () => {
    IntercompanyMatchingEngine.addTransactions(mirroredPair());
    render(<ICEliminationPage />);
    fireEvent.click(screen.getByTestId('ic-auto-match'));
    expect(within(screen.getByTestId('ic-pairs-table')).getAllByText('Matched')).toHaveLength(2);
    expect(IntercompanyMatchingEngine.getMatches()).toHaveLength(1);
  });

  it('Post Eliminations posts every matched pair and attributes entries to the signed-in user', () => {
    const admin = actAs('Admin');
    IntercompanyMatchingEngine.addTransactions(mirroredPair());
    render(<ICEliminationPage />);
    fireEvent.click(screen.getByTestId('ic-auto-match'));
    fireEvent.click(screen.getByTestId('ic-post-eliminations'));
    expect(within(screen.getByTestId('ic-pairs-table')).getAllByText('Eliminated')).toHaveLength(2);
    const [elim] = IntercompanyMatchingEngine.getEliminations();
    expect(elim?.createdBy).toBe(admin.id);
    expect(elim?.eliminationAmount).toBe(800);
    // Batch control disables once nothing is matched anymore.
    expect(screen.getByTestId('ic-post-eliminations')).toBeDisabled();
  });

  it('K30: failed action renders ErrorState (role=alert) whose retry succeeds', async () => {
    IntercompanyMatchingEngine.addTransactions(mirroredPair());
    const spy = vi.spyOn(IntercompanyMatchingEngine, 'autoMatch').mockImplementationOnce(() => {
      throw new Error('matching index unavailable');
    });
    render(<ICEliminationPage />);
    fireEvent.click(screen.getByTestId('ic-auto-match'));
    // h1 discipline holds in the error branch too.
    expect(
      screen.getByRole('heading', { name: /intercompany elimination/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/matching index unavailable/i);
    spy.mockRestore(); // the next call hits the real engine again
    fireEvent.click(screen.getByRole('button', { name: /retry auto-match/i }));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(IntercompanyMatchingEngine.getMatches()).toHaveLength(1);
  });
});
