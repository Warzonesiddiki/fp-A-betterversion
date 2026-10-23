import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';

interface SafeSuspenseProps {
  children: ReactNode;
  fallback: ReactNode;
  /** Optional custom error fallback for the ErrorBoundary layer */
  errorFallback?: ReactNode;
  /** Called when ErrorBoundary catches an error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * SafeSuspense chains three layers:
 *   1. ErrorBoundary      – catches render-phase errors
 *   2. AsyncErrorBoundary – catches async/throw-in-Suspense errors
 *   3. Suspense            – shows fallback while lazy children load
 *
 * Every error is announced with role="alert" + aria-live="assertive"
 * via the underlying ErrorBoundary / ErrorFallback components.
 */
export function SafeSuspense({ children, fallback, errorFallback, onError }: SafeSuspenseProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <AsyncErrorBoundary>
        <Suspense fallback={fallback}>{children}</Suspense>
      </AsyncErrorBoundary>
    </ErrorBoundary>
  );
}
