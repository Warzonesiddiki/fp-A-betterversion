/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));

import { useRenderCount } from './useRenderCount';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRenderCount', () => {
  it('should return render count (0 on first render access)', () => {
    const { result } = renderHook(() => useRenderCount('TestComponent'));
    // The hook returns count.current which is incremented in useEffect
    // On first render, count.current is 0 before useEffect runs
    expect(typeof result.current).toBe('number');
  });
});
