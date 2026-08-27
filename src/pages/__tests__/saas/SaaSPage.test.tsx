// =============================================================================
// SaaSPage tests — engine-wired overview
// -----------------------------------------------------------------------------
// Real store idiom: `useGLStore` is seeded via setState (no store-module mocks).
// Every asserted figure must come out of the SaaSMetricsEngine pipeline:
//   MRR = posted 41xx subscription revenue
//   ARR = SaaSMetricsEngine.calculateARR(MRR) = MRR × 12
//   COGS = posted 5xxx hosting costs
//   Gross Margin = (Revenue - COGS) ÷ Revenue
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import SaaSPage from '../../saas/SaaSPage';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
    exportToCSV: vi.fn(),
  },
}));

function makeEntry(overrides: Partial<GLEntry> & Pick<GLEntry, 'id' | 'accountCode'>): GLEntry {
  return {
    accountId: overrides.id,
    accountName: overrides.accountCode,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

const mockEntries: GLEntry[] = [
  // 4100 Subscription Revenue (credit normal)
  makeEntry({
    id: '1',
    accountCode: '4100',
    accountName: 'SaaS Subscription Revenue',
    credit: 10000,
    amount: 10000,
    netChange: 10000,
    period: '2026-01',
  }),
  // 5100 Cloud Hosting (debit normal)
  makeEntry({
    id: '2',
    accountCode: '5100',
    accountName: 'Cloud Infrastructure AWS',
    debit: 2000,
    amount: 2000,
    netChange: 2000,
    period: '2026-01',
  }),
  // 6100 Sales & Marketing (debit normal)
  makeEntry({
    id: '3',
    accountCode: '6100',
    accountName: 'Sales & Marketing Expense',
    debit: 3000,
    amount: 3000,
    netChange: 3000,
    period: '2026-01',
  }),
];

describe('SaaSPage (engine-wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed by SaaSMetricsEngine and GL store', () => {
    render(<SaaSPage />);

    // MRR = 10,000; ARR = 10,000 * 12 = 120,000; COGS = 2,000; Gross Margin = (10k - 2k)/10k = 80.0%
    expect(screen.getByRole('region', { name: 'ARR (Annualized)' })).toHaveTextContent('$120,000');
    expect(screen.getByRole('region', { name: 'MRR (Posted)' })).toHaveTextContent('$10,000');
    expect(screen.getByRole('region', { name: 'COGS' })).toHaveTextContent('$2,000');
    expect(screen.getByRole('region', { name: 'Gross Margin' })).toHaveTextContent('80.0%');
  });

  it('renders cost breakdown section correctly', () => {
    render(<SaaSPage />);

    expect(screen.getByText('SaaS Cost Breakdown')).toBeInTheDocument();
    expect(screen.getByText(/Cloud Infrastructure AWS/)).toBeInTheDocument();
  });

  it('discloses that retention/cohort feeds are required rather than fabricated', () => {
    render(<SaaSPage />);

    expect(
      screen.getByText(/Cohort-based retention \(NRR, Gross Churn, Magic Number\)/)
    ).toBeInTheDocument();
  });

  it('exports a PDF report with SaaS KPIs and basis disclosures', async () => {
    const user = userEvent.setup();
    render(<SaaSPage />);

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]![0];
    expect(args.rows).toEqual(
      expect.arrayContaining([
        ['Annual Recurring Revenue (ARR)', '$120,000', 'MRR × 12 via SaaSMetricsEngine'],
        ['Monthly Recurring Revenue (MRR)', '$10,000', 'Latest posted month of 41xx revenue'],
        ['COGS', '$2,000', 'Posted 5xxx hosting/infrastructure costs'],
        ['Gross Margin', '80.0%', '(Revenue − COGS) ÷ Revenue'],
      ])
    );
  });

  it('exports SaaS metrics to Excel', async () => {
    const user = userEvent.setup();
    render(<SaaSPage />);

    await user.click(screen.getByRole('button', { name: /Export Excel/i }));

    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]![0];
    expect(args.headers).toEqual(['Category', 'Account / Metric', 'Amount']);
  });

  it('renders the empty state with CTA when no GL data exists', () => {
    useGLStore.setState({ entries: [] });
    render(<SaaSPage />);

    expect(screen.getByRole('main', { name: 'SaaS - No Data' })).toBeInTheDocument();
    expect(screen.getByText('No SaaS Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Import GL data to view SaaS metrics/i })
    ).toBeEnabled();
  });
});
