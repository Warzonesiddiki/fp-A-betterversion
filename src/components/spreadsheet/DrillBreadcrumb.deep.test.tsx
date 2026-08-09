import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillBreadcrumb, type DrillLevel } from './DrillBreadcrumb';

describe('DrillBreadcrumb (deep tests)', () => {
  it('renders null when levels array is empty', () => {
    const { container } = render(<DrillBreadcrumb levels={[]} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single level as current page with Home button', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const levels: DrillLevel[] = [{ id: 'sum', label: '2026 Q3 Summary', type: 'summary' }];

    render(<DrillBreadcrumb levels={levels} onNavigate={onNavigate} />);

    expect(screen.getByRole('navigation', { name: 'Drill-through path' })).toBeInTheDocument();
    const homeBtn = screen.getByRole('button', { name: 'Return to summary' });
    expect(homeBtn).toBeInTheDocument();

    const currentSpan = screen.getByText('2026 Q3 Summary');
    expect(currentSpan).toHaveAttribute('aria-current', 'page');
    expect(currentSpan).toHaveAttribute('title', 'Overview');

    await user.click(homeBtn);
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('renders multi-level drill path with clickable ancestors and aria-current on last level', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    const levels: DrillLevel[] = [
      { id: '1', label: 'Financial Summary', type: 'summary' },
      { id: '2', label: 'Operating Expenses', type: 'section' },
      { id: '3', label: 'R&D Salaries', type: 'line-item' },
      { id: '4', label: 'JE-2026-089', type: 'journal-entry' },
    ];

    render(<DrillBreadcrumb levels={levels} onNavigate={onNavigate} />);

    // Intermediate levels are buttons with proper titles
    const summaryBtn = screen.getByRole('button', { name: 'Financial Summary' });
    const sectionBtn = screen.getByRole('button', { name: 'Operating Expenses' });
    const lineItemBtn = screen.getByRole('button', { name: 'R&D Salaries' });

    expect(summaryBtn).toHaveAttribute('title', 'Overview');
    expect(sectionBtn).toHaveAttribute('title', 'Section');
    expect(lineItemBtn).toHaveAttribute('title', 'Line Item');

    // Last level is a span with aria-current
    const lastSpan = screen.getByText('JE-2026-089');
    expect(lastSpan).toHaveAttribute('aria-current', 'page');
    expect(lastSpan).toHaveAttribute('title', 'Journal Entry');

    // Clicking ancestors triggers onNavigate with their indices
    await user.click(summaryBtn);
    expect(onNavigate).toHaveBeenCalledWith(0);

    await user.click(sectionBtn);
    expect(onNavigate).toHaveBeenCalledWith(1);

    await user.click(lineItemBtn);
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it('applies custom className to navigation container', () => {
    const levels: DrillLevel[] = [{ id: '1', label: 'Summary', type: 'summary' }];
    render(
      <DrillBreadcrumb levels={levels} onNavigate={vi.fn()} className="custom-breadcrumb-nav" />
    );

    expect(screen.getByRole('navigation', { name: 'Drill-through path' })).toHaveClass(
      'custom-breadcrumb-nav'
    );
  });
});
