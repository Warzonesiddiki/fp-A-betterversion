/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStagger, usePageTransition } from './useAnimation';

vi.mock('./useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from './useReducedMotion';
const mockedUseReducedMotion = vi.mocked(useReducedMotion);

describe('useStagger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return items with stagger animation styles', () => {
    mockedUseReducedMotion.mockReturnValue(false);
    const { result } = renderHook(() => useStagger(['a', 'b', 'c'], 30));
    expect(result.current).toHaveLength(3);
    expect(result!.current[0]!.item).toBe('a');
    expect(result!.current[0]!.style.animationDelay).toBe('0ms');
    expect(result!.current[1]!.style.animationDelay).toBe('30ms');
    expect(result!.current[2]!.style.animationDelay).toBe('60ms');
  });

  it('should use default delay of 20ms', () => {
    mockedUseReducedMotion.mockReturnValue(false);
    const { result } = renderHook(() => useStagger(['a', 'b']));
    expect(result!.current[1]!.style.animationDelay).toBe('20ms');
  });

  it('should return transition:none when reduced motion', () => {
    mockedUseReducedMotion.mockReturnValue(true);
    const { result } = renderHook(() => useStagger(['a', 'b']));
    expect(result!.current[0]!.style).toEqual({ transition: 'none' });
    expect(result!.current[1]!.style).toEqual({ transition: 'none' });
  });
});

describe('usePageTransition', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return transition style when no reduced motion', () => {
    mockedUseReducedMotion.mockReturnValue(false);
    const { result } = renderHook(() => usePageTransition());
    expect(result.current.style.transition).toContain('opacity');
  });

  it('should return transition:none when reduced motion', () => {
    mockedUseReducedMotion.mockReturnValue(true);
    const { result } = renderHook(() => usePageTransition());
    expect(result.current.style).toEqual({ transition: 'none' });
  });
});
