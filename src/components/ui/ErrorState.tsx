import { cn } from '@/utils/cn';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateSecondaryAction {
  label: string;
  onClick: () => void;
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: ErrorStateSecondaryAction;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  errorCode,
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4">
        <AlertTriangle className="h-12 w-12 text-[var(--danger-fill)]" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">{message}</p>
      {errorCode && (
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
          Error code: <span data-testid="error-code">{errorCode}</span>
        </p>
      )}
      {(onRetry || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--danger-fill)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--danger-fill-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="rounded-md border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
