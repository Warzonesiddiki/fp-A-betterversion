import { Component, ErrorInfo, ReactNode } from 'react';
import { Puzzle, RefreshCw, X } from 'lucide-react';
import { createLogger } from '@/utils/logger';

const pluginErrorBoundaryLogger = createLogger('PluginErrorBoundary');

interface Props {
  children: ReactNode;
  pluginName?: string;
  onDisable?: () => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PluginErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    pluginErrorBoundaryLogger.error(`${this.props.pluginName ?? 'Plugin'} error`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  handleDisable = (): void => {
    this.props.onDisable?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950 dark:border-orange-800"
          role="region"
          aria-label="PluginErrorBoundary"
        >
          <Puzzle className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">
            Plugin Error: {this.props.pluginName ?? 'Unknown'}
          </h3>
          <p className="text-xs text-orange-600 dark:text-orange-400 mb-3 text-center max-w-xs">
            {this.state.error?.message ?? 'A plugin encountered an error.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs text-orange-700 border border-orange-300 rounded hover:bg-orange-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button
              onClick={this.handleDisable}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 border border-red-300 rounded hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <X className="w-3 h-3" /> Disable
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
