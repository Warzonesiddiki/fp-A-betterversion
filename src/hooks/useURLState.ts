import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface URLStateOptions {
  prefix?: string;
  serialize?: (value: unknown) => string;
  deserialize?: (value: string) => unknown;
}

/**
 * Sync state with URL search params
 */
export function useURLState<T>(key: string, defaultValue: T, options: URLStateOptions = {}) {
  const { prefix = '', serialize = JSON.stringify, deserialize = JSON.parse } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = prefix ? `${prefix}_${key}` : key;

  const initialValue = (() => {
    const param = searchParams.get(paramKey);
    if (param === null) return defaultValue;
    try {
      return deserialize(param) as T;
    } catch {
      return defaultValue;
    }
  })();

  const [value, setValue] = useState<T>(initialValue);

  // Sync to URL when value changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === defaultValue || value === null || value === undefined) {
          next.delete(paramKey);
        } else {
          next.set(paramKey, serialize(value));
        }
        return next;
      },
      { replace: true }
    );
  }, [value, paramKey, defaultValue, serialize, setSearchParams]);

  const reset = useCallback(() => {
    setValue(defaultValue);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(paramKey);
        return next;
      },
      { replace: true }
    );
  }, [defaultValue, paramKey, setSearchParams]);

  return [value, setValue, reset] as const;
}

/**
 * Convenience hooks
 */
export function useURLString(key: string, defaultValue = '') {
  return useURLState(key, defaultValue, {
    serialize: String,
    deserialize: String,
  });
}

export function useURLNumber(key: string, defaultValue = 0) {
  return useURLState(key, defaultValue, {
    serialize: String,
    deserialize: Number,
  });
}

export function useURLBoolean(key: string, defaultValue = false) {
  return useURLState(key, defaultValue, {
    serialize: (v) => (v ? '1' : '0'),
    deserialize: (v) => v === '1',
  });
}

export function useURLArray<T>(key: string, defaultValue: T[] = [] as T[]) {
  return useURLState<T[]>(key, defaultValue, {
    serialize: (v) => (v as T[]).join(','),
    deserialize: (v) => v.split(',').filter(Boolean) as unknown as T[],
  });
}
