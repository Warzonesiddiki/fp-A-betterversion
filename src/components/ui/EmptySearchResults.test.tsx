/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptySearchResults } from './EmptySearchResults';

describe('EmptySearchResults', () => {
  it('renders default title', () => {
    render(<EmptySearchResults />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptySearchResults title="No matches" />);
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('includes search query in description', () => {
    render(<EmptySearchResults query="foobar" />);
    expect(screen.getByText(/No results match "foobar"/)).toBeInTheDocument();
  });

  it('renders description without query', () => {
    render(<EmptySearchResults />);
    expect(screen.getByText(/Try entering a search term/)).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<EmptySearchResults query="test" description="Custom empty description" />);
    expect(screen.getByText('Custom empty description')).toBeInTheDocument();
  });

  it('renders suggestions list', () => {
    render(
      <EmptySearchResults
        suggestions={['Check spelling', 'Try fewer keywords', 'Browse all items']}
      />
    );
    expect(screen.getByText('Check spelling')).toBeInTheDocument();
    expect(screen.getByText('Try fewer keywords')).toBeInTheDocument();
    expect(screen.getByText('Browse all items')).toBeInTheDocument();
  });

  it('does not render suggestions when not provided', () => {
    render(<EmptySearchResults />);
    expect(screen.queryByText('Suggestions:')).not.toBeInTheDocument();
  });

  // Accessibility
  // This is a result of a search/filter transition, so it must be announced.
  // role="region" is a landmark: it announces nothing when the node appears.
  it('announces itself as a live status message', () => {
    render(<EmptySearchResults />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-label matching title', () => {
    render(<EmptySearchResults title="Search results empty" />);
    expect(screen.getByLabelText('Search results empty')).toBeInTheDocument();
  });

  it('renders SearchX icon', () => {
    const { container } = render(<EmptySearchResults />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptySearchResults className="my-search-class" />);
    expect(container.firstChild).toHaveClass('my-search-class');
  });
});
