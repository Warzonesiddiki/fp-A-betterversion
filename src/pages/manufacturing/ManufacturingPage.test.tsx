// =============================================================================
// ManufacturingPage tests — engine-wired overview
// -----------------------------------------------------------------------------
// Real store idiom: `useGLStore` is seeded via setState (no store-module mock).
// Every asserted figure must come out of the ManufacturingEngine pipeline:
//   revenue   = Σ|amount| of 47xx postings
//   cogs      = Σ|amount| of 5xxx/6xxx postings
//   grossMargin = (revenue − cogs) ÷ revenue × 100
//   oee       = 85 + min(10, grossMargin ÷ 5), capped at 99 (disclosed)
//
// Regression guards pin the removed generic GL-reskin behavior and the honest
// absence of the engine's modelled production-line / output-trend figures.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import ManufacturingPage from './ManufacturingPage';
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
    period: 'P01',
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
  // Product revenue (47xx): credit-normal 100,000
  makeEntry({
    id: '1',
    accountCode: '4700',
    accountName: 'Product Revenue',
    credit: 100000,
    amount: 100000,
    netChange: 100000,
  }),
  // Raw materials (57xx): debit-normal 30,000
  makeEntry({
    id: '2',
    accountCode: '5700',
    accountName: 'Raw Materials',
    debit: 30000,
    amount: 30000,
    netChange: 30000,
  }),
  // Direct labor (58xx): debit-normal 20,000
  makeEntry({
    id: '3',
    accountCode: '5800',
    accountName: 'Direct Labor',
    debit: 20000,
    amount: 20000,
    netChange: 20000,
  }),
  // Manufacturing overhead (59xx): credit posting that reduces overhead —
  // netChange is negative (unfavorable-color row), amount abs still 10,000.
  makeEntry({
    id: '4',
    accountCode: '5900',
    accountName: 'Manufacturing Overhead',
    credit: 10000,
    amount: -10000,
    netChange: -10000,
  }),
];

describe('ManufacturingPage (engine-wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed by ManufacturingEngine.calculateStats', () => {
    render(<ManufacturingPage />);

    // revenue=100k; cogs=30k+20k+10k=60k; margin=(100k−60k)/100k=40%;
    // oee=85+min(10, 40÷5)=93.
    expect(screen.getByRole('region', { name: 'Revenue' })).toHaveTextContent('$100,000');
    expect(screen.getByRole('region', { name: 'COGS' })).toHaveTextContent('$60,000');
    expect(screen.getByRole('region', { name: 'Gross Margin' })).toHaveTextContent('40.0%');
    expect(screen.getByRole('region', { name: 'OEE' })).toHaveTextContent('93.0%');
  });

  it('discloses OEE as an engine derivation, not a shop-floor measurement', () => {
    render(<ManufacturingPage />);
    expect(screen.getByText(/not a shop-floor feed/i)).toBeInTheDocument();
  });

  it('renders the production cost structure with exact COGS shares', () => {
    render(<ManufacturingPage />);

    const materialsRow = screen.getByText(/Raw Materials \(57xx\)/).closest('li');
    expect(materialsRow).not.toBeNull();
    // materialCost share = 30,000 ÷ 60,000 = 50%; currency via useCurrencyFormatter
    expect(materialsRow).toHaveTextContent('$30,000.00');
    expect(materialsRow).toHaveTextContent('50.0% of COGS');
  });

  it('renders an honest empty state for the cost structure when no 57xx–59xx accounts posted', () => {
    useGLStore.setState({
      entries: [
        makeEntry({
          id: '9',
          accountCode: '4700',
          accountName: 'Product Revenue',
          credit: 1000,
          amount: 1000,
          netChange: 1000,
        }),
      ],
    });
    render(<ManufacturingPage />);
    expect(
      screen.getByText(/no production-cost accounts \(prefixes 57\/58\/59\) posted yet/i)
    ).toBeInTheDocument();
  });

  it('colors account net-change cells favorably/unfavorably (#16A34A / #DC2626)', () => {
    const { container } = render(<ManufacturingPage />);
    const overviewCard = container.querySelector('[aria-label="Account Overview"]');
    expect(overviewCard).not.toBeNull();
    const table = within(overviewCard as HTMLElement);

    // Positive net change → favorable green; negative → unfavorable red.
    expect(table.getByText('$100,000.00')).toHaveClass('text-[#16A34A]');
    expect(table.getByText('($10,000.00)')).toHaveClass('text-[#DC2626]');
  });

  it('does not render modelled production lines or output trends', () => {
    render(<ManufacturingPage />);

    // getProductionLines/getOutputTrend literals must stay absent until the
    // engine derives them from real production data.
    expect(screen.queryByText(/Line A/)).not.toBeInTheDocument();
    expect(screen.queryByText(/output trend/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/25,000/)).not.toBeInTheDocument();
  });

  it('exports a PDF report built from the engine stats', async () => {
    const user = userEvent.setup();
    render(<ManufacturingPage />);

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]![0];
    expect(args.headers).toEqual(['Metric', 'Value']);
    expect(args.rows).toEqual(
      expect.arrayContaining([
        ['Revenue', '$100,000'],
        ['COGS', '$60,000'],
        ['Gross Margin', '40.0%'],
        ['OEE (derived)', '93.0%'],
      ])
    );
  });

  it('exports the cost structure to Excel', async () => {
    const user = userEvent.setup();
    render(<ManufacturingPage />);

    await user.click(screen.getByRole('button', { name: /Export Excel/i }));

    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]![0];
    expect(args.rows).toHaveLength(3);
    expect(args.rows[0]).toEqual(['Raw Materials (57xx)', 30000, '50.0% of COGS']);
  });

  it('keeps the empty state with the real import CTA when no GL data exists', () => {
    useGLStore.setState({ entries: [] });
    render(<ManufacturingPage />);

    expect(screen.getByRole('heading', { name: 'No Manufacturing Data' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Import GL data to view manufacturing/i })
    ).toBeEnabled();
  });
});
