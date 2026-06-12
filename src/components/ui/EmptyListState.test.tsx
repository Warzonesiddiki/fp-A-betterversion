/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyListState } from './EmptyListState';

describe('EmptyListState', () => {
  it('renders default title', () => {
    render(<EmptyListState />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyListState title="No projects found" />);
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyListState description="Create a new project to get started" />);
    expect(screen.getByText('Create a new project to get started')).toBeInTheDocument();
  });

  it('renders default description when not provided', () => {
    render(<EmptyListState />);
    expect(screen.getByText('There are no items to display yet.')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<EmptyListState action={<button>Add Item</button>} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    render(<EmptyListState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // Accessibility
  it('has role="region"', () => {
    render(<EmptyListState title="Test" />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('has aria-label matching title', () => {
    render(<EmptyListState title="My list title" />);
    expect(screen.getByLabelText('My list title')).toBeInTheDocument();
  });

  it('renders Inbox icon by default', () => {
    const { container } = render(<EmptyListState />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyListState className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
