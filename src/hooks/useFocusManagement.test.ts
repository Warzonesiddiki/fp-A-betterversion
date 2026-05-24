/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useRouteFocus,
  useFocusTrap,
  useFocusRestore,
  useFocusManagement,
  useSkipToContent,
} from './useFocusManagement';

describe('useRouteFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should focus heading ref after timeout', () => {
    const focus = vi.fn();
    const ref = { current: { focus } } as unknown as React.RefObject<HTMLElement>;
    renderHook(() => useRouteFocus(ref));

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(focus).toHaveBeenCalled();
  });

  it('should not crash if ref is null', () => {
    const ref = { current: null } as unknown as React.RefObject<HTMLElement>;
    renderHook(() => useRouteFocus(ref));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    // no error
  });
});

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should add keydown listener to container', () => {
    const addEventListener = vi.fn();
    const container = {
      current: {
        addEventListener,
        removeEventListener: vi.fn(),
        querySelectorAll: vi.fn(() => []),
      },
    } as unknown as React.RefObject<HTMLElement>;

    const { unmount } = renderHook(() => useFocusTrap(container));
    expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();
  });

  it('should not crash if container ref is null', () => {
    const container = { current: null } as unknown as React.RefObject<HTMLElement>;
    renderHook(() => useFocusTrap(container));
  });
});

describe('useFocusRestore', () => {
  it('should save and restore focus', () => {
    const mockEl = document.createElement('button');
    document.body.appendChild(mockEl);
    mockEl.focus();

    const { result } = renderHook(() => useFocusRestore());
    act(() => result.current.saveFocus());

    const otherEl = document.createElement('button');
    document.body.appendChild(otherEl);
    otherEl.focus();

    act(() => result.current.restoreFocus());
    expect(document.activeElement).toBe(mockEl);

    document.body.removeChild(mockEl);
    document.body.removeChild(otherEl);
  });

  it('should handle restore when no element was saved', () => {
    const { result } = renderHook(() => useFocusRestore());
    act(() => result.current.restoreFocus());
    // no error
  });
});

describe('useFocusManagement', () => {
  it('should return mainContentRef', () => {
    const { result } = renderHook(() => useFocusManagement());
    expect(result.current.mainContentRef).toBeDefined();
    expect(result.current.mainContentRef.current).toBeNull();
  });
});

describe('useSkipToContent', () => {
  it('should return skipRef and handleSkip', () => {
    const { result } = renderHook(() => useSkipToContent());
    expect(result.current.skipRef).toBeDefined();
    expect(typeof result.current.handleSkip).toBe('function');
  });

  it('should focus main element on skip', () => {
    const main = document.createElement('main');
    document.body.appendChild(main);
    const focusSpy = vi.spyOn(main, 'focus');

    const { result } = renderHook(() => useSkipToContent());
    act(() => result.current.handleSkip());

    expect(focusSpy).toHaveBeenCalled();
    expect(main.getAttribute('tabindex')).toBe('-1');

    document.body.removeChild(main);
  });

  it('should not crash if no main element exists', () => {
    const { result } = renderHook(() => useSkipToContent());
    act(() => result.current.handleSkip());
  });
});
