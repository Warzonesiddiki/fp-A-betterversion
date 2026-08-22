// =============================================================================
// ScenarioBuilderPage tests — K30 four-states
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore entries drive the posted base,
// scenarioStore drives save. Only the Monte-Carlo worker boundary is mocked
// (it would otherwise spawn a real Web Worker per run).
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import ScenarioBuilderPage from '@/pages/scenarios/ScenarioBuilderPage';
import { actAs } from '@/test/rbacFixtures';
import { useScenarioStore } from '@/store/scenarioStore';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

vi.mock('@/workers', () => ({
  runMonteCarlo: vi.fn(),
}));

const { runMonteCarlo } = await import('@/workers');
const mcMock = vi.mocked(runMonteCarlo);

function makeEntry(overrides: Partial<GLEntry> & { id: string }): GLEntry {
  return {
    accountId: 'acct-1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-08',
    periodName: 'August 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-08-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

/**
 * Posted actuals for the base derivation (4xxx revenue credit-normal,
 * 5xxx COGS / 6xxx OpEx debit-normal): revenue 100,000 · COGS 40,000 ·
 * OpEx 30,000.
 */
function postedBaseEntries(): GLEntry[] {
  return [
    makeEntry({ id: 'r1', accountId: 'acct-r', accountCode: '4000', credit: 100000 }),
    makeEntry({ id: 'c1', accountId: 'acct-c', accountCode: '5000', debit: 40000 }),
    makeEntry({ id: 'o1', accountId: 'acct-o', accountCode: '6000', debit: 30000 }),
  ];
}

function mcResponse() {
  return {
    results: [
      { values: { growthPct: 12, pricingPct: 6, cogsPct: -3 } },
      { values: { growthPct: 8, pricingPct: 4, cogsPct: -1 } },
      { values: { growthPct: 10, pricingPct: 5, cogsPct: -2 } },
    ],
  };
}

/** Real store action, captured once so per-test overrides are restorable. */
const realCreateScenario = useScenarioStore.getState().createScenario;

function resetStores() {
  useGLStore.setState({ entries: [], trialBalance: [] });
  useScenarioStore.setState({
    scenarios: [],
    selectedScenarioId: null,
    comparedScenarioIds: [],
    isLoading: false,
    error: null,
    createScenario: realCreateScenario,
  });
  mcMock.mockReset();
}

beforeEach(() => {
  resetStores();
});

describe('ScenarioBuilderPage', () => {
  it('renders the builder from a posted GL base (content state)', () => {
    useGLStore.setState({ entries: postedBaseEntries() });
    render(<ScenarioBuilderPage />);
    expect(
      screen.getByRole('heading', { name: /scenario builder/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByTestId('scenario-kpis')).toBeInTheDocument();
    // Posted base, not an invented demo number.
    expect(screen.getByText(/revenue .*100,000/i)).toBeInTheDocument();
  });

  it('K30: empty ledger renders the shared EmptyState under the page h1 with an import CTA', () => {
    useGLStore.setState({ entries: [] });
    render(<ScenarioBuilderPage />);
    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(
      screen.getByRole('heading', { name: /scenario builder/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/no scenario builder data/i)).toBeInTheDocument();
    expect(screen.getByTestId('scenario-empty-import')).toBeInTheDocument();
  });

  it('K30: shows the in-flight skeleton region while a Monte Carlo run executes', async () => {
    useGLStore.setState({ entries: postedBaseEntries() });
    let release!: () => void;
    const gate = new Promise<typeof mcResponse>((resolve) => {
      release = resolve;
    });
    mcMock.mockReturnValue(gate);
    render(<ScenarioBuilderPage />);
    fireEvent.click(screen.getByTestId('run-monte-carlo'));
    expect(screen.getByTestId('scenario-mc-skeleton')).toBeInTheDocument();
    release(mcResponse());
    await waitFor(() => {
      expect(screen.getByTestId('mc-avg')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('scenario-mc-skeleton')).not.toBeInTheDocument();
  });

  it('K30: failed simulation renders ErrorState (role=alert) whose retry succeeds', async () => {
    useGLStore.setState({ entries: postedBaseEntries() });
    mcMock
      .mockRejectedValueOnce(new Error('worker pool saturated'))
      .mockResolvedValueOnce(mcResponse());
    render(<ScenarioBuilderPage />);
    fireEvent.click(screen.getByTestId('run-monte-carlo'));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/monte carlo simulation failed/i);
    expect(screen.getByText(/worker pool saturated/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry simulation/i }));
    await waitFor(() => {
      expect(screen.getByTestId('mc-avg')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mcMock).toHaveBeenCalledTimes(2);
  });

  it('K30: failed save renders ErrorState (role=alert) whose retry persists the scenario', async () => {
    actAs('Admin');
    useGLStore.setState({ entries: postedBaseEntries() });
    let failedOnce = false;
    useScenarioStore.setState({
      createScenario: ((...args: Parameters<typeof realCreateScenario>) => {
        if (!failedOnce) {
          failedOnce = true;
          throw new Error('disk full');
        }
        return realCreateScenario(...args);
      }) as typeof realCreateScenario,
    });
    render(<ScenarioBuilderPage />);
    fireEvent.click(screen.getByTestId('save-scenario'));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not save scenario/i);
    expect(screen.getByText(/disk full/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry save/i }));
    await waitFor(() => {
      expect(useScenarioStore.getState().scenarios).toHaveLength(1);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
