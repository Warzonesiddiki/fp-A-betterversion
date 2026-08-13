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

  it('renders a leading icon without polluting the accessible name', () => {
    render(<PageHeader icon={<svg data-testid="glyph" />} title="ARR Dashboard" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAccessibleName('ARR Dashboard');
    expect(heading.querySelector('.fp-page-header__icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
  });

  it('puts titleId on the heading so aria-labelledby resolves to the heading itself', () => {
    // Regression guard: forwarding `id` through ...props would land it on the
    // wrapper, making a labelled region announce title + purpose + actions.
    render(
      <PageHeader
        actions={<button type="button">Export</button>}
        purpose="Recurring revenue."
        title="ARR Dashboard"
        titleId="arr-heading"
      />
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'ARR Dashboard' });
    expect(heading).toHaveAttribute('id', 'arr-heading');
    expect(document.getElementById('arr-heading')).toBe(heading);
  });

  it('still forwards unrelated wrapper attributes', () => {
    const { container } = render(<PageHeader data-section="close" title="Close Cockpit" />);

    expect(container.querySelector('.fp-page-header')).toHaveAttribute('data-section', 'close');
  });

  it('does not render empty purpose or action containers', () => {
    const { container } = render(<PageHeader title="Close Cockpit" />);

    expect(container.querySelector('.fp-page-header__purpose')).toBeNull();
    expect(container.querySelector('.fp-page-header__actions')).toBeNull();
  });
});
