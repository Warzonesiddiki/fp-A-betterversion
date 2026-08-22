import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders skeleton element', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.bg-gray-200');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.querySelector('.custom-class');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with text variant by default', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.rounded');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({ width: '100%', height: '1rem' });
  });

  it('renders with circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.querySelector('.rounded-full');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({ width: '2.5rem', height: '2.5rem' });
  });

  it('renders with rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.querySelector('.rounded-none');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders multiple items with count prop', () => {
    const { container } = render(<Skeleton count={3} />);
    const skeletons = container.querySelectorAll('.bg-gray-200');
    expect(skeletons).toHaveLength(3);
  });

  it('applies width and height from props', () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    const skeleton = container.querySelector('.bg-gray-200');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('renders with count of 1 by default', () => {
    const { container } = render(<Skeleton />);
    const skeletons = container.querySelectorAll('.bg-gray-200');
    expect(skeletons).toHaveLength(1);
  });
});

describe('Skeleton — W-A11Y-002 M5 live-region discipline', () => {
  it('renders no live-region attributes by default', () => {
    const { container } = render(<Skeleton count={3} animation="pulse" />);
    expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live]')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy]')).not.toBeInTheDocument();
  });

  it('hides every skeleton bar from assistive tech by default', () => {
    const { container } = render(<Skeleton count={4} />);
    const bars = container.querySelectorAll('.bg-gray-200');
    expect(bars).toHaveLength(4);
    bars.forEach((bar) => {
      expect(bar).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('marks the wrapper aria-hidden when no sr label is provided', () => {
    const { container } = render(<Skeleton />);
    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders no sr-only loading text by default', () => {
    const { container } = render(<Skeleton count={2} />);
    expect(container.querySelector('.sr-only')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('announces exactly once via a single sr-only status when srLabel is set', () => {
    const { container } = render(<Skeleton count={5} srLabel="Loading report…" />);
    const statuses = container.querySelectorAll('[role="status"]');
    // One announcement for the whole group — not one per bar.
    expect(statuses).toHaveLength(1);
    const status = container.querySelector('[role="status"]');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).toHaveClass('sr-only');
    expect(status).toHaveTextContent('Loading report…');
    expect(container.querySelectorAll('.bg-gray-200')).toHaveLength(5);
  });

  it('exposes the labelled group to assistive tech (wrapper not aria-hidden)', () => {
    const { container } = render(<Skeleton srLabel="Loading…" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBeNull();
    expect(wrapper).not.toHaveAttribute('aria-hidden');
    expect(wrapper).toContainElement(container.querySelector('[role="status"]'));
  });

  it('treats an empty srLabel as fully decorative', () => {
    const { container } = render(<Skeleton srLabel="" />);
    expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps visual structure intact alongside the sr-only announcement', () => {
    const { container } = render(
      <Skeleton variant="card" count={3} className="extra" srLabel="Loading cards…" />
    );
    const bars = container.querySelectorAll('.bg-gray-200.rounded-lg.extra');
    expect(bars).toHaveLength(3);
    expect(container.querySelector('.sr-only')).toBeInTheDocument();
  });
});
