/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Progress } from './Progress';

function getInner(container: HTMLElement) {
  return (container.firstChild as HTMLElement).firstChild as HTMLElement;
}

describe('Progress', () => {
  // --- Renders ---
  it('renders without crashing', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders outer track div', () => {
    const { container } = render(<Progress value={50} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('bg-slate-800');
    expect(outer.className).toContain('rounded-full');
    expect(outer.className).toContain('overflow-hidden');
  });

  it('renders inner bar div', () => {
    const { container } = render(<Progress value={50} />);
    const inner = getInner(container);
    expect(inner.className).toContain('bg-purple-500');
    expect(inner.className).toContain('transition-all');
    expect(inner.className).toContain('duration-300');
  });

  // --- Value clamping ---
  it('sets width to 0% for value 0', () => {
    const { container } = render(<Progress value={0} />);
    expect(getInner(container).style.width).toBe('0%');
  });

  it('sets width to 50% for value 50', () => {
    const { container } = render(<Progress value={50} />);
    expect(getInner(container).style.width).toBe('50%');
  });

  it('sets width to 100% for value 100', () => {
    const { container } = render(<Progress value={100} />);
    expect(getInner(container).style.width).toBe('100%');
  });

  it('clamps value above 100 to 100%', () => {
    const { container } = render(<Progress value={150} />);
    expect(getInner(container).style.width).toBe('100%');
  });

  it('clamps value of 999 to 100%', () => {
    const { container } = render(<Progress value={999} />);
    expect(getInner(container).style.width).toBe('100%');
  });

  it('clamps negative value to 0%', () => {
    const { container } = render(<Progress value={-10} />);
    expect(getInner(container).style.width).toBe('0%');
  });

  it('clamps -999 to 0%', () => {
    const { container } = render(<Progress value={-999} />);
    expect(getInner(container).style.width).toBe('0%');
  });

  // --- Boundary values ---
  it('handles boundary value of 1', () => {
    const { container } = render(<Progress value={1} />);
    expect(getInner(container).style.width).toBe('1%');
  });

  it('handles boundary value of 99', () => {
    const { container } = render(<Progress value={99} />);
    expect(getInner(container).style.width).toBe('99%');
  });

  // --- Edge cases ---
  it('handles NaN value gracefully', () => {
    const { container } = render(<Progress value={NaN} />);
    expect(getInner(container).style.width).toBeDefined();
  });

  it('handles Infinity value', () => {
    const { container } = render(<Progress value={Infinity} />);
    expect(getInner(container).style.width).toBe('100%');
  });

  it('handles -Infinity value', () => {
    const { container } = render(<Progress value={-Infinity} />);
    expect(getInner(container).style.width).toBe('0%');
  });

  it('handles very small decimal values', () => {
    const { container } = render(<Progress value={0.001} />);
    expect(getInner(container).style.width).toBe('0.001%');
  });

  it('handles fractional values', () => {
    const { container } = render(<Progress value={33.33} />);
    expect(getInner(container).style.width).toBe('33.33%');
  });

  it('handles exactly 0.5', () => {
    const { container } = render(<Progress value={0.5} />);
    expect(getInner(container).style.width).toBe('0.5%');
  });

  // --- Custom className ---
  it('applies custom className to outer div', () => {
    const { container } = render(<Progress value={50} className="my-progress" />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('my-progress');
  });

  it('preserves default classes with custom className', () => {
    const { container } = render(<Progress value={50} className="extra" />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('bg-slate-800');
    expect(outer.className).toContain('extra');
  });

  it('uses empty string as default className', () => {
    const { container } = render(<Progress value={50} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).not.toContain('undefined');
  });

  // --- Accessibility (sad path: no ARIA attributes) ---
  it('does not have role="progressbar" (missing a11y)', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  });

  it('does not have aria-valuenow (missing a11y)', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector('[aria-valuenow]')).not.toBeInTheDocument();
  });

  it('does not have aria-valuemin (missing a11y)', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector('[aria-valuemin]')).not.toBeInTheDocument();
  });

  it('does not have aria-valuemax (missing a11y)', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector('[aria-valuemax]')).not.toBeInTheDocument();
  });
});
