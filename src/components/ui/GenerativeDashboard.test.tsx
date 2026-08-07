import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { GenerativeDashboard } from './GenerativeDashboard';

const mockSpec = {
  root: 'chart',
  elements: {
    chart: {
      type: 'Chart',
      props: {
        type: 'bar' as const,
        data: [
          { name: 'Jan', value: 1000 },
          { name: 'Feb', value: 1500 },
        ],
        title: 'Revenue by Month',
      },
      children: [],
    },
  },
};

describe('GenerativeDashboard', () => {
  it('renders dashboard with chart', () => {
    render(<GenerativeDashboard spec={mockSpec} />);
    expect(screen.getByText('Revenue by Month')).toBeInTheDocument();
  });
});
