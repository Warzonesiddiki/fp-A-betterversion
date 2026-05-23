/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  // Rendering
  it('renders title text', () => {
    render(<EmptyState title="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('renders action when provided', () => {
    render(<EmptyState title="No results" action={<button>Add Item</button>} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    render(<EmptyState title="No results" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // Accessibility
  it('has role="status"', () => {
    render(<EmptyState title="Loading" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label matching title', () => {
    render(<EmptyState title="No data available" />);
    expect(screen.getByLabelText('No data available')).toBeInTheDocument();
  });

  // Variants
  it('renders default no-data variant icon', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(<EmptyState title="Custom" icon={<span data-testid="custom-icon">X</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Test" className="my-class" />);
    expect(container.firstChild).toHaveAttribute('class');
  });

  // Variants render different default icons
  it('renders no-results variant', () => {
    render(<EmptyState variant="no-results" title="No results" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders no-file variant', () => {
    render(<EmptyState variant="no-file" title="No file" />);
    expect(screen.getByText('No file')).toBeInTheDocument();
  });

  it('renders error variant', () => {
    render(<EmptyState variant="error" title="Error occurred" />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});
