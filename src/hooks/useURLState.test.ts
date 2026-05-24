/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useURLState, useURLString, useURLNumber, useURLBoolean, useURLArray } from './useURLState';

let searchParams = new URLSearchParams();
const setSearchParams = vi.fn((updater: any) => {
  searchParams = typeof updater === 'function' ? updater(searchParams) : updater;
});

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParams, setSearchParams],
}));

describe('useURLState', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    vi.resetAllMocks();
  });

  it('should return default value when no URL param', () => {
    const { result } = renderHook(() => useURLState('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should read initial value from URL param', () => {
    searchParams = new URLSearchParams({ key: '"hello"' });
    const { result } = renderHook(() => useURLState<string>('key', 'default'));
    expect(result.current[0]).toBe('hello');
  });

  it('should fallback to default on invalid JSON', () => {
    searchParams = new URLSearchParams({ key: 'not-json' });
    const { result } = renderHook(() => useURLState<string>('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should support prefix option', () => {
    searchParams = new URLSearchParams({ myPrefix_key: '"value"' });
    const { result } = renderHook(() => useURLState<string>('key', '', { prefix: 'myPrefix' }));
    expect(result.current[0]).toBe('value');
  });

  it('should support custom serialize/deserialize', () => {
    const serialize = (v: unknown) => String(v);
    const deserialize = (v: string) => Number(v);
    searchParams = new URLSearchParams({ num: '42' });
    const { result } = renderHook(() => useURLState<number>('num', 0, { serialize, deserialize }));
    expect(result.current[0]).toBe(42);
  });
});

describe('useURLString', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it('should default to empty string', () => {
    const { result } = renderHook(() => useURLString('name'));
    expect(result.current[0]).toBe('');
  });

  it('should use provided default', () => {
    const { result } = renderHook(() => useURLString('name', 'foo'));
    expect(result.current[0]).toBe('foo');
  });
});

describe('useURLNumber', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it('should default to 0', () => {
    const { result } = renderHook(() => useURLNumber('page'));
    expect(result.current[0]).toBe(0);
  });

  it('should read number from URL', () => {
    searchParams = new URLSearchParams({ page: '5' });
    const { result } = renderHook(() => useURLNumber('page'));
    expect(result.current[0]).toBe(5);
  });
});

describe('useURLBoolean', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it('should default to false', () => {
    const { result } = renderHook(() => useURLBoolean('active'));
    expect(result.current[0]).toBe(false);
  });

  it('should read true from URL as "1"', () => {
    searchParams = new URLSearchParams({ active: '1' });
    const { result } = renderHook(() => useURLBoolean('active'));
    expect(result.current[0]).toBe(true);
  });

  it('should read false from URL as "0"', () => {
    searchParams = new URLSearchParams({ active: '0' });
    const { result } = renderHook(() => useURLBoolean('active'));
    expect(result.current[0]).toBe(false);
  });
});

describe('useURLArray', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it('should default to empty array', () => {
    const { result } = renderHook(() => useURLArray<string>('tags'));
    expect(result.current[0]).toEqual([]);
  });

  it('should read comma-separated values from URL', () => {
    searchParams = new URLSearchParams({ tags: 'a,b,c' });
    const { result } = renderHook(() => useURLArray<string>('tags'));
    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });
});
