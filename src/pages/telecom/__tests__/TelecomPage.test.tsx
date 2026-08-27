import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TelecomPage from '@/pages/telecom/TelecomPage';
import { useGLStore } from '@/store/glStore';
import { useTelecomStore } from '@/store/telecomStore';
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
    accountId: 'acc-4001',
    accountCode: '4001',
    accountName: 'Broadband Subscription Revenue',
    debit: 0,
    credit: 150000,
    netChange: -150000,
    amount: -150000,
    date: '2026-04-01',
    period: '2026-04',
  },
  {
    id: 'entry-2',
    accountId: 'acc-4002',
    accountCode: '4002',
    accountName: '5G Wireless Plan Revenue',
    debit: 0,
    credit: 250000,
    netChange: -250000,
    amount: -250000,
    date: '2026-04-10',
    period: '2026-04',
  },
  {
    id: 'entry-3',
    accountId: 'acc-5001',
    accountCode: '5001',
    accountName: 'Tower Maintenance & Power',
    debit: 80000,
    credit: 0,
    netChange: 80000,
    amount: 80000,
    date: '2026-04-15',
    period: '2026-04',
  },
];

describe('TelecomPage (store-wired & exports)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useTelecomStore.setState({ subscribers: [], networkMetrics: [] });
  });

  it('renders empty state when GL entries are empty', () => {
    render(
      <MemoryRouter>
        <TelecomPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No Telecom Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /import gl data to view telecom financials/i })
    ).toBeInTheDocument();
  });

  it('renders telecom KPIs from GL store and telecomStore', () => {
    useGLStore.setState({ entries: mockEntries });
    useTelecomStore.setState({
      subscribers: [
        {
          id: 'sub-1',
          plan: 'Unlimited 5G',
          monthlyRevenue: 65,
          churnRisk: 'Low',
          status: 'Active',
        },
        {
          id: 'sub-2',
          plan: 'Fiber 1Gbps',
          monthlyRevenue: 85,
          churnRisk: 'Medium',
          status: 'Active',
        },
      ],
      networkMetrics: [
        { region: 'North America Metro', uptime: 99.98, avgSpeed: 450, subscribers: 12000 },
      ],
    });

    render(
      <MemoryRouter>
        <TelecomPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /^telecom$/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('3 entries imported')).toBeInTheDocument();

    // Top KPIs
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    expect(screen.getByText('Avg Revenue/Entry')).toBeInTheDocument();

    // Subscriber & network KPIs
    expect(screen.getByText('Subscribers')).toBeInTheDocument();
    expect(screen.getByText('Average ARPU')).toBeInTheDocument();
    expect(screen.getByText('Network Regions')).toBeInTheDocument();
    expect(screen.getByText('Network Uptime')).toBeInTheDocument();

    // Account Breakdown
    expect(screen.getByText('Account Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Broadband Subscription Revenue')).toBeInTheDocument();
    expect(screen.getByText('5G Wireless Plan Revenue')).toBeInTheDocument();
  });

  it('exports a PDF report with telecom KPIs and disclosures', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <TelecomPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Telecom_Financial_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with performance data and GL accounts', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <TelecomPage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Telecom_Performance_Review');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
