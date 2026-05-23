import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      fallback={
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
          role="alert"
        >
          <h2 className="text-2xl font-bold mb-2">Page Error</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            This page encountered an error. Navigate back or return to the dashboard.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" /> Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Home className="h-4 w-4" /> Dashboard
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
