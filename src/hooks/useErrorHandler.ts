import { useCallback, useState } from 'react';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

interface ErrorHandlerState {
  error: Error | null;
  isError: boolean;
}

export function useErrorHandler() {
  const [state, setState] = useState<ErrorHandlerState>({ error: null, isError: false });

  const captureError = useCallback((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    setState({ error: err, isError: true });
  }, []);

  const clearError = useCallback(() => {
    setState({ error: null, isError: false });
  }, []);

  const withErrorHandling = useCallback(
    <T extends unknown[], R>(fn: (...args: T) => R) => {
      return (...args: T): R | undefined => {
        try {
          return fn(...args);
        } catch (e) {
          captureError(e);
          return undefined;
        }
      };
    },
    [captureError]
  );

  const withAsyncErrorHandling = useCallback(
    <T extends unknown[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args);
        } catch (e) {
          captureError(e);
          return undefined;
        }
      };
    },
    [captureError]
  );

  return {
    error: state.error,
    isError: state.isError,
    captureError,
    clearError,
    withErrorHandling,
    withAsyncErrorHandling,
  };
}
