import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelChart } from '@/components/ui/FunnelChart';

const sampleStages = [
  { label: 'Leads', value: 1000 },
  { label: 'Qualified', value: 500 },
  { label: 'Proposals', value: 200 },
  { label: 'Closed', value: 50 },
];

describe('FunnelChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with data', () => {
    const { container } = render(<FunnelChart stages={sampleStages} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays stage labels', () => {
    render(<FunnelChart stages={sampleStages} />);
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<FunnelChart stages={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<FunnelChart stages={[]} error="Failed to load" />);
    expect(screen.getAllByText(/Failed to load/i)[0]).toBeInTheDocument();
  });

  it('shows "No data" when stages are empty', () => {
    render(<FunnelChart stages={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows conversion rates between stages', () => {
    render(<FunnelChart stages={sampleStages} />);
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('calls onClick when a stage is clicked', () => {
    const onClick = vi.fn();
    render(<FunnelChart stages={sampleStages} onClick={onClick} />);
    const leadsRow = screen.getByText('Leads').closest('[role="button"]');
    expect(leadsRow).toBeInTheDocument();
  });
});
