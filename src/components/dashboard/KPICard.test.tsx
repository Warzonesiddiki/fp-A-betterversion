/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KPICard, type KPICardProps } from './KPICard';

// Mock recharts components used by InlineSparkline
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="line-chart">{children}</svg>
  ),
  Line: () => <line data-testid="line" />,
}));

const defaultProps: KPICardProps = {
  title: 'Total Revenue',
  value: 42500000,
};

describe('KPICard', () => {
  it('renders without crashing', () => {
    render(<KPICard {...defaultProps} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<KPICard {...defaultProps} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders the formatted value as number by default', () => {
    render(<KPICard title="Headcount" value={342} />);
    expect(screen.getByText('342')).toBeInTheDocument();
  });

  it('formats value as currency', () => {
    render(<KPICard title="Revenue" value={1000000} format="currency" />);
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
  });

  it('formats value as percent', () => {
    render(<KPICard title="Growth" value={8.5} format="percent" />);
    expect(screen.getByText('8.5%')).toBeInTheDocument();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading is true', () => {
      const { container } = render(<KPICard {...defaultProps} loading />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render the title when loading', () => {
      render(<KPICard {...defaultProps} loading />);
      expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
    });

    it('does not render the value when loading', () => {
      render(<KPICard title="Revenue" value={1000} format="currency" loading />);
      expect(screen.queryByText('$1,000')).not.toBeInTheDocument();
    });
  });

  describe('Change and Trend', () => {
    it('renders positive change with up arrow', () => {
      render(<KPICard {...defaultProps} change={8.2} trend="up" />);
      expect(screen.getByText('+8.2% vs prior')).toBeInTheDocument();
      expect(screen.getByText('\u2191')).toBeInTheDocument();
    });

    it('renders negative change with down arrow', () => {
      render(<KPICard {...defaultProps} change={-2.1} trend="down" />);
      expect(screen.getByText('-2.1% vs prior')).toBeInTheDocument();
      expect(screen.getByText('\u2193')).toBeInTheDocument();
    });

    it('renders neutral change with right arrow', () => {
      render(<KPICard {...defaultProps} change={0} trend="neutral" />);
      expect(screen.getByText('+0.0% vs prior')).toBeInTheDocument();
      expect(screen.getByText('\u2192')).toBeInTheDocument();
    });

    it('does not render change when change is undefined', () => {
      render(<KPICard {...defaultProps} />);
      expect(screen.queryByText(/vs prior/)).not.toBeInTheDocument();
    });

    it('applies green color for up trend', () => {
      const { container } = render(<KPICard {...defaultProps} change={5} trend="up" />);
      const trendEl = container.querySelector('.text-green-600');
      expect(trendEl).toBeInTheDocument();
    });

    it('applies red color for down trend', () => {
      const { container } = render(<KPICard {...defaultProps} change={-5} trend="down" />);
      const trendEl = container.querySelector('.text-red-600');
      expect(trendEl).toBeInTheDocument();
    });
  });

  describe('Sparkline', () => {
    it('renders sparkline when sparklineData is provided', () => {
      const { container } = render(
        <KPICard {...defaultProps} sparklineData={[10, 20, 30]} trend="up" />
      );
      const sparklineContainer = container.querySelector('.mt-2');
      expect(sparklineContainer).toBeInTheDocument();
    });

    it('does not render sparkline when sparklineData is empty', () => {
      const { container } = render(<KPICard {...defaultProps} sparklineData={[]} />);
      const sparklineContainer = container.querySelector('.mt-2 svg');
      expect(sparklineContainer).not.toBeInTheDocument();
    });

    it('does not render sparkline when sparklineData is not provided', () => {
      const { container } = render(<KPICard {...defaultProps} />);
      const sparklineContainer = container.querySelector('.mt-2 svg');
      expect(sparklineContainer).not.toBeInTheDocument();
    });
  });

  describe('Variance Badge', () => {
    it('renders favorable variance badge', () => {
      const { container } = render(
        <KPICard
          {...defaultProps}
          varianceBadge={{ amount: 3200000, percent: 8.2, type: 'favorable' }}
        />
      );
      const badge = container.querySelector('.rounded-full');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toContain('8.2');
    });

    it('renders unfavorable variance badge', () => {
      const { container } = render(
        <KPICard
          {...defaultProps}
          varianceBadge={{ amount: -275000, percent: 2.1, type: 'unfavorable' }}
        />
      );
      const badge = container.querySelector('.rounded-full');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toContain('2.1');
    });

    it('renders custom variance label', () => {
      render(
        <KPICard
          title="Revenue"
          value={100000}
          format="currency"
          varianceBadge={{ amount: 5000, percent: 5, type: 'favorable', label: 'vs forecast' }}
        />
      );
      expect(screen.getByText(/vs forecast/)).toBeInTheDocument();
    });

    it('hides change row when varianceBadge is present', () => {
      render(
        <KPICard
          {...defaultProps}
          change={8.2}
          trend="up"
          varianceBadge={{ amount: 3200000, percent: 8.2, type: 'favorable' }}
        />
      );
      expect(screen.queryByText(/vs prior/)).not.toBeInTheDocument();
    });
  });

  describe('Prior Year and Budget', () => {
    it('renders PY and Budget values', () => {
      render(
        <KPICard
          title="Revenue"
          value={1000000}
          format="currency"
          priorYearValue={950000}
          budgetValue={980000}
        />
      );
      expect(screen.getByText(/PY:/)).toBeInTheDocument();
      expect(screen.getByText(/Budget:/)).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = vi.fn();
      render(<KPICard {...defaultProps} onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('adds cursor-pointer class when onClick is provided', () => {
      const { container } = render(<KPICard {...defaultProps} onClick={() => {}} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('does not render as button when onClick is not provided', () => {
      render(<KPICard {...defaultProps} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles Enter key press for accessibility', () => {
      const onClick = vi.fn();
      render(<KPICard {...defaultProps} onClick={onClick} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick on other keys', () => {
      const onClick = vi.fn();
      render(<KPICard {...defaultProps} onClick={onClick} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
