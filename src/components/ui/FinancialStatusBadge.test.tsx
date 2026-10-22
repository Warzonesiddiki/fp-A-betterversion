import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { FinancialStatusBadge, financialStatusValues } from './FinancialStatusBadge';

describe('FinancialStatusBadge', () => {
  it.each(financialStatusValues)('renders %s as readable non-colour state', (status) => {
    render(<FinancialStatusBadge status={status} />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('data-financial-status', status);
    expect(indicator).toHaveAccessibleName();
    expect(indicator).toHaveTextContent(/\S/);
  });

  it('includes material status detail in the accessible description', () => {
    render(<FinancialStatusBadge detail="3 changes queued" status="offlineQueued" />);

    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Offline; queued changes are not official: 3 changes queued'
    );
  });

  it('reads stale as stale, not as current, and says what to do about it', () => {
    render(<FinancialStatusBadge status="stale" />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveTextContent('Stale');
    expect(indicator).toHaveAccessibleName('Data may be stale; refresh or inspect source health');
  });

  it('reads queued offline changes as unofficial rather than saved', () => {
    render(<FinancialStatusBadge status="offlineQueued" />);

    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Offline; queued changes are not official'
    );
  });
});
