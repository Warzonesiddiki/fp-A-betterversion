import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GLTrialBalanceGrid } from './GLTrialBalanceGrid';

vi.mock('@/components/ui/DataGrid', () => ({
  DataGrid: ({ rows, readOnly, className: _className }: Record<string, unknown>) => (
    <div
      data-testid="data-grid"
      data-row-count={(rows as unknown[])?.length ?? 0}
      data-read-only={readOnly as boolean}
    />
  ),
}));

describe('GLTrialBalanceGrid', () => {
  it('renders without crashing', () => {
    render(<GLTrialBalanceGrid />);
  });

  it('renders DataGrid component', () => {
    render(<GLTrialBalanceGrid />);
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });

  it('passes empty data to DataGrid', () => {
    render(<GLTrialBalanceGrid />);
    expect(screen.getByTestId('data-grid').getAttribute('data-row-count')).toBe('0');
  });

  it('has fixed height container', () => {
    const { container } = render(<GLTrialBalanceGrid />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-[600px]');
  });

  it('has border styling on container', () => {
    const { container } = render(<GLTrialBalanceGrid />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('border');
    expect(wrapper.className).toContain('rounded-lg');
  });
});
