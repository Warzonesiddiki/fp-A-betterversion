/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusRestore } from './useFocusRestore';

describe('useFocusRestore', () => {
  it('should capture focus on mount and restore on unmount', async () => {
    const buttonA = document.createElement('button');
    const buttonB = document.createElement('button');
    document.body.appendChild(buttonA);
    document.body.appendChild(buttonB);
    buttonA.focus();
    expect(document.activeElement).toBe(buttonA);

    const { unmount } = renderHook(() => useFocusRestore());

    // Move focus to buttonB (works in JSDOM unlike document.body.focus())
    buttonB.focus();
    expect(document.activeElement).toBe(buttonB);

    // Unmount triggers the cleanup → RAF → focus restore
    unmount();
    // Wait for the RAF callback to fire
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(document.activeElement).toBe(buttonA);

    document.body.removeChild(buttonA);
    document.body.removeChild(buttonB);
  });

  it('should handle unmount gracefully when no element was focused', () => {
    // No button focused before mount
    const { unmount } = renderHook(() => useFocusRestore());
    // Should not throw
    expect(() => unmount()).not.toThrow();
  });
});
