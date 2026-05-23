/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Rendering
  it('renders children', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('does not show tooltip content initially', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Show on hover
  it('shows tooltip after mouseEnter', () => {
    render(
      <Tooltip content="Helpful tip" delayMs={0}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Helpful tip')).toBeInTheDocument();
  });

  it('hides tooltip on mouseLeave', () => {
    render(
      <Tooltip content="Helpful tip" delayMs={0}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText('Hover me'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Delay
  it('respects delayMs before showing', () => {
    render(
      <Tooltip content="Delayed tip" delayMs={500}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));

    // Not visible before delay
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Visible after delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('cancels show if mouseLeave before delay', () => {
    render(
      <Tooltip content="Cancelled tip" delayMs={500}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    fireEvent.mouseLeave(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Disabled
  it('does not show tooltip when disabled', () => {
    render(
      <Tooltip content="Disabled tip" delayMs={0} disabled>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Focus/blur (keyboard accessibility)
  it('shows tooltip on focus', () => {
    render(
      <Tooltip content="Focus tip" delayMs={0}>
        <button>Focus me</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText('Focus me'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on blur', () => {
    render(
      <Tooltip content="Blur tip" delayMs={0}>
        <button>Focus me</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText('Focus me'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(screen.getByText('Focus me'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Positioning
  it('applies top positioning by default', () => {
    render(
      <Tooltip content="Top tip" delayMs={0}>
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('bottom-full');
  });

  it('applies bottom positioning when side is bottom', () => {
    render(
      <Tooltip content="Bottom tip" delayMs={0} side="bottom">
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('top-full');
  });

  it('applies left positioning when side is left', () => {
    render(
      <Tooltip content="Left tip" delayMs={0} side="left">
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('right-full');
  });

  it('applies right positioning when side is right', () => {
    render(
      <Tooltip content="Right tip" delayMs={0} side="right">
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('left-full');
  });

  // Custom className
  it('applies custom className to tooltip', () => {
    render(
      <Tooltip content="Styled tip" delayMs={0} className="custom-tooltip">
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toHaveClass('custom-tooltip');
  });

  // Content types
  it('renders JSX content in tooltip', () => {
    render(
      <Tooltip content={<strong>Bold tip</strong>} delayMs={0}>
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText('Bold tip')).toBeInTheDocument();
  });

  // Cleanup
  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = render(
      <Tooltip content="Tip" delayMs={500}>
        <button>Hover</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
