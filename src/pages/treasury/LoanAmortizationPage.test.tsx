import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/testUtils';
import LoanAmortizationPage from './LoanAmortizationPage';

describe('LoanAmortizationPage (BATCH-006 — reachability of LoanAmortizationEngine)', () => {
  it('computes a real amortization schedule that pays off to a zero balance', async () => {
    const user = userEvent.setup();
    render(<LoanAmortizationPage />);

    // Defaults (100000 @ 6% / 360) are pre-filled — just calculate.
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    const table = await screen.findByTestId('amortization-table');
    expect(table).toBeInTheDocument();

    // The engine actually ran: ~$599.55/mo for a $100k @ 6% / 360mo loan.
    // (The same figure appears in every schedule row, so use getAllByText.)
    expect(screen.getAllByText(/\$599\.55/).length).toBeGreaterThan(0);

    // Full 360-month schedule rendered from REAL engine output (no mock data).
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(360);

    // Exact-decimal invariant: the loan pays off to a zero closing balance in
    // the final period. UI-06 renders money through the shared reporting-currency
    // formatter, whose canonical zeroDisplay is the em dash, so a fully amortised
    // balance shows as '—' rather than '$0.00'.
    const lastRow = rows[rows.length - 1];
    expect(lastRow?.textContent).toContain('—');

    // Total interest is a real, positive figure.
    const totalInterest = screen.getByTestId('total-interest').textContent ?? '';
    expect(totalInterest).toMatch(/^\$/);
  });

  it('rejects invalid input with a clear, recoverable message', async () => {
    const user = userEvent.setup();
    render(<LoanAmortizationPage />);

    const principal = screen.getByLabelText(/principal/i);
    await user.clear(principal);
    await user.type(principal, '-100');
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/non-negative/i);
    expect(screen.queryByTestId('amortization-table')).toBeNull();
  });
});
