import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// W-FAB remediation pins (phase0-exit amendment item 3).
// The dashboard once rendered hardcoded trend deltas (change={12.4} /
// change={2.1} → "+12.4% vs prior") and presented Net Revenue Retention /
// Quick Ratio as measured zeros (`metrics.nrr ?? 0`). These tests pin:
//   - deltas are DERIVED from monthly buckets of 41xx postings and only
//     shown when a prior month exists;
//   - not-derivable metrics render as disclosure copy, never as 0.
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    addEntries: vi.fn(),
    removeEntry: vi.fn(),
  })),
}));

vi.mock('@/engines/SaaSMetricsEngine', () => ({
  SaaSMetricsEngine: {
    calculateARR: vi.fn((mrr: number) => mrr * 12),
    calculateNRR: vi.fn(() => 0),
    calculateQuickRatio: vi.fn(() => 0),
  },
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title, value, change }: { title: string; value: number; change?: number }) => (
    <div data-testid="kpi-card" data-change={change === undefined ? 'none' : String(change)}>
      {title}:{value}
    </div>
  ),
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="chart-wrapper">
      {title}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

vi.mock('@/pages/_docs', () => ({ PAGE_HELP: {} }));

// lucide-react uses the global setup mock (EmptyState needs its full icon set).

import { render, screen } from '@/test/testUtils';
import ARRDashboard from '../ARRDashboard';

type MockEntry = {
  id: string;
  accountCode: string;
  accountName?: string;
  debit: number;
  credit: number;
  date: string;
  period?: string;
};

async function renderWithEntries(entries: MockEntry[]) {
  const { useGLStore } = await import('@/store/glStore');
  (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    entries,
    addEntries: vi.fn(),
    removeEntry: vi.fn(),
  });
  return render(<ARRDashboard />);
}

function mrrCard(): HTMLElement | undefined {
  return screen
    .getAllByTestId('kpi-card')
    .find((el) => el.textContent?.includes('Monthly Recurring Revenue'));
}

describe('ARRDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders honest empty state when no entries', async () => {
    await renderWithEntries([]);
    expect(screen.getByText(/no saas data found/i)).toBeDefined();
    expect(screen.getByText(/import gl data/i)).toBeDefined();
    expect(screen.getByText(/subscription revenue/i)).toBeDefined();
  });

  it('shows no fabricated "vs prior" delta when only one month is posted', async () => {
    await renderWithEntries([
      {
        id: '1',
        accountCode: '4100',
        debit: 0,
        credit: 100000,
        date: '2026-03-01',
        period: '2026-03',
      },
    ]);
    const card = mrrCard();
    expect(card).toBeDefined();
    // One month → no basis for a delta; none may be invented.
    expect(card!.getAttribute('data-change')).toBe('none');
  });

  it('derives the month-over-month delta from posted months instead of hardcoding it', async () => {
    await renderWithEntries([
      {
        id: '1',
        accountCode: '4100',
        debit: 0,
        credit: 100000,
        date: '2026-01-05',
        period: '2026-01',
      },
      {
        id: '2',
        accountCode: '4100',
        debit: 0,
        credit: 110000,
        date: '2026-02-05',
        period: '2026-02',
      },
    ]);
    const card = mrrCard();
    expect(card).toBeDefined();
    // Latest month 110000 vs prior 100000 → +10, computed from the ledger.
    expect(card!.getAttribute('data-change')).toBe('10');
    expect(card!.textContent).toContain('110000'); // latest posted month's revenue
  });

  it('never renders the removed hardcoded trend literals', async () => {
    await renderWithEntries([
      {
        id: '1',
        accountCode: '4100',
        debit: 0,
        credit: 50000,
        date: '2026-01-05',
        period: '2026-01',
      },
      {
        id: '2',
        accountCode: '4100',
        debit: 0,
        credit: 51000,
        date: '2026-02-05',
        period: '2026-02',
      },
    ]);
    const changes = screen.getAllByTestId('kpi-card').map((el) => el.getAttribute('data-change'));
    expect(changes).not.toContain('12.4');
    expect(changes).not.toContain('2.1');
  });

  it('discloses NRR and Quick Ratio instead of rendering them as measured zeros', async () => {
    await renderWithEntries([
      {
        id: '1',
        accountCode: '4100',
        debit: 0,
        credit: 90000,
        date: '2026-01-05',
        period: '2026-01',
      },
    ]);
    // Disclosure cards explain why the metric cannot be computed…
    expect(
      screen.getByText(/disclosed as unavailable rather than shown as a measured 0%/i)
    ).toBeTruthy();
    expect(screen.getByText(/not derivable from journal postings/i)).toBeTruthy();
    // …and neither metric appears as a numeric KPI card title.
    const kpiTitles = screen.getAllByTestId('kpi-card').map((el) => el.textContent ?? '');
    expect(kpiTitles.some((t) => t.includes('Net Revenue Retention'))).toBe(false);
    expect(kpiTitles.some((t) => t.includes('Quick Ratio'))).toBe(false);
  });
});
