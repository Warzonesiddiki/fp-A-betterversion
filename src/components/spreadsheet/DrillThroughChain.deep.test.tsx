import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillThroughChain, type SummaryRow } from './DrillThroughChain';

describe('DrillThroughChain (deep tests)', () => {
  const mockSummaryTree: SummaryRow[] = [
    {
      id: 'sum-rev',
      category: 'Revenue',
      actual: 500000,
      budget: 450000,
      variance: 50000,
      variancePct: 11.1,
      children: [
        {
          id: 'det-sub',
          lineItem: 'SaaS Subscriptions',
          accountCode: '4001',
          actual: 400000,
          budget: 350000,
          variance: 50000,
          variancePct: 14.3,
          entries: [
            {
              id: 'je-1',
              date: '2026-08-01',
              accountCode: '4001',
              description: 'Annual Enterprise Renewal',
              debit: 0,
              credit: 120000,
              reference: 'INV-2026-01',
            },
          ],
        },
        {
          id: 'det-serv',
          lineItem: 'Consulting Services',
          accountCode: '4002',
          actual: 100000,
          budget: 100000,
          variance: 0,
          variancePct: 0,
          entries: [],
        },
      ],
    },
    {
      id: 'sum-opex',
      category: 'Operating Expenses',
      actual: 200000,
      budget: 220000,
      variance: 20000,
      variancePct: 9.1,
      children: [],
    },
  ];

  it('renders initial summary view with period breadcrumb and summary table', () => {
    render(<DrillThroughChain summaryData={mockSummaryTree} period="2026 Q3" />);

    expect(screen.getByRole('navigation', { name: 'Drill-through path' })).toBeInTheDocument();
    expect(screen.getByText('2026 Q3 Summary')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Summary view' })).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
  });

  it('navigates from summary to detail view on summary row click', async () => {
    const user = userEvent.setup();
    render(<DrillThroughChain summaryData={mockSummaryTree} period="2026 Q3" />);

    const revRow = screen.getByRole('row', { name: /Revenue:/i });
    await user.click(revRow);

    // Detail view is active
    expect(screen.getByRole('grid', { name: 'Detail view' })).toBeInTheDocument();
    expect(screen.getByText('Showing line items for')).toBeInTheDocument();
    expect(screen.getByText('SaaS Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Consulting Services')).toBeInTheDocument();

    // Breadcrumb has updated
    const nav = screen.getByRole('navigation', { name: 'Drill-through path' });
    expect(within(nav).getByRole('button', { name: '2026 Q3 Summary' })).toBeInTheDocument();
    expect(within(nav).getByText('Revenue')).toHaveAttribute('aria-current', 'page');
  });

  it('navigates from detail to journal entry view on detail row click', async () => {
    const user = userEvent.setup();
    render(<DrillThroughChain summaryData={mockSummaryTree} period="2026 Q3" />);

    // Click Revenue row
    await user.click(screen.getByRole('row', { name: /Revenue:/i }));

    // Click SaaS Subscriptions row
    const subRow = screen.getByText('SaaS Subscriptions').closest('tr') as HTMLElement;
    await user.click(subRow);

    // Journal Entry view is active
    expect(screen.getByRole('grid', { name: 'Journal entries' })).toBeInTheDocument();
    expect(screen.getByText('Annual Enterprise Renewal')).toBeInTheDocument();
    expect(screen.getByText('INV-2026-01')).toBeInTheDocument();

    // Breadcrumb has 3 levels
    const nav = screen.getByRole('navigation', { name: 'Drill-through path' });
    expect(within(nav).getByRole('button', { name: '2026 Q3 Summary' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Revenue' })).toBeInTheDocument();
    expect(within(nav).getByText('SaaS Subscriptions')).toHaveAttribute('aria-current', 'page');
  });

  it('navigates backward via breadcrumbs from journal entry view to summary or detail', async () => {
    const user = userEvent.setup();
    render(<DrillThroughChain summaryData={mockSummaryTree} period="2026 Q3" />);

    // Drill down to journal entry level
    await user.click(screen.getByRole('row', { name: /Revenue:/i }));
    const subRow = screen.getByText('SaaS Subscriptions').closest('tr') as HTMLElement;
    await user.click(subRow);

    expect(screen.getByRole('grid', { name: 'Journal entries' })).toBeInTheDocument();

    // Click level 1 ('Revenue') in breadcrumb -> returns to detail view
    const nav = screen.getByRole('navigation', { name: 'Drill-through path' });
    const revenueBreadcrumb = within(nav).getByRole('button', { name: 'Revenue' });
    await user.click(revenueBreadcrumb);

    expect(screen.getByRole('grid', { name: 'Detail view' })).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: 'Journal entries' })).not.toBeInTheDocument();

    // Click level 0 ('2026 Q3 Summary') or Home -> returns to summary view
    const summaryBreadcrumb = within(nav).getByRole('button', { name: '2026 Q3 Summary' });
    await user.click(summaryBreadcrumb);

    expect(screen.getByRole('grid', { name: 'Summary view' })).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: 'Detail view' })).not.toBeInTheDocument();
  });

  it('handles summary row with empty children gracefully', async () => {
    const user = userEvent.setup();
    render(<DrillThroughChain summaryData={mockSummaryTree} period="2026 Q3" />);

    await user.click(screen.getByRole('row', { name: /Operating Expenses:/i }));
    expect(screen.getByRole('grid', { name: 'Detail view' })).toBeInTheDocument();
    expect(screen.getByText('Showing line items for')).toBeInTheDocument();
  });
});
