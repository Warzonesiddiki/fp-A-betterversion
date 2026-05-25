/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('should set an error via captureError', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.captureError(new Error('test'));
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isError).toBe(true);
  });

  it('should clear the error', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.captureError(new Error('test'));
    });
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('should handle Error objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.captureError('string error');
    });
    expect(result.current.error?.message).toBe('string error');
  });
});
