import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Copy, ChevronDown, ChevronRight, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: Date.now().toString(36),
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorId: Date.now().toString(36) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) this.props.onError(error, errorInfo);
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  copyDetails = () => {
    const { error, errorId } = this.state;
    const details = JSON.stringify(
      {
        errorId,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        time: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(details);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center dark:bg-gray-950" role="alert">
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-full mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2 dark:text-gray-100">We&apos;ve encountered an unexpected error</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-2 max-w-md leading-relaxed">
            Don&apos;t worry, your data is safe. Try refreshing, or go back to the dashboard.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-600 mb-6">
            Error ID:{' '}
            <code className="font-mono bg-slate-800 dark:bg-slate-900 px-1.5 py-0.5 rounded">
              {this.state.errorId}
            </code>
          </p>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
            >
              Reload Page
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              aria-label="Go to home page"
              className="px-5 py-2.5 border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
            >
              <Home className="h-4 w-4" />
            </button>
          </div>
          {this.state.error && (
            <div className="w-full max-w-xl">
              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-300 dark:hover:text-slate-200 mx-auto mb-2 focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {this.state.showDetails ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {this.state.showDetails ? 'Hide' : 'Show'} technical details
              </button>
              {this.state.showDetails && (
                <div className="p-4 bg-slate-900 rounded-lg text-left overflow-auto border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-400">Error Details</span>
                    <button
                      onClick={this.copyDetails}
                      aria-label="Copy error details"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.error.stack && (
                    <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap break-all mt-2 pt-2 border-t border-slate-800 max-h-48 overflow-y-auto">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
