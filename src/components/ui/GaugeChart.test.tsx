import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GaugeChart } from './GaugeChart';

describe('GaugeChart', () => {
  const defaultProps = { value: 50, min: 0, max: 100, label: 'Revenue' };

  it('renders with value and label', () => {
    render(<GaugeChart {...defaultProps} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('shows min and max labels', () => {
    render(<GaugeChart {...defaultProps} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('handles 0 value', () => {
    const { container } = render(<GaugeChart {...defaultProps} value={0} />);
    const svg = container.querySelector('svg')!;
    expect(svg.textContent).toContain('0');
  });

  it('handles max value', () => {
    const { container } = render(<GaugeChart {...defaultProps} value={100} />);
    const svg = container.querySelector('svg')!;
    expect(svg.textContent).toContain('100');
  });

  it('shows Invalid range when max <= min', () => {
    render(<GaugeChart value={50} min={100} max={0} label="Bad" />);
    expect(screen.getByText('Invalid range')).toBeInTheDocument();
  });

  it('renders threshold and critical reference lines', () => {
    const { container } = render(<GaugeChart {...defaultProps} threshold={70} critical={90} />);
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts custom className', () => {
    const { container } = render(<GaugeChart {...defaultProps} className="custom-class" />);
    expect((container.firstChild as HTMLElement).className).toContain('custom-class');
  });
});
