import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: vi.fn(() => ({
    ref: { current: null },
    isVisible: false,
  })),
}));

import { LazyChart } from '@/components/ui/LazyChart';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

const mockUseIntersectionObserver = vi.mocked(useIntersectionObserver);

describe('LazyChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIntersectionObserver.mockReturnValue({ ref: { current: null }, isVisible: false });
  });

  it('renders without crashing', () => {
    const { container } = render(
      <LazyChart>
        <div>Chart content</div>
      </LazyChart>
    );
    expect(container).toBeTruthy();
  });

  it('shows loading skeleton when not visible', () => {
    render(
      <LazyChart>
        <div>Chart content</div>
      </LazyChart>
    );
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('shows children when visible', () => {
    mockUseIntersectionObserver.mockReturnValue({ ref: { current: null }, isVisible: true });
    render(
      <LazyChart>
        <div>Chart content</div>
      </LazyChart>
    );
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('shows custom skeleton when provided and not visible', () => {
    render(
      <LazyChart skeleton={<div>Custom skeleton</div>}>
        <div>Chart content</div>
      </LazyChart>
    );
    expect(screen.getByText('Custom skeleton')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LazyChart className="custom-class">
        <div>Chart content</div>
      </LazyChart>
    );
    expect((container.firstChild as HTMLElement).className).toContain('custom-class');
  });

  it('applies custom height', () => {
    const { container } = render(
      <LazyChart height={500}>
        <div>Chart content</div>
      </LazyChart>
    );
    expect((container.firstChild as HTMLElement).style.minHeight).toBe('500px');
  });
});
