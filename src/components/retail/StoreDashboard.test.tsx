import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoreDashboard } from './StoreDashboard';

describe('StoreDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<StoreDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders column headers', () => {
    render(<StoreDashboard />);
    expect(screen.getByText('Store')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Traffic')).toBeInTheDocument();
    expect(screen.getByText('Conv %')).toBeInTheDocument();
    expect(screen.getByText('Basket')).toBeInTheDocument();
  });

  it('shows empty state when no rows', () => {
    render(<StoreDashboard />);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders a table element', () => {
    const { container } = render(<StoreDashboard />);
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('renders the correct number of column headers', () => {
    const { container } = render(<StoreDashboard />);
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(5);
  });
});
