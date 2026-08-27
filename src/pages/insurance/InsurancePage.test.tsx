import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { InsurancePage } from './InsurancePage';
import { useGLStore } from '@/store/glStore';
import { useInsuranceStore } from '@/store/insuranceStore';
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
    accountId: 'acc-4100',
    accountCode: '4100',
    accountName: 'Gross Written Premium',
    debit: 0,
    credit: 250000,
    netChange: -250000,
    amount: -250000,
    date: '2026-03-01',
    period: '2026-03',
  },
  {
    id: 'entry-2',
    accountId: 'acc-4200',
    accountCode: '4200',
    accountName: 'Earned Premium',
    debit: 0,
    credit: 200000,
    netChange: -200000,
    amount: -200000,
    date: '2026-03-15',
    period: '2026-03',
  },
  {
    id: 'entry-3',
    accountId: 'acc-5100',
    accountCode: '5100',
    accountName: 'Loss & LAE Expense',
    debit: 120000,
    credit: 0,
    netChange: 120000,
    amount: 120000,
    date: '2026-03-20',
    period: '2026-03',
  },
  {
    id: 'entry-4',
    accountId: 'acc-5200',
    accountCode: '5200',
    accountName: 'Commission Expense',
    debit: 30000,
    credit: 0,
    netChange: 30000,
    amount: 30000,
    date: '2026-03-22',
    period: '2026-03',
  },
];

describe('InsurancePage (engine-wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useInsuranceStore.setState({ lossPicks: [] });
  });

  it('renders empty state when GL entries are empty', () => {
    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    );

    expect(screen.getByText('No Insurance Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /import gl data to view insurance/i })
    ).toBeInTheDocument();
  });

  it('renders underwriting KPIs computed by InsuranceEngine and GL store', () => {
    useGLStore.setState({ entries: mockEntries });
    useInsuranceStore.setState({
      lossPicks: [
        {
          line: 'Auto Physical Damage',
          pick: '85000',
          ultimate: '92000',
          dev: '8.2%',
          credibility: 'High',
        },
      ],
    });

    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText('4 entries imported')).toBeInTheDocument();

    // Actuarial loss picks
    expect(screen.getByText('Loss Picks')).toBeInTheDocument();
    expect(screen.getByText('loss-pick rows on file')).toBeInTheDocument();

    // Insurance underwriting metrics
    expect(screen.getAllByText('Gross Written Premium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Earned Premium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Loss Ratio')).toBeInTheDocument();
    // Loss ratio: 120000 / 200000 = 60%
    expect(screen.getByText('60%')).toBeInTheDocument();

    // Account overview
    expect(screen.getByText('Account Overview')).toBeInTheDocument();
    expect(screen.getByText('Loss & LAE Expense')).toBeInTheDocument();
  });

  it('exports a PDF report with underwriting KPIs and basis disclosures', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Insurance_Sector_Financial_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with underwriting and GL account data', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Insurance_Portfolio_Review');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
