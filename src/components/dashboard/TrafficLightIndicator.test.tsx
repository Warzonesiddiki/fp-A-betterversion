/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  TrafficLightIndicator,
  TrafficLightBatch,
  type TrafficLightProps,
  type TrafficLightBatchProps,
} from './TrafficLightIndicator';

describe('TrafficLightIndicator', () => {
  const defaultProps: TrafficLightProps = {
    label: 'Revenue Growth',
    value: 8.2,
    status: 'green',
  };

  it('renders without crashing', () => {
    render(<TrafficLightIndicator {...defaultProps} />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<TrafficLightIndicator {...defaultProps} />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
  });

  it('renders the formatted value', () => {
    render(<TrafficLightIndicator {...defaultProps} format="percent" />);
    expect(screen.getByText('8.2%')).toBeInTheDocument();
  });

  it('renders the status dot', () => {
    const { container } = render(<TrafficLightIndicator {...defaultProps} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  describe('Status Colors', () => {
    it('applies green styles for green status', () => {
      const { container } = render(<TrafficLightIndicator {...defaultProps} status="green" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-green-50');
      expect(wrapper.className).toContain('border-green-200');
      const dot = container.querySelector('.bg-green-500');
      expect(dot).toBeInTheDocument();
    });

    it('applies yellow styles for yellow status', () => {
      const { container } = render(<TrafficLightIndicator {...defaultProps} status="yellow" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-yellow-50');
      expect(wrapper.className).toContain('border-yellow-200');
      const dot = container.querySelector('.bg-yellow-500');
      expect(dot).toBeInTheDocument();
    });

    it('applies red styles for red status', () => {
      const { container } = render(<TrafficLightIndicator {...defaultProps} status="red" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-red-50');
      expect(wrapper.className).toContain('border-red-200');
      const dot = container.querySelector('.bg-red-500');
      expect(dot).toBeInTheDocument();
    });

    it('applies gray styles for gray status', () => {
      const { container } = render(<TrafficLightIndicator {...defaultProps} status="gray" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-gray-50');
      expect(wrapper.className).toContain('border-gray-200');
      const dot = container.querySelector('.bg-gray-400');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('formats as number by default', () => {
      render(<TrafficLightIndicator label="Count" value={342} status="green" />);
      expect(screen.getByText('342')).toBeInTheDocument();
    });

    it('formats as currency', () => {
      render(
        <TrafficLightIndicator label="Revenue" value={1000000} status="green" format="currency" />
      );
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('formats as percent', () => {
      render(<TrafficLightIndicator label="Growth" value={8.5} status="green" format="percent" />);
      expect(screen.getByText('8.5%')).toBeInTheDocument();
    });

    it('formats as compact', () => {
      render(
        <TrafficLightIndicator label="Revenue" value={1500000} status="green" format="compact" />
      );
      expect(screen.getByText('$1.5M')).toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('renders description when provided', () => {
      render(<TrafficLightIndicator {...defaultProps} description="Year over year growth" />);
      expect(screen.getByText('Year over year growth')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const { container } = render(<TrafficLightIndicator {...defaultProps} />);
      const descEl = container.querySelector('.text-xs.text-\\[var\\(--text-muted\\)\\]');
      expect(descEl).not.toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TrafficLightIndicator {...defaultProps} className="custom-tl" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-tl');
    });
  });
});

describe('TrafficLightBatch', () => {
  const defaultBatchProps: TrafficLightBatchProps = {
    items: [
      { label: 'Revenue Growth', value: 8.2, format: 'percent' },
      { label: 'Gross Margin', value: 62.5, format: 'percent' },
      { label: 'DSO', value: 42, format: 'number' },
    ],
    thresholds: {
      green: { min: 5 },
      yellow: { min: 0 },
    },
    direction: 'higher-is-better',
  };

  it('renders without crashing', () => {
    render(<TrafficLightBatch {...defaultBatchProps} />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
  });

  it('renders all items', () => {
    render(<TrafficLightBatch {...defaultBatchProps} />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByText('Gross Margin')).toBeInTheDocument();
    expect(screen.getByText('DSO')).toBeInTheDocument();
  });

  it('assigns green status to values above green threshold', () => {
    const { container } = render(<TrafficLightBatch {...defaultBatchProps} />);
    // 8.2 is above min 5, should be green
    const indicators = container.querySelectorAll('.rounded-lg');
    expect(indicators[0].className).toContain('bg-green-50');
  });

  it('assigns yellow status to values between yellow and green thresholds', () => {
    const props: TrafficLightBatchProps = {
      items: [{ label: 'Test', value: 3, format: 'number' }],
      thresholds: { green: { min: 5 }, yellow: { min: 0 } },
      direction: 'higher-is-better',
    };
    const { container } = render(<TrafficLightBatch {...props} />);
    const indicator = container.querySelector('.rounded-lg');
    expect(indicator?.className).toContain('bg-yellow-50');
  });

  it('assigns red status to values below yellow threshold', () => {
    const props: TrafficLightBatchProps = {
      items: [{ label: 'Test', value: -1, format: 'number' }],
      thresholds: { green: { min: 5 }, yellow: { min: 0 } },
      direction: 'higher-is-better',
    };
    const { container } = render(<TrafficLightBatch {...props} />);
    const indicator = container.querySelector('.rounded-lg');
    expect(indicator?.className).toContain('bg-red-50');
  });

  describe('Direction: lower-is-better', () => {
    it('assigns green status to values below green max', () => {
      const props: TrafficLightBatchProps = {
        items: [{ label: 'DSO', value: 30, format: 'number' }],
        thresholds: { green: { max: 40 }, yellow: { max: 50 } },
        direction: 'lower-is-better',
      };
      const { container } = render(<TrafficLightBatch {...props} />);
      const indicator = container.querySelector('.rounded-lg');
      expect(indicator?.className).toContain('bg-green-50');
    });

    it('assigns yellow status to values between green max and yellow max', () => {
      const props: TrafficLightBatchProps = {
        items: [{ label: 'DSO', value: 45, format: 'number' }],
        thresholds: { green: { max: 40 }, yellow: { max: 50 } },
        direction: 'lower-is-better',
      };
      const { container } = render(<TrafficLightBatch {...props} />);
      const indicator = container.querySelector('.rounded-lg');
      expect(indicator?.className).toContain('bg-yellow-50');
    });

    it('assigns red status to values above yellow max', () => {
      const props: TrafficLightBatchProps = {
        items: [{ label: 'DSO', value: 55, format: 'number' }],
        thresholds: { green: { max: 40 }, yellow: { max: 50 } },
        direction: 'lower-is-better',
      };
      const { container } = render(<TrafficLightBatch {...props} />);
      const indicator = container.querySelector('.rounded-lg');
      expect(indicator?.className).toContain('bg-red-50');
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TrafficLightBatch {...defaultBatchProps} className="custom-batch" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-batch');
    });

    it('defaults to higher-is-better direction', () => {
      const props: TrafficLightBatchProps = {
        items: [{ label: 'Test', value: 8, format: 'number' }],
        thresholds: { green: { min: 5 }, yellow: { min: 0 } },
        // direction not specified
      };
      const { container } = render(<TrafficLightBatch {...props} />);
      const indicator = container.querySelector('.rounded-lg');
      expect(indicator?.className).toContain('bg-green-50');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      const props: TrafficLightBatchProps = {
        items: [],
        thresholds: { green: { min: 5 }, yellow: { min: 0 } },
      };
      const { container } = render(<TrafficLightBatch {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders correct number of indicators', () => {
      const { container } = render(<TrafficLightBatch {...defaultBatchProps} />);
      const indicators = container.querySelectorAll('.rounded-lg');
      expect(indicators.length).toBe(3);
    });
  });
});
