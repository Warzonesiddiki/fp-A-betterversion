import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CommentaryPanel } from './CommentaryPanel';

describe('CommentaryPanel', () => {
  it('renders commentary for the supplied line items', () => {
    render(
      <CommentaryPanel
        section="Operating Expenses"
        period="2026-01"
        lineItems={[{ name: 'Salaries', actual: 120_000, budget: 100_000 }]}
      />
    );
    // The panel returns null for an empty lineItems array, so rendering it with
    // no props asserted nothing at all. Drive the populated branch instead.
    expect(screen.getAllByText(/Salaries/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Operating Expenses/)).toBeInTheDocument();
  });

  it('renders nothing when there are no line items', () => {
    const { container } = render(
      <CommentaryPanel section="Operating Expenses" period="2026-01" lineItems={[]} />
    );
    expect(container.innerHTML).toBe('');
  });
});
