import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shallow equality check for store selectors
 * Prevents unnecessary re-renders when selecting objects
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Stable selector factory for Zustand stores
 * Returns a memoized selector that uses shallow equality
 */
export function createSelector<T, R>(
  selector: (state: T) => R,
  isEqual: (a: R, b: R) => boolean = shallowEqual as (a: R, b: R) => boolean
): (state: T) => R {
  let lastResult: R;
  let lastState: T;

  return (state: T): R => {
    if (state === lastState) return lastResult;
    const result = selector(state);
    if (isEqual(result, lastResult)) {
      lastState = state;
      return lastResult;
    }
    lastState = state;
    lastResult = result;
    return result;
  };
}

/**
 * Debounced value hook
 * Returns a value that only updates after `delay` ms of no changes
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 * Ensures callback is called at most once per `delay` ms
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return useCallback(
    (...args: unknown[]) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        fn(...args);
      } else {
        clearTimeout(lastCallTimer.current);
        lastCallTimer.current = setTimeout(
          () => {
            lastCall.current = Date.now();
            fn(...args);
          },
          delay - (now - lastCall.current)
        );
      }
    },
    [fn, delay, lastCall, lastCallTimer]
  ) as unknown as T;
}

/**
 * Memoized computation hook
 * Only recomputes when dependencies change
 */
export function useMemoizedComputation<T>(
  compute: () => T,
  deps: unknown[],
  isEqual: (a: T, b: T) => boolean = shallowEqual as (a: T, b: T) => boolean
): T {
  const ref = useRef<{ deps: unknown[]; value: T } | null>(null);

  // eslint-disable-next-line react-hooks/refs
  if (!ref.current || !deps.every((dep, i) => dep === ref.current!.deps[i])) {
    const newValue = compute();
    // eslint-disable-next-line react-hooks/refs
    if (!ref.current || !isEqual(ref.current.value, newValue)) {
      ref.current = { deps, value: newValue };
    } else {
      // eslint-disable-next-line react-hooks/refs
      ref.current.deps = deps;
    }
  }

  // eslint-disable-next-line react-hooks/refs
  return ref.current.value;
}
