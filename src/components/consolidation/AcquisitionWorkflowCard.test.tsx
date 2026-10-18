import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@/test/testUtils';
import { AcquisitionWorkflowCard } from './AcquisitionWorkflowCard';

/**
 * Phase 8 remainder: the acquisition workflow computes the SAME
 * hand-computed ASC 805 deal as the engine oracle (goodwill 600,000
 * on 1,250,000 attributed vs 650,000 net identifiable assets).
 */

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('AcquisitionWorkflowCard', () => {
  it('computes the oracle deal from user-supplied fair values', () => {
    render(<AcquisitionWorkflowCard />);
    fill('Consideration transferred', '1000000');
    fill('NCI fair value', '250000');

    const assets: Array<[string, string]> = [
      ['Cash', '100000'],
      ['Receivables', '150000'],
      ['PP&E', '400000'],
      ['Identifiable intangibles', '200000'],
    ];
    assets.forEach(([name, fv], i) => {
      if (i > 0) {
        fireEvent.click(
          within(screen.getByText('Identifiable assets').closest('fieldset')!).getByText('Add row')
        );
      }
      fill(`Identifiable assets name ${i + 1}`, name);
      fill(`Identifiable assets fair value ${i + 1}`, fv);
    });

    const liabilities: Array<[string, string]> = [
      ['Payables', '80000'],
      ['Debt assumed', '120000'],
    ];
    liabilities.forEach(([name, fv], i) => {
      if (i > 0) {
        fireEvent.click(
          within(screen.getByText('Liabilities assumed').closest('fieldset')!).getByText('Add row')
        );
      }
      fill(`Liabilities assumed name ${i + 1}`, name);
      fill(`Liabilities assumed fair value ${i + 1}`, fv);
    });

    const result = screen.getByLabelText('Purchase price allocation result');
    expect(within(result).getByText('Goodwill')).toBeTruthy();
    expect(result.textContent).toContain('600,000');
    expect(result.textContent).toContain('650,000');
  });

  it('surfaces engine validation errors instead of inventing results', () => {
    render(<AcquisitionWorkflowCard />);
    fill('Identifiable assets name 1', 'Cash');
    fill('Identifiable assets fair value 1', '-50');
    expect(screen.getByRole('alert').textContent).toMatch(/non-negative/);
  });
});
