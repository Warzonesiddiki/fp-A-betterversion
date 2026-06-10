/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineLoader } from './InlineLoader';
import { useReducedMotion } from '@/hooks/useReducedMotion';

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('InlineLoader', () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when not loading', () => {
    render(
      <InlineLoader loading={false}>
        <div>Actual content</div>
      </InlineLoader>
    );
    expect(screen.getByText('Actual content')).toBeInTheDocument();
  });

  it('does not render children when loading', () => {
    render(
      <InlineLoader loading={true}>
        <div>Actual content</div>
      </InlineLoader>
    );
    expect(screen.queryByText('Actual content')).not.toBeInTheDocument();
  });

  it('renders spinner when variant is spinner', () => {
    const { container } = render(
      <InlineLoader loading={true} variant="spinner">
        <div>Content</div>
      </InlineLoader>
    );
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders skeleton by default', () => {
    const { container } = render(
      <InlineLoader loading={true}>
        <div>Content</div>
      </InlineLoader>
    );
    // Both InlineLoader and its inner Skeleton have role="status"
    const statusElements = container.querySelectorAll('[role="status"]');
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders children when variant is none (passthrough)', () => {
    render(
      <InlineLoader loading={true} variant="none">
        <div>Actual content</div>
      </InlineLoader>
    );
    expect(screen.getByText('Actual content')).toBeInTheDocument();
  });

  it('has aria-busy when loading with skeleton', () => {
    const { container } = render(
      <InlineLoader loading={true}>
        <div>Content</div>
      </InlineLoader>
    );
    // The outermost role="status" is from InlineLoader
    const statusElements = container.querySelectorAll('[role="status"]');
    const outerStatus = statusElements[0];
    expect(outerStatus).toHaveAttribute('aria-busy', 'true');
  });

  it('has aria-busy when loading with spinner', () => {
    const { container } = render(
      <InlineLoader loading={true} variant="spinner">
        <div>Content</div>
      </InlineLoader>
    );
    const statusElements = container.querySelectorAll('[role="status"]');
    const outerStatus = statusElements[0];
    expect(outerStatus).toHaveAttribute('aria-busy', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(
      <InlineLoader loading={true} className="my-loader">
        <div>Content</div>
      </InlineLoader>
    );
    expect(container.firstChild).toHaveClass('my-loader');
  });

  it('surfaces content after loading completes', () => {
    const { rerender } = render(
      <InlineLoader loading={true}>
        <div>Actual content</div>
      </InlineLoader>
    );
    expect(screen.queryByText('Actual content')).not.toBeInTheDocument();

    rerender(
      <InlineLoader loading={false}>
        <div>Actual content</div>
      </InlineLoader>
    );
    expect(screen.getByText('Actual content')).toBeInTheDocument();
  });

  it('has aria-label on loading container', () => {
    const { container } = render(
      <InlineLoader loading={true} label="Fetching data...">
        <div>Content</div>
      </InlineLoader>
    );
    const statusElements = container.querySelectorAll('[role="status"]');
    expect(statusElements[0]!).toHaveAttribute('aria-label', 'Fetching data...');
  });
});
