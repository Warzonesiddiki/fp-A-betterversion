import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// W-FAB remediation pins. This page previously rendered three invented
// datasets (MONTHLY_CHURN percentages, SEGMENT_CHURN with 'Enterprise' /
// 'Mid-Market' rows, and AT_RISK customers including literal 'Acme Corp')
// plus five KPIs computed from them, and exported the invented customers to
// Excel. It now renders zero numbers: churn metrics need a customer-level
// feed the GL cannot provide.
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

import { render, screen } from '@/test/testUtils';
import ChurnDashboard from '../ChurnDashboard';

async function renderWithEntries(entries: unknown[]) {
  const { useGLStore } = await import('@/store/glStore');
  (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries });
  return render(<ChurnDashboard />);
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

describe('ChurnDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an honest empty state (h1 + disclosure) when the GL is empty', async () => {
    await renderWithEntries([]);
    expect(screen.getByRole('heading', { level: 1, name: /churn dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/no saas data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
  });

  it('renders the page h1 when data is present', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.getByRole('heading', { level: 1, name: /churn dashboard/i })).toBeInTheDocument();
  });

  it('never renders the removed fabricated customer records', async () => {
    await renderWithEntries([glEntry]);
    for (const invented of [
      'Acme Corp',
      'TechStart Inc',
      'GlobalRetail',
      'DataFlow Ltd',
      'CloudFirst',
    ]) {
      expect(screen.queryByText(invented)).toBeNull();
    }
    // No at-risk data table (the disclosure list may explain what is missing,
    // but no table column or record may render).
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('columnheader', { name: /risk score/i })).toBeNull();
    expect(screen.queryByText(/14 days ago/i)).toBeNull();
  });

  it('never renders fabricated churn percentages or segments', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.queryByText('2.4%')).toBeNull(); // MONTHLY_CHURN latest value
    expect(screen.queryByText(/churn by segment/i)).toBeNull();
    expect(screen.queryByText('Enterprise')).toBeNull();
    expect(screen.queryByText('Mid-Market')).toBeNull();
  });

  it('states what a churn feed must provide instead of showing numbers', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.getByText(/what each churn metric requires/i)).toBeInTheDocument();
    expect(screen.getByText(/subscription-management|support\/billing/i)).toBeTruthy();
  });

  it('routes to the one derivable signal (revenue-churn on ChurnAnalysisPage)', async () => {
    await renderWithEntries([glEntry]);
    expect(screen.getByRole('button', { name: /open revenue-churn signal/i })).toBeInTheDocument();
  });
});
