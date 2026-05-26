import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Copy, Check, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!error) return;
    const text = `${error.name}: ${error.message}\n\n${error.stack}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">{t('errors.generic')}</h2>
      <p className="text-muted-foreground mb-2 max-w-md">
        An unexpected error occurred. Your data has not been lost.
      </p>
      {error && (
        <p className="text-sm fin-negative dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded mb-4 max-w-md truncate">
          {error.message}
        </p>
      )}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--bg-surface)] dark:hover:bg-gray-800 dark:border-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </button>
        {error && (
          <button
            onClick={handleCopy}
            aria-label="Copy error details"
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--bg-surface)] dark:hover:bg-gray-800 dark:border-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Details'}
          </button>
        )}
      </div>
    </div>
  );
}
