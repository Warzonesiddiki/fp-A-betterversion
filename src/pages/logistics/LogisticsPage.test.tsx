import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import LogisticsPage from '@/pages/logistics/LogisticsPage';
import { useGLStore } from '@/store/glStore';
import { useLogisticsStore } from '@/store/logisticsStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockEntries: GLEntry[] = [
  {
    id: 'entry-1',
    accountId: 'acc-5101',
    accountCode: '5101',
    accountName: 'Freight Carrier Expenses',
    debit: 145000,
    credit: 0,
    netChange: 145000,
    amount: 145000,
    date: '2026-05-01',
    period: '2026-05',
  },
  {
    id: 'entry-2',
    accountId: 'acc-4101',
    accountCode: '4101',
    accountName: 'Logistics Service Revenue',
    debit: 0,
    credit: 210000,
    netChange: -210000,
    amount: -210000,
    date: '2026-05-05',
    period: '2026-05',
  },
  {
    id: 'entry-3',
    accountId: 'acc-5201',
    accountCode: '5201',
    accountName: 'Warehouse Lease & Storage',
    debit: 45000,
    credit: 0,
    netChange: 45000,
    amount: 45000,
    date: '2026-05-10',
    period: '2026-05',
  },
];

describe('LogisticsPage (store-wired & exports)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useLogisticsStore.setState({
      shipments: [],
      carrierPerformance: [],
      routeCosts: [],
    });
  });

  it('renders empty state when GL entries are empty', () => {
    render(
      <MemoryRouter>
        <LogisticsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No Logistics Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /import gl data to view logistics metrics/i })
    ).toBeInTheDocument();
  });

  it('renders logistics KPIs from GL store and logisticsStore', () => {
    useGLStore.setState({ entries: mockEntries });
    useLogisticsStore.setState({
      shipments: [
        {
          id: 'shp-1',
          origin: 'Chicago Hub',
          destination: 'Dallas Distribution',
          carrier: 'Swift Freight',
          status: 'In Transit',
          cost: 2400,
          eta: '2026-05-08',
        },
      ],
      carrierPerformance: [
        { carrier: 'Swift Freight', onTimeRate: 96.5, avgCost: 2200, volume: 150 },
      ],
      routeCosts: [{ route: 'ORD -> DFW', cost: 2400, volume: 80 }],
    });

    render(
      <MemoryRouter>
        <LogisticsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Logistics')).toBeInTheDocument();
    expect(screen.getByText('3 entries imported')).toBeInTheDocument();

    // Top KPIs
    expect(screen.getByText('Total Debit')).toBeInTheDocument();
    expect(screen.getByText('Total Credit')).toBeInTheDocument();
    expect(screen.getByText('Active Accounts')).toBeInTheDocument();
    expect(screen.getAllByText('Net Change').length).toBeGreaterThanOrEqual(1);

    // Operational KPIs
    expect(screen.getByText('Active Shipments')).toBeInTheDocument();
    expect(screen.getByText('On-Time Rate')).toBeInTheDocument();
    expect(screen.getByText('Active Carriers')).toBeInTheDocument();
    expect(screen.getByText('Monitored Corridors')).toBeInTheDocument();

    // Account Breakdown
    expect(screen.getByText('Account Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Freight Carrier Expenses')).toBeInTheDocument();
    expect(screen.getByText('Logistics Service Revenue')).toBeInTheDocument();
  });

  it('exports a PDF report with logistics KPIs and disclosures', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <LogisticsPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Logistics_Financial_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with logistics operations and GL accounts', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <LogisticsPage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Logistics_Operations_Review');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
