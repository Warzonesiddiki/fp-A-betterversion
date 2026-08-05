/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KPICardEnhanced, type KPICardEnhancedProps } from './KPICardEnhanced';

// Mock Sparkline component
vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: ({ data, color }: { data: number[]; color?: string }) => (
    <div data-testid="sparkline" data-color={color}>
      {data.length} points
    </div>
  ),
}));

const defaultProps: KPICardEnhancedProps = {
  title: 'Total Revenue',
  value: 42500000,
  format: 'compact',
  variancePercent: 8.2,
  varianceAmount: 3200000,
  varianceType: 'favorable',
  priorYearValue: 39300000,
  budgetValue: 40000000,
  sparklineData: [38, 39, 40, 41, 40, 42, 42.5],
};

describe('KPICardEnhanced', () => {
  it('renders without crashing', () => {
    render(<KPICardEnhanced {...defaultProps} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<KPICardEnhanced {...defaultProps} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders the formatted value as compact currency', () => {
    render(<KPICardEnhanced {...defaultProps} />);
    expect(screen.getByText('$42.5M')).toBeInTheDocument();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading is true', () => {
      const { container } = render(<KPICardEnhanced {...defaultProps} loading />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render the title when loading', () => {
      render(<KPICardEnhanced {...defaultProps} loading />);
      expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
    });

    it('does not render the value when loading', () => {
      render(<KPICardEnhanced {...defaultProps} loading />);
      expect(screen.queryByText('$42.5M')).not.toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('formats as currency', () => {
      render(<KPICardEnhanced title="Revenue" value={1500000} format="currency" />);
      expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    });

    it('formats as percent', () => {
      render(<KPICardEnhanced title="Margin" value={15.5} format="percent" />);
      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });

    it('formats as number by default', () => {
      render(<KPICardEnhanced title="Count" value={342} />);
      expect(screen.getByText('342')).toBeInTheDocument();
    });

    it('formats billions in compact mode', () => {
      render(<KPICardEnhanced title="Revenue" value={2500000000} format="compact" />);
      expect(screen.getByText('$2.5B')).toBeInTheDocument();
    });

    it('formats thousands in compact mode', () => {
      render(<KPICardEnhanced title="Revenue" value={1500} format="compact" />);
      expect(screen.getByText('$2K')).toBeInTheDocument();
    });
  });

  describe('Variance Display', () => {
    it('shows favorable variance with up arrow and green styling', () => {
      render(<KPICardEnhanced {...defaultProps} varianceType="favorable" variancePercent={8.2} />);
      const badge = screen.getByText(/8\.2%/);
      expect(badge).toBeInTheDocument();
      expect(badge.closest('span')?.className).toContain('bg-green-50');
    });

    it('shows unfavorable variance with down arrow and red styling', () => {
      render(
        <KPICardEnhanced
          {...defaultProps}
          varianceType="unfavorable"
          variancePercent={-2.1}
          varianceAmount={-275000}
        />
      );
      const badge = screen.getByText(/2\.1%/);
      expect(badge).toBeInTheDocument();
      expect(badge.closest('span')?.className).toContain('bg-red-50');
    });

    it('shows neutral variance with right arrow and gray styling', () => {
      render(
        <KPICardEnhanced
          {...defaultProps}
          varianceType="neutral"
          variancePercent={0}
          varianceAmount={0}
        />
      );
      const badges = screen.getAllByText(/0\.0%/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('does not render variance badge when variancePercent is undefined', () => {
      render(<KPICardEnhanced title="Test" value={100} format="number" />);
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });

    it('shows variance amount with "vs budget" text', () => {
      render(<KPICardEnhanced {...defaultProps} />);
      expect(screen.getByText(/vs budget/)).toBeInTheDocument();
    });
  });

  describe('Prior Year and Budget', () => {
    it('shows prior year value when provided', () => {
      render(<KPICardEnhanced {...defaultProps} />);
      expect(screen.getByText(/PY:/)).toBeInTheDocument();
    });

    it('shows budget value when provided', () => {
      render(<KPICardEnhanced {...defaultProps} />);
      expect(screen.getByText(/Budget:/)).toBeInTheDocument();
    });

    it('does not show PY/Budget when both are undefined', () => {
      render(<KPICardEnhanced title="Test" value={100} format="number" />);
      expect(screen.queryByText(/PY:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Budget:/)).not.toBeInTheDocument();
    });
  });

  describe('Target Progress', () => {
    it('shows target progress bar when target is provided', () => {
      render(<KPICardEnhanced {...defaultProps} target={50000000} />);
      expect(screen.getByText('Target progress')).toBeInTheDocument();
    });

    it('calculates and displays correct progress percentage', () => {
      render(<KPICardEnhanced {...defaultProps} value={25000000} target={50000000} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('caps progress at 100%', () => {
      render(<KPICardEnhanced {...defaultProps} value={60000000} target={50000000} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('does not show target progress when target is undefined', () => {
      render(<KPICardEnhanced {...defaultProps} />);
      expect(screen.queryByText('Target progress')).not.toBeInTheDocument();
    });
  });

  describe('Sparkline', () => {
    it('renders sparkline when sparklineData is provided with 2+ points', () => {
      render(<KPICardEnhanced {...defaultProps} />);
      expect(screen.getByTestId('sparkline')).toBeInTheDocument();
    });

    it('does not render sparkline with fewer than 2 data points', () => {
      render(<KPICardEnhanced title="Test" value={100} sparklineData={[1]} />);
      expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
    });

    it('uses green sparkline color for favorable variance', () => {
      render(<KPICardEnhanced {...defaultProps} varianceType="favorable" />);
      const sparkline = screen.getByTestId('sparkline');
      expect(sparkline.getAttribute('data-color')).toBe('#16a34a');
    });

    it('uses red sparkline color for unfavorable variance', () => {
      render(<KPICardEnhanced {...defaultProps} varianceType="unfavorable" />);
      const sparkline = screen.getByTestId('sparkline');
      expect(sparkline.getAttribute('data-color')).toBe('#dc2626');
    });

    it('uses gray sparkline color for neutral variance', () => {
      render(<KPICardEnhanced {...defaultProps} varianceType="neutral" />);
      const sparkline = screen.getByTestId('sparkline');
      expect(sparkline.getAttribute('data-color')).toBe('#6b7280');
    });
  });

  describe('Click Behavior', () => {
    it('calls onDrillDown when clicked', () => {
      const onDrillDown = vi.fn();
      render(<KPICardEnhanced {...defaultProps} onDrillDown={onDrillDown} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onDrillDown).toHaveBeenCalledTimes(1);
    });

    it('renders as button when onDrillDown is provided', () => {
      render(<KPICardEnhanced {...defaultProps} onDrillDown={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render as button when onDrillDown is not provided', () => {
      render(<KPICardEnhanced {...defaultProps} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles Enter key for accessibility', () => {
      const onDrillDown = vi.fn();
      render(<KPICardEnhanced {...defaultProps} onDrillDown={onDrillDown} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(onDrillDown).toHaveBeenCalledTimes(1);
    });

    it('adds hover classes when onDrillDown is provided', () => {
      const { container } = render(<KPICardEnhanced {...defaultProps} onDrillDown={() => {}} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
      expect(card.className).toContain('hover:border-blue-400');
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(<KPICardEnhanced {...defaultProps} className="custom-class" />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });
  });
});
