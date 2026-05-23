/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('should call handler when shortcut matches', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', ctrl: true, handler, description: 'Test' }])
    );

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when in input field', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', ctrl: true, handler, description: 'Test' }])
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('should ignore case for keys', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'K', handler, description: 'Test' }]));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
