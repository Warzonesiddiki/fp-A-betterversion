import { render, screen } from '@/test/testUtils';
import { describe, it, expect } from 'vitest';
import { AllocationJournalTable, JournalEntry } from './AllocationJournalTable';

describe('AllocationJournalTable', () => {
  it('renders without crashing', () => {
    render(<AllocationJournalTable entries={[]} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('renders entries correctly', () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        debitAccount: 'Assets',
        creditAccount: 'Liabilities',
        amount: 1000,
        memo: 'Test entry 1',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        debitAccount: 'Expenses',
        creditAccount: 'Cash',
        amount: 500,
        memo: 'Test entry 2',
        timestamp: new Date().toISOString(),
      },
    ];

    render(<AllocationJournalTable entries={entries} />);

    expect(screen.getByText('DR Assets')).toBeInTheDocument();
    expect(screen.getByText('CR Liabilities')).toBeInTheDocument();
    expect(screen.getByText('DR Expenses')).toBeInTheDocument();
    expect(screen.getByText('CR Cash')).toBeInTheDocument();

    const formattedAmount1 = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(1000);

    const formattedAmount2 = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(500);

    const amount1Elements = screen.getAllByText(formattedAmount1);
    expect(amount1Elements.length).toBe(2); // One debit, one credit

    const amount2Elements = screen.getAllByText(formattedAmount2);
    expect(amount2Elements.length).toBe(2);

    expect(screen.getByText('Test entry 1')).toBeInTheDocument();
    expect(screen.getByText('Test entry 2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AllocationJournalTable entries={[]} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
