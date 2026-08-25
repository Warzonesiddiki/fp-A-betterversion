import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// W-FAB remediation pins. This page previously fabricated a six-cohort
// retention matrix ("Jan 2026 … Jun 2026", arithmetic curves), invented
// cohort sizes (120 + ((i·37) % 80) − i·10) and derived its KPI cards from
// those inventions — including an "Avg Revenue / Cohort" with a hardcoded
// 250000 fallback and a Math.abs() money aggregate. It now renders zero
// numbers: cohorts require a customer-level subscription feed.
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));

import { render, screen } from '@/test/testUtils';
import CohortAnalysisPage from '../CohortAnalysisPage';

async function renderWithEntries(entries: unknown[]) {
  const { useGLStore } = await import('@/store/glStore');
  (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries });
  return render(<CohortAnalysisPage />);
}

const glEntry = {
  id: '1',
  accountId: 'a1',
  accountCode: '4100',
  accountName: 'Subscription Revenue',
  period: '2026-01',
  periodName: 'Jan 2026',
  debit: 0,
  credit: 100000,
  netChange: 100000,
  date: '2026-01-05',
  amount: 100000,
  description: '',
  reference: '',
};

describe('CohortAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an honest empty state (h1 + disclosure) when the GL is empty', async () => {
    await renderWithEntries([]);
    expect(screen.getByRole('heading', { level: 1, name: /cohort analysis/i })).toBeInTheDocument();
    expect(screen.getByText(/no saas data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
  });

  it('renders the page h1 when data is present', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.getByRole('heading', { level: 1, name: /cohort analysis/i })).toBeInTheDocument();
  });

  it('never renders the removed invented retention matrix or cohort months', async () => {
    await renderWithEntries([glEntry]);
    // No heatmap table may render (prose explaining what is missing is fine).
    expect(screen.queryByRole('table')).toBeNull();
    for (const month of ['Jan 2026', 'Feb 2026', 'Jun 2026']) {
      expect(screen.queryByText(month)).toBeNull();
    }
    expect(screen.queryByText('M0')).toBeNull();
  });

  it('never renders fabricated KPIs derived from the old demo datasets', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.queryByRole('heading', { name: /cohort size/i })).toBeNull();
    expect(screen.getByTestId('cohort-page').textContent).not.toContain('Total Customers');
    expect(screen.getByTestId('cohort-page').textContent).not.toContain('Avg Retention');
    expect(screen.getByTestId('cohort-page').textContent).not.toContain('Avg Churn');
    // The hardcoded revenue fallback must not appear either.
    expect(screen.queryByText('250,000')).toBeNull();
  });

  it('states what a cohort feed requires and routes to the derivable ARR view', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.getByText(/what a cohort view requires/i)).toBeInTheDocument();
    expect(screen.getAllByText(/acquisition month|first-bill/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /open arr dashboard/i })).toBeInTheDocument();
  });
});
