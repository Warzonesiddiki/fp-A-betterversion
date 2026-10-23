import React from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';
import { GridErrorBoundary } from '@/components/errors/GridErrorBoundary';
import { EngineErrorBoundary } from '@/components/errors/EngineErrorBoundary';
import { RouteGroupErrorBoundary } from '@/components/errors/RouteGroupErrorBoundary';

type Domain = 'core' | 'dataGL' | 'finops' | 'cash' | 'reports' | 'industry' | 'utility';

/**
 * HOC: wraps a component with ErrorBoundary + optional AsyncErrorBoundary.
 * Catches render-phase errors and (if async) async Suspense errors.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ErrorBoundaryProps['fallback'];
    onError?: ErrorBoundaryProps['onError'];
    useAsyncBoundary?: boolean;
    displayName?: string;
  }
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => {
    const inner = (
      <ErrorBoundary fallback={options?.fallback} onError={options?.onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
    if (options?.useAsyncBoundary) {
      return <AsyncErrorBoundary>{inner}</AsyncErrorBoundary>;
    }
    return inner;
  };
  Wrapped.displayName = `withErrorBoundary(${options?.displayName ?? Component.displayName ?? Component.name ?? 'Unknown'})`;
  return Wrapped;
}

/**
 * HOC: wraps a grid component with GridErrorBoundary for AG Grid crash recovery.
 */
export function withGridErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <GridErrorBoundary>
      <Component {...props} />
    </GridErrorBoundary>
  );
  Wrapped.displayName = `withGridErrorBoundary(${Component.displayName ?? Component.name ?? 'GridComponent'})`;
  return Wrapped;
}

/**
 * HOC: wraps an engine component with EngineErrorBoundary.
 */
export function withEngineErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  engineName?: string
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <EngineErrorBoundary engineName={engineName}>
      <Component {...props} />
    </EngineErrorBoundary>
  );
  Wrapped.displayName = `withEngineErrorBoundary(${Component.displayName ?? Component.name ?? 'EngineComponent'})`;
  return Wrapped;
}

/**
 * HOC: wraps with a domain-aware RouteGroupErrorBoundary.
 */
export function withRouteGroupErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  domain: Domain
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <RouteGroupErrorBoundary domain={domain}>
      <Component {...props} />
    </RouteGroupErrorBoundary>
  );
  Wrapped.displayName = `withRouteGroupErrorBoundary(${Component.displayName ?? Component.name ?? 'RouteComponent'})`;
  return Wrapped;
}
