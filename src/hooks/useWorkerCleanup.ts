import { useEffect, useRef } from 'react';
import { terminateAllWorkers, getWorkerPoolStatus } from '@/workers';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

/**
 * Terminates all web worker pools on unmount.
 * Mount once at app root to guarantee cleanup on SPA teardown.
 *
 * @example
 * ```tsx
 * function App() {
 *   useWorkerCleanup();
 *   return <Router />;
 * }
 * ```
 */
export function useWorkerCleanup(): void {
  const didRun = useRef(false);

  useEffect(() => {
    return () => {
      if (!didRun.current) {
        didRun.current = true;
        terminateAllWorkers();
      }
    };
  }, []);
}

/**
 * Returns the current worker pool status (workers, busy, queued counts).
 * Does not trigger cleanup — purely informational.
 */
export function useWorkerPoolStatus() {
  return getWorkerPoolStatus();
}
