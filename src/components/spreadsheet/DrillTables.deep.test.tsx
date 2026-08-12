import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryTable, DetailTable, JournalEntryTable, computeJournalTotals } from './DrillTables';
import type { SummaryRow, DetailRow, JournalEntry } from './DrillThroughChain';

describe('DrillTables (deep tests)', () => {
  const mockSummaryData: SummaryRow[] = [
    {
      id: 'sum-1',
      category: 'Revenue',
      actual: 150000,
      budget: 140000,
      variance: 10000,
      variancePct: 7.14,
    },
    {
      id: 'sum-2',
      category: 'COGS',
      actual: 65000,
      budget: 60000,
      variance: -5000,
      variancePct: -8.33,
    },
    {
      id: 'sum-3',
      category: 'Break-Even',
      actual: 25000,
      budget: 25000,
      variance: 0,
      variancePct: 0,
    },
  ];

  const mockDetailData: DetailRow[] = [
    {
      id: 'det-1',
      lineItem: 'Enterprise Subscriptions',
      accountCode: '4010',
      actual: 100000,
      budget: 90000,
      variance: 10000,
      variancePct: 11.1,
      entries: [
        {
          id: 'je-1',
          date: '2026-08-01',
          accountCode: '4010',
          description: 'ACME Corp Q3 Subscription',
          debit: 0,
          credit: 50000,
          reference: 'INV-1001',
        },
      ],
    },
    {
      id: 'det-2',
      lineItem: 'Professional Services',
      accountCode: '4020',
      actual: 50000,
      budget: 50000,
      variance: 0,
      variancePct: 0,
      entries: [], // empty entries
    },
  ];

  const mockJournalEntries: JournalEntry[] = [
    {
      id: 'je-1',
      date: '2026-08-01',
      accountCode: '1010',
      description: 'Cash Receipt - Customer Payment',
      debit: 55000.5,
      credit: 0,
      reference: 'CR-8801',
    },
    {
      id: 'je-2',
      date: '2026-08-01',
      accountCode: '4010',
      description: 'Revenue Recognition',
      debit: 0,
      credit: 55000.5,
      reference: 'RR-8801',
    },
  ];

  // The former local `formatCurrency` export was removed by UI-06: money display
  // now goes through the shared reporting-currency formatter
  // (`useCurrencyFormatter`), which is covered by its own unit tests. Rendered
  // currency output is still asserted through the table components below.
  describe('computeJournalTotals helper function', () => {
    it('computes exact journal debit and credit totals', () => {
      const totals = computeJournalTotals([
        { debit: 12.34, credit: 0 },
        { debit: 56.78, credit: 0 },
        { debit: 0, credit: 69.12 },
      ]);
      expect(totals.totalDebit).toBe(69.12);
      expect(totals.totalCredit).toBe(69.12);
    });
  });

  describe('SummaryTable', () => {
    it('renders categories, financial figures, and variance columns', () => {
      render(<SummaryTable data={mockSummaryData} onSelect={vi.fn()} />);

      expect(screen.getByRole('grid', { name: 'Summary view' })).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('COGS')).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toBeInTheDocument();
      expect(screen.getByText('$140,000')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
      expect(screen.getByText('7.1%')).toBeInTheDocument();
    });

    it('handles row selection via click and keyboard Enter/Space', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(<SummaryTable data={mockSummaryData} onSelect={onSelect} />);

      const row1 = screen.getByRole('row', {
        name: /Revenue: actual \$150,000, budget \$140,000/i,
      });

      await user.click(row1);
      expect(onSelect).toHaveBeenCalledWith(mockSummaryData[0]);

      // Keyboard Enter
      fireEvent.keyDown(row1, { key: 'Enter', code: 'Enter' });
      expect(onSelect).toHaveBeenCalledTimes(2);

      // Keyboard Space
      fireEvent.keyDown(row1, { key: ' ', code: 'Space' });
      expect(onSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe('DetailTable', () => {
    it('renders category headline and line items', () => {
      render(<DetailTable data={mockDetailData} category="Software Revenue" onSelect={vi.fn()} />);

      expect(screen.getByRole('grid', { name: 'Detail view' })).toBeInTheDocument();
      expect(screen.getByText('Software Revenue')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('4010')).toBeInTheDocument();
      expect(screen.getByText('$100,000')).toBeInTheDocument();
    });

    it('calls onSelect when clicking row with journal entries, but not for empty entries', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(<DetailTable data={mockDetailData} category="Software Revenue" onSelect={onSelect} />);

      const subRow = screen.getByText('Enterprise Subscriptions').closest('tr')!;
      const profRow = screen.getByText('Professional Services').closest('tr')!;

      // Click row with entries
      await user.click(subRow);
      expect(onSelect).toHaveBeenCalledWith(mockDetailData[0]);

      // KeyDown Enter on row with entries
      fireEvent.keyDown(subRow, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledTimes(2);

      // Click row WITHOUT entries -> nothing happens
      onSelect.mockClear();
      await user.click(profRow);
      expect(onSelect).not.toHaveBeenCalled();

      fireEvent.keyDown(profRow, { key: ' ' });
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('JournalEntryTable', () => {
    it('renders journal entries and total footer with debit/credit balance', () => {
      render(<JournalEntryTable data={mockJournalEntries} lineItem="Enterprise Subscriptions" />);

      expect(screen.getByRole('grid', { name: 'Journal entries' })).toBeInTheDocument();
      expect(screen.getByText('Enterprise Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('2 entries')).toBeInTheDocument();

      // Check dates and descriptions
      expect(screen.getByText('Cash Receipt - Customer Payment')).toBeInTheDocument();
      expect(screen.getByText('Revenue Recognition')).toBeInTheDocument();
      expect(screen.getByText('CR-8801')).toBeInTheDocument();
      expect(screen.getByText('RR-8801')).toBeInTheDocument();

      // Check footer total
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('handles singular entry count label', () => {
      render(<JournalEntryTable data={[mockJournalEntries[0]!]} lineItem="Single Line" />);
      expect(screen.getByText('1 entry')).toBeInTheDocument();
    });
  });
});
