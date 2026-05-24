import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { SelectionStatusBar } from './SelectionStatusBar';

describe('SelectionStatusBar', () => {
  const stats = { sum: 1500, avg: 500, min: 100, max: 900, count: 3 };

  it('renders count', () => {
    render(<SelectionStatusBar stats={stats} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders formatted sum', () => {
    render(<SelectionStatusBar stats={stats} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('renders average', () => {
    render(<SelectionStatusBar stats={stats} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders min and max', () => {
    render(<SelectionStatusBar stats={stats} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
  });

  it('has status role', () => {
    render(<SelectionStatusBar stats={stats} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
