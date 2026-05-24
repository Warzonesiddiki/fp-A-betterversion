/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion, getAnimationProps } from './useReducedMotion';

describe('useReducedMotion', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when prefers-reduced-motion is reduce', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should return false when prefers-reduced-motion is no-preference', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should update when media query changes', () => {
    let handler: ((e: MediaQueryListEvent) => void) | undefined;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
          handler = cb;
        }),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      handler?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });

  it('should clean up listener on unmount', () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener,
      })),
    });

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});

describe('getAnimationProps', () => {
  it('should return inactive props when reduced is true', () => {
    const props = getAnimationProps(true);
    expect(props.isAnimationActive).toBe(false);
    expect(props.animationDuration).toBe(0);
  });

  it('should return active props when reduced is false', () => {
    const props = getAnimationProps(false);
    expect(props.isAnimationActive).toBe(true);
    expect(props.animationDuration).toBe(800);
  });
});
