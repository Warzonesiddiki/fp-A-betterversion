/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusRestore } from './useFocusRestore';

describe('useFocusRestore', () => {
  it('should save and restore focus', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const { result } = renderHook(() => useFocusRestore());
    result.current.saveFocus();
    document.body.focus();

    act(() => {
      result.current.restoreFocus();
    });
    expect(document.activeElement).toBe(button);
    document.body.removeChild(button);
  });

  it('should handle restore when no element was saved', () => {
    const { result } = renderHook(() => useFocusRestore());
    // Should not throw
    act(() => {
      result.current.restoreFocus();
    });
  });
});
