import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TransferPricingPage from '@/pages/tax/TransferPricingPage';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const mockEntries: GLEntry[] = [
  {
    id: 'tp-1',
    accountId: 'acc-1800',
    accountCode: '1800',
    accountName: 'Intercompany Management Fee Receivable',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 2500000,
    credit: 0,
    netChange: 2500000,
    date: '2025-01-15',
    amount: 2500000,
    description: 'Corporate Management Fee allocation',
    reference: 'REF-TP-01',
    entityId: 'US-Parent',
  },
  {
    id: 'tp-2',
    accountId: 'acc-4800',
    accountCode: '4800',
    accountName: 'Intercompany Royalty Revenue',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 0,
    credit: 1800000,
    netChange: 1800000,
    date: '2025-01-20',
    amount: 1800000,
    description: 'Software IP Royalty License',
    reference: 'REF-TP-02',
    entityId: 'US-Parent',
  },
  {
    id: 'tp-3',
    accountId: 'acc-5800',
    accountCode: '5800',
    accountName: 'Intercompany Manufacturing Transfer Cost',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 950000,
    credit: 0,
    netChange: -950000,
    date: '2025-01-25',
    amount: -950000,
    description: 'Sub-assembly Manufacturing Transfer',
    reference: 'REF-TP-03',
    entityId: 'DE-Sub',
  },
];

describe('TransferPricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders empty state when no IC transactions exist', () => {
    render(
      <MemoryRouter>
        <TransferPricingPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Transfer Pricing', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/No transfer pricing transactions loaded/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL Data/i })).toBeInTheDocument();
  });

  it('renders transfer pricing dashboard when GL entries contain IC postings', () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <TransferPricingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Transfer Pricing', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Total Intercompany' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Transactions' })).toBeInTheDocument();
    expect(screen.getByText(/Pricing Method Distribution/i)).toBeInTheDocument();
    expect(
      screen.getByText(/OECD Transfer Pricing Guidelines & IRC §482 Disclosures/i)
    ).toBeInTheDocument();
  });

  it('filters transactions by method when method button is clicked', () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <TransferPricingPage />
      </MemoryRouter>
    );

    const rpmBtn = screen.getByRole('button', { name: /RPM/i });
    fireEvent.click(rpmBtn);

    expect(rpmBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('exports a PDF report with transfer pricing data', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <TransferPricingPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Transfer_Pricing_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with transfer pricing data', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <TransferPricingPage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Transfer_Pricing_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
