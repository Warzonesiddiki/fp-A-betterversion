import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SankeyChart } from './SankeyChart';

const sampleLinks = [
  { source: 'Revenue', target: 'OpEx', value: 500 },
  { source: 'Revenue', target: 'R&D', value: 300 },
  { source: 'OpEx', target: 'Profit', value: 200 },
];

describe('SankeyChart', () => {
  it('renders source nodes with percentage', () => {
    render(<SankeyChart links={sampleLinks} />);
    expect(screen.getByText('Revenue (80%)')).toBeInTheDocument();
    expect(screen.getByText('OpEx (20%)')).toBeInTheDocument();
  });

  it('renders target nodes', () => {
    render(<SankeyChart links={sampleLinks} />);
    expect(screen.getByText('OpEx')).toBeInTheDocument();
    expect(screen.getByText('R&D')).toBeInTheDocument();
    expect(screen.getByText('Profit')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(<SankeyChart links={sampleLinks} title="Cash Flow" />);
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
  });

  it('handles empty links without crashing', () => {
    const { container } = render(<SankeyChart links={[]} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('handles empty links with title', () => {
    render(<SankeyChart links={[]} title="Empty" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
