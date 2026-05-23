/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BenchmarkRadar } from './BenchmarkRadar';

describe('BenchmarkRadar', () => {
  it('renders without crashing', () => {
    const { container } = render(<BenchmarkRadar />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders placeholder text', () => {
    render(<BenchmarkRadar />);
    expect(screen.getByText('Industry Benchmark Radar Chart')).toBeInTheDocument();
  });

  it('applies container styling classes', () => {
    const { container } = render(<BenchmarkRadar />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
    expect(wrapper.className).toContain('rounded-xl');
  });

  it('centers the placeholder text', () => {
    const { container } = render(<BenchmarkRadar />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('items-center');
    expect(wrapper.className).toContain('justify-center');
  });
});
