/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnounce } from './useAnnounce';

describe('useAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('[aria-live]').forEach((el) => el.remove());
  });

  it('should return an announce function', () => {
    const { result } = renderHook(() => useAnnounce());
    expect(typeof result.current).toBe('function');
  });

  it('should create an ARIA live region on first call', () => {
    const { result } = renderHook(() => useAnnounce());
    act(() => {
      result.current('Test message');
    });

    const region = document.querySelector('[aria-live]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.getAttribute('role')).toBe('status');
  });

  it('should set message after requestAnimationFrame', () => {
    const { result } = renderHook(() => useAnnounce());
    act(() => {
      result.current('Hello world');
      vi.runAllTimers();
    });

    const region = document.querySelector('[aria-live]');
    expect(region?.textContent).toBe('Hello world');
  });

  it('should support assertive politeness', () => {
    const { result } = renderHook(() => useAnnounce());
    act(() => {
      result.current('Urgent', 'assertive');
    });

    const region = document.querySelector('[aria-live]');
    expect(region?.getAttribute('aria-live')).toBe('assertive');
  });
});
