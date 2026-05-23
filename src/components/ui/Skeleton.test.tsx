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
