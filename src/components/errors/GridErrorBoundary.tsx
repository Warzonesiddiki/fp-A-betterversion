import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Table } from 'lucide-react';
import { createLogger } from '@/utils/logger';

const gridErrorBoundaryLogger = createLogger('GridErrorBoundary');

interface Props {
  children: ReactNode;
  data?: unknown[];
  columns?: string[];
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GridErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    gridErrorBoundaryLogger.error('AG Grid error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { data, columns } = this.props;

      if (data && data.length > 0 && columns && columns.length > 0) {
        return (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200">
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <Table className="w-4 h-4" />
                <span>Grid crashed — showing simplified view</span>
              </div>
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs text-yellow-700 border border-yellow-300 rounded hover:bg-yellow-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry Grid
              </button>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 dark:bg-gray-900">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-medium text-[var(--text-secondary)] border-b"
                        scope="col"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b hover:bg-gray-50 dark:bg-gray-800 dark:bg-gray-900"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-3 py-1.5 text-gray-700 dark:text-gray-300 dark:text-gray-300"
                        >
                          {String((row as Record<string, unknown>)?.[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <Table className="w-8 h-8 text-yellow-500 mb-3" />
          <h3 className="text-sm font-semibold text-yellow-700 mb-1">Data Grid Error</h3>
          <p className="text-xs text-yellow-600 mb-3 text-center max-w-sm">
            The data grid encountered an error. Try reloading.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
