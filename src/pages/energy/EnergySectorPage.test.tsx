// =============================================================================
// EnergySectorPage tests — engine-wired overview
// -----------------------------------------------------------------------------
// Real store idiom: `useGLStore` and `useEnergyStore` seeded via setState.
// Asserts KPIs computed by EnergyEngine.calculateStats.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import EnergySectorPage from './EnergySectorPage';
import { useGLStore } from '@/store/glStore';
import { useEnergyStore } from '@/store/energyStore';
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
  // 4310 Solar Generation Revenue (credit normal)
  makeEntry({
    id: '1',
    accountCode: '4310',
    accountName: 'Solar Generation Revenue',
    credit: 50000,
    amount: 50000,
    netChange: 50000,
  }),
  // 4320 Wind Generation Revenue (credit normal)
  makeEntry({
    id: '2',
    accountCode: '4320',
    accountName: 'Wind Generation Revenue',
    credit: 30000,
    amount: 30000,
    netChange: 30000,
  }),
  // 5000 Plant Operating Cost (debit normal)
  makeEntry({
    id: '3',
    accountCode: '5000',
    accountName: 'Power Plant Operations & Maintenance',
    debit: 20000,
    amount: 20000,
    netChange: 20000,
  }),
];

const mockAssets = [
  {
    id: 'a1',
    name: 'Desert Sunlight Solar Farm',
    type: 'Solar' as const,
    capacity: '550 MW',
    outputYTD: '120 GWh',
    availability: '98.5%',
    roi: '12.4%',
  },
];

describe('EnergySectorPage (engine-wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
    useEnergyStore.setState({ assets: mockAssets });
  });

  it('renders KPI values computed by EnergyEngine', () => {
    render(<EnergySectorPage />);

    // Total Revenue = 50k + 30k = 80k; Operating Cost = 20k; Net Income = 60k; Renewable Assets = 1
    expect(screen.getByRole('region', { name: 'Total Revenue' })).toHaveTextContent('$80,000');
    expect(screen.getByRole('region', { name: 'Operating Cost' })).toHaveTextContent('$20,000');
    expect(screen.getByRole('region', { name: 'Net Operating Income' })).toHaveTextContent(
      '$60,000'
    );
    expect(screen.getByRole('region', { name: 'Renewable Assets' })).toHaveTextContent('1');
  });

  it('renders energy source generation breakdown', () => {
    render(<EnergySectorPage />);

    expect(screen.getByText('Generation by Energy Source')).toBeInTheDocument();
    expect(screen.getByText('Solar')).toBeInTheDocument();
    expect(screen.getByText('Wind')).toBeInTheDocument();
  });

  it('exports a PDF report with energy KPIs and basis disclosures', async () => {
    const user = userEvent.setup();
    render(<EnergySectorPage />);

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]![0];
    expect(args.rows).toEqual(
      expect.arrayContaining([
        ['Total Revenue', '$80,000', 'Posted 4xxx energy accounts'],
        ['Operating Cost', '$20,000', 'Posted 5xxx/6xxx generation costs'],
        ['Net Operating Income', '$60,000', 'Revenue − Operating Cost'],
      ])
    );
  });

  it('exports energy production financials to Excel', async () => {
    const user = userEvent.setup();
    render(<EnergySectorPage />);

    await user.click(screen.getByRole('button', { name: /Export Excel/i }));

    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]![0];
    expect(args.headers).toEqual(['Source / Metric', 'Value', 'Unit']);
  });

  it('renders empty state when no GL data exists', () => {
    useGLStore.setState({ entries: [] });
    render(<EnergySectorPage />);

    expect(screen.getByRole('main', { name: 'Energy Sector - No Data' })).toBeInTheDocument();
    expect(screen.getByText('No Energy Sector Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Import GL data to view energy sector/i })
    ).toBeEnabled();
  });
});
