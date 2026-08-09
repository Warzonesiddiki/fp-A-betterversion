import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DebtSchedulePage from './DebtSchedulePage';
import { useDebtStore, type DebtInstrument } from '@/store/debtStore';
import { ExportEngine } from '@/engines/ExportEngine';

describe('DebtSchedulePage (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDebtStore.setState({ instruments: [] });
    vi.spyOn(ExportEngine, 'exportToPDF').mockResolvedValue(undefined as never);
    vi.spyOn(ExportEngine, 'exportToExcel').mockResolvedValue(undefined as never);
  });

  const sampleInstruments: DebtInstrument[] = [
    {
      id: 'debt-1',
      name: 'Senior Secured Term Loan',
      lender: 'JPMorgan Chase',
      type: 'term-loan',
      displayType: 'Senior Term Loan',
      principal: 10000000,
      rate: 0.065,
      termMonths: 60,
      startDate: '2026-01-01',
      paymentFrequency: 'monthly',
      status: 'current',
      seniority: 'senior',
    },
    {
      id: 'debt-2',
      name: 'Revolving Credit Facility',
      lender: 'Bank of America',
      type: 'revolver',
      displayType: 'Revolving Line',
      principal: 5000000,
      rate: 0.075,
      termMonths: 36,
      startDate: '2026-01-01',
      paymentFrequency: 'monthly',
      status: 'watch',
      seniority: 'subordinated',
    },
  ];

  it('renders empty state when no debt instruments exist and opens add form', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <DebtSchedulePage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(
      screen.getByText('Add debt instruments to see amortization, balance and DSCR analytics.')
    ).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: 'Add Debt' });
    await user.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Add Instrument' })).toBeInTheDocument();
  });

  it('renders portfolio KPIs, data table, and manage section when instruments exist', () => {
    useDebtStore.setState({ instruments: sampleInstruments });

    render(
      <BrowserRouter>
        <DebtSchedulePage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Debt Schedule' })).toBeInTheDocument();
    expect(screen.getByText('Total Debt')).toBeInTheDocument();
    expect(screen.getByText('Weighted Avg Rate')).toBeInTheDocument();
    expect(screen.getByText('Annual Debt Service')).toBeInTheDocument();
    expect(screen.getByText('DSCR')).toBeInTheDocument();

    // Table rows
    expect(screen.getByText('Senior Secured Term Loan')).toBeInTheDocument();
    expect(screen.getByText('Revolving Credit Facility')).toBeInTheDocument();
    expect(screen.getByText('JPMorgan Chase')).toBeInTheDocument();
    expect(screen.getByText('Bank of America')).toBeInTheDocument();

    // Manage section
    expect(screen.getByRole('button', { name: 'Edit debt-1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete debt-1' })).toBeInTheDocument();
  });

  it('handles edit and delete actions from the manage section', async () => {
    const user = userEvent.setup();
    const removeInstrument = vi.fn();
    useDebtStore.setState({ instruments: sampleInstruments, removeInstrument });

    render(
      <BrowserRouter>
        <DebtSchedulePage />
      </BrowserRouter>
    );

    // Click Edit on debt-1
    const editBtn = screen.getByRole('button', { name: 'Edit debt-1' });
    await user.click(editBtn);

    expect(screen.getByText('Edit Instrument')).toBeInTheDocument();

    // Click Delete on debt-1
    const deleteBtn = screen.getByRole('button', { name: 'Delete debt-1' });
    await user.click(deleteBtn);
    expect(removeInstrument).toHaveBeenCalledWith('debt-1');
  });

  it('triggers PDF and Excel export handlers', async () => {
    const user = userEvent.setup();
    useDebtStore.setState({ instruments: sampleInstruments });

    render(
      <BrowserRouter>
        <DebtSchedulePage />
      </BrowserRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: 'PDF' });
    await user.click(pdfBtn);
    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);

    const excelBtn = screen.getByRole('button', { name: 'Excel' });
    await user.click(excelBtn);
    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
  });
});
