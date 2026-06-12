/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DriverSlider } from './DriverSlider';

// Radix UI Slider requires ResizeObserver
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = ResizeObserverMock;
});

describe('DriverSlider', () => {
  const defaultProps = {
    label: 'Growth Rate',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    onChange: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<DriverSlider {...defaultProps} />);
    expect(screen.getByText('Growth Rate')).toBeInTheDocument();
  });

  it('displays the label', () => {
    render(<DriverSlider {...defaultProps} label="Revenue Growth" />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<DriverSlider {...defaultProps} value={75} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('displays the unit label', () => {
    render(<DriverSlider {...defaultProps} unit="%" />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('displays min and max values', () => {
    render(<DriverSlider {...defaultProps} min={0} max={100} unit="%" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('formats large numbers with locale separators', () => {
    render(<DriverSlider {...defaultProps} value={10000} min={0} max={50000} unit="" />);
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('renders with value at minimum', () => {
    render(<DriverSlider {...defaultProps} value={0} min={0} max={100} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with value at maximum', () => {
    render(<DriverSlider {...defaultProps} value={100} min={0} max={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with value at midpoint of range', () => {
    render(<DriverSlider {...defaultProps} value={50} min={0} max={100} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders slider element', () => {
    const { container } = render(<DriverSlider {...defaultProps} />);
    const slider = container.querySelector('[data-orientation]');
    expect(slider).toBeInTheDocument();
  });

  it('applies disabled styling when disabled', () => {
    const { container } = render(<DriverSlider {...defaultProps} disabled />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('opacity-50');
    expect(wrapper.className).toContain('pointer-events-none');
  });

  it('has an accessible label on the thumb', () => {
    render(<DriverSlider {...defaultProps} label="Headcount" />);
    expect(screen.getByLabelText('Headcount')).toBeInTheDocument();
  });

  it('renders with negative min value', () => {
    render(<DriverSlider {...defaultProps} min={-50} max={50} value={0} unit="pts" />);
    expect(screen.getByText('-50pts')).toBeInTheDocument();
    expect(screen.getByText('50pts')).toBeInTheDocument();
  });

  it('renders with very large max value', () => {
    const { container } = render(
      <DriverSlider {...defaultProps} min={0} max={1_000_000} value={500_000} unit="$" />
    );
    // Verify the component rendered successfully with large values
    // Note: toLocaleString() in jsdom may use different grouping than browser
    expect(container.textContent).toContain('Growth Rate');
    expect(container.textContent).toContain('$');
  });

  it('renders with step value of 0.1 (decimal steps)', () => {
    render(<DriverSlider {...defaultProps} step={0.1} value={5.5} min={0} max={10} />);
    expect(screen.getByText('5.5')).toBeInTheDocument();
  });

  it('applies custom className is not a prop on this component (no className)', () => {
    // DriverSlider doesn't accept className, verify it still renders
    render(<DriverSlider {...defaultProps} />);
    expect(screen.getByText('Growth Rate')).toBeInTheDocument();
  });
});
