import { useCallback, useRef, useState } from 'react';

/**
 * Type for optimistic update actions.
 * TData is the actual data type.
 * TOptimistic is the optimistic (client-side) data shape.
 */
export interface UseOptimisticOptions<TData, TOptimistic> {
  /** Current server data */
  currentData: TData;
  /** Function to produce optimistic state */
  optimisticFn: (current: TData, ...args: unknown[]) => TOptimistic;
  /** Async function that performs the actual mutation */
  mutateFn: (...args: unknown[]) => Promise<void>;
  /** Callback on successful mutation */
  onSuccess?: (result: unknown) => void;
  /** Callback on mutation error */
  onError?: (error: Error) => void;
}

export interface UseOptimisticReturn<TData, TOptimistic> {
  /** Current display data (optimistic while pending, real otherwise) */
  data: TData | TOptimistic;
  /** Whether a mutation is in flight */
  isPending: boolean;
  /** Trigger an optimistic update */
  mutate: (...args: unknown[]) => void;
  /** Error from last mutation (if any) */
  error: Error | null;
  /** Reset error state */
  resetError: () => void;
}

/**
 * Hook for optimistic UI updates.
 * Immediately reflects the expected result of a mutation in the UI
 * while the actual mutation runs in the background. Reverts on error.
 *
 * @example
 * const { data: users, isPending, mutate } = useOptimistic({
 *   currentData: usersList,
 *   optimisticFn: (users, userId) => users.filter(u => u.id !== userId),
 *   mutateFn: (userId) => api.deleteUser(userId),
 * });
 */
export function useOptimistic<TData, TOptimistic = TData>(
  options: UseOptimisticOptions<TData, TOptimistic>
): UseOptimisticReturn<TData, TOptimistic> {
  const { currentData, optimisticFn, mutateFn, onSuccess, onError } = options;

  const [optimisticData, setOptimisticData] = useState<TData | TOptimistic | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastArgsRef = useRef<unknown[]>([]);

  const data = optimisticData !== null ? optimisticData : currentData;

  const mutate = useCallback(
    async (...args: unknown[]) => {
      lastArgsRef.current = args;
      setIsPending(true);
      setError(null);

      // Apply optimistic update immediately
      setOptimisticData(optimisticFn(currentData, ...args));

      try {
        const result = await mutateFn(...args);
        // On success, clear optimistic — the parent will pass updated currentData
        setOptimisticData(null);
        onSuccess?.(result);
      } catch (err) {
        // Revert on error
        setOptimisticData(null);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsPending(false);
      }
    },
    [currentData, optimisticFn, mutateFn, onSuccess, onError]
  );

  const resetError = useCallback(() => setError(null), []);

  return { data, isPending, mutate, error, resetError };
}
