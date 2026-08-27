import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react';
import { createLogger } from '@/utils/logger';

const rootErrorBoundaryLogger = createLogger('RootErrorBoundary');

export interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  error: Error | null;
  errorId: string;
  copied: boolean;
}

/**
 * Outermost crash boundary — the last line of defence above <App />.
 * Unlike the in-app boundaries (which offer "retry"), a root-level crash
 * leaves no shell to retry into, so the fallback is a standalone
 * full-screen screen with only Reload / Copy details escapes.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorId: '', copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<RootErrorBoundaryState> {
    return {
      error,
      errorId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    rootErrorBoundaryLogger.error('uncaught render crash', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleCopy = (): void => {
    const { error, errorId } = this.state;
    const details = JSON.stringify(
      {
        errorId,
        app: 'FinPlan Pro',
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        time: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      null,
      2
    );
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(details);
      this.setState({ copied: true });
    }
  };

  render(): ReactNode {
    const { error, errorId, copied } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center"
        role="alert"
      >
        <div className="mb-6 rounded-full bg-red-950/60 p-4">
          <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">FinPlan Pro</h1>
        <p className="mb-1 max-w-md text-sm leading-relaxed text-slate-400">
          Something went wrong and the app could not continue. Your data is safe on disk.
        </p>
        <p className="mb-6 max-w-md break-all font-mono text-xs text-red-400">{error.message}</p>
        <p className="mb-8 text-xs text-[var(--text-muted)]">
          Error ID:{' '}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-slate-400">
            {errorId}
          </code>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload
          </button>
          <button
            onClick={this.handleCopy}
            aria-label="Copy error details"
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 font-semibold text-slate-300 transition-colors hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? 'Copied' : 'Copy details'}
          </button>
        </div>
      </div>
    );
  }
}
