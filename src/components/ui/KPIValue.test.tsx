import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPIValue } from './KPIValue';

describe('KPIValue', () => {
  it('renders label text', () => {
    render(<KPIValue label="Revenue" value="$1.2M" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<KPIValue label="Revenue" value="$1.2M" />);
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
  });

  it('renders trend indicator with up arrow for positive change', () => {
    render(<KPIValue label="Revenue" value="$1.2M" change={5.2} />);
    expect(screen.getByText('5.2%')).toBeInTheDocument();
  });

  it('renders trend indicator with down arrow for negative change', () => {
    render(<KPIValue label="Revenue" value="$1.2M" change={-3.1} />);
    expect(screen.getByText('3.1%')).toBeInTheDocument();
  });

  it('renders neutral trend when change is zero', () => {
    render(<KPIValue label="Revenue" value="$1.2M" change={0} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('renders changeLabel when provided', () => {
    render(<KPIValue label="Revenue" value="$1.2M" changeLabel="vs last month" />);
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('handles value gracefully', () => {
    render(<KPIValue label="Revenue" value="--" />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
