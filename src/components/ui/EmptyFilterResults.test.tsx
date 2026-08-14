/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyFilterResults } from './EmptyFilterResults';

describe('EmptyFilterResults', () => {
  it('renders default title', () => {
    render(<EmptyFilterResults />);
    expect(screen.getByText('No matching results')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyFilterResults title="Filtered out" />);
    expect(screen.getByText('Filtered out')).toBeInTheDocument();
  });

  it('renders description with filter count', () => {
    render(<EmptyFilterResults activeFilterCount={3} />);
    expect(screen.getByText(/No items match the current filters/)).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<EmptyFilterResults description="Custom filter message" />);
    expect(screen.getByText('Custom filter message')).toBeInTheDocument();
  });

  it('renders clear filters button when onClearFilters is provided', () => {
    render(<EmptyFilterResults onClearFilters={() => {}} />);
    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('calls onClearFilters when button clicked', () => {
    const onClear = vi.fn();
    render(<EmptyFilterResults onClearFilters={onClear} />);
    fireEvent.click(screen.getByText('Clear all filters'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('does not render clear button when onClearFilters is omitted', () => {
    render(<EmptyFilterResults />);
    expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
  });

  it('renders custom clear label', () => {
    render(<EmptyFilterResults onClearFilters={() => {}} clearLabel="Reset filters" />);
    expect(screen.getByText('Reset filters')).toBeInTheDocument();
    expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
  });

  // Accessibility
  // This is a result of a search/filter transition, so it must be announced.
  // role="region" is a landmark: it announces nothing when the node appears.
  it('announces itself as a live status message', () => {
    render(<EmptyFilterResults />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-label matching title', () => {
    render(<EmptyFilterResults title="No filter matches" />);
    expect(screen.getByLabelText('No filter matches')).toBeInTheDocument();
  });

  it('renders FilterX icon', () => {
    const { container } = render(<EmptyFilterResults />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyFilterResults className="filter-class" />);
    expect(container.firstChild).toHaveClass('filter-class');
  });
});
