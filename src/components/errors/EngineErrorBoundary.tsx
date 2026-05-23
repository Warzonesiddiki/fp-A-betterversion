import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  engineName?: string;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EngineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(
      `[EngineErrorBoundary] ${this.props.engineName ?? 'Engine'} error:`,
      error,
      errorInfo
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
            {this.props.engineName ?? 'Engine'} Error
          </h3>
          <p className="text-xs fin-negative dark:text-red-400 mb-3 text-center max-w-sm">
            {this.state.error?.message ?? 'An unexpected error occurred during calculation.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Recalculate
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
