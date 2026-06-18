/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  BarChart3,
  Database,
  DollarSign,
  LineChart,
  Building2,
  Settings,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { createLogger } from '@/utils/logger';

const routeGroupErrorBoundaryLogger = createLogger('RouteGroupErrorBoundary');

/** Domain config — icon + messaging per route group */
const DOMAIN_MAP = {
  core: {
    icon: BarChart3,
    title: 'Core Module',
    desc: 'budgets, forecasts, scenarios — try reloading.',
  },
  dataGL: {
    icon: Database,
    title: 'Data & GL',
    desc: 'general ledger, imports, audit — check connection.',
  },
  finops: {
    icon: DollarSign,
    title: 'Financial Ops',
    desc: 'consolidation, revenue, lease, tax, capex.',
  },
  cash: {
    icon: Wallet,
    title: 'Cash & Treasury',
    desc: 'forecasts, debt, working capital — refresh.',
  },
  reports: {
    icon: LineChart,
    title: 'Reports',
    desc: 'PnL, balance sheet, board pack — try again.',
  },
  industry: {
    icon: Building2,
    title: 'Industry Module',
    desc: 'SaaS, manufacturing, banking, healthcare, energy.',
  },
  utility: {
    icon: Settings,
    title: 'Settings & Admin',
    desc: 'profile, settings, help — reload if issue persists.',
  },
} as const;

type Domain = keyof typeof DOMAIN_MAP;

interface Props {
  children: ReactNode;
  domain: Domain;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteGroupErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    routeGroupErrorBoundaryLogger.error(`${this.props.domain}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const domain = DOMAIN_MAP[this.props.domain];
      const Icon = domain.icon;

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-full mb-5">
            <Icon className="h-10 w-10 text-red-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold mb-1 dark:text-gray-100">{domain.title} Error</h2>
          <p className="text-sm text-[var(--text-muted)] mb-2 max-w-md">
            We couldn&apos;t load this {domain.desc}
          </p>
          {this.state.error && (
            <p className="text-xs fin-negative dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded mb-5 max-w-md truncate">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-[var(--bg-surface)] dark:border-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Domain-specific skeleton for Suspense fallback per route group */
const DOMAIN_SKELETON: Record<Domain, ReactNode> = {
  core: <PageSkeleton layout="analytics" />,
  dataGL: <PageSkeleton layout="table" />,
  finops: <PageSkeleton layout="forms" />,
  cash: <PageSkeleton layout="dashboard" />,
  reports: <PageSkeleton layout="table" />,
  industry: <PageSkeleton layout="dashboard" />,
  utility: <PageSkeleton layout="settings" />,
};

export function RouteSkeleton({ domain }: { domain: Domain }) {
  return <>{DOMAIN_SKELETON[domain]}</>;
}

function PageSkeleton({ layout }: { layout: string }) {
  return (
    <div className="p-6 space-y-6" role="status" aria-label="Loading page..." aria-busy="true">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="2rem" height="2rem" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height="1.25rem" />
          <Skeleton variant="text" width="25%" height="0.75rem" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-4">
        <Skeleton variant="text" width="6rem" height="2rem" className="rounded-md" />
        <Skeleton variant="text" width="5rem" height="2rem" className="rounded-md" />
        <Skeleton variant="text" width="7rem" height="2rem" className="rounded-md" />
      </div>

      {/* Content cards */}
      {layout === 'analytics' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton variant="card" height="8rem" />
            <Skeleton variant="card" height="8rem" />
            <Skeleton variant="card" height="8rem" />
          </div>
          <Skeleton variant="card" height="16rem" />
        </>
      )}
      {layout === 'table' && (
        <>
          <div className="flex justify-end gap-2">
            <Skeleton variant="text" width="7rem" height="2rem" className="rounded-md" />
            <Skeleton variant="text" width="8rem" height="2rem" className="rounded-md" />
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="text" height="2.5rem" />
            ))}
          </div>
        </>
      )}
      {layout === 'forms' && (
        <div className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="text" height="3rem" />
            <Skeleton variant="text" height="3rem" />
            <Skeleton variant="text" height="3rem" />
            <Skeleton variant="text" height="3rem" />
          </div>
          <Skeleton variant="card" height="10rem" />
        </div>
      )}
      {layout === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="card" height="10rem" />
            <Skeleton variant="card" height="10rem" />
          </div>
          <Skeleton variant="card" height="12rem" />
        </>
      )}
      {layout === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <Skeleton variant="card" height="6rem" />
          <Skeleton variant="card" height="8rem" />
          <Skeleton variant="card" height="4rem" />
        </div>
      )}

      <span className="sr-only">Loading page content...</span>
    </div>
  );
}
