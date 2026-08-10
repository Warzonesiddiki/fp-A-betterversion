import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { FinancialStatusBadge } from './FinancialStatusBadge';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders a semantic page heading, purpose, status, and actions', () => {
    render(
      <PageHeader
        actions={<button type="button">Export</button>}
        purpose="Review the material changes requiring action."
        status={<FinancialStatusBadge status="stale" />}
        title="Executive Workspace"
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Executive Workspace' })).toBeVisible();
    expect(screen.getByText('Review the material changes requiring action.')).toBeVisible();
    expect(screen.getByRole('status')).toHaveAccessibleName(/data may be stale/i);
    expect(screen.getByRole('button', { name: 'Export' })).toBeVisible();
  });

  it('does not render empty purpose or action containers', () => {
    const { container } = render(<PageHeader title="Close Cockpit" />);

    expect(container.querySelector('.fp-page-header__purpose')).toBeNull();
    expect(container.querySelector('.fp-page-header__actions')).toBeNull();
  });
});
