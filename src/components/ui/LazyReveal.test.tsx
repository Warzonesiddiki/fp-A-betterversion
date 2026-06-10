/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LazyReveal } from './LazyReveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Mock useReducedMotion — always returns false (no reduced motion) by default
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Track intersection callback
let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  intersectionCallback = null;
  vi.clearAllMocks();
  // Reset useReducedMotion to default (false = motion allowed)
  vi.mocked(useReducedMotion).mockReturnValue(false);

  // Define a proper constructor for IntersectionObserver
  class MockIntersectionObserver {
    constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
      intersectionCallback = callback;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  intersectionCallback = null;
});

describe('LazyReveal', () => {
  it('renders children', () => {
    render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('starts with opacity 0 via inline style', () => {
    const { container } = render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.opacity).toBe('0');
  });

  it('sets opacity 1 after intersection', () => {
    const { container } = render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );

    // Simulate intersection inside act to flush state updates
    act(() => {
      if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
      }
    });

    const el = container.firstChild as HTMLElement;
    expect(el.style.opacity).toBe('1');
  });

  it('observes the element', () => {
    render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );
    expect(mockObserve).toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LazyReveal className="my-reveal">
        <div>Content</div>
      </LazyReveal>
    );
    expect(container.firstChild).toHaveClass('my-reveal');
  });

  it('shows content immediately and does NOT observe when reduced motion', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );

    // Should immediately be visible
    const el = container.firstChild as HTMLElement;
    expect(el.style.opacity).toBe('1');
    // Should NOT create an observer
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('adds animation class when revealed with slide-up', () => {
    const { container } = render(
      <LazyReveal variant="slide-up">
        <div>Content</div>
      </LazyReveal>
    );

    act(() => {
      if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
      }
    });

    const el = container.firstChild as HTMLElement;
    expect(el.style.opacity).toBe('1');
    expect(el.classList.contains('animate-slide-up')).toBe(true);
  });

  it('adds animation class when revealed with fade-in variant', () => {
    const { container } = render(
      <LazyReveal variant="fade-in">
        <div>Content</div>
      </LazyReveal>
    );

    act(() => {
      if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
      }
    });

    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('animate-fade-in')).toBe(true);
  });

  it('has transition style when shouldAnimate', () => {
    const { container } = render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transition).toContain('opacity');
  });

  it('does NOT have transition when reduced motion', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <LazyReveal>
        <div>Content</div>
      </LazyReveal>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transition).toBe('none');
  });

  it('renders with scale-in variant', () => {
    const { container } = render(
      <LazyReveal variant="scale-in">
        <div>Content</div>
      </LazyReveal>
    );

    act(() => {
      if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
      }
    });

    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('animate-scale-in')).toBe(true);
  });
});
